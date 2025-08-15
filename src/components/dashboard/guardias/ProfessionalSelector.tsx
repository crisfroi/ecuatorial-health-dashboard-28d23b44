import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, Phone, Mail, Building, Check } from 'lucide-react';
import { Profesional } from '@/types/guardias';

interface ProfessionalSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (professional: Profesional) => void;
  professionals: any[];
  selectedProfessionalId?: string;
  title?: string;
  searchPlaceholder?: string;
}

const ProfessionalSelector: React.FC<ProfessionalSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  professionals = [],
  selectedProfessionalId,
  title = "Seleccionar Profesional",
  searchPlaceholder = "Buscar profesional por nombre, área o especialidad..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter professionals based on search term
  const filteredProfessionals = useMemo(() => {
    if (!searchTerm.trim()) return professionals;

    const searchLower = searchTerm.toLowerCase().trim();
    return professionals.filter(prof => {
      const name = prof.nombre_completo?.toLowerCase() || '';
      const area = prof.area_profesional?.toLowerCase() || '';
      const especialidad = prof.especialidad?.toLowerCase() || '';
      const categoria = prof.categoria_titulacion?.toLowerCase() || '';
      
      return name.includes(searchLower) ||
             area.includes(searchLower) ||
             especialidad.includes(searchLower) ||
             categoria.includes(searchLower);
    });
  }, [professionals, searchTerm]);

  const handleSelectProfessional = (professional: any) => {
    // Convert to guard system format
    const convertedProfessional: Profesional = {
      id: professional.id,
      nombre: professional.nombre_completo,
      categoria: mapCategoriaToGuardia(professional.area_profesional || professional.categoria_titulacion),
      unidad_servicio: professional.area_profesional || professional.especialidad || 'General',
      banco: undefined,
      iban_cuenta: undefined,
      activo: professional.estado_solicitud === 'aprobada',
      telefono: professional.telefono || undefined,
      email: professional.email || undefined
    };

    onSelect(convertedProfessional);
    onClose();
  };

  const mapCategoriaToGuardia = (categoria: string | null): any => {
    if (!categoria) return 'auxiliar';
    
    const categoriaLower = categoria.toLowerCase();
    
    if (categoriaLower.includes('especialista') || categoriaLower.includes('medico especialista')) {
      return 'especialista';
    }
    if (categoriaLower.includes('general') || categoriaLower.includes('licenciado') || categoriaLower.includes('medico general')) {
      return 'general_licenciado';
    }
    if (categoriaLower.includes('tecnico') || categoriaLower.includes('diplomado') || categoriaLower.includes('enfermero')) {
      return 'tecnico_diplomado';
    }
    if (categoriaLower.includes('auxiliar')) {
      return 'auxiliar';
    }
    if (categoriaLower.includes('subalterno')) {
      return 'subalterno';
    }
    if (categoriaLower.includes('odepac')) {
      return 'odepac';
    }
    if (categoriaLower.includes('secretar') || categoriaLower.includes('asist')) {
      return 'secre_asist_pacientes';
    }
    if (categoriaLower.includes('caja')) {
      return 'caja';
    }
    
    return 'auxiliar';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoriaColor = (categoria: string) => {
    const cat = categoria?.toLowerCase() || '';
    if (cat.includes('especialista')) return 'bg-purple-100 text-purple-800';
    if (cat.includes('general') || cat.includes('licenciado')) return 'bg-blue-100 text-blue-800';
    if (cat.includes('tecnico') || cat.includes('diplomado') || cat.includes('enfermero')) return 'bg-green-100 text-green-800';
    if (cat.includes('auxiliar')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-guinea-teal" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Total: {professionals.length} profesionales</span>
              {searchTerm && (
                <span>Filtrados: {filteredProfessionals.length} profesionales</span>
              )}
            </div>
          </div>

          {/* Professional List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredProfessionals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? (
                  <>
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron profesionales con "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay profesionales disponibles</p>
                  </>
                )}
              </div>
            ) : (
              filteredProfessionals.map((professional) => {
                const isSelected = selectedProfessionalId === professional.id;
                
                return (
                  <Card
                    key={professional.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-guinea-teal bg-guinea-light-teal/10' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectProfessional(professional)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-guinea-teal/10 text-guinea-teal font-semibold">
                            {getInitials(professional.nombre_completo || 'P')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {professional.nombre_completo}
                            </h3>
                            {isSelected && (
                              <Check className="w-4 h-4 text-guinea-teal flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {professional.area_profesional && (
                              <Badge 
                                variant="outline" 
                                className={getCategoriaColor(professional.area_profesional)}
                              >
                                {professional.area_profesional}
                              </Badge>
                            )}
                            {professional.especialidad && (
                              <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                {professional.especialidad}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            {professional.telefono && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{professional.telefono}</span>
                              </div>
                            )}
                            {professional.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{professional.email}</span>
                              </div>
                            )}
                            {professional.categoria_titulacion && (
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                <span>{professional.categoria_titulacion}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                professional.estado_solicitud === 'aprobada' 
                                  ? 'bg-green-500' 
                                  : 'bg-yellow-500'
                              }`} />
                              <span>{professional.estado_solicitud || 'Pendiente'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalSelector;
