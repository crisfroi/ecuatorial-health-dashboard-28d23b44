
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, BarChart3, LogIn } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-guinea-light-teal via-white to-guinea-teal/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-guinea-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-guinea-dark-teal text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-guinea-light-teal via-white to-guinea-teal/20">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-guinea-dark-teal mb-4">
            RENAPROSA
          </h1>
          <p className="text-xl text-guinea-dark-teal/70 mb-8">
            Registro Nacional de Profesionales Sanitarios
          </p>
          
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-guinea-teal to-guinea-dark-teal hover:from-guinea-dark-teal hover:to-guinea-teal text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Iniciar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <Building2 className="w-12 h-12 text-guinea-teal mx-auto mb-4" />
              <CardTitle className="text-guinea-dark-teal">Centros de Salud</CardTitle>
              <CardDescription>
                Gestión integral de centros sanitarios y sus profesionales
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-guinea-teal mx-auto mb-4" />
              <CardTitle className="text-guinea-dark-teal">Profesionales</CardTitle>
              <CardDescription>
                Registro y seguimiento de profesionales sanitarios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-guinea-teal mx-auto mb-4" />
              <CardTitle className="text-guinea-dark-teal">Estadísticas</CardTitle>
              <CardDescription>
                Análisis y reportes detallados del sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
