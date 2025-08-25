/**
 * Utility to suppress ResizeObserver loop errors
 * These errors are benign and occur when ResizeObserver callbacks
 * trigger DOM changes that cause more resize events
 */

let resizeObserverSuppressionEnabled = false;

export const suppressResizeObserverErrors = () => {
  if (resizeObserverSuppressionEnabled) return;

  // Store original error handler
  const originalError = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;

  // Override global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    // Suppress ResizeObserver loop errors
    if (
      typeof message === 'string' && 
      (
        message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded')
      )
    ) {
      return true; // Suppress the error
    }

    // Call original handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Override unhandled promise rejection handler
  window.onunhandledrejection = (event) => {
    // Suppress ResizeObserver loop errors in promises
    if (
      event.reason && 
      typeof event.reason.message === 'string' &&
      (
        event.reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.reason.message.includes('ResizeObserver loop limit exceeded')
      )
    ) {
      event.preventDefault();
      return;
    }

    // Call original handler for other rejections
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };

  resizeObserverSuppressionEnabled = true;
};

/**
 * Debounced ResizeObserver wrapper for components that need resize monitoring
 */
export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16 // ~60fps
): ResizeObserver => {
  let timeoutId: number | undefined;

  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      try {
        callback(entries, observer);
      } catch (error) {
        // Suppress ResizeObserver-related errors
        if (
          error instanceof Error &&
          (
            error.message.includes('ResizeObserver loop completed with undelivered notifications') ||
            error.message.includes('ResizeObserver loop limit exceeded')
          )
        ) {
          return;
        }
        throw error;
      }
    }, delay);
  };

  return new ResizeObserver(debouncedCallback);
};

/**
 * Safe dimension getter that doesn't trigger ResizeObserver loops
 */
export const getSafeDimensions = (element: Element) => {
  try {
    const rect = element.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  } catch (error) {
    return { width: 0, height: 0 };
  }
};
