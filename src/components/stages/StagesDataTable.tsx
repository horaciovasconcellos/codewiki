import { Stage } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilSimple, Trash } from '@phosphor-icons/react';

interface StagesDataTableProps {
  stages: Stage[];
  loading: boolean;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

const TIPO_COLORS: Record<string, string> = {
  Build: 'bg-blue-100 text-blue-800',
  Test: 'bg-green-100 text-green-800',
  Security: 'bg-red-100 text-red-800',
  Deploy: 'bg-purple-100 text-purple-800',
  Quality: 'bg-yellow-100 text-yellow-800',
  Notification: 'bg-gray-100 text-gray-800',
  Custom: 'bg-pink-100 text-pink-800',
};

export function StagesDataTable({
  stages,
  loading,
  onEdit,
  onDelete,
}: StagesDataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Nenhum stage cadastrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-center">Reutilizável</TableHead>
            <TableHead className="text-right">Timeout (s)</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.id}>
              <TableCell className="font-medium">{stage.nome}</TableCell>
              <TableCell>
                <Badge className={TIPO_COLORS[stage.tipo] || 'bg-gray-100 text-gray-800'}>
                  {stage.tipo}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                {stage.descricao || '-'}
              </TableCell>
              <TableCell className="text-center">
                {stage.reutilizavel ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Sim
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Não
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {stage.timeoutSeconds || 3600}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(stage)}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(stage)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
