import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, 
  FileText, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap,
  Building,
  Save,
  Upload,
  Eye,
  Download,
  BarCode,
  RefreshCw
} from 'lucide-react';
import { useCreateProfesional } from "@/hooks/useCreateProfesional";
import { useGenerateCode } from "@/hooks/useGenerateCode";
import { useCentrosSalud } from "@/hooks/useCentrosSalud";

const ProfessionalRegistration = () => {
  const [formData, setFormData] = useState({
    // Información personal
    nombre: '',
    apellidos: '',
    genero: '',
    fecha_nacimiento: '',
    edad: '',
    nacionalidad: '',
    numero_documento: '',
    tipo_documento: '',
    telefono: '',
    email: '',
    
    // Ubicación
    provincia: '',
    distrito: '',
    distrito_sanitario: '',
    direccion: '',
    
    // Información profesional
    area_profesional: '',
    categoria_titulacion: '',
    institucion_1: '',
    año_graduacion: '',
    numero_titulo: '',
    fecha_graduacion: '',
    
    // Centro de trabajo
    nombre_centro: '',
    categoria_centro: '',
    tipo_sector: '',
    centro_salud_id: '',
    
    // Información adicional
    brigada_cooperacion: '',
    año_inicio_paro: '',
    observaciones: '',
    
    // Documentos
    foto_carnet_base64: '',
    url_pdf: '',
    
    // Sistema
    codigo_expediente: '',
    url_codigo_barras_expediente: '',
    estado_solicitud: 'Recibido',
    numero_autonumerico_correlativo: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const createProfesionalMutation = useCreateProfesional();
  const { mutate: generateCode, isPending: isGeneratingCode } = useGenerateCode();
  const { data: centrosSalud = [] } = useCentrosSalud();

  // Opciones para los selects
  const generoOptions = ['Masculino', 'Femenino'];
  const nacionalidadOptions = ['Ecuatoguineana', 'Española', 'Camerunesa', 'Gabonesa', 'Nigeriana', 'Otra'];
  const provinciaOptions = ['Bioko Norte', 'Bioko Sur', 'Litoral', 'Centro Sur', 'Kié-Ntem', 'Wele-Nzas', 'Annobón'];
  const areaProfesionalOptions = [
    'Medicina General',
    'Pediatría',
    'Ginecología y Obstetricia',
    'Cirugía General',
    'Medicina Interna',
    'Cardiología',
    'Neurología',
    'Psiquiatría',
    'Dermatología',
    'Oftalmología',
    'Otorrinolaringología',
    'Traumatología',
    'Anestesiología',
    'Radiología',
    'Patología',
    'Medicina Familiar',
    'Enfermería',
    'Farmacia',
    'Odontología',
    'Fisioterapia',
    'Laboratorio Clínico',
    'Nutrición',
    'Psicología Clínica',
    'Trabajo Social',
    'Técnico en Salud'
  ];
  const categoriaTitulacionOptions = ['Licenciatura', 'Máster', 'Doctorado', 'Especialización', 'Técnico Superior'];
  const tipoSectorOptions = ['Público', 'Privado', 'Mixto'];
  const categoriaCentroOptions = ['Hospital Nacional', 'Hospital Regional', 'Centro de Salud', 'Clínica Privada', 'Consultorio'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleGenerateCode = async () => {
    try {
      const response = await generateCode();
      
      if (response?.data) {
        setFormData(prev => ({
          ...prev,
          codigo_expediente: response.data.codigo_expediente,
          url_codigo_barras_expediente: response.data.url_codigo_barras || ''
        }));
        
        toast.success('Código de expediente generado correctamente');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Error al generar el código de expediente');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Información personal
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
        if (!formData.genero) newErrors.genero = 'El género es requerido';
        if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
        if (!formData.nacionalidad) newErrors.nacionalidad = 'La nacionalidad es requerida';
        if (!formData.numero_documento.trim()) newErrors.numero_documento = 'El número de documento es requerido';
        break;
        
      case 2: // Ubicación y contacto
        if (!formData.provincia) newErrors.provincia = 'La provincia es requerida';
        if (!formData.distrito.trim()) newErrors.distrito = 'El distrito es requerido';
        if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
        if (!formData.email.trim()) newErrors.email = 'El email es requerido';
        break;
        
      case 3: // Información profesional
        if (!formData.area_profesional) newErrors.area_profesional = 'El área profesional es requerida';
        if (!formData.categoria_titulacion) newErrors.categoria_titulacion = 'La categoría de titulación es requerida';
        if (!formData.institucion_1.trim()) newErrors.institucion_1 = 'La institución de graduación es requerida';
        if (!formData.año_graduacion) newErrors.año_graduacion = 'El año de graduación es requerido';
        break;
        
      case 4: // Centro de trabajo
        if (!formData.nombre_centro.trim()) newErrors.nombre_centro = 'El nombre del centro es requerido';
        if (!formData.categoria_centro) newErrors.categoria_centro = 'La categoría del centro es requerida';
        if (!formData.tipo_sector) newErrors.tipo_sector = 'El tipo de sector es requerido';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Calcular edad si no está presente
      let edad = formData.edad;
      if (!edad && formData.fecha_nacimiento) {
        const birthDate = new Date(formData.fecha_nacimiento);
        const today = new Date();
        edad = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          edad--;
        }
      }

      // Preparar datos para envío
      const dataToSubmit = {
        ...formData,
        edad: parseInt(edad) || null,
        año_graduacion: parseInt(formData.año_graduacion) || null,
        año_inicio_paro: formData.año_inicio_paro ? parseInt(formData.año_inicio_paro) : null,
        nombre_completo: `${formData.nombre} ${formData.apellidos}`.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await createProfesionalMutation.mutateAsync(dataToSubmit);
      
      toast.success('Profesional registrado exitosamente');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        apellidos: '',
        genero: '',
        fecha_nacimiento: '',
        edad: '',
        nacionalidad: '',
        numero_documento: '',
        tipo_documento: '',
        telefono: '',
        email: '',
        provincia: '',
        distrito: '',
        distrito_sanitario: '',
        direccion: '',
        area_profesional: '',
        categoria_titulacion: '',
        institucion_1: '',
        año_graduacion: '',
        numero_titulo: '',
        fecha_graduacion: '',
        nombre_centro: '',
        categoria_centro: '',
        tipo_sector: '',
        centro_salud_id: '',
        brigada_cooperacion: '',
        año_inicio_paro: '',
        observaciones: '',
        foto_carnet_base64: '',
        url_pdf: '',
        codigo_expediente: '',
        url_codigo_barras_expediente: '',
        estado_solicitud: 'Recibido',
        numero_autonumerico_correlativo: null
      });
      
      setCurrentStep(1);
      setErrors({});
      
    } catch (error) {
      console.error('Error creating professional:', error);
      toast.error('Error al registrar el profesional');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={errors.nombre ? 'border-red-500' : ''}
                />
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
              </div>
              
              <div>
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  className={errors.apellidos ? 'border-red-500' : ''}
                />
                {errors.apellidos && <p className="text-sm text-red-500 mt-1">{errors.apellidos}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="genero">Género *</Label>
                <Select value={formData.genero} onValueChange={(value) => handleInputChange('genero', value)}>
                  <SelectTrigger className={errors.genero ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {generoOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.genero && <p className="text-sm text-red-500 mt-1">{errors.genero}</p>}
              </div>
              
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                  className={errors.fecha_nacimiento ? 'border-red-500' : ''}
                />
                {errors.fecha_nacimiento && <p className="text-sm text-red-500 mt-1">{errors.fecha_nacimiento}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                <Select value={formData.nacionalidad} onValueChange={(value) => handleInputChange('nacionalidad', value)}>
                  <SelectTrigger className={errors.nacionalidad ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar nacionalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {nacionalidadOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nacionalidad && <p className="text-sm text-red-500 mt-1">{errors.nacionalidad}</p>}
              </div>
              
              <div>
                <Label htmlFor="numero_documento">Número de Documento *</Label>
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                  className={errors.numero_documento ? 'border-red-500' : ''}
                />
                {errors.numero_documento && <p className="text-sm text-red-500 mt-1">{errors.numero_documento}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <Select value={formData.provincia} onValueChange={(value) => handleInputChange('provincia', value)}>
                  <SelectTrigger className={errors.provincia ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinciaOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.provincia && <p className="text-sm text-red-500 mt-1">{errors.provincia}</p>}
              </div>
              
              <div>
                <Label htmlFor="distrito">Distrito *</Label>
                <Input
                  id="distrito"
                  value={formData.distrito}
                  onChange={(e) => handleInputChange('distrito', e.target.value)}
                  className={errors.distrito ? 'border-red-500' : ''}
                />
                {errors.distrito && <p className="text-sm text-red-500 mt-1">{errors.distrito}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className={errors.telefono ? 'border-red-500' : ''}
                />
                {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area_profesional">Área Profesional *</Label>
                <Select value={formData.area_profesional} onValueChange={(value) => handleInputChange('area_profesional', value)}>
                  <SelectTrigger className={errors.area_profesional ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaProfesionalOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.area_profesional && <p className="text-sm text-red-500 mt-1">{errors.area_profesional}</p>}
              </div>
              
              <div>
                <Label htmlFor="categoria_titulacion">Categoría de Titulación *</Label>
                <Select value={formData.categoria_titulacion} onValueChange={(value) => handleInputChange('categoria_titulacion', value)}>
                  <SelectTrigger className={errors.categoria_titulacion ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriaTitulacionOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria_titulacion && <p className="text-sm text-red-500 mt-1">{errors.categoria_titulacion}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institucion_1">Institución de Graduación *</Label>
                <Input
                  id="institucion_1"
                  value={formData.institucion_1}
                  onChange={(e) => handleInputChange('institucion_1', e.target.value)}
                  className={errors.institucion_1 ? 'border-red-500' : ''}
                />
                {errors.institucion_1 && <p className="text-sm text-red-500 mt-1">{errors.institucion_1}</p>}
              </div>
              
              <div>
                <Label htmlFor="año_graduacion">Año de Graduación *</Label>
                <Input
                  id="año_graduacion"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={formData.año_graduacion}
                  onChange={(e) => handleInputChange('año_graduacion', e.target.value)}
                  className={errors.año_graduacion ? 'border-red-500' : ''}
                />
                {errors.año_graduacion && <p className="text-sm text-red-500 mt-1">{errors.año_graduacion}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_titulo">Número de Título</Label>
                <Input
                  id="numero_titulo"
                  value={formData.numero_titulo}
                  onChange={(e) => handleInputChange('numero_titulo', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="fecha_graduacion">Fecha de Graduación</Label>
                <Input
                  id="fecha_graduacion"
                  type="date"
                  value={formData.fecha_graduacion}
                  onChange={(e) => handleInputChange('fecha_graduacion', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_centro">Nombre del Centro *</Label>
                <Input
                  id="nombre_centro"
                  value={formData.nombre_centro}
                  onChange={(e) => handleInputChange('nombre_centro', e.target.value)}
                  className={errors.nombre_centro ? 'border-red-500' : ''}
                />
                {errors.nombre_centro && <p className="text-sm text-red-500 mt-1">{errors.nombre_centro}</p>}
              </div>
              
              <div>
                <Label htmlFor="categoria_centro">Categoría del Centro *</Label>
                <Select value={formData.categoria_centro} onValueChange={(value) => handleInputChange('categoria_centro', value)}>
                  <SelectTrigger className={errors.categoria_centro ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriaCentroOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria_centro && <p className="text-sm text-red-500 mt-1">{errors.categoria_centro}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_sector">Tipo de Sector *</Label>
                <Select value={formData.tipo_sector} onValueChange={(value) => handleInputChange('tipo_sector', value)}>
                  <SelectTrigger className={errors.tipo_sector ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoSectorOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipo_sector && <p className="text-sm text-red-500 mt-1">{errors.tipo_sector}</p>}
              </div>
              
              <div>
                <Label htmlFor="distrito_sanitario">Distrito Sanitario</Label>
                <Input
                  id="distrito_sanitario"
                  value={formData.distrito_sanitario}
                  onChange={(e) => handleInputChange('distrito_sanitario', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Código de Expediente</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <BarCode className="h-4 w-4 mr-2" />
                      Generar Código
                    </>
                  )}
                </Button>
              </div>
              
              {formData.codigo_expediente && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-mono text-lg">{formData.codigo_expediente}</p>
                  {formData.url_codigo_barras_expediente && (
                    <img 
                      src={formData.url_codigo_barras_expediente} 
                      alt="Código de barras" 
                      className="mt-2 h-16"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registro de Profesional Sanitario
            </CardTitle>
            <CardDescription>
              Complete la información del profesional sanitario paso a paso
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / totalSteps) * 100)}% completado
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step titles */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { step: 1, title: 'Información Personal', icon: User },
                { step: 2, title: 'Ubicación y Contacto', icon: MapPin },
                { step: 3, title: 'Información Profesional', icon: GraduationCap },
                { step: 4, title: 'Centro de Trabajo', icon: Building }
              ].map(({ step, title, icon: Icon }) => (
                <div 
                  key={step}
                  className={`text-center p-3 rounded-lg border ${
                    currentStep === step 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : currentStep > step 
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">{title}</p>
                </div>
              ))}
            </div>

            {/* Form content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              
              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Registrar Profesional
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
