import React, { useState } from 'react';
import { useHosixAlmacenes } from '@/hooks/useHosixAlmacenes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingDown } from 'lucide-react';

export default function StockManager() {
  const { stock, almacenes, lotes } = useHosixAlmacenes();
  const [filtro, setFiltro] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState<string>('');

  const stockFiltrado = stock.filter((s) => {
    const almacenMatch = !almacenFiltro || s.almacen_id === almacenFiltro;
    return almacenMatch;
  });

  const stockBajo = stockFiltrado.filter(
    (s) => s.stock_minimo && s.cantidad_disponible < s.stock_minimo
  );

  const stockCritico = stockFiltrado.filter((s) => s.cantidad_disponible <= 0);

  const getLotesParaArticulo = (stockId: string) => {
    return lotes.filter((l) => l.stock_id === stockId && l.activo);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Stock</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-3xl font-bold">{stockFiltrado.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Stock Bajo</p>
              <p className="text-3xl font-bold text-yellow-600">{stockBajo.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-red-600 font-medium">Stock Crítico</p>
              <p className="text-3xl font-bold text-red-600">{stockCritico.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Total Lotes</p>
              <p className="text-3xl font-bold">{lotes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stockCritico.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {stockCritico.length} artículos con stock crítico (0 unidades)
          </AlertDescription>
        </Alert>
      )}

      {stockBajo.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <TrendingDown className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            {stockBajo.length} artículos con stock por debajo del mínimo
          </AlertDescription>
        </Alert>
      )}

      {/* Búsqueda y filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por artículo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
        <select
          value={almacenFiltro}
          onChange={(e) => setAlmacenFiltro(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Stock por Almacén</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead className="text-right">Cantidad Actual</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Lotes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockFiltrado.map((s) => {
                  const almacen = almacenes.find((a) => a.id === s.almacen_id);
                  const lotesActivos = getLotesParaArticulo(s.id);
                  let estado = 'Normal';
                  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

                  if (s.cantidad_disponible <= 0) {
                    estado = 'Crítico';
                    variant = 'destructive';
                  } else if (s.stock_minimo && s.cantidad_disponible < s.stock_minimo) {
                    estado = 'Bajo';
                    variant = 'secondary';
                  }

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">Artículo {s.articulo_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{almacen?.nombre || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{s.cantidad_actual.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">{s.cantidad_reservada.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{s.cantidad_disponible.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-gray-600">{s.stock_minimo?.toFixed(2) || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={variant}>{estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{lotesActivos.length}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
