import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, X, RefreshCw } from "lucide-react";
import { useOfflineMode } from "@/hooks/useOfflineMode";

export const OfflineNotification = () => {
  const { isOfflineMode, reason, disableOfflineMode } = useOfflineMode();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show notification when offline mode is enabled
    if (isOfflineMode && !hasShown) {
      setIsVisible(true);
      setHasShown(true);

      // Auto-hide after 10 seconds if user doesn't interact
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }

    // Reset when offline mode is disabled
    if (!isOfflineMode) {
      setHasShown(false);
      setIsVisible(false);
    }
  }, [isOfflineMode, hasShown]);

  if (!isVisible || !isOfflineMode) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1 mr-2">
            <div className="font-medium text-orange-800">Connection Lost</div>
            <div className="text-sm text-orange-700">
              Switched to offline mode. Using local data.
            </div>
            {reason && reason.includes("Automatic") && (
              <div className="text-xs text-orange-600 mt-1">
                Reason: Network fetch failure detected
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => disableOfflineMode()}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="text-orange-700 hover:bg-orange-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
