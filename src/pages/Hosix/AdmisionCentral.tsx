import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogIn, BarChart3, AlertCircle } from 'lucide-react'
import AdmisionCentralForm from '@/components/hosix/admision/AdmisionCentralForm'
import AdmisionesListado from '@/components/hosix/admision/AdmisionesListado'
import AdmisionesEstadisticas from '@/components/hosix/admision/AdmisionesEstadisticas'

export default function AdmisionCentral() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <LogIn className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admisión Central</h1>
          <p className="text-gray-600">Punto de entrada unificado para urgencias, consulta externa e hospitalización</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="admitir" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admitir" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Nueva Admisión
          </TabsTrigger>
          <TabsTrigger value="listado" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Admisiones Activas
          </TabsTrigger>
          <TabsTrigger value="estadisticas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Nueva Admisión */}
        <TabsContent value="admitir" className="space-y-4">
          <AdmisionCentralForm
            onSuccess={() => {
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        </TabsContent>

        {/* Listado de Admisiones */}
        <TabsContent value="listado" className="space-y-4">
          <AdmisionesListado refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-4">
          <AdmisionesEstadisticas />
        </TabsContent>
      </Tabs>
    </div>
  )
}
