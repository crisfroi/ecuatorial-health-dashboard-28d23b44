import React from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkStatus } from '@/utils/networkErrorHandler';

export const NetworkStatusIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) {
    return null; // Don't show anything when online
  }
  
  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-700">
        Sin conexión a internet. Algunas funcionalidades pueden no estar disponibles.
      </AlertDescription>
    </Alert>
  );
};

export default NetworkStatusIndicator;
