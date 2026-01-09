import { useState } from 'react';
import { AssociacaoCapacidadeNegocio, CapacidadeNegocio } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface StepCapacidadesProps {
  capacidades: CapacidadeNegocio[];
  capacidadesAssociadas: AssociacaoCapacidadeNegocio[];
  setCapacidadesAssociadas: (value: AssociacaoCapacidadeNegocio[]) => void;
}

export function StepCapacidades({ 
  capacidades, 
  capacidadesAssociadas, 
  setCapacidadesAssociadas 
}: StepCapacidadesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoCapacidadeNegocio | null>(null);
  const [formData, setFormData] = useState({
    capacidadeId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      capacidadeId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoCapacidadeNegocio) => {
    setEditing(assoc);
    setFormData({
      capacidadeId: assoc.capacidadeId,
      dataInicio: assoc.dataInicio,
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.capacidadeId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const assoc: AssociacaoCapacidadeNegocio = {
      id: editing?.id || generateUUID(),
      capacidadeId: formData.capacidadeId,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    if (editing) {
      setCapacidadesAssociadas(capacidadesAssociadas.map(c => c.id === editing.id ? assoc : c));
      toast.success('Capacidade atualizada');
    } else {
      setCapacidadesAssociadas([...capacidadesAssociadas, assoc]);
      toast.success('Capacidade adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setCapacidadesAssociadas(capacidadesAssociadas.map(c => 
      c.id === id ? { ...c, status: 'Inativo' as const } : c
    ));
    toast.success('Capacidade marcada como inativa');
  };

  const getCapacidadeNome = (id: string) => {
    const cap = capacidades.find(c => c.id === id);
    return cap ? cap.nome : 'Não encontrada';
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
        <div>
          <p className="text-sm text-muted-foreground">
            Associe as capacidades de negócio relacionadas
          </p>
          {capacidades.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              Nenhuma capacidade cadastrada. Cadastre capacidades na tela de Capacidades de Negócio.
            </p>
          )}
        </div>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm" disabled={capacidades.length === 0}>
              <Plus className="mr-2" />
              Adicionar Capacidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Capacidade' : 'Nova Capacidade'}</DialogTitle>
              <DialogDescription>
                Associe uma capacidade de negócio à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="capacidadeId">Capacidade *</Label>
                <Select
                  value={formData.capacidadeId}
                  onValueChange={(value) => setFormData({ ...formData, capacidadeId: value })}
                >
                  <SelectTrigger id="capacidadeId">
                    <SelectValue placeholder="Selecione uma capacidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {capacidades.map((cap) => (
                      <SelectItem key={cap.id} value={cap.id}>
                        {cap.nome}
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

      {capacidadesAssociadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma capacidade associada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capacidade</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capacidadesAssociadas.map((assoc) => (
                <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{getCapacidadeNome(assoc.capacidadeId)}</TableCell>
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
