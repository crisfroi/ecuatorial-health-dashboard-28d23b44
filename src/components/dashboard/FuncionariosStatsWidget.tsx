import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  Building2, 
  MapPin, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Activity
} from "lucide-react";
import { useProfesionales } from "@/hooks/useProfesionales";

interface FuncionariosStatsWidgetProps {
  onNavigateToFuncionarios?: () => void;
  userRole: string;
}

export const FuncionariosStatsWidget: React.FC<FuncionariosStatsWidgetProps> = ({
  onNavigateToFuncionarios,
  userRole
}) => {
  // Filtros para obtener solo funcionarios aprobados y de función pública
  const filtrosFuncionarios = {
    estado_solicitud: 'Aprobado',
    funcion_publica: true // Solo funcionarios públicos (boolean)
  };

  console.log('FuncionariosStatsWidget: Aplicando filtros:', filtrosFuncionarios);

  const { data: funcionarios = [], isLoading, error } = useProfesionales(filtrosFuncionarios);

  console.log('FuncionariosStatsWidget: Funcionarios obtenidos:', funcionarios.length);
  console.log('FuncionariosStatsWidget: Primeros 3 funcionarios (muestra):', funcionarios.slice(0, 3).map(f => ({
    nombre: f.nombre_completo,
    estado: f.estado_solicitud,
    funcion_publica: f.funcion_publica
  })));

  // Obtener todos los profesionales para comparar (solo para depuración)
  const { data: todosProfesionales = [] } = useProfesionales({});
  const aprobados = todosProfesionales.filter(p => p.estado_solicitud === 'Aprobado');
  const funcionariosPublicos = aprobados.filter(p => p.funcion_publica === true);

  console.log('DEBUG - Todos los profesionales:', todosProfesionales.length);
  console.log('DEBUG - Profesionales aprobados:', aprobados.length);
  console.log('DEBUG - Funcionarios públicos (manual filter):', funcionariosPublicos.length);
  console.log('DEBUG - Muestra de funcionarios públicos:', funcionariosPublicos.slice(0, 3).map(f => ({
    nombre: f.nombre_completo,
    funcion_publica: f.funcion_publica,
    estado: f.estado_solicitud
  })));

  // Cálculos estadísticos
  const totalFuncionarios = funcionarios.length;
  
  const funcionariosPorArea = funcionarios.reduce((acc, func) => {
    const area = func.area_profesional || 'No especificada';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const funcionariosPorProvincia = funcionarios.reduce((acc, func) => {
    const provincia = func.provincia || 'No especificada';
    acc[provincia] = (acc[provincia] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const funcionariosPorCentro = funcionarios.reduce((acc, func) => {
    const centro = func.nombre_centro || 'No asignado';
    acc[centro] = (acc[centro] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const funcionariosPorGenero = funcionarios.reduce((acc, func) => {
    const genero = func.genero || 'No especificado';
    acc[genero] = (acc[genero] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Funcionarios con renovación próxima (30 días)
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 30);
  
  const renovacionProxima = funcionarios.filter(func => {
    if (!func.fecha_validez_carnet) return false;
    const fechaValidez = new Date(func.fecha_validez_carnet);
    return fechaValidez <= fechaLimite && fechaValidez >= new Date();
  }).length;

  // Funcionarios con carnet vencido
  const carnetVencidos = funcionarios.filter(func => {
    if (!func.fecha_validez_carnet) return false;
    const fechaValidez = new Date(func.fecha_validez_carnet);
    return fechaValidez < new Date();
  }).length;

  // Área profesional más común
  const areaMasComun = Object.entries(funcionariosPorArea)
    .sort(([,a], [,b]) => b - a)[0];

  // Provincia con más funcionarios
  const provinciaMasFuncionarios = Object.entries(funcionariosPorProvincia)
    .sort(([,a], [,b]) => b - a)[0];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span>Funcionarios Públicos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <UserCheck className="w-5 h-5" />
            <span>Error al cargar funcionarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">No se pudieron cargar los datos de funcionarios públicos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span>Funcionarios Públicos</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Aprobados
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalFuncionarios}</div>
            <div className="text-xs text-gray-500">Total Funcionarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(funcionariosPorCentro).length}</div>
            <div className="text-xs text-gray-500">Centros Asignados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(funcionariosPorProvincia).length}</div>
            <div className="text-xs text-gray-500">Provincias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Object.keys(funcionariosPorArea).length}</div>
            <div className="text-xs text-gray-500">Especialidades</div>
          </div>
        </div>

        {/* Distribución por área profesional */}
        {areaMasComun && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Área Profesional Principal</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{areaMasComun[0]}</span>
                </div>
                <span className="text-sm font-bold text-green-700">{areaMasComun[1]} funcionarios</span>
              </div>
            </div>
          </div>
        )}

        {/* Distribución por género */}
        {totalFuncionarios > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Género</h4>
            <div className="space-y-2">
              {Object.entries(funcionariosPorGenero).map(([genero, cantidad]) => (
                <div key={genero} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${
                      genero === 'Masculino' ? 'bg-blue-500' : 
                      genero === 'Femenino' ? 'bg-pink-500' : 'bg-gray-500'
                    }`}></div>
                    <span>{genero}</span>
                  </div>
                  <span className="font-medium">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribución provincial destacada */}
        {provinciaMasFuncionarios && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Provincia con Mayor Presencia</h4>
            <div className="flex items-center justify-between text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">{provinciaMasFuncionarios[0]}</span>
              </div>
              <span className="font-bold text-blue-700">{provinciaMasFuncionarios[1]} funcionarios</span>
            </div>
          </div>
        )}

        {/* Alertas de renovación */}
        {(renovacionProxima > 0 || carnetVencidos > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Alertas de Renovación:</p>
                <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                  {renovacionProxima > 0 && (
                    <li>• {renovacionProxima} carnet(s) por vencer en 30 días</li>
                  )}
                  {carnetVencidos > 0 && (
                    <li>• {carnetVencidos} carnet(s) vencido(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Resumen rápido */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen Ejecutivo</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <span className="font-medium">{totalFuncionarios}</span> funcionarios públicos acreditados</p>
            <p>• Presencia en <span className="font-medium">{Object.keys(funcionariosPorProvincia).length}</span> provincias del país</p>
            <p>• <span className="font-medium">{Object.keys(funcionariosPorArea).length}</span> especialidades médicas cubiertas</p>
            {areaMasComun && (
              <p>• Especialidad principal: <span className="font-medium">{areaMasComun[0]}</span></p>
            )}
          </div>
        </div>

        {/* Mensaje cuando no hay datos */}
        {totalFuncionarios === 0 && (
          <div className="text-center py-4">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay funcionarios públicos registrados</p>
            <p className="text-xs text-gray-400">Los funcionarios aparecerán aquí una vez aprobados</p>
          </div>
        )}

        {/* Botón para ver más detalles */}
        {onNavigateToFuncionarios && totalFuncionarios > 0 && (
          <Button 
            onClick={onNavigateToFuncionarios}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <span>Ver Todos los Funcionarios</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
