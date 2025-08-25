import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGuardiasStore } from "@/stores/useGuardiasStore";
import { 
  Calculator, 
  Download, 
  FileText, 
  DollarSign, 
  TrendingUp,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NominaGuardiasProps {
  selectedMonth: number;
  selectedYear: number;
  selectedCenter: string | null;
  userRole: string;
}

export const NominaGuardias: React.FC<NominaGuardiasProps> = ({
  selectedMonth,
  selectedYear,
  selectedCenter,
  userRole
}) => {
  const { toast } = useToast();
  const {
    nominas,
    nominasLineas,
    guardias,
    profesionales,
    baremos,
    loading,
    fetchNominas,
    fetchNominasLineas,
    fetchGuardias,
    fetchBaremos,
    generateNomina,
    aprobarNomina,
    rechazarNomina,
    exportNomina,
    calcularMontoGuardia
  } = useGuardiasStore();

  const [selectedTab, setSelectedTab] = useState('resumen');
  const [selectedNomina, setSelectedNomina] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNominas(selectedMonth, selectedYear, selectedCenter);
    fetchGuardias(selectedMonth, selectedYear, selectedCenter);
    fetchBaremos();
  }, [selectedMonth, selectedYear, selectedCenter]);

  const nominaActual = nominas.find(n =>
    n.mes === selectedMonth &&
    n.anio === selectedYear &&
    (selectedCenter ? n.centro_salud_id === selectedCenter : true)
  );

  const handleGenerateNomina = async () => {
    try {
      await generateNomina({
        mes: selectedMonth,
        ano: selectedYear,
        centro_id: selectedCenter
      });
      
      toast({
        title: "Nómina generada",
        description: "La nómina ha sido generada exitosamente.",
      });
      
      setIsGenerateDialogOpen(false);
      fetchNominas(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar la nómina.",
        variant: "destructive",
      });
    }
  };

  const handleAprobarNomina = async (nominaId: string) => {
    try {
      await aprobarNomina(nominaId);
      toast({
        title: "Nómina aprobada",
        description: "La nómina ha sido aprobada correctamente.",
      });
      fetchNominas(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la nómina.",
        variant: "destructive",
      });
    }
  };

  const handleRechazarNomina = async (nominaId: string) => {
    try {
      await rechazarNomina(nominaId);
      toast({
        title: "Nómina rechazada",
        description: "La nómina ha sido rechazada.",
      });
      fetchNominas(selectedMonth, selectedYear, selectedCenter);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la nómina.",
        variant: "destructive",
      });
    }
  };

  const handleExportNomina = async (nominaId: string, formato: 'PDF' | 'EXCEL') => {
    try {
      await exportNomina(nominaId, formato);
      toast({
        title: "Exportación exitosa",
        description: `Nómina exportada en formato ${formato}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar la nómina.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (nomina: any) => {
    setSelectedNomina(nomina);
    await fetchNominasLineas(nomina.id);
    setIsDetailDialogOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Borrador</Badge>;
      case 'GENERADA':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Generada</Badge>;
      case 'REVISADA':
        return <Badge className="bg-yellow-100 text-yellow-800"><Eye className="w-3 h-3 mr-1" />Revisada</Badge>;
      case 'APROBADA':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  const canGenerateNomina = ['SUPER_ADMINISTRADOR', 'DIRECTIVO_CENTRO_SANITARIO'].includes(userRole);
  const canApproveNomina = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL'].includes(userRole);
  const canViewNomina = ['SUPER_ADMINISTRADOR', 'PERSONALIDAD_MINISTERIAL', 'DIRECTIVO_CENTRO_SANITARIO', 'REVISOR_SOLICITUDES'].includes(userRole);

  const filteredLineas = nominasLineas.filter(linea =>
    linea.profesional?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nómina de Guardias</h2>
          <p className="text-gray-600">
            Gestión de nóminas de guardias médicas para {selectedMonth}/{selectedYear}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {nominaActual && canViewNomina && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportNomina(nominaActual.id, 'PDF')}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportNomina(nominaActual.id, 'EXCEL')}
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </>
          )}

          {canGenerateNomina && !nominaActual && (
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calculator className="w-4 h-4 mr-2" />
                  Generar Nómina
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generar Nómina de Guardias</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Información del Período</h4>
                    <div className="text-sm text-blue-800">
                      <p>Mes: {selectedMonth}/{selectedYear}</p>
                      {selectedCenter ? (
                        <p className="text-green-700">✅ Centro: {selectedCenter}</p>
                      ) : (
                        <div className="text-red-600">
                          <p className="font-medium">⚠️ Debe seleccionar un centro de salud</p>
                          <p className="text-xs mt-1">Las nóminas deben estar asociadas a un centro específico</p>
                        </div>
                      )}
                      <p>Guardias registradas: {guardias.length}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleGenerateNomina}
                      disabled={loading || !selectedCenter}
                      className={!selectedCenter ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Generar Nómina
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estado de la nómina */}
      {nominaActual && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Nómina {selectedMonth}/{selectedYear}</h3>
                  <p className="text-sm text-gray-600">
                    Total: {formatCurrency(nominaActual.total_importe || 0)} •
                    Profesionales: {nominaActual.total_profesionales || 0} •
                    Guardias: {nominaActual.total_guardias || 0} •
                    Creada: {new Date(nominaActual.created_at || Date.now()).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getEstadoBadge(nominaActual.estado)}
                {canApproveNomina && nominaActual.estado === 'GENERADA' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAprobarNomina(nominaActual.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRechazarNomina(nominaActual.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalle">Detalle por Profesional</TabsTrigger>
          <TabsTrigger value="baremos">Baremos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando resumen...</p>
            </div>
          ) : nominaActual ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Nómina</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(nominaActual.total_importe || 0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Profesionales</p>
                      <p className="text-2xl font-bold">{nominaActual.total_profesionales || 0}</p>
                    </div>
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Guardias Pagadas</p>
                      <p className="text-2xl font-bold">{nominaActual.total_guardias || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promedio/Guardia</p>
                      <p className="text-2xl font-bold">
                        {(nominaActual.total_guardias || 0) > 0 ? formatCurrency((nominaActual.total_importe || 0) / (nominaActual.total_guardias || 1)) : 'XAF 0'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay nómina generada
                </h3>
                <p className="text-gray-600 mb-4">
                  {canGenerateNomina ? 
                    'Genera la nómina para ver los cálculos de las guardias.' :
                    'La nómina aún no ha sido generada para este período.'
                  }
                </p>
                {canGenerateNomina && (
                  <Button onClick={() => setIsGenerateDialogOpen(true)}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Generar Nómina
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detalle" className="space-y-4">
          {nominaActual ? (
            <>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Buscar profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                <Button
                  variant="outline"
                  onClick={() => handleViewDetails(nominaActual)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Detalles Completos
                </Button>
              </div>

              <div className="space-y-4">
                {filteredLineas.map((linea) => (
                  <Card key={linea.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">
                            {linea.profesional?.nombre_completo}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Guardias:</span> {linea.cantidad_guardias}
                            </div>
                            <div>
                              <span className="font-medium">Horas:</span> {linea.total_horas}
                            </div>
                            <div>
                              <span className="font-medium">Base:</span> {formatCurrency(linea.total_base)}
                            </div>
                            <div>
                              <span className="font-medium">Complementos:</span> {formatCurrency(linea.total_complementos)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(linea.total_linea)}
                          </p>
                          <p className="text-sm text-gray-600">Total</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredLineas.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No se encontraron profesionales
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'No hay resultados para tu búsqueda.' : 'No hay líneas de nómina disponibles.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nómina no disponible
                </h3>
                <p className="text-gray-600">
                  Debe generar la nómina primero para ver el detalle por profesional.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="baremos" className="space-y-4">
          <div className="grid gap-4">
            {baremos.map((baremo) => (
              <Card key={baremo.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{baremo.concepto}</span>
                    <Badge variant={baremo.activo ? "default" : "secondary"}>
                      {baremo.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tarifa Base:</span> {formatCurrency(baremo.tarifa_base)}
                    </div>
                    <div>
                      <span className="font-medium">Nocturno:</span> {baremo.multiplicador_nocturno}x
                    </div>
                    <div>
                      <span className="font-medium">Festivo:</span> {baremo.multiplicador_festivo}x
                    </div>
                    <div>
                      <span className="font-medium">Fuente:</span> {baremo.fuente}
                    </div>
                  </div>
                  {baremo.observaciones && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      {baremo.observaciones}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {baremos.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay baremos configurados
                  </h3>
                  <p className="text-gray-600">
                    Se necesitan baremos para calcular las nóminas de guardias.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="space-y-4">
            {nominas.map((nomina) => (
              <Card key={nomina.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        Nómina {nomina.mes}/{nomina.ano}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Generada: {new Date(nomina.fecha_generacion).toLocaleDateString('es-ES')} •
                        Total: {formatCurrency(nomina.total)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEstadoBadge(nomina.estado)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(nomina)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {nominas.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay nóminas históricas
                  </h3>
                  <p className="text-gray-600">
                    Las nóminas generadas aparecerán en este histórico.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Nómina {selectedNomina?.mes}/{selectedNomina?.ano}
            </DialogTitle>
          </DialogHeader>
          
          {selectedNomina && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="text-sm">
                <strong>Total: {formatCurrency(selectedNomina.total)}</strong> •
                Profesionales: {selectedNomina.total_lineas} •
                Estado: {selectedNomina.estado}
              </div>
              
              <div className="space-y-2">
                {nominasLineas.map((linea) => (
                  <div key={linea.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{linea.profesional?.nombre_completo}</h4>
                        <div className="text-xs text-gray-600 mt-1">
                          {linea.cantidad_guardias} guardias • {linea.total_horas} horas •
                          Base: {formatCurrency(linea.total_base)} •
                          Complementos: {formatCurrency(linea.total_complementos)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600">
                          {formatCurrency(linea.total_linea)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
