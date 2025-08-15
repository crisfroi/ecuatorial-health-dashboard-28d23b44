// Network debugging utility for development

export const networkDebugger = {
  // Log network request details
  logRequest: (url: string, options?: RequestInit) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🌐 Network Request');
      console.log('URL:', url);
      console.log('Method:', options?.method || 'GET');
      console.log('Headers:', options?.headers);
      if (options?.body) {
        console.log('Body:', options.body);
      }
      console.groupEnd();
    }
  },

  // Log network response details
  logResponse: (url: string, response: Response) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('📡 Network Response');
      console.log('URL:', url);
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('OK:', response.ok);
      console.groupEnd();
    }
  },

  // Log network errors with context
  logError: (url: string, error: any, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('❌ Network Error' + (context ? ` (${context})` : ''));
      console.log('URL:', url);
      console.log('Error:', error);
      console.log('Message:', error?.message || 'Unknown error');
      console.log('Stack:', error?.stack);
      console.log('Navigator Online:', navigator.onLine);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  },

  // Test connectivity to a specific endpoint
  testConnectivity: async (url: string = window.location.origin) => {
    try {
      console.log('🔍 Testing connectivity to:', url);
      const startTime = performance.now();
      
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log('✅ Connectivity test successful');
      console.log('Response time:', duration + 'ms');
      return { success: true, duration, response };
    } catch (error) {
      console.log('❌ Connectivity test failed:', error);
      return { success: false, error };
    }
  },

  // Get current network information
  getNetworkInfo: () => {
    const info = {
      online: navigator.onLine,
      effectiveType: (navigator as any).connection?.effectiveType || 'unknown',
      downlink: (navigator as any).connection?.downlink || 'unknown',
      rtt: (navigator as any).connection?.rtt || 'unknown',
      saveData: (navigator as any).connection?.saveData || false,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      console.table(info);
    }

    return info;
  }
};

// Export for use in components
export default networkDebugger;
