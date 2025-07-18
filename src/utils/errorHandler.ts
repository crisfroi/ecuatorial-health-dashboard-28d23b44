export function getErrorMessage(error: any): string {
  // Si es un string, devolverlo directamente
  if (typeof error === "string") {
    return error;
  }

  // Si es null o undefined
  if (!error) {
    return "Unknown error occurred";
  }

  // Si tiene propiedad message
  if (error.message) {
    return error.message;
  }

  // Si es un error de Supabase con details
  if (error.details) {
    return error.details;
  }

  // Si es un error de Supabase con hint
  if (error.hint) {
    return error.hint;
  }

  // Si es un error HTTP
  if (error.status || error.statusText) {
    return `HTTP ${error.status || "Error"}: ${error.statusText || "Unknown"}`;
  }

  // Si es un error con code
  if (error.code) {
    return `Error ${error.code}: ${error.description || "Unknown error"}`;
  }

  // Intentar extraer información útil del objeto
  try {
    const keys = Object.keys(error);
    if (keys.length > 0) {
      const relevantKeys = keys.filter((key) =>
        [
          "message",
          "error",
          "details",
          "description",
          "reason",
          "cause",
        ].includes(key),
      );

      if (relevantKeys.length > 0) {
        return relevantKeys.map((key) => `${key}: ${error[key]}`).join(", ");
      }

      // Si no hay keys relevantes, mostrar los primeros valores
      return keys
        .slice(0, 3)
        .map((key) => `${key}: ${error[key]}`)
        .join(", ");
    }
  } catch (e) {
    // Si falla al acceder a las propiedades
  }

  // Como último recurso, intentar JSON.stringify
  try {
    const jsonStr = JSON.stringify(error);
    if (jsonStr && jsonStr !== "{}") {
      return jsonStr.substring(0, 200); // Limitar longitud
    }
  } catch (e) {
    // Si JSON.stringify falla
  }

  // Fallback final
  return `Error object: ${typeof error} (cannot extract readable message)`;
}

export function logError(context: string, error: any): void {
  const message = getErrorMessage(error);
  console.error(`${context}:`, message);

  // Log adicional del objeto completo para debugging
  if (typeof error === "object" && error !== null) {
    console.error(`${context} (full object):`, error);
  }
}
