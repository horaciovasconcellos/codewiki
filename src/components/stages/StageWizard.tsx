import { useState, useEffect, useRef } from 'react';
import { Stage, TipoStage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, FloppyDisk, FileArrowUp, CheckCircle, Warning } from '@phosphor-icons/react';
import yaml from 'js-yaml';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface StageWizardProps {
  stage?: Stage;
  onSave: () => void;
  onCancel: () => void;
}

const TIPOS_STAGE: TipoStage[] = ['Build', 'Test', 'Security', 'Deploy', 'Quality', 'Notification', 'Custom'];

export function StageWizard({ stage, onSave, onCancel }: StageWizardProps) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'Build' as TipoStage,
    reutilizavel: true,
    timeoutSeconds: 3600,
  });

  const [saving, setSaving] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [yamlValid, setYamlValid] = useState<boolean | null>(null);
  const [yamlError, setYamlError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage) {
      console.log('🔍 Carregando stage:', stage);
      setFormData({
        nome: stage.nome,
        descricao: stage.descricao || '',
        tipo: stage.tipo,
        reutilizavel: stage.reutilizavel,
        timeoutSeconds: stage.timeoutSeconds,
      });
      
      // Carregar YAML salvo se existir
      if (stage.yamlContent) {
        console.log('🔍 YAML encontrado:', stage.yamlContent.substring(0, 100));
        setYamlContent(stage.yamlContent);
        validateYaml(stage.yamlContent);
      } else {
        console.log('⚠️ Stage não possui YAML salvo');
      }
    }
  }, [stage]);

  const validateYaml = (content: string) => {
    try {
      const parsed = yaml.load(content);
      
      if (!parsed || typeof parsed !== 'object') {
        setYamlError('YAML inválido: deve conter um objeto');
        setYamlValid(false);
        return null;
      }

      // Validar estrutura esperada
      const hasValidStructure = 
        (parsed as any).name || 
        (parsed as any).nome || 
        (parsed as any).stage ||
        (parsed as any).steps;

      if (!hasValidStructure) {
        setYamlError('Aviso: YAML não contém campos reconhecidos (name, nome, stage, steps)');
        setYamlValid(true); // Ainda permite continuar
      } else {
        setYamlError('');
        setYamlValid(true);
      }

      return parsed;
    } catch (error: any) {
      setYamlError(`Erro ao validar YAML: ${error.message}`);
      setYamlValid(false);
      return null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlContent(content);
      
      const parsed = validateYaml(content);
      if (parsed) {
        // Tentar extrair informações do YAML para preencher o formulário
        const yamlData = parsed as any;
        
        if (yamlData.name || yamlData.nome) {
          setFormData(prev => ({ ...prev, nome: yamlData.name || yamlData.nome }));
        }
        
        if (yamlData.description || yamlData.descricao) {
          setFormData(prev => ({ ...prev, descricao: yamlData.description || yamlData.descricao }));
        }
        
        if (yamlData.type || yamlData.tipo) {
          const tipo = yamlData.type || yamlData.tipo;
          if (TIPOS_STAGE.includes(tipo)) {
            setFormData(prev => ({ ...prev, tipo }));
          }
        }
        
        if (yamlData.timeout || yamlData.timeoutSeconds) {
          setFormData(prev => ({ ...prev, timeoutSeconds: yamlData.timeout || yamlData.timeoutSeconds }));
        }
        
        if (yamlData.reusable !== undefined || yamlData.reutilizavel !== undefined) {
          setFormData(prev => ({ ...prev, reutilizavel: yamlData.reusable ?? yamlData.reutilizavel }));
        }

        toast.success('YAML importado com sucesso');
      }
    };
    
    reader.onerror = () => {
      toast.error('Erro ao ler arquivo');
      setYamlError('Erro ao ler arquivo');
      setYamlValid(false);
    };
    
    reader.readAsText(file);
  };

  const handleYamlTextChange = (content: string) => {
    setYamlContent(content);
    if (content.trim()) {
      validateYaml(content);
    } else {
      setYamlValid(null);
      setYamlError('');
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const url = stage
        ? `${API_URL}/api/stages/${stage.id}`
        : `${API_URL}/api/stages`;
      
      const method = stage ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        yamlContent: yamlContent.trim() || null,
      };

      console.log('🔍 Salvando stage:', {
        url,
        method,
        payload,
        yamlLength: yamlContent.length,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(stage ? 'Stage atualizado com sucesso' : 'Stage criado com sucesso');
        onSave();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar stage');
      }
    } catch (error) {
      console.error('Erro ao salvar stage:', error);
      toast.error('Erro ao salvar stage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{stage ? 'Editar Stage' : 'Novo Stage'}</CardTitle>
              <CardDescription>
                Preencha as informações do estágio de pipeline
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Importação YAML */}
          <div className="space-y-4 p-4 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Importar configuração YAML</h3>
                <p className="text-sm text-muted-foreground">
                  Faça upload de um arquivo YAML ou cole o conteúdo abaixo
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileArrowUp className="mr-2 h-4 w-4" />
                  Upload YAML
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yaml-content">Conteúdo YAML (editável)</Label>
              <Textarea
                id="yaml-content"
                value={yamlContent}
                onChange={(e) => handleYamlTextChange(e.target.value)}
                placeholder={`name: Build Stage
type: Build
description: Compila o código fonte
timeout: 3600
reusable: true`}
                rows={10}
                className="font-mono text-sm overflow-auto"
              />
            </div>

            {yamlValid !== null && (
              <Alert variant={yamlValid ? "default" : "destructive"} className="bg-white">
                <div className="flex items-center gap-2">
                  {yamlValid ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Warning className="h-4 w-4 flex-shrink-0" />
                  )}
                  <AlertDescription className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {yamlValid ? 'YAML válido e importado' : yamlError}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Formulário Principal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações do Stage</h3>
            
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Build and Test"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoStage })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_STAGE.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reutilizavel" className="block">Stage Reutilizável</Label>
              <div className="flex items-center h-10">
                <Switch
                  id="reutilizavel"
                  checked={formData.reutilizavel}
                  onCheckedChange={(checked) => setFormData({ ...formData, reutilizavel: checked })}
                />
                <span className="ml-2 text-sm">{formData.reutilizavel ? 'Sim' : 'Não'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                value={formData.timeoutSeconds}
                onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 3600 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o propósito e funcionamento deste stage"
              rows={4}
            />
          </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <FloppyDisk className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
