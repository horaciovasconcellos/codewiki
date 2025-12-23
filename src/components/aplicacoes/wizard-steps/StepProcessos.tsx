import { useState } from 'react';
import { AssociacaoProcessoNegocio, ProcessoNegocio } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';

interface StepProcessosProps {
  processos: ProcessoNegocio[];
  processosAssociados: AssociacaoProcessoNegocio[];
  setProcessosAssociados: (value: AssociacaoProcessoNegocio[]) => void;
}

export function StepProcessos({ 
  processos, 
  processosAssociados, 
  setProcessosAssociados 
}: StepProcessosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoProcessoNegocio | null>(null);
  const [formData, setFormData] = useState({
    processoId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      processoId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoProcessoNegocio) => {
    setEditing(assoc);
    setFormData({
      processoId: assoc.processoId,
      dataInicio: assoc.dataInicio,
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.processoId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const assoc: AssociacaoProcessoNegocio = {
      id: editing?.id || crypto.randomUUID(),
      processoId: formData.processoId,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    if (editing) {
      setProcessosAssociados(processosAssociados.map(p => p.id === editing.id ? assoc : p));
      toast.success('Processo atualizado');
    } else {
      setProcessosAssociados([...processosAssociados, assoc]);
      toast.success('Processo adicionado');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setProcessosAssociados(processosAssociados.map(p => 
      p.id === id ? { ...p, status: 'Inativo' as const } : p
    ));
    toast.success('Processo marcado como inativo');
  };

  const getProcessoNome = (id: string) => {
    const proc = processos.find(p => p.id === id);
    return proc ? `${proc.identificacao} - ${proc.descricao}` : 'Não encontrado';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    // Lidar com formato ISO 8601 (2025-12-15T00:00:00.000Z) ou YYYY-MM-DD
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já está no formato DD/MM/YYYY, retornar como está
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Associe os processos de negócio relacionados
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Processo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
              <DialogDescription>
                Associe um processo de negócio à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="processoId">Processo *</Label>
                <Select
                  value={formData.processoId}
                  onValueChange={(value) => setFormData({ ...formData, processoId: value })}
                >
                  <SelectTrigger id="processoId">
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processos.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id}>
                        {proc.identificacao} - {proc.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataTermino">Data de Término</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    value={formData.dataTermino}
                    onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {processosAssociados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum processo associado
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processosAssociados.map((assoc) => (
                <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{getProcessoNome(assoc.processoId)}</TableCell>
                  <TableCell>{formatDate(assoc.dataInicio)}</TableCell>
                  <TableCell>{formatDate(assoc.dataTermino)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      assoc.status === 'Ativo' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {assoc.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(assoc)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(assoc.id)}
                        disabled={assoc.status === 'Inativo'}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
