/**
 * Direct patch for ResizeObserver loop errors
 * This is a simple, lightweight solution that directly prevents the error
 */

// Store reference to original ResizeObserver
const OriginalResizeObserver = window.ResizeObserver;

// Create patched ResizeObserver
window.ResizeObserver = class extends OriginalResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      // Wrap callback in try-catch and ignore loop errors
      try {
        // Use requestAnimationFrame to prevent immediate loops
        requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (error) {
            // Ignore ResizeObserver loop errors specifically
            if (!(error instanceof Error && error.message.includes('ResizeObserver'))) {
              throw error;
            }
          }
        });
      } catch (error) {
        // Ignore ResizeObserver loop errors
        if (!(error instanceof Error && error.message.includes('ResizeObserver'))) {
          throw error;
        }
      }
    });
  }
};

// Also suppress error messages
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = String(args[0] || '');
  
  // Don't log ResizeObserver loop errors
  if (
    message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded') ||
    message.includes('ResizeObserver loop')
  ) {
    return;
  }
  
  originalConsoleError.apply(console, args);
};

// Suppress window error events for ResizeObserver
window.addEventListener('error', (event) => {
  if (
    event.message &&
    (
      event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
      event.message.includes('ResizeObserver loop limit exceeded') ||
      event.message.includes('ResizeObserver loop')
    )
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

export {};
