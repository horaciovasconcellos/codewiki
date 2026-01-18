import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { useAuth } from '@/hooks/usePermissions';
import { DocumentacaoProjeto } from '@/lib/types';
import { DocumentacaoDataTable } from './DocumentacaoDataTable';
import { DocumentacaoEditor } from './DocumentacaoEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Printer } from '@phosphor-icons/react';
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
import { marked } from 'marked';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Inicializar Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

export function DocumentacaoProjetosView() {
  const { logEvent, logError } = useLogging('documentacao-projetos-view');
  const { canCreate, canUpdate, canDelete } = useAuth();
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
      console.log('📤 Dados sendo enviados:', JSON.stringify(doc, null, 2));
      
      const exists = doc.id && documentacoes.find(d => d.id === doc.id);
      const url = exists ? `${API_URL}/api/documentacao-projetos/${doc.id}` : `${API_URL}/api/documentacao-projetos`;
      const method = exists ? 'PUT' : 'POST';

      logEvent('api_call_start', 'api_call');

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro da API:', errorData);
        console.error('Status:', response.status);
        console.error('Response completo:', response);
        
        // Montar mensagem detalhada
        const errorMessage = errorData.message 
          ? `${errorData.error} - ${errorData.message}` 
          : errorData.error || 'Erro ao salvar documentação';
          
        throw new Error(errorMessage);
      }

      toast.success(`Documentação ${exists ? 'atualizada' : 'criada'} com sucesso`);
      setShowEditor(false);
      setEditingDoc(undefined);
      await loadDocumentacoes();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao salvar documentação:', error);
      toast.error(`Não foi possível salvar a documentação: ${(error as Error).message}`);
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

  const handlePrint = (doc: DocumentacaoProjeto) => {
    // Criar elemento temporário de impressão fora do Dialog
    const printWindow = document.createElement('div');
    printWindow.id = 'print-window';
    printWindow.className = 'print-only';
    
    // Formatar tags para exibição
    const tagsFormatadas = doc.tags && doc.tags.length > 0 
      ? doc.tags.join(', ') 
      : 'Sem tags';
    
    // Configurar marked para suportar GFM (GitHub Flavored Markdown)
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    
    // Converter Markdown para HTML
    const conteudoHtml = marked(doc.conteudo || '');
    
    // Formatar data de impressão
    const dataImpressao = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Criar HTML com cabeçalho simplificado
    printWindow.innerHTML = `
      <div class="print-header">
        <div class="header-line titulo">${doc.titulo}</div>
        <div class="header-line aplicacao">${doc.aplicacao || '-'}</div>
        <div class="header-line info">${doc.categoria || '-'} - ${doc.versao || '-'} - ${doc.autor || '-'}</div>
        <div class="header-line data">Data da Impressão: ${dataImpressao}</div>
      </div>
      
      <div class="print-divider"></div>
      
      <div class="print-content-body">
        ${conteudoHtml}
      </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(printWindow);
    
    // Aguardar renderização
    setTimeout(() => {
      console.log('🖨️ Print - Elemento criado:', document.getElementById('print-window'));
      window.print();
      
      // Remover após impressão
      setTimeout(() => {
        document.body.removeChild(printWindow);
      }, 100);
    }, 500);
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
    <>
      {/* Estilos específicos para impressão */}
      <style>{`
        /* Elemento de impressão invisível na tela */
        .print-only {
          display: none;
        }

        @media print {
          /* Forçar cores */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Configurar página */
          @page {
            margin: 20mm;
            size: A4;
          }

          /* Ocultar tudo exceto conteúdo de impressão */
          body * {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          /* Mostrar apenas elemento de impressão */
          .print-only,
          .print-only * {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          .print-only {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #000 !important;
            background: white !important;
          }

          /* Cabeçalho de informações */
          .print-header {
            margin-bottom: 20pt !important;
            border-bottom: 2pt solid #333 !important;
            padding-bottom: 15pt !important;
          }

          .header-line {
            padding: 6pt 0 !important;
            color: #000 !important;
          }

          .header-line.titulo {
            font-size: 24pt !important;
            font-weight: bold !important;
            margin-bottom: 8pt !important;
          }

          .header-line.aplicacao {
            font-size: 14pt !important;
            font-weight: 600 !important;
            color: #333 !important;
          }

          .header-line.info {
            font-size: 12pt !important;
            color: #555 !important;
          }

          .header-line.data {
            font-size: 10pt !important;
            color: #666 !important;
            font-style: italic !important;
            margin-top: 8pt !important;
          }

          .print-divider {
            height: 2pt !important;
            background: #333 !important;
            margin: 20pt 0 !important;
            border: none !important;
          }

          .print-content-body {
            margin-top: 15pt !important;
          }

          /* Títulos do conteúdo */
          .print-content-body h1,
          .print-only h1:not(.print-title) {
            font-size: 24pt !important;
            font-weight: bold !important;
            margin: 0 0 12pt 0 !important;
            color: #000 !important;
            border-bottom: 2pt solid #333 !important;
            padding-bottom: 6pt !important;
            page-break-after: avoid !important;
          }

          .print-content-body h2,
          .print-only h2 {
            font-size: 20pt !important;
            font-weight: bold !important;
            margin: 16pt 0 10pt 0 !important;
            color: #000 !important;
            page-break-after: avoid !important;
          }

          .print-content-body h3,
          .print-only h3 {
            font-size: 16pt !important;
            font-weight: bold !important;
            margin: 14pt 0 8pt 0 !important;
            color: #333 !important;
          }

          .print-content-body h4,
          .print-content-body h5,
          .print-content-body h6,
          .print-only h4,
          .print-only h5,
          .print-only h6 {
            font-size: 14pt !important;
            font-weight: bold !important;
            margin: 12pt 0 6pt 0 !important;
            color: #333 !important;
          }

          /* Parágrafos */
          .print-content-body p,
          .print-only p {
            margin: 0 0 10pt 0 !important;
            line-height: 1.6 !important;
            color: #000 !important;
          }

          /* Listas */
          .print-content-body ul,
          .print-content-body ol,
          .print-only ul,
          .print-only ol {
            margin: 10pt 0 10pt 25pt !important;
            padding: 0 !important;
          }

          .print-content-body li,
          .print-only li {
            display: list-item !important;
            margin-bottom: 5pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }

          .print-content-body ul li,
          .print-only ul li {
            list-style-type: disc !important;
          }

          .print-content-body ol li,
          .print-only ol li {
            list-style-type: decimal !important;
          }

          /* Código */
          .print-content-body code,
          .print-only code {
            background: #f0f0f0 !important;
            padding: 2pt 4pt !important;
            border: 1pt solid #ccc !important;
            border-radius: 2pt !important;
            font-family: 'Courier New', Consolas, monospace !important;
            font-size: 9pt !important;
            color: #c7254e !important;
          }

          .print-content-body pre,
          .print-only pre {
            display: block !important;
            background: #f8f8f8 !important;
            padding: 10pt !important;
            border: 1pt solid #ddd !important;
            border-radius: 3pt !important;
            margin: 10pt 0 !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }

          .print-content-body pre code,
          .print-only pre code {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            color: #000 !important;
            font-size: 8pt !important;
            line-height: 1.4 !important;
          }

          /* Tabelas do conteúdo */
          .print-content-body table,
          .print-only table:not(.info-table) {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 10pt 0 !important;
            page-break-inside: avoid !important;
          }

          .print-content-body thead,
          .print-only thead {
            display: table-header-group !important;
          }

          .print-content-body tbody,
          .print-only tbody {
            display: table-row-group !important;
          }

          .print-content-body tr,
          .print-only tr {
            display: table-row !important;
            page-break-inside: avoid !important;
          }

          .print-content-body th:not(.info-table th),
          .print-content-body td:not(.info-table td),
          .print-only th:not(.info-table th),
          .print-only td:not(.info-table td) {
            display: table-cell !important;
            border: 1pt solid #333 !important;
            padding: 6pt !important;
            color: #000 !important;
            font-size: 10pt !important;
          }

          .print-content-body th:not(.info-table th),
          .print-only th:not(.info-table th) {
            background: #e0e0e0 !important;
            font-weight: bold !important;
          }

          /* Blockquotes */
          .print-content-body blockquote,
          .print-only blockquote {
            display: block !important;
            border-left: 3pt solid #ccc !important;
            padding-left: 10pt !important;
            margin: 10pt 0 10pt 10pt !important;
            color: #666 !important;
            font-style: italic !important;
          }

          /* Links */
          .print-content-body a,
          .print-only a {
            color: #0066cc !important;
            text-decoration: underline !important;
          }

          .print-content-body a::after,
          .print-only a::after {
            content: " (" attr(href) ")" !important;
            font-size: 8pt !important;
            color: #666 !important;
          }

          /* Formatação de texto */
          .print-content-body strong,
          .print-content-body b,
          .print-only strong,
          .print-only b {
            font-weight: bold !important;
            color: #000 !important;
          }

          .print-content-body em,
          .print-content-body i,
          .print-only em,
          .print-only i {
            font-style: italic !important;
          }

          /* Imagens */
          .print-content-body img,
          .print-only img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
          }

          /* Diagramas Mermaid */
          .print-content-body .mermaid,
          .print-content-body svg,
          .print-only .mermaid,
          .print-only svg {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 10pt 0 !important;
            page-break-inside: avoid !important;
          }

          /* Linhas horizontais */
          .print-content-body hr,
          .print-only hr {
            display: block !important;
            border: none !important;
            border-top: 1pt solid #ccc !important;
            margin: 15pt 0 !important;
          }
        }
      `}</style>

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
            <Button onClick={handleNew} disabled={!canCreate('documentacao-projetos')}>
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
              onPrint={handlePrint}
              canUpdate={canUpdate('documentacao-projetos')}
              canDelete={canDelete('documentacao-projetos')}
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
            <div 
              className="prose prose-sm max-w-none dark:prose-invert print-content"
              data-title={viewingDoc.titulo}
            >
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
    </>
  );
}
