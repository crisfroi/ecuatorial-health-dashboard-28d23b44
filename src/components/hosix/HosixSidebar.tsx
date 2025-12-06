import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  Calendar,
  Hospital,
  Stethoscope,
  Pill,
  Heart,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Vault,
  TrendingDown,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HosixSidebarProps {
  isOpen: boolean;
}

const HosixSidebar: React.FC<HosixSidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hosix' },
    { label: 'Pacientes', icon: Users, path: '/hosix/pacientes' },
    { label: 'Urgencias', icon: AlertCircle, path: '/hosix/urgencias' },
    { label: 'Citas', icon: Calendar, path: '/hosix/citas' },
    { label: 'Hospitalización', icon: Hospital, path: '/hosix/hospitalizacion' },
    { label: 'Quirófanos', icon: Stethoscope, path: '/hosix/quirofanos' },
    { label: 'Farmacia', icon: Pill, path: '/hosix/farmacia' },
    { label: 'Prescripción (CPOE)', icon: Pill, path: '/hosix/prescripcion' },
    { label: 'Enfermería', icon: Heart, path: '/hosix/enfermeria' },
    { label: 'Facturación', icon: DollarSign, path: '/hosix/facturacion' },
    { label: 'Cajas', icon: Vault, path: '/hosix/cajas' },
    { label: 'Recobros', icon: TrendingDown, path: '/hosix/recobros' },
    { label: 'Suministros', icon: Package, path: '/hosix/suministros' },
    { label: 'Almacenes', icon: Package, path: '/hosix/almacenes' },
    { label: 'Compras', icon: ShoppingCart, path: '/hosix/compras' },
    { label: 'BI & Reportes', icon: BarChart3, path: '/hosix/bi' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center justify-center h-12 bg-blue-800 rounded-lg">
          <Hospital className="w-6 h-6" />
          {isOpen && <span className="ml-2 font-bold text-lg">HOSIX</span>}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    active
                      ? 'bg-blue-600 hover:bg-blue-600'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <Separator className="bg-blue-700" />

      {/* Configuration Section */}
      <div className="p-4">
        <Link to="/hosix/configuracion">
          <Button
            variant="ghost"
            className="w-full justify-start text-blue-100 hover:bg-blue-700"
            title="Configuración"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="ml-3">Configuración</span>}
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-blue-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-300 hover:bg-red-900/30"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="ml-3">Salir</span>}
        </Button>
      </div>
    </aside>
  );
};

export default HosixSidebar;
