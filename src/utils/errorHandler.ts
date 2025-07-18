export function getErrorMessage(error: any): string {
  // Si es un string, devolverlo directamente
  if (typeof error === "string") {
    return error;
  }

  // Si es null o undefined
  if (!error) {
    return "Unknown error occurred";
  }

  // Si tiene propiedad message y no está vacía
  if (error.message && error.message.trim()) {
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
    console.log("Error object keys:", keys); // Debug logging
    console.log("Error object:", error); // Full object logging

    if (keys.length > 0) {
      const relevantKeys = keys.filter((key) =>
        [
          "message",
          "error",
          "details",
          "description",
          "reason",
          "cause",
          "name",
          "stack",
        ].includes(key),
      );

      const keyValues: string[] = [];
      for (const key of relevantKeys) {
        const value = error[key];
        if (value && typeof value === "string" && value.trim()) {
          keyValues.push(`${key}: ${value.substring(0, 100)}`);
        } else if (value && typeof value !== "string") {
          keyValues.push(`${key}: ${typeof value}`);
        }
      }

      if (keyValues.length > 0) {
        return keyValues.join(" | ");
      }

      // Si no hay keys relevantes con contenido, mostrar información básica
      const basicInfo: string[] = [];
      if (error.constructor && error.constructor.name) {
        basicInfo.push(`Type: ${error.constructor.name}`);
      }
      basicInfo.push(`Keys: [${keys.slice(0, 5).join(", ")}]`);

      return basicInfo.join(" | ");
    }
  } catch (e) {
    console.error("Failed to extract error keys:", e);
  }

  // Como último recurso, intentar JSON.stringify con replacer para capturar más propiedades
  try {
    const jsonStr = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    if (jsonStr && jsonStr !== "{}" && jsonStr !== "null") {
      return `JSON: ${jsonStr.substring(0, 300)}`;
    }
  } catch (e) {
    console.error("Failed to stringify error:", e);
  }

  // Fallback final con más información
  return `Error object: ${typeof error} (constructor: ${error?.constructor?.name || "unknown"}, toString: ${error?.toString?.() || "unavailable"})`;
}

export function logError(context: string, error: any): void {
  const message = getErrorMessage(error);
  console.error(`${context}:`, message);

  // Log adicional del objeto completo para debugging
  if (typeof error === "object" && error !== null) {
    console.error(`${context} (full object):`, error);
  }
}
