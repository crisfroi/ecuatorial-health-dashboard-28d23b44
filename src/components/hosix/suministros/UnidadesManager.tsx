import React, { useState } from 'react';
import { useHosixSuministros } from '@/hooks/useHosixSuministros';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UnidadesManager() {
  const {
    unidadesDosis,
    isLoadingUnidadesDosis,
    unidadesCompra,
    isLoadingUnidadesCompra,
    unidadesDispensacion,
    isLoadingUnidadesDispensacion,
  } = useHosixSuministros();

  const [activeTab, setActiveTab] = useState('dosis');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gauge className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Unidades de Medida</h2>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dosis">Unidades de Dosis</TabsTrigger>
              <TabsTrigger value="compra">Unidades de Compra</TabsTrigger>
              <TabsTrigger value="dispensacion">Unidades de Dispensación</TabsTrigger>
            </TabsList>

            {/* TAB 1: UNIDADES DE DOSIS */}
            <TabsContent value="dosis" className="space-y-4">
              <UnidadesList
                title="Unidades de Dosis"
                data={unidadesDosis}
                isLoading={isLoadingUnidadesDosis}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                columns={['código', 'nombre', 'símbolo', 'estado']}
                renderRow={(unit: any) => (
                  <>
                    <TableCell className="font-mono text-sm font-medium">{unit.codigo}</TableCell>
                    <TableCell className="font-medium">{unit.nombre}</TableCell>
                    <TableCell className="text-center">{unit.simbolo || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={unit.activo ? 'default' : 'secondary'}>
                        {unit.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                  </>
                )}
              />
            </TabsContent>

            {/* TAB 2: UNIDADES DE COMPRA */}
            <TabsContent value="compra" className="space-y-4">
              <UnidadesList
                title="Unidades de Compra"
                data={unidadesCompra}
                isLoading={isLoadingUnidadesCompra}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                columns={['código', 'nombre', 'cantidad', 'estado']}
                renderRow={(unit: any) => (
                  <>
                    <TableCell className="font-mono text-sm font-medium">{unit.codigo}</TableCell>
                    <TableCell className="font-medium">{unit.nombre}</TableCell>
                    <TableCell className="text-center">
                      {unit.cantidad_unidades_basicas} unidades
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.activo ? 'default' : 'secondary'}>
                        {unit.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                  </>
                )}
              />
            </TabsContent>

            {/* TAB 3: UNIDADES DE DISPENSACIÓN */}
            <TabsContent value="dispensacion" className="space-y-4">
              <UnidadesList
                title="Unidades de Dispensación"
                data={unidadesDispensacion}
                isLoading={isLoadingUnidadesDispensacion}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                columns={['código', 'nombre', 'cantidad', 'estado']}
                renderRow={(unit: any) => (
                  <>
                    <TableCell className="font-mono text-sm font-medium">{unit.codigo}</TableCell>
                    <TableCell className="font-medium">{unit.nombre}</TableCell>
                    <TableCell className="text-center">
                      {unit.cantidad_unidades_basicas} unidades
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.activo ? 'default' : 'secondary'}>
                        {unit.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                  </>
                )}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">
            <strong>ℹ️ Nota:</strong> Las unidades de medida se utilizan para definir cómo se compran,
            dosifican y dispensan los artículos en el sistema de suministros.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente auxiliar para renderizar listas de unidades
interface UnidadesListProps {
  title: string;
  data: any[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columns: string[];
  renderRow: (item: any) => React.ReactNode;
}

function UnidadesList({
  title,
  data,
  isLoading,
  searchTerm,
  onSearchChange,
  columns,
  renderRow,
}: UnidadesListProps) {
  const filtered = data.filter(
    (item) =>
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex gap-2">
        <Input
          placeholder={`Buscar en ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total: {data.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">No hay registros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {columns.map((col) => (
                      <TableHead key={col} className="capitalize">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>{renderRow(item)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
