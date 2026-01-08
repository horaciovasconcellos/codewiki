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
    gerador_projetos: projeto?.gerador_projetos || false,
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é arquivo Markdown
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      toast.error('Por favor, selecione um arquivo Markdown (.md ou .markdown)');
      return;
    }

    // Verificar tamanho do arquivo (máx 500KB)
    if (file.size > 500 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 500KB');
      return;
    }

    try {
      const text = await file.text();
      setFormData({ ...formData, constituicao: text });
      toast.success('Arquivo Markdown carregado com sucesso');
    } catch (error) {
      toast.error('Erro ao ler arquivo');
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                onChange={handleFileUpload}
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

          <div className="flex items-center space-x-2">
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
