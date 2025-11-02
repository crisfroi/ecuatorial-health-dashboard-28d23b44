import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface Nomina {
  id: string;
  mes: number;
  anio: number;
  centro_salud_id?: string;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'pagada';
  total_bruto: number;
  total_neto: number;
  total_descuentos: number;
  cantidad_lineas: number;
  periodo?: string;
  created_at?: string;
  observaciones?: string;
}

export interface NominaLinea {
  id: string;
  nomina_id: string;
  profesional_guardia_id: string;
  categoria: string;
  guardias_ordinarias: number;
  guardias_fines_semana: number;
  guardias_festivos: number;
  monto_base: number;
  bonificacion_guardia: number;
  bonificacion_fin_semana: number;
  bonificacion_festivo: number;
  descuentos: number;
  total_linea: number;
  detalles?: string;
}

export interface Pago {
  id: string;
  nomina_id?: string;
  nomina_linea_id?: string;
  profesional_guardia_id: string;
  monto: number;
  importe?: number;
  forma_pago?: string;
  metodo_pago?: string;
  estado: 'pendiente' | 'realizado' | 'confirmado';
  comprobante_url?: string;
  referencia_pago?: string;
  observaciones?: string;
  fecha_pago?: string;
  created_at?: string;
}

export interface ResumenNominas {
  periodo: string;
  total_nominas: number;
  nominas_aprobadas: number;
  nominas_pendientes: number;
  nominas_rechazadas: number;
  total_profesionales: number;
  monto_total_bruto: number;
  monto_total_neto: number;
  monto_pagado: number;
  monto_pendiente_pago: number;
  tasa_cumplimiento: number;
}

export function useNominasPaymentSystem(
  mes: number,
  ano: number,
  centroId?: string | null
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNomina, setSelectedNomina] = useState<string | null>(null);

  // Query: Obtener nóminas desde nominas_guardias
  const nominasQuery = useQuery({
    queryKey: ['nominas_guardias', mes, ano, centroId],
    queryFn: async () => {
      let query = supabase
        .from('nominas_guardias')
        .select('*')
        .eq('mes', mes)
        .eq('anio', ano);

      if (centroId) {
        query = query.eq('centro_salud_id', centroId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Nomina[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query: Obtener líneas de nómina desde nominas_guardias_lineas
  const nominasLineasQuery = useQuery({
    queryKey: ['nominas_guardias_lineas', selectedNomina],
    queryFn: async () => {
      if (!selectedNomina) return [];

      const { data, error } = await supabase
        .from('nominas_guardias_lineas')
        .select(`
          *,
          profesionales_guardias(
            profesional_id,
            profesionales_sanitarios(id, nombre_completo)
          )
        `)
        .eq('nomina_id', selectedNomina);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!selectedNomina,
    staleTime: 5 * 60 * 1000,
  });

  // Query: Obtener pagos desde pagos_guardias
  const pagosQuery = useQuery({
    queryKey: ['pagos_guardias', mes, ano, centroId],
    queryFn: async () => {
      let query = supabase
        .from('pagos_guardias')
        .select(`
          *,
          profesionales_guardias(
            profesional_id,
            profesionales_sanitarios(nombre_completo)
          )
        `);

      // Filtrar por nóminas del período
      if (mes && ano) {
        const startDate = new Date(ano, mes - 1, 1).toISOString();
        const endDate = new Date(ano, mes, 0, 23, 59, 59).toISOString();
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      if (centroId) {
        query = query.eq('profesionales_guardias.profesional_id', centroId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Calcular nómina desde guardias
  const calcularNominaMutation = useMutation({
    mutationFn: async (params: { mes: number; ano: number; centro_id?: string }) => {
      const { data, error } = await supabase.functions.invoke(
        'calculate-nominas-from-guardias',
        { body: params }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas_guardias', mes, ano, centroId] });
      queryClient.invalidateQueries({ queryKey: ['nominas_guardias_lineas'] });
      toast({
        title: 'Éxito',
        description: 'Nómina calculada automáticamente',
      });
    },
    onError: (error) => {
      console.error('Error calculando nómina:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo calcular la nómina',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Aprobar nómina
  const aprobarNominaMutation = useMutation({
    mutationFn: async (nominaId: string) => {
      const { error } = await supabase
        .from('nominas_guardias')
        .update({ estado: 'aprobada' })
        .eq('id', nominaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas_guardias', mes, ano, centroId] });
      toast({
        title: 'Éxito',
        description: 'Nómina aprobada',
      });
    },
  });

  // Mutation: Rechazar nómina
  const rechazarNominaMutation = useMutation({
    mutationFn: async (nominaId: string) => {
      const { error } = await supabase
        .from('nominas_guardias')
        .update({ estado: 'rechazada' })
        .eq('id', nominaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nominas_guardias', mes, ano, centroId] });
      toast({
        title: 'Éxito',
        description: 'Nómina rechazada',
      });
    },
  });

  // Mutation: Crear pago
  const crearPagoMutation = useMutation({
    mutationFn: async (pago: Omit<Pago, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('pagos_guardias')
        .insert([{
          nomina_id: pago.nomina_id,
          nomina_linea_id: pago.nomina_linea_id,
          profesional_guardia_id: pago.profesional_guardia_id,
          importe: pago.monto || pago.importe,
          forma_pago: pago.forma_pago || pago.metodo_pago || 'transfer_trabajador',
          estado: pago.estado || 'pendiente',
          comprobante_url: pago.comprobante_url,
          referencia_pago: pago.referencia_pago,
          observaciones: pago.observaciones,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos_guardias', mes, ano, centroId] });
      toast({
        title: 'Éxito',
        description: 'Pago registrado',
      });
    },
  });

  // Mutation: Confirmar pago
  const confirmarPagoMutation = useMutation({
    mutationFn: async (pagoId: string) => {
      const { error } = await supabase
        .from('pagos_guardias')
        .update({ estado: 'confirmado', fecha_procesamiento: new Date().toISOString() })
        .eq('id', pagoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos_guardias', mes, ano, centroId] });
      toast({
        title: 'Éxito',
        description: 'Pago confirmado',
      });
    },
  });

  // Mutation: Procesar pagos masivos desde nómina
  const procesarPagosMasivosDesdeNominaMutation = useMutation({
    mutationFn: async (nominaId: string) => {
      // Obtener líneas de la nómina
      const { data: lineas, error: errorLineas } = await supabase
        .from('nominas_guardias_lineas')
        .select('*')
        .eq('nomina_id', nominaId);

      if (errorLineas || !lineas) throw new Error('No se pudieron obtener las líneas');

      // Crear pagos para cada línea
      const pagosParaCrear = lineas.map(linea => ({
        nomina_id: nominaId,
        nomina_linea_id: linea.id,
        profesional_guardia_id: linea.profesional_guardia_id,
        importe: linea.total_linea,
        forma_pago: 'transfer_trabajador',
        estado: 'pendiente',
        observaciones: `Pago de nómina ${linea.detalles || 'guardias'}`,
      }));

      const { error: errorPagos } = await supabase
        .from('pagos_guardias')
        .insert(pagosParaCrear);

      if (errorPagos) throw errorPagos;

      return lineas.length;
    },
    onSuccess: (cantidad) => {
      queryClient.invalidateQueries({ queryKey: ['pagos_guardias', mes, ano, centroId] });
      toast({
        title: 'Éxito',
        description: `${cantidad} pagos generados automáticamente`,
      });
    },
  });

  // Función: Obtener resumen
  const obtenerResumen = useCallback((): ResumenNominas => {
    const nominas = nominasQuery.data || [];
    const pagos = pagosQuery.data || [];

    const nominasAprobadas = nominas.filter(n => n.estado === 'aprobada').length;
    const nominasPendientes = nominas.filter(n => n.estado === 'enviada').length;
    const nominasRechazadas = nominas.filter(n => n.estado === 'rechazada').length;

    const montoBrutoTotal = nominas.reduce((sum, n) => sum + (n.total_bruto || 0), 0);
    const montoNetoTotal = nominas.reduce((sum, n) => sum + (n.total_neto || 0), 0);

    const montoPagado = pagos
      .filter(p => p.estado === 'confirmado')
      .reduce((sum, p) => sum + (p.monto || p.importe || 0), 0);

    const montoPendientePago = montoNetoTotal - montoPagado;

    return {
      periodo: `${mes}/${ano}`,
      total_nominas: nominas.length,
      nominas_aprobadas: nominasAprobadas,
      nominas_pendientes: nominasPendientes,
      nominas_rechazadas: nominasRechazadas,
      total_profesionales: nominas.reduce((sum, n) => sum + (n.cantidad_lineas || 0), 0),
      monto_total_bruto: montoBrutoTotal,
      monto_total_neto: montoNetoTotal,
      monto_pagado: montoPagado,
      monto_pendiente_pago: montoPendientePago,
      tasa_cumplimiento: nominas.length > 0 ? (nominasAprobadas / nominas.length) * 100 : 0,
    };
  }, [nominasQuery.data, pagosQuery.data]);

  // Función: Exportar nómina a PDF/Excel
  const exportarNomina = useCallback(async (nominaId: string, formato: 'pdf' | 'excel') => {
    try {
      const nomina = nominasQuery.data?.find(n => n.id === nominaId);
      const lineas = nominasLineasQuery.data || [];

      if (!nomina) throw new Error('Nómina no encontrada');

      let contenido = '';

      if (formato === 'excel') {
        // CSV
        contenido = 'Nómina,Período,Estado\n';
        contenido += `${nominaId},${nomina.mes}/${nomina.anio},${nomina.estado}\n\n`;

        contenido += 'Profesional,Guardias,Monto Base,Bonificaciones,Descuentos,Neto\n';
        for (const linea of lineas) {
          const bonificaciones = (linea.bonificacion_guardia || 0) + (linea.bonificacion_fin_semana || 0) + (linea.bonificacion_festivo || 0);
          contenido += `"${linea.profesional_guardia_id}",${linea.guardias_ordinarias + linea.guardias_fines_semana + linea.guardias_festivos},${linea.monto_base},${bonificaciones},${linea.descuentos},${linea.total_linea}\n`;
        }
      } else {
        // JSON
        contenido = JSON.stringify({
          nomina,
          lineas,
          resumen: obtenerResumen(),
        }, null, 2);
      }

      const blob = new Blob([contenido], {
        type: formato === 'excel' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina-${nominaId}-${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Éxito',
        description: `Nómina exportada en ${formato.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exportando nómina:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar la nómina',
        variant: 'destructive',
      });
    }
  }, [nominasQuery.data, nominasLineasQuery.data, toast, obtenerResumen]);

  return {
    // Datos
    nominas: nominasQuery.data || [],
    nominasLineas: nominasLineasQuery.data || [],
    pagos: pagosQuery.data || [],
    resumen: obtenerResumen(),
    selectedNomina,

    // Estados
    loading: nominasQuery.isLoading || pagosQuery.isLoading,
    isError: nominasQuery.isError || pagosQuery.isError,

    // Funciones
    setSelectedNomina,
    calcularNomina: (params: { mes: number; ano: number; centro_id?: string }) =>
      calcularNominaMutation.mutate(params),
    aprobarNomina: (nominaId: string) => aprobarNominaMutation.mutate(nominaId),
    rechazarNomina: (nominaId: string) => rechazarNominaMutation.mutate(nominaId),
    crearPago: (pago: Omit<Pago, 'id' | 'created_at'>) =>
      crearPagoMutation.mutate(pago),
    confirmarPago: (pagoId: string) => confirmarPagoMutation.mutate(pagoId),
    procesarPagosMasivosDesdeNomina: (nominaId: string) =>
      procesarPagosMasivosDesdeNominaMutation.mutate(nominaId),
    exportarNomina,

    // Estados de mutaciones
    isCalculandoNomina: calcularNominaMutation.isPending,
    isAprobandonNomina: aprobarNominaMutation.isPending,
    isRechazandoNomina: rechazarNominaMutation.isPending,
    isCrandoPago: crearPagoMutation.isPending,
    isConfirmandoPago: confirmarPagoMutation.isPending,
    isProcesandoPagosMasivos: procesarPagosMasivosDesdeNominaMutation.isPending,

    // Refetch
    refetch: () => {
      nominasQuery.refetch();
      pagosQuery.refetch();
    },
  };
}
