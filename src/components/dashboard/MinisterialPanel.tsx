import React, { useState, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Copy, Trash2 } from 'lucide-react';
import { useProfesionales, Profesional } from "@/hooks/useProfesionales";

const MinisterialPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const { data: profesionales } = useProfesionales();
  
  const checkboxRef = useRef<HTMLButtonElement>(null);

  const filteredProfessionals = profesionales?.filter(profesional =>
    profesional.nombre_completo?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleProfessionalSelect = (id: string) => {
    setSelectedProfessionals(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCopySelected = () => {
    const selectedData = filteredProfessionals
      .filter(profesional => selectedProfessionals.includes(profesional.id))
      .map(profesional => profesional.nombre_completo)
      .join('\n');

    navigator.clipboard.writeText(selectedData);
    toast({
      title: "Copiado al portapapeles",
      description: "Los nombres de los profesionales seleccionados han sido copiados.",
    });
  };

  const handleDeleteSelected = () => {
    // Implementar la lógica de eliminación aquí
    toast({
      title: "Eliminar",
      description: "Implementar la lógica de eliminación aquí.",
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProfessionals(filteredProfessionals.map(profesional => profesional.id));
    } else {
      setSelectedProfessionals([]);
    }
    
    // Fix the indeterminate property access
    if (checkboxRef.current) {
      (checkboxRef.current as any).indeterminate = false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Label htmlFor="search">Buscar:</Label>
        <Input
          type="search"
          id="search"
          placeholder="Buscar por nombre"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <Table>
        <TableCaption>Lista de profesionales sanitarios</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                ref={checkboxRef}
                checked={selectedProfessionals.length === filteredProfessionals.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Área Profesional</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProfessionals.map((profesional) => (
            <TableRow key={profesional.id}>
              <TableCell className="font-medium">
                <Checkbox
                  checked={selectedProfessionals.includes(profesional.id)}
                  onCheckedChange={() => handleProfessionalSelect(profesional.id)}
                />
              </TableCell>
              <TableCell>{profesional.nombre_completo}</TableCell>
              <TableCell>{profesional.area_profesional}</TableCell>
              <TableCell>{profesional.estado_solicitud}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(profesional.nombre_completo || '');
                      toast({ description: "Nombre copiado al portapapeles." })
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar nombre
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem>
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará el profesional permanentemente.
                            ¿Estás seguro de que quieres continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleCopySelected} disabled={selectedProfessionals.length === 0}>
          Copiar Seleccionados
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={selectedProfessionals.length === 0}>
              Eliminar Seleccionados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente los profesionales seleccionados.
                ¿Estás seguro de que quieres continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSelected}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MinisterialPanel;
