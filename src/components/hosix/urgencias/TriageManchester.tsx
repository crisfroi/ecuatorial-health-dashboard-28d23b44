import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface TriageChessterProps {
  episodioId: string
  pacienteId: string
  onSuccess?: () => void
}

interface NivelManchester {
  nivel: number
  color: string
  nombre: string
  descripcion: string
  tiempoMax: number
  icono: React.ReactNode
  ejemplos: string[]
}

const NIVELES_MANCHESTER: NivelManchester[] = [
  {
    nivel: 1,
    color: 'bg-red-600 text-white',
    nombre: 'EMERGENCIA',
    descripcion: 'Riesgo vital inmediato',
    tiempoMax: 0,
    icono: <div className="text-2xl">🔴</div>,
    ejemplos: [
      'Paro cardiorrespiratorio',
      'Trauma grave',
      'Hemorragia severa',
      'Shock',
      'Inconsciencia'
    ]
  },
  {
    nivel: 2,
    color: 'bg-orange-600 text-white',
    nombre: 'MUY URGENTE',
    descripcion: 'Potencial riesgo vital',
    tiempoMax: 10,
    icono: <div className="text-2xl">🟠</div>,
    ejemplos: [
      'Dolor torácico anginoso',
      'Dificultad respiratoria',
      'Alteración del nivel de conciencia',
      'Accidente cerebrovascular',
      'Intoxicación grave'
    ]
  },
  {
    nivel: 3,
    color: 'bg-yellow-500 text-black',
    nombre: 'URGENTE',
    descripcion: 'Necesita evaluación rápida',
    tiempoMax: 60,
    icono: <div className="text-2xl">🟡</div>,
    ejemplos: [
      'Fiebre elevada',
      'Trauma moderado',
      'Dolor abdominal intenso',
      'Crisis hipertensiva',
      'Mareo intenso'
    ]
  },
  {
    nivel: 4,
    color: 'bg-green-600 text-white',
    nombre: 'NORMAL',
    descripcion: 'Requiere atención, pero no urgente',
    tiempoMax: 120,
    icono: <div className="text-2xl">🟢</div>,
    ejemplos: [
      'Dolor leve-moderado',
      'Síntomas crónicos agudizados',
      'Gripe sin complicaciones',
      'Herida menor',
      'Molestias leves'
    ]
  },
  {
    nivel: 5,
    color: 'bg-blue-600 text-white',
    nombre: 'NO URGENTE',
    descripcion: 'Puede esperar',
    tiempoMax: 240,
    icono: <div className="text-2xl">🔵</div>,
    ejemplos: [
      'Consulta administrativa',
      'Consulta de seguimiento',
      'Prescripción de renovación',
      'Certificados médicos',
      'Asesoramiento sanitario'
    ]
  }
]

export default function TriageManchester({
  episodioId,
  pacienteId,
  onSuccess
}: TriageChessterProps) {
  const { toast } = useToast()

  const [nivelSeleccionado, setNivelSeleccionado] = useState<number | null>(null)
  const [motivoConsulta, setMotivoConsulta] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  const nivelData = nivelSeleccionado
    ? NIVELES_MANCHESTER.find(n => n.nivel === nivelSeleccionado)
    : null

  const handleGuardarTriage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nivelSeleccionado || !motivoConsulta.trim()) {
      toast({
        title: 'Error',
        description: 'Selecciona nivel de triage y motivo de consulta',
        variant: 'destructive'
      })
      return
    }

    setGuardando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('hosix_urgencias_triage')
        .insert([
          {
            episodio_id: episodioId,
            paciente_id: pacienteId,
            nivel_urgencia: nivelSeleccionado,
            motivo_consulta: motivoConsulta,
            observaciones,
            evaluador_id: user?.id,
            signos_vitales: {}
          }
        ])

      if (error) throw error

      // Actualizar episodio con nivel
      await supabase
        .from('hosix_urgencias_episodios')
        .update({
          nivel_triage: nivelSeleccionado,
          clasificacion_inicial: NIVELES_MANCHESTER.find(n => n.nivel === nivelSeleccionado)?.nombre
        })
        .eq('id', episodioId)

      toast({
        title: '✅ Triage Registrado',
        description: `Nivel ${nivelSeleccionado} - ${nivelData?.nombre}`,
        variant: 'default'
      })

      // Limpiar
      setNivelSeleccionado(null)
      setMotivoConsulta('')
      setObservaciones('')
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar triage',
        variant: 'destructive'
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleGuardarTriage} className="space-y-6">
      {/* Encabezado */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle>Clasificación TRIAGE - Escala Manchester</CardTitle>
              <CardDescription>
                Sistema estandarizado de 5 niveles para priorización de urgencias
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SELECCIÓN DE NIVEL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecciona Nivel de Urgencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={nivelSeleccionado?.toString() || ''} onValueChange={(val) => setNivelSeleccionado(parseInt(val))}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NIVELES_MANCHESTER.map((nivel) => (
                <div key={nivel.nivel} className="relative">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      nivelSeleccionado === nivel.nivel
                        ? `${nivel.color} border-current`
                        : `bg-white border-gray-200 hover:border-gray-300`
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <RadioGroupItem
                        value={nivel.nivel.toString()}
                        id={`nivel-${nivel.nivel}`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {nivel.icono}
                          <label
                            htmlFor={`nivel-${nivel.nivel}`}
                            className="font-bold cursor-pointer"
                          >
                            Nivel {nivel.nivel}
                          </label>
                        </div>
                        <p className="font-semibold">{nivel.nombre}</p>
                        <p className="text-sm opacity-90 mb-2">
                          {nivel.descripcion}
                        </p>
                        <p className="text-xs opacity-75">
                          ⏱️ Máximo: {nivel.tiempoMax === 0 ? 'Inmediato' : `${nivel.tiempoMax} min`}
                        </p>
                      </div>
                    </div>

                    {/* Ejemplos expandidos cuando se selecciona */}
                    {nivelSeleccionado === nivel.nivel && (
                      <div className="mt-3 pt-3 border-t border-current opacity-80">
                        <p className="text-xs font-semibold mb-2">Ejemplos:</p>
                        <ul className="text-xs space-y-1">
                          {nivel.ejemplos.map((ejemplo, idx) => (
                            <li key={idx}>• {ejemplo}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* INFORMACIÓN DEL NIVEL SELECCIONADO */}
      {nivelData && (
        <Alert className={`${nivelData.color}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Nivel {nivelData.nivel} - {nivelData.nombre}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">{nivelData.descripcion}</p>
            <p className="text-sm font-semibold">
              ⏱️ Tiempo máximo de espera: {nivelData.tiempoMax === 0 ? 'Inmediato' : `${nivelData.tiempoMax} minutos`}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* MOTIVO DE CONSULTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Motivo de Consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo principal (obligatorio) *</Label>
            <Textarea
              id="motivo"
              placeholder="Describe brevemente el motivo de la consulta (síntomas principales, antecedentes relevantes...)"
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              rows={3}
              className="font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* OBSERVACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observaciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="observaciones">Notas clínicas</Label>
            <Textarea
              id="observaciones"
              placeholder="Información adicional relevante, antecedentes, medicamentos actuales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* GUÍA DE COLORES */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Referencia Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {NIVELES_MANCHESTER.map((nivel) => (
              <div key={nivel.nivel} className="text-center">
                <div className={`${nivel.color} p-2 rounded mb-1 font-bold text-sm`}>
                  L{nivel.nivel}
                </div>
                <p className="text-xs">{nivel.nombre}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BOTÓN GUARDAR */}
      <Button
        type="submit"
        disabled={guardando || !nivelSeleccionado}
        className="w-full h-10 text-base"
      >
        {guardando ? '⏳ Guardando...' : '✅ Guardar Triage'}
      </Button>

      {/* INFORMACIÓN IMPORTANTE */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Información Importante</AlertTitle>
        <AlertDescription>
          <ul className="text-sm space-y-1 mt-2">
            <li>• El triage debe ser realizado dentro de los primeros 10 minutos</li>
            <li>• Los pacientes Level 1 requieren atención INMEDIATA</li>
            <li>• La clasificación puede revisarse si cambia el estado del paciente</li>
            <li>• Todos los datos son registrados para auditoría clínica</li>
          </ul>
        </AlertDescription>
      </Alert>
    </form>
  )
}
