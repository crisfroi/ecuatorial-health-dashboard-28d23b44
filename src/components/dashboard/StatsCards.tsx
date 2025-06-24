
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  onNavigateToProfessionals?: (filters: any) => void;
}

const StatsCards = ({ onNavigateToProfessionals }: StatsCardsProps) => {
  const stats = [
    {
      title: 'Total Registros',
      value: '1,247',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      filter: { type: 'all' }
    },
    {
      title: 'Aprobados',
      value: '89.2%',
      change: '+5.2%',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      filter: { type: 'status', value: 'Aprobado' }
    },
    {
      title: 'Pendientes',
      value: '127',
      change: '-8%',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      filter: { type: 'status', value: 'Pendiente' }
    },
    {
      title: 'Mujeres',
      value: '58.3%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      filter: { type: 'gender', value: 'F' }
    }
  ];

  const handleCardClick = (filter: any) => {
    if (onNavigateToProfessionals) {
      console.log('Navigating with filter:', filter);
      onNavigateToProfessionals(filter);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="hover:shadow-md transition-shadow cursor-pointer hover:scale-105 transform transition-transform"
          onClick={() => handleCardClick(stat.filter)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">{stat.change}</span> vs mes anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
