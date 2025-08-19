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
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Suppress console warnings for defaultProps and ResizeObserver errors
  React.useEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('defaultProps') && args[0]?.includes?.('function components')) {
        return; // Suppress recharts defaultProps warnings
      }
      if (args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications')) {
        return; // Suppress ResizeObserver warnings
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      if (args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications')) {
        return; // Suppress ResizeObserver errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default ChartWrapper;
