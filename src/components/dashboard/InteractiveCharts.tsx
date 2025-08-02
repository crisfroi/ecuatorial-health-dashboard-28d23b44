import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Define the type for the data passed to the component
interface EstadisticasData {
  total: number;
  aprobados: number;
  pendientes: number;
  recibidos: number;
  rechazados: number;
  revisando: number;
  vencimientosProximos: number;
  carnetVencidos: number;
  porArea: { [key: string]: number };
  porProvincia: { [key: string]: number };
  generoMasculino: number;
  generoFemenino: number;
  totalPorGenero: { Masculino: number; Femenino: number };
  totalPorDistrito: { [key: string]: number };
  totalPorTipoSector: { [key: string]: number };
  totalPorNacionalidad: { [key: string]: number };
  totalPorAreaProfesional: { [key: string]: number };
  totalPorEstadoSolicitud: { [key: string]: number };
  totalPorDistritoSanitario: { [key: string]: number };
  datosGraficoProvincias: Array<{ name: string; value: number; color: string }>;
}

interface InteractiveChartsProps {
  data: EstadisticasData | null;
}

const InteractiveCharts = ({ data }: InteractiveChartsProps) => {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargando gráficos...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p>No hay datos disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const estadosData = [
    { estado: 'Aprobados', cantidad: data.aprobados, color: '#22c55e' },
    { estado: 'Pendientes', cantidad: data.pendientes || 0, color: '#f59e0b' },
    { estado: 'Recibidos', cantidad: data.recibidos, color: '#3b82f6' },
    { estado: 'Rechazados', cantidad: data.rechazados, color: '#ef4444' },
    { estado: 'En Revisión', cantidad: data.revisando, color: '#8b5cf6' }
  ];

  const areasData = Object.entries(data.porArea || {}).map(([area, cantidad]) => ({
    area,
    cantidad: cantidad as number
  }));

  const provinciasData = Object.entries(data.porProvincia || {}).map(([provincia, cantidad]) => ({
    provincia,
    cantidad: cantidad as number
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Estados Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Estados</CardTitle>
          <CardDescription>
            Estado actual de las solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="estado" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="cantidad" 
                fill="#8884d8"
                name="Cantidad"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Areas Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Áreas Profesionales</CardTitle>
          <CardDescription>
            Distribución por especialidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={areasData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ area, percent }) => `${area} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
              >
                {areasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Provinces Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Provincias</CardTitle>
          <CardDescription>
            Profesionales por ubicación geográfica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={provinciasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="provincia" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="cantidad" 
                fill="#82ca9d"
                name="Cantidad"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Género</CardTitle>
          <CardDescription>
            Proporción de profesionales por género
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Masculino', value: data.generoMasculino || 0, fill: '#0088FE' },
                  { name: 'Femenino', value: data.generoFemenino || 0, fill: '#00C49F' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                dataKey="value"
              >
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveCharts;
