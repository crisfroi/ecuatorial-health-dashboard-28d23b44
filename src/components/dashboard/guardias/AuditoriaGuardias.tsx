import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Eye, Search, Filter, Calendar, AlertTriangle } from 'lucide-react';

const AuditoriaGuardias: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('ultima_semana');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Auditoría y Trazabilidad
          </h2>
          <p className="text-gray-600">
            Registro completo de cambios y accesos al sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los eventos</SelectItem>
              <SelectItem value="login">Inicios de sesión</SelectItem>
              <SelectItem value="registro">Registros</SelectItem>
              <SelectItem value="validacion">Validaciones</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="modificacion">Modificaciones</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filtroFecha} onValueChange={setFiltroFecha}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="ultima_semana">Última semana</SelectItem>
              <SelectItem value="ultimo_mes">Último mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
            </SelectContent>
          </Select>
          
          <Button size="sm" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">127</div>
            <p className="text-xs text-muted-foreground">Acciones registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23</div>
            <p className="text-xs text-muted-foreground">En las últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-muted-foreground">Eventos sospechosos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validaciones</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">15</div>
            <p className="text-xs text-muted-foreground">Hoy</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoría</CardTitle>
          <CardDescription>
            Registro cronológico de todas las actividades del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ejemplo de entradas de log */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-600">LOGIN</Badge>
                <div>
                  <p className="font-medium">Dr. María González</p>
                  <p className="text-sm text-gray-600">Inicio de sesión exitoso</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">09:45</p>
                <p className="text-xs text-gray-600">IP: 192.168.1.45</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-blue-600">REGISTRO</Badge>
                <div>
                  <p className="font-medium">Dr. José Martín</p>
                  <p className="text-sm text-gray-600">Nueva guardia registrada</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">09:23</p>
                <p className="text-xs text-gray-600">ID: GRD-2024-001</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-purple-600">VALIDACIÓN</Badge>
                <div>
                  <p className="font-medium">Dra. Ana Ruiz</p>
                  <p className="text-sm text-gray-600">Guardia validada</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">08:56</p>
                <p className="text-xs text-gray-600">ID: GRD-2024-002</p>
              </div>
            </div>

            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">Mostrando 3 de 127 eventos de hoy</p>
              <Button variant="outline" size="sm" className="mt-2">
                Ver todos los eventos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaGuardias;
