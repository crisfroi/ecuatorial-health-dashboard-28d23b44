import { z } from 'zod';

// Enums para validación
export const categoriaProfesionalSchema = z.enum([
  'especialista',
  'general_licenciado',
  'tecnico_diplomado',
  'auxiliar',
  'subalterno',
  'odepac',
  'secre_asist_pacientes',
  'caja'
]);

export const tipoGuardiaSchema = z.enum(['fisica', 'localizable', 'administrativa']);

export const tipoDiaSchema = z.enum(['ordinario', 'fin_semana', 'festivo']);

export const estadoGuardiaSchema = z.enum(['borrador', 'planificada', 'realizada', 'no_presentado']);

export const estadoValidacionSchema = z.enum(['pendiente', 'validada', 'rechazada']);

export const etapaValidacionSchema = z.enum([
  'dir_medica',
  'dir_admin',
  'dir_enfermeria',
  'jefe_rrhh',
  'admin_hospital',
  'dir_gerente',
  'dg_coordinacion'
]);

export const formaPagoSchema = z.enum(['transfer_trabajador', 'transfer_hospital', 'otro']);

export const fuenteBaremoSchema = z.enum(['protocol', 'excel', 'manual']);

// Schema para Profesional
export const profesionalSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  categoria: categoriaProfesionalSchema,
  unidad_servicio: z.string()
    .min(2, 'La unidad/servicio debe tener al menos 2 caracteres')
    .max(100, 'La unidad/servicio no puede exceder 100 caracteres'),
  banco: z.string().optional(),
  iban_cuenta: z.string()
    .regex(/^GQ\d{2}\d{4}\d{4}\d{10}$/, 'Formato IBAN inválido para Guinea Ecuatorial')
    .optional(),
  activo: z.boolean().default(true),
  telefono: z.string()
    .regex(/^\+240\s?\d{3}\s?\d{3}\s?\d{3}$/, 'Formato de teléfono inválido (+240 XXX XXX XXX)')
    .optional(),
  email: z.string().email('Email inválido').optional()
});

// Schema para Guardia
export const guardiaSchema = z.object({
  profesionalId: z.string().min(1, 'Debe seleccionar un profesional'),
  tipo: tipoGuardiaSchema,
  fechaInicio: z.date({
    required_error: 'La fecha de inicio es obligatoria',
    invalid_type_error: 'Fecha de inicio inválida'
  }),
  fechaFin: z.date({
    required_error: 'La fecha de fin es obligatoria',
    invalid_type_error: 'Fecha de fin inválida'
  }),
  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
  // Campos para guardia localizable
  localizableActivada: z.boolean().optional(),
  horaLlamada: z.date().optional(),
  horaLlegada: z.date().optional(),
  servicioAtendido: z.string().max(100).optional(),
  casoAtendido: z.string().max(200).optional()
}).refine((data) => {
  // Validar que la fecha de fin sea posterior a la de inicio
  return data.fechaFin > data.fechaInicio;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin']
}).refine((data) => {
  // Validar duración mínima y máxima
  const horas = (data.fechaFin.getTime() - data.fechaInicio.getTime()) / (1000 * 60 * 60);
  return horas >= 12 && horas <= 24;
}, {
  message: 'La duración de la guardia debe estar entre 12 y 24 horas',
  path: ['fechaFin']
}).refine((data) => {
  // Validar campos de localizable si está activada
  if (data.localizableActivada && data.tipo === 'localizable') {
    return data.horaLlamada && data.horaLlegada && data.servicioAtendido;
  }
  return true;
}, {
  message: 'Para guardia localizable activada son obligatorios: hora llamada, hora llegada y servicio',
  path: ['localizableActivada']
});

// Schema para Validación
export const validacionSchema = z.object({
  guardiaId: z.string().min(1, 'ID de guardia es obligatorio'),
  etapa: etapaValidacionSchema,
  resultado: z.enum(['aprobada', 'rechazada']),
  comentario: z.string()
    .max(500, 'El comentario no puede exceder 500 caracteres')
    .optional(),
  firma: z.string().optional()
});

// Schema para Nómina
export const nominaSchema = z.object({
  mes: z.number()
    .min(1, 'El mes debe estar entre 1 y 12')
    .max(12, 'El mes debe estar entre 1 y 12'),
  anio: z.number()
    .min(2024, 'El año debe ser válido')
    .max(2030, 'El año no puede ser mayor a 2030'),
  hospitalId: z.string().min(1, 'Debe seleccionar un hospital')
});

// Schema para Pago
export const pagoSchema = z.object({
  nominaId: z.string().min(1, 'ID de nómina es obligatorio'),
  profesionalId: z.string().min(1, 'ID de profesional es obligatorio'),
  formaPago: formaPagoSchema,
  fecha: z.date().optional(),
  comprobanteUrl: z.string().url('URL del comprobante inválida').optional(),
  observacion: z.string()
    .max(500, 'La observación no puede exceder 500 caracteres')
    .optional(),
  monto: z.number()
    .min(0, 'El monto debe ser mayor a 0')
});

// Schema para Ajuste de Baremo
export const ajusteBaremoSchema = z.object({
  fuente: fuenteBaremoSchema,
  categoria: categoriaProfesionalSchema,
  tipoGuardia: tipoGuardiaSchema,
  tipoDia: tipoDiaSchema,
  valor: z.number()
    .min(0, 'El valor debe ser mayor a 0')
    .max(100000, 'El valor no puede exceder 100,000 XAF'),
  porcentajeLocalizable: z.object({
    condicion: z.number().min(0).max(100),
    llamada: z.number().min(0).max(100)
  }).optional(),
  vigenteDesde: z.date(),
  vigenteHasta: z.date().optional(),
  activo: z.boolean().default(true)
}).refine((data) => {
  // Validar que la fecha de vigencia sea coherente
  if (data.vigenteHasta) {
    return data.vigenteHasta > data.vigenteDesde;
  }
  return true;
}, {
  message: 'La fecha de fin de vigencia debe ser posterior a la fecha de inicio',
  path: ['vigenteHasta']
});

// Schema para filtros de búsqueda
export const filtrosGuardiaSchema = z.object({
  profesionalId: z.string().optional(),
  categoria: categoriaProfesionalSchema.optional(),
  tipo: tipoGuardiaSchema.optional(),
  estado: estadoGuardiaSchema.optional(),
  validacionEstado: estadoValidacionSchema.optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  unidadServicio: z.string().optional()
}).refine((data) => {
  // Validar que las fechas sean coherentes
  if (data.fechaDesde && data.fechaHasta) {
    return data.fechaHasta >= data.fechaDesde;
  }
  return true;
}, {
  message: 'La fecha hasta debe ser posterior o igual a la fecha desde',
  path: ['fechaHasta']
});

// Schema para configuración del sistema
export const configuracionSchema = z.object({
  fuenteBaremo: fuenteBaremoSchema,
  limitesGuardias: z.object({
    minimo: z.number().min(1, 'El mínimo debe ser al menos 1'),
    maximo: z.number().min(1, 'El máximo debe ser al menos 1')
  }).refine((data) => data.maximo >= data.minimo, {
    message: 'El máximo debe ser mayor o igual al mínimo',
    path: ['maximo']
  }),
  duracionMinima: z.number()
    .min(8, 'La duración mínima debe ser al menos 8 horas')
    .max(24, 'La duración mínima no puede exceder 24 horas'),
  duracionMaxima: z.number()
    .min(8, 'La duración máxima debe ser al menos 8 horas')
    .max(48, 'La duración máxima no puede exceder 48 horas'),
  notificacionesActivas: z.boolean()
}).refine((data) => {
  return data.duracionMaxima >= data.duracionMinima;
}, {
  message: 'La duración máxima debe ser mayor o igual a la mínima',
  path: ['duracionMaxima']
});

// Types inferidos para TypeScript
export type ProfesionalFormData = z.infer<typeof profesionalSchema>;
export type GuardiaFormData = z.infer<typeof guardiaSchema>;
export type ValidacionFormData = z.infer<typeof validacionSchema>;
export type NominaFormData = z.infer<typeof nominaSchema>;
export type PagoFormData = z.infer<typeof pagoSchema>;
export type AjusteBaremoFormData = z.infer<typeof ajusteBaremoSchema>;
export type FiltrosGuardiaFormData = z.infer<typeof filtrosGuardiaSchema>;
export type ConfiguracionFormData = z.infer<typeof configuracionSchema>;

// Esquemas de respuesta para validar datos de la API
export const responseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

// Schema para validar archivos subidos
export const archivoSchema = z.object({
  nombre: z.string(),
  tipo: z.string(),
  tamaño: z.number().max(5 * 1024 * 1024, 'El archivo no puede exceder 5MB'),
  url: z.string().url()
});

export type ArchivoFormData = z.infer<typeof archivoSchema>;
