import React, { useState, useEffect } from 'react';
import { Checkpoint, CategoriaCheckpoint, StatusCheckpoint } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CheckpointFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoint?: Checkpoint | null;
  aplicacaoId: string;
  onSave: () => void;
}

export function CheckpointForm({ open, onOpenChange, checkpoint, aplicacaoId, onSave }: CheckpointFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'Prazo' as CategoriaCheckpoint,
    status: 'Em Risco' as StatusCheckpoint,
    dataPrevista: '',
    dataReal: '',
  });

  useEffect(() => {
    if (checkpoint) {
      setFormData({
        descricao: checkpoint.descricao || '',
        categoria: checkpoint.categoria || 'Prazo',
        status: checkpoint.status || 'Em Risco',
        dataPrevista: checkpoint.dataPrevista ? checkpoint.dataPrevista.split('T')[0] : '',
        dataReal: checkpoint.dataReal ? checkpoint.dataReal.split('T')[0] : '',
      });
    } else {
      setFormData({
        descricao: '',
        categoria: 'Prazo',
        status: 'Em Risco',
        dataPrevista: '',
        dataReal: '',
      });
    }
  }, [checkpoint, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        aplicacaoId,
        ...formData,
      };

      const url = checkpoint
        ? `${API_URL}/api/checkpoints/${checkpoint.id}`
        : `${API_URL}/api/checkpoints`;
      
      const method = checkpoint ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(checkpoint ? 'Checkpoint atualizado com sucesso' : 'Checkpoint criado com sucesso');
        onSave();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar checkpoint');
      }
    } catch (error) {
      console.error('Erro ao salvar checkpoint:', error);
      toast.error('Erro ao salvar checkpoint');
    } finally {
      setLoading(false);
    }
  };

  const isFinalized = !!(checkpoint && checkpoint.dataReal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{checkpoint ? 'Editar Checkpoint' : 'Novo Checkpoint'}</DialogTitle>
          <DialogDescription>
            {isFinalized
              ? 'Este checkpoint está finalizado e não pode ser editado.'
              : 'Preencha as informações do checkpoint.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              maxLength={100}
              required
              disabled={isFinalized}
            />
            <span className="text-xs text-muted-foreground">
              {formData.descricao.length}/100 caracteres
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: CategoriaCheckpoint) =>
                  setFormData({ ...formData, categoria: value })
                }
                disabled={isFinalized}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Escopo">Escopo</SelectItem>
                  <SelectItem value="Prazo">Prazo</SelectItem>
                  <SelectItem value="Custo">Custo</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Seguranca">Segurança</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusCheckpoint) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isFinalized || !!formData.dataReal}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="Em Risco">Em Risco</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              {formData.dataReal && (
                <span className="text-xs text-muted-foreground">
                  Status será automaticamente definido como OK ao informar Data Real
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataPrevista">Data Prevista *</Label>
              <Input
                id="dataPrevista"
                type="date"
                value={formData.dataPrevista}
                onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })}
                required
                disabled={isFinalized}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataReal">Data Real</Label>
              <Input
                id="dataReal"
                type="date"
                value={formData.dataReal}
                onChange={(e) => setFormData({ ...formData, dataReal: e.target.value })}
                disabled={isFinalized}
              />
              {formData.dataReal && (
                <span className="text-xs text-yellow-600">
                  ⚠️ Ao definir Data Real, o checkpoint será finalizado e não poderá mais ser editado
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {!isFinalized && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
