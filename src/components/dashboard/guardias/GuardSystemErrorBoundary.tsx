import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface GuardSystemErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GuardSystemErrorBoundary extends React.Component<GuardSystemErrorBoundaryProps, State> {
  constructor(props: GuardSystemErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Guard System Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isTableNotFound = this.state.error?.message?.includes('relation') || 
                             this.state.error?.message?.includes('does not exist');

      return (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isTableNotFound ? 'Sistema de Guardias en Configuración' : 'Error en Sistema de Guardias'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isTableNotFound 
                  ? 'Las tablas del sistema de guardias aún no han sido creadas en la base de datos.'
                  : 'Ocurrió un error al cargar el sistema de guardias.'
                }
              </p>
              {isTableNotFound ? (
                <p className="text-sm text-gray-500">
                  Contacte al administrador del sistema para completar la configuración.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Error: {this.state.error?.message}
                  </p>
                  <Button onClick={this.handleRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default GuardSystemErrorBoundary;
