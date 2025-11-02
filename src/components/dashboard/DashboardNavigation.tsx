import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  MessageSquare,
  Gavel,
  UserCog,
  Building2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Search,
  Clock,
  ArrowRight,
  ClipboardList,
  LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'core' | 'guardias' | 'asistencia' | 'admin' | 'otros';
  badge?: string;
  description?: string;
  disabled?: boolean;
}

interface DashboardNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TAB_GROUPS = {
  core: { label: 'Gestión de Profesionales', icon: Users, color: 'bg-blue-100 text-blue-700' },
  guardias: { label: 'Guardias', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
  asistencia: { label: 'Asistencia Biométrica', icon: Clock, color: 'bg-green-100 text-green-700' },
  admin: { label: 'Administración', icon: Settings, color: 'bg-red-100 text-red-700' },
  otros: { label: 'Otros', icon: FileText, color: 'bg-gray-100 text-gray-700' },
};

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Agrupar tabs
  const groupedTabs = tabs.reduce((acc, tab) => {
    const groupKey = tab.group || 'otros';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(tab);
    return acc;
  }, {} as Record<string, TabConfig[]>);

  // Filtrar según búsqueda
  const filteredGroupedTabs = Object.entries(groupedTabs).reduce((acc, [group, groupTabs]) => {
    const filtered = groupTabs.filter(
      (tab) =>
        tab.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tab.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, TabConfig[]>);

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  const activeTabConfig = tabs.find((t) => t.id === activeTab);
  const activeGroup = activeTabConfig?.group || 'otros';

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y controles */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar sección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compact')}
            title="Vista compacta (solo iconos)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'expanded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('expanded')}
            title="Vista expandida (con etiquetas)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb del tab activo */}
      {activeTabConfig && (
        <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <span className="font-medium text-gray-900">Ubicación:</span>
          <span className="text-gray-600">{TAB_GROUPS[activeGroup as keyof typeof TAB_GROUPS]?.label}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">{activeTabConfig.label}</span>
          {activeTabConfig.badge && (
            <Badge variant="secondary" className="ml-auto">
              {activeTabConfig.badge}
            </Badge>
          )}
        </div>
      )}

      {/* Vista de navegación */}
      {viewMode === 'compact' ? (
        // Vista compacta: solo iconos
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                disabled={tab.disabled}
                title={tab.label}
                className={`
                  relative p-3 rounded-lg transition-all flex items-center justify-center
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : tab.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.badge && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        // Vista expandida: grupos de tabs
        <div className="space-y-4">
          {Object.entries(filteredGroupedTabs).map(([groupKey, groupTabs]) => {
            const groupConfig = TAB_GROUPS[groupKey as keyof typeof TAB_GROUPS];
            const GroupIcon = groupConfig?.icon || FileText;
            const isCollapsed = collapsedGroups.has(groupKey);

            return (
              <div key={groupKey} className="border rounded-lg overflow-hidden">
                {/* Header del grupo */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${groupConfig?.color} font-medium hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon className="w-4 h-4" />
                    <span>{groupConfig?.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {groupTabs.length}
                    </Badge>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  />
                </button>

                {/* Tabs del grupo */}
                {!isCollapsed && (
                  <div className="bg-white border-t divide-y">
                    {groupTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => onTabChange(tab.id)}
                          disabled={tab.disabled}
                          className={`
                            w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                            ${
                              isActive
                                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                                : tab.disabled
                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                            <div className="min-w-0">
                              <p className={`font-medium truncate ${isActive ? 'text-blue-900' : ''}`}>
                                {tab.label}
                              </p>
                              {tab.description && (
                                <p className="text-xs text-gray-600 truncate">{tab.description}</p>
                              )}
                            </div>
                          </div>
                          {tab.badge && (
                            <Badge variant="outline" className="ml-2 flex-shrink-0">
                              {tab.badge}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(filteredGroupedTabs).length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>No se encontraron secciones que coincidan con "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* Descripción del tab activo */}
      {activeTabConfig?.description && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Descripción:</strong> {activeTabConfig.description}
          </p>
        </div>
      )}
    </div>
  );
};
