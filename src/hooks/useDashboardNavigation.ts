import { useCallback } from "react";

export interface NavigationFilters {
  area_profesional?: string[];
  estado_solicitud?: string[];
  provincia?: string[];
  distrito_sanitario?: string[];
  lugar_trabajo?: string;
  genero?: string[];
  edad_minima?: number;
  edad_maxima?: number;
  año_graduacion?: number[];
  categoria_titulacion?: string;
  categoria_centro?: string;
  pais_formacion?: string[];
  institucion?: string[];
}

export interface DashboardNavigationProps {
  onNavigateToTab: (tab: string, filters?: NavigationFilters) => void;
}

export const useDashboardNavigation = (
  onNavigateToTab: (tab: string, filters?: NavigationFilters) => void,
) => {
  const navigateToArea = useCallback(
    (area: string) => {
      onNavigateToTab("professionals", {
        area_profesional: [area],
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToDistrict = useCallback(
    (distrito: string) => {
      onNavigateToTab("professionals", {
        distrito_sanitario: [distrito],
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToCenter = useCallback(
    (centro: string) => {
      onNavigateToTab("professionals", {
        lugar_trabajo: centro,
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToInstitution = useCallback(
    (institution: string) => {
      onNavigateToTab("professionals", {
        institucion: [institution],
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToAgeRange = useCallback(
    (ageRange: string) => {
      let edad_minima, edad_maxima;

      switch (ageRange) {
        case "< 25 años":
          edad_maxima = 24;
          break;
        case "25-34 años":
          edad_minima = 25;
          edad_maxima = 34;
          break;
        case "35-44 años":
          edad_minima = 35;
          edad_maxima = 44;
          break;
        case "45-54 años":
          edad_minima = 45;
          edad_maxima = 54;
          break;
        case "55-64 años":
          edad_minima = 55;
          edad_maxima = 64;
          break;
        case "65+ años":
          edad_minima = 65;
          break;
      }

      onNavigateToTab("professionals", {
        edad_minima,
        edad_maxima,
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToRetirementRange = useCallback(
    (range: string) => {
      // Map "años restantes hasta jubilación" to age-based filters
      let años_restantes_jubilacion_min: number | undefined;
      let años_restantes_jubilacion_max: number | undefined;

      switch (range) {
        case "0-5 años":
          años_restantes_jubilacion_min = 0;
          años_restantes_jubilacion_max = 5;
          break;
        case "5-10 años":
          años_restantes_jubilacion_min = 5;
          años_restantes_jubilacion_max = 10;
          break;
        case "10-15 años":
          años_restantes_jubilacion_min = 10;
          años_restantes_jubilacion_max = 15;
          break;
        case "15-20 años":
          años_restantes_jubilacion_min = 15;
          años_restantes_jubilacion_max = 20;
          break;
        case "20-25 años":
          años_restantes_jubilacion_min = 20;
          años_restantes_jubilacion_max = 25;
          break;
        case "25+ años":
          años_restantes_jubilacion_min = 25;
          break;
      }

      onNavigateToTab("professionals", {
        estado_solicitud: ["Aprobado"],
        años_restantes_jubilacion_min,
        años_restantes_jubilacion_max,
      } as any);
    },
    [onNavigateToTab],
  );

  const navigateToGraduationYear = useCallback(
    (year: number) => {
      onNavigateToTab("professionals", {
        año_graduacion: [year],
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  const navigateToCountry = useCallback(
    (country: string) => {
      onNavigateToTab("professionals", {
        estado_solicitud: ["Aprobado"],
        pais_formacion: [country],
      });
    },
    [onNavigateToTab],
  );

  const navigateToRenewals = useCallback(
    (priority?: "alta" | "media" | "baja" | "vencido" | "all") => {
      onNavigateToTab("renewals", {
        // prioridad_renovacion: priority || "all",
      });
    },
    [onNavigateToTab],
  );

  const navigateToRequests = useCallback(
    (status?: string) => {
      onNavigateToTab("requests", {
        estado_solicitud: status || "todos",
      });
    },
    [onNavigateToTab],
  );

  const navigateToProvince = useCallback(
    (provincia: string) => {
      onNavigateToTab("professionals", {
        provincia: [provincia],
        estado_solicitud: ["Aprobado"],
      });
    },
    [onNavigateToTab],
  );

  return {
    navigateToArea,
    navigateToDistrict,
    navigateToCenter,
    navigateToInstitution,
    navigateToAgeRange,
    navigateToRetirementRange,
    navigateToGraduationYear,
    navigateToCountry,
    navigateToRenewals,
    navigateToRequests,
    navigateToProvince,
  };
};
