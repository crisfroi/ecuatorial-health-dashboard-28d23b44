import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  FileText, 
  Download, 
  DollarSign, 
  Users, 
  Calendar,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useGuardias, useNominas, useBaremos, useCalculateBaremo } from '@/hooks/useGuardSystem';
import { useGuardiasStore } from '@/stores/useGuardiasStore';
import { usePublicHospitals } from '@/hooks/useRealProfesionales';
import { 
  Guardia, 
  Nomina, 
  CategoriaProfesional, 
  TipoGuardia, 
  TipoDia 
} from '@/types/guardias';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface PayrollCalculation {
  profesionalId: string;
  profesionalNombre: string;
  categoria: CategoriaProfesional;
  guardias: {
    fisica: { ordinarias: number; finesSemana: number; festivos: number; };
    localizable: { ordinarias: number; finesSemana: number; festivos: number; activadas: number; };
    administrativa: { ordinarias: number; finesSemana: number; festivos: number; };
  };
  costos: {
    fisica: number;
    localizable: number;
    administrativa: number;
    total: number;
  };
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

const NominaGuardias: React.FC = () => {
  const { selectedHospital } = useGuardiasStore();
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [calculatedPayroll, setCalculatedPayroll] = useState<PayrollCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: guardias = [] } = useGuardias({
    centroId: selectedHospital,
    mes: selectedMes,
    anio: selectedAnio
  });

  const { data: nominas = [], isLoading: loadingNominas, error: nominasError } = useNominas({
    centroId: selectedHospital,
    mes: selectedMes,
    anio: selectedAnio
  });

  const { data: baremos = [], error: baremosError } = useBaremos();

  // Show warning if database tables don't exist yet
  React.useEffect(() => {
    if (nominasError) {
      console.warn('Nominas error:', nominasError);
    }
    if (baremosError) {
      console.warn('Baremos error:', baremosError);
    }
  }, [nominasError, baremosError]);
  const { data: hospitales = [] } = usePublicHospitals();
  const calculateBaremoMutation = useCalculateBaremo();

  const selectedHospitalData = hospitales.find(h => h.id === selectedHospital);

  // Filter validated guards only
  const validatedGuards = useMemo(() => {
    return guardias.filter(g => g.validacionEstado === 'validada');
  }, [guardias]);

  // Calculate payroll automatically
  const calculatePayroll = async () => {
    if (!selectedHospital) {
      toast.error('Seleccione un hospital primero');
      return;
    }

    setIsCalculating(true);
    try {
      const professionalGroups = validatedGuards.reduce((acc, guardia) => {
        const key = guardia.profesionalId;
        if (!acc[key]) {
          acc[key] = {
            profesional: guardia.profesional,
            guardias: []
          };
        }
        acc[key].guardias.push(guardia);
        return acc;
      }, {} as Record<string, { profesional: any; guardias: Guardia[] }>);

      const calculations: PayrollCalculation[] = [];

      for (const [profesionalId, data] of Object.entries(professionalGroups)) {
        const profesional = data.profesional;
        if (!profesional) continue;

        // Count guards by type and day type
        const guardiasCounts = {
          fisica: { ordinarias: 0, finesSemana: 0, festivos: 0 },
          localizable: { ordinarias: 0, finesSemana: 0, festivos: 0, activadas: 0 },
          administrativa: { ordinarias: 0, finesSemana: 0, festivos: 0 }
        };

        data.guardias.forEach(guardia => {
          const tipo = guardia.tipo;
          const tipoDia = guardia.tipoDia;
          
          if (tipoDia === 'ordinario') {
            guardiasCounts[tipo].ordinarias++;
          } else if (tipoDia === 'fin_semana') {
            guardiasCounts[tipo].finesSemana++;
          } else if (tipoDia === 'festivo') {
            guardiasCounts[tipo].festivos++;
          }

          // Count activated on-call guards
          if (tipo === 'localizable' && guardia.localizableActivada) {
            guardiasCounts.localizable.activadas++;
          }
        });

        // Calculate costs
        const categoria = profesional.area?.toLowerCase().includes('especialista') ? 'especialista' :
                         profesional.area?.toLowerCase().includes('general') ? 'general_licenciado' :
                         profesional.area?.toLowerCase().includes('enfermero') ? 'tecnico_diplomado' :
                         'auxiliar';

        const getCosto = (tipo: TipoGuardia, tipoDia: TipoDia) => {
          const baremo = baremos.find(b => 
            b.categoria === categoria && 
            b.tipoGuardia === tipo && 
            b.tipoDia === tipoDia &&
            b.activo
          );
          return baremo?.valor || 0;
        };

        const costoFisica = 
          (guardiasCounts.fisica.ordinarias * getCosto('fisica', 'ordinario')) +
          (guardiasCounts.fisica.finesSemana * getCosto('fisica', 'fin_semana')) +
          (guardiasCounts.fisica.festivos * getCosto('fisica', 'festivo'));

        const costoLocalizable = 
          (guardiasCounts.localizable.ordinarias * getCosto('localizable', 'ordinario')) +
          (guardiasCounts.localizable.finesSemana * getCosto('localizable', 'fin_semana')) +
          (guardiasCounts.localizable.festivos * getCosto('localizable', 'festivo'));

        const costoAdministrativa = 
          (guardiasCounts.administrativa.ordinarias * getCosto('administrativa', 'ordinario')) +
          (guardiasCounts.administrativa.finesSemana * getCosto('administrativa', 'fin_semana')) +
          (guardiasCounts.administrativa.festivos * getCosto('administrativa', 'festivo'));

        const costoTotal = costoFisica + costoLocalizable + costoAdministrativa;

        calculations.push({
          profesionalId,
          profesionalNombre: profesional.nombre || 'Profesional',
          categoria: categoria as CategoriaProfesional,
          guardias: guardiasCounts,
          costos: {
            fisica: costoFisica,
            localizable: costoLocalizable,
            administrativa: costoAdministrativa,
            total: costoTotal
          }
        });
      }

      setCalculatedPayroll(calculations);
      setShowGenerationDialog(true);
    } catch (error: any) {
      console.error('Error calculating payroll:', error);
      toast.error('Error calculando la nómina');
    } finally {
      setIsCalculating(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (calculatedPayroll.length === 0) return;

    const worksheetData = [
      // Header
      ['NÓMINA DE GUARDIAS MÉDICAS'],
      [`Hospital: ${selectedHospitalData?.nombre || 'No especificado'}`],
      [`Período: ${MESES.find(m => m.value === selectedMes)?.label} ${selectedAnio}`],
      [`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [], // Empty row
      // Table headers
      [
        'Profesional', 
        'Categoría',
        'Físicas Ord.', 'Físicas F/S', 'Físicas Fest.',
        'Local. Ord.', 'Local. F/S', 'Local. Fest.', 'Local. Activ.',
        'Admin. Ord.', 'Admin. F/S', 'Admin. Fest.',
        'Costo Físicas', 'Costo Localizables', 'Costo Admin.', 'TOTAL'
      ]
    ];

    // Add data rows
    calculatedPayroll.forEach(calc => {
      worksheetData.push([
        calc.profesionalNombre,
        calc.categoria,
        calc.guardias.fisica.ordinarias,
        calc.guardias.fisica.finesSemana,
        calc.guardias.fisica.festivos,
        calc.guardias.localizable.ordinarias,
        calc.guardias.localizable.finesSemana,
        calc.guardias.localizable.festivos,
        calc.guardias.localizable.activadas,
        calc.guardias.administrativa.ordinarias,
        calc.guardias.administrativa.finesSemana,
        calc.guardias.administrativa.festivos,
        calc.costos.fisica,
        calc.costos.localizable,
        calc.costos.administrativa,
        calc.costos.total
      ]);
    });

    // Add totals
    const totalGeneral = calculatedPayroll.reduce((sum, calc) => sum + calc.costos.total, 0);
    worksheetData.push([]);
    worksheetData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL GENERAL:', totalGeneral]);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nómina Guardias');

    const fileName = `nomina_guardias_${selectedMes}_${selectedAnio}_${selectedHospitalData?.nombre?.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Archivo Excel generado exitosamente');
  };

  const getEstadoNomina = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>;
      case 'enviada_seaf':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <FileText className="w-3 h-3 mr-1" />
          Enviada SEAF
        </Badge>;
      case 'aprobada':
        return <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprobada
        </Badge>;
      case 'pagada':
        return <Badge variant="outline" className="bg-guinea-teal/10 text-guinea-teal">
          <DollarSign className="w-3 h-3 mr-1" />
          Pagada
        </Badge>;
      default:
        return null;
    }
  };

  const totalCalculated = calculatedPayroll.reduce((sum, calc) => sum + calc.costos.total, 0);

  // Show database setup message if needed
  if (nominasError || baremosError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sistema de Guardias en Configuración</h3>
              <p className="text-gray-600 mb-4">
                Las tablas del sistema de guardias aún no han sido creadas en la base de datos.
              </p>
              <p className="text-sm text-gray-500">
                Contacte al administrador del sistema para completar la configuración.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nómina de Guardias</h2>
          <p className="text-gray-600">
            Cálculo automático y generación de nóminas
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={calculatePayroll}
            disabled={!selectedHospital || validatedGuards.length === 0 || isCalculating}
            className="bg-guinea-teal hover:bg-guinea-dark-teal"
          >
            <Calculator className="w-4 h-4 mr-2" />
            {isCalculating ? 'Calculando...' : 'Calcular Nómina'}
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Hospital</Label>
              <Select value={selectedHospital} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="No seleccionado" />
                </SelectTrigger>
              </Select>
            </div>
            
            <div>
              <Label>Mes</Label>
              <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map(mes => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(parseInt(e.target.value))}
                min="2024"
                max="2030"
              />
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-guinea-teal" />
              <span className="text-sm">
                {validatedGuards.length} guardias validadas
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guardias Validadas</p>
                <p className="text-2xl font-bold text-guinea-teal">{validatedGuards.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-guinea-teal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profesionales</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(validatedGuards.map(g => g.profesionalId)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nóminas Generadas</p>
                <p className="text-2xl font-bold text-green-600">{nominas.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Costo Estimado</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalCalculated.toLocaleString('es-ES')} XAF
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Payrolls */}
      <Card>
        <CardHeader>
          <CardTitle>Nóminas Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingNominas ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-guinea-teal mx-auto"></div>
            </div>
          ) : nominas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay nóminas generadas para este período</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nominas.map((nomina) => (
                <Card key={nomina.id} className="border-l-4 border-l-guinea-teal">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            Nómina {MESES.find(m => m.value === nomina.mes)?.label} {nomina.anio}
                          </h3>
                          {getEstadoNomina(nomina.estado)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Total: {nomina.totalGeneral.toLocaleString('es-ES')} XAF</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Generada: {format(nomina.fechaCreacion, 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{nomina.centro?.nombre}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {nomina.archivoXlsx && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Excel
                          </Button>
                        )}
                        {nomina.archivoPdf && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Generation Dialog */}
      <Dialog open={showGenerationDialog} onOpenChange={setShowGenerationDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generar Nómina de Guardias</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="detalle" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalle">Detalle por Profesional</TabsTrigger>
                <TabsTrigger value="resumen">Resumen Ejecutivo</TabsTrigger>
              </TabsList>

              <TabsContent value="detalle" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profesional</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-center">Físicas</TableHead>
                        <TableHead className="text-center">Localizables</TableHead>
                        <TableHead className="text-center">Admin.</TableHead>
                        <TableHead className="text-right">Total (XAF)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedPayroll.map((calc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {calc.profesionalNombre}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{calc.categoria}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xs">
                              <div>Ord: {calc.guardias.fisica.ordinarias}</div>
                              <div>F/S: {calc.guardias.fisica.finesSemana}</div>
                              <div>Fest: {calc.guardias.fisica.festivos}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xs">
                              <div>Ord: {calc.guardias.localizable.ordinarias}</div>
                              <div>F/S: {calc.guardias.localizable.finesSemana}</div>
                              <div>Act: {calc.guardias.localizable.activadas}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-xs">
                              <div>Ord: {calc.guardias.administrativa.ordinarias}</div>
                              <div>F/S: {calc.guardias.administrativa.finesSemana}</div>
                              <div>Fest: {calc.guardias.administrativa.festivos}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {calc.costos.total.toLocaleString('es-ES')}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 border-guinea-teal">
                        <TableCell colSpan={5} className="font-bold text-right">
                          TOTAL GENERAL:
                        </TableCell>
                        <TableCell className="text-right font-bold text-guinea-teal">
                          {totalCalculated.toLocaleString('es-ES')} XAF
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="resumen" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">Total Profesionales</h3>
                        <p className="text-3xl font-bold text-guinea-teal">
                          {calculatedPayroll.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">Total Guardias</h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {validatedGuards.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">Costo Total</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {totalCalculated.toLocaleString('es-ES')} XAF
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-guinea-light-teal/10 rounded-lg">
                  <h4 className="font-semibold mb-2">Información del Período</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Hospital:</strong> {selectedHospitalData?.nombre}
                    </div>
                    <div>
                      <strong>Período:</strong> {MESES.find(m => m.value === selectedMes)?.label} {selectedAnio}
                    </div>
                    <div>
                      <strong>Guardias Validadas:</strong> {validatedGuards.length}
                    </div>
                    <div>
                      <strong>Fecha de Cálculo:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowGenerationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button className="bg-guinea-teal hover:bg-guinea-dark-teal">
              <FileText className="w-4 h-4 mr-2" />
              Generar Nómina
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NominaGuardias;
