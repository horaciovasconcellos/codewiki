import React, { useState, useEffect } from 'react';
import { CheckpointDetalhe, Colaborador } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DetalheFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detalhe?: CheckpointDetalhe | null;
  checkpointId: string;
  onSave: () => void;
}

export function DetalheForm({ open, onOpenChange, detalhe, checkpointId, onSave }: DetalheFormProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    responsavelId: '',
    dataPlanejada: '',
    dataEfetiva: '',
    descricaoDetalhada: '',
    comentarios: '',
  });

  useEffect(() => {
    fetchColaboradores();
  }, []);

  useEffect(() => {
    if (detalhe) {
      setFormData({
        responsavelId: detalhe.responsavelId || '',
        dataPlanejada: detalhe.dataPlanejada ? detalhe.dataPlanejada.split('T')[0] : '',
        dataEfetiva: detalhe.dataEfetiva ? detalhe.dataEfetiva.split('T')[0] : '',
        descricaoDetalhada: detalhe.descricaoDetalhada || '',
        comentarios: detalhe.comentarios || '',
      });
    } else {
      setFormData({
        responsavelId: '',
        dataPlanejada: '',
        dataEfetiva: '',
        descricaoDetalhada: '',
        comentarios: '',
      });
    }
  }, [detalhe, open]);

  const fetchColaboradores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/colaboradores`);
      const data = await response.json();
      setColaboradores(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        responsavelId: (formData.responsavelId && formData.responsavelId !== 'NONE') ? formData.responsavelId : null,
        dataPlanejada: formData.dataPlanejada || null,
        dataEfetiva: formData.dataEfetiva || null,
        descricaoDetalhada: formData.descricaoDetalhada || null,
        comentarios: formData.comentarios || null,
      };

      const url = detalhe
        ? `${API_URL}/api/checkpoints/${checkpointId}/detalhes/${detalhe.id}`
        : `${API_URL}/api/checkpoints/${checkpointId}/detalhes`;
      
      const method = detalhe ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(detalhe ? 'Detalhe atualizado com sucesso' : 'Detalhe criado com sucesso');
        onSave();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar detalhe');
      }
    } catch (error) {
      console.error('Erro ao salvar detalhe:', error);
      toast.error('Erro ao salvar detalhe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detalhe ? 'Editar Detalhe' : 'Novo Detalhe'}</DialogTitle>
          <DialogDescription>
            Preencha as informações do detalhe do checkpoint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select
              value={formData.responsavelId || 'NONE'}
              onValueChange={(value) => setFormData({ ...formData, responsavelId: value === 'NONE' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhum</SelectItem>
                {colaboradores.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.nome} ({col.matricula})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataPlanejada">Data Planejada</Label>
              <Input
                id="dataPlanejada"
                type="date"
                value={formData.dataPlanejada}
                onChange={(e) => setFormData({ ...formData, dataPlanejada: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataEfetiva">Data Efetiva</Label>
              <Input
                id="dataEfetiva"
                type="date"
                value={formData.dataEfetiva}
                onChange={(e) => setFormData({ ...formData, dataEfetiva: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoDetalhada">Descrição Detalhada</Label>
            <Textarea
              id="descricaoDetalhada"
              value={formData.descricaoDetalhada}
              onChange={(e) => setFormData({ ...formData, descricaoDetalhada: e.target.value })}
              rows={4}
              placeholder="Descreva os detalhes desta etapa do checkpoint..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentários</Label>
            <Textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
              rows={4}
              placeholder="Comentários adicionais ou observações..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
