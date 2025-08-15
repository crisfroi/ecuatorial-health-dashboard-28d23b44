import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfessionalRegistration from "./pages/ProfessionalRegistration";
import PublicSearch from "./pages/PublicSearch";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
// Clear any offline mode flags and auth state on app start
import "@/utils/clearOfflineMode";
import "@/utils/clearAuthState";
// Suppress known Recharts warnings that don't affect functionality
import "@/utils/suppressRechartsWarnings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración de reintentos
      retry: (failureCount, error: any) => {
        // No reintentar si es un error de autenticación o token
        if (error?.message?.includes('auth') ||
            error?.message?.includes('unauthorized') ||
            error?.message?.includes('Invalid Refresh Token') ||
            error?.message?.includes('Refresh Token Not Found')) {
          console.log('🔐 Auth error detected, not retrying:', error?.message);
          return false;
        }

        // No reintentar si es un error de tabla inexistente
        if (error?.message?.includes('relation') ||
            error?.message?.includes('does not exist') ||
            error?.code === 'PGRST116') {
          console.log('🗄️ Database table missing, not retrying:', error?.message);
          return false;
        }

        // Reintentar hasta 3 veces para errores de red
        if (failureCount < 3) {
          return true;
        }

        return false;
      },
      
      // Tiempo de espera entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Tiempo de vida de los datos en caché
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tiempo de vida de los datos en caché cuando no hay suscriptores
      gcTime: 10 * 60 * 1000, // 10 minutos
      
      // Configuración de refetch
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Manejo de errores
      onError: (error: any) => {
        // Si es un error de autenticación, no logear como error crítico
        if (error?.message?.includes('auth') ||
            error?.message?.includes('Invalid Refresh Token') ||
            error?.message?.includes('Refresh Token Not Found')) {
          console.log('🔐 Auth error handled gracefully:', error?.message);
          return;
        }

        // Si es un error de red, no mostrar errores en consola
        if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          console.log('Network error detected, using fallback data');
          return;
        }

        console.error('Query error:', error);
      }
    },
    
    mutations: {
      // Configuración de reintentos para mutaciones
      retry: 1,
      
      // Manejo de errores para mutaciones
      onError: (error: any) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider defaultRole="SUPER_ADMINISTRADOR">
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/old-home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<ProfessionalRegistration />} />
            <Route path="/search" element={<PublicSearch />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
