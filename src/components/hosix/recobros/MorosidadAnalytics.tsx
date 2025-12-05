import { useHosixRecobros } from '@/hooks/useHosixRecobros';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function MorosidadAnalytics() {
  const { morosidad, morosidadLoading } = useHosixRecobros();

  // Análisis de morosidad
  const totalDeudor = morosidad.reduce((sum, m) => sum + m.saldo_deudor, 0);
  const porVencer = morosidad.filter(m => m.dias_vencimiento < 30).length;
  const vencido = morosidad.filter(m => m.dias_vencimiento >= 30 && m.dias_vencimiento < 90).length;
  const critico = morosidad.filter(m => m.dias_vencimiento >= 90).length;

  if (morosidadLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deudor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDeudor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">saldo pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{porVencer}</div>
            <p className="text-xs text-muted-foreground">menos de 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{vencido}</div>
            <p className="text-xs text-muted-foreground">30-90 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{critico}</div>
            <p className="text-xs text-muted-foreground">más de 90 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Morosidad */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Morosidad por Aseguradora</CardTitle>
          <CardDescription>Deudas pendientes y estado de cobranza</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead className="text-right">Saldo Deudor</TableHead>
                  <TableHead className="text-center">Días Vencimiento</TableHead>
                  <TableHead>Facturas Vencidas</TableHead>
                  <TableHead className="text-right">Total Vencido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Pago</TableHead>
                  <TableHead>Próximo Seguimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {morosidad.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay registros de morosidad.
                    </TableCell>
                  </TableRow>
                ) : (
                  morosidad.map(m => {
                    let statusColor = 'bg-green-100 text-green-800';
                    if (m.dias_vencimiento >= 30 && m.dias_vencimiento < 90) {
                      statusColor = 'bg-yellow-100 text-yellow-800';
                    } else if (m.dias_vencimiento >= 90) {
                      statusColor = 'bg-red-100 text-red-800';
                    }

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.aseguradora_id}</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          ${m.saldo_deudor.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            m.dias_vencimiento < 30 ? 'bg-blue-100 text-blue-800' :
                            m.dias_vencimiento < 90 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {m.dias_vencimiento} días
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{m.facturas_vencidas}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${m.total_facturas_vencidas.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                            {m.status_cobranza.charAt(0).toUpperCase() + m.status_cobranza.slice(1).replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.fecha_ultimo_pago ? (
                            format(new Date(m.fecha_ultimo_pago), 'dd/MM/yyyy', { locale: es })
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {m.fecha_proximo_seguimiento ? (
                            format(new Date(m.fecha_proximo_seguimiento), 'dd/MM/yyyy', { locale: es })
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Cobranza</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">
                  {morosidad.filter(m => m.status_cobranza === 'activo').length}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">En Litigio</p>
                <p className="text-2xl font-bold text-orange-600">
                  {morosidad.filter(m => m.status_cobranza === 'en_litigio').length}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Incobrables</p>
                <p className="text-2xl font-bold text-red-600">
                  {morosidad.filter(m => m.status_cobranza === 'incobrable').length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
