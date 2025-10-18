import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/resizeObserverPatch'
import { initializeErrorSuppression } from './utils/errorSuppression'

// --- LÓGICA DE REGISTRO DE PWA ---
// Importar la función de registro generada por vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// 2. Registrar el Service Worker
registerSW({
  // Se activa cuando hay una nueva versión de la app disponible.
  onNeedRefresh() {
    console.log('Nueva versión de la aplicación disponible. Recargando automáticamente...');
    // NOTA: En producción, es mejor mostrar un modal antes de recargar.
    window.location.reload();
  },

  // Se activa la primera vez que la aplicación está totalmente cacheada y lista para funcionar offline.
  onOfflineReady() {
    console.log('Aplicación cacheada y lista para funcionar sin conexión.');
  },
  
  onRegistered(r) {
    console.log(`Service Worker registrado. Alcance: ${r?.scope}`);
  },

  onError(error) {
    console.error('Error al registrar Service Worker:', error);
  },
});
// --- FIN LÓGICA DE REGISTRO DE PWA ---

// Inicializaciones existentes
initializeErrorSuppression()

// Renderizado de la aplicación
createRoot(document.getElementById("root")!).render(<App />);
