import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { Plus, Search, Edit, Trash2, Calendar, Clock, User, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RegistroGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const RegistroGuardias: React.FC<RegistroGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    guardias,
    profesionales,
    centros,
    loading,
    fetchGuardias,
    fetchProfesionales,
    fetchCentros,
    createGuardia,
    updateGuardia,
    deleteGuardia
  } = useGuardiasStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('lista');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuardia, setEditingGuardia] = useState<any>(null);
  const [formData, setFormData] = useState({
    profesional_ids: [] as string[],
    centro_id: selectedCenter || '',
    fecha: '',
    turno: 'MAÑANA' as 'MAÑANA' | 'TARDE' | 'NOCHE',
    tipo_guardia: 'ORDINARIA' as 'ORDINARIA' | 'FESTIVA' | 'NOCTURNA',
    horas_inicio: '',
    horas_fin: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    fetchProfesionales(selectedCenter);
    if (!selectedCenter) {
      fetchCentros();
    }
  }, [selectedMonth, selectedYear, selectedCenter]);

  const filteredGuardias = guardias.filter(guardia =>
    guardia.profesional?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guardia.centro?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingGuardia) {
        await updateGuardia(editingGuardia.id, {...formData, profesional_id: formData.profesional_ids[0]});
        toast({
          title: "Guardia actualizada",
          description: "La guardia ha sido actualizada correctamente.",
        });
      } else {
        // Crear múltiples guardias para cada profesional seleccionado
        for (const profesional_id of formData.profesional_ids) {
          await createGuardia({...formData, profesional_id});
        }
        toast({
          title: "Guardias registradas",
          description: `Se han registrado ${formData.profesional_ids.length} guardias correctamente.`,
        });
      }

      setIsDialogOpen(false);
      setEditingGuardia(null);
      resetForm();
      fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar la solicitud.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (guardia: any) => {
    setEditingGuardia(guardia);
    // Extraer la fecha de fecha_inicio para el formulario
    const fechaInicio = new Date(guardia.fecha_inicio || guardia.fecha);
    const fechaFormato = fechaInicio.toISOString().split('T')[0];
    const horaInicio = fechaInicio.toTimeString().slice(0, 5);

    const fechaFin = new Date(guardia.fecha_fin || guardia.fecha);
    const horaFin = fechaFin.toTimeString().slice(0, 5);

    setFormData({
      profesional_ids: [guardia.profesional_guardia_id || guardia.profesional_id],
      centro_id: guardia.centro_salud_id || guardia.centro_id,
      fecha: fechaFormato,
      turno: 'MAÑANA', // Mapear desde tipo si es necesario
      tipo_guardia: guardia.tipo === 'fisica' ? 'ORDINARIA' : 'NOCTURNA',
      horas_inicio: horaInicio,
      horas_fin: horaFin,
      observaciones: guardia.observaciones || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (guardiaId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta guardia?')) {
      try {
        await deleteGuardia(guardiaId);
        toast({
          title: "Guardia eliminada",
          description: "La guardia ha sido eliminada correctamente.",
        });
        fetchGuardias(selectedMonth, selectedYear, selectedCenter);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la guardia.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      profesional_ids: [],
      centro_id: selectedCenter || '',
      fecha: '',
      turno: 'MAÑANA',
      tipo_guardia: 'ORDINARIA',
      horas_inicio: '',
      horas_fin: '',
      observaciones: ''
    });
  };

  const getTurnoBadgeColor = (turno: string) => {
    switch (turno) {
      case 'MAÑANA': return 'bg-blue-100 text-blue-800';
      case 'TARDE': return 'bg-orange-100 text-orange-800';
      case 'NOCHE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoGuardiaBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'bg-green-100 text-green-800';
      case 'FESTIVA': return 'bg-red-100 text-red-800';
      case 'NOCTURNA': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateGuardias = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);
  const canEditGuardias = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registro de Guardias</h2>
          <p className="text-gray-600">
            Gestión y registro de guardias médicas para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        {canCreateGuardias && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingGuardia(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Guardia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGuardia ? 'Editar Guardia' : 'Registrar Nueva Guardia'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profesional_ids">Profesionales *</Label>
                    <Select
                      value={formData.profesional_ids.length === 1 ? formData.profesional_ids[0] : ""}
                      onValueChange={(value) => {
                        if (editingGuardia) {
                          // En modo edición, solo un profesional
                          setFormData(prev => ({ ...prev, profesional_ids: [value] }));
                        } else {
                          // En modo creación, permite múltiples
                          setFormData(prev => ({
                            ...prev,
                            profesional_ids: prev.profesional_ids.includes(value)
                              ? prev.profesional_ids.filter(id => id !== value)
                              : [...prev.profesional_ids, value]
                          }));
                        }
                      }}
                      required={formData.profesional_ids.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            editingGuardia
                              ? "Seleccionar profesional"
                              : formData.profesional_ids.length === 0
                                ? "Seleccionar profesionales"
                                : `${formData.profesional_ids.length} profesional(es) seleccionado(s)`
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {profesionales.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            <div className="flex items-center gap-2">
                              {!editingGuardia && formData.profesional_ids.includes(prof.id) && (
                                <span className="text-guinea-teal">✓</span>
                              )}
                              {prof.nombre_completo} - {prof.especialidad}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!editingGuardia && formData.profesional_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {formData.profesional_ids.map(id => {
                          const prof = profesionales.find(p => p.id === id);
                          return prof ? (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {prof.nombre_completo}
                              <button
                                type="button"
                                className="ml-1 hover:text-red-600"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  profesional_ids: prev.profesional_ids.filter(pid => pid !== id)
                                }))}
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {!selectedCenter && (
                    <div>
                      <Label htmlFor="centro_id">Centro de Salud *</Label>
                      <Select
                        value={formData.centro_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, centro_id: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar centro" />
                        </SelectTrigger>
                        <SelectContent>
                          {centros.map((centro) => (
                            <SelectItem key={centro.id} value={centro.id}>
                              {centro.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="turno">Turno *</Label>
                    <Select
                      value={formData.turno}
                      onValueChange={(value: 'MAÑANA' | 'TARDE' | 'NOCHE') => 
                        setFormData(prev => ({ ...prev, turno: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAÑANA">Mañana</SelectItem>
                        <SelectItem value="TARDE">Tarde</SelectItem>
                        <SelectItem value="NOCHE">Noche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tipo_guardia">Tipo de Guardia *</Label>
                    <Select
                      value={formData.tipo_guardia}
                      onValueChange={(value: 'ORDINARIA' | 'FESTIVA' | 'NOCTURNA') => 
                        setFormData(prev => ({ ...prev, tipo_guardia: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                        <SelectItem value="FESTIVA">Festiva</SelectItem>
                        <SelectItem value="NOCTURNA">Nocturna</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="horas_inicio">Hora Inicio *</Label>
                    <Input
                      id="horas_inicio"
                      type="time"
                      value={formData.horas_inicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, horas_inicio: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="horas_fin">Hora Fin *</Label>
                    <Input
                      id="horas_fin"
                      type="time"
                      value={formData.horas_fin}
                      onChange={(e) => setFormData(prev => ({ ...prev, horas_fin: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingGuardia ? 'Actualizar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Guardias</TabsTrigger>
          <TabsTrigger value="calendario">Vista Calendario</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por profesional o centro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando guardias...</p>
              </div>
            ) : filteredGuardias.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay guardias registradas
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Comienza registrando una nueva guardia.'}
                  </p>
                  {canCreateGuardias && !searchTerm && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Primera Guardia
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredGuardias.map((guardia) => (
                <Card key={guardia.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">
                            {guardia.profesional?.nombre_completo}
                          </h3>
                          <Badge className={getTurnoBadgeColor(guardia.turno)}>
                            {guardia.turno}
                          </Badge>
                          <Badge className={getTipoGuardiaBadgeColor(guardia.tipo_guardia)}>
                            {guardia.tipo_guardia}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(guardia.fecha).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{guardia.horas_inicio} - {guardia.horas_fin}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{guardia.centro?.nombre}</span>
                          </div>
                        </div>
                        
                        {guardia.observaciones && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{guardia.observaciones}</p>
                          </div>
                        )}
                      </div>
                      
                      {canEditGuardias && (
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(guardia)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(guardia.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendario">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Calendario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4" />
                <p>Vista de calendario en desarrollo</p>
                <p className="text-sm">Próximamente: interfaz de calendario interactiva</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Guardias</p>
                    <p className="text-2xl font-bold">{guardias.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guardias Ordinarias</p>
                    <p className="text-2xl font-bold">
                      {guardias.filter(g => g.tipo_guardia === 'ORDINARIA').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guardias Festivas</p>
                    <p className="text-2xl font-bold">
                      {guardias.filter(g => g.tipo_guardia === 'FESTIVA').length}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guardias Nocturnas</p>
                    <p className="text-2xl font-bold">
                      {guardias.filter(g => g.tipo_guardia === 'NOCTURNA').length}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
