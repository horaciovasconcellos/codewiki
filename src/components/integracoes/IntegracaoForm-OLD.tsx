import { useState, useEffect } from 'react';
import { Integracao, EstiloIntegracao, PadraoCasoUso, IntegracaoTecnologica } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from '@phosphor-icons/react';

interface IntegracaoFormProps {
  integracao?: Integracao;
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

export function IntegracaoForm({ integracao, onSave, onCancel }: IntegracaoFormProps) {
  const [formData, setFormData] = useState({
    sigla: '',
    nome: '',
    estiloIntegracao: '' as EstiloIntegracao | '',
    padraoCasoUso: '' as PadraoCasoUso | '',
    integracaoTecnologica: '' as IntegracaoTecnologica | '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    console.log('[IntegracaoForm] useEffect disparado - integracao:', integracao);
    if (integracao) {
      console.log('[IntegracaoForm] Atualizando formData com:', {
        integracaoTecnologica: integracao.integracaoTecnologica
      });
      setFormData({
        sigla: integracao.sigla,
        nome: integracao.nome,
        estiloIntegracao: integracao.estiloIntegracao || '',
        padraoCasoUso: integracao.padraoCasoUso || '',
        integracaoTecnologica: integracao.integracaoTecnologica || '',
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
    
    console.log('[IntegracaoForm] handleSubmit - formData:', formData);
    
    if (formData.sigla.length > 30) {
      alert('Sigla deve ter no máximo 30 caracteres');
      return;
    }
    
    if (formData.nome.length > 80) {
      alert('Nome deve ter no máximo 80 caracteres');
      return;
    }

    const integracaoData: any = {
      ...formData,
      id: integracao?.id,
    };

    if (file) {
      integracaoData.especificacaoFile = file;
    }

    console.log('[IntegracaoForm] Enviando integracaoData:', integracaoData);
    onSave(integracaoData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
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

        <div className="grid gap-6 grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="estiloIntegracao">
              Estilo de Integração
            </Label>
            <Select
              key={formData.estiloIntegracao || 'empty'}
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
              key={formData.padraoCasoUso || 'empty'}
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
              key={formData.integracaoTecnologica || 'empty'}
              value={formData.integracaoTecnologica}
              onValueChange={(value) => {
                console.log('[IntegracaoForm] integracaoTecnologica mudou para:', value);
                setFormData({ ...formData, integracaoTecnologica: value as IntegracaoTecnologica });
              }}
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
