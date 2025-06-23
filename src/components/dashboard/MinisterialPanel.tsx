
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileCheck, Clock, History, Download } from 'lucide-react';

const MinisterialPanel = () => {
  const pendingSignatures = [
    {
      id: 1,
      profesional: 'Dr. María José Nsue Ela',
      profesion: 'Médico General',
      fechaRevision: '2024-01-20',
      revisor: 'Dr. Carlos Obiang',
      urgencia: 'Alta'
    },
    {
      id: 2,
      profesional: 'Farm. José Antonio Mba',
      profesion: 'Farmacia',
      fechaRevision: '2024-01-18',
      revisor: 'Farm. Ana Nguema',
      urgencia: 'Media'
    }
  ];

  const statusHistory = [
    {
      id: 1,
      profesional: 'Enfermera Carmen Obiang',
      accion: 'Estado cambiado de "Recibido" a "Revisando"',
      usuario: 'Admin. Pedro Nsue',
      fecha: '2024-01-22 14:30',
      detalles: 'Revisión inicial completada'
    },
    {
      id: 2,
      profesional: 'Dr. Luis Mba Ela',
      accion: 'Solicitud aprobada y firmada',
      usuario: 'Ministro Juan Nsue',
      fecha: '2024-01-22 10:15',
      detalles: 'Carta de resolución generada'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">Panel Ministerial</h2>
        <Badge variant="destructive" className="ml-2">Acceso Restringido</Badge>
      </div>

      <Tabs defaultValue="signatures" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signatures" className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4" />
            <span>Pendientes de Firma</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historial de Cambios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span>Solicitudes Pendientes de Firma Ministerial</span>
                </span>
                <Badge variant="outline">{pendingSignatures.length} pendientes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Profesión</TableHead>
                    <TableHead>Fecha Revisión</TableHead>
                    <TableHead>Revisor</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSignatures.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.profesional}</TableCell>
                      <TableCell>{item.profesion}</TableCell>
                      <TableCell>{item.fechaRevision}</TableCell>
                      <TableCell>{item.revisor}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(item.urgencia)}>
                          {item.urgencia}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Revisar
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Firmar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Historial de Cambios de Estado</span>
                </span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Log
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusHistory.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{entry.profesional}</h4>
                      <span className="text-sm text-gray-500">{entry.fecha}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{entry.accion}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Por: {entry.usuario}</span>
                      <span>{entry.detalles}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Documentos de Resolución</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm mb-4">
            Los documentos de carta de resolución ministerial están disponibles solo para usuarios autorizados del comité.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start border-red-200 text-red-700 hover:bg-red-100">
              <Download className="w-4 h-4 mr-2" />
              Cartas de Resolución (Enero 2024)
            </Button>
            <Button variant="outline" className="justify-start border-red-200 text-red-700 hover:bg-red-100">
              <Download className="w-4 h-4 mr-2" />
              Registro de Firmas Ministeriales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinisterialPanel;
