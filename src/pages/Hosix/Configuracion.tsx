import React, { useState } from 'react';
import { Settings, Users, Lock, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsuariosList from '@/components/hosix/usuarios/UsuariosList';

const ConfiguracionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-1">
          Parámetros y configuraciones del HOSIX
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
          <TabsTrigger value="maestros">Maestros</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Parámetros básicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Centro</label>
                <input type="text" placeholder="Hospital General" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código Centro</label>
                <input type="text" placeholder="HG-001" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>CFA</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios */}
        <TabsContent value="usuarios" className="space-y-4">
          <UsuariosList />
        </TabsContent>

        {/* Permisos */}
        <TabsContent value="permisos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permisos y Roles</CardTitle>
              <CardDescription>Configure accesos por rol</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Administrador</p>
                    <p className="text-xs text-gray-500">Acceso total al sistema</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Médico</p>
                    <p className="text-xs text-gray-500">Acceso a módulos clínicos</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enfermería</p>
                    <p className="text-xs text-gray-500">Módulo de enfermería</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maestros */}
        <TabsContent value="maestros" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maestros del Sistema</CardTitle>
              <CardDescription>Configuración de datos maestros</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Departamentos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Servicios
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Medicamentos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Aseguradoras
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="seguridad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Parámetros de seguridad del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiempo de sesión (minutos)</label>
                <input type="number" placeholder="30" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Intentos fallidos permitidos</label>
                <input type="number" placeholder="3" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="2fa" defaultChecked />
                <label htmlFor="2fa" className="text-sm">Requerir autenticación de dos factores</label>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracionPage;
