// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Clock,
  Users,
  Eye,
  Send,
  ArrowLeft
} from 'lucide-react';
import { usePublicForm, useFormSubmissions } from '@/hooks/useDynamicForms';
import { FormPreview } from './FormPreview';
import { useToast } from '@/hooks/use-toast';

export const PublicFormView: React.FC = () => {
  const { publicUrl } = useParams<{ publicUrl: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submissionData, setSubmissionData] = useState<Record<string, any>>({});
  
  const { form, isLoading, error } = usePublicForm(publicUrl || '');
  const { submitForm, isSubmitting } = useFormSubmissions(form?.id || '');

  useEffect(() => {
    if (form?.publicSettings.password) {
      // Verificar si ya tiene la contraseña guardada en sessionStorage
      const savedPassword = sessionStorage.getItem(`form_password_${publicUrl}`);
      if (savedPassword === form.publicSettings.password) {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [form, publicUrl]);

  useEffect(() => {
    if (form?.publicSettings.expirationDate) {
      const expirationDate = new Date(form.publicSettings.expirationDate);
      const now = new Date();
      if (now > expirationDate) {
        toast({
          title: "Formulario expirado",
          description: "Este formulario ya no está disponible",
          variant: "destructive"
        });
        navigate('/');
      }
    }
  }, [form, navigate, toast]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === form?.publicSettings.password) {
      sessionStorage.setItem(`form_password_${publicUrl}`, password);
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      await submitForm({
        formId: form!.id,
        data,
        status: 'submitted',
        ipAddress: 'unknown', // En producción, obtener la IP real
        userAgent: navigator.userAgent
      });

      toast({
        title: "¡Formulario enviado!",
        description: form?.settings.confirmationMessage || "Gracias por completar el formulario"
      });

      // Redireccionar si está configurado
      if (form?.settings.redirectUrl) {
        window.location.href = form.settings.redirectUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el formulario",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando formulario...</div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Formulario no encontrado</h1>
            <p className="text-gray-600 mb-4">
              El formulario que buscas no existe o ya no está disponible.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si el formulario está inactivo
  if (!form.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Formulario inactivo</h1>
            <p className="text-gray-600 mb-4">
              Este formulario está temporalmente deshabilitado.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pantalla de autenticación por contraseña
  if (!isAuthenticated && form.publicSettings.password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Acceso protegido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Este formulario está protegido con contraseña. Ingresa la contraseña para continuar.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className={passwordError ? 'border-red-500' : ''}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">Contraseña incorrecta</p>
                )}
              </div>
              
              <Button type="submit" className="w-full">
                Acceder al formulario
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del formulario */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {form.publicSettings.showInDirectory && (
                <Badge variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Público
                </Badge>
              )}
              {form.submissions_count > 0 && (
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  {form.submissions_count} respuestas
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: form.settings.theme.textColor }}
            >
              {form.title}
            </h1>
            {form.description && (
              <p 
                className="text-lg text-gray-600"
                style={{ color: form.settings.theme.secondaryColor }}
              >
                {form.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div 
          className="rounded-lg border p-8"
          style={{
            backgroundColor: form.settings.theme.backgroundColor,
            borderRadius: form.settings.theme.borderRadius === 'none' ? '0px' :
                        form.settings.theme.borderRadius === 'small' ? '4px' :
                        form.settings.theme.borderRadius === 'medium' ? '8px' : '12px'
          }}
        >
          <FormPreview
            title=""
            description=""
            fields={form.fields}
            onSubmit={handleFormSubmit}
            readOnly={false}
          />
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Este formulario es seguro y tus datos están protegidos.
            {form.settings.requireAuthentication && ' Se requiere autenticación para enviar.'}
          </p>
          
          {form.publicSettings.collectEmail && (
            <p className="mt-1">
              Se recopilará tu dirección de email para fines de contacto.
            </p>
          )}
          
          {form.settings.maxSubmissions && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                Límite de {form.settings.maxSubmissions} envíos
                {form.submissions_count >= form.settings.maxSubmissions && (
                  <span className="text-red-600 ml-1">(LÍMITE ALCANZADO)</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

