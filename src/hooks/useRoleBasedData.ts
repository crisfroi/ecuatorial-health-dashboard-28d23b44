import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/roles';

/**
 * Hook para aplicar filtros de datos basados en el rol del usuario
 */
export const useRoleBasedData = () => {
  const { userRole, user, getRestrictions } = useAuth();
  const restrictions = getRestrictions();

  // Función para filtrar datos de profesionales según el rol
  const filterProfessionalsData = useMemo(() => {
    return (data: any[]) => {
      if (!userRole || !data) return data;

      switch (userRole) {
        case 'SUPER_ADMINISTRADOR':
          // Sin restricciones
          return data;

        case 'REVISOR_SOLICITUDES':
          // Sin restricciones para revisores
          return data;

        case 'PERSONALIDAD_MINISTERIAL':
          // Ocultar datos personales sensibles
          return data.map(professional => ({
            ...professional,
            telefono: restrictions.dataFilters?.hidePersonalDetails ? '***' : professional.telefono,
            numero_dip: restrictions.dataFilters?.hidePersonalDetails ? '***' : professional.numero_dip,
            numero_pasaporte: restrictions.dataFilters?.hidePersonalDetails ? '***' : professional.numero_pasaporte,
            domicilio: restrictions.dataFilters?.hidePersonalDetails ? 'Restringido' : professional.domicilio
          }));

        case 'OBSERVADOR':
          // Solo datos públicos, sin información personal
          return data.map(professional => ({
            ...professional,
            telefono: '***',
            numero_dip: '***',
            numero_pasaporte: '***',
            domicilio: 'Restringido',
            email: '***'
          }));

        case 'DIRECTIVO_CENTRO_SANITARIO':
          // Solo profesionales de su centro asignado
          if (restrictions.dataFilters?.centerRestricted && user?.assigned_center_id) {
            console.log('🏥 Filtro DIRECTIVO_CENTRO_SANITARIO aplicado:', {
              userId: user.id,
              assignedCenter: user.assigned_center_id,
              totalRecords: data.length
            });

            const filteredData = data.filter(professional => {
              // Filtro por ID de centro (más confiable)
              const matchesById = professional.centro_salud_id === user.assigned_center_id;

              // Filtro por nombre de centro (fallback para datos legacy)
              const matchesByName = professional.nombre_centro &&
                typeof user.assigned_center_id === 'string' &&
                professional.nombre_centro.toLowerCase().includes(user.assigned_center_id.toLowerCase());

              return matchesById || matchesByName;
            });

            console.log('🔍 Resultado filtro directivo:', {
              filteredRecords: filteredData.length,
              centerMatches: filteredData.map(p => ({
                id: p.id,
                nombre: p.nombre_completo,
                centro: p.nombre_centro,
                centro_id: p.centro_salud_id
              }))
            });

            return filteredData;
          }
          return data;

        default:
          return data;
      }
    };
  }, [userRole, restrictions, user]);

  // Función para filtrar datos de centros según el rol
  const filterCentersData = useMemo(() => {
    return (data: any[]) => {
      if (!userRole || !data) return data;

      switch (userRole) {
        case 'DIRECTIVO_CENTRO_SANITARIO':
          // Solo su centro asignado
          if (restrictions.dataFilters?.centerRestricted && user?.assigned_center_id) {
            console.log('🏥 Filtro CENTROS DIRECTIVO aplicado:', {
              userId: user.id,
              assignedCenter: user.assigned_center_id,
              totalCenters: data.length
            });

            const filteredCenters = data.filter(center => {
              const matchesById = center.id === user.assigned_center_id;
              const matchesByName = center.nombre &&
                typeof user.assigned_center_id === 'string' &&
                center.nombre.toLowerCase().includes(user.assigned_center_id.toLowerCase());

              return matchesById || matchesByName;
            });

            console.log('🔍 Centros filtrados:', {
              filteredCount: filteredCenters.length,
              centers: filteredCenters.map(c => ({ id: c.id, nombre: c.nombre }))
            });

            return filteredCenters;
          }
          return data;

        default:
          // Otros roles pueden ver todos los centros
          return data;
      }
    };
  }, [userRole, restrictions, user]);

  // Función para filtrar datos de incidencias según el rol
  const filterIncidentsData = useMemo(() => {
    return (data: any[]) => {
      if (!userRole || !data) return data;

      switch (userRole) {
        case 'DIRECTIVO_CENTRO_SANITARIO':
          // Solo incidencias de su centro
          if (restrictions.dataFilters?.centerRestricted && user?.assigned_center_id) {
            return data.filter(incident => 
              incident.centroAfectado === user.assigned_center_id ||
              incident.centroTrabajo === user.assigned_center_id
            );
          }
          return data;

        case 'OBSERVADOR':
          // Solo incidencias resueltas (no sensibles)
          return data.filter(incident => incident.estado === 'Resuelta');

        default:
          return data;
      }
    };
  }, [userRole, restrictions, user]);

  // Función para determinar si se pueden exportar datos
  const canExportData = useMemo(() => {
    return (recordCount: number = 0) => {
      if (!userRole) return false;

      switch (userRole) {
        case 'SUPER_ADMINISTRADOR':
        case 'REVISOR_SOLICITUDES':
        case 'PERSONALIDAD_MINISTERIAL':
          return true;

        case 'OBSERVADOR':
          return recordCount <= (restrictions.exportLimits || 100);

        case 'DIRECTIVO_CENTRO_SANITARIO':
          return recordCount <= 500; // Límite moderado

        default:
          return false;
      }
    };
  }, [userRole, restrictions]);

  // Función para obtener estadísticas permitidas según el rol
  const getAllowedMetrics = useMemo(() => {
    return () => {
      if (!userRole) return [];

      const baseMetrics = [
        'total_professionals',
        'total_centers',
        'basic_statistics'
      ];

      switch (userRole) {
        case 'SUPER_ADMINISTRADOR':
          return [
            ...baseMetrics,
            'pending_requests',
            'system_health',
            'financial_data',
            'audit_logs',
            'user_activity',
            'performance_metrics'
          ];

        case 'REVISOR_SOLICITUDES':
          return [
            ...baseMetrics,
            'pending_requests',
            'approval_statistics',
            'processing_times',
            'professional_trends'
          ];

        case 'PERSONALIDAD_MINISTERIAL':
          return [
            ...baseMetrics,
            'coverage_statistics',
            'strategic_metrics',
            'monthly_trends',
            'policy_impact'
          ];

        case 'OBSERVADOR':
          return [
            ...baseMetrics,
            'public_statistics'
          ];

        case 'DIRECTIVO_CENTRO_SANITARIO':
          return [
            'center_statistics',
            'assigned_professionals',
            'center_incidents',
            'center_performance'
          ];

        default:
          return baseMetrics;
      }
    };
  }, [userRole]);

  // Función para verificar acceso a datos sensibles
  const canAccessSensitiveData = useMemo(() => {
    return (dataType: string) => {
      if (!userRole) return false;

      const sensitiveDataAccess: Record<UserRole, string[]> = {
        'SUPER_ADMINISTRADOR': ['all'],
        'REVISOR_SOLICITUDES': ['professional_details', 'contact_info', 'documents'],
        'PERSONALIDAD_MINISTERIAL': ['aggregated_data', 'trends', 'policies'],
        'OBSERVADOR': ['public_data'],
        'DIRECTIVO_CENTRO_SANITARIO': ['center_data', 'assigned_staff']
      };

      const allowedData = sensitiveDataAccess[userRole] || [];
      return allowedData.includes('all') || allowedData.includes(dataType);
    };
  }, [userRole]);

  return {
    userRole,
    restrictions,
    filterProfessionalsData,
    filterCentersData,
    filterIncidentsData,
    canExportData,
    getAllowedMetrics,
    canAccessSensitiveData,
    isRestricted: Object.keys(restrictions).length > 0
  };
};

export default useRoleBasedData;
