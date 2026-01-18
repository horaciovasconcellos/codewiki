import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CloudArrowDown, Trash, MagnifyingGlass, CheckCircle, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Aplicacao } from '@/lib/types';

interface SincronizacaoLegada {
  id: string;
  aplicacao_id: string;
  aplicacao_sigla?: string;
  aplicacao_nome?: string;
  url_projeto: string;
  projeto_nome?: string;
  repositorio_nome?: string;
  status: 'Pendente' | 'Sincronizado' | 'Erro';
  mensagem_erro?: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function SincronizacaoLegadaView() {
  const { logClick, logEvent, logError } = useLogging('sincronizacao-legada-view');
  const [sincronizacoes, setSincronizacoes] = useState<SincronizacaoLegada[]>([]);
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SincronizacaoLegada | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    aplicacao_id: '',
    url_projeto: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar sincronizações
      const sincResp = await fetch(`${API_URL}/api/azure/sincronizacao-legada`);
      if (!sincResp.ok) throw new Error('Erro ao carregar sincronizações');
      const sincData = await sincResp.json();
      setSincronizacoes(Array.isArray(sincData) ? sincData : []);

      // Carregar aplicações
      const appsResp = await fetch(`${API_URL}/api/aplicacoes`);
      if (!appsResp.ok) throw new Error('Erro ao carregar aplicações');
      const appsData = await appsResp.json();
      setAplicacoes(Array.isArray(appsData) ? appsData : []);

    } catch (error) {
      logError(error as Error, 'load_error');
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ aplicacao_id: '', url_projeto: '' });
    setShowDialog(true);
    logClick('open_sync_dialog', { action: 'open' });
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setFormData({ aplicacao_id: '', url_projeto: '' });
  };

  const validateUrl = (url: string): boolean => {
    // Validar formato: https://dev.azure.com/{org}/{project}/_git/{repo}
    const azureUrlPattern = /^https:\/\/dev\.azure\.com\/[^\/]+\/[^\/]+\/_git\/[^\/]+\/?$/;
    return azureUrlPattern.test(url);
  };

  const handleSync = async () => {
    if (!formData.aplicacao_id || !formData.url_projeto.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateUrl(formData.url_projeto)) {
      toast.error('URL inválida. Formato esperado: https://dev.azure.com/{org}/{project}/_git/{repo}');
      return;
    }

    try {
      setIsSyncing(true);
      logEvent('sync_start', 'sync');

      const response = await fetch(`${API_URL}/api/azure/sincronizar-legado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao sincronizar');
      }

      toast.success('Sincronização realizada com sucesso!');
      logClick('sync_success', { aplicacao_id: formData.aplicacao_id });
      
      handleCloseDialog();
      await loadData();
      
    } catch (error) {
      logError(error as Error, 'sync_error');
      console.error('Erro ao sincronizar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao sincronizar: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteClick = (item: SincronizacaoLegada) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
    logClick('delete_click', { id: item.id });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/azure/sincronizacao-legada/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir sincronização');
      }

      toast.success('Sincronização excluída com sucesso!');
      logClick('delete_success', { id: itemToDelete.id });
      
      setShowDeleteDialog(false);
      setItemToDelete(null);
      await loadData();
      
    } catch (error) {
      logError(error as Error, 'delete_error');
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir sincronização');
    }
  };

  // Filtros
  const filteredData = sincronizacoes.filter(item => {
    const matchesSearch = 
      searchTerm === '' ||
      item.aplicacao_sigla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.aplicacao_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projeto_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.repositorio_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sincronizado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Sincronizado</Badge>;
      case 'Erro':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Erro</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SidebarTrigger />
        <h1 className="text-3xl font-bold">Sincronização Legada - Azure DevOps</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sincronizações</CardTitle>
              <CardDescription>
                Associe aplicações existentes com repositórios do Azure DevOps
              </CardDescription>
            </div>
            <Button onClick={handleOpenDialog}>
              <CloudArrowDown className="mr-2" size={20} />
              Nova Sincronização
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                placeholder="Buscar por aplicação, projeto ou repositório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Sincronizado">Sincronizado</SelectItem>
                <SelectItem value="Erro">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contador */}
          <div className="text-sm text-muted-foreground mb-4">
            Mostrando {paginatedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length} sincronizações
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>Aplicação</TableHead>
                  <TableHead>Projeto Azure</TableHead>
                  <TableHead>Repositório</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Nenhuma sincronização encontrada com os filtros aplicados' 
                        : 'Nenhuma sincronização cadastrada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{item.aplicacao_sigla}</div>
                          <div className="text-sm text-muted-foreground">{item.aplicacao_nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.projeto_nome || '-'}</TableCell>
                      <TableCell>{item.repositorio_nome || '-'}</TableCell>
                      <TableCell>
                        <a 
                          href={item.url_projeto} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver no Azure
                        </a>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                        {item.mensagem_erro && (
                          <div className="text-xs text-red-600 mt-1">{item.mensagem_erro}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          title="Excluir"
                        >
                          <Trash size={16} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Nova Sincronização */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sincronização</DialogTitle>
            <DialogDescription>
              Associe uma aplicação existente com um repositório do Azure DevOps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="aplicacao">Aplicação *</Label>
              <Select
                value={formData.aplicacao_id}
                onValueChange={(value) => setFormData({ ...formData, aplicacao_id: value })}
              >
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
              <Label htmlFor="url">URL do Repositório Azure DevOps *</Label>
              <Input
                id="url"
                placeholder="https://dev.azure.com/org/project/_git/repository"
                value={formData.url_projeto}
                onChange={(e) => setFormData({ ...formData, url_projeto: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Formato: https://dev.azure.com/{'{organization}'}/{'{project}'}/_git/{'{repository}'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSyncing}>
              Cancelar
            </Button>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a sincronização da aplicação "{itemToDelete?.aplicacao_sigla}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
