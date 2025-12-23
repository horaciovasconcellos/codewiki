import { useState } from 'react';
import { CapacidadeNegocio } from '@/lib/types';
import { CapacidadeForm } from './CapacidadeForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PencilSimple, Trash, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CapacidadesTableProps {
  capacidades: CapacidadeNegocio[];
  onCapacidadeSave: (capacidade: CapacidadeNegocio) => void | Promise<void>;
  onCapacidadeDelete: (id: string) => void | Promise<void>;
}

const getNivelColor = (nivel: string) => {
  switch (nivel) {
    case 'Nível 1':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Nível 2':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Nível 3':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoriaColor = (categoria: string) => {
  switch (categoria) {
    case 'Financeiro':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'RH':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Logística':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Atendimento':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'Produção':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Comercial':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export function CapacidadesTable({ capacidades, onCapacidadeSave, onCapacidadeDelete }: CapacidadesTableProps) {
  const [selectedCapacidade, setSelectedCapacidade] = useState<CapacidadeNegocio | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleDelete = (id: string) => {
    onCapacidadeDelete(id);
    toast.success('Capacidade removida com sucesso');
  };

  const handleView = (capacidade: CapacidadeNegocio) => {
    setSelectedCapacidade(capacidade);
    setViewDialogOpen(true);
  };

  if (capacidades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma capacidade cadastrada ainda.</p>
        <p className="text-sm mt-2">Clique em "Nova Capacidade" para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sigla</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capacidades.map((capacidade) => (
              <TableRow key={capacidade.id}>
                <TableCell className="font-mono font-semibold">{capacidade.sigla}</TableCell>
                <TableCell className="font-medium">{capacidade.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getNivelColor(capacidade.nivel)}>
                    {capacidade.nivel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoriaColor(capacidade.categoria)}>
                    {capacidade.categoria}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {capacidade.descricao || <span className="text-muted-foreground italic">Sem descrição</span>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(capacidade)}
                    >
                      <Eye />
                    </Button>
                    <CapacidadeForm
                      capacidades={capacidades}
                      capacidadeToEdit={capacidade}
                      onSave={onCapacidadeSave}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <PencilSimple />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash className="text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a capacidade <strong>{capacidade.sigla}</strong>?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(capacidade.id)}>
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">{selectedCapacidade?.sigla}</span>
              <span>-</span>
              <span>{selectedCapacidade?.nome}</span>
            </DialogTitle>
            <DialogDescription>Detalhes completos da capacidade de negócio</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedCapacidade && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Nível</h4>
                    <Badge variant="outline" className={getNivelColor(selectedCapacidade.nivel)}>
                      {selectedCapacidade.nivel}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Categoria</h4>
                    <Badge variant="outline" className={getCategoriaColor(selectedCapacidade.categoria)}>
                      {selectedCapacidade.categoria}
                    </Badge>
                  </div>
                </div>

                {selectedCapacidade.descricao && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h4>
                    <p className="text-sm">{selectedCapacidade.descricao}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Cobertura Estratégica</h3>

                  <div className="space-y-4">
                    {selectedCapacidade.coberturaEstrategica?.alinhamentoObjetivos && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Alinhamento com Objetivos Estratégicos
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.alinhamentoObjetivos}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.beneficiosEsperados && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Benefícios Esperados
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.beneficiosEsperados}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.estadoFuturoDesejado && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Estado Futuro Desejado (Target State)
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.estadoFuturoDesejado}
                        </p>
                      </div>
                    )}

                    {selectedCapacidade.coberturaEstrategica?.gapEstadoAtualFuturo && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Gap entre Estado Atual e Futuro
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedCapacidade.coberturaEstrategica.gapEstadoAtualFuturo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
