import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface FichajePreviewRow {
  enNo: string | null;
  fechaHora: string;
  mode?: string | null;
  inout?: string | null;
  source?: string | null;
  profesional?: string | null;
}

interface FichajesListProps {
  rows: FichajePreviewRow[];
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

export function FichajesList({ rows, emptyMessage = 'Sin registros para mostrar', className, compact = false }: FichajesListProps) {
  if (!rows.length) {
    return (
      <Card className={cn('text-center text-sm text-muted-foreground', className)}>
        <CardContent className="py-10">{emptyMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Fecha</TableHead>
            <TableHead>Profesional / EnNo</TableHead>
            <TableHead>Modo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const dateLabel = (() => {
              const date = new Date(row.fechaHora);
              return Number.isNaN(date.getTime())
                ? row.fechaHora
                : format(date, compact ? 'dd/MM HH:mm' : "PPP '·' HH:mm:ss", { locale: es });
            })();

            return (
              <TableRow key={`${row.enNo || 'row'}-${index}`}>
                <TableCell>{dateLabel}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{row.profesional || 'Desconocido'}</span>
                    <span className="text-xs text-muted-foreground">{row.enNo || '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.mode ? <Badge variant="outline">{row.mode}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {row.inout ? <Badge variant={row.inout === 'IN' ? 'secondary' : 'default'}>{row.inout}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.source || '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
