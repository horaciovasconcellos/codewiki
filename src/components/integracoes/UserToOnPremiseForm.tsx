import { useState, useEffect } from 'react';
import { UserToOnPremise, Integracao, Comunicacao, TipoDispositivo, TipoAutenticacao, Periodicidade, FrequenciaUso } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserToOnPremiseFormProps {
  data?: UserToOnPremise;
  integracaoAtual?: Integracao;
  integracoes?: Integracao[];
  comunicacoes: Comunicacao[];
  onSave: (data: UserToOnPremise) => void;
  onCancel: () => void;
}

const tiposDispositivo: TipoDispositivo[] = ['Web', 'Mobile', 'Desktop', 'Máquinas Industriais', 'Equipamentos', 'IoT', 'Outros'];
const tiposAutenticacao: TipoAutenticacao[] = ['API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys'];
const periodicidades: Periodicidade[] = ['Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand'];
const frequencias: FrequenciaUso[] = ['sob demanda', 'evento', 'batch'];

export function UserToOnPremiseForm({ data, integracaoAtual, integracoes, comunicacoes, onSave, onCancel }: UserToOnPremiseFormProps) {
  const [formData, setFormData] = useState({
    integracaoId: integracaoAtual?.id || '',
    tipoDispositivo: '' as TipoDispositivo,
    nomeDispositivo: '',
    comunicacaoId: '',
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
        tipoDispositivo: data.tipoDispositivo,
        nomeDispositivo: data.nomeDispositivo,
        comunicacaoId: data.comunicacaoId,
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
    } as UserToOnPremise);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Integração é preenchida automaticamente pelo wizard */}
      <input type="hidden" name="integracaoId" value={formData.integracaoId} />
      
      {/* Linha 1: Tipo de Dispositivo e Nome do Dispositivo */}
      <div className="grid gap-6 grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="tipoDispositivo">Tipo de Dispositivo <span className="text-red-500">*</span></Label>
          <Select value={formData.tipoDispositivo} onValueChange={(v) => setFormData({ ...formData, tipoDispositivo: v as TipoDispositivo })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {tiposDispositivo.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nomeDispositivo">Nome do Dispositivo <span className="text-red-500">*</span></Label>
          <Input
            id="nomeDispositivo"
            value={formData.nomeDispositivo}
            onChange={(e) => setFormData({ ...formData, nomeDispositivo: e.target.value })}
            required
            placeholder="Ex: iPhone 13 Pro"
          />
        </div>
      </div>

      {/* Linha 2: Comunicação, Tipo de Autenticação, Periodicidade e Frequência de Uso */}
      <div className="grid gap-6 grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="comunicacaoId">Comunicação <span className="text-red-500">*</span></Label>
          <Select value={formData.comunicacaoId} onValueChange={(v) => setFormData({ ...formData, comunicacaoId: v })} required>
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
