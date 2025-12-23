import { useState, useEffect } from 'react';
import { Integracao, EstiloIntegracao, PadraoCasoUso, IntegracaoTecnologica, TipoIntegracao, TipoDispositivo, TipoAutenticacao, Periodicidade, FrequenciaUso, Aplicacao, Comunicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from '@phosphor-icons/react';

interface IntegracaoFormProps {
  integracao?: Integracao;
  aplicacoes: Aplicacao[];
  comunicacoes: Comunicacao[];
  onSave: (integracao: Integracao) => void;
  onCancel: () => void;
}

const estilosIntegracao: EstiloIntegracao[] = [
  'Integração de processos',
  'Integração de dados',
  'Integração de análises',
  'Integração do usuário',
  'Integração de dispositivos',
];

const padroesCasoUso: PadraoCasoUso[] = [
  'A2A – Application-to-Application',
  'A2B – Application-to-Business',
  'B2B – Business-to-Business',
  'B2C – Business-to-Consumer',
  'C2B – Consumer-to-Business',
  'C2C – Consumer-to-Consumer',
  'T2T – Thing-to-Thing (IoT)',
  'T2C – Thing-to-Cloud',
  'T2A – Thing-to-Application',
  'Virtualização de dados',
  'Orquestração de dados',
  'extração, transformação e carregamento (ETL)',
  'Análises incorporadas',
  'Análise entre aplicações',
  'integração de interface do usuário',
  'Integração móvel',
  'Integração de chatbot',
  'Thing to analytics',
  'Thing to process',
  'Thing to data lake',
];

const integracoesTecnologicas: IntegracaoTecnologica[] = [
  'APIs (Application Programming Interfaces)',
  'Message Brokers',
  'ESB / iPaaS',
  'Tecnologias de EDI',
  'Integração por Arquivos',
  'Integração via Banco de Dados',
  'ETL/ELT e Data Integration',
  'Integração por Microservices',
  'IoT (Thing Integration)',
  'API Gateway / Gestão de APIs',
];

const tiposIntegracao: TipoIntegracao[] = [
  'User-to-Cloud',
  'User-to-OnPremise',
  'Cloud-to-Cloud',
  'OnPremise-to-Cloud',
  'OnPremise-to-OnPremise',
];

const tiposDispositivo: TipoDispositivo[] = [
  'Web',
  'Mobile',
  'Desktop',
  'Máquinas Industriais',
  'Equipamentos',
  'IoT',
  'Outros',
];

const tiposAutenticacao: TipoAutenticacao[] = [
  'API Key',
  'OAuth 2.0',
  'OIDC',
  'SAML 2.0',
  'LDAP',
  'Kerberos',
  'Basic Authentication',
  'mTLS',
  'JWT',
  'Session-Based Authentication',
  'MFA',
  'Passkeys',
];

const periodicidades: Periodicidade[] = [
  'Real-Time',
  'Near Real-Time',
  'Batch',
  'Event-Driven',
  'On-Demand',
];

const frequencias: FrequenciaUso[] = [
  'sob demanda',
  'evento',
  'batch',
];

export function IntegracaoForm({ integracao, aplicacoes, comunicacoes, onSave, onCancel }: IntegracaoFormProps) {
  const [formData, setFormData] = useState({
    sigla: '',
    nome: '',
    estiloIntegracao: '' as EstiloIntegracao | '',
    padraoCasoUso: '' as PadraoCasoUso | '',
    integracaoTecnologica: '' as IntegracaoTecnologica | '',
    tipoIntegracao: '' as TipoIntegracao | '',
    tipoDispositivo: '' as TipoDispositivo | '',
    nomeDispositivo: '',
    aplicacaoOrigemId: '',
    aplicacaoDestinoId: '',
    comunicacaoId: '',
    tipoAutenticacao: '' as TipoAutenticacao | '',
    periodicidade: '' as Periodicidade | '',
    frequenciaUso: '' as FrequenciaUso | '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (integracao) {
      console.log('🔍 Carregando integração para edição:', {
        id: integracao.id,
        sigla: integracao.sigla,
        frequenciaUso: integracao.frequenciaUso,
        periodicidade: integracao.periodicidade
      });
      
      setFormData({
        sigla: integracao.sigla,
        nome: integracao.nome,
        estiloIntegracao: integracao.estiloIntegracao || '',
        padraoCasoUso: integracao.padraoCasoUso || '',
        integracaoTecnologica: integracao.integracaoTecnologica || '',
        tipoIntegracao: integracao.tipoIntegracao || '',
        tipoDispositivo: integracao.tipoDispositivo || '',
        nomeDispositivo: integracao.nomeDispositivo || '',
        aplicacaoOrigemId: integracao.aplicacaoOrigemId || '',
        aplicacaoDestinoId: integracao.aplicacaoDestinoId || '',
        comunicacaoId: integracao.comunicacaoId || '',
        tipoAutenticacao: integracao.tipoAutenticacao || '',
        periodicidade: integracao.periodicidade || '',
        frequenciaUso: integracao.frequenciaUso || '',
      });
    }
  }, [integracao]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileType = selectedFile.type;
      
      if (fileType === 'application/pdf' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'application/msword') {
        setFile(selectedFile);
      } else {
        alert('Por favor, selecione apenas arquivos PDF ou DOCX');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sigla.length > 30) {
      alert('Sigla deve ter no máximo 30 caracteres');
      return;
    }
    
    if (formData.nome.length > 80) {
      alert('Nome deve ter no máximo 80 caracteres');
      return;
    }

    if (formData.nomeDispositivo && formData.nomeDispositivo.length > 80) {
      alert('Nome do Dispositivo deve ter no máximo 80 caracteres');
      return;
    }

    const integracaoData: any = {
      ...formData,
      id: integracao?.id,
    };

    console.log('[IntegracaoForm] formData antes de enviar:', {
      comunicacaoId: formData.comunicacaoId,
      tipoAutenticacao: formData.tipoAutenticacao,
      periodicidade: formData.periodicidade,
      frequenciaUso: formData.frequenciaUso
    });

    if (file) {
      integracaoData.especificacaoFile = file;
    }

    onSave(integracaoData);
  };

  // Verifica quais campos devem ser exibidos baseado no tipo de integração
  const showDispositivoFields = formData.tipoIntegracao === 'User-to-Cloud' || formData.tipoIntegracao === 'User-to-OnPremise';
  const showAplicacaoOrigem = formData.tipoIntegracao && formData.tipoIntegracao !== 'User-to-Cloud' && formData.tipoIntegracao !== 'User-to-OnPremise';
  const showAplicacaoDestino = formData.tipoIntegracao && formData.tipoIntegracao !== 'User-to-Cloud';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {/* Linha 1: Sigla e Nome */}
        <div className="grid gap-6 grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="sigla">
              Sigla <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">(máx. 30 caracteres)</span>
            </Label>
            <Input
              id="sigla"
              value={formData.sigla}
              onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
              maxLength={30}
              required
              placeholder="Ex: INT-001"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nome">
              Nome <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">(máx. 80 caracteres)</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              maxLength={80}
              required
              placeholder="Ex: Integração SAP-Salesforce"
            />
          </div>
        </div>

        {/* Linha 2: Tipo de Integração */}
        <div className="grid gap-2">
          <Label htmlFor="tipoIntegracao">
            Tipo de Integração <span className="text-red-500">*</span>
          </Label>
          <Select
            key={`tipoIntegracao-${integracao?.id || 'new'}`}
            value={formData.tipoIntegracao}
            onValueChange={(value) => setFormData({ ...formData, tipoIntegracao: value as TipoIntegracao })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de integração" />
            </SelectTrigger>
            <SelectContent>
              {tiposIntegracao.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Linha 3: Estilo, Padrão e Tecnologia */}
        <div className="grid gap-6 grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="estiloIntegracao">
              Estilo de Integração
            </Label>
            <Select
              key={`estiloIntegracao-${integracao?.id || 'new'}`}
              value={formData.estiloIntegracao}
              onValueChange={(value) => setFormData({ ...formData, estiloIntegracao: value as EstiloIntegracao })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {estilosIntegracao.map((estilo) => (
                  <SelectItem key={estilo} value={estilo}>
                    {estilo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="padraoCasoUso">
              Padrão de Caso de Uso
            </Label>
            <Select
              key={`padraoCasoUso-${integracao?.id || 'new'}`}
              value={formData.padraoCasoUso}
              onValueChange={(value) => setFormData({ ...formData, padraoCasoUso: value as PadraoCasoUso })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o padrão" />
              </SelectTrigger>
              <SelectContent>
                {padroesCasoUso.map((padrao) => (
                  <SelectItem key={padrao} value={padrao}>
                    {padrao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="integracaoTecnologica">
              Integração Tecnológica
            </Label>
            <Select
              key={`integracaoTecnologica-${integracao?.id || 'new'}`}
              value={formData.integracaoTecnologica}
              onValueChange={(value) => setFormData({ ...formData, integracaoTecnologica: value as IntegracaoTecnologica })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a tecnologia" />
              </SelectTrigger>
              <SelectContent>
                {integracoesTecnologicas.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha 4: Campos de Dispositivo (User-to-Cloud e User-to-OnPremise) */}
        {showDispositivoFields && (
          <div className="grid gap-6 grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tipoDispositivo">
                Tipo de Dispositivo <span className="text-red-500">*</span>
              </Label>
              <Select
                key={`tipoDispositivo-${integracao?.id || 'new'}`}
                value={formData.tipoDispositivo}
                onValueChange={(value) => setFormData({ ...formData, tipoDispositivo: value as TipoDispositivo })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDispositivo.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nomeDispositivo">
                Nome do Dispositivo <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">(máx. 80 caracteres)</span>
              </Label>
              <Input
                id="nomeDispositivo"
                value={formData.nomeDispositivo}
                onChange={(e) => setFormData({ ...formData, nomeDispositivo: e.target.value })}
                maxLength={80}
                required
                placeholder="Ex: iPhone 13 Pro"
              />
            </div>
          </div>
        )}

        {/* Linha 5: Aplicações de Origem e Destino */}
        {(showAplicacaoOrigem || showAplicacaoDestino) && (
          <div className="grid gap-6 grid-cols-2">
            {showAplicacaoOrigem && (
              <div className="grid gap-2">
                <Label htmlFor="aplicacaoOrigemId">
                  Aplicação de Origem <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`aplicacaoOrigemId-${integracao?.id || 'new'}`}
                  value={formData.aplicacaoOrigemId}
                  onValueChange={(value) => setFormData({ ...formData, aplicacaoOrigemId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aplicação" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla} - {app.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showAplicacaoDestino && (
              <div className="grid gap-2">
                <Label htmlFor="aplicacaoDestinoId">
                  Aplicação de Destino <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`aplicacaoDestinoId-${integracao?.id || 'new'}`}
                  value={formData.aplicacaoDestinoId}
                  onValueChange={(value) => setFormData({ ...formData, aplicacaoDestinoId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aplicação" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla} - {app.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Linha 6: Comunicação, Autenticação, Periodicidade, Frequência */}
        <div className="grid gap-6 grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="comunicacaoId">
              Comunicação <span className="text-red-500">*</span>
            </Label>
            <Select
              key={`comunicacaoId-${integracao?.id || 'new'}`}
              value={formData.comunicacaoId}
              onValueChange={(value) => setFormData({ ...formData, comunicacaoId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {comunicacoes.map((com) => (
                  <SelectItem key={com.id} value={com.id}>
                    {com.sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tipoAutenticacao">
              Tipo de Autenticação <span className="text-red-500">*</span>
            </Label>
            <Select
              key={`tipoAutenticacao-${integracao?.id || 'new'}`}
              value={formData.tipoAutenticacao}
              onValueChange={(value) => setFormData({ ...formData, tipoAutenticacao: value as TipoAutenticacao })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {tiposAutenticacao.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="periodicidade">
              Periodicidade <span className="text-red-500">*</span>
            </Label>
            <Select
              key={`periodicidade-${integracao?.id || 'new'}`}
              value={formData.periodicidade}
              onValueChange={(value) => {
                console.log('📝 Mudando periodicidade:', value);
                setFormData({ ...formData, periodicidade: value as Periodicidade });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione">
                  {formData.periodicidade ? formData.periodicidade : 'Selecione'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periodicidades.map((per) => (
                  <SelectItem key={per} value={per}>
                    {per}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frequenciaUso">
              Frequência de Uso <span className="text-red-500">*</span>
            </Label>
            <Select
              key={`frequenciaUso-${integracao?.id || 'new'}`}
              value={formData.frequenciaUso}
              onValueChange={(value) => {
                console.log('📝 Mudando frequenciaUso:', value);
                setFormData({ ...formData, frequenciaUso: value as FrequenciaUso });
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione">
                  {formData.frequenciaUso ? formData.frequenciaUso : 'Selecione'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {frequencias.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha 7: Especificação */}
        <div className="grid gap-2">
          <Label htmlFor="especificacao">
            Especificação (PDF ou DOCX)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="especificacao"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
          {integracao?.especificacaoFilename && !file && (
            <p className="text-sm text-muted-foreground">
              Arquivo atual: {integracao.especificacaoFilename}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {integracao ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
