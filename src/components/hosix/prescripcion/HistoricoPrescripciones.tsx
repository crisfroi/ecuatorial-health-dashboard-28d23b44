import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, Calendar, Loader } from 'lucide-react'
import { format } from 'date-fns'

interface HistoricoPrescripcionesProps {
  pacienteId: string
  episodioId?: string
}

export default function HistoricoPrescripciones({
  pacienteId,
  episodioId
}: HistoricoPrescripcionesProps) {
  const { toast } = useToast()
  const [prescripciones, setPrescripciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarHistorico = async () => {
      setCargando(true)
      try {
        const query = supabase
          .from('hosix_cpoe_prescripciones')
          .select(`
            id,
            nombre_medicamento,
            dosis,
            unidad_dosis,
            via_administracion,
            frecuencia,
            estado,
            fecha_inicio,
            fecha_fin,
            instrucciones_paciente,
            observaciones_medicas,
            tiene_alerta_alergia,
            tiene_alerta_interaccion,
            tiene_alerta_dosis,
            medico:profesionales_sanitarios(id, nombre_completo)
          `)
          .eq('paciente_id', pacienteId)
          .order('fecha_inicio', { ascending: false })

        if (episodioId) {
          query.eq('episodio_id', episodioId)
        }

        const { data, error } = await query

        if (error) throw error
        setPrescripciones(data || [])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        console.error('Error cargando histórico:', errorMessage, error)
        toast({
          title: 'Error',
          description: errorMessage || 'No se pudo cargar el histórico',
          variant: 'destructive'
        })
      } finally {
        setCargando(false)
      }
    }

    cargarHistorico()
  }, [pacienteId, episodioId])

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      'activa': 'bg-green-100 text-green-800',
      'suspendida': 'bg-yellow-100 text-yellow-800',
      'completada': 'bg-gray-100 text-gray-800',
      'cancelada': 'bg-red-100 text-red-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin mr-2" />
          <p>Cargando histórico...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Histórico de Prescripciones</CardTitle>
            <CardDescription>
              {prescripciones.length} prescripción(es) en total
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {prescripciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay prescripciones registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescripciones.map((pres) => (
              <Card key={pres.id} className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Medicamento</p>
                      <p className="font-semibold text-orange-600">
                        {pres.nombre_medicamento}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dosis</p>
                      <p className="font-semibold">
                        {pres.dosis} {pres.unidad_dosis}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vía</p>
                      <p className="font-semibold">{pres.via_administracion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Frecuencia</p>
                      <p className="font-semibold">{pres.frecuencia}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Inicio</p>
                      <p>
                        {format(
                          new Date(pres.fecha_inicio),
                          'dd/MM/yyyy HH:mm'
                        )}
                      </p>
                    </div>
                    {pres.fecha_fin && (
                      <div>
                        <p className="text-gray-600">Fin</p>
                        <p>
                          {format(
                            new Date(pres.fecha_fin),
                            'dd/MM/yyyy HH:mm'
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Badge className={getEstadoColor(pres.estado)}>
                      {pres.estado}
                    </Badge>
                    <p className="text-sm text-gray-600">
                      Prescribido por: <strong>{pres.medico?.nombre_completo}</strong>
                    </p>
                  </div>

                  {pres.instrucciones_paciente && (
                    <div className="mb-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm font-semibold text-blue-900">
                        Instrucciones para el paciente:
                      </p>
                      <p className="text-sm text-blue-800">{pres.instrucciones_paciente}</p>
                    </div>
                  )}

                  {pres.observaciones_medicas && (
                    <div className="mb-3 p-3 bg-gray-100 rounded">
                      <p className="text-sm font-semibold">Observaciones médicas:</p>
                      <p className="text-sm">{pres.observaciones_medicas}</p>
                    </div>
                  )}

                  <div className="flex gap-1 pt-3 border-t">
                    {pres.tiene_alerta_alergia && (
                      <Badge variant="destructive" title="Alerta de alergia">
                        🚫 Alergia
                      </Badge>
                    )}
                    {pres.tiene_alerta_interaccion && (
                      <Badge variant="outline" title="Interacción">
                        ⚠️ Interacción
                      </Badge>
                    )}
                    {pres.tiene_alerta_dosis && (
                      <Badge variant="secondary" title="Dosis">
                        ⚠️ Dosis
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
  )
}
