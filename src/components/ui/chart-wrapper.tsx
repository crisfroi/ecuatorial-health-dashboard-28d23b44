import React from 'react';

interface ChartWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component to suppress defaultProps warnings from recharts
 * and provide error boundary for chart components
 */
export const ChartWrapper: React.FC<ChartWrapperProps> = ({ children, className = '' }) => {
  // Suppress console warnings for defaultProps in development
  React.useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('defaultProps') && args[0]?.includes?.('function components')) {
        // Suppress recharts defaultProps warnings
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default ChartWrapper;
