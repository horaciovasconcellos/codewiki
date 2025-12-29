import { useState } from 'react';
import { Script } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Trash, MagnifyingGlass, FileText, PencilSimple } from '@phosphor-icons/react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ScriptsTableProps {
  scripts: Script[];
  loading: boolean;
  onEdit: (script: Script) => void;
  onDelete: (id: string) => void;
}

export function ScriptsTable({ scripts, loading, onEdit, onDelete }: ScriptsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [scriptToView, setScriptToView] = useState<Script | null>(null);
  const [fileContentDialogOpen, setFileContentDialogOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const handleDeleteClick = (script: Script) => {
    setScriptToDelete(script);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (scriptToDelete) {
      onDelete(scriptToDelete.id);
      setDeleteDialogOpen(false);
      setScriptToDelete(null);
    }
  };

  const handleViewClick = (script: Script) => {
    setScriptToView(script);
    setViewDialogOpen(true);
  };

  const handleFileClick = async (script: Script) => {
    if (!script.arquivoUrl) return;
    
    setCurrentFileName(script.arquivo || 'arquivo');
    setFileContentDialogOpen(true);
    setLoadingContent(true);
    setFileContent('');
    
    try {
      const response = await fetch(`/${script.arquivoUrl}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar arquivo');
      }
      const content = await response.text();
      setFileContent(content);
    } catch (error) {
      console.error('Erro ao carregar conteúdo do arquivo:', error);
      setFileContent('Erro ao carregar o conteúdo do arquivo.');
    } finally {
      setLoadingContent(false);
    }
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch =
      script.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'all' || script.tipoScript === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'Automação': 'bg-blue-500',
      'Administração': 'bg-purple-500',
      'Banco de Dados': 'bg-green-500',
      'Integração': 'bg-yellow-500',
      'Testes': 'bg-orange-500',
      'Build & Deploy': 'bg-red-500',
      'CI/CD': 'bg-pink-500',
      'Infraestrutura (IaC)': 'bg-indigo-500',
      'Monitoramento': 'bg-cyan-500',
      'Segurança': 'bg-rose-500',
      'Governança': 'bg-violet-500',
      'Dados': 'bg-teal-500',
      'ERP': 'bg-amber-500',
      'Documentação': 'bg-slate-500',
    };
    return colors[tipo] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando scripts...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por sigla ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Automação">Automação</SelectItem>
              <SelectItem value="Administração">Administração</SelectItem>
              <SelectItem value="Banco de Dados">Banco de Dados</SelectItem>
              <SelectItem value="Integração">Integração</SelectItem>
              <SelectItem value="Testes">Testes</SelectItem>
              <SelectItem value="Build & Deploy">Build & Deploy</SelectItem>
              <SelectItem value="CI/CD">CI/CD</SelectItem>
              <SelectItem value="Infraestrutura (IaC)">Infraestrutura (IaC)</SelectItem>
              <SelectItem value="Monitoramento">Monitoramento</SelectItem>
              <SelectItem value="Segurança">Segurança</SelectItem>
              <SelectItem value="Governança">Governança</SelectItem>
              <SelectItem value="Dados">Dados</SelectItem>
              <SelectItem value="ERP">ERP</SelectItem>
              <SelectItem value="Documentação">Documentação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sigla</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Término</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum script encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredScripts.map((script) => (
                  <TableRow key={script.id}>
                    <TableCell className="font-medium">{script.sigla}</TableCell>
                    <TableCell className="max-w-md truncate">{script.descricao}</TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(script.tipoScript)}>
                        {script.tipoScript}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(script.dataInicio)}</TableCell>
                    <TableCell>{formatDate(script.dataTermino)}</TableCell>
                    <TableCell>
                      {script.arquivo ? (
                        <button
                          onClick={() => handleFileClick(script)}
                          className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-left"
                          title="Clique para visualizar o conteúdo"
                        >
                          <FileText className="text-muted-foreground" size={16} />
                          <span className="text-sm truncate max-w-[150px] underline decoration-dashed underline-offset-4">
                            {script.arquivo}
                          </span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(script)}
                          title="Visualizar"
                        >
                          <Eye weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(script)}
                          title="Editar"
                        >
                          <PencilSimple weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(script)}
                          title="Excluir"
                        >
                          <Trash weight="bold" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Total: {filteredScripts.length} script(s)
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o script "{scriptToDelete?.sigla}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Script</DialogTitle>
            <DialogDescription>
              Informações completas do script
            </DialogDescription>
          </DialogHeader>
          {scriptToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sigla</div>
                  <div className="mt-1 font-medium">{scriptToView.sigla}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                  <div className="mt-1">
                    <Badge className={getTipoColor(scriptToView.tipoScript)}>
                      {scriptToView.tipoScript}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Descrição</div>
                <div className="mt-1">{scriptToView.descricao}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data de Início</div>
                  <div className="mt-1">{formatDate(scriptToView.dataInicio)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data de Término</div>
                  <div className="mt-1">{formatDate(scriptToView.dataTermino)}</div>
                </div>
              </div>

              {scriptToView.arquivo && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Arquivo</div>
                  <div className="mt-1 flex items-center gap-2">
                    <FileText className="text-muted-foreground" />
                    <span>{scriptToView.arquivo}</span>
                    {scriptToView.arquivoTamanho && (
                      <span className="text-sm text-muted-foreground">
                        ({(scriptToView.arquivoTamanho / 1024).toFixed(2)} KB)
                      </span>
                    )}
                  </div>
                  {scriptToView.arquivoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(scriptToView.arquivoUrl, '_blank')}
                    >
                      Download
                    </Button>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button onClick={() => onEdit(scriptToView)}>
                  Editar Script
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização de conteúdo do arquivo */}
      <Dialog open={fileContentDialogOpen} onOpenChange={setFileContentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conteúdo do Arquivo</DialogTitle>
            <DialogDescription>
              {currentFileName}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingContent ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando conteúdo...</div>
              </div>
            ) : (
              <Textarea
                value={fileContent}
                readOnly
                className="font-mono text-xs h-[500px] resize-none"
                placeholder="Conteúdo do arquivo será exibido aqui..."
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(fileContent);
                toast.success('Conteúdo copiado para a área de transferência!');
              }}
            >
              Copiar
            </Button>
            <Button onClick={() => setFileContentDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
