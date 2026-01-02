import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { DocumentacaoProjeto } from '@/lib/types';
import { DocumentacaoDataTable } from './DocumentacaoDataTable';
import { DocumentacaoEditor } from './DocumentacaoEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Inicializar Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

export function DocumentacaoProjetosView() {
  const { logEvent, logError } = useLogging('documentacao-projetos-view');
  const [documentacoes, setDocumentacoes] = useState<DocumentacaoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentacaoProjeto | undefined>(undefined);
  const [viewingDoc, setViewingDoc] = useState<DocumentacaoProjeto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentacaoProjeto | null>(null);

  useEffect(() => {
    loadDocumentacoes();
  }, []);

  const loadDocumentacoes = async () => {
    try {
      setLoading(true);
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/documentacao-projetos`);
      if (!response.ok) throw new Error('Erro ao carregar documentações');
      
      const data = await response.json();
      setDocumentacoes(data);
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao carregar documentações:', error);
      toast.error('Não foi possível carregar as documentações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (doc: Omit<DocumentacaoProjeto, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      const exists = doc.id && documentacoes.find(d => d.id === doc.id);
      const url = exists ? `${API_URL}/api/documentacao-projetos/${doc.id}` : `${API_URL}/api/documentacao-projetos`;
      const method = exists ? 'PUT' : 'POST';

      logEvent('api_call_start', 'api_call');

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });

      if (!response.ok) throw new Error('Erro ao salvar documentação');

      toast.success(`Documentação ${exists ? 'atualizada' : 'criada'} com sucesso`);
      setShowEditor(false);
      setEditingDoc(undefined);
      await loadDocumentacoes();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar documentação:', error);
      toast.error('Não foi possível salvar a documentação');
    }
  };

  const handleDeleteClick = (doc: DocumentacaoProjeto) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;

    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch(`${API_URL}/api/documentacao-projetos/${docToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar documentação');

      toast.success('Documentação deletada com sucesso');
      await loadDocumentacoes();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao deletar documentação:', error);
      toast.error('Não foi possível deletar a documentação');
    } finally {
      setDeleteDialogOpen(false);
      setDocToDelete(null);
    }
  };

  const handleView = (doc: DocumentacaoProjeto) => {
    setViewingDoc(doc);
    // Renderizar Mermaid após um delay
    setTimeout(() => {
      mermaid.run({
        querySelector: '.mermaid',
      });
    }, 100);
  };

  const handleEdit = (doc: DocumentacaoProjeto) => {
    setEditingDoc(doc);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingDoc(undefined);
    setShowEditor(true);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingDoc(undefined);
  };

  if (showEditor) {
    return (
      <DocumentacaoEditor
        documentacao={editingDoc}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText size={32} weight="duotone" className="text-primary" />
            Documentação de Projetos
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie documentação técnica com suporte a Markdown e diagramas Mermaid
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentações</CardTitle>
              <CardDescription>
                {documentacoes.length} documentação(ões) cadastrada(s)
              </CardDescription>
            </div>
            <Button onClick={handleNew}>
              <Plus className="mr-2" weight="bold" />
              Nova Documentação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando documentações...</div>
          ) : (
            <DocumentacaoDataTable
              documentacoes={documentacoes}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.titulo}</DialogTitle>
            <DialogDescription>
              {viewingDoc?.descricao}
            </DialogDescription>
          </DialogHeader>
          {viewingDoc && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
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
                {viewingDoc.conteudo}
              </ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a documentação "{docToDelete?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
