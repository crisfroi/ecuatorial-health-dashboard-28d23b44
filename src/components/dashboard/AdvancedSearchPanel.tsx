import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  X,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'range' | 'date' | 'checkbox' | 'multiselect';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  description?: string;
  filters: FilterOption[];
  isCollapsed?: boolean;
}

interface AdvancedSearchPanelProps {
  searchPlaceholder?: string;
  filterGroups: FilterGroup[];
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Record<string, any>) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
  minimalMode?: boolean;
  showActiveFiltersCount?: boolean;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  searchPlaceholder = 'Buscar...',
  filterGroups,
  onSearchChange,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  minimalMode = false,
  showActiveFiltersCount = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filterGroups.map((g) => g.id))
  );
  const [showAdvanced, setShowAdvanced] = useState(!minimalMode);

  // Contar filtros activos
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;

  // Manejar búsqueda
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  // Manejar cambio de filtro
  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...filters, [filterId]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Limpiar filtro individual
  const clearFilter = (filterId: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterId];
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Limpiar todos
  const handleClearAll = () => {
    setSearchQuery('');
    setFilters({});
    onSearchChange('');
    onFiltersChange({});
    onResetFilters?.();
  };

  // Toggle grupo
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Búsqueda Avanzada
            </CardTitle>
            <CardDescription>Busca y filtra registros por múltiples criterios</CardDescription>
          </div>
          {showActiveFiltersCount && activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeFiltersCount} filtro(s)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de búsqueda principal */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón para mostrar/ocultar filtros avanzados */}
        {minimalMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            {showAdvanced ? 'Ocultar filtros' : 'Mostrar filtros avanzados'}
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          </Button>
        )}

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t">
            {filterGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id);

              return (
                <div key={group.id} className="border rounded-lg overflow-hidden">
                  {/* Header del grupo */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <div className="text-left">
                        <p className="font-medium text-sm text-gray-900">{group.label}</p>
                        {group.description && (
                          <p className="text-xs text-gray-600">{group.description}</p>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                  {/* Filtros del grupo */}
                  {isExpanded && (
                    <div className="bg-white p-3 space-y-3 border-t">
                      {group.filters.map((filter) => {
                        const value = filters[filter.id];
                        const hasValue = value !== undefined && value !== null && value !== '';

                        return (
                          <div key={filter.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={filter.id} className="text-sm font-medium">
                                {filter.label}
                              </Label>
                              {hasValue && (
                                <button
                                  onClick={() => clearFilter(filter.id)}
                                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Limpiar
                                </button>
                              )}
                            </div>

                            {/* Text Input */}
                            {filter.type === 'text' && (
                              <Input
                                id={filter.id}
                                placeholder={filter.placeholder}
                                value={value || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                className="h-8 text-sm"
                              />
                            )}

                            {/* Select */}
                            {filter.type === 'select' && (
                              <Select value={value || ''} onValueChange={(val) => handleFilterChange(filter.id, val)}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder={filter.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {filter.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {/* Multiselect (checkbox) */}
                            {filter.type === 'multiselect' && (
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {filter.options?.map((option) => (
                                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={(value || []).includes(option.value)}
                                      onChange={(e) => {
                                        const currentArray = value || [];
                                        const newArray = e.target.checked
                                          ? [...currentArray, option.value]
                                          : currentArray.filter((v) => v !== option.value);
                                        handleFilterChange(filter.id, newArray.length > 0 ? newArray : null);
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Date Input */}
                            {filter.type === 'date' && (
                              <Input
                                id={filter.id}
                                type="date"
                                value={value || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                className="h-8 text-sm"
                              />
                            )}

                            {/* Range Slider */}
                            {filter.type === 'range' && (
                              <div className="space-y-2">
                                <input
                                  type="range"
                                  min={filter.min || 0}
                                  max={filter.max || 100}
                                  step={filter.step || 1}
                                  value={value || filter.min || 0}
                                  onChange={(e) => handleFilterChange(filter.id, Number(e.target.value))}
                                  className="w-full"
                                />
                                <div className="flex items-center justify-between text-xs text-gray-600">
                                  <span>{filter.min || 0}</span>
                                  <span className="font-medium text-gray-900">{value || filter.min || 0}</span>
                                  <span>{filter.max || 100}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={activeFiltersCount === 0 && !searchQuery}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar todo
          </Button>
          {onApplyFilters && (
            <Button
              size="sm"
              onClick={onApplyFilters}
              disabled={activeFiltersCount === 0 && !searchQuery}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
          )}
        </div>

        {/* Resumen de filtros activos */}
        {(activeFiltersCount > 0 || searchQuery) && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-gray-700">Filtros activos:</p>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Búsqueda: {searchQuery}
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null;

                const filterLabel = filterGroups
                  .flatMap((g) => g.filters)
                  .find((f) => f.id === key)?.label;

                const displayValue = Array.isArray(value) ? `${value.length} seleccionados` : String(value);

                return (
                  <Badge key={key} variant="outline" className="flex items-center gap-1">
                    {filterLabel}: {displayValue}
                    <button
                      onClick={() => clearFilter(key)}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
