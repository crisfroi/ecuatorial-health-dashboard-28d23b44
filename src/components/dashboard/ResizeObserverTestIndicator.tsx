import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Test indicator component to monitor ResizeObserver loop errors
 * This component listens for ResizeObserver errors and shows status
 */
export const ResizeObserverTestIndicator = () => {
  const [errorCount, setErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let errorDetected = false;
    
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (message.includes('ResizeObserver loop')) {
        errorDetected = true;
        setErrorCount(prev => prev + 1);
        setLastErrorTime(new Date());
        console.log('ResizeObserver error detected by test indicator:', message);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason && typeof reason === 'object' && reason.message) {
        if (reason.message.includes('ResizeObserver loop')) {
          errorDetected = true;
          setErrorCount(prev => prev + 1);
          setLastErrorTime(new Date());
          console.log('ResizeObserver promise rejection detected:', reason.message);
        }
      }
    };

    // Start monitoring
    setIsMonitoring(true);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Test timeout - if no errors after 5 seconds, consider it fixed
    const testTimeout = setTimeout(() => {
      if (!errorDetected) {
        console.log('✅ No ResizeObserver loop errors detected in 5 seconds - fix appears successful!');
      }
    }, 5000);

    return () => {
      clearTimeout(testTimeout);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      setIsMonitoring(false);
    };
  }, []);

  if (!isMonitoring) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={errorCount === 0 ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-1"
      >
        {errorCount === 0 ? (
          <>
            <CheckCircle className="w-4 h-4" />
            ResizeObserver: OK
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            ResizeObserver Errors: {errorCount}
          </>
        )}
      </Badge>
      {lastErrorTime && (
        <div className="text-xs text-gray-500 mt-1">
          Last: {lastErrorTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default ResizeObserverTestIndicator;
