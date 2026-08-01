import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/hosixClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdmisionesEstadisticas() {
  const [stats, setStats] = useState({
    urgenciasHoy: 0,
    hospitalizacionesHoy: 0,
    citasHoy: 0,
    porServicio: [] as any[]
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarEstadisticas = async () => {
      setCargando(true)
      try {
        const hoy = new Date().toISOString().split('T')[0]

        // Urgencias hoy
        const { count: urgenciasHoy } = await supabase
          .from('hosix_urgencias_episodios')
          .select('id', { count: 'exact' })
          .gte('created_at', `${hoy}T00:00:00`)
          .eq('estado', 'activo')

        // Hospitalizaciones hoy
        const { count: hospitalizacionesHoy } = await supabase
          .from('hosix_hospitalizacion_episodios')
          .select('id', { count: 'exact' })
          .gte('created_at', `${hoy}T00:00:00`)
          .eq('estado', 'activo')

        // Por servicio
        const { data: porServicio } = await supabase
          .from('hosix_urgencias_episodios')
          .select('servicio:hosix_servicios(nombre)')
          .eq('estado', 'activo')

        const servicioCount: Record<string, number> = {}
        porServicio?.forEach((item: any) => {
          const nombre = item.servicio?.nombre || 'Sin servicio'
          servicioCount[nombre] = (servicioCount[nombre] || 0) + 1
        })

        setStats({
          urgenciasHoy: urgenciasHoy || 0,
          hospitalizacionesHoy: hospitalizacionesHoy || 0,
          citasHoy: 0,
          porServicio: Object.entries(servicioCount).map(([name, value]) => ({
            name,
            value
          }))
        })
      } catch (error) {
        console.error('Error cargando estadísticas:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarEstadisticas()
  }, [])

  if (cargando) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p>Cargando estadísticas...</p>
        </CardContent>
      </Card>
    )
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Urgencias (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.urgenciasHoy}</p>
            <p className="text-xs text-gray-500 mt-1">Pacientes en urgencias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Hospitalizaciones (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.hospitalizacionesHoy}</p>
            <p className="text-xs text-gray-500 mt-1">Pacientes hospitalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Total (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stats.urgenciasHoy + stats.hospitalizacionesHoy}
            </p>
            <p className="text-xs text-gray-500 mt-1">Admisiones totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por Servicio */}
      {stats.porServicio.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Servicio (Urgencias Activas)</CardTitle>
            <CardDescription>
              Cantidad de pacientes en urgencias por servicio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.porServicio}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.porServicio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
