import { useState, useEffect } from 'react';
import { TipoComunicacao, TipoComunicacaoEnum, TecnologiaComunicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Checkbox } from '@/components/ui/checkbox';
import { generateUUID } from '@/utils/uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TipoComunicacaoFormProps {
  tipoComunicacao?: TipoComunicacao;
  onSave: (tipo: TipoComunicacao) => void;
  onCancel?: () => void;
}

const tipos: TipoComunicacaoEnum[] = ['Sincrono', 'Assincrono', 'Ambos'];

const tecnologiasDisponiveis: TecnologiaComunicacao[] = [
  'HTTP/JSON',
  'HTTP',
  'Protobuf',
  'XML',
  'WS',
  'SNS/SQS',
  'Pub/Sub',
  'EventBridge',
  'SAP Event Mesh',
  'S3/Blob/GCS',
  'SFTP cloud',
  'Mulesoft',
  'SIS',
  'Boomi',
  'HTTP POST',
  'Kafka/Kinesis',
];

export function TipoComunicacaoForm({ tipoComunicacao, onSave, onCancel }: TipoComunicacaoFormProps) {
  const [sigla, setSigla] = useState(tipoComunicacao?.sigla || '');
  const [tipo, setTipo] = useState<TipoComunicacaoEnum>(tipoComunicacao?.tipo || 'Sincrono');
  const [tecnologias, setTecnologias] = useState<TecnologiaComunicacao[]>(tipoComunicacao?.tecnologias || []);
  const [usoTipico, setUsoTipico] = useState(tipoComunicacao?.usoTipico || '');

  const isEditing = !!tipoComunicacao;

  useEffect(() => {
    if (tipoComunicacao) {
      setSigla(tipoComunicacao.sigla);
      setTipo(tipoComunicacao.tipo);
      setTecnologias(tipoComunicacao.tecnologias);
      setUsoTipico(tipoComunicacao.usoTipico);
    }
  }, [tipoComunicacao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sigla.trim()) {
      toast.error('Sigla é obrigatória');
      return;
    }

    if (sigla.length < 2 || sigla.length > 10) {
      toast.error('Sigla deve ter entre 2 e 10 caracteres');
      return;
    }

    if (tecnologias.length === 0) {
      toast.error('Selecione pelo menos uma tecnologia');
      return;
    }

    if (!usoTipico.trim()) {
      toast.error('Uso típico é obrigatório');
      return;
    }

    const novoTipo: TipoComunicacao = {
      id: tipoComunicacao?.id || generateUUID(),
      sigla: sigla.trim().toUpperCase(),
      tipo,
      tecnologias,
      usoTipico: usoTipico.trim(),
    };

    onSave(novoTipo);
  };

  const toggleTecnologia = (tec: TecnologiaComunicacao) => {
    setTecnologias(prev => 
      prev.includes(tec) 
        ? prev.filter(t => t !== tec)
        : [...prev, tec]
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isEditing ? 'Editar Tipo de Comunicação' : 'Novo Tipo de Comunicação'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Preencha os dados do tipo de comunicação entre sistemas
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X size={24} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informações do Tipo de Comunicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="sigla" className="text-base font-medium">Sigla *</Label>
                    <Input
                      id="sigla"
                      value={sigla}
                      onChange={(e) => setSigla(e.target.value.toUpperCase())}
                      placeholder="Ex: REST"
                      required
                      maxLength={10}
                      className="h-11 text-base font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                      2 a 10 caracteres
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tipo" className="text-base font-medium">Tipo *</Label>
                    <Select value={tipo} onValueChange={(value) => setTipo(value as TipoComunicacaoEnum)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tipos.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Tecnologias * (selecione uma ou mais)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-background">
                    {tecnologiasDisponiveis.map((tec) => (
                      <div key={tec} className="flex items-center space-x-2">
                        <Checkbox
                          id={tec}
                          checked={tecnologias.includes(tec)}
                          onCheckedChange={() => toggleTecnologia(tec)}
                        />
                        <label
                          htmlFor={tec}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {tec}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tecnologias.length} tecnologia(s) selecionada(s)
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="usoTipico" className="text-base font-medium">Uso Típico *</Label>
                  <Textarea
                    id="usoTipico"
                    value={usoTipico}
                    onChange={(e) => setUsoTipico(e.target.value)}
                    placeholder="Descreva os casos de uso típicos desta comunicação..."
                    required
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Exemplos: APIs REST para integrações síncronas, filas para processamento assíncrono, etc.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <FloppyDisk className="mr-2" size={20} />
                    {isEditing ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
