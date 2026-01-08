import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TarefaSDD, StatusTarefa } from '@/types/sdd';

interface TarefaFormProps {
  requisitoId: string;
  tarefa?: TarefaSDD;
  onClose: () => void;
  onSave: () => void;
}

// Função para converter data ISO ou MySQL para formato yyyy-MM-dd
const formatDateForInput = (date: string | undefined): string => {
  if (!date) return '';
  // Se já está no formato correto (yyyy-MM-dd), retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // Converte ISO ou MySQL timestamp para yyyy-MM-dd
  return date.split('T')[0];
};

export function TarefaForm({ requisitoId, tarefa, onClose, onSave }: TarefaFormProps) {
  const [formData, setFormData] = useState({
    descricao: tarefa?.descricao || '',
    data_inicio: formatDateForInput(tarefa?.data_inicio) || new Date().toISOString().split('T')[0],
    data_termino: formatDateForInput(tarefa?.data_termino),
    status: tarefa?.status || ('TO DO' as StatusTarefa),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (formData.data_termino && formData.data_termino < formData.data_inicio) {
      toast.error('Data de término não pode ser anterior à data de início');
      return;
    }

    setSaving(true);

    try {
      const url = tarefa ? `/api/sdd/tarefas/${tarefa.id}` : '/api/sdd/tarefas';
      const method = tarefa ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, requisito_id: requisitoId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar tarefa');
      }

      toast.success(`Tarefa ${tarefa ? 'atualizada' : 'criada'} com sucesso`);

      onSave();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tarefa ? 'Editar' : 'Nova'} Tarefa</DialogTitle>
          <DialogDescription>
            {tarefa ? 'Editar informações da tarefa' : 'Criar nova tarefa para o requisito'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Suporte a Markdown..."
              rows={6}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                disabled={!!tarefa}
                required
              />
              {tarefa && <p className="text-xs text-muted-foreground">Não editável após criação</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_termino">Data de Término</Label>
              <Input
                id="data_termino"
                type="date"
                value={formData.data_termino}
                onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: StatusTarefa) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TO DO">TO DO</SelectItem>
                <SelectItem value="IN PROGRESS">IN PROGRESS</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
              </SelectContent>
            </Select>
            {formData.status === 'DONE' && !formData.data_termino && (
              <p className="text-xs text-muted-foreground">
                Data de término será preenchida automaticamente
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : tarefa ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
