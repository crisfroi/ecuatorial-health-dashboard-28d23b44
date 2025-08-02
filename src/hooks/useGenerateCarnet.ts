
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGenerateCarnet() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profesionalId: string) => {
      console.log(`🎫 Iniciando generación de carnet para profesional: ${profesionalId}`);

      try {
        // Verificar que el profesional existe y tiene los datos necesarios
        const { data: profesional, error: checkError } = await supabase
          .from("profesionales_sanitarios")
          .select("id, id_profesional_unico, url_codigo_barras, estado_solicitud, nombre_completo")
          .eq("id", profesionalId)
          .single();

        if (checkError || !profesional) {
          console.error("❌ Error verificando profesional:", checkError);
          throw new Error(`Profesional no encontrado: ${checkError?.message || 'ID inválido'}`);
        }

        console.log("📋 Datos del profesional:", {
          id: profesional.id,
          nombre: profesional.nombre_completo,
          estado: profesional.estado_solicitud,
          tieneId: !!profesional.id_profesional_unico,
          tieneCodigoBarras: !!profesional.url_codigo_barras
        });

        // Verificar estado
        if (profesional.estado_solicitud !== 'Pendiente de Firma' && profesional.estado_solicitud !== 'Aprobado') {
          throw new Error(`El profesional debe estar en estado "Pendiente de Firma" o "Aprobado" para generar el carnet. Estado actual: ${profesional.estado_solicitud}`);
        }

        // Obtener la sesión actual para la autorización
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Construir URL de la edge function
        const supabaseUrl = 'https://wdieynendfjbkbhfovrx.supabase.co';
        const functionUrl = `${supabaseUrl}/functions/v1/generar-carnet-profesional`;

        console.log(`🌐 Llamando a edge function: ${functionUrl}`);

        // Llamar a la edge function para generar el carnet
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            profesional_id: profesionalId,
            force_regenerate: false
          })
        });

        console.log(`📡 Respuesta HTTP: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
          }
          
          console.error("❌ Error de la edge function:", errorData);
          throw new Error(errorData?.error || errorData?.details || `Error HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          console.error("❌ Edge function reportó error:", result);
          throw new Error(result.error || result.details || 'Error desconocido al generar carnet');
        }

        console.log('✅ Carnet generado exitosamente:', {
          url: result.url_carnet,
          mensaje: result.message
        });

        return result;

      } catch (error: any) {
        console.error('❌ Error completo al generar carnet:', error);
        
        // Mejorar mensajes de error
        let friendlyMessage = error.message;
        
        if (friendlyMessage.includes('404')) {
          friendlyMessage = 'Servicio de generación de carnets no disponible temporalmente';
        } else if (friendlyMessage.includes('500')) {
          friendlyMessage = 'Error interno del servidor al generar el carnet';
        } else if (friendlyMessage.includes('403')) {
          friendlyMessage = 'No tiene permisos para generar carnets';
        } else if (friendlyMessage.includes('NetworkError') || friendlyMessage.includes('fetch')) {
          friendlyMessage = 'Error de conexión. Verifique su internet e intente nuevamente';
        }
        
        throw new Error(friendlyMessage);
      }
    },
    onSuccess: (data) => {
      console.log("🎉 Carnet generado con éxito:", data);
      toast({
        title: "🎫 Carnet generado",
        description: `El carnet profesional ha sido generado exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error("❌ Error en generación de carnet:", error);
      toast({
        title: "❌ Error al generar carnet",
        description: error.message || "No se pudo generar el carnet profesional.",
        variant: "destructive",
        duration: 10000,
      });
    },
  });
}
