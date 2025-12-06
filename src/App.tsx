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
import SolicitudEstablecimiento from "./pages/SolicitudEstablecimiento";
import DynamicForms from "./pages/DynamicForms";
import PublicForm from "./pages/PublicForm";
import Auth from "./pages/Auth";
import ErrorBoundary from "@/components/ui/error-boundary";
import "./utils/authErrorHandler"; // Initialize global auth error handling
import "./utils/storageCleanup"; // Initialize storage cleanup
import { initResizeObserverErrorHandling } from "./utils/resizeObserverHandler";

// HOSIX Pages
import HosixLogin from "./pages/Hosix/HosixLogin";
import HosixLayout from "./components/hosix/HosixLayout";
import HosixDashboard from "./pages/Hosix/HosixDashboard";
import Pacientes from "./pages/Hosix/Pacientes";
import Urgencias from "./pages/Hosix/Urgencias";
import Citas from "./pages/Hosix/Citas";
import Hospitalizacion from "./pages/Hosix/Hospitalizacion";
import Quirofanos from "./pages/Hosix/Quirofanos";
import Farmacia from "./pages/Hosix/Farmacia";
import FacturacionPage from "./pages/Hosix/Facturacion";
import CajasPage from "./pages/Hosix/Cajas";
import RecobrosPage from "./pages/Hosix/Recobros";
import Suministros from "./pages/Hosix/Suministros";
import Almacenes from "./pages/Hosix/Almacenes";
import ComprasPage from "./pages/Hosix/Compras";
import Enfermeria from "./pages/Hosix/Enfermeria";
import Prescripcion from "./pages/Hosix/Prescripcion";
import AdmisionCentral from "./pages/Hosix/AdmisionCentral";
import Medicos from "./pages/Hosix/Medicos";
import Configuracion from "./pages/Hosix/Configuracion";
import BI from "./pages/Hosix/BI";

// Initialize ResizeObserver error handling
initResizeObserverErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración de reintentos
      retry: (failureCount, error: any) => {
        // No reintentar si es un error de autenticación
        if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
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
      
      // Error handling is now managed at component level
    },
    
    mutations: {
      // Configuración de reintentos para mutaciones
      retry: 1,
      
      // Error handling is now managed at component level
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
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
                <Route path="/solicitud-establecimiento" element={<SolicitudEstablecimiento />} />
                <Route path="/dynamic-forms" element={<DynamicForms />} />
                <Route path="/form/:publicUrl" element={<PublicForm />} />
                <Route path="/hosix/login" element={<HosixLogin />} />
                <Route path="/hosix" element={<HosixLayout />}>
                  <Route index element={<HosixDashboard />} />
                  <Route path="admision" element={<AdmisionCentral />} />
                  <Route path="pacientes" element={<Pacientes />} />
                  <Route path="urgencias" element={<Urgencias />} />
                  <Route path="citas" element={<Citas />} />
                  <Route path="hospitalizacion" element={<Hospitalizacion />} />
                  <Route path="quirofanos" element={<Quirofanos />} />
                  <Route path="farmacia" element={<Farmacia />} />
                  <Route path="prescripcion" element={<Prescripcion />} />
                  <Route path="enfermeria" element={<Enfermeria />} />
                  <Route path="facturacion" element={<FacturacionPage />} />
                  <Route path="cajas" element={<CajasPage />} />
                  <Route path="recobros" element={<RecobrosPage />} />
                  <Route path="suministros" element={<Suministros />} />
                  <Route path="almacenes" element={<Almacenes />} />
                  <Route path="compras" element={<ComprasPage />} />
                  <Route path="configuracion" element={<Configuracion />} />
                  <Route path="bi" element={<BI />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
