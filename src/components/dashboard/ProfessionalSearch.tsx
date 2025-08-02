import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react";
import { mockProfesionales } from "@/utils/testData";
import { Professional } from "@/hooks/useProfesionales";

const ProfessionalSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async () => {
    const data = mockProfesionales.filter(profesional =>
      profesional.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (areaFilter === '' || profesional.area_profesional === areaFilter)
    );

    if (data) {
      // Map the data to include required Professional properties
      const mappedData: Professional[] = data.map(item => ({
        ...item,
        documento_identidad: item.numero_documento || '',
        lugar_trabajo: item.nombre_centro || '',
        universidad: item.institucion_1 || '',
        numero_carnet_profesional: item.numero_autonumerico_correlativo?.toString() || ''
      }));
      
      setProfessionals(mappedData);
      setTotalResults(mappedData.length);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      <div className="flex items-center space-x-4">
        <div>
          <Label htmlFor="search">Buscar por nombre:</Label>
          <Input
            type="text"
            id="search"
            placeholder="Ingrese el nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="area">Filtrar por área:</Label>
          <Select onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas las áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las áreas</SelectItem>
              <SelectItem value="Medicina General">Medicina General</SelectItem>
              <SelectItem value="Enfermería">Enfermería</SelectItem>
              <SelectItem value="Odontología">Odontología</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </div>

      <div className="mt-6">
        <Table>
          <TableCaption>Resultados de la búsqueda: {totalResults} profesionales</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Área Profesional</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Número de Carnet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.map((profesional) => (
              <TableRow key={profesional.id}>
                <TableCell>{profesional.nombre_completo}</TableCell>
                <TableCell>{profesional.area_profesional}</TableCell>
                <TableCell>{profesional.estado_solicitud}</TableCell>
                 <TableCell>{profesional.numero_carnet_profesional}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProfessionalSearch;
