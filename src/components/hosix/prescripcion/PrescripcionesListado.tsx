import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, Loader } from 'lucide-react'

interface PrescripcionesListadoProps {
  onSelectPaciente?: (paciente: { pacienteId: string; episodioId?: string }) => void
}

export default function PrescripcionesListado({ onSelectPaciente }: PrescripcionesListadoProps) {
  const { toast } = useToast()
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarOrdenes = async () => {
      setCargando(true)
      try {
        const { data, error } = await supabase
          .from('hosix_cpoe_prescripciones')
          .select(`
            id,
            paciente_id,
            episodio_id,
            nombre_medicamento,
            dosis,
            unidad_dosis,
            via_administracion,
            estado,
            fecha_inicio,
            tiene_alerta_alergia,
            tiene_alerta_interaccion,
            tiene_alerta_dosis,
            paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido),
            medico:profesionales_sanitarios(id, nombre_completo)
          `)
          .eq('estado', 'activa')
          .order('fecha_inicio', { ascending: false })

        if (error) throw error
        setOrdenes(data || [])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        console.error('Error cargando órdenes:', errorMessage, error)
        toast({
          title: 'Error',
          description: errorMessage || 'No se pudieron cargar las órdenes',
          variant: 'destructive'
        })
      } finally {
        setCargando(false)
      }
    }

    cargarOrdenes()
  }, [])

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin mr-2" />
          <p>Cargando órdenes...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes Médicas Activas</CardTitle>
        <CardDescription>
          {ordenes.length} prescripción(es) pendiente(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ordenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay órdenes pendientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PPI</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dosis</TableHead>
                  <TableHead>Vía</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-semibold">{orden.paciente?.ppi}</TableCell>
                    <TableCell>
                      {orden.paciente?.primer_nombre} {orden.paciente?.primer_apellido}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">
                      {orden.nombre_medicamento}
                    </TableCell>
                    <TableCell>
                      {orden.dosis} {orden.unidad_dosis}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{orden.via_administracion}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {orden.tiene_alerta_alergia && (
                          <Badge variant="destructive" title="Alerta de alergia">
                            🚫
                          </Badge>
                        )}
                        {orden.tiene_alerta_interaccion && (
                          <Badge variant="outline" title="Interacción medicamentosa">
                            ⚠️
                          </Badge>
                        )}
                        {orden.tiene_alerta_dosis && (
                          <Badge variant="secondary" title="Alerta de dosis">
                            ⚠️
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{orden.medico?.nombre_completo}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onSelectPaciente?.({
                            pacienteId: orden.paciente_id,
                            episodioId: orden.episodio_id
                          })
                        }
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
