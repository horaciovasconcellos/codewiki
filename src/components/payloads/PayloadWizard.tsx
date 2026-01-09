import { useState, useEffect, useCallback } from 'react';
import { Payload, FormatoArquivoPayload, Aplicacao } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PayloadWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Payload) => void;
  payload?: Payload;
}

export function PayloadWizard({ open, onClose, onSave, payload }: PayloadWizardProps) {
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [formData, setFormData] = useState<Partial<Payload>>({
    aplicacaoId: '',
    sigla: '',
    definicao: '',
    descricao: '',
    formatoArquivo: 'JSON',
    conteudoArquivo: '',
    versaoOpenapi: '3.0.0',
    arquivoValido: false,
    errosValidacao: '',
    dataTermino: '',
  });
  const [validacaoInfo, setValidacaoInfo] = useState<{
    valido: boolean;
    mensagem: string;
  } | null>(null);

  // Carregar aplicações quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadAplicacoes();
    }
  }, [open]);

  const validarArquivo = useCallback((conteudo: string, formato: FormatoArquivoPayload) => {
    try {
      if (formato === 'JSON') {
        const parsed = JSON.parse(conteudo);
        
        // Validação básica de estrutura OpenAPI
        if (!parsed.openapi && !parsed.swagger) {
          setValidacaoInfo({
            valido: false,
            mensagem: 'Arquivo JSON não contém propriedade "openapi" ou "swagger"'
          });
          setFormData(prev => ({
            ...prev,
            arquivoValido: false,
            errosValidacao: 'Arquivo JSON não contém propriedade "openapi" ou "swagger"'
          }));
          return;
        }

        if (!parsed.info) {
          setValidacaoInfo({
            valido: false,
            mensagem: 'Arquivo OpenAPI deve conter seção "info"'
          });
          setFormData(prev => ({
            ...prev,
            arquivoValido: false,
            errosValidacao: 'Arquivo OpenAPI deve conter seção "info"'
          }));
          return;
        }

        if (!parsed.paths && !parsed.components) {
          setValidacaoInfo({
            valido: false,
            mensagem: 'Arquivo OpenAPI deve conter "paths" ou "components"'
          });
          setFormData(prev => ({
            ...prev,
            arquivoValido: false,
            errosValidacao: 'Arquivo OpenAPI deve conter "paths" ou "components"'
          }));
          return;
        }

        setValidacaoInfo({
          valido: true,
          mensagem: 'Arquivo JSON válido e estrutura OpenAPI básica presente'
        });
        setFormData(prev => ({
          ...prev,
          arquivoValido: true,
          errosValidacao: '',
          versaoOpenapi: parsed.openapi || parsed.swagger || '3.0.0'
        }));
      } else {
        // Validação básica para YAML
        if (!conteudo.includes('openapi:') && !conteudo.includes('swagger:')) {
          setValidacaoInfo({
            valido: false,
            mensagem: 'Arquivo YAML não contém propriedade "openapi" ou "swagger"'
          });
          setFormData(prev => ({
            ...prev,
            arquivoValido: false,
            errosValidacao: 'Arquivo YAML não contém propriedade "openapi" ou "swagger"'
          }));
          return;
        }

        if (!conteudo.includes('info:')) {
          setValidacaoInfo({
            valido: false,
            mensagem: 'Arquivo OpenAPI deve conter seção "info"'
          });
          setFormData(prev => ({
            ...prev,
            arquivoValido: false,
            errosValidacao: 'Arquivo OpenAPI deve conter seção "info"'
          }));
          return;
        }

        setValidacaoInfo({
          valido: true,
          mensagem: 'Arquivo YAML com estrutura OpenAPI básica presente'
        });
        setFormData(prev => ({
          ...prev,
          arquivoValido: true,
          errosValidacao: ''
        }));
      }
    } catch (error) {
      const errorMessage = formato === 'JSON' 
        ? 'JSON inválido: ' + (error as Error).message
        : 'YAML inválido ou mal formatado';
      
      setValidacaoInfo({
        valido: false,
        mensagem: errorMessage
      });
      setFormData(prev => ({
        ...prev,
        arquivoValido: false,
        errosValidacao: errorMessage
      }));
    }
  }, []);

  // Atualizar formulário quando payload mudar
  useEffect(() => {
    if (payload) {
      setFormData({
        ...payload,
        dataTermino: payload.dataTermino || '',
      });
      // Validar arquivo existente
      if (payload.conteudoArquivo) {
        validarArquivo(payload.conteudoArquivo, payload.formatoArquivo);
      }
    } else {
      resetForm();
    }
  }, [payload, validarArquivo]);

  const loadAplicacoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/aplicacoes`);
      if (response.ok) {
        const data = await response.json();
        setAplicacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
      toast.error('Erro ao carregar aplicações');
    }
  };

  const resetForm = () => {
    setFormData({
      aplicacaoId: '',
      sigla: '',
      definicao: '',
      descricao: '',
      formatoArquivo: 'JSON',
      conteudoArquivo: '',
      versaoOpenapi: '3.0.0',
      arquivoValido: false,
      errosValidacao: '',
      dataTermino: '',
    });
    setValidacaoInfo(null);
  };

  const handleInputChange = (field: keyof Payload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Validar automaticamente quando o conteúdo do arquivo mudar
    if (field === 'conteudoArquivo' && value && formData.formatoArquivo) {
      validarArquivo(value, formData.formatoArquivo);
    }
    
    // Revalidar se o formato mudar
    if (field === 'formatoArquivo' && formData.conteudoArquivo) {
      validarArquivo(formData.conteudoArquivo, value);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const formato: FormatoArquivoPayload = file.name.endsWith('.yaml') || file.name.endsWith('.yml') 
          ? 'YAML' 
          : 'JSON';
        
        setFormData(prev => ({
          ...prev,
          conteudoArquivo: content,
          formatoArquivo: formato
        }));
        
        validarArquivo(content, formato);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    // Validação básica
    if (!formData.aplicacaoId) {
      toast.error('Selecione uma aplicação');
      return;
    }
    if (!formData.sigla || !formData.definicao || !formData.conteudoArquivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!formData.arquivoValido) {
      toast.error('O arquivo OpenAPI contém erros. Corrija antes de salvar.');
      return;
    }

    const payloadToSave: Payload = {
      id: payload?.id || '',
      aplicacaoId: formData.aplicacaoId!,
      sigla: formData.sigla!,
      definicao: formData.definicao!,
      descricao: formData.descricao || '',
      formatoArquivo: formData.formatoArquivo!,
      conteudoArquivo: formData.conteudoArquivo!,
      versaoOpenapi: formData.versaoOpenapi || '3.0.0',
      arquivoValido: formData.arquivoValido!,
      errosValidacao: formData.errosValidacao || '',
      dataInicio: payload?.dataInicio || new Date().toISOString().split('T')[0],
      dataTermino: formData.dataTermino || undefined,
    };

    onSave(payloadToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payload ? 'Editar Payload OpenAPI' : 'Novo Payload OpenAPI'}
          </DialogTitle>
          <DialogDescription>
            Defina as especificações da API seguindo o formato OpenAPI
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Aplicação */}
          <div className="grid gap-2">
            <Label htmlFor="aplicacao">
              Aplicação <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.aplicacaoId}
              onValueChange={(value) => handleInputChange('aplicacaoId', value)}
            >
              <SelectTrigger id="aplicacao">
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

          {/* Sigla e Definição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sigla">
                Sigla <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sigla"
                value={formData.sigla}
                onChange={(e) => handleInputChange('sigla', e.target.value)}
                placeholder="Ex: API-USERS"
                maxLength={20}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="versaoOpenapi">Versão OpenAPI</Label>
              <Input
                id="versaoOpenapi"
                value={formData.versaoOpenapi}
                onChange={(e) => handleInputChange('versaoOpenapi', e.target.value)}
                placeholder="3.0.0"
              />
            </div>
          </div>

          {/* Descrição Curta */}
          <div className="grid gap-2">
            <Label htmlFor="definicao">
              Descrição Curta <span className="text-red-500">*</span>
            </Label>
            <Input
              id="definicao"
              value={formData.definicao}
              onChange={(e) => handleInputChange('definicao', e.target.value)}
              placeholder="Ex: API de Gerenciamento de Usuários"
              maxLength={100}
            />
          </div>

          {/* Descrição Longa */}
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição Longa</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição detalhada da API..."
              rows={3}
            />
          </div>

          {/* Formato e Upload */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="formato">
                Formato <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.formatoArquivo}
                onValueChange={(value) => handleInputChange('formatoArquivo', value as FormatoArquivoPayload)}
              >
                <SelectTrigger id="formato">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="YAML">YAML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataTermino">Data Término</Label>
              <Input
                id="dataTermino"
                type="date"
                value={formData.dataTermino}
                onChange={(e) => handleInputChange('dataTermino', e.target.value)}
              />
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="grid gap-2">
            <Label htmlFor="arquivo">
              Arquivo OpenAPI <span className="text-red-500">*</span>
            </Label>
            <Input
              id="arquivo"
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500">
              Selecione um arquivo JSON ou YAML com a especificação OpenAPI
            </p>
          </div>

          {/* Conteúdo do Arquivo */}
          <div className="grid gap-2">
            <Label htmlFor="conteudo">
              Conteúdo do Arquivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="conteudo"
              value={formData.conteudoArquivo}
              onChange={(e) => handleInputChange('conteudoArquivo', e.target.value)}
              placeholder={
                formData.formatoArquivo === 'JSON'
                  ? '{\n  "openapi": "3.0.0",\n  "info": {...},\n  "paths": {...}\n}'
                  : 'openapi: 3.0.0\ninfo:\n  ...\npaths:\n  ...'
              }
              rows={10}
              className="font-mono text-sm max-h-[250px] overflow-y-auto resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Conteúdo da especificação OpenAPI em formato {formData.formatoArquivo}
            </p>
          </div>

          {/* Status de Validação */}
          {validacaoInfo && (
            <Card className={`p-4 ${validacaoInfo.valido ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {validacaoInfo.valido ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                ) : (
                  <XCircle className="text-red-600 flex-shrink-0" size={24} />
                )}
                <div>
                  <p className={`font-semibold ${validacaoInfo.valido ? 'text-green-800' : 'text-red-800'}`}>
                    {validacaoInfo.valido ? 'Arquivo Válido' : 'Erro de Validação'}
                  </p>
                  <p className={`text-sm ${validacaoInfo.valido ? 'text-green-700' : 'text-red-700'}`}>
                    {validacaoInfo.mensagem}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.arquivoValido}>
            {payload ? 'Atualizar' : 'Criar'} Payload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
