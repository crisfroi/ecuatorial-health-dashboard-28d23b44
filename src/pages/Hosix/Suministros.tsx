import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FamiliasManager from '@/components/hosix/suministros/FamiliasManager';
import GruposManager from '@/components/hosix/suministros/GruposManager';
import UnidadesManager from '@/components/hosix/suministros/UnidadesManager';
import UbicacionesManager from '@/components/hosix/suministros/UbicacionesManager';
import ArticulosManager from '@/components/hosix/suministros/ArticulosManager';
import { Package, Folder, Layers, Gauge, MapPin, TestTube } from 'lucide-react';
import { useHosixSuministros } from '@/hooks/useHosixSuministros';

export default function Suministros() {
  const {
    familias,
    grupos,
    articulos,
    unidadesDosis,
    unidadesCompra,
    unidadesDispensacion,
    ubicaciones,
    tiposEnvase,
  } = useHosixSuministros();

  const [activeTab, setActiveTab] = useState('resumen');

  const medicamentosCount = articulos.filter((a) => a.es_medicamento && a.activo).length;
  const materialesCount = articulos.filter((a) => !a.es_medicamento && a.activo).length;
  const medicamentosRefrigerados = articulos.filter(
    (a) => a.es_medicamento && a.requiere_refrigeracion && a.activo
  ).length;
  const medicamentosControlados = articulos.filter(
    (a) => a.es_medicamento && a.controlado && a.activo
  ).length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Suministros</h1>
          <p className="text-gray-600">ADM 10.0 - Administración de artículos y medicamentos</p>
        </div>
      </div>

      {/* Dashboard de Resumen */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Familias</p>
                  <p className="text-3xl font-bold">{familias.length}</p>
                </div>
                <Folder className="h-10 w-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Grupos</p>
                  <p className="text-3xl font-bold">{grupos.length}</p>
                </div>
                <Layers className="h-10 w-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Artículos</p>
                  <p className="text-3xl font-bold">{articulos.filter((a) => a.activo).length}</p>
                </div>
                <TestTube className="h-10 w-10 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ubicaciones</p>
                  <p className="text-3xl font-bold">{ubicaciones.length}</p>
                </div>
                <MapPin className="h-10 w-10 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medicamentos - Resumen */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Medicamentos Activos</p>
              <p className="text-3xl font-bold text-green-600">{medicamentosCount}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Materiales Activos</p>
              <p className="text-3xl font-bold text-orange-600">{materialesCount}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Medicamentos Controlados</p>
              <p className="text-3xl font-bold text-red-600">{medicamentosControlados}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información Adicional - Resumen */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Unidades de Medida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unidades de Dosis:</span>
                <span className="font-semibold">{unidadesDosis.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unidades de Compra:</span>
                <span className="font-semibold">{unidadesCompra.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unidades de Dispensación:</span>
                <span className="font-semibold">{unidadesDispensacion.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Características Especiales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Requieren Refrigeración:</span>
                <span className="font-semibold">{medicamentosRefrigerados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tipos de Envase:</span>
                <span className="font-semibold">{tiposEnvase.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Principales */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="familias">Familias</TabsTrigger>
              <TabsTrigger value="grupos">Grupos</TabsTrigger>
              <TabsTrigger value="unidades">Unidades</TabsTrigger>
              <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
            </TabsList>

            {/* Nota: La segunda sección con tabs para Artículos */}
            {activeTab !== 'resumen' && (
              <div className="mt-6">
                <TabsContent value="familias">
                  <FamiliasManager />
                </TabsContent>

                <TabsContent value="grupos">
                  <GruposManager />
                </TabsContent>

                <TabsContent value="unidades">
                  <UnidadesManager />
                </TabsContent>

                <TabsContent value="ubicaciones">
                  <UbicacionesManager />
                </TabsContent>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Artículos en Tab Separado */}
      <Card>
        <CardContent className="pt-6">
          <ArticulosManager />
        </CardContent>
      </Card>

      {/* Instrucciones de Uso */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <span>📖</span> Instrucciones de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">1. Familias</h4>
            <p className="text-gray-600">
              Define las familias principales de artículos (Medicamentos, Materiales, Equipos, etc.)
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">2. Grupos</h4>
            <p className="text-gray-600">
              Agrupa artículos dentro de cada familia para mejor organización
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">3. Unidades de Medida</h4>
            <p className="text-gray-600">
              Define cómo se compran (unidad de compra), dispensan (unidad de dispensación) y dosifican
              (unidad de dosis)
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">4. Ubicaciones</h4>
            <p className="text-gray-600">
              Configura los lugares de almacenamiento con controles de temperatura y humedad si es necesario
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">5. Artículos</h4>
            <p className="text-gray-600">
              Registra los artículos/medicamentos con sus códigos, códigos de barras, especificaciones y
              ubicaciones
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
