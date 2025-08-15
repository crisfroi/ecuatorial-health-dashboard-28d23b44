// Tipos y interfaces para el módulo de Guardias Médicas

export type CategoriaProfesional = 
  | 'especialista'
  | 'general_licenciado'
  | 'tecnico_diplomado'
  | 'auxiliar'
  | 'subalterno'
  | 'odepac'
  | 'secre_asist_pacientes'
  | 'caja';

export type TipoGuardia = 'fisica' | 'localizable' | 'administrativa';

export type TipoDia = 'ordinario' | 'fin_semana' | 'festivo';

export type EstadoGuardia = 'borrador' | 'planificada' | 'realizada' | 'no_presentado';

export type EstadoValidacion = 'pendiente' | 'validada' | 'rechazada';

export type EtapaValidacion = 
  | 'dir_medica'
  | 'dir_admin'
  | 'dir_enfermeria'
  | 'jefe_rrhh'
  | 'admin_hospital'
  | 'dir_gerente'
  | 'dg_coordinacion';

export type RolUsuario = 
  | 'admin'
  | 'validador'
  | 'visualizador'
  | 'rrhh'
  | 'dir_medica'
  | 'dir_admin'
  | 'dir_enfermeria'
  | 'dir_gerente'
  | 'dg';

export type FormaPago = 'transfer_trabajador' | 'transfer_hospital' | 'otro';

export type FuenteBaremo = 'protocol' | 'excel' | 'manual';

export interface Profesional {
  id: string;
  nombre: string;
  categoria: CategoriaProfesional;
  unidad_servicio: string;
  banco?: string;
  iban_cuenta?: string;
  activo: boolean;
  telefono?: string;
  email?: string;
}

export interface Guardia {
  id: string;
  profesionalId: string;
  tipo: TipoGuardia;
  fechaInicio: Date;
  fechaFin: Date;
  horas: number; // calculada automáticamente
  tipoDia: TipoDia;
  estado: EstadoGuardia;
  validacionEstado: EstadoValidacion;
  observaciones?: string;
  // Para guardias localizables
  localizableActivada?: boolean;
  horaLlamada?: Date;
  horaLlegada?: Date;
  servicioAtendido?: string;
  casoAtendido?: string;
}

export interface Validacion {
  id: string;
  guardiaId: string;
  etapa: EtapaValidacion;
  usuarioId: string;
  fecha: Date;
  resultado: 'aprobada' | 'rechazada';
  comentario?: string;
  firma?: string; // hash o imagen
}

export interface Nomina {
  id: string;
  mes: number;
  anio: number;
  hospitalId: string;
  estado: 'pendiente' | 'enviada_seaf' | 'aprobada' | 'pagada';
  totalesPorCategoria: Record<CategoriaProfesional, number>;
  totalesPorTipo: Record<TipoGuardia, number>;
  totalGeneral: number;
  archivoPdf?: string;
  archivoXlsx?: string;
  fechaCreacion: Date;
}

export interface NominaLinea {
  id: string;
  nominaId: string;
  profesionalId: string;
  categoria: CategoriaProfesional;
  conteo: {
    ordinarias: number;
    fines: number;
    festivos: number;
  };
  localizable: {
    programadas: number;
    llamadas: number;
  };
  costeUnitario: number;
  totalLinea: number;
}

export interface Pago {
  id: string;
  nominaId: string;
  profesionalId: string;
  formaPago: FormaPago;
  fecha?: Date;
  comprobanteUrl?: string;
  observacion?: string;
  monto: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  firmaDigital?: string;
  activo: boolean;
}

export interface Bitacora {
  id: string;
  ref: 'guardia' | 'nomina' | 'pago';
  refId: string;
  usuarioId: string;
  accion: string;
  fecha: Date;
  detalle?: string;
}

export interface AjusteBaremo {
  id: string;
  fuente: FuenteBaremo;
  categoria: CategoriaProfesional;
  tipoGuardia: TipoGuardia;
  tipoDia: TipoDia;
  valor: number;
  porcentajeLocalizable?: {
    condicion: number;
    llamada: number;
  };
  vigenteDesde: Date;
  vigenteHasta?: Date;
  activo: boolean;
}

// Interfaces para reportes y estadísticas
export interface EstadisticasGuardias {
  totalGuardias: number;
  guardiasValidas: number;
  guardiasPendientes: number;
  costoTotal: number;
  porCategoria: Record<CategoriaProfesional, {
    cantidad: number;
    costo: number;
  }>;
  porTipo: Record<TipoGuardia, {
    cantidad: number;
    costo: number;
  }>;
}

export interface ConfiguracionSistema {
  fuenteBaremo: FuenteBaremo;
  limitesGuardias: {
    minimo: number;
    maximo: number;
  };
  duracionMinima: number; // horas
  duracionMaxima: number; // horas
  notificacionesActivas: boolean;
}
