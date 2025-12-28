import { useState, useEffect } from 'react';
import { ADR, ADRAplicacao } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface StepADRsProps {
  adrsAssociadas: ADRAplicacao[];
  setAdrsAssociadas: (value: ADRAplicacao[]) => void;
}

export function StepADRs({ 
  adrsAssociadas, 
  setAdrsAssociadas 
}: StepADRsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ADRAplicacao | null>(null);
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [formData, setFormData] = useState({
    adrId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  useEffect(() => {
    loadADRs();
  }, []);

  const loadADRs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/adrs`);
      if (response.ok) {
        const data = await response.json();
        setAdrs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ADRs:', error);
      toast.error('Erro ao carregar ADRs');
    }
  };

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      adrId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: ADRAplicacao) => {
    setEditing(assoc);
    setFormData({
      adrId: assoc.adrId,
      dataInicio: assoc.dataInicio || getTodayDate(),
      dataTermino: assoc.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.adrId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const assoc: ADRAplicacao = {
      id: editing?.id || crypto.randomUUID(),
      adrId: formData.adrId,
      aplicacaoId: '', // Será preenchido ao salvar a aplicação
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    if (editing) {
      const updated = adrsAssociadas.map(a => a.id === editing.id ? assoc : a);
      setAdrsAssociadas(updated);
      toast.success('ADR atualizada');
    } else {
      const updated = [...adrsAssociadas, assoc];
      setAdrsAssociadas(updated);
      toast.success('ADR adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setAdrsAssociadas(adrsAssociadas.map(a => 
      a.id === id ? { ...a, status: 'Inativo' as const } : a
    ));
    toast.success('ADR marcada como inativa');
  };

  const getADRInfo = (id: string) => {
    const adr = adrs.find(a => a.id === id);
    return adr ? {
      sequencia: adr.sequencia,
      descricao: adr.descricao
    } : {
      sequencia: 0,
      descricao: 'Não encontrada'
    };
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
          Associe as Decisões Arquitetônicas (ADRs) relacionadas a esta aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar ADR
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar ADR' : 'Nova ADR'}</DialogTitle>
              <DialogDescription>
                Associe uma ADR à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="adrId">ADR *</Label>
                <Select
                  value={formData.adrId}
                  onValueChange={(value) => setFormData({ ...formData, adrId: value })}
                >
                  <SelectTrigger id="adrId">
                    <SelectValue placeholder="Selecione uma ADR" />
                  </SelectTrigger>
                  <SelectContent>
                    {adrs.map((adr) => (
                      <SelectItem key={adr.id} value={adr.id}>
                        ADR-{adr.sequencia.toString().padStart(4, '0')} - {adr.descricao}
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

      {adrsAssociadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma ADR associada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adrsAssociadas.map((assoc) => {
                const adrInfo = getADRInfo(assoc.adrId);
                return (
                  <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      ADR-{adrInfo.sequencia.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell>{adrInfo.descricao}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
