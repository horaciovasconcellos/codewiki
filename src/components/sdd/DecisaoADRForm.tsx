import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DecisaoArquiteturalSDD, StatusADR } from '@/types/sdd';

interface DecisaoADRFormProps {
  projetoId: string;
  decisao?: DecisaoArquiteturalSDD;
  onClose: () => void;
  onSave: () => void;
}

export function DecisaoADRForm({ projetoId, decisao, onClose, onSave }: DecisaoADRFormProps) {
  const [adrs, setAdrs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    adr_id: decisao?.adr_id || '',
    data_inicio: decisao?.data_inicio || new Date().toISOString().split('T')[0],
    data_termino: decisao?.data_termino || '',
    status: decisao?.status || ('Proposta' as StatusADR),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdrs();
  }, []);

  const loadAdrs = async () => {
    try {
      const response = await fetch('/api/adrs');
      const data = await response.json();
      setAdrs(data);
    } catch (error) {
      console.error('Erro ao carregar ADRs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.adr_id) {
      toast.error('Selecione um ADR');
      return;
    }

    setSaving(true);

    try {
      const url = decisao ? `/api/sdd/decisoes/${decisao.id}` : '/api/sdd/decisoes';
      const method = decisao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projeto_id: projetoId }),
      });

      if (!response.ok) throw new Error('Erro ao salvar decisão');

      toast.success(`Decisão ${decisao ? 'atualizada' : 'criada'} com sucesso`);

      onSave();
    } catch (error) {
      toast.error('Erro ao salvar decisão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{decisao ? 'Editar' : 'Nova'} Decisão Arquitetural</DialogTitle>
          <DialogDescription>
            Associar ADR ao projeto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adr">ADR *</Label>
            <Select
              value={formData.adr_id}
              onValueChange={(value) => setFormData({ ...formData, adr_id: value })}
              disabled={!!decisao}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ADR" />
              </SelectTrigger>
              <SelectContent>
                {adrs.map((adr) => (
                  <SelectItem key={adr.id} value={adr.id}>
                    {adr.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {decisao && <p className="text-xs text-muted-foreground">ADR não pode ser alterado</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                disabled={!!decisao}
              />
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
              onValueChange={(value: StatusADR) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Proposta">Proposta</SelectItem>
                <SelectItem value="Aceita">Aceita</SelectItem>
                <SelectItem value="Supersedida">Supersedida</SelectItem>
                <SelectItem value="Depreciada">Depreciada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : decisao ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
