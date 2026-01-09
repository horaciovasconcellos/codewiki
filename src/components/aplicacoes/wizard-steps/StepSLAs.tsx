import { useState, useEffect } from 'react';
import { AssociacaoSLAAplicacao, SLA } from '@/lib/types';
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

interface StepSLAsProps {
  slas: AssociacaoSLAAplicacao[];
  setSlas: (value: AssociacaoSLAAplicacao[]) => void;
}

export function StepSLAs({ slas, setSlas }: StepSLAsProps) {
  const [slasDisponiveis, setSlasDisponiveis] = useState<SLA[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoSLAAplicacao | null>(null);
  const [formData, setFormData] = useState({
    slaId: undefined as string | undefined,
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  // Carregar SLAs disponíveis da API
  useEffect(() => {
    const loadSLAs = async () => {
      try {
        const response = await fetch('/api/slas');
        if (response.ok) {
          const data = await response.json();
          console.log('[StepSLAs] SLAs carregados:', data.length);
          setSlasDisponiveis(data);
        }
      } catch (error) {
        console.error('[StepSLAs] Erro ao carregar SLAs:', error);
      }
    };
    loadSLAs();
  }, []);

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      slaId: undefined,
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoSLAAplicacao) => {
    setEditing(assoc);
    
    // Converter data para formato YYYY-MM-DD se necessário (dd/mm/yyyy -> yyyy-mm-dd)
    const formatDateForInput = (dateStr: string | undefined) => {
      if (!dateStr) return '';
      // Se já está no formato YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr.split('T')[0];
      }
      // Se está no formato DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    };
    
    setFormData({
      slaId: assoc.slaId,
      dataInicio: formatDateForInput(assoc.dataInicio),
      dataTermino: formatDateForInput(assoc.dataTermino),
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.slaId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const slaEncontrado = slasDisponiveis.find(s => s.id === formData.slaId);
    if (!slaEncontrado) {
      toast.error('SLA não encontrado');
      return;
    }

    const assoc: AssociacaoSLAAplicacao = {
      id: editing?.id || generateUUID(),
      slaId: formData.slaId,
      descricao: `${slaEncontrado.sigla} - ${slaEncontrado.descricao}`,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    console.log('[StepSLAs] Salvando SLA:', assoc);

    if (editing) {
      setSlas(slas.map(s => s.id === editing.id ? assoc : s));
      toast.success('SLA atualizado');
    } else {
      setSlas([...slas, assoc]);
      toast.success('SLA adicionado');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setSlas(slas.map(s => 
      s.id === id ? { ...s, status: 'Inativo' as const } : s
    ));
    toast.success('SLA marcado como inativo');
  };

  const getSLANome = (id: string) => {
    const sla = slasDisponiveis.find(s => s.id === id);
    return sla ? `${sla.sigla} - ${sla.descricao}` : 'SLA não encontrado';
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
          Associe os SLAs (Service Level Agreements) relacionados a esta aplicação
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar SLA
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar SLA' : 'Novo SLA'}</DialogTitle>
              <DialogDescription>
                Associe um SLA à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="slaId">SLA *</Label>
                <Select
                  value={formData.slaId}
                  onValueChange={(value) => setFormData({ ...formData, slaId: value })}
                >
                  <SelectTrigger id="slaId">
                    <SelectValue placeholder="Selecione um SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    {slasDisponiveis.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Nenhum SLA cadastrado
                      </div>
                    ) : (
                      slasDisponiveis.map((sla) => (
                        <SelectItem key={sla.id} value={sla.id}>
                          {sla.sigla} - {sla.descricao}
                        </SelectItem>
                      ))
                    )}
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

      {slas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhum SLA associado
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SLA</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slas.map((assoc) => (
                <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{getSLANome(assoc.slaId)}</TableCell>
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
