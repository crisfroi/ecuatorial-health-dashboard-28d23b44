// Network error handler and recovery utilities
import React from 'react';

export interface NetworkErrorInfo {
  isNetworkError: boolean;
  isConnected: boolean;
  canRetry: boolean;
  message: string;
  retryAfter?: number;
}

export const analyzeNetworkError = (error: any): NetworkErrorInfo => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Check if it's a network-related error
  const networkErrorPatterns = [
    'Failed to fetch',
    'fetch',
    'Network request failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'NetworkError',
    'TypeError.*fetch',
    'Connection refused',
    'Connection timeout',
    'Unable to connect'
  ];
  
  const isNetworkError = networkErrorPatterns.some(pattern => 
    new RegExp(pattern, 'i').test(errorMessage)
  );
  
  if (!isNetworkError) {
    return {
      isNetworkError: false,
      isConnected: navigator.onLine,
      canRetry: false,
      message: errorMessage
    };
  }
  
  // Determine if we're connected
  const isConnected = navigator.onLine;
  
  // Network errors are usually retryable
  const canRetry = true;
  
  // Suggest retry timing based on error type
  let retryAfter = 1000; // Default 1 second
  if (errorMessage.includes('timeout')) {
    retryAfter = 5000; // 5 seconds for timeouts
  } else if (errorMessage.includes('disconnected')) {
    retryAfter = 3000; // 3 seconds for disconnection
  }
  
  let message = 'Error de conexión de red.';
  if (!isConnected) {
    message = 'Sin conexión a internet. Verifique su conexión.';
  } else {
    message = 'Error temporal de conexión. Reintentando...';
  }
  
  return {
    isNetworkError: true,
    isConnected,
    canRetry,
    message,
    retryAfter
  };
};

export const createNetworkRetryWrapper = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  baseDelay: number = 1000
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        const networkInfo = analyzeNetworkError(error);
        
        // If it's not a network error or we've exhausted retries, throw immediately
        if (!networkInfo.isNetworkError || attempt === maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        
        console.warn(`Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
        console.log(`Retrying in ${delay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }) as T;
};

// Hook for monitoring network connectivity
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Utility for testing network connectivity
export const pingServer = async (url: string = window.location.origin): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return true;
  } catch (error) {
    console.warn('Server ping failed:', error);
    return false;
  }
};
