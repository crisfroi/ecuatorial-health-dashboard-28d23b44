import React, { useState } from 'react'
import { useHosixObstetricia } from '@/hooks/useHosixObstetricia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export const GestacionesManager: React.FC = () => {
  const { gestaciones = [], crearGestacion, actualizarGestacion, eliminarGestacion } = useHosixObstetricia()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    numero_gesta: '',
    numero_para: '',
    fecha_ultima_menstruacion: '',
    grupo_sanguineo: '',
    factor_rh: '',
    es_embarazo_multiple: false,
    numero_fetos: 1,
    estado_gestacion: 'activa'
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearGestacion.mutateAsync(formData)
      toast.success('Gestación creada exitosamente')
      setIsOpen(false)
      setFormData({
        numero_gesta: '',
        numero_para: '',
        fecha_ultima_menstruacion: '',
        grupo_sanguineo: '',
        factor_rh: '',
        es_embarazo_multiple: false,
        numero_fetos: 1,
        estado_gestacion: 'activa'
      })
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const filtered = gestaciones.filter(g => {
    const matchSearch = searchTerm === '' || 
      g.numero_gesta?.toString().includes(searchTerm)
    const matchEstado = filtroEstado === 'todos' || 
      g.estado_gestacion === filtroEstado
    return matchSearch && matchEstado
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestiones Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{gestaciones.filter(g => g.estado_gestacion === 'activa').length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Listado de Gestaciones</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Gestación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Gestación</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    placeholder="Número de gesta"
                    type="number"
                    value={formData.numero_gesta}
                    onChange={(e) => setFormData({...formData, numero_gesta: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Número de para"
                    type="number"
                    value={formData.numero_para}
                    onChange={(e) => setFormData({...formData, numero_para: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Fecha última menstruación"
                    type="date"
                    value={formData.fecha_ultima_menstruacion}
                    onChange={(e) => setFormData({...formData, fecha_ultima_menstruacion: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Grupo sanguíneo"
                    value={formData.grupo_sanguineo}
                    onChange={(e) => setFormData({...formData, grupo_sanguineo: e.target.value})}
                  />
                  <Button type="submit" className="w-full">Registrar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar por número de gesta..."
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
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
              <option value="aborto">Aborto</option>
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gesta</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>FUM</TableHead>
                <TableHead>Fetos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell>{g.numero_gesta}</TableCell>
                  <TableCell>{g.numero_para}</TableCell>
                  <TableCell>{new Date(g.fecha_ultima_menstruacion).toLocaleDateString()}</TableCell>
                  <TableCell>{g.numero_fetos}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      g.estado_gestacion === 'activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {g.estado_gestacion}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => eliminarGestacion.mutateAsync(g.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default GestacionesManager
