/**
 * Helper functions for cuadrante (schedule) generation
 */

export interface TurnoDefinition {
  inicio: number;
  fin: number;
  tipo: 'fisica' | 'localizable' | 'administrativa';
  overnight?: boolean;
  fullDay?: boolean;
  descripcion?: string;
}

/**
 * Standard shift definitions that comply with 12-24 hour guardia constraints
 */
export const getStandardTurnos = (): TurnoDefinition[] => [
  {
    inicio: 8,
    fin: 20,
    tipo: 'fisica',
    descripcion: 'Diurna (8AM-8PM, 12 horas)'
  },
  {
    inicio: 20,
    fin: 8,
    tipo: 'localizable',
    overnight: true,
    descripcion: 'Nocturna (8PM-8AM, 12 horas)'
  },
  {
    inicio: 8,
    fin: 8,
    tipo: 'fisica',
    fullDay: true,
    descripcion: 'Completa (8AM-8AM siguiente día, 24 horas)'
  }
];

/**
 * Alternative shift definitions for different scheduling patterns
 */
export const getAlternativeTurnos = (): Record<string, TurnoDefinition[]> => ({
  'standard': getStandardTurnos(),
  
  'extended': [
    {
      inicio: 7,
      fin: 19,
      tipo: 'fisica',
      descripcion: 'Extendida diurna (7AM-7PM, 12 horas)'
    },
    {
      inicio: 19,
      fin: 7,
      tipo: 'localizable',
      overnight: true,
      descripcion: 'Extendida nocturna (7PM-7AM, 12 horas)'
    }
  ],
  
  'continuous': [
    {
      inicio: 8,
      fin: 8,
      tipo: 'fisica',
      fullDay: true,
      descripcion: 'Continua 24 horas (8AM-8AM)'
    }
  ],
  
  'medical_standard': [
    {
      inicio: 8,
      fin: 20,
      tipo: 'fisica',
      descripcion: 'Médica diurna (8AM-8PM, 12 horas)'
    },
    {
      inicio: 20,
      fin: 8,
      tipo: 'localizable',
      overnight: true,
      descripcion: 'Médica nocturna localizable (8PM-8AM, 12 horas)'
    },
    {
      inicio: 8,
      fin: 14,
      tipo: 'administrativa',
      descripcion: 'Administrativa mañana (8AM-2PM, 6 horas) - NO VÁLIDA'
    }
  ]
});

/**
 * Calculate dates for a turno, handling overnight and full-day shifts
 */
export const calculateTurnoDates = (
  baseDate: Date,
  turno: TurnoDefinition
): { fechaInicio: Date; fechaFin: Date; durationHours: number } => {
  const fechaInicio = new Date(baseDate);
  fechaInicio.setHours(turno.inicio, 0, 0, 0);

  const fechaFin = new Date(baseDate);
  
  if (turno.fullDay) {
    // Guardia completa de 24 horas
    fechaFin.setDate(fechaFin.getDate() + 1);
    fechaFin.setHours(turno.fin, 0, 0, 0);
  } else if (turno.overnight || turno.fin < turno.inicio) {
    // Guardia nocturna que cruza la medianoche
    fechaFin.setDate(fechaFin.getDate() + 1);
    fechaFin.setHours(turno.fin, 0, 0, 0);
  } else {
    // Guardia del mismo día
    fechaFin.setHours(turno.fin, 0, 0, 0);
  }

  const durationHours = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);

  return { fechaInicio, fechaFin, durationHours };
};

/**
 * Validate if a turno produces a valid guardia duration
 */
export const validateTurnoDuration = (
  baseDate: Date,
  turno: TurnoDefinition
): { isValid: boolean; error?: string; durationHours: number } => {
  const { durationHours } = calculateTurnoDates(baseDate, turno);

  if (durationHours < 12) {
    return {
      isValid: false,
      error: `Duración muy corta: ${durationHours.toFixed(1)} horas. Mínimo: 12 horas`,
      durationHours
    };
  }

  if (durationHours > 24) {
    return {
      isValid: false,
      error: `Duración muy larga: ${durationHours.toFixed(1)} horas. Máximo: 24 horas`,
      durationHours
    };
  }

  return {
    isValid: true,
    durationHours
  };
};

/**
 * Get optimized turnos that only include valid durations
 */
export const getValidTurnos = (testDate?: Date): TurnoDefinition[] => {
  const baseDate = testDate || new Date();
  return getStandardTurnos().filter(turno => {
    const validation = validateTurnoDuration(baseDate, turno);
    return validation.isValid;
  });
};

/**
 * Generate summary of turno patterns for a given set
 */
export const getTurnoSummary = (turnos: TurnoDefinition[], testDate?: Date) => {
  const baseDate = testDate || new Date();
  
  return turnos.map(turno => {
    const { fechaInicio, fechaFin, durationHours } = calculateTurnoDates(baseDate, turno);
    const validation = validateTurnoDuration(baseDate, turno);
    
    return {
      turno,
      durationHours: durationHours.toFixed(1),
      isValid: validation.isValid,
      error: validation.error,
      schedule: `${fechaInicio.toLocaleTimeString()} - ${fechaFin.toLocaleTimeString()}`,
      overnight: turno.overnight || turno.fullDay || turno.fin < turno.inicio
    };
  });
};

/**
 * Create a guardia object from validated turno and dates
 */
export const createGuardiaFromTurno = (
  baseDate: Date,
  turno: TurnoDefinition,
  profesionalGuardiaId: string,
  centroSaludId: string,
  tipoDia: string,
  observaciones?: string
) => {
  const { fechaInicio, fechaFin, durationHours } = calculateTurnoDates(baseDate, turno);
  
  // Validate before creating
  const validation = validateTurnoDuration(baseDate, turno);
  if (!validation.isValid) {
    throw new Error(`Cannot create guardia: ${validation.error}`);
  }

  return {
    profesional_guardia_id: profesionalGuardiaId,
    centro_salud_id: centroSaludId,
    tipo: turno.tipo,
    fecha_inicio: fechaInicio.toISOString(),
    fecha_fin: fechaFin.toISOString(),
    tipo_dia: tipoDia,
    observaciones: observaciones || `${turno.descripcion || 'Guardia generada automáticamente'} - ${durationHours.toFixed(1)}h`
  };
};

/**
 * Test helper to verify all turnos produce valid guardias
 */
export const testTurnoValidation = (turnos: TurnoDefinition[] = getStandardTurnos()) => {
  console.log('🧪 Testing turno validation...');
  
  const testDate = new Date();
  const results = getTurnoSummary(turnos, testDate);
  
  console.table(results);
  
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.filter(r => !r.isValid).length;
  
  console.log(`✅ Valid turnos: ${validCount}`);
  console.log(`❌ Invalid turnos: ${invalidCount}`);
  
  return {
    valid: validCount,
    invalid: invalidCount,
    allValid: invalidCount === 0,
    results
  };
};

// Run test when module loads in development
if (import.meta.env?.DEV) {
  console.log('🧪 Running cuadrante turno validation tests...');
  testTurnoValidation();
}
