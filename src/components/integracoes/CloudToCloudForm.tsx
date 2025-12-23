import { useState, useEffect } from 'react';
import { CloudToCloud, Integracao, Comunicacao, Aplicacao, TipoAutenticacao, Periodicidade, FrequenciaUso } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CloudToCloudFormProps {
  data?: CloudToCloud;
  integracaoAtual?: Integracao;
  integracoes?: Integracao[];
  aplicacoes: Aplicacao[];
  comunicacoes: Comunicacao[];
  onSave: (data: CloudToCloud) => void;
  onCancel: () => void;
}

const tiposAutenticacao: TipoAutenticacao[] = ['API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys'];
const periodicidades: Periodicidade[] = ['Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand'];
const frequencias: FrequenciaUso[] = ['sob demanda', 'evento', 'batch'];

export function CloudToCloudForm({ data, integracaoAtual, integracoes, aplicacoes, comunicacoes, onSave, onCancel }: CloudToCloudFormProps) {
  const [formData, setFormData] = useState({
    integracaoId: '',
    aplicacaoOrigemId: '',
    aplicacaoDestinoId: '',
    tipoIntegracaoId: '',
    tipoAutenticacao: '' as TipoAutenticacao,
    periodicidade: '' as Periodicidade,
    frequenciaUso: '' as FrequenciaUso,
  });

  // Se há integração atual, usar ela; caso contrário, usar a lista de integrações ou lista vazia
  const integracoesDisponiveis = integracaoAtual ? [integracaoAtual] : (integracoes || []);

  useEffect(() => {
    if (data) {
      setFormData({
        integracaoId: data.integracaoId,
        aplicacaoOrigemId: data.aplicacaoOrigemId,
        aplicacaoDestinoId: data.aplicacaoDestinoId,
        tipoIntegracaoId: data.tipoIntegracaoId,
        tipoAutenticacao: data.tipoAutenticacao,
        periodicidade: data.periodicidade,
        frequenciaUso: data.frequenciaUso,
      });
    } else if (integracaoAtual) {
      setFormData(prev => ({ ...prev, integracaoId: integracaoAtual.id }));
    }
  }, [data, integracaoAtual]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: data?.id || '',
    } as CloudToCloud);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Integração é preenchida automaticamente pelo wizard */}
      <input type="hidden" name="integracaoId" value={formData.integracaoId} />
      
      {/* Linha 1: Aplicação de Origem e Aplicação de Destino */}
      <div className="grid gap-6 grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="aplicacaoOrigemId">Aplicação de Origem <span className="text-red-500">*</span></Label>
          <Select value={formData.aplicacaoOrigemId} onValueChange={(v) => setFormData({ ...formData, aplicacaoOrigemId: v })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {aplicacoes.map((app) => (
                <SelectItem key={app.id} value={app.id}>{app.sigla} - {app.descricao}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="aplicacaoDestinoId">Aplicação de Destino <span className="text-red-500">*</span></Label>
          <Select value={formData.aplicacaoDestinoId} onValueChange={(v) => setFormData({ ...formData, aplicacaoDestinoId: v })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {aplicacoes.map((app) => (
                <SelectItem key={app.id} value={app.id}>{app.sigla} - {app.descricao}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: Tipo de Integração, Tipo de Autenticação, Periodicidade e Frequência de Uso */}
      <div className="grid gap-6 grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="tipoIntegracaoId">Tipo de Integração <span className="text-red-500">*</span></Label>
          <Select value={formData.tipoIntegracaoId} onValueChange={(v) => setFormData({ ...formData, tipoIntegracaoId: v })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {comunicacoes.map((com) => (
                <SelectItem key={com.id} value={com.id}>{com.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tipoAutenticacao">Tipo de Autenticação <span className="text-red-500">*</span></Label>
          <Select value={formData.tipoAutenticacao} onValueChange={(v) => setFormData({ ...formData, tipoAutenticacao: v as TipoAutenticacao })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {tiposAutenticacao.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="periodicidade">Periodicidade <span className="text-red-500">*</span></Label>
          <Select value={formData.periodicidade} onValueChange={(v) => setFormData({ ...formData, periodicidade: v as Periodicidade })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {periodicidades.map((per) => (
                <SelectItem key={per} value={per}>{per}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="frequenciaUso">Frequência de Uso <span className="text-red-500">*</span></Label>
          <Select value={formData.frequenciaUso} onValueChange={(v) => setFormData({ ...formData, frequenciaUso: v as FrequenciaUso })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {frequencias.map((freq) => (
                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {data ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
