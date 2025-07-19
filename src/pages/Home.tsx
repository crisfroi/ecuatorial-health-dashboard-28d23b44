import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  FileText,
  BarChart3,
  UserPlus,
  Search,
  Shield,
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800"
                alt="Guinea Ecuatorial Salud"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900">
                Ministerio de Sanidad - Guinea Ecuatorial
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link to="/search">
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Verificar Profesional
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline">Panel de Control</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestión de Profesionales Sanitarios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Plataforma integral para el registro, gestión y seguimiento de
            profesionales de la salud en Guinea Ecuatorial. Garantizamos la
            acreditación y calidad de nuestros profesionales sanitarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Registrarse como Profesional
              </Button>
            </Link>
            <Link to="/search">
              <Button size="lg" variant="outline" className="px-8 py-3">
                <Search className="w-5 h-5 mr-2" />
                Verificar Acreditación
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,245</div>
              <div className="text-sm text-gray-600">
                Profesionales Acreditados
              </div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">8</div>
              <div className="text-sm text-gray-600">
                Especialidades Médicas
              </div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">7</div>
              <div className="text-sm text-gray-600">Provincias Cubiertas</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">Tasa de Aprobación</div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Registro Profesional</CardTitle>
              <CardDescription>
                Proceso simplificado para el registro de profesionales
                sanitarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Sistema de registro paso a paso con validación automática y
                seguimiento del estado de las solicitudes.
              </p>
              <Link to="/register">
                <Button variant="outline" className="w-full">
                  Iniciar Registro
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Verificación Pública</CardTitle>
              <CardDescription>
                Consulta el estado de acreditación de cualquier profesional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Búsqueda pública para verificar la acreditación y validez del
                carnet profesional de cualquier sanitario.
              </p>
              <Link to="/search">
                <Button variant="outline" className="w-full">
                  Verificar Ahora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Panel de Control</CardTitle>
              <CardDescription>
                Gestión y estadísticas del personal sanitario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Dashboard completo con estadísticas, gestión de solicitudes y
                herramientas administrativas.
              </p>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  Acceder al Panel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Eres un profesional sanitario?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Regístrate en nuestro sistema para obtener tu carnet profesional
            oficial y formar parte del directorio de profesionales de la salud
            de Guinea Ecuatorial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Comenzar Registro
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/search">
              <Button size="lg" variant="outline">
                Verificar Acreditación
                <Search className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Ministerio de Sanidad
              </h3>
              <p className="text-gray-400">
                Garantizando la calidad y acreditación de los profesionales
                sanitarios en Guinea Ecuatorial.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces Útiles</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/register" className="hover:text-white">
                    Registro Profesional
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="hover:text-white">
                    Verificar Acreditación
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white">
                    Panel de Control
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <p className="text-gray-400">
                Ministerio de Sanidad y Bienestar Social
                <br />
                Malabo, Guinea Ecuatorial
                <br />
                Tel: +240 XXX XXX XXX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Ministerio de Sanidad - Guinea Ecuatorial. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
