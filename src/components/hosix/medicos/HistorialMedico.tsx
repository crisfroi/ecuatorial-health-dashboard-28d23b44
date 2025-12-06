import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useHosixMedicos from '@/hooks/useHosixMedicos'
import { Loader2, AlertCircle, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HistorialMedicoProps {
  pacienteId: string
}

export const HistorialMedico: React.FC<HistorialMedicoProps> = ({ pacienteId }) => {
  const { useConsultasPaciente, useDiagnosticosPaciente, useDiarioClinico } =
    useHosixMedicos()
  const { data: consultas = [], isLoading: loadingConsultas } =
    useConsultasPaciente(pacienteId)
  const { data: diagnosticos = [], isLoading: loadingDiagnosticos } =
    useDiagnosticosPaciente(pacienteId)
  const { data: diario = [], isLoading: loadingDiario } = useDiarioClinico(pacienteId)

  const [filtroConsulta, setFiltroConsulta] = useState('')
  const [filtroDiagnostico, setFiltroDiagnostico] = useState('')

  // Filtrar y ordenar
  const consultasFiltradas = consultas
    .filter(
      (c) =>
        !filtroConsulta ||
        c.motivo_consulta?.toLowerCase().includes(filtroConsulta.toLowerCase()) ||
        c.impresion_clinica?.toLowerCase().includes(filtroConsulta.toLowerCase())
    )
    .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())

  const diagnosticosFiltrados = diagnosticos
    .filter(
      (d) =>
        !filtroDiagnostico ||
        d.codigo_cie10?.includes(filtroDiagnostico) ||
        d.nombre_diagnostico?.toLowerCase().includes(filtroDiagnostico.toLowerCase())
    )
    .sort((a, b) => new Date(b.fecha_diagnostico).getTime() - new Date(a.fecha_diagnostico).getTime())

  return (
    <Tabs defaultValue="consultas" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="consultas">
          Consultas ({consultas.length})
        </TabsTrigger>
        <TabsTrigger value="diagnosticos">
          Diagnósticos ({diagnosticos.length})
        </TabsTrigger>
        <TabsTrigger value="diario">
          Diario Clínico ({diario.length})
        </TabsTrigger>
      </TabsList>

      {/* TAB: CONSULTAS */}
      <TabsContent value="consultas" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Consultas Médicas</CardTitle>
            <CardDescription>
              Todas las consultas realizadas al paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por motivo o impresión clínica..."
              value={filtroConsulta}
              onChange={(e) => setFiltroConsulta(e.target.value)}
            />

            {loadingConsultas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : consultasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay consultas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultasFiltradas.map((consulta) => (
                  <Card key={consulta.id} className="bg-blue-50">
                    <CardContent className="pt-6 space-y-3">
                      {/* Encabezado */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {format(new Date(consulta.fecha_inicio), 'PPp', {
                                locale: es,
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            Motivo: {consulta.motivo_consulta}
                          </p>
                        </div>
                        {consulta.requiere_hospitalizacion && (
                          <Badge variant="destructive">Requiere Hospitalización</Badge>
                        )}
                      </div>

                      {/* Contenido */}
                      {consulta.historia_enfermedad_actual && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Historia de Enfermedad Actual
                          </p>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded">
                            {consulta.historia_enfermedad_actual}
                          </p>
                        </div>
                      )}

                      {consulta.examen_fisico && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Examen Físico
                          </p>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded">
                            {consulta.examen_fisico}
                          </p>
                        </div>
                      )}

                      {consulta.impresion_clinica && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Impresión Clínica
                          </p>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded">
                            {consulta.impresion_clinica}
                          </p>
                        </div>
                      )}

                      {consulta.plan_manejo && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Plan de Manejo
                          </p>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded">
                            {consulta.plan_manejo}
                          </p>
                        </div>
                      )}

                      {/* Flags */}
                      <div className="flex flex-wrap gap-2">
                        {consulta.requiere_interconsulta && (
                          <Badge variant="outline">
                            Interconsulta: {consulta.especialidad_interconsulta}
                          </Badge>
                        )}
                        {consulta.requiere_seguimiento && (
                          <Badge variant="outline">
                            Seguimiento en {consulta.dias_proximo_control} días
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: DIAGNÓSTICOS */}
      <TabsContent value="diagnosticos" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Diagnósticos del Paciente</CardTitle>
            <CardDescription>
              Diagnósticos activos y resueltos (CIE-10/SNOMED CT)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por código CIE-10 o nombre..."
              value={filtroDiagnostico}
              onChange={(e) => setFiltroDiagnostico(e.target.value)}
            />

            {loadingDiagnosticos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : diagnosticosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay diagnósticos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Activos */}
                {diagnosticosFiltrados.filter((d) => d.estado === 'activo').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">
                      Diagnósticos Activos
                    </h4>
                    <div className="space-y-2">
                      {diagnosticosFiltrados
                        .filter((d) => d.estado === 'activo')
                        .map((diag) => (
                          <Card key={diag.id} className="bg-green-50">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium">
                                    {diag.nombre_diagnostico}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline">
                                      CIE-10: {diag.codigo_cie10}
                                    </Badge>
                                    <Badge variant="outline">
                                      {diag.tipo_diagnostico}
                                    </Badge>
                                  </div>
                                </div>
                                {diag.severidad && (
                                  <Badge
                                    variant={
                                      diag.severidad === 'crítica'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                  >
                                    {diag.severidad}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {format(new Date(diag.fecha_diagnostico), 'PPp', {
                                  locale: es,
                                })}
                              </p>
                              {diag.observaciones && (
                                <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                                  {diag.observaciones}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Resueltos */}
                {diagnosticosFiltrados.filter((d) => d.estado === 'resuelto').length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-700">
                      Diagnósticos Resueltos
                    </h4>
                    <div className="space-y-2">
                      {diagnosticosFiltrados
                        .filter((d) => d.estado === 'resuelto')
                        .map((diag) => (
                          <Card key={diag.id} className="bg-gray-50 opacity-75">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium line-through">
                                    {diag.nombre_diagnostico}
                                  </p>
                                  <Badge variant="outline" className="mt-1">
                                    {diag.codigo_cie10}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">
                                Resuelto:{' '}
                                {diag.fecha_resolucion &&
                                  format(new Date(diag.fecha_resolucion), 'PPp', {
                                    locale: es,
                                  })}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: DIARIO CLÍNICO */}
      <TabsContent value="diario" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Diario Clínico</CardTitle>
            <CardDescription>
              Notas de evolución y seguimiento del paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDiario ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : diario.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay entradas en el diario</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diario
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .map((entrada) => (
                    <Card key={entrada.id} className="bg-yellow-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-sm">
                              {entrada.tipo_entrada.charAt(0).toUpperCase() +
                                entrada.tipo_entrada.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {format(new Date(entrada.created_at), 'PPp', {
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 bg-white p-2 rounded">
                          {entrada.contenido}
                        </p>
                        {entrada.firmada && (
                          <Badge className="mt-2" variant="outline">
                            ✓ Firmada
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export default HistorialMedico
