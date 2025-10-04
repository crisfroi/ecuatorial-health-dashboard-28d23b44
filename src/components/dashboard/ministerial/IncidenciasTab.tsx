import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IncidenciasTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: incidencias = [], isLoading } = useQuery({
    queryKey: ['incidencias-ministerial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidencias_hospitalarias')
        .select(`
          *,
          profesional:profesionales_sanitarios(nombre_completo),
          reportador:user_profiles!reportado_por(full_name)
        `)
        .order('fecha_incidencia', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const resolveIncidenciaMutation = useMutation({
    mutationFn: async (incidenciaId: string) => {
      const { error } = await supabase
        .from('incidencias_hospitalarias')
        .update({
          estado: 'Resuelta',
          fecha_resolucion: new Date().toISOString(),
          resuelto_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', incidenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias-ministerial'] });
      toast({
        title: "Incidencia resuelta",
        description: "La incidencia ha sido marcada como resuelta"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo resolver la incidencia",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const getGravedadBadge = (gravedad: string) => {
    switch (gravedad) {
      case 'Alta':
        return <Badge variant="destructive">Alta</Badge>;
      case 'Media':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'Baja':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge variant="outline">{gravedad}</Badge>;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Abierta':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Abierta</Badge>;
      case 'En Proceso':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">En Proceso</Badge>;
      case 'Resuelta':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Resuelta</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Incidencias Hospitalarias
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['incidencias-ministerial'] })}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2">Cargando incidencias...</span>
          </div>
        ) : incidencias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay incidencias registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Gravedad</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Reportado Por</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidencias.map((incidencia: any) => (
                <TableRow key={incidencia.id}>
                  <TableCell className="font-medium">
                    {incidencia.titulo_incidencia}
                    {incidencia.descripcion && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                        {incidencia.descripcion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{incidencia.tipo_incidencia || 'General'}</TableCell>
                  <TableCell>{getGravedadBadge(incidencia.gravedad)}</TableCell>
                  <TableCell>
                    {incidencia.profesional?.nombre_completo || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {incidencia.reportador?.full_name || 'Sistema'}
                  </TableCell>
                  <TableCell>
                    {new Date(incidencia.fecha_incidencia).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>{getEstadoBadge(incidencia.estado)}</TableCell>
                  <TableCell>
                    {incidencia.estado !== 'Resuelta' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        onClick={() => resolveIncidenciaMutation.mutate(incidencia.id)}
                        disabled={resolveIncidenciaMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidenciasTab;
