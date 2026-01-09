import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { AssociacaoSLAAplicacao, SLA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FloppyDisk, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getTodayDate } from '@/lib/utils';
import { generateUUID } from '@/utils/uuid';

interface AssociacaoSLADialogProps {
  associacao?: AssociacaoSLAAplicacao;
  onSave: (associacao: AssociacaoSLAAplicacao) => void;
}

export function AssociacaoSLADialog({ associacao, onSave }: AssociacaoSLADialogProps) {
  const [open, setOpen] = useState(false);
  const [slas] = useLocalStorage<SLA[]>('slas', []);
  const [slaId, setSlaId] = useState(associacao?.slaId || '');
  const [descricao, setDescricao] = useState(associacao?.descricao || '');
  const [dataInicio, setDataInicio] = useState(associacao?.dataInicio || getTodayDate());
  const [dataTermino, setDataTermino] = useState(associacao?.dataTermino || '');

  useEffect(() => {
    if (associacao) {
      setSlaId(associacao.slaId);
      setDescricao(associacao.descricao);
      setDataInicio(associacao.dataInicio);
      setDataTermino(associacao.dataTermino || '');
    }
  }, [associacao]);

  const handleSubmit = () => {
    if (!slaId || !slaId.trim()) {
      toast.error('Selecione um SLA');
      return;
    }

    if (!descricao || !descricao.trim()) {
      toast.error('Informe uma descrição para a associação');
      return;
    }

    if (!dataInicio || !dataInicio.trim()) {
      toast.error('Informe a data de início');
      return;
    }

    const novaAssociacao: AssociacaoSLAAplicacao = {
      id: associacao?.id || generateUUID(),
      slaId,
      descricao: descricao.trim(),
      dataInicio,
      dataTermino: dataTermino || undefined,
      status: 'Ativo'
    };

    onSave(novaAssociacao);
    toast.success(associacao ? 'Associação atualizada com sucesso' : 'SLA associado com sucesso');
    handleClose();
  };

  const handleClose = () => {
    if (!associacao) {
      setSlaId('');
      setDescricao('');
      setDataInicio(getTodayDate());
      setDataTermino('');
    }
    setOpen(false);
  };

  const slasAtivos = (slas || []).filter(s => s.status === 'Ativo');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {associacao ? (
          <Button variant="ghost" size="sm">
            Editar
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2" />
            Associar SLA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{associacao ? 'Editar' : 'Associar'} SLA à Aplicação</DialogTitle>
          <DialogDescription>
            Defina a associação entre a aplicação e um Service Level Agreement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sla">SLA *</Label>
            <Select value={slaId} onValueChange={setSlaId}>
              <SelectTrigger id="sla">
                <SelectValue placeholder="Selecione um SLA" />
              </SelectTrigger>
              <SelectContent>
                {slasAtivos.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum SLA cadastrado
                  </div>
                ) : (
                  slasAtivos.map((sla) => (
                    <SelectItem key={sla.id} value={sla.id}>
                      {sla.sigla} - {sla.descricao}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione o SLA que será associado a esta aplicação
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Associação *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: SLA de disponibilidade para ambiente produtivo"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Descreva o contexto e objetivo desta associação de SLA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataTermino">Data de Término</Label>
              <Input
                id="dataTermino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não houver data de término
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <FloppyDisk className="mr-2" />
            {associacao ? 'Atualizar' : 'Associar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
