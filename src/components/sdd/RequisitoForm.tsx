import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequisitoSDD, StatusRequisito } from '@/types/sdd';

interface RequisitoFormProps {
  projetoId: string;
  requisito?: RequisitoSDD;
  onClose: () => void;
  onSave: () => void;
}

const STATUS_FLUXO_NORMAL: StatusRequisito[] = ['BACKLOG', 'REFINAMENTO', 'PRONTO P/DEV', 'DONE'];
const STATUS_ESPECIAIS: StatusRequisito[] = [
  'BLOQUEADO',
  'EM RETRABALHO',
  'SPIKE TÉCNICO',
  'PAUSADO',
  'CANCELADO',
  'ROLLBACK',
];

const getStatusPermitidos = (statusAtual?: StatusRequisito): StatusRequisito[] => {
  if (!statusAtual || statusAtual === 'BACKLOG') {
    return ['BACKLOG', 'REFINAMENTO', ...STATUS_ESPECIAIS];
  }
  if (statusAtual === 'REFINAMENTO') {
    return ['BACKLOG', 'REFINAMENTO', 'PRONTO P/DEV', ...STATUS_ESPECIAIS];
  }
  if (statusAtual === 'PRONTO P/DEV') {
    return ['BACKLOG', 'REFINAMENTO', 'PRONTO P/DEV', 'DONE', ...STATUS_ESPECIAIS];
  }
  if (statusAtual === 'DONE') {
    return ['DONE', ...STATUS_ESPECIAIS];
  }
  // Status especiais podem ir para qualquer lugar
  return [...STATUS_FLUXO_NORMAL, ...STATUS_ESPECIAIS];
};

export function RequisitoForm({ projetoId, requisito, onClose, onSave }: RequisitoFormProps) {
  const [formData, setFormData] = useState({
    nome: requisito?.nome || '',
    descricao: requisito?.descricao || '',
    status: requisito?.status || ('BACKLOG' as StatusRequisito),
  });
  const [saving, setSaving] = useState(false);

  const statusPermitidos = getStatusPermitidos(requisito?.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (formData.nome.length > 150) {
      toast.error('Nome deve ter no máximo 150 caracteres');
      return;
    }

    setSaving(true);

    try {
      const url = requisito ? `/api/sdd/requisitos/${requisito.id}` : '/api/sdd/requisitos';
      const method = requisito ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projeto_id: projetoId,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar requisito');

      toast.success(`Requisito ${requisito ? 'atualizado' : 'criado'} com sucesso`);

      onSave();
    } catch (error) {
      toast.error('Erro ao salvar requisito');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{requisito ? 'Editar' : 'Novo'} Requisito</DialogTitle>
          <DialogDescription>
            {requisito ? `Editando ${requisito.sequencia}` : 'Criar novo requisito/história de usuário'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do requisito"
              maxLength={150}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.nome.length}/150 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Suporte a Markdown. Descreva o requisito..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Suporte a Markdown</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: StatusRequisito) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusPermitidos.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requisito && requisito.status !== formData.status && (
              <p className="text-xs text-muted-foreground">
                Status atual: {requisito.status}
                {requisito.status_anterior && ` (anterior: ${requisito.status_anterior})`}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : requisito ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
