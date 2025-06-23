
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, FileText, TrendingUp, Activity, MessageCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import StatsCards from '@/components/dashboard/StatsCards';
import ProfessionalsTable from '@/components/dashboard/ProfessionalsTable';
import RequestsPanel from '@/components/dashboard/RequestsPanel';
import ProfessionalDetail from '@/components/dashboard/ProfessionalDetail';
import AdvancedStats from '@/components/dashboard/AdvancedStats';
import MinisterialPanel from '@/components/dashboard/MinisterialPanel';
import AIChat from '@/components/dashboard/AIChat';
import HospitalIncidents from '@/components/dashboard/HospitalIncidents';

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
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/f55481fd-c077-4825-921a-3c48a3b6b852.png" 
              alt="Guinea Ecuatorial Salud" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Gestión de Profesionales Sanitarios
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Ministerio de Sanidad y Bienestar Social - Guinea Ecuatorial
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-guinea-light-teal text-guinea-dark-teal">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
            <div className="w-8 h-8 bg-guinea-teal rounded-full flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:grid-cols-8">
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
            <TabsTrigger value="ai-chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Análisis IA</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Incidencias</span>
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
                    <TrendingUp className="w-5 h-5 text-guinea-teal" />
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
                      <Line type="monotone" dataKey="solicitudes" stroke="hsl(var(--guinea-teal))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-guinea-teal" />
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
                      <Bar dataKey="cantidad" fill="hsl(var(--guinea-teal))" />
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

          <TabsContent value="ai-chat">
            <AIChat />
          </TabsContent>

          <TabsContent value="incidents">
            <HospitalIncidents />
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
