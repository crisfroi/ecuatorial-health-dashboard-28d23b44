import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer } from 'recharts';
import { measureElement } from '@/utils/errorSuppression';

interface SafeChartContainerProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  className?: string;
  debounceMs?: number;
}

/**
 * A safe wrapper for chart components that prevents ResizeObserver loops
 * by debouncing resize events and safely measuring dimensions
 */
export const SafeChartContainer: React.FC<SafeChartContainerProps> = ({
  children,
  width = "100%",
  height = 400,
  className = "",
  debounceMs = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const resizeTimeoutRef = useRef<number>();

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const newDimensions = measureElement(containerRef.current);
      setDimensions(prev => {
        // Only update if dimensions actually changed significantly
        if (
          Math.abs(prev.width - newDimensions.width) > 5 ||
          Math.abs(prev.height - newDimensions.height) > 5
        ) {
          return newDimensions;
        }
        return prev;
      });
    }
  }, []);

  const debouncedUpdateDimensions = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = window.setTimeout(updateDimensions, debounceMs);
  }, [updateDimensions, debounceMs]);

  useEffect(() => {
    // Initial measurement
    updateDimensions();

    // Set up resize observer with error handling
    let observer: ResizeObserver | null = null;
    
    try {
      observer = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to prevent loops
        requestAnimationFrame(() => {
          debouncedUpdateDimensions();
        });
      });

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
    } catch (error) {
      // Fall back to window resize if ResizeObserver fails
      console.warn('ResizeObserver failed, falling back to window resize:', error);
      
      const handleWindowResize = () => {
        debouncedUpdateDimensions();
      };

      window.addEventListener('resize', handleWindowResize);
      
      return () => {
        window.removeEventListener('resize', handleWindowResize);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
      };
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [debouncedUpdateDimensions]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
    >
      {/* Render with fallback dimensions if measured dimensions are zero */}
      {(dimensions.width > 0 && dimensions.height > 0) || typeof height === 'number' ? (
        <ResponsiveContainer
          width="100%"
          height={dimensions.height > 0 ? "100%" : typeof height === 'number' ? height : 300}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

/**
 * Simpler chart wrapper that just suppresses ResizeObserver errors
 */
export const ChartErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('ResizeObserver')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
};

export default SafeChartContainer;
