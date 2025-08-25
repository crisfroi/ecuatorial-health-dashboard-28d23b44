import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login: authLogin, isLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Si ya hay un usuario autenticado, redirigir al dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔑 Auth.tsx: Starting login process');
    setLoading(true);
    setError('');

    try {
      console.log('🔑 Auth.tsx: Calling authLogin...');
      const result = await authLogin(email, password);
      console.log('🔑 Auth.tsx: authLogin result:', result);

      if (!result.success) {
        console.log('❌ Auth.tsx: Login failed:', result.error);
        setError(result.error || 'Error al iniciar sesión');
        return;
      }

      console.log('✅ Auth.tsx: Login successful, showing toast');
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });

      // La navegación la maneja el useEffect cuando user cambia
    } catch (err: any) {
      console.error('❌ Auth.tsx: Unexpected error:', err);
      setError('Error inesperado al iniciar sesión');
    } finally {
      console.log('🔄 Auth.tsx: Setting local loading(false)');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Ya existe una cuenta con este email. Intenta iniciar sesión.');
        } else if (error.message.includes('Invalid email')) {
          setError('El formato del email no es válido.');
        } else {
          setError(error.message);
        }
        return;
      }

      toast({
        title: "Cuenta creada",
        description: "Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
      });
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError('Error inesperado al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  // Navigation is handled by useEffect above, no need to redirect during render

  return (
    <div className="min-h-screen bg-gradient-to-br from-guinea-teal to-guinea-dark-teal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-guinea-teal" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RENAPROSA</h1>
          <p className="text-guinea-teal-light">Sistema de Gestión de Profesionales Sanitarios</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Panel de Control</CardTitle>
            <CardDescription className="text-center">
              Accede al sistema de gestión ministerial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="admin@sanidad.gq"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-guinea-teal hover:bg-guinea-dark-teal"
                    disabled={loading || isLoading}
                  >
                    {(loading || isLoading) ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="nuevo@sanidad.gq"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirma tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-guinea-teal hover:bg-guinea-dark-teal"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Necesitas ayuda? Contacta al administrador del sistema
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Si tienes problemas con el acceso, usa la contraseña temporal: <strong>123456</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            ← Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
