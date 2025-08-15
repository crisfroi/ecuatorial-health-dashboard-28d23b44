// Utility to debug React Query errors

export const logReactQueryError = (hookName: string, error: any) => {
  console.group(`🐛 React Query Error: ${hookName}`);
  
  if (error instanceof Error) {
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
  } else if (typeof error === 'object' && error !== null) {
    console.log('Error object:', error);
    console.log('Error type:', typeof error);
    console.log('Error keys:', Object.keys(error));
    
    if (error.message) {
      console.log('Error.message:', error.message);
    }
    if (error.code) {
      console.log('Error.code:', error.code);
    }
    if (error.details) {
      console.log('Error.details:', error.details);
    }
  } else {
    console.log('Error (primitive):', error);
  }
  
  console.groupEnd();
};

// Override console.error to catch and format React Query errors
const originalConsoleError = console.error;

console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Check if this is one of our database errors
  if (message.includes('Error fetching payrolls:') || message.includes('Error fetching scale adjustments:')) {
    // Extract the error object from the arguments
    const errorArg = args.find(arg => 
      typeof arg === 'object' && 
      arg !== null && 
      (arg.message || arg.code || arg.details)
    );
    
    if (errorArg) {
      if (message.includes('payrolls')) {
        logReactQueryError('useNominas', errorArg);
      } else if (message.includes('scale adjustments')) {
        logReactQueryError('useBaremos', errorArg);
      }
    }
  }
  
  // Call original console.error
  originalConsoleError.apply(console, args);
};

export default { logReactQueryError };
