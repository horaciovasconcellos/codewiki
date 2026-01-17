import { useState, useEffect } from 'react';
import { DocumentacaoProjeto, Aplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, X, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DocumentacaoEditorProps {
  documentacao?: DocumentacaoProjeto;
  onSave: (doc: Omit<DocumentacaoProjeto, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onCancel: () => void;
}

// Inicializar Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

export function DocumentacaoEditor({ documentacao, onSave, onCancel }: DocumentacaoEditorProps) {
  const [titulo, setTitulo] = useState(documentacao?.titulo || '');
  const [slug, setSlug] = useState(documentacao?.slug || '');
  const [descricao, setDescricao] = useState(documentacao?.descricao || '');
  const [conteudo, setConteudo] = useState(documentacao?.conteudo || '');
  const [categoria, setCategoria] = useState(documentacao?.categoria || 'Outros');
  const [tags, setTags] = useState(documentacao?.tags.join(', ') || '');
  const [versao, setVersao] = useState(documentacao?.versao || '1.0.0');
  const [autor, setAutor] = useState(documentacao?.autor || '');
  const [aplicacaoId, setAplicacaoId] = useState(documentacao?.aplicacaoId || '');
  const [status, setStatus] = useState(documentacao?.status || 'Rascunho');
  const [activeTab, setActiveTab] = useState('editor');
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);

  // Carregar aplicações
  useEffect(() => {
    const loadAplicacoes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/aplicacoes`);
        if (response.ok) {
          const data = await response.json();
          setAplicacoes(data);
        }
      } catch (error) {
        console.error('Erro ao carregar aplicações:', error);
      }
    };
    loadAplicacoes();
  }, []);

  // Auto-gerar slug do título
  useEffect(() => {
    if (!documentacao && titulo) {
      const newSlug = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(newSlug);
    }
  }, [titulo, documentacao]);

  // Renderizar Mermaid quando o conteúdo mudar
  useEffect(() => {
    if (activeTab === 'preview') {
      const timeout = setTimeout(() => {
        mermaid.run({
          querySelector: '.mermaid',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [conteudo, activeTab]);

  const handleSubmit = () => {
    // Validações
    if (!titulo.trim()) {
      toast.error('Preencha o título da documentação');
      return;
    }

    if (!slug.trim()) {
      toast.error('Preencha o slug da documentação');
      return;
    }

    if (!conteudo.trim()) {
      toast.error('Preencha o conteúdo da documentação');
      return;
    }

    if (!autor.trim()) {
      toast.error('Preencha o autor da documentação');
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const doc = {
      id: documentacao?.id,
      titulo: titulo.trim(),
      slug: slug.trim(),
      descricao: descricao.trim(),
      conteudo: conteudo.trim(),
      categoria: categoria as any,
      tags: tagsArray,
      versao: versao.trim(),
      autor: autor.trim(),
      aplicacaoId: aplicacaoId || undefined,
      status: status as any,
    };

    onSave(doc);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>
              {documentacao ? 'Editar Documentação' : 'Nova Documentação'}
            </CardTitle>
            <CardDescription>
              Crie ou edite documentação com suporte a Markdown e diagramas Mermaid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Arquitetura do Sistema"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: arquitetura-do-sistema"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descrição da documentação"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select value={categoria} onValueChange={(value) => setCategoria(value as typeof categoria)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Processos">Processos</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                    <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                    <SelectItem value="Publicado">Publicado</SelectItem>
                    <SelectItem value="Arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="versao">
                  Versão <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="versao"
                  value={versao}
                  onChange={(e) => setVersao(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autor">
                  Autor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="autor"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  placeholder="Nome do autor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aplicacao">Aplicação (opcional)</Label>
                <Select value={aplicacaoId || undefined} onValueChange={setAplicacaoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aplicação" />
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

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ex: react, typescript, api"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Conteúdo (Markdown) <span className="text-destructive">*</span>
              </Label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2" size={16} />
                    Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="mt-2">
                  <Textarea
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="# Título&#10;&#10;Escreva sua documentação em Markdown...&#10;&#10;## Diagrama Mermaid&#10;```mermaid&#10;graph TD&#10;  A[Início] --> B[Processo]&#10;  B --> C[Fim]&#10;```"
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Suporte a Markdown e diagramas Mermaid. Use <code className="bg-muted px-1 py-0.5 rounded">```mermaid</code> para criar diagramas.
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-2">
                  <div className="border rounded-md p-6 bg-background min-h-[500px] prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          
                          if (!inline && language === 'mermaid') {
                            return (
                              <div className="mermaid my-4">
                                {String(children).replace(/\n$/, '')}
                              </div>
                            );
                          }
                          
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus as any}
                              language={language}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {conteudo}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button variant="outline" onClick={onCancel}>
                <X className="mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                <Check className="mr-2" />
                {documentacao ? 'Salvar Alterações' : 'Criar Documentação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
