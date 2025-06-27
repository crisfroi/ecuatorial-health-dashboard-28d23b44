
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserCheck, BarChart3, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-guinea-light-teal via-white to-guinea-teal/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-guinea-teal to-guinea-dark-teal bg-clip-text text-transparent mb-4">
            RENAPROSA
          </h1>
          <p className="text-xl text-guinea-dark-teal/80 mb-8 max-w-2xl mx-auto">
            Registro Nacional de Profesionales Sanitarios de Guinea Ecuatorial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-gradient-to-r from-guinea-teal to-guinea-dark-teal hover:from-guinea-dark-teal hover:to-guinea-teal transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Acceder al Sistema
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="lg"
              className="border-guinea-teal text-guinea-teal hover:bg-guinea-teal hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-guinea-teal to-guinea-dark-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-guinea-dark-teal">Registro Profesional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-guinea-dark-teal/70 text-center">
                Gestión completa del registro de profesionales sanitarios con verificación de credenciales y seguimiento de estados.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-guinea-teal to-guinea-dark-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-guinea-dark-teal">Análisis Avanzado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-guinea-dark-teal/70 text-center">
                Estadísticas detalladas, gráficos interactivos y análisis de tendencias con inteligencia artificial integrada.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-guinea-teal to-guinea-dark-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-guinea-dark-teal">Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-guinea-dark-teal/70 text-center">
                Acceso controlado por roles, autenticación segura y protección de datos sensibles de profesionales.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-guinea-dark-teal text-center mb-8">
            Sistema Nacional de Salud
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-guinea-teal mb-2">1000+</div>
              <div className="text-guinea-dark-teal/70">Profesionales Registrados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-guinea-teal mb-2">8</div>
              <div className="text-guinea-dark-teal/70">Provincias Cubiertas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-guinea-teal mb-2">95%</div>
              <div className="text-guinea-dark-teal/70">Tasa de Aprobación</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-guinea-teal mb-2">24/7</div>
              <div className="text-guinea-dark-teal/70">Disponibilidad</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-guinea-dark-teal/60">
            © 2024 RENAPROSA - Ministerio de Sanidad y Bienestar Social de Guinea Ecuatorial
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
