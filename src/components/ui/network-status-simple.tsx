import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
  showIndicator?: boolean;
  className?: string;
}

export function NetworkStatusSimple({ showIndicator = true, className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  if (!isOnline) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Sin conexión a internet. Algunas funciones pueden no estar disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Badge variant="default" className={`${className} flex items-center gap-1`}>
      <Wifi className="h-3 w-3" />
      <span className="text-xs">Conectado</span>
    </Badge>
  );
}

export default NetworkStatusSimple;
