import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ClockCounterClockwise, MagnifyingGlass, User, Download } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatarData } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LogOperacao {
  id: string;
  usuario_id: string;
  email: string;
  tipo_evento: string;
  ip_origem: string;
  user_agent: string;
  sucesso: boolean;
  detalhes: string | null;
  created_at: string;
}

interface Usuario {
  id: string;
  login: string;
  colaborador_nome: string;
  status: string;
}

export function LogsOperacoesView() {
  const hoje = new Date();
  const dataInicioDefault = new Date(hoje.setDate(hoje.getDate() - 30)).toISOString().split('T')[0];
  const dataFimDefault = new Date().toISOString().split('T')[0];
  
  const [dataInicio, setDataInicio] = useState(dataInicioDefault);
  const [dataFim, setDataFim] = useState(dataFimDefault);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>('TODOS_USUARIOS');
  const [tipoEvento, setTipoEvento] = useState<string>('TODOS');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogOperacao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  // Carregar lista de usuários ao montar componente
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios-seguranca`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handlePesquisar = async () => {
    if (!dataInicio || !dataFim) {
      toast.error('Preencha as datas de início e término');
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error('Data de início deve ser anterior à data de término');
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        ...(usuarioSelecionado !== 'TODOS_USUARIOS' && { usuarioId: usuarioSelecionado }),
        ...(tipoEvento !== 'TODOS' && { tipoEvento }),
      });

      const response = await fetch(`${API_URL}/api/pesquisa/logs-operacoes?${params}`);
      
      if (!response.ok) throw new Error('Erro ao buscar logs');
      
      const data = await response.json();
      setLogs(data);
      setPesquisaRealizada(true);

      toast.success(`${data.length} registro(s) encontrado(s)`);
    } catch (error) {
      console.error('Erro ao pesquisar:', error);
      toast.error('Erro ao realizar pesquisa');
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    if (logs.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const csv = [
      ['Data/Hora', 'Usuário', 'Email', 'Tipo Evento', 'Sucesso', 'IP Origem', 'User Agent', 'Detalhes'].join(';'),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.email,
        log.email,
        log.tipo_evento,
        log.sucesso ? 'Sim' : 'Não',
        log.ip_origem || '',
        log.user_agent || '',
        log.detalhes || ''
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_operacoes_${dataInicio}_${dataFim}.csv`;
    link.click();

    toast.success('Arquivo exportado com sucesso');
  };

  const getTipoEventoBadge = (tipo: string, sucesso: boolean) => {
    if (!sucesso) {
      return <Badge variant="destructive">{tipo}</Badge>;
    }

    switch (tipo) {
      case 'LOGIN':
        return <Badge variant="default" className="bg-green-600">{tipo}</Badge>;
      case 'LOGOUT':
        return <Badge variant="secondary">{tipo}</Badge>;
      case 'LOGIN_FAILED':
        return <Badge variant="destructive">{tipo}</Badge>;
      case 'BLOCKED':
        return <Badge variant="destructive">{tipo}</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold">Logs de Operações</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwise size={24} />
            Consulta de Logs de Operações de Usuários
          </CardTitle>
          <CardDescription>
            Consulte e exporte logs de acesso e operações realizadas pelos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Término</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Select value={usuarioSelecionado} onValueChange={setUsuarioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS_USUARIOS">Todos os usuários</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.colaborador_nome} ({usuario.login})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoEvento">Tipo de Evento</Label>
              <Select value={tipoEvento} onValueChange={setTipoEvento}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Falha de Login</SelectItem>
                  <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePesquisar} disabled={loading}>
              <MagnifyingGlass className="mr-2" />
              {loading ? 'Pesquisando...' : 'Pesquisar'}
            </Button>

            {pesquisaRealizada && logs.length > 0 && (
              <Button onClick={handleExportar} variant="outline">
                <Download className="mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {pesquisaRealizada && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Pesquisa</CardTitle>
            <CardDescription>
              {logs.length} registro(s) encontrado(s) no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado para os critérios informados
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Origem</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            {log.email.split('@')[0]}
                          </div>
                        </TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>{getTipoEventoBadge(log.tipo_evento, log.sucesso)}</TableCell>
                        <TableCell>
                          {log.sucesso ? (
                            <Badge variant="default" className="bg-green-600">Sucesso</Badge>
                          ) : (
                            <Badge variant="destructive">Falha</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ip_origem || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {log.detalhes || '-'}
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
    </div>
  );
}
