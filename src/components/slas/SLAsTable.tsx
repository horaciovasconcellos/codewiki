import { useState } from 'react';
import { SLA } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SLADetailsDialog } from './SLADetailsDialog';

interface SLAsTableProps {
  slas: SLA[];
  onEdit: (sla: SLA) => void;
  onSLADelete: (id: string) => void;
}

export function SLAsTable({ slas, onEdit, onSLADelete }: SLAsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slaToDelete, setSLAToDelete] = useState<string | null>(null);
  const [viewingSLA, setViewingSLA] = useState<SLA | undefined>(undefined);

  const handleDeleteClick = (id: string) => {
    setSLAToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (slaToDelete) {
      onSLADelete(slaToDelete);
      toast.success('SLA excluído com sucesso');
    }
    setDeleteDialogOpen(false);
    setSLAToDelete(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (slas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum SLA cadastrado. Clique em "Novo SLA" para começar.
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
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Término</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slas.map((sla) => (
              <TableRow key={sla.id}>
                <TableCell className="font-medium">{sla.sigla}</TableCell>
                <TableCell className="max-w-xs truncate">{sla.descricao}</TableCell>
                <TableCell>{sla.tipoSLA}</TableCell>
                <TableCell>{formatDate(sla.dataInicio)}</TableCell>
                <TableCell>{formatDate(sla.dataTermino)}</TableCell>
                <TableCell>
                  <Badge variant={sla.status === 'Ativo' ? 'default' : 'secondary'}>
                    {sla.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingSLA(sla)}
                      title="Visualizar detalhes"
                    >
                      <Eye />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(sla)}
                      title="Editar"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(sla.id)}
                      title="Excluir"
                    >
                      <Trash />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {viewingSLA && (
        <SLADetailsDialog
          sla={viewingSLA}
          onClose={() => setViewingSLA(undefined)}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este SLA? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
