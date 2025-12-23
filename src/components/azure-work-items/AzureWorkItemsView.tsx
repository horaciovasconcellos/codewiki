import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowsClockwise, 
  FunnelSimple, 
  ClockCounterClockwise,
  CheckCircle,
  Circle,
  XCircle,
  Warning
} from '@phosphor-icons/react';
import type { AzureWorkItem, AzureWorkItemHistorico } from '@/lib/types';

interface Projeto {
  id: string;
  produto: string;
  projeto: string;
  workItemProcess: string;
  nomeTime: string;
  dataInicial: string;
  status: string;
  urlProjeto?: string;
  temPatToken: number;
}

export function AzureWorkItemsView() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<string>('');
  const [workItems, setWorkItems] = useState<AzureWorkItem[]>([]);
  const [filteredWorkItems, setFilteredWorkItems] = useState<AzureWorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const [historicoDialog, setHistoricoDialog] = useState(false);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<AzureWorkItemHistorico[]>([]);
  const [workItemSelecionado, setWorkItemSelecionado] = useState<AzureWorkItem | null>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Buscar projetos disponíveis
  useEffect(() => {
    buscarProjetos();
  }, []);

  // Filtrar work items quando mudar os filtros
  useEffect(() => {
    let filtered = workItems;

    if (searchTerm) {
      filtered = filtered.filter(wi => 
        wi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wi.workItemId.toString().includes(searchTerm)
      );
    }

    if (stateFilter !== 'all') {
      filtered = filtered.filter(wi => wi.state === stateFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(wi => wi.workItemType === typeFilter);
    }

    setFilteredWorkItems(filtered);
  }, [workItems, searchTerm, stateFilter, typeFilter]);

  // Buscar work items quando selecionar projeto
  useEffect(() => {
    if (projetoSelecionado) {
      buscarWorkItems();
    }
  }, [projetoSelecionado]);

  const buscarProjetos = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/azure-work-items/projetos');
      if (!response.ok) throw new Error('Erro ao buscar projetos');
      const data = await response.json();
      setProjetos(data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      alert('Erro ao buscar projetos');
    }
  };

  const buscarWorkItems = async () => {
    if (!projetoSelecionado) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/azure-work-items?projetoId=${projetoSelecionado}`
      );
      if (!response.ok) throw new Error('Erro ao buscar work items');
      const data = await response.json();
      setWorkItems(data);
    } catch (error) {
      console.error('Erro ao buscar work items:', error);
      alert('Erro ao buscar work items');
    } finally {
      setLoading(false);
    }
  };

  const sincronizarWorkItems = async () => {
    if (!projetoSelecionado) {
      alert('Selecione um projeto primeiro');
      return;
    }

    const projeto = projetos.find(p => p.id === projetoSelecionado);
    
    if (!projeto?.urlProjeto) {
      alert('Este projeto não possui URL configurada');
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/azure-work-items/sync/${projetoSelecionado}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar');
      }
      
      const result = await response.json();
      alert(`Sincronização concluída!\n\nTotal: ${result.stats.total}\nNovos: ${result.stats.novos}\nAtualizados: ${result.stats.atualizados}`);
      
      // Recarregar work items
      await buscarWorkItems();
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      alert(`Erro ao sincronizar: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  const sincronizarTodosProjetos = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch(
        'http://localhost:3000/api/azure-work-items/sync-all',
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar');
      }
      
      const result = await response.json();
      
      let message = `Sincronização em massa concluída!\n\n`;
      message += `Total de projetos: ${result.totalProjetos}\n`;
      message += `✓ Sucesso: ${result.totalSuccess}\n`;
      if (result.totalFailed > 0) {
        message += `✗ Falhas: ${result.totalFailed}\n\n`;
        message += `Detalhes:\n`;
        result.results.filter((r: any) => !r.success).forEach((r: any) => {
          message += `- ${r.projetoNome}: ${r.error}\n`;
        });
      } else {
        message += `\nTodos os projetos foram sincronizados com sucesso!`;
      }
      
      alert(message);
      
      // Recarregar work items se houver projeto selecionado
      if (projetoSelecionado) {
        await buscarWorkItems();
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar todos os projetos:', error);
      alert(`Erro ao sincronizar: ${error.message}`);
    } finally {
      setSyncingAll(false);
    }
  };
  const abrirHistorico = async (workItem: AzureWorkItem) => {
    setWorkItemSelecionado(workItem);
    setHistoricoDialog(true);
    setLoadingHistorico(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/azure-work-items/${workItem.id}/historico`
      );
      if (!response.ok) throw new Error('Erro ao buscar histórico');
      const data = await response.json();
      setHistoricoSelecionado(data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao buscar histórico');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const getStateBadge = (state: string) => {
    const stateColors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Active': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Done': 'bg-green-100 text-green-800',
      'Removed': 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={stateColors[state] || 'bg-gray-100 text-gray-800'}>
        {state}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      'Bug': 'bg-red-100 text-red-800',
      'Task': 'bg-blue-100 text-blue-800',
      'User Story': 'bg-purple-100 text-purple-800',
      'Feature': 'bg-indigo-100 text-indigo-800',
      'Epic': 'bg-pink-100 text-pink-800',
      'Issue': 'bg-orange-100 text-orange-800',
    };

    return (
      <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const projetoAtual = projetos.find(p => p.id === projetoSelecionado);
  const states = Array.from(new Set(workItems.map(wi => wi.state)));
  const types = Array.from(new Set(workItems.map(wi => wi.workItemType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Work Items Azure DevOps</h1>
        <p className="text-muted-foreground mt-2">
          Monitore e sincronize Work Items dos projetos no Azure DevOps
        </p>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Sincronização</CardTitle>
          <CardDescription>
            Selecione um projeto e sincronize os work items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleção de Projeto */}
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={projetoSelecionado} onValueChange={setProjetoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map(projeto => (
                    <SelectItem key={projeto.id} value={projeto.id}>
                      {projeto.projeto} - {projeto.nomeTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão de Sincronização Individual */}
            <div className="space-y-2">
              <Label>Sincronizar Projeto</Label>
              <Button
                onClick={sincronizarWorkItems}
                disabled={!projetoSelecionado || syncing || syncingAll}
                className="w-full"
              >
                <ArrowsClockwise className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Projeto Selecionado'}
              </Button>
            </div>
          </div>

          {/* Botão de Sincronização em Massa */}
          <div className="pt-2">
            <Button
              onClick={sincronizarTodosProjetos}
              disabled={syncingAll || syncing}
              variant="outline"
              className="w-full"
            >
              <ArrowsClockwise className={`mr-2 h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
              {syncingAll ? 'Sincronizando Todos os Projetos...' : 'Sincronizar TODOS os Projetos'}
            </Button>
          </div>

          {projetoAtual && (
            <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
              <p><strong>Produto:</strong> {projetoAtual.produto}</p>
              <p><strong>Processo:</strong> {projetoAtual.workItemProcess}</p>
              <p><strong>Time:</strong> {projetoAtual.nomeTime}</p>
              <p><strong>Status:</strong> {projetoAtual.status}</p>
              {projetoAtual.urlProjeto && (
                <p><strong>URL:</strong> <a href={projetoAtual.urlProjeto} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{projetoAtual.urlProjeto}</a></p>
              )}
            </div>
          )}

          {/* Filtros */}
          {workItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FunnelSimple className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filtros</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <Input
                    placeholder="Buscar por título ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Work Items */}
      {projetoSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle>
              Work Items
              {filteredWorkItems.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({filteredWorkItems.length} {filteredWorkItems.length === 1 ? 'item' : 'itens'})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Work Items ativos (excluindo: Done, Closed, Removed, Resolved)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando work items...
              </div>
            ) : filteredWorkItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {workItems.length === 0 
                  ? 'Nenhum work item encontrado. Clique em "Sincronizar" para buscar do Azure DevOps.'
                  : 'Nenhum work item corresponde aos filtros aplicados.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Atribuído a</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Data Inclusão</TableHead>
                      <TableHead>Última Alteração</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkItems.map((wi) => (
                      <TableRow key={wi.id}>
                        <TableCell className="font-mono text-sm">
                          {wi.workItemId}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(wi.workItemType)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={wi.title}>
                            {wi.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStateBadge(wi.state)}
                        </TableCell>
                        <TableCell>
                          {wi.assignedTo || '-'}
                        </TableCell>
                        <TableCell>
                          {wi.activity || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(wi.createdDate)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(wi.changedDate)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirHistorico(wi)}
                          >
                            <ClockCounterClockwise className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Histórico */}
      <Dialog open={historicoDialog} onOpenChange={setHistoricoDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico de Alterações - WIT #{workItemSelecionado?.workItemId}
            </DialogTitle>
            <DialogDescription>
              {workItemSelecionado?.title}
            </DialogDescription>
          </DialogHeader>

          {loadingHistorico ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : historicoSelecionado.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada no histórico
            </div>
          ) : (
            <div className="space-y-4">
              {historicoSelecionado.map((hist, index) => (
                <div
                  key={hist.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {hist.campoAlterado}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(hist.dataAlteracao)} - {hist.alteradoPor || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Anterior</p>
                      <p className="p-2 bg-red-50 rounded border border-red-200">
                        {hist.valorAnterior || '(vazio)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Novo</p>
                      <p className="p-2 bg-green-50 rounded border border-green-200">
                        {hist.valorNovo || '(vazio)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
