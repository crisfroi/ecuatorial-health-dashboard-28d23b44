import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/hosixClient';
import { useState } from 'react';

export interface Paciente {
  id: string;
  ppi: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  sexo: string;
  tipo_documento?: string;
  numero_documento?: string;
  pais_documento?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  telefono_fijo?: string;
  telefono_movil?: string;
  email?: string;
  grupo_sanguineo?: string;
  alergias?: string[];
  antecedentes_familiares?: any[];
  antecedentes_personales?: any[];
  aseguradora_principal_id?: string;
  numero_poliza?: string;
  activo: boolean;
  fallecido: boolean;
  fecha_fallecimiento?: string;
  centro_registro_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PacienteFormData {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  sexo: string;
  tipo_documento?: string;
  numero_documento?: string;
  pais_documento?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  telefono_fijo?: string;
  telefono_movil?: string;
  email?: string;
  grupo_sanguineo?: string;
  alergias?: string[];
  antecedentes_familiares?: any[];
  antecedentes_personales?: any[];
  aseguradora_principal_id?: string;
  numero_poliza?: string;
  centro_registro_id?: string;
}

export const useHosixPacientes = () => {
  const queryClient = useQueryClient();
  const [filtros, setFiltros] = useState<{
    busqueda?: string;
    activo?: boolean;
    centro_id?: string;
  }>({});

  // Generar PPI secuencial
  const generarPPI = async (): Promise<string> => {
    const { data } = await supabase
      .from('hosix_pacientes')
      .select('ppi')
      .order('ppi', { ascending: false })
      .limit(1);
    
    if (!data || data.length === 0) {
      return 'PPI-0001';
    }
    
    const ultimoPPI = data[0].ppi;
    const numero = parseInt(ultimoPPI.split('-')[1]) + 1;
    return `PPI-${String(numero).padStart(4, '0')}`;
  };

  // Detectar duplicados por documento
  const buscarDuplicados = async (numero_documento: string) => {
    if (!numero_documento) return [];
    
    const { data } = await supabase
      .from('hosix_pacientes')
      .select('*')
      .eq('numero_documento', numero_documento);
    
    return data || [];
  };

  // Obtener lista de pacientes
  const { data: pacientes = [], isLoading: isLoadingPacientes, error: errorPacientes } = useQuery({
    queryKey: ['pacientes', filtros],
    queryFn: async () => {
      let query = supabase
        .from('hosix_pacientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros.busqueda) {
        const busqueda = `%${filtros.busqueda}%`;
        query = query.or(`primer_nombre.ilike.${busqueda},primer_apellido.ilike.${busqueda},numero_documento.ilike.${busqueda},ppi.ilike.${busqueda}`);
      }

      if (filtros.activo !== undefined) {
        query = query.eq('activo', filtros.activo);
      }

      if (filtros.centro_id) {
        query = query.eq('centro_registro_id', filtros.centro_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Paciente[];
    },
  });

  // Obtener historia clínica
  const { data: historiaClinica = [], isLoading: isLoadingHistoria, error: errorHistoria } = useQuery({
    queryKey: ['historia-clinica'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hosix_historia_clinica')
        .select('*')
        .order('fecha_entrada', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Obtener detalle de paciente
  const obtenerPaciente = async (id: string) => {
    const { data, error } = await supabase
      .from('hosix_pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Paciente;
  };

  // Crear paciente
  const crearPacienteMutation = useMutation({
    mutationFn: async (formData: PacienteFormData) => {
      // Generar PPI
      const ppi = await generarPPI();

      // Verificar duplicados
      if (formData.numero_documento) {
        const duplicados = await buscarDuplicados(formData.numero_documento);
        if (duplicados.length > 0) {
          throw new Error(`Paciente con documento ${formData.numero_documento} ya existe`);
        }
      }

      const { data, error } = await supabase
        .from('hosix_pacientes')
        .insert([
          {
            ...formData,
            ppi,
            activo: true,
            fallecido: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Paciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  // Actualizar paciente
  const actualizarPacienteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PacienteFormData> }) => {
      const { data: result, error } = await supabase
        .from('hosix_pacientes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Paciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  // Eliminar paciente (soft delete)
  const eliminarPacienteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hosix_pacientes')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  // Fusionar historias clínicas duplicadas
  const fusionarPacientesMutation = useMutation({
    mutationFn: async ({ paciente_principal_id, paciente_duplicado_id, motivo }: 
      { paciente_principal_id: string; paciente_duplicado_id: string; motivo: string }) => {
      // Registrar fusión en identificadores
      const { error: errorIdentificadores } = await supabase
        .from('hosix_pacientes_identificadores')
        .insert([
          {
            paciente_principal_id,
            fusionado_de: paciente_duplicado_id,
            fecha_fusion: new Date().toISOString(),
            motivo_fusion: motivo,
          },
        ]);

      if (errorIdentificadores) throw errorIdentificadores;

      // Marcar duplicado como inactivo
      const { error: errorDelete } = await supabase
        .from('hosix_pacientes')
        .update({ activo: false })
        .eq('id', paciente_duplicado_id);

      if (errorDelete) throw errorDelete;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  // Agregar contacto de emergencia
  const agregarContactoMutation = useMutation({
    mutationFn: async ({ paciente_id, nombre, parentesco, telefono, email, es_principal }: 
      { paciente_id: string; nombre: string; parentesco?: string; telefono?: string; email?: string; es_principal?: boolean }) => {
      const { data, error } = await supabase
        .from('hosix_pacientes_contactos')
        .insert([
          {
            paciente_id,
            nombre,
            parentesco,
            telefono,
            email,
            es_contacto_principal: es_principal || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  // Agregar aviso al paciente
  const agregarAvisoMutation = useMutation({
    mutationFn: async ({ paciente_id, tipo_aviso, descripcion, prioridad }: 
      { paciente_id: string; tipo_aviso?: string; descripcion: string; prioridad?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('hosix_pacientes_avisos')
        .insert([
          {
            paciente_id,
            tipo_aviso,
            descripcion,
            prioridad: prioridad || 'normal',
            creado_por: userData?.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
  });

  return {
    // Estado
    pacientes,
    isLoadingPacientes,
    errorPacientes,
    historiaClinica,
    isLoadingHistoria,
    errorHistoria,
    filtros,
    setFiltros,

    // Funciones
    obtenerPaciente,
    generarPPI,
    buscarDuplicados,

    // Mutaciones
    crearPaciente: crearPacienteMutation.mutate,
    isCreatingPaciente: crearPacienteMutation.isPending,
    actualizarPaciente: actualizarPacienteMutation.mutate,
    isUpdatingPaciente: actualizarPacienteMutation.isPending,
    eliminarPaciente: eliminarPacienteMutation.mutate,
    isEliminingPaciente: eliminarPacienteMutation.isPending,
    fusionarPacientes: fusionarPacientesMutation.mutate,
    isFusioningPacientes: fusionarPacientesMutation.isPending,
    agregarContacto: agregarContactoMutation.mutate,
    isAddingContacto: agregarContactoMutation.isPending,
    agregarAviso: agregarAvisoMutation.mutate,
    isAddingAviso: agregarAvisoMutation.isPending,

    // Errores
    errorCrearPaciente: crearPacienteMutation.error?.message,
    errorActualizar: actualizarPacienteMutation.error?.message,
    errorEliminar: eliminarPacienteMutation.error?.message,
    errorFusionar: fusionarPacientesMutation.error?.message,
  };
};
