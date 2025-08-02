import React, { useState, useCallback } from 'react';
import { MainLayout } from "@/layouts/MainLayout";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProfessionalsTable } from "@/components/dashboard/ProfessionalsTable";
import { RenewalAlerts } from "@/components/dashboard/RenewalAlerts";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Filtros } from "@/hooks/useProfesionales";

const Dashboard = () => {
  const [filters, setFilters] = useState<Filtros>({});
  const [activeTab, setActiveTab] = useState<string>('profesionales');
  const { toast } = useToast();

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleNavigateToProfessionals = (filter: Filtros) => {
    setFilters(filter);
    setActiveTab('profesionales');
  };

  const handleSendSmsNotification = useCallback(async (profesionalId: string, telefono: string, nombreCompleto: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          telefono: telefono,
          nombre_completo: nombreCompleto,
        },
      });

      if (error) {
        console.error("Error al enviar SMS:", error);
        toast({
          title: "Error",
          description: `No se pudo enviar el SMS a ${nombreCompleto}. Error: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("SMS enviado correctamente:", data);
        toast({
          title: "Éxito",
          description: `SMS enviado correctamente a ${nombreCompleto}.`,
        });
      }
    } catch (error: any) {
      console.error("Error al invocar la función:", error);
      toast({
        title: "Error",
        description: `Error al intentar enviar el SMS a ${nombreCompleto}. Error: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainLayout>
        <div className="container mx-auto py-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Control</h1>

          <DashboardFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
          />

          <StatsCards onNavigateToSection={handleNavigateToProfessionals} />

          {/* Fix component props */}
          <ProfessionalsTable
            dashboardFilters={filters}
          />

          <RenewalAlerts
            dashboardFilters={filters}
            onSendSmsNotification={handleSendSmsNotification}
          />

        </div>
      </MainLayout>
    </div>
  );
};

export default Dashboard;
