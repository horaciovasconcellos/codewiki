import { useState } from 'react';
import { IntegracaoAplicacao, Aplicacao } from '@/lib/types';
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

interface StepIntegracoesProps {
  aplicacoes: Aplicacao[];
  integracoes: IntegracaoAplicacao[];
  setIntegracoes: (value: IntegracaoAplicacao[]) => void;
}

export function StepIntegracoes({ 
  aplicacoes, 
  integracoes, 
  setIntegracoes 
}: StepIntegracoesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<IntegracaoAplicacao | null>(null);
  const [formData, setFormData] = useState({
    aplicacaoDestinoId: '',
    dataInicio: getTodayDate(),
    dataTermino: '',
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormData({
      aplicacaoDestinoId: '',
      dataInicio: getTodayDate(),
      dataTermino: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (integ: IntegracaoAplicacao) => {
    setEditing(integ);
    setFormData({
      aplicacaoDestinoId: integ.aplicacaoDestinoId,
      dataInicio: integ.dataInicio,
      dataTermino: integ.dataTermino || '',
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.aplicacaoDestinoId || !formData.dataInicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const integ: IntegracaoAplicacao = {
      id: editing?.id || generateUUID(),
      aplicacaoDestinoId: formData.aplicacaoDestinoId,
      dataInicio: formData.dataInicio,
      dataTermino: formData.dataTermino || undefined,
      status: 'Ativo',
    };

    if (editing) {
      setIntegracoes(integracoes.map(i => i.id === editing.id ? integ : i));
      toast.success('Integração atualizada');
    } else {
      setIntegracoes([...integracoes, integ]);
      toast.success('Integração adicionada');
    }

    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setIntegracoes(integracoes.map(i => 
      i.id === id ? { ...i, status: 'Inativo' as const } : i
    ));
    toast.success('Integração marcada como inativa');
  };

  const getAplicacaoNome = (id: string) => {
    const app = aplicacoes.find(a => a.id === id);
    return app ? `${app.sigla} - ${app.descricao}` : 'Não encontrada';
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
          Configure as integrações com outras aplicações
        </p>
        <Dialog key={editing?.id || 'new'} open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} size="sm">
              <Plus className="mr-2" />
              Adicionar Integração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Integração' : 'Nova Integração'}</DialogTitle>
              <DialogDescription>
                Associe uma integração com outra aplicação
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="aplicacaoDestinoId">Aplicação Destino *</Label>
                <Select
                  value={formData.aplicacaoDestinoId}
                  onValueChange={(value) => setFormData({ ...formData, aplicacaoDestinoId: value })}
                >
                  <SelectTrigger id="aplicacaoDestinoId">
                    <SelectValue placeholder="Selecione uma aplicação" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla} - {app.descricao}
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

      {integracoes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
          Nenhuma integração configurada
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aplicação Destino</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integracoes.map((integ) => (
                <TableRow key={integ.id} className={`hover:bg-gray-100 ${integ.status === 'Inativo' ? 'opacity-50' : ''}`}>
                  <TableCell className="font-medium">{getAplicacaoNome(integ.aplicacaoDestinoId)}</TableCell>
                  <TableCell>{formatDate(integ.dataInicio)}</TableCell>
                  <TableCell>{formatDate(integ.dataTermino)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      integ.status === 'Ativo' 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {integ.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(integ)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(integ.id)}
                        disabled={integ.status === 'Inativo'}
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
