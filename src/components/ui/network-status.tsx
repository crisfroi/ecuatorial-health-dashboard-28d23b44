import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkStatusProps {
  showIndicator?: boolean;
  className?: string;
}

export function NetworkStatus({ showIndicator = true, className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Test connection quality periodically
    const testConnection = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const start = Date.now();
        const response = await fetch('/placeholder.svg', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;

        if (response.ok) {
          setConnectionQuality(duration > 3000 ? 'poor' : 'good');
        } else {
          setConnectionQuality('poor');
        }
      } catch {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection quality every 30 seconds
    const intervalId = setInterval(testConnection, 30000);

    // Initial test
    testConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionQuality) {
      case 'good': return 'default';
      case 'poor': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionQuality) {
      case 'good': return 'Conectado';
      case 'poor': return 'Conexión lenta';
      case 'offline': return 'Sin conexión';
      default: return 'Desconocido';
    }
  };

  const getIcon = () => {
    switch (connectionQuality) {
      case 'good': return <Wifi className="h-3 w-3" />;
      case 'poor': return <AlertCircle className="h-3 w-3" />;
      case 'offline': return <WifiOff className="h-3 w-3" />;
      default: return <Wifi className="h-3 w-3" />;
    }
  };

  if (!showIndicator) return null;

  if (connectionQuality === 'offline') {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Sin conexión a internet. Algunas funciones pueden no estar disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  if (connectionQuality === 'poor') {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Conexión lenta detectada. Las operaciones pueden tardar más de lo habitual.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Badge variant={getStatusColor()} className={`${className} flex items-center gap-1`}>
      {getIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </Badge>
  );
}

export default NetworkStatus;
