/**
 * Safe wrapper around browser localStorage to avoid crashes in sandboxed iframes,
 * privacy-restricted browsers, and third-party cookie blocked environments.
 */
export const safeStorage = {
  getItem: (key: string, fallback: string | null = null): string | null => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key) ?? fallback;
      }
    } catch {
      // Storage access blocked or restricted
    }
    return fallback;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or restricted
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked or restricted
    }
  }
};
