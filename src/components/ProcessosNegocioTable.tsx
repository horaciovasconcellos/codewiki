import { ProcessoNegocio } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProcessoNegocioForm } from './ProcessoNegocioForm';
import { Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
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
} from '@/components/ui/alert-dialog';

interface ProcessosNegocioTableProps {
  processos: ProcessoNegocio[];
  onProcessoSave: (processo: ProcessoNegocio) => void;
  onProcessoDelete: (id: string) => void;
}

export function ProcessosNegocioTable({ processos, onProcessoSave, onProcessoDelete }: ProcessosNegocioTableProps) {
  const handleDelete = (id: string) => {
    onProcessoDelete(id);
    toast.success('Processo deletado com sucesso');
  };

  const getComplexidadeBadge = (complexidade: string) => {
    const colors: Record<string, string> = {
      'Muito Baixa': 'bg-green-100 text-green-800',
      'Baixa': 'bg-green-50 text-green-700',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Alta': 'bg-orange-100 text-orange-800',
      'Muito Alta': 'bg-red-100 text-red-800',
    };
    return colors[complexidade] || 'bg-muted text-muted-foreground';
  };

  const getMaturidadeBadge = (maturidade: string) => {
    const colors: Record<string, string> = {
      'Inicial': 'bg-red-100 text-red-800',
      'Repetível': 'bg-orange-100 text-orange-800',
      'Definido': 'bg-yellow-100 text-yellow-800',
      'Gerenciado': 'bg-blue-100 text-blue-800',
      'Otimizado': 'bg-green-100 text-green-800',
    };
    return colors[maturidade] || 'bg-muted text-muted-foreground';
  };

  if (processos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
        <p className="text-lg font-medium mb-2">Nenhum processo cadastrado</p>
        <p className="text-sm">Clique em "Novo Processo" para adicionar</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Identificação</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Nível Maturidade</TableHead>
            <TableHead>Área Responsável</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead>Duração Média</TableHead>
            <TableHead>Complexidade</TableHead>
            <TableHead>Normas</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.map((processo) => (
            <TableRow key={processo.id}>
              <TableCell className="font-medium font-mono">{processo.identificacao}</TableCell>
              <TableCell>{processo.descricao}</TableCell>
              <TableCell>
                <Badge className={getMaturidadeBadge(processo.nivelMaturidade)} variant="secondary">
                  {processo.nivelMaturidade}
                </Badge>
              </TableCell>
              <TableCell>{processo.areaResponsavel}</TableCell>
              <TableCell>{processo.frequencia}</TableCell>
              <TableCell>{processo.duracaoMedia} min</TableCell>
              <TableCell>
                <Badge className={getComplexidadeBadge(processo.complexidade)} variant="secondary">
                  {processo.complexidade}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {processo.normas.filter(n => n.status === 'Ativo').length} ativas
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <ProcessoNegocioForm
                    processo={processo}
                    processos={processos}
                    onSave={onProcessoSave}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o processo "{processo.identificacao} - {processo.descricao}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(processo.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
