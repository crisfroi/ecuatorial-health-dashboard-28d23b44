/**
 * Protocol validation utilities for guardias payment system
 * Ensures compliance with medical guards payment protocol requirements
 */

export interface ProtocolValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentValidationData {
  id?: string;
  nomina_id: string;
  profesional_guardia_id: string;
  importe: number;
  forma_pago: string;
  estado?: string;
  funcion_publica?: boolean;
  categoria?: string;
  banco?: string;
  iban_cuenta?: string;
  comprobante_url?: string;
  referencia_pago?: string;
}

/**
 * Validates payment according to protocol requirements
 */
export function validatePaymentForProtocol(payment: PaymentValidationData): ProtocolValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required fields validation
  if (!payment.nomina_id) {
    errors.push('Nómina es requerida');
  }

  if (!payment.profesional_guardia_id) {
    errors.push('Profesional de guardia es requerido');
  }

  if (!payment.importe || payment.importe <= 0) {
    errors.push('Importe debe ser mayor a 0');
  }

  if (!payment.forma_pago) {
    errors.push('Forma de pago es requerida');
  }

  // 2. Funci��n pública specific validations
  if (payment.funcion_publica === true) {
    // Public sector specific requirements
    if (payment.forma_pago === 'efectivo' && payment.importe > 50000) {
      errors.push('Pagos en efectivo para función pública no pueden exceder 50,000 XAF');
    }

    if (payment.forma_pago === 'transfer_trabajador' && !payment.iban_cuenta) {
      errors.push('Transferencia a trabajador de función pública requiere IBAN');
    }

    // Enhanced documentation for public sector
    if (!payment.comprobante_url && payment.importe > 25000) {
      warnings.push('Comprobante de pago recomendado para importes superiores a 25,000 XAF en función pública');
    }
  } else if (payment.funcion_publica === false) {
    // Private sector specific requirements
    if (payment.forma_pago === 'transfer_hospital') {
      warnings.push('Transferencia a hospital para sector privado requiere validación adicional');
    }
  }

  // 3. Payment method specific validations
  switch (payment.forma_pago) {
    case 'transfer_trabajador':
      if (!payment.banco && !payment.iban_cuenta) {
        errors.push('Transferencia a trabajador requiere datos bancarios (banco o IBAN)');
      }
      break;

    case 'transfer_hospital':
      if (!payment.referencia_pago) {
        errors.push('Transferencia a hospital requiere referencia de pago');
      }
      break;

    case 'cheque':
      if (!payment.referencia_pago) {
        errors.push('Pago por cheque requiere número de cheque en referencia');
      }
      if (payment.importe > 100000) {
        warnings.push('Cheques superiores a 100,000 XAF requieren autorización especial');
      }
      break;

    case 'efectivo':
      if (payment.importe > 50000) {
        errors.push('Pagos en efectivo no pueden exceder 50,000 XAF');
      }
      break;
  }

  // 4. Amount validations by category
  if (payment.categoria) {
    const limits = getCategoryLimits(payment.categoria);
    if (payment.importe > limits.max) {
      warnings.push(`Importe excede el límite recomendado para ${payment.categoria}: ${limits.max} XAF`);
    }
    if (payment.importe < limits.min) {
      warnings.push(`Importe por debajo del mínimo recomendado para ${payment.categoria}: ${limits.min} XAF`);
    }
  }

  // 5. Documentation requirements
  if (payment.importe > 75000 && !payment.comprobante_url) {
    errors.push('Comprobante de pago obligatorio para importes superiores a 75,000 XAF');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get payment limits by professional category
 */
function getCategoryLimits(categoria: string): { min: number; max: number } {
  const limits = {
    'especialista': { min: 80000, max: 500000 },
    'general_licenciado': { min: 50000, max: 300000 },
    'tecnico_diplomado': { min: 30000, max: 200000 },
    'auxiliar': { min: 20000, max: 150000 },
    'subalterno': { min: 15000, max: 100000 },
    'odepac': { min: 25000, max: 180000 },
    'secre_asist_pacientes': { min: 20000, max: 120000 },
    'caja': { min: 18000, max: 110000 }
  };

  return limits[categoria] || { min: 15000, max: 500000 };
}

/**
 * Validates that a payment complies with ministerial approval requirements
 */
export function requiresMinisterialApproval(payment: PaymentValidationData): boolean {
  // High-value payments require ministerial approval
  if (payment.importe > 200000) {
    return true;
  }

  // Public sector payments over certain threshold
  if (payment.funcion_publica && payment.importe > 100000) {
    return true;
  }

  // Specialist category payments over threshold
  if (payment.categoria === 'especialista' && payment.importe > 150000) {
    return true;
  }

  return false;
}

/**
 * Get required approval roles for a payment
 */
export function getRequiredApprovalRoles(payment: PaymentValidationData): string[] {
  const roles: string[] = [];

  // Base approval
  roles.push('DIRECTIVO_CENTRO_SANITARIO');

  // Financial approval for higher amounts
  if (payment.importe > 75000) {
    roles.push('PERSONALIDAD_MINISTERIAL');
  }

  // Super admin approval for very high amounts or special cases
  if (payment.importe > 200000 || requiresMinisterialApproval(payment)) {
    roles.push('SUPER_ADMINISTRADOR');
  }

  return roles;
}

/**
 * Generate audit trail entry for payment changes
 */
export function generatePaymentAuditEntry(
  pagoId: string,
  action: string,
  changes: any,
  userId: string,
  userRole: string
): any {
  return {
    ref_tipo: 'pago',
    ref_id: pagoId,
    usuario_id: userId,
    accion: action,
    detalle: {
      changes,
      user_role: userRole,
      timestamp: new Date().toISOString(),
      requires_ministerial: changes.importe ? requiresMinisterialApproval({ importe: changes.importe }) : false
    },
    fecha: new Date().toISOString(),
    ip_address: typeof window !== 'undefined' ? window.location.hostname : 'server',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
  };
}

/**
 * Format payment receipt data for protocol compliance
 */
export function formatPaymentReceipt(payment: any): any {
  return {
    numero_recibo: `REC-${payment.id.substring(0, 8).toUpperCase()}`,
    fecha_emision: new Date().toISOString(),
    profesional: {
      nombre: payment.profesional?.nombre_completo,
      categoria: payment.categoria,
      funcion_publica: payment.funcion_publica ? 'Sí' : 'No'
    },
    pago: {
      importe: payment.importe,
      forma_pago: payment.forma_pago,
      referencia: payment.referencia_pago,
      estado: payment.estado
    },
    nomina: {
      periodo: `${payment.nomina?.mes}/${payment.nomina?.anio}`,
      centro: payment.centro?.nombre
    },
    firmas: {
      aprobado_por: payment.approved_by,
      fecha_aprobacion: payment.fecha_pago,
      observaciones: payment.observaciones
    },
    cumplimiento: {
      protocolo_version: '3.0',
      validado: true,
      fecha_validacion: new Date().toISOString()
    }
  };
}
