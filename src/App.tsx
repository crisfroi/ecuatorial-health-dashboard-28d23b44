
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import ProfessionalRegistration from '@/pages/ProfessionalRegistration';
import PublicSearch from '@/pages/PublicSearch';
import NotFound from '@/pages/NotFound';
import { suppressRechartsWarnings } from '@/utils/suppressRechartsWarnings';

// Suprimir warnings de Recharts
suppressRechartsWarnings();

// Crear cliente de Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (reemplaza cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx (errores del cliente)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/registro" element={<ProfessionalRegistration />} />
              <Route path="/busqueda" element={<PublicSearch />} />
              <Route path="/search" element={<PublicSearch />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
