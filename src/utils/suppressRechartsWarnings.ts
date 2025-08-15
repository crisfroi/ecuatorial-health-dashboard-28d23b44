// Utility to suppress known Recharts deprecation warnings that don't affect functionality
// These warnings are from the Recharts library itself and will be fixed in future versions

export const suppressRechartsWarnings = () => {
  // Store the original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console.warn to filter out Recharts defaultProps warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filter out Recharts defaultProps warnings
    if (message.includes('Support for defaultProps will be removed from function components') &&
        (message.includes('XAxis') || message.includes('YAxis'))) {
      return; // Don't log these warnings
    }
    
    // Log all other warnings normally
    originalWarn.apply(console, args);
  };

  // Override console.error to filter out related errors if any
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filter out any related Recharts errors
    if (message.includes('defaultProps') && 
        (message.includes('XAxis') || message.includes('YAxis'))) {
      return; // Don't log these errors
    }
    
    // Log all other errors normally
    originalError.apply(console, args);
  };

  console.log('🔇 Suppressed Recharts defaultProps warnings (functionality not affected)');
};

// Only suppress in development
if (import.meta.env.DEV) {
  suppressRechartsWarnings();
}
