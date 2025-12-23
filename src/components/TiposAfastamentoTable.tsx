import { TipoAfastamento } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { TipoAfastamentoForm } from './TipoAfastamentoForm';
import { toast } from 'sonner';

interface TiposAfastamentoTableProps {
  tiposAfastamento: TipoAfastamento[];
  onTipoSave: (tipo: TipoAfastamento) => void;
  onTipoDelete: (id: string) => void;
}

export function TiposAfastamentoTable({ tiposAfastamento, onTipoSave, onTipoDelete }: TiposAfastamentoTableProps) {
  const handleDelete = (tipo: TipoAfastamento) => {
    if (confirm(`Deseja realmente excluir o tipo "${tipo.descricao}"?`)) {
      onTipoDelete(tipo.id);
      toast.success('Tipo de afastamento excluído');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-28 font-semibold text-base h-12">Sigla</TableHead>
            <TableHead className="font-semibold text-base h-12">Descrição</TableHead>
            <TableHead className="font-semibold text-base h-12">Argumentação Legal</TableHead>
            <TableHead className="w-32 font-semibold text-base h-12">Nº Dias</TableHead>
            <TableHead className="w-40 font-semibold text-base h-12">Tipo Tempo</TableHead>
            <TableHead className="w-28 font-semibold text-base h-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposAfastamento.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-base">
                Nenhum tipo de afastamento cadastrado
              </TableCell>
            </TableRow>
          ) : (
            tiposAfastamento.map((tipo) => (
              <TableRow key={tipo.id} className="h-16">
                <TableCell>
                  <Badge variant="outline" className="font-mono font-bold text-sm px-2 py-1">
                    {tipo.sigla}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-base">{tipo.descricao}</TableCell>
                <TableCell className="text-base text-muted-foreground">
                  {tipo.argumentacaoLegal}
                </TableCell>
                <TableCell className="text-center text-base font-medium">{tipo.numeroDias}</TableCell>
                <TableCell>
                  <Badge 
                    variant={tipo.tipoTempo === 'D' ? 'default' : tipo.tipoTempo === 'M' ? 'secondary' : 'outline'}
                    className="font-mono text-sm px-3 py-1"
                  >
                    {tipo.tipoTempo === 'D' ? 'Dias' : tipo.tipoTempo === 'M' ? 'Meses' : 'Anos'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <TipoAfastamentoForm
                      tipoAfastamento={tipo}
                      tiposAfastamento={tiposAfastamento}
                      onSave={onTipoSave}
                      trigger={
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(tipo)}
                      className="h-9 w-9 p-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
