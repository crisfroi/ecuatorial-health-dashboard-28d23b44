# 🎯 Sistema de Formularios Dinámicos - Dashboard de Salud Ecuatorial

## 📋 Descripción General

El **Sistema de Formularios Dinámicos** es un módulo completo tipo **Fillout/JotForm** integrado en el Dashboard de Salud Ecuatorial que permite crear, gestionar y publicar formularios dinámicos para recopilar información de manera flexible.

## 🚀 Características Principales

### 🏗️ **Constructor Visual de Formularios**
- **Drag & Drop**: Arrastra elementos para construir formularios
- **Vista Previa en Tiempo Real**: Ve cómo se verá el formulario mientras lo construyes
- **Múltiples Tipos de Campos**: Texto, números, fechas, selecciones, archivos, etc.
- **Validaciones Avanzadas**: Configura reglas de validación personalizadas
- **Lógica Condicional**: Campos que aparecen/desaparecen según respuestas

### 📊 **Gestión de Indicadores Dinámicos**
- **Indicadores Personalizables**: Crea nuevos parámetros para profesionales
- **Categorías Organizadas**: Personal, Profesional, Académico, Laboral, etc.
- **Tipos de Datos Flexibles**: Texto, números, fechas, JSON, archivos
- **Integración con Profesionales**: Asocia indicadores a perfiles existentes

### 🌐 **Formularios Públicos**
- **Enlaces Públicos**: Genera URLs únicas para cada formulario
- **Acceso Controlado**: Protección por contraseña opcional
- **Formularios Anónimos**: Permite envíos sin autenticación
- **Responsive Design**: Funciona perfectamente en móviles

### 📈 **Analytics y Reportes**
- **Estadísticas en Tiempo Real**: Envíos, tasas de completado, tendencias
- **Análisis por Dispositivo**: Desktop, móvil, tablet
- **Exportación de Datos**: CSV, Excel, PDF
- **Visualizaciones Interactivas**: Gráficos y charts dinámicos

## 🛠️ Componentes del Sistema

### **Componentes Principales**

1. **FormBuilder** - Constructor visual de formularios
2. **FieldEditor** - Editor de propiedades de campos
3. **FormPreview** - Vista previa del formulario
4. **FormSettings** - Configuración general y tema
5. **PublicFormView** - Vista pública del formulario
6. **FormManager** - Gestión de formularios existentes
7. **IndicatorManager** - Gestión de indicadores dinámicos
8. **ProfessionalIndicatorsEditor** - Editor de indicadores por profesional
9. **FormAnalytics** - Analytics y estadísticas

### **Hooks Personalizados**

- `useDynamicForms` - Gestión de formularios
- `useFormSubmissions` - Envíos de formularios
- `useProfessionalIndicators` - Indicadores de profesionales
- `useProfessionalIndicatorValues` - Valores de indicadores
- `usePublicForm` - Formularios públicos
- `useFormAnalytics` - Analytics de formularios

## 🎨 Tipos de Campos Disponibles

### **Campos Básicos**
- **Texto** - Campo de texto simple
- **Área de Texto** - Texto multilínea
- **Email** - Validación de email automática
- **Teléfono** - Campo numérico para teléfonos
- **Número** - Campo numérico con validaciones
- **Fecha** - Selector de fecha

### **Campos Avanzados**
- **Selección** - Lista desplegable
- **Múltiple Selección** - Checkboxes múltiples
- **Casillas** - Checkboxes individuales
- **Calificación** - Escala de estrellas
- **Ubicación** - Selector de ubicación geográfica
- **Firma Digital** - Captura de firma

### **Campos Multimedia**
- **Archivo** - Subida de archivos
- **Imagen** - Subida de imágenes
- **Documentos** - Subida de documentos PDF

## 📊 Indicadores Dinámicos por Categoría

### **Personal**
- Información personal adicional
- Datos de contacto secundarios
- Preferencias personales

### **Profesional**
- Especialidades adicionales
- Certificaciones profesionales
- Membresías profesionales

### **Académico**
- Formación adicional
- Cursos de especialización
- Publicaciones académicas

### **Laboral**
- Experiencia laboral detallada
- Cargos desempeñados
- Fechas de inicio y fin
- Motivos de cese

### **Reconocimientos**
- Condecoraciones recibidas
- Premios y distinciones
- Reconocimientos oficiales

### **Sanciones**
- Sanciones disciplinarias
- Medidas correctivas
- Estado disciplinario

### **Certificaciones**
- Certificaciones adicionales
- Fechas de emisión y vencimiento
- Organismos emisores

### **Experiencia**
- Experiencia internacional
- Proyectos especiales
- Colaboraciones

### **Idiomas**
- Idiomas dominados
- Niveles de competencia
- Certificaciones lingüísticas

### **Publicaciones**
- Artículos científicos
- Libros publicados
- Investigaciones

### **Proyectos**
- Proyectos de investigación
- Colaboraciones internacionales
- Iniciativas especiales

## 🔧 Configuración Técnica

### **Base de Datos**
```sql
-- Tablas principales
dynamic_forms              -- Formularios dinámicos
form_submissions          -- Envíos de formularios
professional_indicators   -- Indicadores de profesionales
professional_indicator_values -- Valores de indicadores
```

### **Variables de Entorno**
```env
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### **Dependencias Adicionales**
```json
{
  "react-dnd": "^16.0.0",
  "react-dnd-html5-backend": "^16.0.0"
}
```

## 🚀 Uso del Sistema

### **1. Crear un Formulario**
```typescript
// Acceder al constructor
navigate('/dynamic-forms');

// Crear nuevo formulario
<Button onClick={() => setShowFormBuilder(true)}>
  Nuevo Formulario
</Button>
```

### **2. Configurar Campos**
- Arrastra elementos desde la barra lateral
- Configura propiedades en el panel derecho
- Añade validaciones y lógica condicional

### **3. Publicar Formulario**
- Configura enlaces públicos
- Establece protección por contraseña
- Personaliza tema y colores

### **4. Gestionar Indicadores**
```typescript
// Crear nuevo indicador
const newIndicator = {
  name: 'Condecoraciones recibidas',
  type: 'select',
  category: 'reconocimientos',
  options: [
    { label: 'Orden del Mérito Civil', value: 'merito_civil' },
    { label: 'Medalla Sanitaria', value: 'medalla_sanitaria' }
  ]
};
```

### **5. Integrar con Profesionales**
```typescript
// En el perfil del profesional
<ProfessionalIndicatorsEditor 
  professionalId={professional.id}
  onSave={() => refetch()}
/>
```

## 📱 URLs y Rutas

### **Rutas Principales**
- `/dynamic-forms` - Gestión de formularios
- `/form/:publicUrl` - Formulario público
- `/professional/:id/indicators` - Indicadores del profesional

### **APIs**
- `POST /api/forms` - Crear formulario
- `GET /api/forms/:id` - Obtener formulario
- `POST /api/forms/:id/submit` - Enviar formulario
- `GET /api/forms/:id/analytics` - Analytics del formulario

## 🎯 Casos de Uso

### **Para Administradores**
1. **Crear encuestas** para recopilar feedback
2. **Generar formularios** de evaluación de desempeño
3. **Configurar indicadores** personalizados para profesionales
4. **Analizar respuestas** con reportes detallados

### **Para Profesionales**
1. **Completar formularios** de actualización de datos
2. **Añadir información adicional** como condecoraciones
3. **Actualizar certificaciones** y especialidades
4. **Registrar experiencia** internacional

### **Para el Público**
1. **Acceder a formularios** públicos sin registro
2. **Enviar solicitudes** de manera anónima
3. **Participar en encuestas** del ministerio
4. **Completar evaluaciones** en línea

## 🔒 Seguridad

### **Control de Acceso**
- Autenticación requerida para creación/edición
- Formularios públicos opcionales
- Protección por contraseña
- Validación de datos en frontend y backend

### **Políticas RLS**
- Acceso basado en roles
- Protección de datos sensibles
- Auditoría de cambios
- Encriptación de datos

## 📈 Métricas y Analytics

### **Estadísticas Disponibles**
- Total de envíos
- Tasa de completado
- Tiempo promedio de completado
- Distribución por dispositivo
- Tendencias temporales
- Respuestas más comunes

### **Exportación**
- Datos en CSV/Excel
- Reportes en PDF
- Gráficos exportables
- Datos para análisis externo

## 🚀 Próximas Funcionalidades

### **En Desarrollo**
- [ ] Formularios multi-paso
- [ ] Lógica condicional avanzada
- [ ] Integración con calendarios
- [ ] Notificaciones automáticas
- [ ] Plantillas predefinidas

### **Futuras Mejoras**
- [ ] IA para análisis de respuestas
- [ ] Formularios offline
- [ ] Integración con sistemas externos
- [ ] Mobile app nativa
- [ ] APIs para terceros

## 🎉 Conclusión

El **Sistema de Formularios Dinámicos** transforma el Dashboard de Salud Ecuatorial en una plataforma completa de recopilación y gestión de datos, permitiendo:

✅ **Flexibilidad total** en la creación de formularios
✅ **Indicadores personalizables** para profesionales
✅ **Formularios públicos** accesibles sin registro
✅ **Analytics avanzados** para toma de decisiones
✅ **Integración perfecta** con el sistema existente

Este sistema posiciona a Guinea Ecuatorial a la vanguardia de la gestión sanitaria digital, proporcionando herramientas modernas y flexibles para la recopilación y análisis de información del sector salud.

---

**Desarrollado con ❤️ para el sistema de salud de Guinea Ecuatorial**

