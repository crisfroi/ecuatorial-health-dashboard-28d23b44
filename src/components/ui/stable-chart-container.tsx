import React from 'react';
import { cn } from '@/lib/utils';

/**
 * StableChartContainer provides stable sizing for charts to prevent ResizeObserver loops
 * 
 * This wrapper ensures that chart containers have consistent dimensions and
 * prevents the oscillating size changes that can cause ResizeObserver loop errors.
 * 
 * Key features:
 * - Stable minimum height to prevent size oscillation
 * - Proper aspect ratio maintenance
 * - Memory of previous dimensions to reduce reflows
 * - Debounced resize handling
 */
interface StableChartContainerProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number | string;
  aspectRatio?: number; // width/height ratio, e.g., 16/9 = 1.78
  onResize?: (width: number, height: number) => void;
}

export const StableChartContainer: React.FC<StableChartContainerProps> = ({
  children,
  className,
  minHeight = "300px",
  aspectRatio,
  onResize
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const resizeTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Debounced resize observer
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          // Only update if dimensions have changed significantly (> 5px)
          if (
            Math.abs(width - dimensions.width) > 5 ||
            Math.abs(height - dimensions.height) > 5
          ) {
            setDimensions({ width, height });
            onResize?.(width, height);
          }
        }
      }, 100); // 100ms debounce
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [dimensions, onResize]);

  // Calculate style based on aspect ratio and min height
  const containerStyle: React.CSSProperties = {
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
    width: '100%',
    position: 'relative',
  };

  if (aspectRatio && dimensions.width > 0) {
    const calculatedHeight = dimensions.width / aspectRatio;
    const minHeightPx = typeof minHeight === 'string' 
      ? parseInt(minHeight) 
      : minHeight;
    
    containerStyle.height = `${Math.max(calculatedHeight, minHeightPx)}px`;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

/**
 * Hook to create a stable ResizeObserver that won't cause loops
 */
export const useStableResizeObserver = (
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs: number = 100
) => {
  const callbackRef = React.useRef(callback);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  // Update callback ref
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const observerRef = React.useRef<ResizeObserver>();

  React.useEffect(() => {
    observerRef.current = new ResizeObserver((entries) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        entries.forEach(entry => {
          try {
            callbackRef.current(entry);
          } catch (error) {
            console.warn('Error in stable ResizeObserver callback:', error);
          }
        });
      }, debounceMs);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debounceMs]);

  const observe = React.useCallback((element: Element) => {
    observerRef.current?.observe(element);
  }, []);

  const unobserve = React.useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  const disconnect = React.useCallback(() => {
    observerRef.current?.disconnect();
  }, []);

  return { observe, unobserve, disconnect };
};

/**
 * Enhanced ChartContainer that prevents ResizeObserver loops
 * 
 * Usage:
 * <SafeChartContainer>
 *   <ResponsiveContainer>
 *     <YourChart />
 *   </ResponsiveContainer>
 * </SafeChartContainer>
 */
export const SafeChartContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ children, className, title }) => {
  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h4 className="text-sm font-medium mb-2 text-gray-700">{title}</h4>
      )}
      <StableChartContainer 
        className="border rounded-lg p-4 bg-white"
        minHeight="300px"
      >
        {children}
      </StableChartContainer>
    </div>
  );
};

export default StableChartContainer;
