import { format, addHours, differenceInHours, isWeekend, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Guardia,
  Profesional,
  CategoriaProfesional,
  TipoGuardia,
  TipoDia,
  Nomina,
  NominaLinea,
  AjusteBaremo
} from '@/types/guardias';

// Utilidades para fechas y cálculos
export const calcularHorasGuardia = (fechaInicio: Date, fechaFin: Date): number => {
  return differenceInHours(fechaFin, fechaInicio);
};

export const determinarTipoDia = (fecha: Date): TipoDia => {
  // Lista de días festivos en Guinea Ecuatorial (simplificada)
  const festivosGQ = [
    '01-01', // Año Nuevo
    '05-01', // Día del Trabajador
    '05-25', // Día de África
    '06-05', // Día del Presidente
    '08-03', // Día de la Libertad
    '10-12', // Día de la Independencia
    '12-25', // Navidad
  ];
  
  const fechaStr = format(fecha, 'MM-dd');
  if (festivosGQ.includes(fechaStr)) {
    return 'festivo';
  }
  
  if (isWeekend(fecha)) {
    return 'fin_semana';
  }
  
  return 'ordinario';
};

export const validarDuracionGuardia = (fechaInicio: Date, fechaFin: Date): { 
  valida: boolean; 
  mensaje?: string; 
  horas: number; 
} => {
  const horas = calcularHorasGuardia(fechaInicio, fechaFin);
  
  if (horas < 12) {
    return { 
      valida: false, 
      mensaje: 'La duración mínima de una guardia es de 12 horas', 
      horas 
    };
  }
  
  if (horas > 24) {
    return { 
      valida: false, 
      mensaje: 'La duración máxima de una guardia es de 24 horas', 
      horas 
    };
  }
  
  return { valida: true, horas };
};

export const calcularBaremoGuardia = (
  categoria: CategoriaProfesional,
  tipo: TipoGuardia,
  tipoDia: TipoDia,
  baremos: AjusteBaremo[],
  fuenteActiva: 'protocol' | 'excel' | 'manual' = 'protocol'
): number => {
  const baremo = baremos.find(b =>
    b.categoria === categoria &&
    b.tipoGuardia === tipo &&
    b.tipoDia === tipoDia &&
    b.fuente === fuenteActiva &&
    b.activo
  );
  
  return baremo?.valor || 0;
};

export const calcularPagoLocalizable = (
  montoBase: number,
  programada: boolean = false,
  llamadaAsistida: boolean = false
): {
  condicion: number;
  llamada: number;
  total: number;
} => {
  const condicion = programada ? montoBase * 0.10 : 0; // 10% por condición localizable
  const llamada = llamadaAsistida ? montoBase * 0.20 : 0; // 20% adicional por llamada asistida
  const total = montoBase + condicion + llamada;
  
  return { condicion, llamada, total };
};

export const validarLimitesGuardiasMes = (
  profesionalId: string,
  mes: number,
  anio: number,
  guardias: Guardia[],
  limitesConfig: { minimo: number; maximo: number }
): {
  valido: boolean;
  mensaje?: string;
  conteoActual: number;
} => {
  const guardiasDelMes = guardias.filter(g => {
    const fecha = new Date(g.fechaInicio);
    return g.profesionalId === profesionalId &&
           fecha.getMonth() + 1 === mes &&
           fecha.getFullYear() === anio;
  });
  
  const conteoActual = guardiasDelMes.length;
  
  if (conteoActual < limitesConfig.minimo) {
    return {
      valido: false,
      mensaje: `Mínimo ${limitesConfig.minimo} guardias por mes. Actual: ${conteoActual}`,
      conteoActual
    };
  }
  
  if (conteoActual > limitesConfig.maximo) {
    return {
      valido: false,
      mensaje: `Máximo ${limitesConfig.maximo} guardias por mes. Actual: ${conteoActual}`,
      conteoActual
    };
  }
  
  return {
    valido: true,
    conteoActual
  };
};

// Utilidades para etiquetas y formateo
export const formatearCategoriaProfesional = (categoria: CategoriaProfesional): string => {
  const labels: Record<CategoriaProfesional, string> = {
    especialista: 'Médicos Especialistas',
    general_licenciado: 'Médicos Generales y Licenciados',
    tecnico_diplomado: 'Técnicos y Diplomados',
    auxiliar: 'Auxiliares',
    subalterno: 'Subalternos',
    odepac: 'ODEPAC',
    secre_asist_pacientes: 'Secretaría Asist. Pacientes',
    caja: 'Personal Caja'
  };
  return labels[categoria];
};

export const formatearTipoGuardia = (tipo: TipoGuardia): string => {
  const labels: Record<TipoGuardia, string> = {
    fisica: 'Física',
    localizable: 'Localizable',
    administrativa: 'Administrativa/Dirección'
  };
  return labels[tipo];
};

export const formatearTipoDia = (tipoDia: TipoDia): string => {
  const labels: Record<TipoDia, string> = {
    ordinario: 'Ordinario',
    fin_semana: 'Fin de Semana',
    festivo: 'Festivo'
  };
  return labels[tipoDia];
};

export const formatearMoneda = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatearFecha = (fecha: Date): string => {
  return format(fecha, 'dd/MM/yyyy HH:mm', { locale: es });
};

export const formatearFechaCorta = (fecha: Date): string => {
  return format(fecha, 'dd/MM/yyyy', { locale: es });
};

// Funciones para exportación

export const generarPDFNomina = async (
  nomina: Nomina,
  lineas: NominaLinea[],
  profesionales: Profesional[]
): Promise<void> => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text('NÓMINA DE GUARDIAS MÉDICAS', 20, 20);
  
  // Información de la nómina
  doc.setFontSize(12);
  doc.text(`Mes: ${nomina.mes}/${nomina.anio}`, 20, 35);
  doc.text(`Hospital: ${nomina.hospitalId}`, 20, 45);
  doc.text(`Fecha Generación: ${formatearFechaCorta(nomina.fechaCreacion)}`, 20, 55);
  doc.text(`Estado: ${nomina.estado}`, 20, 65);
  
  // Tabla de líneas
  const tableData = lineas.map(linea => {
    const profesional = profesionales.find(p => p.id === linea.profesionalId);
    return [
      profesional?.nombre || 'N/A',
      formatearCategoriaProfesional(linea.categoria),
      linea.conteo.ordinarias.toString(),
      linea.conteo.fines.toString(),
      linea.conteo.festivos.toString(),
      linea.localizable.programadas.toString(),
      linea.localizable.llamadas.toString(),
      formatearMoneda(linea.costeUnitario),
      formatearMoneda(linea.totalLinea)
    ];
  });
  
  (doc as any).autoTable({
    head: [[
      'Profesional',
      'Categoría',
      'Ordinarias',
      'Fines Sem.',
      'Festivos',
      'Loc. Prog.',
      'Loc. Llam.',
      'Coste Unit.',
      'Total'
    ]],
    body: tableData,
    startY: 80,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50] },
    styles: { fontSize: 8 }
  });
  
  // Total general
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text(`TOTAL GENERAL: ${formatearMoneda(nomina.totalGeneral)}`, 20, finalY);
  
  // Descargar
  doc.save(`nomina_${nomina.mes}_${nomina.anio}.pdf`);
};

export const generarExcelNomina = (
  nomina: Nomina,
  lineas: NominaLinea[],
  profesionales: Profesional[]
): void => {
  const workbook = XLSX.utils.book_new();
  
  // Hoja de resumen
  const resumenData = [
    ['NÓMINA DE GUARDIAS MÉDICAS'],
    [''],
    ['Mes', `${nomina.mes}/${nomina.anio}`],
    ['Hospital', nomina.hospitalId],
    ['Fecha Generación', formatearFechaCorta(nomina.fechaCreacion)],
    ['Estado', nomina.estado],
    [''],
    ['TOTALES POR CATEGORÍA'],
    ...Object.entries(nomina.totalesPorCategoria).map(([cat, total]) => [
      formatearCategoriaProfesional(cat as CategoriaProfesional),
      formatearMoneda(total)
    ]),
    [''],
    ['TOTALES POR TIPO'],
    ...Object.entries(nomina.totalesPorTipo).map(([tipo, total]) => [
      formatearTipoGuardia(tipo as TipoGuardia),
      formatearMoneda(total)
    ]),
    [''],
    ['TOTAL GENERAL', formatearMoneda(nomina.totalGeneral)]
  ];
  
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');
  
  // Hoja de detalle
  const detalleData = [
    [
      'Profesional',
      'Categoría',
      'Ordinarias',
      'Fines Semana',
      'Festivos',
      'Loc. Programadas',
      'Loc. Llamadas',
      'Coste Unitario',
      'Total Línea'
    ],
    ...lineas.map(linea => {
      const profesional = profesionales.find(p => p.id === linea.profesionalId);
      return [
        profesional?.nombre || 'N/A',
        formatearCategoriaProfesional(linea.categoria),
        linea.conteo.ordinarias,
        linea.conteo.fines,
        linea.conteo.festivos,
        linea.localizable.programadas,
        linea.localizable.llamadas,
        linea.costeUnitario,
        linea.totalLinea
      ];
    })
  ];
  
  const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle');
  
  // Descargar
  XLSX.writeFile(workbook, `nomina_${nomina.mes}_${nomina.anio}.xlsx`);
};

export const generarPDFCuadrante = (
  guardias: Guardia[],
  profesionales: Profesional[],
  mes: number,
  anio: number
): void => {
  const doc = new jsPDF('landscape');
  
  // Título
  doc.setFontSize(16);
  doc.text(`CUADRANTE DE GUARDIAS - ${mes}/${anio}`, 20, 20);
  
  // Preparar datos por día
  const diasMes = new Date(anio, mes, 0).getDate();
  const guardiasAgrupadas: Record<string, Guardia[]> = {};
  
  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = new Date(anio, mes - 1, dia);
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    guardiasAgrupadas[fechaStr] = guardias.filter(g => 
      isSameDay(new Date(g.fechaInicio), fecha)
    );
  }
  
  // Generar tabla de cuadrante
  const tableData = Object.entries(guardiasAgrupadas).map(([fecha, guardiasDelDia]) => {
    const fechaObj = new Date(fecha);
    const profesionalesDelDia = guardiasDelDia.map(g => {
      const prof = profesionales.find(p => p.id === g.profesionalId);
      return `${prof?.nombre || 'N/A'} (${formatearTipoGuardia(g.tipo)})`;
    }).join(', ');
    
    return [
      format(fechaObj, 'dd/MM/yyyy'),
      format(fechaObj, 'EEEE', { locale: es }),
      formatearTipoDia(determinarTipoDia(fechaObj)),
      guardiasDelDia.length.toString(),
      profesionalesDelDia || 'Sin guardias'
    ];
  });
  
  (doc as any).autoTable({
    head: [['Fecha', 'Día', 'Tipo', 'Nº Guardias', 'Profesionales']],
    body: tableData,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50] },
    styles: { fontSize: 8 }
  });
  
  doc.save(`cuadrante_${mes}_${anio}.pdf`);
};

// Utilidades para validación de roles y permisos
export const puedeValidarEtapa = (userRole: string, etapa: string): boolean => {
  const permisos: Record<string, string[]> = {
    admin: ['dir_medica', 'dir_admin', 'dir_enfermeria', 'jefe_rrhh', 'admin_hospital', 'dir_gerente', 'dg_coordinacion'],
    dir_medica: ['dir_medica'],
    dir_admin: ['dir_admin'],
    dir_enfermeria: ['dir_enfermeria'],
    rrhh: ['jefe_rrhh'],
    admin_hospital: ['admin_hospital'],
    dir_gerente: ['dir_gerente'],
    dg: ['dg_coordinacion']
  };
  
  return permisos[userRole]?.includes(etapa) || false;
};

export const obtenerSiguienteEtapaValidacion = (etapaActual: string): string | null => {
  const secuencia = [
    'dir_medica',
    'dir_admin',
    'dir_enfermeria',
    'jefe_rrhh',
    'admin_hospital',
    'dir_gerente',
    'dg_coordinacion'
  ];
  
  const indiceActual = secuencia.indexOf(etapaActual);
  if (indiceActual >= 0 && indiceActual < secuencia.length - 1) {
    return secuencia[indiceActual + 1];
  }
  
  return null; // Ya es la última etapa
};

// Utilidades para generación de IDs únicos
export const generarIdGuardia = (): string => {
  return `GRD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

export const generarIdNomina = (mes: number, anio: number, hospitalId: string): string => {
  return `NOM${anio}${mes.toString().padStart(2, '0')}${hospitalId}${Date.now()}`;
};
