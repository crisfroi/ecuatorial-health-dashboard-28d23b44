import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// ID de tu proyecto Supabase: wdieynendfjbkbhfovrx
const SUPABASE_PROJECT_ID = 'wdieynendfjbkbhfovrx';

// --- Configuración Específica de la PWA ---
const pwaConfig = {
  // Configuración de la instalación (Manifiesto Web)
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'Ecuatorial Health Dashboard',
    short_name: 'HealthDB',
    description: 'Aplicación de salud con modo Offline y Supabase',
    theme_color: '#16a34a', // Color principal
    background_color: '#ffffff',
    display: 'standalone', // Se ve como una app nativa
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  
  // Configuración de Workbox (Estrategias de caché)
  workbox: {
    // SOLUCIÓN AL ERROR: Aumentar el límite a 10 MiB (10MB)
    maximumFileSizeToCacheInBytes: 10485760, // 10 MiB (10 * 1024 * 1024)
    
    runtimeCaching: [
      {
        // Cachea las peticiones de datos de la API de Supabase
        urlPattern: ({ url }) => url.origin === `https://${SUPABASE_PROJECT_ID}.supabase.co`,
        handler: 'NetworkFirst', // Intenta ir a la red primero, si falla, usa caché
        options: {
          cacheName: 'supabase-api-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 días
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      // Cachea imágenes de Storage (si usas un subdominio diferente)
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/storage/v1/object/public/'),
        handler: 'CacheFirst', // Cacha la imagen primero
        options: {
          cacheName: 'supabase-storage-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
          }
        }
      }
    ]
  }
};
// --- Fin de Configuración PWA ---

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Añade el plugin PWA, activo solo en modo de producción (npm run build)
    mode === 'production' && VitePWA(pwaConfig),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'zod',
      '@hookform/resolvers',
      '@hookform/resolvers/zod',
    ],
  },
}));
