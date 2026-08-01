import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/hosixClient'
import { AlertCircle, CheckCircle, Users, LogIn } from 'lucide-react'

interface AdmisionCentralFormProps {
  pacienteId?: string
  onSuccess?: (episodioId: string) => void
}

type TipoIngreso = 'urgencias' | 'externa' | 'hospitalizacion'

interface FormData {
  tipoIngreso: TipoIngreso
  servicioId: string
  motivoConsulta: string
  observaciones: string
}

export default function AdmisionCentralForm({
  pacienteId,
  onSuccess
}: AdmisionCentralFormProps) {
  const { toast } = useToast()

  const [paciente, setPaciente] = useState<any>(null)
  const [servicios, setServicios] = useState<any[]>([])
  const [cargandoPaciente, setCargandoPaciente] = useState(!!pacienteId)
  const [cargandoServicios, setCargandoServicios] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    tipoIngreso: 'urgencias',
    servicioId: '',
    motivoConsulta: '',
    observaciones: ''
  })

  const [searchPaciente, setSearchPaciente] = useState('')

  // ============================================================
  // CARGAR PACIENTE POR ID
  // ============================================================
  useEffect(() => {
    if (pacienteId) {
      const cargarPaciente = async () => {
        setCargandoPaciente(true)
        try {
          const { data, error } = await supabase
            .from('hosix_pacientes')
            .select('*')
            .eq('id', pacienteId)
            .single()

          if (error) throw error
          setPaciente(data)
        } catch (error) {
          console.error('Error cargando paciente:', error)
          toast({
            title: 'Error',
            description: 'No se pudo cargar el paciente',
            variant: 'destructive'
          })
        } finally {
          setCargandoPaciente(false)
        }
      }

      cargarPaciente()
    }
  }, [pacienteId])

  // ============================================================
  // BUSCAR PACIENTE POR PPI O NOMBRE
  // ============================================================
  const buscarPaciente = async () => {
    if (!searchPaciente.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa PPI o nombre del paciente',
        variant: 'destructive'
      })
      return
    }

    setCargandoPaciente(true)
    try {
      const { data, error } = await supabase
        .from('hosix_pacientes')
        .select('*')
        .or(
          `ppi.ilike.%${searchPaciente}%,primer_nombre.ilike.%${searchPaciente}%,primer_apellido.ilike.%${searchPaciente}%`
        )
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setPaciente(data[0])
      } else {
        toast({
          title: 'No encontrado',
          description: 'No se encontró paciente con ese criterio',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error buscando paciente:', error)
      toast({
        title: 'Error',
        description: 'Error al buscar paciente',
        variant: 'destructive'
      })
    } finally {
      setCargandoPaciente(false)
    }
  }

  // ============================================================
  // CARGAR SERVICIOS SEGÚN TIPO DE INGRESO
  // ============================================================
  useEffect(() => {
    const cargarServicios = async () => {
      setCargandoServicios(true)
      try {
        let query = supabase
          .from('hosix_servicios')
          .select('id, nombre, codigo')
          .eq('activo', true)

        // Filtrar según tipo de ingreso
        if (formData.tipoIngreso === 'urgencias') {
          query = query.eq('atiende_urgencias', true)
        } else if (formData.tipoIngreso === 'hospitalizacion') {
          query = query.eq('atiende_hospitalizacion', true)
        }

        const { data, error } = await query.order('nombre')

        if (error) throw error
        setServicios(data || [])
        
        // Limpiar servicio seleccionado si no está en la nueva lista
        if (formData.servicioId && !data?.some(s => s.id === formData.servicioId)) {
          setFormData(prev => ({ ...prev, servicioId: '' }))
        }
      } catch (error: any) {
        const errorMsg = error?.message || error?.details || 'Desconocido'
        console.error('Error cargando servicios:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          fullError: error
        })
        toast({
          title: 'Error cargando servicios',
          description: `No se pudieron cargar los servicios: ${errorMsg}`,
          variant: 'destructive'
        })
      } finally {
        setCargandoServicios(false)
      }
    }

    cargarServicios()
  }, [formData.tipoIngreso])

  // ============================================================
  // PROCESAR ADMISIÓN
  // ============================================================
  const handleAdmitir = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paciente) {
      toast({
        title: 'Error',
        description: 'Selecciona un paciente',
        variant: 'destructive'
      })
      return
    }

    if (!formData.servicioId) {
      toast({
        title: 'Error',
        description: 'Selecciona un servicio',
        variant: 'destructive'
      })
      return
    }

    if (!formData.motivoConsulta.trim()) {
      toast({
        title: 'Error',
        description: 'Describe el motivo de consulta',
        variant: 'destructive'
      })
      return
    }

    setGuardando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Crear episodio según tipo de ingreso
      let episodioData: any = {
        paciente_id: paciente.id,
        servicio_id: formData.servicioId,
        motivo_consulta: formData.motivoConsulta,
        observaciones_admision: formData.observaciones,
        registrado_por: user?.id,
        estado: 'activo',
        clasificacion_inicial: formData.tipoIngreso === 'urgencias' ? 'sin_triage' : 'programada'
      }

      let tabla: string
      if (formData.tipoIngreso === 'urgencias') {
        tabla = 'hosix_urgencias_episodios'
        episodioData.box_asignado = null
        episodioData.nivel_triage = null
      } else if (formData.tipoIngreso === 'hospitalizacion') {
        tabla = 'hosix_hospitalizacion_episodios'
        episodioData.cama_id = null
        episodioData.fecha_ingreso = new Date().toISOString()
      } else {
        tabla = 'hosix_citas'
        episodioData.hora_cita = new Date().toISOString()
        episodioData.estado_cita = 'confirmada'
      }

      const { data, error } = await supabase
        .from(tabla)
        .insert([episodioData])
        .select()

      if (error) throw error

      const episodioId = data?.[0]?.id

      // ASIGNAR MÉDICO EN TURNO SI ES CONSULTA EXTERNA
      if (formData.tipoIngreso === 'externa') {
        try {
          // Obtener médicos en turno del servicio
          const { data: medicosEnTurno, error: errorMedicos } = await supabase
            .from('profesionales_sanitarios')
            .select('id, primer_nombre, primer_apellido')
            .eq('servicio_id', formData.servicioId)
            .eq('activo', true)
            .eq('esta_en_turno', true)
            .limit(1)

          if (medicosEnTurno && medicosEnTurno.length > 0) {
            const medico = medicosEnTurno[0]

            // Crear orden médica para el médico asignado
            const { error: errorOrden } = await supabase
              .from('hosix_ordenes_medicas')
              .insert([
                {
                  paciente_id: paciente.id,
                  medico_asignado_id: medico.id,
                  tipo_orden: 'consulta',
                  estado: 'pendiente',
                  prioridad: 'normal',
                  motivo_consulta: formData.motivoConsulta,
                  fecha_creacion: new Date().toISOString()
                }
              ])

            if (!errorOrden) {
              console.log(`✅ Médico asignado: ${medico.primer_nombre} ${medico.primer_apellido}`)
            }
          } else {
            console.warn('⚠️ No hay médicos en turno disponibles para este servicio')
          }
        } catch (errorAssignment) {
          console.warn('⚠️ Error al asignar médico (continuando con admisión):', errorAssignment)
        }
      }

      // Crear entrada en HCE
      await supabase
        .from('hosix_hce_entradas')
        .insert([
          {
            paciente_id: paciente.id,
            episodio_id: episodioId,
            tipo_entrada: formData.tipoIngreso === 'urgencias' ? 'triage' : 'consulta',
            contenido: `Admisión ${formData.tipoIngreso}: ${formData.motivoConsulta}`,
            registrado_por: user?.id
          }
        ])

      toast({
        title: '✅ Paciente Admitido',
        description: `${paciente.primer_nombre} ${paciente.primer_apellido} ha sido admitido exitosamente`,
        variant: 'default'
      })

      // Limpiar formulario
      setPaciente(null)
      setSearchPaciente('')
      setFormData({
        tipoIngreso: 'urgencias',
        servicioId: '',
        motivoConsulta: '',
        observaciones: ''
      })

      onSuccess?.(episodioId)
    } catch (error) {
      console.error('Error admitiendo paciente:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al admitir paciente',
        variant: 'destructive'
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleAdmitir} className="space-y-6">
      {/* Encabezado */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <LogIn className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Admisión Central Unificada</CardTitle>
              <CardDescription>
                Punto de entrada para urgencias, consulta externa u hospitalización
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* BÚSQUEDA DE PACIENTE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Búsqueda de Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa PPI, nombre o apellido..."
              value={searchPaciente}
              onChange={(e) => setSearchPaciente(e.target.value)}
              disabled={cargandoPaciente}
              onKeyPress={(e) => e.key === 'Enter' && buscarPaciente()}
            />
            <Button
              type="button"
              onClick={buscarPaciente}
              disabled={cargandoPaciente || !searchPaciente.trim()}
            >
              {cargandoPaciente ? '⏳' : '🔍'} Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* INFORMACIÓN DEL PACIENTE */}
      {paciente && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Paciente Seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">PPI</p>
                <p className="font-semibold text-lg">{paciente.ppi}</p>
              </div>
              <div>
                <p className="text-gray-600">Nombre</p>
                <p className="font-semibold">
                  {paciente.primer_nombre} {paciente.primer_apellido}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Edad</p>
                <p className="font-semibold">
                  {new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear()} años
                </p>
              </div>
              <div>
                <p className="text-gray-600">Teléfono</p>
                <p className="font-semibold">{paciente.telefono_principal || 'N/A'}</p>
              </div>
            </div>

            {paciente.alergias && paciente.alergias.length > 0 && (
              <Alert className="mt-4 bg-red-50 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-900">Alergias Conocidas</AlertTitle>
                <AlertDescription className="text-red-800 mt-2">
                  {Array.isArray(paciente.alergias)
                    ? paciente.alergias.join(', ')
                    : JSON.stringify(paciente.alergias)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* TIPO DE INGRESO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipo de Ingreso *</CardTitle>
          <CardDescription>
            Selecciona el flujo de atención que corresponde al paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.tipoIngreso}
            onValueChange={(val) => setFormData(prev => ({ ...prev, tipoIngreso: val as TipoIngreso }))}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Urgencias */}
              <div className="flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer hover:bg-red-50"
                onClick={() => setFormData(prev => ({ ...prev, tipoIngreso: 'urgencias' }))}>
                <RadioGroupItem value="urgencias" id="urgencias" />
                <Label htmlFor="urgencias" className="cursor-pointer flex-1">
                  <p className="font-semibold text-red-600">🚨 Urgencias</p>
                  <p className="text-sm text-gray-600">Atención inmediata, Triage, SAO</p>
                </Label>
              </div>

              {/* Consulta Externa */}
              <div className="flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50"
                onClick={() => setFormData(prev => ({ ...prev, tipoIngreso: 'externa' }))}>
                <RadioGroupItem value="externa" id="externa" />
                <Label htmlFor="externa" className="cursor-pointer flex-1">
                  <p className="font-semibold text-blue-600">📋 Consulta Externa</p>
                  <p className="text-sm text-gray-600">Cita programada o de seguimiento</p>
                </Label>
              </div>

              {/* Hospitalización */}
              <div className="flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer hover:bg-green-50"
                onClick={() => setFormData(prev => ({ ...prev, tipoIngreso: 'hospitalizacion' }))}>
                <RadioGroupItem value="hospitalizacion" id="hospitalizacion" />
                <Label htmlFor="hospitalizacion" className="cursor-pointer flex-1">
                  <p className="font-semibold text-green-600">🏥 Hospitalización</p>
                  <p className="text-sm text-gray-600">Ingreso a cama, internamiento</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* SELECCIONAR SERVICIO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servicio de Destino *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={formData.servicioId}
            onValueChange={(val) => setFormData(prev => ({ ...prev, servicioId: val }))}
            disabled={cargandoServicios}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona servicio..." />
            </SelectTrigger>
            <SelectContent>
              {servicios.map(servicio => (
                <SelectItem key={servicio.id} value={servicio.id}>
                  {servicio.nombre} ({servicio.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {servicios.length === 0 && !cargandoServicios && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay servicios disponibles para {formData.tipoIngreso}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* MOTIVO DE CONSULTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Motivo de Consulta *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe el motivo principal de la consulta..."
            value={formData.motivoConsulta}
            onChange={(e) => setFormData(prev => ({ ...prev, motivoConsulta: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* OBSERVACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observaciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Información adicional relevante para la admisión..."
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* FLUJO ESPERADO */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Flujo Esperado por Tipo</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li><strong>Urgencias</strong>: Registro → Triage Manchester → SAO → Médico</li>
            <li><strong>Consulta Externa</strong>: Registro → Sala de espera → Médico</li>
            <li><strong>Hospitalización</strong>: Registro → Asignación de cama → Ingreso formal</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* BOTÓN ADMITIR */}
      <Button
        type="submit"
        disabled={guardando || !paciente || !formData.servicioId}
        className="w-full h-10 text-base"
      >
        {guardando ? '⏳ Procesando...' : '✅ Admitir Paciente'}
      </Button>
    </form>
  )
}
