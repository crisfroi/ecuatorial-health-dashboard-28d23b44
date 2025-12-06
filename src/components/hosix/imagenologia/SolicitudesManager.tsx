import React, { useState } from 'react'
import { useHosixImagenologia } from '@/hooks/useHosixImagenologia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const ImagenologiaSolicitudesManager: React.FC = () => {
  const { solicitudes = [] } = useHosixImagenologia()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = solicitudes.filter(s => {
    const matchSearch = searchTerm === '' || 
      s.numero_solicitud?.includes(searchTerm)
    const matchEstado = filtroEstado === 'todos' || 
      s.estado_solicitud === filtroEstado
    return matchSearch && matchEstado
  })

  const stats = {
    pendientes: solicitudes.filter(s => s.estado_solicitud === 'pendiente').length,
    programadas: solicitudes.filter(s => s.estado_solicitud === 'programada').length,
    completadas: solicitudes.filter(s => s.estado_solicitud === 'completada').length
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completadas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Solicitudes de Imagenología</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud de Imagenología</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Seleccionar protocolo" />
                  <textarea placeholder="Razón de la solicitud" className="w-full px-3 py-2 border rounded" />
                  <Button className="w-full">Solicitar Estudio</Button>
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
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="programada">Programada</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Programada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.numero_solicitud}</TableCell>
                  <TableCell>{s.protocolo?.nombre || 'N/A'}</TableCell>
                  <TableCell>{s.razon_solicitud}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100">{s.estado_solicitud}</span>
                  </TableCell>
                  <TableCell>{s.fecha_estudio_programada ? new Date(s.fecha_estudio_programada).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImagenologiaSolicitudesManager
