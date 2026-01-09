import { useState, useEffect } from 'react';
import { AssociacaoRunbookAplicacao, Runbook } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash, BookOpen } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface StepRunbooksProps {
  runbooks: AssociacaoRunbookAplicacao[];
  setRunbooks: (value: AssociacaoRunbookAplicacao[]) => void;
}

export function StepRunbooks({ runbooks, setRunbooks }: StepRunbooksProps) {
  const [runbooksDisponiveis, setRunbooksDisponiveis] = useState<Runbook[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<AssociacaoRunbookAplicacao | null>(null);
  const [formData, setFormData] = useState({
    runbookId: undefined as string | undefined,
    descricao: '',
    dataAssociacao: getTodayDate(),
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Carregar Runbooks disponíveis da API
  useEffect(() => {
    const loadRunbooks = async () => {
      try {
        const response = await fetch(`${API_URL}/api/runbooks`);
        if (response.ok) {
          const data = await response.json();
          console.log('[StepRunbooks] Runbooks carregados:', data.length);
          setRunbooksDisponiveis(data);
        }
      } catch (error) {
        console.error('[StepRunbooks] Erro ao carregar Runbooks:', error);
        toast.error('Erro ao carregar runbooks');
      }
    };
    loadRunbooks();
  }, []);

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      runbookId: undefined,
      descricao: '',
      dataAssociacao: getTodayDate(),
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (assoc: AssociacaoRunbookAplicacao) => {
    setEditing(assoc);
    
    // Converter data para formato YYYY-MM-DD se necessário (dd/mm/yyyy -> yyyy-mm-dd)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return getTodayDate();
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
      runbookId: assoc.runbookId,
      descricao: assoc.descricao,
      dataAssociacao: formatDateForInput(assoc.dataAssociacao),
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.runbookId || !formData.dataAssociacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const runbookEncontrado = runbooksDisponiveis.find(r => r.id === formData.runbookId);
    if (!runbookEncontrado) {
      toast.error('Runbook não encontrado');
      return;
    }

    const assoc: AssociacaoRunbookAplicacao = {
      id: editing?.id || generateUUID(),
      runbookId: formData.runbookId,
      descricao: formData.descricao || `${runbookEncontrado.sigla} - ${runbookEncontrado.descricaoResumida}`,
      dataAssociacao: formData.dataAssociacao,
      status: 'Ativo',
    };

    console.log('[StepRunbooks] Salvando Runbook:', assoc);

    if (editing) {
      setRunbooks(runbooks.map(r => r.id === editing.id ? assoc : r));
      toast.success('Runbook atualizado');
    } else {
      setRunbooks([...runbooks, assoc]);
      toast.success('Runbook adicionado');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setRunbooks(runbooks.map(r => 
      r.id === id ? { ...r, status: 'Inativo' as const } : r
    ));
    toast.success('Runbook marcado como inativo');
  };

  const getRunbookInfo = (id: string) => {
    const runbook = runbooksDisponiveis.find(r => r.id === id);
    return runbook ? {
      sigla: runbook.sigla,
      descricao: runbook.descricaoResumida,
      tipo: runbook.tipoRunbook
    } : null;
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen size={20} />
            SLAs e Contratos - Runbooks
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Associe os runbooks (procedimentos operacionais) relacionados a esta aplicação
          </p>
        </div>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Runbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Runbook' : 'Novo Runbook'}</DialogTitle>
              <DialogDescription>
                Associe um runbook à aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="runbookId">Runbook *</Label>
                <Select
                  value={formData.runbookId}
                  onValueChange={(value) => {
                    const runbook = runbooksDisponiveis.find(r => r.id === value);
                    setFormData({ 
                      ...formData, 
                      runbookId: value,
                      descricao: runbook ? `${runbook.sigla} - ${runbook.descricaoResumida}` : ''
                    });
                  }}
                >
                  <SelectTrigger id="runbookId">
                    <SelectValue placeholder="Selecione um runbook" />
                  </SelectTrigger>
                  <SelectContent>
                    {runbooksDisponiveis.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Nenhum runbook cadastrado
                      </div>
                    ) : (
                      runbooksDisponiveis.map((runbook) => (
                        <SelectItem key={runbook.id} value={runbook.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{runbook.sigla}</span>
                            <span className="text-xs text-muted-foreground">{runbook.descricaoResumida}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.runbookId && getRunbookInfo(formData.runbookId) && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                    <p className="font-medium">Tipo: {getRunbookInfo(formData.runbookId)?.tipo}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Informações adicionais sobre a associação do runbook"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataAssociacao">Data de Associação *</Label>
                <Input
                  id="dataAssociacao"
                  type="date"
                  value={formData.dataAssociacao}
                  onChange={(e) => setFormData({ ...formData, dataAssociacao: e.target.value })}
                />
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

      {runbooks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum runbook associado</p>
          <p className="text-sm mt-1">Clique em "Adicionar Runbook" para começar</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sigla</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Associação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runbooks.map((assoc) => {
                const info = getRunbookInfo(assoc.runbookId);
                return (
                  <TableRow key={assoc.id} className={assoc.status === 'Inativo' ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{info?.sigla || 'N/A'}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={assoc.descricao}>
                        {assoc.descricao}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {info?.tipo || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(assoc.dataAssociacao)}</TableCell>
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
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assoc.id)}
                          disabled={assoc.status === 'Inativo'}
                          title="Desativar"
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
