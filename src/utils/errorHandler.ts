export function getErrorMessage(error: any): string {
  // Si es un string, devolverlo directamente
  if (typeof error === "string") {
    return error;
  }

  // Si es null o undefined
  if (!error) {
    return "Unknown error occurred";
  }

  // Special handling for connection failures with empty messages
  if (error && typeof error === "object" && error.message === "") {
    console.log("Detected empty message error, checking for connection issues");

    // Check if this looks like a network/connection error
    if (error.code === "PGRST301" || error.code === "PGRST116") {
      return "Database connection error - please check your internet connection";
    }

    // Check for common Supabase error patterns
    if (error.details || error.hint || error.code) {
      return `Database error (${error.code || "unknown"}): ${error.details || error.hint || "Connection failed"}`;
    }

    // If message is empty but we have other properties, use them
    const keys = Object.keys(error);
    if (keys.length > 1) {
      return `Connection error - detected properties: ${keys.join(", ")}`;
    }

    // Provide more context for empty error responses
    console.log("Analyzing empty error response for more context...");

    // Check if we're offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "Database connection failed - device appears to be offline";
    }

    // Check if this might be a CORS issue
    if (typeof window !== "undefined" && window.location) {
      const currentOrigin = window.location.origin;
      console.log("Current origin:", currentOrigin);
      if (
        currentOrigin.includes("localhost") ||
        currentOrigin.includes("127.0.0.1")
      ) {
        return "Database connection failed - possible CORS issue on localhost";
      }
    }

    // Check for error object structure patterns
    if (error && typeof error === "object") {
      const errorKeys = Object.keys(error);
      if (errorKeys.length === 0) {
        return "Database connection failed - received empty error object (possible network timeout)";
      }
      if (errorKeys.includes("name") && error.name === "TypeError") {
        return "Database connection failed - network error (TypeError detected)";
      }
      if (errorKeys.includes("stack") && errorKeys.length <= 2) {
        return "Database connection failed - minimal error info (possible fetch/network issue)";
      }
    }

    return "Database connection failed - empty error response (check network and Supabase configuration)";
  }

  console.log("Error analysis:", {
    type: typeof error,
    constructor: error?.constructor?.name,
    hasMessage: "message" in error,
    messageType: typeof error?.message,
    messageValue: error?.message,
    messageLength: error?.message?.length,
    keys: Object.keys(error || {}),
    error: error,
  });

  // Priority order for extracting error information
  const errorSources = [
    // Try message first
    () => {
      if (error.message !== undefined) {
        if (typeof error.message === "string") {
          // If message is empty string, try to extract more info
          if (!error.message.trim()) {
            console.log(
              "Empty message detected, looking for alternative error info",
            );
            return null; // Will continue to next error source
          }
          return error.message;
        }
        if (typeof error.message === "object" && error.message !== null) {
          const nestedMessage = getErrorMessage(error.message);
          if (nestedMessage !== "Unknown error occurred") {
            return nestedMessage;
          }
        }
      }
      return null;
    },

    // Try Supabase specific error properties
    () => {
      // Check for PostgrestError structure
      if (error.code && error.hint) {
        return `Database Error (${error.code}): ${error.hint}`;
      }
      if (error.code && error.details) {
        return `Database Error (${error.code}): ${error.details}`;
      }
      return null;
    },

    // Try details
    () =>
      error.details && typeof error.details === "string" && error.details.trim()
        ? error.details
        : null,

    // Try hint
    () =>
      error.hint && typeof error.hint === "string" && error.hint.trim()
        ? error.hint
        : null,

    // Try error property
    () =>
      error.error && typeof error.error === "string" && error.error.trim()
        ? error.error
        : null,

    // Try description
    () =>
      error.description &&
      typeof error.description === "string" &&
      error.description.trim()
        ? error.description
        : null,

    // Try name
    () =>
      error.name && typeof error.name === "string" && error.name.trim()
        ? error.name
        : null,

    // Try code with description
    () =>
      error.code
        ? `Error ${error.code}${error.description ? ": " + error.description : ""}`
        : null,

    // Try HTTP status
    () =>
      error.status || error.statusText
        ? `HTTP ${error.status || "Error"}: ${error.statusText || "Unknown"}`
        : null,

    // Try toString if available
    () => {
      try {
        const str = error.toString();
        if (
          str &&
          str !== "[object Object]" &&
          str !== error.constructor?.name
        ) {
          return str;
        }
      } catch (e) {
        // Ignore toString errors
      }
      return null;
    },
  ];

  // Try each error source in priority order
  for (const source of errorSources) {
    try {
      const result = source();
      if (result) {
        console.log("Extracted error message:", result);
        return result;
      }
    } catch (e) {
      console.warn("Error source failed:", e);
    }
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
        } else if (value && typeof value === "object" && value !== null) {
          // Recursively try to extract message from nested objects
          const nestedMessage = getErrorMessage(value);
          if (nestedMessage !== "Unknown error occurred") {
            keyValues.push(`${key}: ${nestedMessage.substring(0, 100)}`);
          } else {
            keyValues.push(
              `${key}: [object ${value.constructor?.name || "Object"}]`,
            );
          }
        } else if (value !== undefined && value !== null) {
          keyValues.push(`${key}: ${String(value).substring(0, 50)}`);
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

  // Special case for completely empty or minimal error objects
  if (typeof error === "object" && error !== null) {
    const keys = Object.keys(error);
    if (keys.length === 0) {
      return "Empty error object - possible network or configuration issue";
    }
    if (keys.length === 1 && keys[0] === "message" && !error.message) {
      return "Error with empty message - likely database connection issue";
    }
  }

  // Enhanced fallback with network diagnostics
  const errorType = typeof error;
  const constructor = error?.constructor?.name || "unknown";
  const toString = (() => {
    try {
      return error?.toString?.() || "unavailable";
    } catch (e) {
      return "toString failed";
    }
  })();

  // Add network context if available
  const networkInfo = [];
  if (typeof navigator !== "undefined") {
    networkInfo.push(`online: ${navigator.onLine}`);
  }
  if (typeof window !== "undefined" && window.location) {
    networkInfo.push(`origin: ${window.location.origin}`);
  }

  const networkContext =
    networkInfo.length > 0 ? ` [${networkInfo.join(", ")}]` : "";

  return `Unknown error - Type: ${errorType}, Constructor: ${constructor}, toString: ${toString}${networkContext}`;
}

export function logError(context: string, error: any): void {
  const message = getErrorMessage(error);
  console.error(`${context}:`, message);

  // Log adicional del objeto completo para debugging
  if (typeof error === "object" && error !== null) {
    console.error(`${context} (full object):`, error);
  }
}
