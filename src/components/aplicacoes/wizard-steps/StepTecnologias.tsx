import { useState } from 'react';
import { AssociacaoTecnologiaAplicacao, Tecnologia } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';

interface StepTecnologiasProps {
  tecnologias: Tecnologia[];
  tecnologiasAssociadas: AssociacaoTecnologiaAplicacao[];
  setTecnologiasAssociadas: (value: AssociacaoTecnologiaAplicacao[]) => void;
}

export function StepTecnologias({ 
  tecnologias, 
  tecnologiasAssociadas, 
  setTecnologiasAssociadas 
}: StepTecnologiasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoTecnologiaAplicacao | null>(null);
  const [formData, setFormData] = useState({
    tecnologiaId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  // Debug logs
  console.log('[StepTecnologias] Render:', {
    totalTecnologias: tecnologias.length,
    totalAssociadas: tecnologiasAssociadas.length,
    tecnologiasAssociadas,
    isOpen,
    editing: editing?.id
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      tecnologiaId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoTecnologiaAplicacao) => {
    setEditing(assoc);
    setFormData({
      tecnologiaId: assoc.tecnologiaId,
      dataInicio: assoc.dataInicio,
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.tecnologiaId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const assoc: AssociacaoTecnologiaAplicacao = {
      id: editing?.id || crypto.randomUUID(),
      tecnologiaId: formData.tecnologiaId,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    console.log('[StepTecnologias] Salvando:', { assoc, editing: !!editing });

    if (editing) {
      const updated = tecnologiasAssociadas.map(t => t.id === editing.id ? assoc : t);
      console.log('[StepTecnologias] Atualizando:', updated);
      setTecnologiasAssociadas(updated);
      toast.success('Tecnologia atualizada');
    } else {
      const updated = [...tecnologiasAssociadas, assoc];
      console.log('[StepTecnologias] Adicionando:', updated);
      setTecnologiasAssociadas(updated);
      toast.success('Tecnologia adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setTecnologiasAssociadas(tecnologiasAssociadas.map(t => 
      t.id === id ? { ...t, status: 'Inativo' as const } : t
    ));
    toast.success('Tecnologia marcada como inativa');
  };

  const getTecnologiaNome = (id: string) => {
    const tec = tecnologias.find(t => t.id === id);
    return tec ? `${tec.sigla} - ${tec.nome}` : 'Não encontrada';
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
          Associe as tecnologias utilizadas por esta aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Tecnologia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Tecnologia' : 'Nova Tecnologia'}</DialogTitle>
              <DialogDescription>
                Associe uma tecnologia à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tecnologiaId">Tecnologia *</Label>
                <Select
                  value={formData.tecnologiaId}
                  onValueChange={(value) => setFormData({ ...formData, tecnologiaId: value })}
                >
                  <SelectTrigger id="tecnologiaId">
                    <SelectValue placeholder="Selecione uma tecnologia" />
                  </SelectTrigger>
                  <SelectContent>
                    {tecnologias.map((tec) => (
                      <SelectItem key={tec.id} value={tec.id}>
                        {tec.sigla} - {tec.nome}
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

      {tecnologiasAssociadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma tecnologia associada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tecnologia</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecnologiasAssociadas.map((assoc) => (
                <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{getTecnologiaNome(assoc.tecnologiaId)}</TableCell>
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
