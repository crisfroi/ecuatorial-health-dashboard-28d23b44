import React, { useState } from 'react'
import { useHosixInterconsultas } from '@/hooks/useHosixInterconsultas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const InterconsultasSolicitudesManager: React.FC = () => {
  const { solicitudes = [] } = useHosixInterconsultas()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = solicitudes.filter(s => {
    const matchSearch = searchTerm === '' || 
      s.numero_solicitud?.includes(searchTerm) ||
      s.especialidad_solicitada?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEspecialidad = filtroEspecialidad === 'todos' || 
      s.especialidad_solicitada === filtroEspecialidad
    return matchSearch && matchEspecialidad
  })

  const stats = {
    pendientes: solicitudes.filter(s => s.estado_solicitud === 'pendiente').length,
    en_evaluacion: solicitudes.filter(s => s.estado_solicitud === 'en_evaluacion').length,
    respondidas: solicitudes.filter(s => s.estado_solicitud === 'respondida').length
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.en_evaluacion}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.respondidas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Solicitudes de Interconsulta</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Interconsulta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud de Interconsulta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Seleccionar paciente" />
                  <Input placeholder="Especialidad solicitada" />
                  <select className="w-full px-3 py-2 border rounded">
                    <option>Normal</option>
                    <option>Urgente</option>
                    <option>Crítica</option>
                  </select>
                  <textarea placeholder="Motivo de solicitud" className="w-full px-3 py-2 border rounded" />
                  <Button className="w-full">Solicitar Interconsulta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar solicitud..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="todos">Todas especialidades</option>
              <option value="cardiologia">Cardiología</option>
              <option value="neurologia">Neurología</option>
              <option value="traumatologia">Traumatología</option>
              <option value="psiquiatria">Psiquiatría</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">{s.numero_solicitud}</TableCell>
                  <TableCell>{s.especialidad_solicitada}</TableCell>
                  <TableCell className="max-w-xs truncate">{s.motivo_solicitud}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      s.urgencia === 'critica' ? 'bg-red-100 text-red-800' :
                      s.urgencia === 'urgente' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {s.urgencia}
                    </span>
                  </TableCell>
                  <TableCell>{s.estado_solicitud}</TableCell>
                  <TableCell>{new Date(s.fecha_solicitud).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default InterconsultasSolicitudesManager
