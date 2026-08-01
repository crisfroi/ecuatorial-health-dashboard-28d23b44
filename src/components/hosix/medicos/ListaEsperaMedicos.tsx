import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/integrations/supabase/hosixClient'
import { Clock, AlertCircle, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PacienteEnEspera {
  id: string
  paciente_id: string
  paciente?: {
    ppi: string
    primer_nombre: string
    primer_apellido: string
    fecha_nacimiento: string
  }
  motivo_consulta: string
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente'
  fecha_creacion: string
  tiempo_espera_minutos?: number
}

export const ListaEsperaMedicos: React.FC = () => {
  const [listaEspera, setListaEspera] = useState<PacienteEnEspera[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarListaEspera()
  }, [])

  const cargarListaEspera = async () => {
    setCargando(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('No hay usuario autenticado')
        return
      }

      // Obtener ordenes médicas pendientes del médico actual
      const { data: medico } = await supabase
        .from('profesionales_sanitarios')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!medico) {
        setError('No se encontró registro de médico')
        return
      }

      const { data: ordenes, error: errorOrdenes } = await supabase
        .from('hosix_ordenes_medicas')
        .select(`
          id,
          paciente_id,
          motivo_consulta,
          prioridad,
          fecha_creacion,
          pacientes:paciente_id(ppi, primer_nombre, primer_apellido, fecha_nacimiento)
        `)
        .eq('medico_asignado_id', medico.id)
        .eq('estado', 'pendiente')
        .order('prioridad', { ascending: false })
        .order('fecha_creacion', { ascending: true })

      if (errorOrdenes) throw errorOrdenes

      // Calcular tiempo de espera
      const ordenesConTiempo = (ordenes || []).map((orden: any) => {
        const ahora = new Date()
        const fecha = new Date(orden.fecha_creacion)
        const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60))

        return {
          id: orden.id,
          paciente_id: orden.paciente_id,
          paciente: orden.pacientes ? {
            ppi: orden.pacientes[0]?.ppi || '',
            primer_nombre: orden.pacientes[0]?.primer_nombre || '',
            primer_apellido: orden.pacientes[0]?.primer_apellido || '',
            fecha_nacimiento: orden.pacientes[0]?.fecha_nacimiento || ''
          } : undefined,
          motivo_consulta: orden.motivo_consulta,
          prioridad: orden.prioridad,
          fecha_creacion: orden.fecha_creacion,
          tiempo_espera_minutos: minutos
        }
      })

      setListaEspera(ordenesConTiempo)
    } catch (err: any) {
      console.error('Error cargando lista de espera:', {
        message: err?.message,
        code: err?.code,
        details: err?.details
      })
      setError(err?.message || 'Error al cargar lista de espera')
    } finally {
      setCargando(false)
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-blue-100 text-blue-800',
      normal: 'bg-green-100 text-green-800',
      alta: 'bg-yellow-100 text-yellow-800',
      urgente: 'bg-red-100 text-red-800',
    }
    return colors[prioridad] || 'bg-gray-100 text-gray-800'
  }

  const getPrioridadLabel = (prioridad: string) => {
    const labels: Record<string, string> = {
      baja: 'Baja',
      normal: 'Normal',
      alta: 'Alta',
      urgente: 'Urgente'
    }
    return labels[prioridad] || prioridad
  }

  const getTiempoEsperaLabel = (minutos: number): string => {
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) return `${horas}h`
    const dias = Math.floor(horas / 24)
    return `${dias}d`
  }

  const ordenesFiltradas = listaEspera.filter(orden => {
    const textoBusqueda = filtro.toLowerCase()
    return (
      !textoBusqueda ||
      orden.paciente?.ppi.toLowerCase().includes(textoBusqueda) ||
      orden.paciente?.primer_nombre.toLowerCase().includes(textoBusqueda) ||
      orden.paciente?.primer_apellido.toLowerCase().includes(textoBusqueda) ||
      orden.motivo_consulta.toLowerCase().includes(textoBusqueda)
    )
  })

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Error al cargar lista de espera</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total en Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listaEspera.length}</div>
            <p className="text-xs text-gray-600 mt-1">Pacientes pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {listaEspera.filter(o => o.prioridad === 'urgente').length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Prioridad urgente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Espera Máxima</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listaEspera.length > 0
                ? getTiempoEsperaLabel(Math.max(...listaEspera.map(o => o.tiempo_espera_minutos || 0)))
                : '-'}
            </div>
            <p className="text-xs text-gray-600 mt-1">Paciente más antiguo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio Espera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listaEspera.length > 0
                ? getTiempoEsperaLabel(
                    Math.round(
                      listaEspera.reduce((sum, o) => sum + (o.tiempo_espera_minutos || 0), 0) /
                        listaEspera.length
                    )
                  )
                : '-'}
            </div>
            <p className="text-xs text-gray-600 mt-1">Espera promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Espera de Pacientes
              </CardTitle>
              <CardDescription>Pacientes asignados pendientes de atención</CardDescription>
            </div>
            <Button onClick={cargarListaEspera} disabled={cargando} variant="outline" size="sm">
              {cargando ? '⏳' : '🔄'} Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por PPI, nombre, motivo de consulta..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          {cargando ? (
            <div className="text-center py-8 text-gray-500">⏳ Cargando lista de espera...</div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {listaEspera.length === 0
                ? '✅ No hay pacientes en espera'
                : '❌ No se encontraron resultados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PPI</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Motivo Consulta</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Tiempo Espera</TableHead>
                    <TableHead>Fecha Admisión</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesFiltradas.map((orden) => (
                    <TableRow key={orden.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {orden.paciente?.ppi || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {orden.paciente?.primer_nombre} {orden.paciente?.primer_apellido}
                          </div>
                          <div className="text-xs text-gray-600">
                            {orden.paciente?.fecha_nacimiento
                              ? format(new Date(orden.paciente.fecha_nacimiento), 'dd/MM/yyyy')
                              : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{orden.motivo_consulta}</TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(orden.prioridad)}>
                          {getPrioridadLabel(orden.prioridad)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">
                            {getTiempoEsperaLabel(orden.tiempo_espera_minutos || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(orden.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Ver Detalles
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
    </div>
  )
}

export default ListaEsperaMedicos
