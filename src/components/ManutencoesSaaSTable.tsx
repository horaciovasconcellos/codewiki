import { useState } from 'react';
import { ManutencaoSaaS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface ManutencoesSaaSTableProps {
  manutencoes: ManutencaoSaaS[];
  onChange: (manutencoes: ManutencaoSaaS[]) => void;
}

export function ManutencoesSaaSTable({ manutencoes, onChange }: ManutencoesSaaSTableProps) {
  const [open, setOpen] = useState(false);
  const [editingManutencao, setEditingManutencao] = useState<ManutencaoSaaS | null>(null);
  const [dataHoraInicio, setDataHoraInicio] = useState('');
  const [dataHoraTermino, setDataHoraTermino] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingManutencao(null);
    setDataHoraInicio('');
    setDataHoraTermino('');
  };

  const calculateHoursDifference = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const handleEdit = (manutencao: ManutencaoSaaS) => {
    setEditingManutencao(manutencao);
    setDataHoraInicio(manutencao.dataHoraInicio);
    setDataHoraTermino(manutencao.dataHoraTermino);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(manutencoes.filter(m => m.id !== id));
    toast.success('Manutenção removida com sucesso');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataHoraInicio || !dataHoraTermino) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const tempoIndisponibilidadeHoras = calculateHoursDifference(dataHoraInicio, dataHoraTermino);

    if (tempoIndisponibilidadeHoras < 0) {
      toast.error('Data/hora de término deve ser posterior à data/hora de início');
      return;
    }

    const novaManutencao: ManutencaoSaaS = {
      id: editingManutencao?.id || generateUUID(),
      dataHoraInicio,
      dataHoraTermino,
      tempoIndisponibilidadeHoras,
    };

    if (editingManutencao) {
      onChange(manutencoes.map(m => m.id === editingManutencao.id ? novaManutencao : m));
      toast.success('Manutenção atualizada com sucesso');
    } else {
      onChange([...manutencoes, novaManutencao]);
      toast.success('Manutenção adicionada com sucesso');
    }

    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Datas de Manutenção</h3>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2" />
              Adicionar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingManutencao ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle>
              <DialogDescription>
                Preencha as informações da manutenção do sistema SaaS
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataHoraInicio">Data/Hora Início *</Label>
                  <Input
                    id="dataHoraInicio"
                    type="datetime-local"
                    value={dataHoraInicio}
                    onChange={(e) => setDataHoraInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataHoraTermino">Data/Hora Término *</Label>
                  <Input
                    id="dataHoraTermino"
                    type="datetime-local"
                    value={dataHoraTermino}
                    onChange={(e) => setDataHoraTermino(e.target.value)}
                  />
                </div>
              </div>
              {dataHoraInicio && dataHoraTermino && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Tempo de indisponibilidade:</strong>{' '}
                    {calculateHoursDifference(dataHoraInicio, dataHoraTermino).toFixed(2)} horas
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingManutencao ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {manutencoes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma manutenção cadastrada</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora Início</TableHead>
                <TableHead>Data/Hora Término</TableHead>
                <TableHead>Tempo Indisponibilidade (horas)</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manutencoes.map((manutencao) => (
                <TableRow key={manutencao.id}>
                  <TableCell>
                    {new Date(manutencao.dataHoraInicio).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Date(manutencao.dataHoraTermino).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {manutencao.tempoIndisponibilidadeHoras.toFixed(2)}h
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(manutencao)}
                      >
                        <PencilSimple />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(manutencao.id)}
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
      )}
    </div>
  );
}