import { Colaborador, TipoAfastamento, Tecnologia, ProcessoNegocio, Aplicacao, Runbook, CapacidadeNegocio, SLA, Habilidade, Servidor, Integracao, Comunicacao } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListChecks, Code, GitBranch, Calendar, DeviceMobile, BookOpen, Target, ClipboardText, Certificate, ShareNetwork, HardDrives, FileText } from '@phosphor-icons/react';
import { useLogging } from '@/hooks/use-logging';
import { AplicacoesDashboard } from './AplicacoesDashboard';
import { useApi } from '@/hooks/use-api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardViewProps {
  colaboradores: Colaborador[];
  tiposAfastamento: TipoAfastamento[];
  tecnologias: Tecnologia[];
  processos: ProcessoNegocio[];
  aplicacoes: Aplicacao[];
  runbooks: Runbook[];
  capacidades: CapacidadeNegocio[];
  slas: SLA[];
  habilidades: Habilidade[];
}

export function DashboardView({ 
  colaboradores, 
  tiposAfastamento, 
  tecnologias, 
  processos,
  aplicacoes,
  runbooks,
  capacidades,
  slas,
  habilidades
}: DashboardViewProps) {
  const { logClick } = useLogging('dashboard');
  const { data: integracoes } = useApi<Integracao[]>('/integracoes', []);
  const { data: comunicacoes } = useApi<Comunicacao[]>('/comunicacoes', []);
  const { data: servidores } = useApi<Servidor[]>('/servidores', []);
  const { data: payloadsStats } = useApi<{
    total: number;
    validos: number;
    invalidos: number;
    json: number;
    yaml: number;
    ativos: number;
    descontinuados: number;
  }>('/payloads/stats/summary', {
    total: 0,
    validos: 0,
    invalidos: 0,
    json: 0,
    yaml: 0,
    ativos: 0,
    descontinuados: 0
  });
  
  console.log('[DashboardView] Dados recebidos:', {
    colaboradores: colaboradores?.length || 0,
    tiposAfastamento: tiposAfastamento?.length || 0,
    tecnologias: tecnologias?.length || 0,
    processos: processos?.length || 0,
    aplicacoes: aplicacoes?.length || 0,
    runbooks: runbooks?.length || 0,
    capacidades: capacidades?.length || 0,
    slas: slas?.length || 0,
    habilidades: habilidades?.length || 0,
    integracoes: integracoes?.length || 0,
    servidores: servidores?.length || 0,
    comunicacoes: comunicacoes?.length || 0
  });
  
  const colaboradoresAtivos = colaboradores.filter(c => !c.dataDemissao).length;
  const totalAfastamentos = colaboradores.reduce((acc, c) => acc + (c.afastamentos?.length || 0), 0);
  const tecnologiasAtivas = tecnologias.filter(t => t.status === 'Ativa').length;
  const processosCount = processos.length;
  const aplicacoesCount = aplicacoes.length;
  const runbooksCount = runbooks.length;
  const capacidadesCount = capacidades.length;
  const slasAtivos = slas.filter(s => s.status === 'Ativo').length;
  const habilidadesCount = habilidades.length;
  const integracoesCount = integracoes?.length || 0;
  const servidoresCount = servidores?.length || 0;
  const servidoresAtivos = servidores?.filter(s => s.status === 'Ativo').length || 0;
  const comunicacoesCount = comunicacoes?.length || 0;
  const payloadsValidos = payloadsStats?.validos || 0;
  const payloadsTotal = payloadsStats?.total || 0;

  // Dados para gráfico de Cloud Provider
  const aplicacoesPorCloudProvider = aplicacoes.reduce((acc, a) => {
    const provider = a.cloudProvider || 'Não Definido';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosCloudProvider = Object.entries(aplicacoesPorCloudProvider).map(([provider, quantidade]) => ({
    provider,
    quantidade
  }));

  // Dados para gráfico de Runbooks por Tipo
  const runbooksPorTipo = runbooks.reduce((acc, r) => {
    const tipo = r.tipoRunbook || 'Não Definido';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosRunbooksPorTipo = Object.entries(runbooksPorTipo).map(([tipo, quantidade]) => ({
    tipo,
    quantidade
  }));

  // Dados para gráfico de Habilidades por Categoria
  const habilidadesPorCategoria = habilidades.reduce((acc, h) => {
    const categoria = h.categoria || 'Não Definido';
    acc[categoria] = (acc[categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosHabilidadesPorCategoria = Object.entries(habilidadesPorCategoria).map(([categoria, quantidade]) => ({
    categoria,
    quantidade
  }));

  // Dados para gráfico de Habilidades por Nível
  const habilidadesPorNivel = habilidades.reduce((acc, h) => {
    const nivel = h.nivel || 'Não Definido';
    acc[nivel] = (acc[nivel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosHabilidadesPorNivel = Object.entries(habilidadesPorNivel).map(([nivel, quantidade]) => ({
    nivel,
    quantidade
  }));

  // Cores para gráficos
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444'];

  const stats = [
    {
      title: 'Colaboradores',
      value: colaboradoresAtivos,
      total: colaboradores.length,
      description: 'colaboradores ativos',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tecnologias',
      value: tecnologiasAtivas,
      total: tecnologias.length,
      description: 'tecnologias ativas',
      icon: Code,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Integrações',
      value: integracoesCount,
      total: null,
      description: 'integrações cadastradas',
      icon: ShareNetwork,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Comunicações',
      value: comunicacoesCount,
      total: null,
      description: 'comunicações ativas',
      icon: ListChecks,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Servidores',
      value: servidoresAtivos,
      total: servidoresCount,
      description: 'servidores ativos',
      icon: HardDrives,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
    {
      title: 'Payloads',
      value: payloadsValidos,
      total: payloadsTotal,
      description: 'payloads válidos',
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Processos',
      value: processosCount,
      total: null,
      description: 'processos de negócio',
      icon: GitBranch,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Capacidades',
      value: capacidadesCount,
      total: null,
      description: 'capacidades cadastradas',
      icon: Target,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Habilidades',
      value: habilidadesCount,
      total: null,
      description: 'habilidades cadastradas',
      icon: Certificate,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      title: 'SLAs',
      value: slasAtivos,
      total: slas.length,
      description: 'SLAs ativos',
      icon: ClipboardText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Runbooks',
      value: runbooksCount,
      total: null,
      description: 'runbooks cadastrados',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Afastamentos',
      value: totalAfastamentos,
      total: null,
      description: 'registros totais',
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <div className="container mx-auto px-3 py-2 max-w-7xl flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-[10px]">
              Visão geral do sistema de auditoria e gestão
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Cards de Contadores */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-1.5 rounded ${stat.bgColor}`}>
                      <Icon className={stat.color} size={16} />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-2xl font-bold">
                      {stat.value}
                      {stat.total && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          / {stat.total}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dashboard de Aplicações com Gráficos Detalhados */}
          <AplicacoesDashboard />

          {/* Cards de Estatísticas Detalhadas */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Card de Runbooks Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="text-orange-600" size={20} />
                  Runbooks - Detalhamento
                </CardTitle>
                <CardDescription className="text-xs">Análise dos runbooks cadastrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total de Runbooks</span>
                    <span className="text-2xl font-bold text-orange-600">{runbooksCount}</span>
                  </div>
                  {Object.entries(runbooksPorTipo).map(([tipo, quantidade]) => (
                    <div key={tipo} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{tipo}</span>
                      <span className="font-semibold">{quantidade}</span>
                    </div>
                  ))}
                  {runbooksCount === 0 && (
                    <p className="text-xs text-muted-foreground italic">Nenhum runbook cadastrado ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Habilidades Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Certificate className="text-violet-600" size={20} />
                  Habilidades - Detalhamento
                </CardTitle>
                <CardDescription className="text-xs">Análise das habilidades cadastradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm font-medium">Total de Habilidades</span>
                    <span className="text-2xl font-bold text-violet-600">{habilidadesCount}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Por Categoria:</div>
                    {Object.entries(habilidadesPorCategoria).slice(0, 5).map(([categoria, quantidade]) => (
                      <div key={categoria} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground truncate flex-1">{categoria}</span>
                        <span className="font-semibold ml-2">{quantidade}</span>
                      </div>
                    ))}
                    {Object.keys(habilidadesPorCategoria).length > 5 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{Object.keys(habilidadesPorCategoria).length - 5} categorias...
                      </div>
                    )}
                  </div>
                  {habilidadesCount === 0 && (
                    <p className="text-xs text-muted-foreground italic">Nenhuma habilidade cadastrada ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Análise */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfico de Cloud Provider */}
            {dadosCloudProvider.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cloud Provider</CardTitle>
                  <CardDescription className="text-xs">Distribuição por provedor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dadosCloudProvider}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ provider, quantidade }) => `${provider}: ${quantidade}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {dadosCloudProvider.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Runbooks por Tipo */}
            {dadosRunbooksPorTipo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Runbooks por Tipo</CardTitle>
                  <CardDescription className="text-xs">Distribuição de runbooks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosRunbooksPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="tipo" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Habilidades por Categoria */}
            {dadosHabilidadesPorCategoria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Habilidades por Categoria</CardTitle>
                  <CardDescription className="text-xs">Distribuição por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dadosHabilidadesPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ categoria, quantidade }) => `${categoria}: ${quantidade}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {dadosHabilidadesPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Habilidades por Nível */}
            {dadosHabilidadesPorNivel.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Habilidades por Nível</CardTitle>
                  <CardDescription className="text-xs">Distribuição por nível de proficiência</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosHabilidadesPorNivel}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nivel" 
                        fontSize={10}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
