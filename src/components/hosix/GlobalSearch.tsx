import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, X, Clock, Trash2, Users, User, Building } from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    resultados,
    isLoading,
    historial,
    cargarHistorial,
    agregarAlHistorial,
    limpiarHistorial,
  } = useGlobalSearch();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Cerrar cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (termino: string) => {
    setQuery(termino);
    agregarAlHistorial(termino);
    if (resultados.length > 0) {
      navigate(resultados[0].url);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (resultado: any) => {
    agregarAlHistorial(query);
    navigate(resultado.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      User: <User className="w-4 h-4" />,
      Users: <Users className="w-4 h-4" />,
      Building: <Building className="w-4 h-4" />,
    };
    return icons[iconName] || <Search className="w-4 h-4" />;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar pacientes, usuarios, servicios..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Resultados */}
          {query && (
            <>
              {isLoading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Buscando...
                </div>
              )}

              {!isLoading && resultados.length > 0 && (
                <div className="border-b">
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-600 px-2 py-1">
                      Resultados ({resultados.length})
                    </p>
                    {resultados.map((resultado) => (
                      <button
                        key={resultado.id}
                        onClick={() => handleResultClick(resultado)}
                        className="w-full text-left p-3 hover:bg-gray-100 rounded-md transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-gray-500">
                            {getIcon(resultado.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">
                              {resultado.titulo}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {resultado.subtitulo}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && query && resultados.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No se encontraron resultados para "{query}"
                </div>
              )}
            </>
          )}

          {/* Historial */}
          {!query && historial.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <p className="text-xs font-semibold text-gray-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Búsquedas Recientes
                </p>
                <button
                  onClick={limpiarHistorial}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {historial.slice(0, 5).map((termino, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(termino)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                >
                  <Clock className="w-3 h-3 inline mr-2 text-gray-400" />
                  {termino}
                </button>
              ))}
            </div>
          )}

          {!query && historial.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Escribe para buscar o accede al historial
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
