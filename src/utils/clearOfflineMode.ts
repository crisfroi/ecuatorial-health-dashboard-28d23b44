// Utility to clear any offline mode flags that might be causing issues
export const clearOfflineMode = () => {
  try {
    localStorage.removeItem("app-offline-mode");
    localStorage.removeItem("app-offline-reason");
    console.log("🧹 Cleared offline mode flags from localStorage");
  } catch (error) {
    console.warn("Could not clear localStorage:", error);
  }
};

// Auto-clear on import
clearOfflineMode();
