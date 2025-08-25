/**
 * Helper functions for guardia management
 */

export interface DurationSuggestion {
  start: string;
  end: string;
  description: string;
  hours: number;
}

/**
 * Get suggested time ranges for guardias (between 12-24 hours)
 */
export const getDurationSuggestions = (startDate?: string): DurationSuggestion[] => {
  const suggestions: DurationSuggestion[] = [
    {
      start: "08:00",
      end: "20:00",
      description: "Guardia diurna (12 horas)",
      hours: 12
    },
    {
      start: "20:00",
      end: "08:00",
      description: "Guardia nocturna (12 horas)",
      hours: 12
    },
    {
      start: "08:00",
      end: "08:00",
      description: "Guardia completa (24 horas)",
      hours: 24
    },
    {
      start: "18:00",
      end: "08:00",
      description: "Guardia extendida (14 horas)",
      hours: 14
    },
    {
      start: "07:00",
      end: "19:00",
      description: "Guardia diurna extendida (12 horas)",
      hours: 12
    }
  ];

  return suggestions;
};

/**
 * Validate if a duration is acceptable for guardias (12-24 hours)
 */
export const validateGuardiaDuration = (fechaInicio: string, fechaFin: string): {
  isValid: boolean;
  error?: string;
  hours: number;
} => {
  const startDate = new Date(fechaInicio);
  const endDate = new Date(fechaFin);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: "Fechas inválidas",
      hours: 0
    };
  }

  if (endDate <= startDate) {
    return {
      isValid: false,
      error: "La fecha de fin debe ser posterior a la fecha de inicio",
      hours: 0
    };
  }

  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  if (hours < 12) {
    return {
      isValid: false,
      error: `Duración muy corta: ${hours.toFixed(1)} horas. Mínimo: 12 horas`,
      hours
    };
  }

  if (hours > 24) {
    return {
      isValid: false,
      error: `Duración muy larga: ${hours.toFixed(1)} horas. Máximo: 24 horas`,
      hours
    };
  }

  return {
    isValid: true,
    hours
  };
};

/**
 * Calculate suggested end time based on start time and duration
 */
export const calculateEndTime = (startDateTime: string, durationHours: number): string => {
  const startDate = new Date(startDateTime);
  if (isNaN(startDate.getTime())) {
    return '';
  }

  const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
  return endDate.toISOString().slice(0, 16); // Format for datetime-local input
};

/**
 * Get common durations for guardia selection
 */
export const getCommonDurations = (): Array<{ value: number; label: string }> => [
  { value: 12, label: "12 horas (estándar)" },
  { value: 14, label: "14 horas (extendida)" },
  { value: 16, label: "16 horas (larga)" },
  { value: 18, label: "18 horas (muy larga)" },
  { value: 24, label: "24 horas (completa)" }
];

/**
 * Format duration for display
 */
export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutos`;
  }
  
  if (hours === Math.floor(hours)) {
    return `${hours} horas`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

/**
 * Check if dates overlap with existing guardias
 */
export const checkOverlap = (
  newStart: string,
  newEnd: string,
  existingGuardias: Array<{ fecha_inicio: string; fecha_fin: string; profesional_guardia_id: string }>,
  profesionalGuardiaId: string
): boolean => {
  const newStartDate = new Date(newStart);
  const newEndDate = new Date(newEnd);

  return existingGuardias.some(guardia => {
    if (guardia.profesional_guardia_id !== profesionalGuardiaId) {
      return false; // Different professional, no overlap concern
    }

    const existingStart = new Date(guardia.fecha_inicio);
    const existingEnd = new Date(guardia.fecha_fin);

    // Check for any overlap
    return (newStartDate < existingEnd && newEndDate > existingStart);
  });
};
