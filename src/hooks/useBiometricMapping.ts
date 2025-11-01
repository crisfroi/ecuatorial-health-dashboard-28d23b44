import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES basadas en la estructura de datos ---

interface ProfessionalRow {
    id: string;
    numero_enrolamiento_enno: string | null;
}

// Adaptada al esquema de la tabla 'dispositivos'
interface Dispositivo {
    id: string; // La UUID del dispositivo
    nombre: string;
    centro_salud_id: string | null;
}

interface EmpleadoDispositivoMapPayload {
    id_profesional: string;
    en_no: string; // Número de enrolamiento del profesional
    id_dispositivo: string; // UUID del dispositivo
}

/**
 * Hook para gestionar el mapeo de profesionales (con ENNO) a TODOS los dispositivos
 * biométricos activos en un centro de salud.
 * * Este mapeo es esencial para que la importación de fichajes funcione correctamente.
 * * @param centerId El ID del centro de salud actualmente seleccionado.
 */
export const useBiometricMapping = (centerId: string | null) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Dispositivos del centro (de la tabla 'dispositivos')
    const devicesQuery = useQuery<Dispositivo[]>({
        queryKey: ['devices-center', centerId, 'for-mapping'],
        queryFn: async () => {
            if (!centerId) return [];
            const { data, error } = await supabase
                .from('dispositivos') // <-- Usando la tabla correcta: 'dispositivos'
                .select('id, nombre, centro_salud_id')
                .eq('centro_salud_id', centerId)
                .eq('activo', true); // Solo mapeamos a dispositivos activos
            if (error) throw error;
            return data ?? [];
        },
        enabled: Boolean(centerId),
        staleTime: 5 * 60_000,
    });

    // 2. Fetch Profesionales (solo ID y ENNO) del centro
    const professionalsEnNoQuery = useQuery<ProfessionalRow[]>({
        queryKey: ['professionals-enno-center', centerId],
        queryFn: async () => {
            if (!centerId) return [];
            const { data, error } = await supabase
                .from('profesionales_sanitarios')
                .select('id, numero_enrolamiento_enno')
                .eq('centro_salud_id', centerId)
                .not('numero_enrolamiento_enno', 'is', null); // Solo los que tienen ENNO
            if (error) throw error;
            return data ?? [];
        },
        enabled: Boolean(centerId),
        staleTime: 5 * 60_000,
    });

    // 3. Mutation para crear mapeos en empleado_dispositivo_map
    const createMappingsMutation = useMutation({
        mutationFn: async (mappingsToCreate: EmpleadoDispositivoMapPayload[]) => {
            if (mappingsToCreate.length === 0) return;

            // Inserta los mapeos. La tabla debe tener una restricción UNIQUE en 
            // (id_profesional, id_dispositivo) para evitar duplicados si se llama dos veces.
            const { error } = await supabase
                .from('empleado_dispositivo_map')
                .insert(mappingsToCreate);

            // Si hay un error de conflicto (duplicado) en la base de datos, Supabase lo manejará, 
            // pero si es un error fatal de inserción, lanzamos.
            if (error) {
                // Supabase a veces lanza "Duplicate key" como error genérico. 
                // Aquí asumimos que queremos continuar si ya existen y solo fallar en otros errores.
                if (error.code !== '23505') { // 23505 es el código de error para violación de unique/primary key
                    throw new Error(`Error al crear mapeos: ${error.message}`);
                }
            }
        },
        onSuccess: () => {
            // Invalidar caché del panel de fichajes para que se actualice la lista de mapeos
            queryClient.invalidateQueries({ queryKey: ['device-mappings'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error de Mapeo Biométrico',
                description: `Algunos mapeos no se pudieron crear: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    /**
     * Función principal para asegurar el mapeo de los profesionales seleccionados a todos los dispositivos del centro.
     * @param professionalIds Ids de los profesionales recién afectados por la regla.
     * @returns Número de mapeos creados.
     */
    const createMappingsForProfessionals = async (professionalIds: string[]): Promise<number> => {
        const devices = devicesQuery.data || [];
        const professionals = professionalsEnNoQuery.data || [];

        if (devices.length === 0) return 0; // No hay dispositivos activos
        
        // 1. Filtrar los profesionales con ENNO que fueron afectados por la acción
        const professionalsToMap = professionals.filter(p => 
            professionalIds.includes(p.id) && p.numero_enrolamiento_enno
        ).map(p => ({
            id: p.id, // id_profesional
            enNo: p.numero_enrolamiento_enno!,
        }));
        
        if (professionalsToMap.length === 0) return 0; 

        // 2. Buscar los mapeos existentes para evitar inserciones innecesarias y errores de duplicado
        const deviceIds = devices.map(d => d.id);
        const { data: existingMaps = [], error: mapError } = await supabase
            .from('empleado_dispositivo_map')
            .select('id_profesional, id_dispositivo')
            .in('id_dispositivo', deviceIds)
            .in('id_profesional', professionalsToMap.map(p => p.id));

        if (mapError) throw new Error(`Error al obtener mapeos existentes: ${mapError.message}`);

        // Crear un mapa/set de mapeos existentes para verificación rápida: "profId-deviceId"
        const existingMapSet = new Set(
            existingMaps.map(m => `${m.id_profesional}-${m.id_dispositivo}`)
        );

        // 3. Generar la lista de mapeos que realmente faltan
        const mappingsToCreate: EmpleadoDispositivoMapPayload[] = [];
        
        for (const prof of professionalsToMap) {
            for (const device of devices) {
                const mapKey = `${prof.id}-${device.id}`;
                if (!existingMapSet.has(mapKey)) {
                    mappingsToCreate.push({
                        id_profesional: prof.id,
                        en_no: prof.enNo,
                        id_dispositivo: device.id,
                    });
                }
            }
        }

        // 4. Ejecutar la mutación (inserción)
        if (mappingsToCreate.length > 0) {
            await createMappingsMutation.mutateAsync(mappingsToCreate);
        }
        
        return mappingsToCreate.length;
    };

    return {
        // Combinamos los estados de carga para dar una única señal de "ocupado"
        isMappingProcessing: professionalsEnNoQuery.isLoading || devicesQuery.isLoading || createMappingsMutation.isPending,
        // Exponemos la función de mapeo para que HorariosBasePanel la use
        createMappingsForProfessionals,
    };
};
