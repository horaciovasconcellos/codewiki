import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FrontendLogEvent, APILogEvent, LogFilter, EventType, LogSeverity } from '@/lib/logging-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MagnifyingGlass, FunnelSimple, X, Eye, ChartLine, Trash } from '@phosphor-icons/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLogging } from '@/hooks/use-logging';
import { formatarData } from '@/lib/utils';

export function LogsAndTracesView() {
  const { logClick } = useLogging('logs-traces');
  const [logs] = useLocalStorage<Array<FrontendLogEvent | APILogEvent>>('system_logs', []);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({});
  const [searchText, setSearchText] = useState('');
  const [selectedLog, setSelectedLog] = useState<FrontendLogEvent | APILogEvent | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  // Carregar logs de auditoria do backend
  useEffect(() => {
    const loadAuditLogs = async () => {
      setLoadingAudit(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      try {
        const response = await fetch(`${API_URL}/api/logs-auditoria?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data.logs || []);
        }
        
        const statsResponse = await fetch(`${API_URL}/api/logs-auditoria/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setAuditStats(statsData);
        }
      } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
      } finally {
        setLoadingAudit(false);
      }
    };
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter(log => {
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;
      if (filter.userId && 'user_id' in log && log.user_id !== filter.userId) return false;
      if (filter.screenName && 'screen_name' in log && log.screen_name !== filter.screenName) return false;
      if (filter.eventType && 'event_type' in log && log.event_type !== filter.eventType) return false;
      if (filter.statusCode && 'status_code' in log && log.status_code !== filter.statusCode) return false;
      if (filter.traceId && log.trace_id !== filter.traceId) return false;
      if (filter.severity && log.severity !== filter.severity) return false;
      
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const logStr = JSON.stringify(log).toLowerCase();
        if (!logStr.includes(searchLower)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, filter, searchText]);

  const traceStats = useMemo(() => {
    if (!logs) return { totalTraces: 0, totalEvents: 0, errorCount: 0 };

    const uniqueTraces = new Set(logs.map(log => log.trace_id));
    const errorLogs = logs.filter(log => log.severity === 'error');

    return {
      totalTraces: uniqueTraces.size,
      totalEvents: logs.length,
      errorCount: errorLogs.length
    };
  }, [logs]);

  const traceLogs = useMemo(() => {
    if (!selectedTraceId || !logs) return [];
    
    return logs
      .filter(log => log.trace_id === selectedTraceId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedTraceId, logs]);

  const uniqueScreens = useMemo(() => {
    if (!logs) return [];
    const screens = new Set<string>();
    logs.forEach(log => {
      if ('screen_name' in log) {
        screens.add(log.screen_name);
      }
    });
    return Array.from(screens).sort();
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    if (!logs) return [];
    const users = new Set<string>();
    logs.forEach(log => {
      if ('user_id' in log && log.user_id) {
        users.add(log.user_id);
      }
    });
    return Array.from(users).sort();
  }, [logs]);

  const handleClearFilters = () => {
    logClick('clear_filters');
    setFilter({});
    setSearchText('');
  };

  const handleClearLogs = async () => {
    const userId = filter.userId || '';
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      logClick('clear_all_logs', { user_id: userId });
      localStorage.setItem('system_logs', JSON.stringify([]));
    }
  };

  const getSeverityColor = (severity: LogSeverity): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warn': return 'default';
      case 'info': return 'secondary';
      case 'debug': return 'outline';
      default: return 'secondary';
    }
  };

  const getEventTypeColor = (eventType: EventType): "default" | "destructive" | "secondary" | "outline" => {
    switch (eventType) {
      case 'error': return 'destructive';
      case 'api_call': return 'default';
      case 'api_response': return 'secondary';
      case 'navigation': return 'outline';
      case 'click': return 'outline';
      case 'input': return 'outline';
      case 'load': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const formatted = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${formatted}.${ms}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Logs e Traces</h1>
            <p className="text-muted-foreground mt-2">
              Sistema de observabilidade e análise de eventos distribuídos
            </p>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="logs">Logs Frontend</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Traces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{traceStats.totalTraces}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{traceStats.totalEvents}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Erros Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{traceStats.errorCount}</div>
                </CardContent>
              </Card>
            </div>

            {selectedTraceId && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Análise de Trace</CardTitle>
                      <CardDescription>
                        Trace ID: <span className="font-mono">{selectedTraceId}</span>
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTraceId(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Fechar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total de Eventos</div>
                        <div className="text-2xl font-bold">{traceLogs.length}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Duração Total</div>
                        <div className="text-2xl font-bold">
                          {traceLogs.length > 1
                            ? `${(new Date(traceLogs[traceLogs.length - 1].timestamp).getTime() - new Date(traceLogs[0].timestamp).getTime())}ms`
                            : '-'
                          }
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Spans Únicos</div>
                        <div className="text-2xl font-bold">
                          {new Set(traceLogs.map(l => l.span_id)).size}
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {traceLogs.map((log, index) => (
                          <div key={log.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getSeverityColor(log.severity)}>
                                    {typeof log.severity === 'object' ? JSON.stringify(log.severity) : log.severity}
                                  </Badge>
                                  {'event_type' in log && (
                                    <Badge variant={getEventTypeColor(log.event_type)}>
                                      {typeof log.event_type === 'object' ? JSON.stringify(log.event_type) : log.event_type}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                </div>
                                <div className="text-sm font-medium">
                                  {'event_name' in log ? log.event_name : `${(log as APILogEvent).method} ${(log as APILogEvent).route}`}
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Timestamp: {formatTimestamp(log.timestamp)}</div>
                                  <div className="font-mono">Span: {log.span_id.slice(0, 12)}...</div>
                                  {log.parent_span_id && (
                                    <div className="font-mono">Parent: {log.parent_span_id.slice(0, 12)}...</div>
                                  )}
                                </div>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes do Evento</DialogTitle>
                                  </DialogHeader>
                                  <ScrollArea className="flex-1">
                                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                                      {JSON.stringify(log, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {auditStats && auditStats.operationTypes && Array.isArray(auditStats.operationTypes) && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total de Operações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {auditStats.operationTypes.reduce((sum: number, op: any) => sum + op.count, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Inserções</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {auditStats.operationTypes.find((op: any) => op.operation_type === 'INSERT')?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {auditStats.operationTypes.find((op: any) => op.operation_type === 'UPDATE')?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Exclusões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {auditStats.operationTypes.find((op: any) => op.operation_type === 'DELETE')?.count || 0}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>Registro de todas as operações de inserção, atualização e exclusão</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAudit ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Operação</TableHead>
                          <TableHead>Entidade</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {new Date(log.log_timestamp).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  log.operation_type === 'INSERT' ? 'default' :
                                  log.operation_type === 'UPDATE' ? 'secondary' :
                                  log.operation_type === 'DELETE' ? 'destructive' :
                                  'outline'
                                }
                              >
                                {log.operation_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{log.entity_type || '-'}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.entity_id?.substring(0, 8) || '-'}
                            </TableCell>
                            <TableCell>
                              {typeof log.user_login === 'string' 
                                ? log.user_login 
                                : log.user_login 
                                  ? JSON.stringify(log.user_login) 
                                  : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeof log.status_code === 'number' && log.status_code < 300 ? 'default' : 'destructive'}>
                                {typeof log.status_code === 'object' 
                                  ? JSON.stringify(log.status_code) 
                                  : (log.status_code || '-')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {typeof log.duration_ms === 'object' 
                                ? JSON.stringify(log.duration_ms) 
                                : log.duration_ms 
                                  ? `${log.duration_ms}ms` 
                                  : '-'}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes da Operação</DialogTitle>
                                    <DialogDescription>
                                      {log.operation_type} em {log.entity_type}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="h-[500px]">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-semibold mb-2">Informações Gerais</h4>
                                        <dl className="grid grid-cols-2 gap-2 text-sm">
                                          <dt className="font-medium">Timestamp:</dt>
                                          <dd className="font-mono">{new Date(log.log_timestamp).toISOString()}</dd>
                                          <dt className="font-medium">Usuário:</dt>
                                          <dd>{log.user_login} ({log.user_id})</dd>
                                          <dt className="font-medium">IP:</dt>
                                          <dd className="font-mono">{log.ip_address || 'N/A'}</dd>
                                          <dt className="font-medium">Trace ID:</dt>
                                          <dd className="font-mono text-xs">{log.trace_id || 'N/A'}</dd>
                                        </dl>
                                      </div>

                                      {log.payload && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Payload</h4>
                                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                                            {JSON.stringify(log.payload, null, 2)}
                                          </pre>
                                        </div>
                                      )}

                                      {log.old_values && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Valores Anteriores</h4>
                                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                                            {JSON.stringify(log.old_values, null, 2)}
                                          </pre>
                                        </div>
                                      )}

                                      {log.new_values && (
                                        <div>
                                          <h4 className="font-semibold mb-2">Novos Valores</h4>
                                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                                            {JSON.stringify(log.new_values, null, 2)}
                                          </pre>
                                        </div>
                                      )}

                                      {log.error_message && (
                                        <div>
                                          <h4 className="font-semibold mb-2 text-destructive">Erro</h4>
                                          <pre className="bg-destructive/10 p-4 rounded-lg overflow-x-auto text-xs text-destructive">
                                            {log.error_message}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Refine sua busca por logs e traces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Início</label>
                    <Input
                      type="datetime-local"
                      value={filter.startDate?.slice(0, 16) || ''}
                      onChange={(e) => setFilter({ ...filter, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Fim</label>
                    <Input
                      type="datetime-local"
                      value={filter.endDate?.slice(0, 16) || ''}
                      onChange={(e) => setFilter({ ...filter, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuário</label>
                    <Select 
                      value={filter.userId || 'all'} 
                      onValueChange={(value) => setFilter({ ...filter, userId: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueUsers.map(user => (
                          <SelectItem key={user} value={user}>{user}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tela</label>
                    <Select 
                      value={filter.screenName || 'all'} 
                      onValueChange={(value) => setFilter({ ...filter, screenName: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueScreens.map(screen => (
                          <SelectItem key={screen} value={screen}>{screen}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Evento</label>
                    <Select 
                      value={filter.eventType || 'all'} 
                      onValueChange={(value) => setFilter({ ...filter, eventType: value === 'all' ? undefined : value as EventType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="click">Click</SelectItem>
                        <SelectItem value="navigation">Navegação</SelectItem>
                        <SelectItem value="load">Load</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="input">Input</SelectItem>
                        <SelectItem value="api_call">API Call</SelectItem>
                        <SelectItem value="api_response">API Response</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severidade</label>
                    <Select 
                      value={filter.severity || 'all'} 
                      onValueChange={(value) => setFilter({ ...filter, severity: value === 'all' ? undefined : value as LogSeverity })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warn</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trace ID</label>
                    <Input
                      placeholder="Digite o Trace ID"
                      value={filter.traceId || ''}
                      onChange={(e) => setFilter({ ...filter, traceId: e.target.value || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Busca Geral</label>
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar em todos os campos"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                    <Trash className="h-4 w-4 mr-2" />
                    Limpar Todos os Logs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos ({filteredLogs.length})</CardTitle>
                <CardDescription>Lista de eventos capturados pelo sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tela/Rota</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Trace ID</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Nenhum log encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {formatTimestamp(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getSeverityColor(log.severity)}>
                                {typeof log.severity === 'object' 
                                  ? JSON.stringify(log.severity) 
                                  : (log.severity || 'info')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {'event_type' in log ? (
                                <Badge variant={getEventTypeColor(log.event_type)}>
                                  {typeof log.event_type === 'object' 
                                    ? JSON.stringify(log.event_type) 
                                    : (log.event_type || '-')}
                                </Badge>
                              ) : (
                                <Badge variant="default">API</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {'screen_name' in log 
                                ? (typeof log.screen_name === 'string' ? log.screen_name : JSON.stringify(log.screen_name))
                                : 'route' in log 
                                  ? (typeof log.route === 'string' ? log.route : JSON.stringify(log.route))
                                  : '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {'event_name' in log 
                                ? (typeof log.event_name === 'string' ? log.event_name : JSON.stringify(log.event_name))
                                : 'method' in log 
                                  ? `${log.method} ${typeof log.route === 'string' ? log.route : ''}`
                                  : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {'user_id' in log 
                                ? (typeof log.user_id === 'string' ? log.user_id : JSON.stringify(log.user_id))
                                : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[120px] truncate">
                              <button
                                onClick={() => {
                                  logClick('view_trace', { trace_id: log.trace_id });
                                  setSelectedTraceId(typeof log.trace_id === 'string' ? log.trace_id : JSON.stringify(log.trace_id));
                                }}
                                className="hover:underline text-primary"
                              >
                                {typeof log.trace_id === 'string' 
                                  ? `${log.trace_id.slice(0, 8)}...`
                                  : JSON.stringify(log.trace_id)}
                              </button>
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      logClick('view_log_detail', { log_id: log.id });
                                      setSelectedLog(log);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes do Log</DialogTitle>
                                    <DialogDescription>
                                      ID: {log.id}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="flex-1">
                                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                                      {JSON.stringify(log, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
