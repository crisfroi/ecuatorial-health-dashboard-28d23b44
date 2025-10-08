import { ChevronsUpDown, CheckCircle2, Info, XCircle } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateProfesionalSanitario } from "@/lib/api/profesionales-sanitarios";
import type { Professional as ProfesionalSanitario } from "@/types/Professional";
import { supabase } from "@/integrations/supabase/client";

interface RequestsPanelProps {
  userRole?: string;
  initialStatusFilter?: string;
  onSelectProfessional?: (p: ProfesionalSanitario) => void;
}

const RequestsPanel: React.FC<RequestsPanelProps> = ({
  userRole,
  initialStatusFilter,
  onSelectProfessional,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<any[]>([]);
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: professionalsList = [], refetch, isLoading } = useQuery({
    queryKey: ["requestsPanel", { initialStatusFilter }],
    queryFn: async () => {
      let qb = supabase
        .from("profesionales_sanitarios")
        .select("id, nombre_completo, email, telefono, area_profesional, estado_solicitud")
        .order("nombre_completo", { ascending: true });

      if (initialStatusFilter) {
        qb = qb.eq("estado_solicitud", initialStatusFilter);
      } else {
        qb = qb.neq("estado_solicitud", "Aprobado");
      }

      const { data, error } = await qb;
      if (error) throw error;
      return (data || []) as ProfesionalSanitario[];
    },
    staleTime: 60_000,
  });

  const updateProfesional = useMutation({
    mutationFn: updateProfesionalSanitario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesionales-sanitarios"] });
    },
  });

  const columns: ColumnDef<ProfesionalSanitario>[] = [
    {
      accessorKey: "nombre_completo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nombre
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "telefono",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Teléfono
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "colegio_profesional",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Colegio Profesional
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "area_profesional",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Área Profesional
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "estado_solicitud",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estado Solicitud
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const estado = row.getValue("estado_solicitud");
        let icon = null;
        let colorClass = "";

        switch (estado) {
          case "Pendiente":
            icon = <Info className="mr-2 h-4 w-4 text-blue-500" />;
            colorClass = "text-blue-500";
            break;
          case "Aprobado":
            icon = (
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            );
            colorClass = "text-green-500";
            break;
          case "Rechazado":
            icon = <XCircle className="mr-2 h-4 w-4 text-red-500" />;
            colorClass = "text-red-500";
            break;
          default:
            break;
        }

        return (
          <div className="flex items-center">
            {icon}
            <span className={colorClass}>{estado}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const request = row.original;

        return (
          <div className="flex gap-2 justify-end items-center">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 transition-all shadow-sm"
              onClick={() => handleQuickAction(request.id, 'Aprobado')}
            >
              <span className="mr-1 font-bold">✓</span> Aprobar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 transition-all shadow-sm"
              onClick={() => handleQuickAction(request.id, 'Rechazado')}
            >
              <span className="mr-1 font-bold">✗</span> Rechazar
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: professionalsList ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  const handleQuickAction = async (requestId: string, newStatus: string) => {
    const currentProfesional = professionalsList.find((p) => p.id === requestId);
    if (!currentProfesional) return;

    try {
      await updateProfesional.mutateAsync({
        id: requestId,
        updates: {
          estado_solicitud: newStatus,
          fecha_revision: newStatus === "Aprobado" ? new Date().toISOString().split("T")[0] : null,
          fecha_aprobacion: newStatus === "Aprobado" ? new Date().toISOString().split("T")[0] : null,
          revisor_solicitud: "Sistema",
          motivo_rechazo: newStatus === "Rechazado" ? "Rechazado desde panel de solicitudes" : null,
        },
      });

      await refetch();

      toast({
        title: `Solicitud ${newStatus}`,
        description: `La solicitud ha sido ${newStatus.toLowerCase()} exitosamente`,
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar nombres..."
          value={(table.getColumn("nombre_completo")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nombre_completo")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {(professionalsList?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isLoading ? 'Cargando…' : 'Sin resultados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows?.length ?? 0} de {table.getCoreRowModel().rows?.length ?? 0} resultados
        </div>
        <Button
          variant="outline"
          className="hidden h-8 w-20 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          Primero
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 lg:flex"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 lg:flex"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-20 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          Último
        </Button>
      </div>
    </div>
  );
};

export default RequestsPanel;
