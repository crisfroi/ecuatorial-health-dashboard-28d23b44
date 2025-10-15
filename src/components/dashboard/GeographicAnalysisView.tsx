import React from "react";
// Importa tus componentes de UI (Ajusta la ruta si es necesario)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
// ¡Añadimos los íconos necesarios!
import * as LucideIcons from "lucide-react";
const { Users, Building2, MapPin, Landmark, Baby, GraduationCap, Briefcase } = LucideIcons;
const FemaleIconG = (LucideIcons as any).Female || (LucideIcons as any).GenderFemale || (LucideIcons as any).Woman || null;

// Importa el hook de Analíticas Geográficas (el que ya creaste)
import { useGeographicAnalytics } from "@/hooks/useGeographicAnalytics"; 
// Importa el hook de Centros de Salud (el que modificaste para aceptar 'provincia')
import { useBuscarCentros } from "@/hooks/useCentrosSalud"; 


// --- 1. COMPONENTES AUXILIARES DE VISUALIZACIÓN ---

// Componente para mostrar una estadística clave
const StatCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => (
    <div className="border p-4 rounded-lg flex items-center justify-between shadow-sm bg-white">
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-blue-600/70" />
    </div>
);

// Función para renderizar un listado con barras de progreso (Top 5)
// El componente usa slice(0, 5) internamente para limitar a los 5 primeros.
const renderListWithProgress = (data: any[], titleKey: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.slice(0, 5).map((item, index) => (
            <div key={index} className="border-b pb-2">
                <p className="text-sm font-semibold">{item[titleKey]}</p>
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Cantidad: {item.cantidad}</span>
                    <span>{item.porcentaje.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                        className={`h-2 rounded-full ${index < 3 ? 'bg-indigo-500' : 'bg-gray-400'}`}
                        style={{ width: `${item.porcentaje}%` }}
                    ></div>
                </div>
            </div>
        ))}
    </div>
);


// --- 2. COMPONENTE PRINCIPAL ---

interface GeographicAnalysisViewProps {
    // Solo se pasa uno de los dos filtros
    distritoSanitario?: string;
    provincia?: string;
}

/**
 * Vista de análisis detallado geográfico (Distrito Sanitario o Provincia).
 */
export const GeographicAnalysisView = ({ 
    distritoSanitario, 
    provincia 
}: GeographicAnalysisViewProps) => {
    
    // 1. Definir los filtros
    const filters = { distrito_sanitario: distritoSanitario, provincia: provincia };

    // 2. Cargar las métricas con el nuevo hook
    const { 
        data: stats, 
        isLoading: isLoadingStats, 
        isError: isErrorStats 
    } = useGeographicAnalytics(filters);

    // 3. Cargar la lista de centros (Usando el hook modificado)
    const { 
        data: centros, 
        isLoading: isLoadingCentros 
    } = useBuscarCentros(filters);
    
    const areaName = filters.distrito_sanitario || filters.provincia;
    
    // Manejo de estado: si no hay filtro, no mostrar nada
    if (!areaName) {
        return <div className="p-8 text-gray-500 italic">Selecciona un área geográfica en el mapa para ver el análisis detallado.</div>
    }

    // Manejo de carga
    if (isLoadingStats || isLoadingCentros) {
        return (
            <div className="flex items-center justify-center p-8 text-lg text-blue-600">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando Analíticas de {areaName}...
            </div>
        );
    }

    // Manejo de errores
    if (isErrorStats || !stats) {
        return <div className="p-8 text-red-600">❌ Error al cargar los datos de analítica para **{areaName}**.</div>;
    }

    return (
        <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">
                📊 Análisis Detallado - **{stats.areaName}**
            </h1>
            
            {/* 1. MÉTRICAS CLAVE GENERALES */}
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl font-bold text-blue-700">Resumen General</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard icon={Users} title="Profesionales Aprobados" value={stats.total_profesionales} />
                    <StatCard icon={Building2} title="Centros de Salud" value={stats.total_centros} />
                </CardContent>
            </Card>
            
            {/* --- SECCIÓN AÑADIDA --- */}
            
            {/* 2. NUEVAS MÉTRICAS DETALLADAS (GÉNERO, TITULACIÓN, FUNCIÓN PÚBLICA) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 2.1. ESTADÍSTICAS DE GÉNERO */}
                {stats.estadisticas_genero.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-bold flex items-center"><female className="mr-2 h-5 w-5"/> Distribución por Género (Top 5)</CardTitle></CardHeader>
                    <CardContent>
                    {/* Usamos 'genero' como la clave para el título */}
                    {renderListWithProgress(stats.estadisticas_genero, 'genero')} 
                    </CardContent>
                </Card>
                )}

                {/* 2.2. CATEGORÍA DE TITULACIÓN */}
                {stats.estadisticas_titulacion.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-bold flex items-center"><GraduationCap className="mr-2 h-5 w-5"/> Categoría de Titulación (Top 5)</CardTitle></CardHeader>
                    <CardContent>
                    {/* Usamos 'categoria' como la clave para el título */}
                    {renderListWithProgress(stats.estadisticas_titulacion, 'categoria')}
                    </CardContent>
                </Card>
                )}
                
                {/* 2.3. FUNCIÓN PÚBLICA */}
                {stats.estadisticas_funcionario.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-bold flex items-center"><Briefcase className="mr-2 h-5 w-5"/> Estatus Funcionario</CardTitle></CardHeader>
                    <CardContent>
                    {/* Usamos 'tipo' como la clave para el título */}
                    {renderListWithProgress(stats.estadisticas_funcionario, 'tipo')}
                    </CardContent>
                </Card>
                )}
            </div>

            {/* --- FIN SECCIÓN AÑADIDA --- */}
            
            {/* 3. DISTRIBUCIÓN DE PROFESIONALES POR ÁREA (Originalmente Sección 2) */}
            {stats.profesionales_por_area.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-bold">Distribución por Área Profesional (Top 5)</CardTitle></CardHeader>
                    <CardContent>
                        {/* El mapeo es necesario para adaptar la estructura del hook a la función auxiliar */}
                        {renderListWithProgress(stats.profesionales_por_area.map(p => ({
                            ...p,
                            cantidad: p.total,
                            porcentaje: p.porcentaje
                        })), 'area_profesional')}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 4. PAÍSES DE FORMACIÓN (Originalmente Sección 3) */}
                {stats.paises_formacion.length > 0 && (
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle className="text-xl font-bold flex items-center"><MapPin className="mr-2 h-5 w-5"/> Países de Formación (Top 5)</CardTitle></CardHeader>
                        <CardContent>
                            {renderListWithProgress(stats.paises_formacion, 'pais_formacion')}
                        </CardContent>
                    </Card>
                )}

                {/* 5. INSTITUCIONES DE FORMACIÓN (Originalmente Sección 4) */}
                {stats.instituciones_top.length > 0 && (
                    <Card className="shadow-lg">
                        <CardHeader><CardTitle className="text-xl font-bold flex items-center"><Landmark className="mr-2 h-5 w-5"/> Instituciones (Top 5)</CardTitle></CardHeader>
                        <CardContent>
                            {renderListWithProgress(stats.instituciones_top, 'institucion')}
                        </CardContent>
                    </Card>
                )}
            </div>
            
            {/* 6. RANGO DE EDADES (Gráfico de barras) (Originalmente Sección 5) */}
            {stats.rango_edades.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-bold flex items-center"><Baby className="mr-2 h-5 w-5"/> Distribución por Rango de Edad</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.rango_edades}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rango_edad" />
                                <YAxis />
                                <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.porcentaje.toFixed(1)}%)`, 'Cantidad']} />
                                <Bar dataKey="cantidad" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* 7. LISTADO DE CENTROS DE SALUD (Originalmente Sección 6) */}
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl font-bold text-gray-700">Centros de Salud en {stats.areaName} ({centros?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-64 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                            {(centros || []).map((centro: any) => (
                                <li key={centro.id} className="py-2 flex justify-between items-center text-sm">
                                    <span className="font-medium">{centro.nombre}</span>
                                    {/* Asumo que la data de centros incluye un total_profesionales, si no, se muestra 0 */}
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        {centro.total_profesionales || 0} profesionales
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {centros?.length === 0 && <p className="text-gray-500 italic p-4">No se encontraron centros de salud con los filtros aplicados.</p>}
                    </div>
                </CardContent>
            </Card>
            
        </div>
    );
};
