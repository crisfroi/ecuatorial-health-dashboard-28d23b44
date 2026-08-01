import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'
import { useCDSEngine, agruparAlertasPorSeveridad, obtenerColorSeveridad, obtenerIconoSeveridad, Alert as CDSAlert } from '@/hooks/useCDSEngine'
import { AlertTriangle, AlertCircle, CheckCircle, Zap } from 'lucide-react'

interface CPOEPrescripcionFormProps {
  pacienteId: string
  episodioId?: string
  onSuccess?: () => void
}

export default function CPOEPrescripcionForm({
  pacienteId,
  episodioId,
  onSuccess
}: CPOEPrescripcionFormProps) {
  const { toast } = useToast()
  const {
    evaluarPrescripcion,
    evaluarPrescripcionAsync,
    ignorarAlerta,
    obtenerMedicamentosActuales,
    obtenerDosisPediatrica,
    evaluandoPrescripcion,
    pacienteInfo
  } = useCDSEngine()

  // Estados del formulario
  const [formData, setFormData] = useState({
    medicamentoId: '',
    nombreMedicamento: '',
    dosis: 0,
    unidadDosis: 'mg',
    viasAdministracion: 'oral',
    frecuencia: 'cada 8 horas',
    duracionDias: 7,
    indicaciones: '',
    observaciones: '',
    firmada: false
  })

  const [medicamentos, setMedicamentos] = useState<any[]>([])
  const [medicamentosActuales, setMedicamentosActuales] = useState<string[]>([])
  const [cargandoMedicamentos, setCargandoMedicamentos] = useState(false)
  const [cargandoMedicamentosActuales, setCargandoMedicamentosActuales] = useState(false)

  // Estados de CDS
  const [resultadoCDS, setResultadoCDS] = useState<any>(null)
  const [evaluandoCDS, setEvaluandoCDS] = useState(false)
  const [alertasIgnoradas, setAlertasIgnoradas] = useState<string[]>([])
  const [mostrarAlertasDetalle, setMostrarAlertasDetalle] = useState(true)

  // ============================================================
  // CARGAR MEDICAMENTOS DISPONIBLES
  // ============================================================
  useEffect(() => {
    const cargarMedicamentos = async () => {
      setCargandoMedicamentos(true)
      try {
        const { data, error } = await supabase
          .from('hosix_articulos')
          .select('id, codigo, nombre, grupo, principio_activo')
          .eq('activo', true)
          .order('nombre')
          .limit(100)

        if (error) throw error
        setMedicamentos(data || [])
      } catch (error) {
        console.error('Error cargando medicamentos:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los medicamentos disponibles',
          variant: 'destructive'
        })
      } finally {
        setCargandoMedicamentos(false)
      }
    }

    cargarMedicamentos()
  }, [])

  // ============================================================
  // CARGAR MEDICAMENTOS ACTUALES DEL PACIENTE
  // ============================================================
  useEffect(() => {
    const cargarMedicamentosActuales = async () => {
      setCargandoMedicamentosActuales(true)
      try {
        const actuales = await obtenerMedicamentosActuales(pacienteId)
        setMedicamentosActuales(actuales)
      } catch (error) {
        console.error('Error cargando medicamentos actuales:', error)
      } finally {
        setCargandoMedicamentosActuales(false)
      }
    }

    cargarMedicamentosActuales()
  }, [pacienteId])

  // ============================================================
  // MANEJAR CAMBIO DE MEDICAMENTO
  // ============================================================
  const handleSelectMedicamento = (medicamentoId: string) => {
    const med = medicamentos.find(m => m.id === medicamentoId)
    setFormData(prev => ({
      ...prev,
      medicamentoId,
      nombreMedicamento: med?.nombre || ''
    }))
    setResultadoCDS(null)
    setAlertasIgnoradas([])
  }

  // ============================================================
  // EVALUAR CON CDS
  // ============================================================
  const handleEvaluarCDS = async () => {
    if (!formData.medicamentoId) {
      toast({
        title: 'Error',
        description: 'Selecciona un medicamento',
        variant: 'destructive'
      })
      return
    }

    setEvaluandoCDS(true)
    try {
      const resultado = await evaluarPrescripcionAsync({
        pacienteId,
        medicamentoId: formData.medicamentoId,
        nombreMedicamento: formData.nombreMedicamento,
        dosis: formData.dosis,
        unidadDosis: formData.unidadDosis,
        viasAdministracion: formData.viasAdministracion,
        frecuencia: formData.frecuencia,
        duracionDias: formData.duracionDias,
        medicamentosActuales,
        edadPaciente: undefined, // Calcular de pacienteInfo si disponible
        pesoPaciente: undefined,
        funcionRenal: 'normal'
      })

      setResultadoCDS(resultado)

      if (resultado.alertasCriticas > 0) {
        toast({
          title: '⚠️ Alertas de Seguridad',
          description: `${resultado.alertasCriticas} alerta(s) crítica(s) detectada(s). Revisar recomendaciones.`,
          variant: 'destructive'
        })
      } else if (resultado.alertasAdvertencia > 0) {
        toast({
          title: '⚠️ Advertencias',
          description: `${resultado.alertasAdvertencia} advertencia(s). Revisar antes de prescribir.`,
          variant: 'default'
        })
      } else {
        toast({
          title: '✅ Seguridad Verificada',
          description: 'Prescripción aprobada por CDS Engine',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Error evaluando CDS:', error)
      toast({
        title: 'Error',
        description: 'Error al evaluar la prescripción',
        variant: 'destructive'
      })
    } finally {
      setEvaluandoCDS(false)
    }
  }

  // ============================================================
  // IGNORAR ALERTA
  // ============================================================
  const handleIgnorarAlerta = async (alerta: CDSAlert) => {
    const motivo = prompt('¿Por qué ignoras esta alerta?')
    if (!motivo) return

    ignorarAlerta({
      prescripcionId: '', // Se genera al guardar
      reglaId: alerta.id,
      alerta,
      motivo,
      justificacionClinica: formData.observaciones
    })

    setAlertasIgnoradas(prev => [...prev, alerta.id])
  }

  // ============================================================
  // GUARDAR PRESCRIPCIÓN
  // ============================================================
  const handleGuardarPrescripcion = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar alertas críticas no ignoradas
    if (resultadoCDS && resultadoCDS.alertasCriticas > 0) {
      const alertasCriticasNoIgnoradas = resultadoCDS.alertas.filter(
        (a: CDSAlert) => a.severidad === 'critica' && !alertasIgnoradas.includes(a.id)
      )

      if (alertasCriticasNoIgnoradas.length > 0) {
        toast({
          title: 'No se puede guardar',
          description: `Existen ${alertasCriticasNoIgnoradas.length} alerta(s) crítica(s) sin resolver. Revisa las recomendaciones.`,
          variant: 'destructive'
        })
        return
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('hosix_cpoe_prescripciones')
        .insert([
          {
            paciente_id: pacienteId,
            episodio_id: episodioId,
            medicamento_id: formData.medicamentoId,
            nombre_medicamento: formData.nombreMedicamento,
            dosis: formData.dosis,
            unidad_dosis: formData.unidadDosis,
            via_administracion: formData.viasAdministracion,
            frecuencia: formData.frecuencia,
            duracion_dias: formData.duracionDias,
            instrucciones_paciente: formData.indicaciones,
            observaciones_medicas: formData.observaciones,
            estado: 'activa',
            medico_id: user?.id,
            tiene_alerta_interaccion: (resultadoCDS?.alertas || []).some((a: CDSAlert) => a.tipo === 'interaccion'),
            tiene_alerta_alergia: (resultadoCDS?.alertas || []).some((a: CDSAlert) => a.tipo === 'alergia'),
            tiene_alerta_dosis: (resultadoCDS?.alertas || []).some((a: CDSAlert) => a.tipo === 'dosis'),
            alertas_ignoradas: alertasIgnoradas.length > 0 ? JSON.stringify(resultadoCDS.alertas.filter((a: CDSAlert) => alertasIgnoradas.includes(a.id))) : null
          }
        ])

      if (error) throw error

      toast({
        title: '✅ Prescripción registrada',
        description: 'La prescripción ha sido guardada exitosamente',
        variant: 'default'
      })

      // Limpiar formulario
      setFormData({
        medicamentoId: '',
        nombreMedicamento: '',
        dosis: 0,
        unidadDosis: 'mg',
        viasAdministracion: 'oral',
        frecuencia: 'cada 8 horas',
        duracionDias: 7,
        indicaciones: '',
        observaciones: '',
        firmada: false
      })
      setResultadoCDS(null)
      setAlertasIgnoradas([])

      onSuccess?.()
    } catch (error) {
      console.error('Error guardando prescripción:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar prescripción',
        variant: 'destructive'
      })
    }
  }

  const alertasAgrupadas = resultadoCDS ? agruparAlertasPorSeveridad(resultadoCDS.alertas) : null

  return (
    <form onSubmit={handleGuardarPrescripcion} className="space-y-6">
      {/* ENCABEZADO */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Prescripción Electrónica (CPOE)</CardTitle>
              <CardDescription>
                Sistema de soporte para decisiones clínicas con validación automática de seguridad
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* MEDICAMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medicamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicamento">Medicamento *</Label>
            <Select value={formData.medicamentoId} onValueChange={handleSelectMedicamento}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar medicamento..." />
              </SelectTrigger>
              <SelectContent>
                {medicamentos.map(med => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.nombre} ({med.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.medicamentoId && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Medicamento seleccionado:</strong> {formData.nombreMedicamento}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* DOSIS Y VÍA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posología</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosis">Dosis *</Label>
              <Input
                id="dosis"
                type="number"
                min="0"
                step="0.1"
                value={formData.dosis}
                onChange={(e) => setFormData(prev => ({ ...prev, dosis: parseFloat(e.target.value) }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Select value={formData.unidadDosis} onValueChange={(val) => setFormData(prev => ({ ...prev, unidadDosis: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="µg">µg</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="via">Vía *</Label>
              <Select value={formData.viasAdministracion} onValueChange={(val) => setFormData(prev => ({ ...prev, viasAdministracion: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="iv">IV</SelectItem>
                  <SelectItem value="im">IM</SelectItem>
                  <SelectItem value="sc">SC</SelectItem>
                  <SelectItem value="tópica">Tópica</SelectItem>
                  <SelectItem value="inhalada">Inhalada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frecuencia">Frecuencia *</Label>
              <Select value={formData.frecuencia} onValueChange={(val) => setFormData(prev => ({ ...prev, frecuencia: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cada 4 horas">Cada 4 horas</SelectItem>
                  <SelectItem value="cada 6 horas">Cada 6 horas</SelectItem>
                  <SelectItem value="cada 8 horas">Cada 8 horas</SelectItem>
                  <SelectItem value="cada 12 horas">Cada 12 horas</SelectItem>
                  <SelectItem value="cada 24 horas">Cada 24 horas</SelectItem>
                  <SelectItem value="una vez al día">Una vez al día</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (días)</Label>
              <Input
                id="duracion"
                type="number"
                min="1"
                value={formData.duracionDias}
                onChange={(e) => setFormData(prev => ({ ...prev, duracionDias: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INDICACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indicaciones">Indicaciones para el paciente</Label>
            <Textarea
              id="indicaciones"
              placeholder="Ej: Tomar con comida, no conducir, evitar alcohol..."
              value={formData.indicaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, indicaciones: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones médicas</Label>
            <Textarea
              id="observaciones"
              placeholder="Notas internas, motivo de la prescripción, restricciones especiales..."
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* BOTÓN EVALUAR CDS */}
      {formData.medicamentoId && !resultadoCDS && (
        <Button
          type="button"
          onClick={handleEvaluarCDS}
          disabled={evaluandoCDS}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {evaluandoCDS ? '⏳ Evaluando...' : '🔍 Evaluar Seguridad (CDS)'}
        </Button>
      )}

      {/* RESULTADOS CDS */}
      {resultadoCDS && (
        <div className="space-y-4">
          {/* RESUMEN */}
          <Card className={resultadoCDS.permitePrescripcion ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {resultadoCDS.permitePrescripcion ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  )}
                  <CardTitle>
                    {resultadoCDS.permitePrescripcion ? '✅ Prescripción Segura' : '❌ Prescripción Bloqueada'}
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarAlertasDetalle(!mostrarAlertasDetalle)}
                >
                  {mostrarAlertasDetalle ? 'Ocultar' : 'Mostrar'} Detalle
                </Button>
              </div>
              <CardDescription>{resultadoCDS.motivo}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex gap-4 text-sm font-semibold">
                <Badge variant="destructive">{resultadoCDS.alertasCriticas} Críticas</Badge>
                <Badge variant="outline">{resultadoCDS.alertasAdvertencia} Advertencias</Badge>
                <Badge variant="secondary">{resultadoCDS.alertasInfo} Información</Badge>
              </div>
            </CardContent>
          </Card>

          {/* ALERTAS DETALLADAS */}
          {mostrarAlertasDetalle && alertasAgrupadas && (
            <div className="space-y-4">
              {/* Alertas Críticas */}
              {alertasAgrupadas.criticas.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-base text-red-900">🚫 Alertas Críticas</CardTitle>
                    <CardDescription className="text-red-800">
                      Requieren revisión inmediata y cambio de medicamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertasAgrupadas.criticas.map(alerta => (
                      <Alert key={alerta.id} className="bg-white border-red-300">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-900">
                          <p className="font-semibold mb-1">{alerta.mensaje}</p>
                          <p className="text-sm mb-2">
                            <strong>Recomendación:</strong> {alerta.recomendacion}
                          </p>
                          {alerta.permitirIgnorar && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleIgnorarAlerta(alerta)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Ignorar (Requiere Justificación)
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Advertencias */}
              {alertasAgrupadas.advertencias.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-base text-yellow-900">⚠️ Advertencias</CardTitle>
                    <CardDescription className="text-yellow-800">
                      Requieren revisión pero puedes continuar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertasAgrupadas.advertencias.map(alerta => (
                      <Alert key={alerta.id} className="bg-white border-yellow-300">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-900">
                          <p className="font-semibold mb-1">{alerta.mensaje}</p>
                          <p className="text-sm mb-2">
                            <strong>Recomendación:</strong> {alerta.recomendacion}
                          </p>
                          {alerta.permitirIgnorar && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleIgnorarAlerta(alerta)}
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                            >
                              Ignorar
                            </Button>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Información */}
              {alertasAgrupadas.info.length > 0 && (
                <Card className="border-blue-300 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-900">ℹ️ Información</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alertasAgrupadas.info.map(alerta => (
                      <Alert key={alerta.id} className="bg-white border-blue-300">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          <p className="font-semibold mb-1">{alerta.mensaje}</p>
                          <p className="text-sm">
                            <strong>Nota:</strong> {alerta.recomendacion}
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResultadoCDS(null)
                setAlertasIgnoradas([])
              }}
            >
              ← Volver a Evaluar
            </Button>

            <Button
              type="submit"
              disabled={!resultadoCDS.permitePrescripcion && alertasIgnoradas.length === 0}
              className="flex-1"
            >
              {resultadoCDS.permitePrescripcion ? '✅ Guardar Prescripción' : '🔒 Revisar Alertas'}
            </Button>
          </div>
        </div>
      )}

      {/* MEDICAMENTOS ACTUALES */}
      {medicamentosActuales.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Medicamentos activos del paciente:</strong> {medicamentosActuales.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}
