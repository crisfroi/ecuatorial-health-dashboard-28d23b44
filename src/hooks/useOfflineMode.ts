import { useState, useEffect } from "react";

interface OfflineModeState {
  isOfflineMode: boolean;
  reason: string | null;
  enableOfflineMode: (reason: string) => void;
  disableOfflineMode: () => void;
}

export function useOfflineMode(): OfflineModeState {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  // Check localStorage for persisted offline mode
  useEffect(() => {
    const savedOfflineMode = localStorage.getItem("app-offline-mode");
    const savedReason = localStorage.getItem("app-offline-reason");

    if (savedOfflineMode === "true") {
      setIsOfflineMode(true);
      setReason(savedReason || "Unknown reason");
    }
  }, []);

  const enableOfflineMode = (offlineReason: string) => {
    setIsOfflineMode(true);
    setReason(offlineReason);
    localStorage.setItem("app-offline-mode", "true");
    localStorage.setItem("app-offline-reason", offlineReason);
    console.log(`Offline mode enabled: ${offlineReason}`);
  };

  const disableOfflineMode = () => {
    setIsOfflineMode(false);
    setReason(null);
    localStorage.removeItem("app-offline-mode");
    localStorage.removeItem("app-offline-reason");
    console.log("Offline mode disabled");

    // Reload page to attempt reconnection
    window.location.reload();
  };

  return {
    isOfflineMode,
    reason,
    enableOfflineMode,
    disableOfflineMode,
  };
}
