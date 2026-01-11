import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiGet, apiPost } from '@/hooks/use-api';
import { toast } from 'sonner';
import { 
  ArrowsClockwise, 
  Database, 
  CheckCircle, 
  XCircle, 
  Warning,
  Clock,
  Info
} from '@phosphor-icons/react';

interface MasterStatus {
  status: string;
  server_id: string;
  binlog_enabled: boolean;
  master_status: {
    File: string;
    Position: number;
  } | null;
  slave_connections: number;
  slaves: Array<{
    host: string;
    state: string;
    time: number;
  }>;
  timestamp: string;
}

interface SlaveStatus {
  status: string;
  server_id: string;
  slave_io_running: string;
  slave_sql_running: string;
  seconds_behind_master: number | null;
  master_host: string;
  master_port: number;
  master_log_file: string;
  read_master_log_pos: number;
  relay_log_file: string;
  relay_log_pos: number;
  last_io_error: string;
  last_sql_error: string;
  timestamp: string;
  message?: string;
}

interface TestResult {
  status: string;
  test_message: string;
  replicated: boolean;
  replication_data: any;
  message: string;
  timestamp: string;
}

export function SincronismoView() {
  const [masterStatus, setMasterStatus] = useState<MasterStatus | null>(null);
  const [slaveStatus, setSlaveStatus] = useState<SlaveStatus | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [master, slave] = await Promise.all([
        apiGet<MasterStatus>('/sincronismo/master'),
        apiGet<SlaveStatus>('/sincronismo/slave')
      ]);
      setMasterStatus(master);
      setSlaveStatus(slave);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast.error('Erro ao carregar status de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const testReplication = async () => {
    setTesting(true);
    try {
      const result = await apiPost<TestResult>('/sincronismo/test', {});
      setTestResult(result);
      if (result.replicated) {
        toast.success('Teste de replicação bem-sucedido!');
      } else {
        toast.error('Falha no teste de replicação');
      }
      // Recarregar status após teste
      await loadStatus();
    } catch (error) {
      console.error('Erro ao testar replicação:', error);
      toast.error('Erro ao executar teste de replicação');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getReplicationStatus = () => {
    if (!slaveStatus) return { status: 'unknown', color: 'gray', text: 'Desconhecido' };
    
    if (slaveStatus.status === 'not_configured') {
      return { status: 'not_configured', color: 'gray', text: 'Não Configurado' };
    }
    
    const isOk = slaveStatus.slave_io_running === 'Yes' && slaveStatus.slave_sql_running === 'Yes';
    
    if (isOk && slaveStatus.seconds_behind_master === 0) {
      return { status: 'synced', color: 'green', text: 'Sincronizado' };
    } else if (isOk && slaveStatus.seconds_behind_master !== null && slaveStatus.seconds_behind_master > 0) {
      return { status: 'lagging', color: 'yellow', text: `Atrasado (${slaveStatus.seconds_behind_master}s)` };
    } else {
      return { status: 'error', color: 'red', text: 'Erro na Replicação' };
    }
  };

  const replicationStatus = getReplicationStatus();

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database size={32} weight="duotone" className="text-primary" />
            Sincronismo MySQL
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento da replicação Master-Slave
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <CheckCircle className="mr-2" size={16} weight="fill" />
                Auto-Refresh ON
              </>
            ) : (
              <>
                <Clock className="mr-2" size={16} />
                Auto-Refresh OFF
              </>
            )}
          </Button>
          <Button onClick={loadStatus} disabled={loading} size="sm">
            <ArrowsClockwise className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            Atualizar
          </Button>
          <Button onClick={testReplication} disabled={testing} size="sm" variant="default">
            <Info className="mr-2" size={16} />
            {testing ? 'Testando...' : 'Testar Replicação'}
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status Geral da Replicação</span>
            <Badge
              variant="outline"
              className={`text-lg px-4 py-2 ${
                replicationStatus.status === 'synced'
                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200'
                  : replicationStatus.status === 'lagging'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200'
                  : replicationStatus.status === 'error'
                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200'
                  : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200'
              }`}
            >
              {replicationStatus.status === 'synced' && <CheckCircle className="mr-2" size={20} weight="fill" />}
              {replicationStatus.status === 'lagging' && <Warning className="mr-2" size={20} weight="fill" />}
              {replicationStatus.status === 'error' && <XCircle className="mr-2" size={20} weight="fill" />}
              {replicationStatus.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Conexões Slave</p>
              <p className="text-3xl font-bold mt-2">{masterStatus?.slave_connections || 0}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Atraso (segundos)</p>
              <p className="text-3xl font-bold mt-2">
                {slaveStatus?.seconds_behind_master ?? 'N/A'}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Binlog Ativado</p>
              <p className="text-3xl font-bold mt-2">
                {masterStatus?.binlog_enabled ? (
                  <CheckCircle size={32} weight="fill" className="text-green-600 mx-auto" />
                ) : (
                  <XCircle size={32} weight="fill" className="text-red-600 mx-auto" />
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Master Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={24} weight="duotone" className="text-blue-600" />
              Master Database
            </CardTitle>
            <CardDescription>Servidor principal de escrita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {masterStatus ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Server ID</span>
                    <Badge variant="outline">{masterStatus.server_id}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Binlog File</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {masterStatus.master_status?.File || 'N/A'}
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Binlog Position</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {masterStatus.master_status?.Position || 'N/A'}
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">Slaves Conectados</span>
                    <Badge variant={masterStatus.slave_connections > 0 ? "default" : "secondary"}>
                      {masterStatus.slave_connections}
                    </Badge>
                  </div>
                </div>

                {masterStatus.slaves && masterStatus.slaves.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Slaves Ativos:</p>
                    <div className="space-y-2">
                      {masterStatus.slaves.map((slave, idx) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{slave.host}</span>
                            <span className="text-muted-foreground">{slave.time}s</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{slave.state}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Carregando...' : 'Dados não disponíveis'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slave Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={24} weight="duotone" className="text-green-600" />
              Slave Database
            </CardTitle>
            <CardDescription>Servidor de leitura (réplica)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {slaveStatus ? (
              <>
                {slaveStatus.status === 'not_configured' ? (
                  <div className="text-center py-8">
                    <Warning size={48} className="mx-auto mb-4 text-yellow-600" />
                    <p className="text-muted-foreground">{slaveStatus.message}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Server ID</span>
                        <Badge variant="outline">{slaveStatus.server_id}</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Slave IO Running</span>
                        <Badge variant={slaveStatus.slave_io_running === 'Yes' ? 'default' : 'destructive'}>
                          {slaveStatus.slave_io_running}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Slave SQL Running</span>
                        <Badge variant={slaveStatus.slave_sql_running === 'Yes' ? 'default' : 'destructive'}>
                          {slaveStatus.slave_sql_running}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Master</span>
                        <span className="text-sm">{slaveStatus.master_host}:{slaveStatus.master_port}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Master Log File</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {slaveStatus.master_log_file}
                        </code>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">Read Position</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {slaveStatus.read_master_log_pos}
                        </code>
                      </div>
                    </div>

                    {(slaveStatus.last_io_error || slaveStatus.last_sql_error) && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Erros:</p>
                        {slaveStatus.last_io_error && (
                          <p className="text-xs text-red-700 dark:text-red-300">IO: {slaveStatus.last_io_error}</p>
                        )}
                        {slaveStatus.last_sql_error && (
                          <p className="text-xs text-red-700 dark:text-red-300">SQL: {slaveStatus.last_sql_error}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Carregando...' : 'Dados não disponíveis'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Result */}
      {testResult && (
        <Card className={`border-2 ${testResult.replicated ? 'border-green-500' : 'border-red-500'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.replicated ? (
                <CheckCircle size={24} weight="fill" className="text-green-600" />
              ) : (
                <XCircle size={24} weight="fill" className="text-red-600" />
              )}
              Resultado do Teste de Replicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={testResult.replicated ? 'default' : 'destructive'}>
                  {testResult.replicated ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mensagem de Teste</span>
                <code className="text-xs bg-muted px-2 py-1 rounded max-w-md truncate">
                  {testResult.test_message}
                </code>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{testResult.message}</p>
              </div>
              {testResult.replication_data && (
                <div className="text-xs text-muted-foreground">
                  <p>Dados replicados em: {new Date(testResult.replication_data.created_at).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
