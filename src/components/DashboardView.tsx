import { Colaborador, TipoAfastamento, Tecnologia, ProcessoNegocio, Aplicacao, Runbook, CapacidadeNegocio, SLA, Habilidade, Servidor, Integracao, Comunicacao } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ListChecks, Code, GitBranch, Calendar, DeviceMobile, BookOpen, Target, ClipboardText, Certificate, ShareNetwork, HardDrives, FileText, ArrowsClockwise, Info } from '@phosphor-icons/react';
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
  onNavigate?: (view: string) => void;
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
  habilidades,
  onNavigate
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
  const { data: agingData } = useApi<{
    histogram: Array<{ faixa: string; quantidade: number; percentual: number | string }>;
    stats: { total: number; mediaIdade: number; idadeMaxima: number; idadeMinima: number; totalProjetos?: number; projetos: number | string[] };
  }>('/dashboard/aging-chart', {
    histogram: [],
    stats: { total: 0, mediaIdade: 0, idadeMaxima: 0, idadeMinima: 0, projetos: 0 }
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
    comunicacoes: comunicacoes?.length || 0,
    payloads: payloadsStats?.total || 0,
    payloadsValidos: payloadsStats?.validos || 0
  });
  
  console.log('[DashboardView] Aging Data:', {
    agingData,
    hasData: agingData?.stats?.total,
    histogramLength: agingData?.histogram?.length,
    histogramSample: agingData?.histogram?.[0]
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

  // Dados para gráfico de Habilidades por Subcategoria
  const habilidadesPorSubcategoria = habilidades.reduce((acc, h) => {
    const subcategoria = h.subcategoria || 'Não Definido';
    acc[subcategoria] = (acc[subcategoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosHabilidadesPorSubcategoria = Object.entries(habilidadesPorSubcategoria).map(([subcategoria, quantidade]) => ({
    subcategoria,
    quantidade
  }));

  // Dados para gráfico de Habilidades por Tipo
  const habilidadesPorTipo = habilidades.reduce((acc, h) => {
    const tipo = h.tipo || 'Não Definido';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosHabilidadesPorTipo = Object.entries(habilidadesPorTipo).map(([tipo, quantidade]) => ({
    tipo,
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
                    <div className="text-xs font-medium text-muted-foreground">Por Subcategoria:</div>
                    {Object.entries(habilidadesPorSubcategoria).slice(0, 5).map(([subcategoria, quantidade]) => (
                      <div key={subcategoria} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground truncate flex-1">{subcategoria}</span>
                        <span className="font-semibold ml-2">{quantidade}</span>
                      </div>
                    ))}
                    {Object.keys(habilidadesPorSubcategoria).length > 5 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{Object.keys(habilidadesPorSubcategoria).length - 5} categorias...
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

          {/* Aging Chart - Histograma de Atraso de Work Items */}
          {/* Verificar se há dados reais: total > 0 E (histogram vazio OU todas as quantidades são 0) */}
          {(!agingData || 
            !agingData.stats || 
            agingData.stats.total === 0 || 
            !agingData.histogram || 
            agingData.histogram.length === 0 ||
            agingData.histogram.every(h => h.quantidade === 0)) && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="text-blue-600" size={20} />
                  Aging Chart - Sincronizar Azure
                </CardTitle>
                <CardDescription className="text-xs">Configure a sincronização para visualizar os dados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Para visualizar o <strong>Aging Distribution Chart</strong> com os work items do Azure DevOps, você precisa:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Configurar a integração com o Azure DevOps nas configurações</li>
                    <li>Sincronizar os work items dos seus projetos</li>
                    <li>Os dados serão processados e exibidos automaticamente</li>
                  </ol>
                  <div className="flex gap-2 pt-2">
                    {onNavigate && (
                      <>
                        <Button 
                          onClick={() => onNavigate('azure-work-items')} 
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <ArrowsClockwise size={16} />
                          Sincronizar Work Items
                        </Button>
                        <Button 
                          onClick={() => onNavigate('configuracoes')} 
                          variant="outline"
                          size="sm"
                        >
                          Configurações
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {agingData && agingData.stats && agingData.stats.total > 0 && agingData.histogram && agingData.histogram.length > 0 && agingData.histogram.some(h => h.quantidade > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="text-blue-600" size={20} />
                  Aging Chart - Work Items
                </CardTitle>
                <CardDescription className="text-xs">Distribuição de work items por tempo desde criação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agingData.histogram}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="faixa" 
                        fontSize={11}
                        label={{ value: 'Faixa de Dias', position: 'insideBottom', offset: -5, fontSize: 12 }}
                      />
                      <YAxis 
                        fontSize={11}
                        label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'quantidade') {
                            return [`${value} work items (${props.payload.percentual.toFixed(1)}%)`, 'Quantidade'];
                          }
                          return [value, name];
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="quantidade" fill="#3b82f6" name="Work Items" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-bold text-blue-600">{agingData.stats.total}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Média</div>
                      <div className="text-lg font-bold">{agingData.stats.mediaIdade} dias</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Mínimo</div>
                      <div className="text-lg font-bold text-green-600">{agingData.stats.idadeMinima} dias</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Máximo</div>
                      <div className="text-lg font-bold text-red-600">{agingData.stats.idadeMaxima} dias</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Projetos</div>
                      <div className="text-lg font-bold text-purple-600">
                        {agingData.stats.totalProjetos || (Array.isArray(agingData.stats.projetos) ? agingData.stats.projetos.length : agingData.stats.projetos)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

            {/* Gráfico de Habilidades por Subcategoria */}
            {dadosHabilidadesPorSubcategoria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Habilidades por Subcategoria</CardTitle>
                  <CardDescription className="text-xs">Distribuição por subcategoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={dadosHabilidadesPorSubcategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ subcategoria, quantidade }) => `${subcategoria}: ${quantidade}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {dadosHabilidadesPorSubcategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Habilidades por Tipo */}
            {dadosHabilidadesPorTipo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Habilidades por Tipo</CardTitle>
                  <CardDescription className="text-xs">Distribuição por tipo (Hard Skills vs Soft Skills)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosHabilidadesPorTipo}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="tipo" 
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
