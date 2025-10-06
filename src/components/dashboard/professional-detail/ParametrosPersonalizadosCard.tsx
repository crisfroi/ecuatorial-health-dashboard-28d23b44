import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  professionalId: string;
}

export const ParametrosPersonalizadosCard: React.FC<Props> = ({ professionalId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParametro, setSelectedParametro] = useState<any>(null);
  const [valorFormData, setValorFormData] = useState<any>({});

  // Cargar definiciones de parámetros
  const { data: parametros } = useQuery({
    queryKey: ['parametros_profesionales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parametros_profesionales')
        .select('*')
        .eq('activo', true)
        .eq('visible_en_detalles', true)
        .order('orden_visualizacion');
      if (error) throw error;
      return data;
    }
  });

  // Cargar valores asignados a este profesional
  const { data: valores, isLoading } = useQuery({
    queryKey: ['valores_parametros', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valores_parametros_profesionales')
        .select('*, parametros_profesionales(*)')
        .eq('profesional_id', professionalId);
      if (error) throw error;
      return data;
    }
  });

  // Guardar valor
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('valores_parametros_profesionales')
        .upsert([{
          profesional_id: professionalId,
          parametro_id: data.parametro_id,
          ...data
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores_parametros', professionalId] });
      toast({ title: "Éxito", description: "Parámetro guardado correctamente" });
      setIsDialogOpen(false);
    }
  });

  // Eliminar valor
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('valores_parametros_profesionales')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valores_parametros', professionalId] });
      toast({ title: "Éxito", description: "Parámetro eliminado correctamente" });
    }
  });

  const handleOpenDialog = (parametro: any, valor?: any) => {
    setSelectedParametro(parametro);
    if (valor) {
      setValorFormData(valor);
    } else {
      setValorFormData({
        parametro_id: parametro.id,
        valor_texto: '',
        valor_numero: null,
        valor_fecha: '',
        valor_boolean: false,
        notas: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    saveMutation.mutate(valorFormData);
  };

  const renderValorDisplay = (valor: any) => {
    const param = valor.parametros_profesionales;
    const IconComponent = (LucideIcons as any)[param.icono] || LucideIcons.Award;

    let displayValue = '';
    switch (param.tipo_dato) {
      case 'texto':
        displayValue = valor.valor_texto || '';
        break;
      case 'numero':
        displayValue = `${valor.valor_numero || 0} ${param.unidad || ''}`;
        break;
      case 'moneda':
        displayValue = `${valor.valor_numero?.toLocaleString() || 0} ${param.unidad || 'CFA'}`;
        break;
      case 'fecha':
        displayValue = valor.valor_fecha ? format(new Date(valor.valor_fecha), 'dd/MM/yyyy', { locale: es }) : '';
        break;
      case 'boolean':
        displayValue = valor.valor_boolean ? 'Sí' : 'No';
        break;
    }

    return (
      <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-start gap-3 flex-1">
          <div style={{ color: param.color }} className="mt-1">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{param.nombre}</h4>
              <Badge variant="outline" style={{ borderColor: param.color }}>
                {param.categoria}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{displayValue}</p>
            {valor.notas && (
              <p className="text-xs text-muted-foreground italic">{valor.notas}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(param, valor)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMutation.mutate(valor.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderInputByType = () => {
    if (!selectedParametro) return null;

    switch (selectedParametro.tipo_dato) {
      case 'texto':
        return (
          <Textarea
            value={valorFormData.valor_texto || ''}
            onChange={(e) => setValorFormData({...valorFormData, valor_texto: e.target.value})}
            placeholder="Ingrese el valor"
          />
        );
      case 'numero':
      case 'moneda':
        return (
          <Input
            type="number"
            value={valorFormData.valor_numero || ''}
            onChange={(e) => setValorFormData({...valorFormData, valor_numero: parseFloat(e.target.value)})}
            placeholder={`Ingrese el valor ${selectedParametro.unidad ? `(${selectedParametro.unidad})` : ''}`}
          />
        );
      case 'fecha':
        return (
          <Input
            type="date"
            value={valorFormData.valor_fecha || ''}
            onChange={(e) => setValorFormData({...valorFormData, valor_fecha: e.target.value})}
          />
        );
      case 'boolean':
        return (
          <Select
            value={valorFormData.valor_boolean ? 'true' : 'false'}
            onValueChange={(value) => setValorFormData({...valorFormData, valor_boolean: value === 'true'})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  // Filtrar parámetros no asignados
  const parametrosDisponibles = parametros?.filter(
    p => !valores?.some(v => v.parametro_id === p.id)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Parámetros Adicionales</CardTitle>
            <CardDescription>
              Información personalizada del profesional
            </CardDescription>
          </div>
          {parametrosDisponibles.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedParametro ? `Editar ${selectedParametro.nombre}` : 'Agregar Parámetro'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedParametro?.descripcion}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {!selectedParametro && (
                    <div className="space-y-2">
                      <Label>Seleccionar Parámetro</Label>
                      <Select
                        onValueChange={(value) => {
                          const param = parametrosDisponibles.find(p => p.id === value);
                          if (param) handleOpenDialog(param);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un parámetro" />
                        </SelectTrigger>
                        <SelectContent>
                          {parametrosDisponibles.map((param) => (
                            <SelectItem key={param.id} value={param.id}>
                              {param.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedParametro && (
                    <>
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        {renderInputByType()}
                      </div>
                      <div className="space-y-2">
                        <Label>Notas (opcional)</Label>
                        <Textarea
                          value={valorFormData.notas || ''}
                          onChange={(e) => setValorFormData({...valorFormData, notas: e.target.value})}
                          placeholder="Observaciones adicionales"
                        />
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  {selectedParametro && (
                    <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Cargando...</p>
        ) : valores && valores.length > 0 ? (
          <div className="space-y-3">
            {valores.map((valor) => (
              <div key={valor.id}>
                {renderValorDisplay(valor)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay parámetros adicionales asignados
          </p>
        )}
      </CardContent>
    </Card>
  );
};
