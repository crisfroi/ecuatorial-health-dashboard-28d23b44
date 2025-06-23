
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import StatsCards from '@/components/dashboard/StatsCards';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';

const Dashboard = () => {
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState('administrador'); // administrador, comite, visualizador

  // Datos simulados - en producción vendrían de Airtable
  const monthlyData = [
    { mes: 'Ene', solicitudes: 45 },
    { mes: 'Feb', solicitudes: 52 },
    { mes: 'Mar', solicitudes: 48 },
    { mes: 'Abr', solicitudes: 61 },
    { mes: 'May', solicitudes: 55 },
    { mes: 'Jun', solicitudes: 67 }
  ];

  const professionData = [
    { profesion: 'Médicos', cantidad: 156 },
    { profesion: 'Enfermería', cantidad: 243 },
    { profesion: 'Farmacia', cantidad: 87 },
    { profesion: 'Laboratorio', cantidad: 45 },
    { profesion: 'Radiología', cantidad: 32 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Gestión de Profesionales Sanitarios
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Panel Principal</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Profesionales</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Estadísticas</span>
            </TabsTrigger>
            {(userRole === 'administrador' || userRole === 'comite') && (
              <TabsTrigger value="ministerial" className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span>Panel Ministerial</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardFilters />
            <StatsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Evolución de Solicitudes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="solicitudes" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Profesionales por Área</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={professionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="profesion" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <RequestsPanel userRole={userRole} />
          </TabsContent>

          <TabsContent value="professionals">
            <ProfessionalsTable 
              onSelectProfessional={setSelectedProfessional}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="stats">
            <AdvancedStats />
          </TabsContent>

          {(userRole === 'administrador' || userRole === 'comite') && (
            <TabsContent value="ministerial">
              <MinisterialPanel />
            </TabsContent>
          )}
        </Tabs>

        {selectedProfessional && (
          <ProfessionalDetail 
            professional={selectedProfessional}
            onClose={() => setSelectedProfessional(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
