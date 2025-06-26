import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Download, Search } from 'lucide-react';
import { useProfesionales } from '@/hooks/useProfesionales';
import DashboardFilters from './DashboardFilters';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ProfessionalsTableProps {
  onSelectProfessional: (professional: any) => void;
  userRole: string;
  dashboardFilters?: any;
}

const ProfessionalsTable = ({ onSelectProfessional, userRole, dashboardFilters = {} }: ProfessionalsTableProps) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(dashboardFilters);
  const { toast } = useToast();

  useEffect(() => {
    if (dashboardFilters) {
      console.log('ProfessionalsTable: Dashboard filters received:', dashboardFilters);
    }
  }, [dashboardFilters]);

  const handleDownloadTable = async () => {
    try {
      const tableElement = document.getElementById('professionals-table-container');
      if (!tableElement) {
        toast({
          title: "Error",
          description: "No se pudo encontrar la tabla para descargar",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(tableElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `profesionales-tabla-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "Tabla descargada",
        description: "La tabla de profesionales se ha descargado correctamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading table:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar la tabla",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    console.log('Clearing all filters...');
    setFilters({});
    setSearch('');
  };

  const getStatusColor = (status: string) => {
    const variants: Record<string, string> = {
      'Aprobado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Rechazado': 'bg-red-100 text-red-800',
      'Revisando': 'bg-blue-100 text-blue-800',
      'Pendiente de Firma': 'bg-orange-100 text-orange-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const { data: profesionales, isLoading, error } = useProfesionales({
    ...filters,
    search: search.trim()
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error al cargar profesionales: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Profesionales</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTable}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Descargar</span>
        </Button>
      </div>

      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      <Card id="professionals-table-container" className="shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Lista de Profesionales Sanitarios</CardTitle>
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Buscar profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-white/90 text-gray-900 placeholder-gray-600 border-white/30"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100/50">
                    <TableHead className="font-semibold text-gray-700">Nombre Completo</TableHead>
                    <TableHead className="font-semibold text-gray-700">DNI</TableHead>
                    <TableHead className="font-semibold text-gray-700">Área Profesional</TableHead>
                    <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-700">Provincia</TableHead>
                    <TableHead className="font-semibold text-gray-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profesionales?.map((professional) => (
                    <TableRow 
                      key={professional.id} 
                      className="hover:bg-teal-50/50 transition-colors duration-200 border-b border-gray-200"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {professional.nombre} {professional.apellidos}
                      </TableCell>
                      <TableCell className="text-gray-700">{professional.dni}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200">
                          {professional.area_profesional}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(professional.estado_solicitud)}>
                          {professional.estado_solicitud}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{professional.provincia}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectProfessional(professional)}
                          className="flex items-center space-x-1 hover:bg-teal-50 hover:border-teal-300"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {(!profesionales || profesionales.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron profesionales que coincidan con los criterios de búsqueda.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessionalsTable;
