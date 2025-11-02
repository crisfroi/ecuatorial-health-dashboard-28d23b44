import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Plus,
  Play,
  Eye,
  AlertTriangle,
  BarChart3,
  Users,
  Zap,
} from 'lucide-react';
import { useNominasPaymentSystem } from '@/hooks/useNominasPaymentSystemV2';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface NominasPaymentSystemV2Props {
  mes: number;
  ano: number;
  centroId?: string | null;
  userRole: string;
}

const estadoColors = {
  borrador: '#94a3b8',
  enviada: '#3b82f6',
  aprobada: '#10b981',
  rechazada: '#ef4444',
  pagada: '#8b5cf6',
};

export const NominasPaymentSystemV2: React.FC<NominasPaymentSystemV2Props> = ({
  mes,
  ano,
  centroId,
  userRole,
}) => {
  const {
    nominas,
    nominasLineas,
    pagos,
    resumen,
    selectedNomina,
    loading,
    setSelectedNomina,
    calcularNomina,
    aprobarNomina,
    rechazarNomina,
    procesarPagosMasivosDesdeNomina,
    confirmarPago,
    exportarNomina,
    isCalculandoNomina,
    isAprobandonNomina,
    isProcesandoPagosMasivos,
    isConfirmandoPago,
  } = useNominasPaymentSystem(mes, ano, centroId);

  const [searchTerm, setSearchTerm] = useState('');

  const canGenerateNomina = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);
  const canApproveNomina = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canProcessPayments = ['SUPER_ADMINISTRADOR', 'TESORERO'].includes(userRole);

  const distribucionEstados = [
    { name: 'Aprobadas', value: resumen.nominas_aprobadas, color: '#10b981' },
    { name: 'Pendientes', value: resumen.nominas_pendientes, color: '#3b82f6' },
    { name: 'Rechazadas', value: resumen.nominas_rechazadas, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente');
  const pagosConfirmados = pagos.filter(p => p.estado === 'confirmado');

  const handleCalcularNomina = () => {
    calcularNomina({
      mes,
      ano,
      centro_id: centroId || undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nóminas y Pagos de Guardias</h2>
          <p className="text-gray-600 mt-1">
            Sistema de nóminas de guardias médicas - Período {mes}/{ano}
          </p>
        </div>
        <div className="flex gap-2">
          {canGenerateNomina && (
            <Button
              onClick={handleCalcularNomina}
              disabled={isCalculandoNomina}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {isCalculandoNomina ? 'Calculando...' : 'Calcular Nómina'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Nóminas</p>
                <p className="text-2xl font-bold text-blue-600">{resumen.total_nominas}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{resumen.nominas_aprobadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-30" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{resumen.tasa_cumplimiento.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Neto</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(resumen.monto_total_neto)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pagado</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(resumen.monto_pagado)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pendiente</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(resumen.monto_pendiente_pago)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nominas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nominas" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Nóminas ({nominas.length})
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pagos ({pagos.length})
          </TabsTrigger>
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nominas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Nóminas</CardTitle>
              <CardDescription>Gestión de nóminas del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Profesionales</TableHead>
                      <TableHead>Total Neto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nominas.map((nomina) => (
                      <TableRow key={nomina.id}>
                        <TableCell>{nomina.mes}/{nomina.anio}</TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: estadoColors[nomina.estado as keyof typeof estadoColors] || '#e5e7eb',
                            }}
                            className="text-white"
                          >
                            {nomina.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{nomina.cantidad_lineas}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(nomina.total_neto)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {canApproveNomina && nomina.estado === 'enviada' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => aprobarNomina(nomina.id)}
                                  disabled={isAprobandonNomina}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rechazarNomina(nomina.id)}
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {canProcessPayments && nomina.estado === 'aprobada' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => procesarPagosMasivosDesdeNomina(nomina.id)}
                                disabled={isProcesandoPagosMasivos}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportarNomina(nomina.id, 'excel')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{pagosPendientes.length}</div>
                <p className="text-sm text-gray-600 mt-2">
                  Total: {formatCurrency(pagosPendientes.reduce((sum, p) => sum + (p.monto || p.importe || 0), 0))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pagos Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{pagosConfirmados.length}</div>
                <p className="text-sm text-gray-600 mt-2">
                  Total: {formatCurrency(pagosConfirmados.reduce((sum, p) => sum + (p.monto || p.importe || 0), 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell className="font-bold">{formatCurrency(pago.monto || pago.importe || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={pago.estado === 'confirmado' ? 'default' : 'outline'}>
                            {pago.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{pago.forma_pago || pago.metodo_pago || '-'}</TableCell>
                        <TableCell>
                          {pago.estado === 'pendiente' && canProcessPayments && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmarPago(pago.id)}
                              disabled={isConfirmandoPago}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-4">
          {distribucionEstados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Nóminas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={distribucionEstados}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionEstados.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} nóminas`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Profesionales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{resumen.total_profesionales}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Bruto Total</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(resumen.monto_total_bruto)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Neto Total</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(resumen.monto_total_neto)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Cumplimiento</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{resumen.tasa_cumplimiento.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
