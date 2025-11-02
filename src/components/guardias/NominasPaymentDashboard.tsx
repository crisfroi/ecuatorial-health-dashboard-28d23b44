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
import { useNominasPaymentSystem } from '@/hooks/useNominasPaymentSystem';
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

interface NominasPaymentDashboardProps {
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

export const NominasPaymentDashboard: React.FC<NominasPaymentDashboardProps> = ({
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
  const [viewMode, setViewMode] = useState<'resumen' | 'nominas' | 'pagos'>('resumen');

  const canGenerateNomina = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);
  const canApproveNomina = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canProcessPayments = ['SUPER_ADMINISTRADOR', 'TESORERO'].includes(userRole);

  // Datos para gráficos
  const distribucionEstados = [
    { name: 'Aprobadas', value: resumen.nominas_aprobadas, color: '#10b981' },
    { name: 'Pendientes', value: resumen.nominas_pendientes, color: '#3b82f6' },
    { name: 'Rechazadas', value: resumen.nominas_rechazadas, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const distribucionMontos = [
    { name: 'Pagado', value: resumen.monto_pagado, color: '#8b5cf6' },
    { name: 'Pendiente', value: resumen.monto_pendiente_pago, color: '#fbbf24' },
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
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nóminas y Pagos</h2>
          <p className="text-gray-600 mt-1">
            Sistema integrado de nóminas de guardias y procesamiento de pagos
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

      {/* KPI Cards */}
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
            <p className="text-xs text-gray-500 mt-2">{resumen.tasa_cumplimiento.toFixed(0)}% aprobadas</p>
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

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="nominas" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Nóminas ({nominas.length})
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pagos ({pagos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribución de Estados */}
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

            {/* Distribución de Pagos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distribucionMontos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="value" fill="#3b82f6" name="Monto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Detallado */}
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
                  <p className="text-xs text-gray-600">Monto Bruto</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(resumen.monto_total_bruto)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Total Neto</p>
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

        {/* Tab: Nóminas */}
        <TabsContent value="nominas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Lista de Nóminas</CardTitle>
                <CardDescription>Gestión de nóminas del período</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar nómina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Profesionales</TableHead>
                      <TableHead>Monto Bruto</TableHead>
                      <TableHead>Monto Neto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nominas.map((nomina) => (
                      <TableRow key={nomina.id}>
                        <TableCell className="font-mono text-sm">{nomina.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              nomina.estado === 'aprobada'
                                ? 'default'
                                : nomina.estado === 'rechazada'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {nomina.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{nomina.cantidad_lineas}</TableCell>
                        <TableCell>{formatCurrency(nomina.total_bruto)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(nomina.total_neto)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedNomina(nomina.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles de Nómina</DialogTitle>
                                </DialogHeader>
                                <DetallesNominaDialog nominaId={nomina.id} />
                              </DialogContent>
                            </Dialog>

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

        {/* Tab: Pagos */}
        <TabsContent value="pagos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{pagosPendientes.length}</div>
                <p className="text-sm text-gray-600 mt-2">
                  Monto: {formatCurrency(pagosPendientes.reduce((sum, p) => sum + (p.monto || 0), 0))}
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
                  Monto: {formatCurrency(pagosConfirmados.reduce((sum, p) => sum + (p.monto || 0), 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{pago.profesional_nombre || 'Sin nombre'}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(pago.monto)}</TableCell>
                        <TableCell>{pago.forma_pago}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pago.estado === 'confirmado'
                                ? 'default'
                                : pago.estado === 'rechazado'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {pago.estado}
                          </Badge>
                        </TableCell>
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
      </Tabs>
    </div>
  );
};

// Componente auxiliar para detalles
const DetallesNominaDialog: React.FC<{ nominaId: string }> = ({ nominaId }) => {
  const {
    nominasLineas,
  } = useNominasPaymentSystem(new Date().getMonth() + 1, new Date().getFullYear());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF',
    }).format(amount);
  };

  const lineas = nominasLineas.filter(l => l.nomina_id === nominaId);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profesional</TableHead>
            <TableHead>Guardias</TableHead>
            <TableHead>Horas</TableHead>
            <TableHead>Monto Neto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineas.map((linea) => (
            <TableRow key={linea.id}>
              <TableCell>{linea.profesional_nombre || linea.profesional_id}</TableCell>
              <TableCell>{linea.cantidad_guardias}</TableCell>
              <TableCell>{linea.horas_totales.toFixed(1)}h</TableCell>
              <TableCell className="font-bold">{formatCurrency(linea.monto_neto)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
