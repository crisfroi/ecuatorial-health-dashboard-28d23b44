import { useEffect } from 'react';

export function useOfflineAutostart() {
  useEffect(() => {
    const enable = async () => {
      try {
        const mod: any = await import('@tauri-apps/plugin-autostart');
        const api = mod?.default ?? mod;
        if (api?.enable) {
          const enabled = await api.isEnabled();
          if (!enabled) await api.enable();
        }
      } catch (e) {
        console.warn('Autostart not available:', e);
      }
    };
    enable();
  }, []);
}

