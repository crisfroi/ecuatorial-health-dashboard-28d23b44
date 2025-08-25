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
        // Use a simple, reliable connectivity test
        // Instead of fetching files, we'll use a basic timing test
        const start = Date.now();

        // Create a simple network request that's less likely to fail
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(window.location.origin + '/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - start;

        if (response.ok) {
          setConnectionQuality(duration > 3000 ? 'poor' : 'good');
        } else {
          setConnectionQuality('poor');
        }
      } catch (error: any) {
        console.log('Connection test failed:', error.message);
        // Don't set as poor if we're actually online - might just be a CORS issue
        if (navigator.onLine) {
          setConnectionQuality('good'); // Assume good if browser says we're online
        } else {
          setConnectionQuality('poor');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection quality every 60 seconds (less aggressive)
    const intervalId = setInterval(testConnection, 60000);

    // Delay initial test to avoid mount-time fetch issues
    const initialTestTimeout = setTimeout(testConnection, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      clearTimeout(initialTestTimeout);
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
