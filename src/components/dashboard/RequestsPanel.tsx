import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profesional } from "@/hooks/useProfesionales";
import { Copy, CheckCheck, AlertTriangle, UserPlus, UserMinus, Send } from "lucide-react";

interface RequestsPanelProps {
  profesionales: Profesional[];
}

const RequestsPanel = ({ profesionales }: RequestsPanelProps) => {
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedProfessionals([]);
  }, [profesionales]);

  const handleSelectProfessional = (id: string) => {
    setSelectedProfessionals((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleStatusAction = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profesionales_sanitarios")
        .update({ estado_solicitud: newStatus })
        .in("id", selectedProfessionals);

      if (error) {
        console.error("Error updating status:", error);
        toast({
          title: "Error",
          description: "Failed to update status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Status updated successfully.",
      });

      // Invalidate and refetch the profesionales query
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      setSelectedProfessionals([]); // Clear selected professionals after update
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusActions = [
    { status: "Aprobado", label: "Aprobar", variant: "secondary", icon: CheckCheck },
    { status: "Rechazado", label: "Rechazar", variant: "destructive", icon: AlertTriangle },
    { status: "Pendiente de Firma", label: "Pendiente", variant: "secondary", icon: Send },
    { status: "En Revisión", label: "En Revisión", variant: "secondary", icon: Copy },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Solicitudes de Profesionales Sanitarios</CardTitle>
          <div className="flex space-x-2">
            {statusActions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => handleStatusAction(action.status)}
                disabled={!selectedProfessionals.length}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="divide-y divide-border">
              {profesionales.map((profesional) => (
                <div key={profesional.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={profesional.id}
                      checked={selectedProfessionals.includes(profesional.id)}
                      onCheckedChange={() => handleSelectProfessional(profesional.id)}
                    />
                    <label
                      htmlFor={profesional.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {profesional.nombre_completo}
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {profesional.area_profesional}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestsPanel;
