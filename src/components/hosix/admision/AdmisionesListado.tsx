import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, Loader } from 'lucide-react'

interface AdmisionesListadoProps {
  refreshTrigger?: number
}

export default function AdmisionesListado({ refreshTrigger = 0 }: AdmisionesListadoProps) {
  const { toast } = useToast()
  const [admisiones, setAdmisiones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarAdmisiones = async () => {
      setCargando(true)
      try {
        const { data: urgencias } = await supabase
          .from('hosix_urgencias_episodios')
          .select(`
            id, paciente_id, servicio_id, motivo_consulta, clasificacion_inicial, 
            created_at,
            paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido),
            servicio:hosix_servicios(id, nombre)
          `)
          .eq('estado', 'activo')
          .order('created_at', { ascending: false })
          .limit(20)

        const { data: hospitalizaciones } = await supabase
          .from('hosix_hospitalizacion_episodios')
          .select(`
            id, paciente_id, servicio_id, motivo_ingreso, 
            created_at,
            paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido),
            servicio:hosix_servicios(id, nombre)
          `)
          .eq('estado', 'activo')
          .order('created_at', { ascending: false })
          .limit(20)

        const combinadas = [
          ...(urgencias || []).map(u => ({ ...u, tipo: 'urgencia' })),
          ...(hospitalizaciones || []).map(h => ({ ...h, tipo: 'hospitalizacion' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setAdmisiones(combinadas)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
        console.error('Error cargando admisiones:', errorMessage, error)
        toast({
          title: 'Error',
          description: errorMessage || 'No se pudieron cargar las admisiones',
          variant: 'destructive'
        })
      } finally {
        setCargando(false)
      }
    }

    cargarAdmisiones()
  }, [refreshTrigger])

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin mr-2" />
          <p>Cargando admisiones...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admisiones Activas</CardTitle>
        <CardDescription>
          {admisiones.length} paciente(s) admitido(s) en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {admisiones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay admisiones activas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PPI</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admisiones.map((adm) => (
                  <TableRow key={`${adm.tipo}-${adm.id}`}>
                    <TableCell className="font-semibold">{adm.paciente?.ppi}</TableCell>
                    <TableCell>
                      {adm.paciente?.primer_nombre} {adm.paciente?.primer_apellido}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adm.tipo === 'urgencia' ? 'destructive' : 'default'}>
                        {adm.tipo === 'urgencia' ? '🚨 Urgencia' : '🏥 Hospitalización'}
                      </Badge>
                    </TableCell>
                    <TableCell>{adm.servicio?.nombre}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {adm.motivo_consulta || adm.motivo_ingreso}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">✅ Activo</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(adm.created_at).toLocaleTimeString('es-ES')}
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
