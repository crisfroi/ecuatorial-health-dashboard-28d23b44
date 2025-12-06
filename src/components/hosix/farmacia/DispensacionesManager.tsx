import React, { useState } from 'react'
import { useHosixFarmacia } from '@/hooks/useHosixFarmacia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export const DispensacionesManager: React.FC = () => {
  const { dispensaciones = [], dispensarios = [] } = useHosixFarmacia()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filtered = dispensaciones.filter(d => {
    return searchTerm === '' || 
      d.numero_dispensacion?.includes(searchTerm) ||
      d.articulo?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const dispensacionesHoy = dispensaciones.filter(d => 
    new Date(d.fecha_dispensacion).toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dispensarios Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispensarios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dispensaciones Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispensacionesHoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Dispensaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispensaciones.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registro de Dispensaciones</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Dispensación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Dispensación Farmacéutica</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Seleccionar paciente" />
                  <Input placeholder="Seleccionar medicamento" />
                  <Input placeholder="Cantidad" type="number" />
                  <Input placeholder="Lote" />
                  <Input placeholder="Fecha vencimiento" type="date" />
                  <textarea placeholder="Instrucciones al paciente" className="w-full px-3 py-2 border rounded" />
                  <Button className="w-full">Dispensar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Buscar dispensación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro Dispensación</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Farmacéutico</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 10).map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold">{d.numero_dispensacion}</TableCell>
                  <TableCell>{d.articulo?.nombre || 'N/A'}</TableCell>
                  <TableCell>{d.cantidad_dispensada}</TableCell>
                  <TableCell>{d.lote_medicamento}</TableCell>
                  <TableCell>{d.fecha_vencimiento_medicamento ? new Date(d.fecha_vencimiento_medicamento).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{d.farmaceutico?.primer_nombre || 'N/A'}</TableCell>
                  <TableCell>{new Date(d.fecha_dispensacion).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default DispensacionesManager
