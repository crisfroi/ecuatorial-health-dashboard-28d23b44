import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Link2,
  AlertCircle,
  Zap,
  Database,
} from 'lucide-react';
import { useBiometricSync } from '@/hooks/useBiometricSync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BiometricSyncPanelProps {
  defaultDeviceUrl?: string;
  defaultDeviceSn?: string;
  autoSyncInterval?: number;
}

export default function BiometricSyncPanel({
  defaultDeviceUrl = '',
  defaultDeviceSn = '',
  autoSyncInterval = 0, // No auto-sync by default
}: BiometricSyncPanelProps) {
  const [deviceUrl, setDeviceUrl] = useState(defaultDeviceUrl);
  const [deviceSn, setDeviceSn] = useState(defaultDeviceSn);
  const [devices, setDevices] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { syncStatus, syncRecords, getDevices, getRecords, getSyncHistory, getDeviceStatus } =
    useBiometricSync({
      deviceUrl,
      deviceSn,
      autoSyncInterval,
    });

  // Load devices
  const handleLoadDevices = async () => {
    setLoadingDevices(true);
    try {
      const devs = await getDevices();
      setDevices(devs);
      if (devs.length === 0) {
        toast({
          title: 'No hay dispositivos',
          description: 'No se encontraron dispositivos en el SDK configurado',
          variant: 'default',
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar dispositivos';
      toast({
        title: 'Error al cargar dispositivos',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoadingDevices(false);
    }
  };

  // Load records
  const handleLoadRecords = async () => {
    setLoadingRecords(true);
    try {
      const recs = await getRecords();
      setRecords(recs);
      if (recs.length === 0) {
        toast({
          title: 'No hay registros',
          description: 'No se encontraron registros en el SDK configurado',
          variant: 'default',
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar registros';
      toast({
        title: 'Error al cargar registros',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  // Load sync history
  const handleLoadHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getSyncHistory();
      setSyncHistory(history);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load history on mount
  useEffect(() => {
    handleLoadHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isConnected = deviceUrl.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Configuración de Dispositivo Biométrico
          </CardTitle>
          <CardDescription>
            Configura la conexión con tu SDK de asistencia biométrica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">URL del SDK (ej: http://localhost:5000)</label>
            <Input
              placeholder="https://tu-sdk.render.com"
              value={deviceUrl}
              onChange={(e) => setDeviceUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Serial del Dispositivo (opcional)</label>
            <Input
              placeholder="SN123456789"
              value={deviceSn}
              onChange={(e) => setDeviceSn(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={syncRecords}
              disabled={!isConnected || syncStatus.isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
              {syncStatus.isLoading ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </Button>

            <Button
              onClick={handleLoadDevices}
              disabled={!isConnected || loadingDevices}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loadingDevices ? 'Cargando...' : 'Cargar Dispositivos'}
            </Button>
          </div>

          {syncStatus.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{syncStatus.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Estado de Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Último Sincronización</div>
                <div className="font-mono text-sm">
                  {syncStatus.lastSync
                    ? format(syncStatus.lastSync, 'dd/MM/yyyy HH:mm', { locale: es })
                    : 'Nunca'}
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Registros Sincronizados</div>
                <div className="text-2xl font-bold text-blue-600">{syncStatus.recordsSynced}</div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Estado</div>
                <Badge className={`${getStatusColor(syncStatus.status)}`}>
                  {syncStatus.status === 'syncing'
                    ? 'Sincronizando...'
                    : syncStatus.status === 'success'
                      ? 'Exitoso'
                      : syncStatus.status === 'error'
                        ? 'Error'
                        : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for details */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Detalles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="devices">
              <TabsList>
                <TabsTrigger value="devices">Dispositivos</TabsTrigger>
                <TabsTrigger value="records">Registros</TabsTrigger>
                <TabsTrigger value="history">Historial de Sincronización</TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="space-y-4 mt-4">
                <Button
                  onClick={handleLoadDevices}
                  disabled={loadingDevices}
                  size="sm"
                  variant="outline"
                >
                  {loadingDevices ? 'Cargando...' : 'Actualizar Dispositivos'}
                </Button>

                {devices.length > 0 ? (
                  <div className="space-y-2">
                    {devices.map((device: any, idx) => (
                      <div key={idx} className="p-3 border rounded bg-gray-50">
                        <div className="font-medium text-sm">{device.deviceName || device.sn}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          SN: {device.sn || 'N/A'} | Modelo: {device.model || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {loadingDevices ? 'Cargando dispositivos...' : 'No hay dispositivos disponibles'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="records" className="space-y-4 mt-4">
                <Button
                  onClick={handleLoadRecords}
                  disabled={loadingRecords}
                  size="sm"
                  variant="outline"
                >
                  {loadingRecords ? 'Cargando...' : 'Actualizar Registros'}
                </Button>

                {records.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {records.slice(0, 20).map((record: any, idx) => (
                      <div key={idx} className="p-3 border rounded text-sm bg-gray-50">
                        <div className="font-medium">
                          Empleado ID: {record.enroll_id} | Modo: {record.mode}
                        </div>
                        <div className="text-xs text-gray-600">
                          {record.records_time} | Temp: {record.temperature || 'N/A'}°C
                        </div>
                      </div>
                    ))}
                    {records.length > 20 && (
                      <div className="text-center text-xs text-gray-500 py-2">
                        +{records.length - 20} más registros...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {loadingRecords ? 'Cargando registros...' : 'No hay registros disponibles'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <Button
                  onClick={handleLoadHistory}
                  disabled={loadingHistory}
                  size="sm"
                  variant="outline"
                >
                  {loadingHistory ? 'Cargando...' : 'Actualizar Historial'}
                </Button>

                {syncHistory.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {syncHistory.map((log: any, idx) => (
                      <div key={idx} className="p-3 border rounded flex items-start gap-3">
                        <div className="mt-1">{getStatusIcon(log.status)}</div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium flex items-center gap-2">
                            {log.device_sn || 'Dispositivo'}
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusColor(log.status)}`}
                            >
                              {log.status === 'success' ? 'Exitoso' : 'Error'}
                            </Badge>
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            Registros: {log.records_synced}
                          </div>
                          {log.error_message && (
                            <div className="text-red-600 text-xs mt-1">{log.error_message}</div>
                          )}
                          <div className="text-gray-500 text-xs mt-2">
                            {format(new Date(log.synced_at), 'dd/MM/yyyy HH:mm:ss', {
                              locale: es,
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay historial de sincronización
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      {!isConnected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mt-2">
              <p className="font-medium mb-2">Para comenzar:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Despliega el SDK en Render (ver documentación)</li>
                <li>Ingresa la URL del SDK en el campo arriba</li>
                <li>Haz clic en "Sincronizar Ahora" para probar la conexión</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
