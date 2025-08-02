import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTestInvite = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testInvite = async (email: string, role: string) => {
    setIsLoading(true);
    console.log('🧪 Iniciando test de invitación:', { email, role });
    
    try {
      console.log('📡 Llamando función test-invite...');
      
      const { data, error } = await supabase.functions.invoke('test-invite', {
        body: {
          email,
          role,
          test: true,
          timestamp: new Date().toISOString()
        }
      });

      console.log('📨 Respuesta completa:', { data, error });

      if (error) {
        console.error('❌ Error en test:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Error en respuesta:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Test exitoso:', data);

      toast({
        title: "✅ Test Exitoso",
        description: `Función responde correctamente para ${email}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error en test completo:', error);
      
      toast({
        title: "❌ Error en Test",
        description: error.message || "Error en conexión con función",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
      console.log('🏁 Test finalizado');
    }
  };

  return {
    testInvite,
    isLoading
  };
};
