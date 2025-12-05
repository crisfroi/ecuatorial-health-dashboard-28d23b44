import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Users, FileText, BarChart3, UserPlus, Hospital } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800"
              alt="Guinea Ecuatorial Salud"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sistema de Gestión de Profesionales Sanitarios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Plataforma integral para el registro, gestión y seguimiento de
            profesionales de la salud en Guinea Ecuatorial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Registrarse como Profesional
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="px-8 py-3">
                Acceder al Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/hosix/login">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
              >
                <Hospital className="w-5 h-5 mr-2" />
                Sistema HOSIX
              </Button>
            </Link>
          </div>
        </div>

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
              <p className="text-gray-600">
                Sistema de registro paso a paso con validación automática y
                seguimiento del estado de las solicitudes.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Gestión de Documentos</CardTitle>
              <CardDescription>
                Almacenamiento seguro y organizado de documentos profesionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Carga y gestión de títulos, certificados y documentos de
                identificación de manera segura.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Estadísticas y Reportes</CardTitle>
              <CardDescription>
                Análisis detallado del personal sanitario del país
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dashboard interactivo con estadísticas por regiones,
                especialidades y centros de salud.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Eres un profesional sanitario?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Regístrate en nuestro sistema para formar parte del directorio
            oficial de profesionales de la salud de Guinea Ecuatorial
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Comenzar Registro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
