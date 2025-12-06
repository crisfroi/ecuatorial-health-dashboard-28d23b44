import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import useHosixMedicos from '@/hooks/useHosixMedicos'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DiarioClinicoMedicoProps {
  pacienteId: string
  medicoId?: string
}

export const DiarioClinicoMedico: React.FC<DiarioClinicoMedicoProps> = ({
  pacienteId,
  medicoId = '',
}) => {
  const { registrarDiarioMutation, useDiarioClinico } = useHosixMedicos()
  const [tipoEntrada, setTipoEntrada] = useState<
    'evolución' | 'nota_clínica' | 'revisión' | 'conclusión'
  >('evolución')
  const [contenido, setContenido] = useState('')
  const [signos, setSignos] = useState({
    presion: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    saturacion: '',
  })

  const { data: diario = [] } = useDiarioClinico(pacienteId)

  const handleGuardar = async () => {
    if (!contenido.trim()) {
      toast.error('El contenido no puede estar vacío')
      return
    }

    try {
      await registrarDiarioMutation.mutateAsync({
        paciente_id: pacienteId,
        medico_id: medicoId,
        tipo_entrada: tipoEntrada,
        contenido,
        signos_vitales: Object.values(signos).some((v) => v)
          ? signos
          : undefined,
      })

      // Limpiar formulario
      setContenido('')
      setSignos({ presion: '', frecuencia_cardiaca: '', temperatura: '', saturacion: '' })
      setTipoEntrada('evolución')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      evolución: 'bg-blue-100 text-blue-800',
      'nota_clínica': 'bg-green-100 text-green-800',
      revisión: 'bg-purple-100 text-purple-800',
      conclusión: 'bg-orange-100 text-orange-800',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Formulario Nueva Entrada */}
      <Card>
        <CardHeader>
          <CardTitle>Nueva Entrada al Diario Clínico</CardTitle>
          <CardDescription>
            Registre observaciones de evolución o cambios en el estado del paciente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tipo de Entrada */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Entrada</label>
            <Select
              value={tipoEntrada}
              onValueChange={(value) => setTipoEntrada(value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evolución">Evolución</SelectItem>
                <SelectItem value="nota_clínica">Nota Clínica</SelectItem>
                <SelectItem value="revisión">Revisión</SelectItem>
                <SelectItem value="conclusión">Conclusión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signos Vitales Rápidos */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Signos Vitales (Opcional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="PA (mmHg)"
                value={signos.presion}
                onChange={(e) => setSignos({ ...signos, presion: e.target.value })}
                className="h-10 px-3 border rounded text-sm"
              />
              <input
                type="number"
                placeholder="FC (lpm)"
                value={signos.frecuencia_cardiaca}
                onChange={(e) =>
                  setSignos({ ...signos, frecuencia_cardiaca: e.target.value })
                }
                className="h-10 px-3 border rounded text-sm"
              />
              <input
                type="number"
                placeholder="T° (°C)"
                step="0.1"
                value={signos.temperatura}
                onChange={(e) => setSignos({ ...signos, temperatura: e.target.value })}
                className="h-10 px-3 border rounded text-sm"
              />
              <input
                type="number"
                placeholder="SaO2 (%)"
                min="0"
                max="100"
                value={signos.saturacion}
                onChange={(e) => setSignos({ ...signos, saturacion: e.target.value })}
                className="h-10 px-3 border rounded text-sm"
              />
            </div>
          </div>

          {/* Contenido */}
          <div>
            <label className="text-sm font-medium mb-2 block">Contenido de la Nota</label>
            <Textarea
              placeholder="Escriba la observación clínica, evolución del paciente, cambios en el tratamiento, etc..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="min-h-40 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {contenido.length} caracteres
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setContenido('')
                setSignos({
                  presion: '',
                  frecuencia_cardiaca: '',
                  temperatura: '',
                  saturacion: '',
                })
              }}
            >
              Limpiar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={
                !contenido.trim() || registrarDiarioMutation.isPending
              }
            >
              {registrarDiarioMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Guardar Entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Entradas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Entradas</CardTitle>
          <CardDescription>
            Últimas entradas registradas en el diario clínico
          </CardDescription>
        </CardHeader>

        <CardContent>
          {diario.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay entradas en el diario aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {diario
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((entrada) => (
                  <div
                    key={entrada.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    {/* Encabezado */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTipoColor(entrada.tipo_entrada)}>
                          {entrada.tipo_entrada
                            .charAt(0)
                            .toUpperCase() + entrada.tipo_entrada.slice(1)}
                        </Badge>
                        {entrada.firmada && (
                          <Badge variant="outline">✓ Firmada</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(entrada.created_at), 'PPp', {
                          locale: es,
                        })}
                      </span>
                    </div>

                    {/* Contenido */}
                    <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                      {entrada.contenido}
                    </p>

                    {/* Signos Vitales si existen */}
                    {entrada.signos_vitales && (
                      <div className="bg-blue-50 p-2 rounded text-xs space-y-1 border-l-2 border-blue-300">
                        <p className="font-medium text-blue-900">
                          Signos Vitales Registrados:
                        </p>
                        {entrada.signos_vitales.presion && (
                          <p>
                            <strong>PA:</strong> {entrada.signos_vitales.presion}{' '}
                            mmHg
                          </p>
                        )}
                        {entrada.signos_vitales.frecuencia_cardiaca && (
                          <p>
                            <strong>FC:</strong>{' '}
                            {entrada.signos_vitales.frecuencia_cardiaca} lpm
                          </p>
                        )}
                        {entrada.signos_vitales.temperatura && (
                          <p>
                            <strong>T°:</strong> {entrada.signos_vitales.temperatura}
                            °C
                          </p>
                        )}
                        {entrada.signos_vitales.saturacion && (
                          <p>
                            <strong>SaO2:</strong>{' '}
                            {entrada.signos_vitales.saturacion}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DiarioClinicoMedico
