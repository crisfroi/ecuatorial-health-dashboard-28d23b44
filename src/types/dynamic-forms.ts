// Tipos para el sistema de formularios dinámicos
export interface FormFieldConfig {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  validation?: FieldValidation;
  options?: FormFieldOption[];
  defaultValue?: any;
  conditional?: ConditionalLogic;
  order: number;
  category?: string;
}

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'signature'
  | 'rating'
  | 'scale'
  | 'location'
  | 'boolean';

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
  icon?: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
  fileTypes?: string[];
  fileSize?: number; // en MB
}

export interface ConditionalLogic {
  showIf?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
  hideIf?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  };
}

export interface DynamicForm {
  id: string;
  title: string;
  description?: string;
  category: FormCategory;
  fields: FormFieldConfig[];
  settings: FormSettings;
  publicSettings: PublicFormSettings;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  submissions_count: number;
}

export type FormCategory = 
  | 'profesionales'
  | 'centros_salud'
  | 'evaluaciones'
  | 'encuestas'
  | 'reportes'
  | 'otros';

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  requireAuthentication: boolean;
  showProgressBar: boolean;
  theme: FormTheme;
  confirmationMessage?: string;
  redirectUrl?: string;
  autoSave: boolean;
  maxSubmissions?: number;
}

export interface PublicFormSettings {
  isPublic: boolean;
  publicUrl: string;
  allowAnonymous: boolean;
  collectEmail: boolean;
  showInDirectory: boolean;
  expirationDate?: string;
  password?: string;
}

export interface FormTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedBy?: string;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  metadata?: Record<string, any>;
}

export interface FormAnalytics {
  formId: string;
  totalSubmissions: number;
  completionRate: number;
  averageTimeToComplete: number;
  mostCommonAnswers: Record<string, any>;
  submissionTrends: Array<{
    date: string;
    count: number;
  }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

// Tipos para indicadores dinámicos de profesionales
export interface ProfessionalIndicator {
  id: string;
  name: string;
  type: IndicatorType;
  category: IndicatorCategory;
  description?: string;
  formId?: string; // Si está asociado a un formulario
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  validation?: FieldValidation;
  options?: FormFieldOption[];
  created_at: string;
  updated_at: string;
}

export type IndicatorType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'json'; // Para datos complejos

export type IndicatorCategory = 
  | 'personal'
  | 'profesional'
  | 'academico'
  | 'laboral'
  | 'certificaciones'
  | 'sanciones'
  | 'reconocimientos'
  | 'experiencia'
  | 'idiomas'
  | 'publicaciones'
  | 'proyectos'
  | 'otros';

export interface ProfessionalIndicatorValue {
  id: string;
  professionalId: string;
  indicatorId: string;
  value: any;
  submissionId?: string; // Si viene de un formulario
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Tipos para el constructor visual
export interface FormBuilderState {
  selectedField?: FormFieldConfig;
  draggedField?: FormFieldConfig;
  previewMode: boolean;
  formSettings: FormSettings;
  publicSettings: PublicFormSettings;
}

export interface FormFieldTemplate {
  type: FormFieldType;
  label: string;
  icon: string;
  description: string;
  defaultConfig: Partial<FormFieldConfig>;
  category: 'basic' | 'advanced' | 'media' | 'layout';
}
