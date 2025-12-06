import React, { useState } from 'react'
import { useHosixLaboratorio } from '@/hooks/useHosixLaboratorio'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const SolicitudesManager: React.FC = () => {
  const { solicitudes = [], crearSolicitud } = useHosixLaboratorio()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    razon_solicitud: '',
    diagnostico_presuntivo: '',
    prioridad: 'normal',
    requiere_resultado_urgente: false
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearSolicitud.mutateAsync(formData)
      toast.success('Solicitud creada exitosamente')
      setIsOpen(false)
      setFormData({
        razon_solicitud: '',
        diagnostico_presuntivo: '',
        prioridad: 'normal',
        requiere_resultado_urgente: false
      })
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const filtered = solicitudes.filter(s => {
    const matchSearch = searchTerm === '' || 
      s.numero_solicitud?.includes(searchTerm) ||
      s.razon_solicitud?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || 
      s.estado_solicitud === filtroEstado
    return matchSearch && matchEstado
  })

  const stats = {
    pendientes: solicitudes.filter(s => s.estado_solicitud === 'pendiente').length,
    procesando: solicitudes.filter(s => s.estado_solicitud === 'procesando').length,
    completadas: solicitudes.filter(s => s.estado_solicitud === 'completada').length
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
            <CardTitle className="text-sm">En Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.procesando}</div>
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
            <CardTitle>Solicitudes de Laboratorio</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Solicitud de Laboratorio</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Razón de solicitud</label>
                    <textarea
                      value={formData.razon_solicitud}
                      onChange={(e) => setFormData({...formData, razon_solicitud: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Diagnóstico presuntivo</label>
                    <Input
                      value={formData.diagnostico_presuntivo}
                      onChange={(e) => setFormData({...formData, diagnostico_presuntivo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridad</label>
                    <select
                      value={formData.prioridad}
                      onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="baja">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">Solicitar</Button>
                </form>
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
              <option value="procesando">Procesando</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro Solicitud</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.numero_solicitud}</TableCell>
                  <TableCell>{s.razon_solicitud}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      s.prioridad === 'critica' ? 'bg-red-100 text-red-800' :
                      s.prioridad === 'urgente' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {s.prioridad}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-gray-100">{s.estado_solicitud}</span>
                  </TableCell>
                  <TableCell>{new Date(s.fecha_solicitud).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <button className="text-blue-500 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default SolicitudesManager
