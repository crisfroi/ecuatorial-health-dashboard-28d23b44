/**
 * Enhanced error suppression utility for common React/browser issues
 * Specifically targets ResizeObserver loops and normalizes non-Error runtime issues
 */

let suppressionEnabled = false;

export const initializeErrorSuppression = () => {
  if (suppressionEnabled) return;

  // Suppress console errors for ResizeObserver loops
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('Non-Error promise rejection captured')
      )
    ) {
      return; // Suppress these noisy errors
    }
    originalConsoleError.apply(console, args);
  };

  // Enhanced window error handler
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Normalize cases where a primitive or undefined is thrown (e.g. throw 'string')
    const isPrimitiveThrow = !error || !(error instanceof Error);

    if (typeof message === 'string') {
      // ResizeObserver and related harmless errors
      if (
        message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('ResizeObserver loop') ||
        message.includes('defaultProps') ||
        message.includes('webgl context lost') ||
        message.includes('canvas context') ||
        (message.includes('SVG') && message.includes('attribute'))
      ) {
        return true; // Suppress the error
      }
    }

    if (isPrimitiveThrow) {
      // Prevent dev overlay crashes by normalizing to an Error and handling locally
      const normalized = new Error(typeof message === 'string' ? message : 'Unknown runtime error');
      normalized.name = 'NormalizedRuntimeError';
      console.error(normalized);
      return true; // stop propagation to other handlers (like Vite overlay)
    }

    // Delegate to original handler for other errors
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Enhanced unhandled rejection handler
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = event.reason;

    // Handle Error objects that are noisy
    if (reason instanceof Error) {
      if (
        reason.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        reason.message.includes('ResizeObserver loop limit exceeded') ||
        reason.message.includes('Non-Error promise rejection captured')
      ) {
        event.preventDefault();
        return;
      }
    } else {
      // Normalize non-Error rejections (strings, numbers, plain objects)
      const msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
      const normalized = new Error(msg || 'Unhandled rejection');
      normalized.name = 'NormalizedPromiseRejection';
      console.error(normalized);
      event.preventDefault();
      return;
    }

    // Delegate to original handler for other rejections
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };

  suppressionEnabled = true;
};

/**
 * Safe ResizeObserver that won't cause loops
 */
export class SafeResizeObserver {
  private observer: ResizeObserver;
  private isObserving = false;
  private lastEntries: ResizeObserverEntry[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.observer = new ResizeObserver((entries) => {
      try {
        // Only call callback if entries actually changed
        if (this.entriesChanged(entries)) {
          this.lastEntries = entries.map(entry => ({ ...entry }));
          callback(entries, this.observer);
        }
      } catch (error) {
        // Silently ignore ResizeObserver errors
        if (error instanceof Error && error.message.includes('ResizeObserver')) {
          return;
        }
        console.warn('SafeResizeObserver callback error:', error);
      }
    });
  }

  private entriesChanged(newEntries: ResizeObserverEntry[]): boolean {
    if (newEntries.length !== this.lastEntries.length) return true;

    return newEntries.some((entry, index) => {
      const lastEntry = this.lastEntries[index];
      if (!lastEntry) return true;

      return (
        entry.contentRect.width !== lastEntry.contentRect.width ||
        entry.contentRect.height !== lastEntry.contentRect.height
      );
    });
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    if (!this.isObserving) {
      this.observer.observe(target, options);
      this.isObserving = true;
    }
  }

  unobserve(target: Element) {
    this.observer.unobserve(target);
    this.isObserving = false;
  }

  disconnect() {
    this.observer.disconnect();
    this.isObserving = false;
    this.lastEntries = [];
  }
}

/**
 * Safe dimension measurement that won't trigger observer loops
 */
export const measureElement = (element: Element | null) => {
  if (!element) return { width: 0, height: 0 };

  try {
    // Use getBoundingClientRect which is less likely to trigger observers
    const rect = element.getBoundingClientRect();
    return {
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
    };
  } catch (error) {
    return { width: 0, height: 0 };
  }
};
