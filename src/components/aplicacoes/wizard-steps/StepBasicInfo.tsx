import { FaseCicloVida, CriticidadeNegocio, TipoAplicacao, CloudProvider } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepBasicInfoProps {
  sigla: string;
  setSigla: (value: string) => void;
  descricao: string;
  setDescricao: (value: string) => void;
  urlDocumentacao: string;
  setUrlDocumentacao: (value: string) => void;
  tipoAplicacao?: TipoAplicacao;
  setTipoAplicacao: (value: TipoAplicacao) => void;
  cloudProvider?: CloudProvider;
  setCloudProvider: (value: CloudProvider) => void;
  faseCicloVida: FaseCicloVida;
  setFaseCicloVida: (value: FaseCicloVida) => void;
  criticidadeNegocio: CriticidadeNegocio;
  setCriticidadeNegocio: (value: CriticidadeNegocio) => void;
}

export function StepBasicInfo({
  sigla,
  setSigla,
  descricao,
  setDescricao,
  urlDocumentacao,
  setUrlDocumentacao,
  tipoAplicacao,
  setTipoAplicacao,
  cloudProvider,
  setCloudProvider,
  faseCicloVida,
  setFaseCicloVida,
  criticidadeNegocio,
  setCriticidadeNegocio,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sigla">Sigla (até 20 caracteres) *</Label>
          <Input
            id="sigla"
            value={sigla}
            onChange={(e) => setSigla(e.target.value.slice(0, 20))}
            placeholder="Ex: CRM"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">
            {sigla.length}/20 caracteres
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição (até 200 caracteres) *</Label>
          <Input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value.slice(0, 200))}
            placeholder="Ex: Sistema de Gestão de Clientes"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {descricao.length}/200 caracteres
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="urlDocumentacao">URL da Documentação *</Label>
        <Input
          id="urlDocumentacao"
          type="url"
          value={urlDocumentacao}
          onChange={(e) => setUrlDocumentacao(e.target.value)}
          placeholder="https://docs.example.com"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tipoAplicacao">Tipo de Aplicação *</Label>
          <Select
            value={tipoAplicacao || ''}
            onValueChange={(value) => setTipoAplicacao(value ? value as TipoAplicacao : undefined)}
          >
            <SelectTrigger id="tipoAplicacao">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BOT">BOT</SelectItem>
              <SelectItem value="COTS">COTS</SelectItem>
              <SelectItem value="INTERNO">INTERNO</SelectItem>
              <SelectItem value="MOTS">MOTS</SelectItem>
              <SelectItem value="OSS">OSS</SelectItem>
              <SelectItem value="OTS">OTS</SelectItem>
              <SelectItem value="PAAS">PAAS</SelectItem>
              <SelectItem value="SAAS">SAAS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cloudProvider">Cloud Provider</Label>
          <Select
            value={cloudProvider || ''}
            onValueChange={(value) => setCloudProvider(value ? value as CloudProvider : undefined)}
          >
            <SelectTrigger id="cloudProvider">
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AWS">AWS</SelectItem>
              <SelectItem value="Microsoft Azure">Microsoft Azure</SelectItem>
              <SelectItem value="Google Cloud">Google Cloud</SelectItem>
              <SelectItem value="Alibaba Cloud">Alibaba Cloud</SelectItem>
              <SelectItem value="Oracle">Oracle</SelectItem>
              <SelectItem value="Salesforce">Salesforce</SelectItem>
              <SelectItem value="IBM Cloud">IBM Cloud</SelectItem>
              <SelectItem value="Tencent Cloud">Tencent Cloud</SelectItem>
              <SelectItem value="PIIDA">PIIDA</SelectItem>
              <SelectItem value="ON-PREMISE">ON-PREMISE</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="faseCicloVida">Fase do Ciclo de Vida *</Label>
          <Select
            value={faseCicloVida}
            onValueChange={(value) => setFaseCicloVida(value as FaseCicloVida)}
          >
            <SelectTrigger id="faseCicloVida">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ideação">Ideação</SelectItem>
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
              <SelectItem value="Produção">Produção</SelectItem>
              <SelectItem value="Aposentado">Aposentado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="criticidadeNegocio">Criticidade do Negócio *</Label>
          <Select
            value={criticidadeNegocio}
            onValueChange={(value) => setCriticidadeNegocio(value as CriticidadeNegocio)}
          >
            <SelectTrigger id="criticidadeNegocio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Muito Baixa">Muito Baixa</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Muito Alta">Muito Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
