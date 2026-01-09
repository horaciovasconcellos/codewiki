import { useState } from 'react';
import { TipoAfastamento, TipoTempo } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface TipoAfastamentoFormProps {
  tipoAfastamento?: TipoAfastamento;
  tiposAfastamento: TipoAfastamento[];
  onSave: (tipo: TipoAfastamento) => void;
  trigger?: React.ReactNode;
}

export function TipoAfastamentoForm({ tipoAfastamento, tiposAfastamento, onSave, trigger }: TipoAfastamentoFormProps) {
  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState(tipoAfastamento?.sigla || '');
  const [descricao, setDescricao] = useState(tipoAfastamento?.descricao || '');
  const [argumentacaoLegal, setArgumentacaoLegal] = useState(tipoAfastamento?.argumentacaoLegal || '');
  const [numeroDias, setNumeroDias] = useState(tipoAfastamento?.numeroDias.toString() || '');
  const [tipoTempo, setTipoTempo] = useState<TipoTempo>(tipoAfastamento?.tipoTempo || 'D');

  const isEditing = !!tipoAfastamento;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const siglaPattern = /^[A-Za-z0-9]{3}$/;
    if (!siglaPattern.test(sigla)) {
      toast.error('Sigla deve conter exatamente 3 caracteres alfanuméricos');
      return;
    }

    if (descricao.length > 50) {
      toast.error('Descrição deve ter no máximo 50 caracteres');
      return;
    }

    if (argumentacaoLegal.length > 60) {
      toast.error('Argumentação Legal deve ter no máximo 60 caracteres');
      return;
    }

    const diasPattern = /^\d{1,2}$/;
    if (!diasPattern.test(numeroDias)) {
      toast.error('Número de dias deve ser numérico e entre 1 e 99');
      return;
    }

    const dias = parseInt(numeroDias);
    if (dias < 1 || dias > 99) {
      toast.error('Número de dias deve estar entre 1 e 99');
      return;
    }

    const siglaExiste = tiposAfastamento.some(
      t => t.sigla?.toUpperCase() === sigla?.toUpperCase() && t.id !== tipoAfastamento?.id
    );

    if (siglaExiste) {
      toast.error('Sigla já cadastrada');
      return;
    }

    const novoTipo: TipoAfastamento = {
      id: tipoAfastamento?.id || generateUUID(),
      sigla: sigla.toUpperCase(),
      descricao,
      argumentacaoLegal,
      numeroDias: dias,
      tipoTempo
    };

    onSave(novoTipo);
    setOpen(false);
    toast.success(isEditing ? 'Tipo de afastamento atualizado' : 'Tipo de afastamento cadastrado');

    if (!isEditing) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSigla('');
    setDescricao('');
    setArgumentacaoLegal('');
    setNumeroDias('');
    setTipoTempo('D');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2" />
            Novo Tipo de Afastamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold">
            {isEditing ? 'Editar Tipo de Afastamento' : 'Novo Tipo de Afastamento'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do tipo de afastamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="sigla" className="text-base font-medium">Sigla *</Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="Ex: FER"
                required
                className="h-11 text-base font-mono"
              />
              <p className="text-sm text-muted-foreground">
                3 caracteres alfanuméricos
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="numeroDias" className="text-base font-medium">Número de Dias *</Label>
              <Input
                id="numeroDias"
                type="number"
                value={numeroDias}
                onChange={(e) => setNumeroDias(e.target.value)}
                min={1}
                max={99}
                placeholder="Ex: 30"
                required
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Entre 1 e 99 dias
              </p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="descricao" className="text-base font-medium">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={50}
                placeholder="Ex: Férias Anuais"
                required
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Até 50 caracteres
              </p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="argumentacaoLegal" className="text-base font-medium">Argumentação Legal *</Label>
              <Input
                id="argumentacaoLegal"
                value={argumentacaoLegal}
                onChange={(e) => setArgumentacaoLegal(e.target.value)}
                maxLength={60}
                placeholder="Ex: Art. 129 da CLT"
                required
                className="h-11 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Até 60 caracteres
              </p>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label className="text-base font-medium">Tipo de Tempo *</Label>
              <RadioGroup value={tipoTempo} onValueChange={(v) => setTipoTempo(v as TipoTempo)}>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="D" id="dias" />
                  <Label htmlFor="dias" className="font-normal cursor-pointer text-base flex-1">
                    Dias (D) - Contagem em dias
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="M" id="meses" />
                  <Label htmlFor="meses" className="font-normal cursor-pointer text-base flex-1">
                    Meses (M) - Contagem em meses
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="A" id="anos" />
                  <Label htmlFor="anos" className="font-normal cursor-pointer text-base flex-1">
                    Anos (A) - Contagem em anos
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6 text-base">
              Cancelar
            </Button>
            <Button type="submit" className="h-11 px-6 text-base">
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
