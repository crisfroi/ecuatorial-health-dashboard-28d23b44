import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SolicitudEstablecimientoForm from "@/components/registration/SolicitudEstablecimientoForm";
import { ArrowLeft } from "lucide-react";

const SolicitudEstablecimiento = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Solicitud de Alta de Establecimiento Sanitario</h1>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Inicio
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Panel</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complete el formulario con la información del establecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <SolicitudEstablecimientoForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SolicitudEstablecimiento;
