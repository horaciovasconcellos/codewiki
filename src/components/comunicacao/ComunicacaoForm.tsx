import { useState, useEffect } from 'react';
import { Comunicacao, TipoComunicacao, TecnologiaComunicacao } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FloppyDisk, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';

interface ComunicacaoFormProps {
  comunicacao?: Comunicacao;
  onSave: (comunicacao: Comunicacao) => void;
  onCancel: () => void;
}

const TECNOLOGIAS_DISPONIVEIS: TecnologiaComunicacao[] = [
  'ActiveMQ',
  'ANSI X12',
  'Apigee',
  'Boomi',
  'Camunda',
  'CSV',
  'Debezium',
  'EDI',
  'EDIFACT',
  'Event Mesh',
  'EventBridge',
  'FTP',
  'GoldenGate',
  'HTTP',
  'HTTP/2',
  'HTTP/JSON',
  'HTTP POST',
  'Kafka/Kinesis',
  'Kong',
  'MQTT Broker',
  'Mulesoft',
  'OpenAPI',
  'Oracle DB Link',
  'Oracle ESB',
  'Oracle Replication',
  'Protobuf',
  'Pub/Sub',
  'Pulsar',
  'RabbitMQ',
  'RTP',
  'S3/Blob/GCS',
  'SAP API Mgmt',
  'SAP BPA',
  'SAP Event Mesh',
  'SFTP cloud',
  'SIS',
  'SNS/SQS',
  'SQL Views',
  'SQS',
  'TXT',
  'WebRTC',
  'WS',
  'WSDL',
  'WSO2',
  'XML'
];

const TIPOS: TipoComunicacao[] = ['Sincrono', 'Assincrono', 'Ambos'];

export function ComunicacaoForm({ comunicacao, onSave, onCancel }: ComunicacaoFormProps) {
  const [sigla, setSigla] = useState('');
  const [tecnologias, setTecnologias] = useState<TecnologiaComunicacao[]>([]);
  const [tipo, setTipo] = useState<TipoComunicacao>('Sincrono');
  const [usoTipico, setUsoTipico] = useState('');

  useEffect(() => {
    if (comunicacao) {
      setSigla(comunicacao.sigla);
      setTecnologias(comunicacao.tecnologias);
      setTipo(comunicacao.tipo);
      setUsoTipico(comunicacao.usoTipico);
    }
  }, [comunicacao]);

  const handleToggleTecnologia = (tecnologia: TecnologiaComunicacao) => {
    setTecnologias(prev =>
      prev.includes(tecnologia)
        ? prev.filter(t => t !== tecnologia)
        : [...prev, tecnologia]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sigla.trim()) {
      toast.error('Sigla é obrigatória');
      return;
    }

    if (tecnologias.length === 0) {
      toast.error('Selecione pelo menos uma tecnologia');
      return;
    }

    if (!tipo) {
      toast.error('Tipo é obrigatório');
      return;
    }

    if (!usoTipico.trim()) {
      toast.error('Uso Típico é obrigatório');
      return;
    }

    if (usoTipico.length > 120) {
      toast.error('Uso Típico deve ter no máximo 120 caracteres');
      return;
    }

    const novaComunicacao: Comunicacao = {
      id: comunicacao?.id || generateUUID(),
      sigla: sigla.trim(),
      tecnologias,
      tipo,
      usoTipico: usoTipico.trim()
    };

    onSave(novaComunicacao);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {comunicacao ? 'Editar Comunicação' : 'Nova Comunicação'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sigla">Sigla *</Label>
              <Input
                id="sigla"
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                placeholder="Ex: REST-API"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(value) => setTipo(value as TipoComunicacao)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tecnologias * (selecione pelo menos uma)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-md">
              {TECNOLOGIAS_DISPONIVEIS.map((tec) => (
                <div key={tec} className="flex items-center space-x-2">
                  <Checkbox
                    id={tec}
                    checked={tecnologias.includes(tec)}
                    onCheckedChange={() => handleToggleTecnologia(tec)}
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
            <p className="text-xs text-muted-foreground">
              {tecnologias.length} tecnologia(s) selecionada(s)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usoTipico">Uso Típico * (máx. 120 caracteres)</Label>
            <Textarea
              id="usoTipico"
              value={usoTipico}
              onChange={(e) => setUsoTipico(e.target.value)}
              placeholder="Descreva o uso típico deste tipo de comunicação..."
              maxLength={120}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {usoTipico.length}/120 caracteres
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2" size={16} />
              Cancelar
            </Button>
            <Button type="submit">
              <FloppyDisk className="mr-2" size={16} />
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
