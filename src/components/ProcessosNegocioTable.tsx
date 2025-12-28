import { useState } from 'react';
import { ProcessoNegocio } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProcessoNegocioForm } from './ProcessoNegocioForm';
import { Pencil, Trash, CaretLeft, CaretRight } from '@phosphor-icons/react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProcessosNegocioTableProps {
  processos: ProcessoNegocio[];
  onProcessoSave: (processo: ProcessoNegocio) => void;
  onProcessoDelete: (id: string) => void;
}

export function ProcessosNegocioTable({ processos, onProcessoSave, onProcessoDelete }: ProcessosNegocioTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  // Paginação
  const totalPages = Math.ceil(processos.length / pageSize);
  const paginatedProcessos = processos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrando {paginatedProcessos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, processos.length)} de {processos.length} processos
        </div>
      </div>
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
          {paginatedProcessos.map((processo) => (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <CaretLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <CaretRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
