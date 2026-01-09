import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjetoSDD, IAType } from '@/types/sdd';
import { Upload } from 'lucide-react';

interface ProjetoSDDFormProps {
  projeto?: ProjetoSDD;
  onClose: () => void;
  onSave: () => void;
}

const IA_OPTIONS: { value: IAType; label: string }[] = [
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'cursor-agent', label: 'Cursor Agent' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'opencode', label: 'OpenCode' },
  { value: 'codex', label: 'Codex' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'kilocode', label: 'Kilocode' },
  { value: 'auggie', label: 'Auggie' },
  { value: 'roo', label: 'Roo' },
  { value: 'codebuddy', label: 'CodeBuddy' },
  { value: 'amp', label: 'AMP' },
  { value: 'shai', label: 'Shai' },
  { value: 'q', label: 'Q' },
  { value: 'bobouqoder', label: 'BobouQoder' },
];

export function ProjetoSDDForm({ projeto, onClose, onSave }: ProjetoSDDFormProps) {
  const [aplicacoes, setAplicacoes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    aplicacao_id: projeto?.aplicacao_id || null,
    nome_projeto: projeto?.nome_projeto || '',
    ia_selecionada: projeto?.ia_selecionada || 'claude',
    constituicao: projeto?.constituicao || '',
    prd_content: projeto?.prd_content || '',
    gerador_projetos: projeto?.gerador_projetos || false,
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prdFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAplicacoes();
  }, []);

  const loadAplicacoes = async () => {
    try {
      const response = await fetch('/api/aplicacoes');
      if (!response.ok) throw new Error('Erro ao carregar aplicações');
      const data = await response.json();
      console.log('Aplicações carregadas:', data.length);
      setAplicacoes(data);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
      toast.error('Erro ao carregar aplicações');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'constituicao' | 'prd_content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é arquivo Markdown
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      toast.error('Por favor, selecione um arquivo Markdown (.md ou .markdown)');
      return;
    }

    // Verificar tamanho do arquivo (máx 2MB para PRD, 500KB para constituição)
    const maxSize = field === 'prd_content' ? 2 * 1024 * 1024 : 500 * 1024;
    const maxSizeLabel = field === 'prd_content' ? '2MB' : '500KB';
    
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeLabel}`);
      return;
    }

    try {
      const text = await file.text();
      setFormData({ ...formData, [field]: text });
      toast.success(`${field === 'prd_content' ? 'PRD' : 'Arquivo Markdown'} carregado com sucesso`);
    } catch (error) {
      toast.error('Erro ao ler arquivo');
    }

    // Limpar input
    if (field === 'constituicao' && fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (field === 'prd_content' && prdFileInputRef.current) {
      prdFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome_projeto || !formData.ia_selecionada) {
      toast.error('Nome do projeto e IA são obrigatórios');
      return;
    }

    setSaving(true);

    try {
      const url = projeto ? `/api/sdd/projetos/${projeto.id}` : '/api/sdd/projetos';
      const method = projeto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao salvar projeto');

      toast.success(`Projeto ${projeto ? 'atualizado' : 'criado'} com sucesso`);

      onSave();
    } catch (error) {
      toast.error('Erro ao salvar projeto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projeto ? 'Editar' : 'Novo'} Projeto SDD</CardTitle>
        <CardDescription>
          Preencha as informações básicas do projeto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_projeto">Nome do Projeto *</Label>
              <Input
                id="nome_projeto"
                value={formData.nome_projeto}
                onChange={(e) => setFormData({ ...formData, nome_projeto: e.target.value })}
                placeholder="Nome do projeto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicacao">Aplicação</Label>
              <Select
                value={formData.aplicacao_id?.toString() || '0'}
                onValueChange={(value) => {
                  console.log('Selecionando aplicação:', value);
                  const newId = value === '0' ? null : value;
                  console.log('Novo ID (string):', newId);
                  setFormData({ ...formData, aplicacao_id: newId });
                  console.log('FormData atualizado');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma aplicação (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nenhuma</SelectItem>
                  {aplicacoes.map((app) => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      {app.sigla} - {app.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecionado: {formData.aplicacao_id || 'Nenhuma'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ia">Seleção de IA *</Label>
            <Select
              value={formData.ia_selecionada}
              onValueChange={(value: IAType) => setFormData({ ...formData, ia_selecionada: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma IA" />
              </SelectTrigger>
              <SelectContent>
                {IA_OPTIONS.map((ia) => (
                  <SelectItem key={ia.value} value={ia.value}>
                    {ia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="constituicao">Constituição</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8"
              >
                <Upload className="w-4 h-4 mr-2" />
                Anexar Markdown
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={(e) => handleFileUpload(e, 'constituicao')}
                className="hidden"
              />
            </div>
            <Textarea
              id="constituicao"
              value={formData.constituicao}
              onChange={(e) => setFormData({ ...formData, constituicao: e.target.value })}
              placeholder="Suporte a Markdown. Descreva a constituição do projeto..."
              rows={10}
              className="font-mono text-sm resize-none overflow-y-auto"
              style={{ minHeight: '15rem', maxHeight: '15rem' }}
            />
            <p className="text-xs text-muted-foreground">
              Suporte a Markdown. Você pode digitar ou anexar um arquivo .md (máx 500KB)
            </p>
          </div>

          {/* Seção PRD - Product Requirements Document */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="prd_content" className="text-base font-semibold">
                  PRD (Product Requirements Document)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Documento de requisitos do produto em formato Markdown
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => prdFileInputRef.current?.click()}
                className="h-8"
              >
                <Upload className="w-4 h-4 mr-2" />
                Anexar PRD (.md)
              </Button>
              <input
                ref={prdFileInputRef}
                type="file"
                accept=".md,.markdown"
                onChange={(e) => handleFileUpload(e, 'prd_content')}
                className="hidden"
              />
            </div>
            <Textarea
              id="prd_content"
              value={formData.prd_content}
              onChange={(e) => setFormData({ ...formData, prd_content: e.target.value })}
              placeholder="Cole ou carregue o conteúdo do PRD em Markdown. Este documento será usado para extrair requisitos automaticamente..."
              rows={15}
              className="font-mono text-sm resize-none overflow-y-auto"
              style={{ minHeight: '20rem', maxHeight: '20rem' }}
            />
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Como usar o PRD:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Estruture o documento com títulos (# ## ###) para separar seções</li>
                  <li>Use listas para requisitos funcionais e não-funcionais</li>
                  <li>Os requisitos serão automaticamente extraídos e vinculados à tabela <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">requisitos_sdd</code></li>
                  <li>Tamanho máximo: 2MB</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 border-t pt-4">
            <Switch
              id="gerador"
              checked={formData.gerador_projetos}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, gerador_projetos: checked as boolean })
              }
            />
            <Label htmlFor="gerador" className="cursor-pointer">
              Incluir no Gerador de Projetos
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : projeto ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
