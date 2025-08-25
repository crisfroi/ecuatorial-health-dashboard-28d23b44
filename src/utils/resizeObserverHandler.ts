/**
 * Utility to handle ResizeObserver loop errors and warnings
 * This prevents console spam from ResizeObserver loop limit exceeded errors
 */

let resizeObserverErrorCount = 0;
const MAX_ERRORS_TO_SHOW = 3;

/**
 * Global error handler for ResizeObserver loop errors
 */
const handleResizeObserverError = (event: ErrorEvent) => {
  const errorMessage = event.message || '';
  
  // Check if this is a ResizeObserver loop error
  if (
    errorMessage.includes('ResizeObserver loop') ||
    errorMessage.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    resizeObserverErrorCount++;
    
    // Prevent the error from showing in console after first few times
    if (resizeObserverErrorCount > MAX_ERRORS_TO_SHOW) {
      event.preventDefault();
      return;
    }
    
    console.warn(`ResizeObserver loop detected (${resizeObserverErrorCount}/${MAX_ERRORS_TO_SHOW}). This is usually harmless but indicates chart components may be causing layout thrashing.`);
    
    if (resizeObserverErrorCount === MAX_ERRORS_TO_SHOW) {
      console.info('Further ResizeObserver warnings will be suppressed. Check ChartActions and chart container sizing if this persists.');
    }
    
    // Prevent default error handling to avoid console spam
    event.preventDefault();
  }
};

/**
 * Debounced ResizeObserver to prevent excessive callbacks
 */
export class DebouncedResizeObserver {
  private observer: ResizeObserver;
  private timeoutId: number | null = null;
  private debounceMs: number;

  constructor(callback: ResizeObserverCallback, debounceMs: number = 100) {
    this.debounceMs = debounceMs;
    
    this.observer = new ResizeObserver((entries, observer) => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      this.timeoutId = window.setTimeout(() => {
        try {
          callback(entries, observer);
        } catch (error) {
          console.warn('Error in debounced ResizeObserver callback:', error);
        }
      }, this.debounceMs);
    });
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    this.observer.observe(target, options);
  }

  unobserve(target: Element) {
    this.observer.unobserve(target);
  }

  disconnect() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.observer.disconnect();
  }
}

/**
 * Safe wrapper for ResizeObserver that catches and handles errors
 */
export const createSafeResizeObserver = (
  callback: ResizeObserverCallback,
  debounce: boolean = true
): ResizeObserver | DebouncedResizeObserver => {
  const safeCallback: ResizeObserverCallback = (entries, observer) => {
    try {
      callback(entries, observer);
    } catch (error) {
      console.warn('Error in ResizeObserver callback:', error);
    }
  };

  if (debounce) {
    return new DebouncedResizeObserver(safeCallback);
  }

  return new ResizeObserver(safeCallback);
};

/**
 * Initialize global error handling for ResizeObserver
 */
export const initResizeObserverErrorHandling = () => {
  // Handle window errors
  window.addEventListener('error', handleResizeObserverError);
  
  // Handle unhandled promise rejections that might contain ResizeObserver errors
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && typeof reason === 'object' && reason.message) {
      if (reason.message.includes('ResizeObserver loop')) {
        resizeObserverErrorCount++;
        if (resizeObserverErrorCount <= MAX_ERRORS_TO_SHOW) {
          console.warn('ResizeObserver loop in promise rejection:', reason.message);
        }
        if (resizeObserverErrorCount > MAX_ERRORS_TO_SHOW) {
          event.preventDefault();
        }
      }
    }
  });
  
  console.log('ResizeObserver error handling initialized');
};

/**
 * Reset error count (useful for development)
 */
export const resetResizeObserverErrorCount = () => {
  resizeObserverErrorCount = 0;
};
