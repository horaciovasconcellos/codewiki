import { useState, useEffect } from 'react';
import { TipoAfastamento, TipoTempo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FloppyDisk, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface TiposAfastamentoFormProps {
  tipo?: TipoAfastamento;
  onSave: (tipo: TipoAfastamento) => void;
  onCancel: () => void;
}

export function TiposAfastamentoForm({ tipo, onSave, onCancel }: TiposAfastamentoFormProps) {
  const [sigla, setSigla] = useState('');
  const [descricao, setDescricao] = useState('');
  const [argumentacaoLegal, setArgumentacaoLegal] = useState('');
  const [numeroDias, setNumeroDias] = useState('');
  const [tipoTempo, setTipoTempo] = useState<TipoTempo>('D');

  useEffect(() => {
    if (tipo) {
      setSigla(tipo.sigla);
      setDescricao(tipo.descricao);
      setArgumentacaoLegal(tipo.argumentacaoLegal || '');
      setNumeroDias(tipo.numeroDias.toString());
      setTipoTempo(tipo.tipoTempo);
    }
  }, [tipo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sigla.trim()) {
      toast.error('Sigla é obrigatória');
      return;
    }

    const siglaPattern = /^[A-Za-z0-9]{1,10}$/;
    if (!siglaPattern.test(sigla)) {
      toast.error('Sigla deve conter apenas letras e números (máx. 10 caracteres)');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (descricao.length > 50) {
      toast.error('Descrição deve ter no máximo 50 caracteres');
      return;
    }

    if (argumentacaoLegal && argumentacaoLegal.length > 60) {
      toast.error('Argumentação Legal deve ter no máximo 60 caracteres');
      return;
    }

    if (!numeroDias.trim()) {
      toast.error('Número de dias é obrigatório');
      return;
    }

    const dias = parseInt(numeroDias);
    if (isNaN(dias) || dias < 1 || dias > 99) {
      toast.error('Número de dias deve estar entre 1 e 99');
      return;
    }

    const novoTipo: TipoAfastamento = {
      id: tipo?.id || generateUUID(),
      sigla: sigla.toUpperCase().trim(),
      descricao: descricao.trim(),
      argumentacaoLegal: argumentacaoLegal.trim(),
      numeroDias: dias,
      tipoTempo
    };

    onSave(novoTipo);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{tipo ? 'Editar Tipo de Afastamento' : 'Novo Tipo de Afastamento'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sigla">
                Sigla <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                placeholder="Ex: FER"
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 10 caracteres alfanuméricos
              </p>
            </div>

            <div>
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Férias"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 50 caracteres
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="argumentacaoLegal">Argumentação Legal</Label>
            <Input
              id="argumentacaoLegal"
              value={argumentacaoLegal}
              onChange={(e) => setArgumentacaoLegal(e.target.value)}
              placeholder="Ex: CLT Art. 129"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo 60 caracteres (opcional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numeroDias">
                Número de Dias <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numeroDias"
                type="number"
                value={numeroDias}
                onChange={(e) => setNumeroDias(e.target.value)}
                placeholder="Ex: 30"
                min="1"
                max="99"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entre 1 e 99
              </p>
            </div>

            <div>
              <Label>
                Tipo de Tempo <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={tipoTempo} onValueChange={(value) => setTipoTempo(value as TipoTempo)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="dias" />
                  <Label htmlFor="dias" className="font-normal cursor-pointer">
                    Dias
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="M" id="meses" />
                  <Label htmlFor="meses" className="font-normal cursor-pointer">
                    Meses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="anos" />
                  <Label htmlFor="anos" className="font-normal cursor-pointer">
                    Anos
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit">
              <FloppyDisk className="mr-2 h-4 w-4" />
              {tipo ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
