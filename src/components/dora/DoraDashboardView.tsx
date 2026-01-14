import { useState, useEffect } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartBarHorizontal, ArrowClockwise, TrendUp, GitBranch, GitCommit, GitPullRequest, Rocket } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  projeto: string;
  urlProjeto?: string;
}

interface DoraMetrics {
  projetoId: string;
  projetoNome: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  repositorios: Array<{
    repositorioId: string;
    repositorioNome: string;
    commits: {
      total: number;
      bugs: number;
      features: number;
      aging: {
        '0-7dias': number;
        '8-14dias': number;
        '15-30dias': number;
        'mais30dias': number;
      };
    };
    pullRequests: {
      total: number;
      leadTimeAvgMinutes: number;
      leadTimeAvgHours: number;
    };
  }>;
  autores: Record<string, {
    name: string;
    email: string;
    commits: number;
    linesAdded: number;
    linesDeleted: number;
    prs: number;
    bugCommits: number;
    featureCommits: number;
  }>;
  totais: {
    deploymentsCount: number;
    commitsCount: number;
    bugCommitsCount: number;
    featureCommitsCount: number;
    pullRequestsCount: number;
    leadTimeAvgMinutes: number;
    leadTimeAvgHours?: number;
    deploymentFrequencyPerDay: number;
  };
}

interface UnifiedMetrics {
  totalProjetos: number;
  periodo: {
    inicio: string;
    fim: string;
  };
  autores: DoraMetrics['autores'];
  totais: DoraMetrics['totais'];
  projetos: DoraMetrics[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function DoraDashboardView() {
  const { logClick, logEvent, logError } = useLogging('doradashboard-view');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<string>('unified');
  const [metrics, setMetrics] = useState<DoraMetrics | null>(null);
  const [unifiedMetrics, setUnifiedMetrics] = useState<UnifiedMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState('30'); // dias

  useEffect(() => {
    buscarProjetos();
  }, []);

  useEffect(() => {
    if (projetoSelecionado) {
      buscarMetricas();
    }
  }, [projetoSelecionado, periodo]);

  const buscarProjetos = async () => {
    try {
      logEvent('api_call_start', 'api_call');

      const response = await fetch('http://localhost:3000/api/azure-work-items/projetos');
      if (!response.ok) throw new Error('Erro ao buscar projetos');
      const data = await response.json();
      setProjetos(data.filter((p: Projeto) => p.urlProjeto));
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao buscar projetos:', error);
      toast.error('Erro ao buscar projetos');
    }
  };

  const buscarMetricas = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(periodo));

      const url = projetoSelecionado === 'unified'
        ? `http://localhost:3000/api/dora-metrics/unified?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        : `http://localhost:3000/api/dora-metrics/${projetoSelecionado}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      logEvent('api_call_start', 'api_call');


      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar métricas');
      
      const result = await response.json();
      
      if (projetoSelecionado === 'unified') {
        setUnifiedMetrics(result.data);
        setMetrics(null);
      } else {
        setMetrics(result.data);
        setUnifiedMetrics(null);
      }

      toast.success('Métricas atualizadas com sucesso!');
    } catch (error: any) {
      logError(error as Error, 'error_caught');
      console.error('Erro ao buscar métricas:', error);
      toast.error(`Erro ao buscar métricas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  const currentData = unifiedMetrics || metrics;
  const isUnified = projetoSelecionado === 'unified';

  // Preparar dados para gráfico de Commits por Tipo
  const commitsTypeData = currentData ? [
    { name: 'Features', value: currentData.totais.featureCommitsCount, fill: '#00C49F' },
    { name: 'Bugs', value: currentData.totais.bugCommitsCount, fill: '#FF8042' },
    { name: 'Outros', value: currentData.totais.commitsCount - currentData.totais.featureCommitsCount - currentData.totais.bugCommitsCount, fill: '#0088FE' }
  ] : [];

  // Preparar dados para gráfico de Aging (apenas para projeto individual)
  const agingData = metrics?.repositorios.reduce((acc, repo) => {
    acc['0-7dias'] = (acc['0-7dias'] || 0) + repo.commits.aging['0-7dias'];
    acc['8-14dias'] = (acc['8-14dias'] || 0) + repo.commits.aging['8-14dias'];
    acc['15-30dias'] = (acc['15-30dias'] || 0) + repo.commits.aging['15-30dias'];
    acc['mais30dias'] = (acc['mais30dias'] || 0) + repo.commits.aging['mais30dias'];
    return acc;
  }, {} as Record<string, number>);

  const agingChartData = agingData ? [
    { name: '0-7 dias', commits: agingData['0-7dias'] },
    { name: '8-14 dias', commits: agingData['8-14dias'] },
    { name: '15-30 dias', commits: agingData['15-30dias'] },
    { name: '+30 dias', commits: agingData['mais30dias'] }
  ] : [];

  // Preparar dados para gráfico de Commits por Autor
  const autoresArray = currentData?.autores ? Object.values(currentData.autores) : [];
  const commitsPorAutorData = autoresArray
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10)
    .map(autor => ({
      name: autor.name.split(' ')[0], // Apenas primeiro nome
      commits: autor.commits
    }));

  // Preparar dados para LOC Churn por Autor
  const locChurnData = autoresArray
    .sort((a, b) => (b.linesAdded + b.linesDeleted) - (a.linesAdded + a.linesDeleted))
    .slice(0, 10)
    .map(autor => ({
      name: autor.name.split(' ')[0],
      adicionadas: autor.linesAdded,
      removidas: autor.linesDeleted,
      total: autor.linesAdded + autor.linesDeleted
    }));

  // Preparar dados para Percentual de Contribuição
  const totalCommits = autoresArray.reduce((sum, a) => sum + a.commits, 0);
  const contribuicaoData = autoresArray
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 8)
    .map((autor, idx) => ({
      name: autor.name.split(' ')[0],
      commits: autor.commits,
      percentual: totalCommits > 0 ? ((autor.commits / totalCommits) * 100) : 0,
      fill: COLORS[idx % COLORS.length]
    }));

  // Calcular Impact Score (métrica composta)
  const impactScoreData = autoresArray
    .map(autor => {
      // Score = commits * 1 + (linesAdded + linesDeleted) * 0.01 + prs * 5
      const commitScore = autor.commits * 1;
      const locScore = (autor.linesAdded + autor.linesDeleted) * 0.01;
      const prScore = autor.prs * 5;
      const totalScore = commitScore + locScore + prScore;

      return {
        name: autor.name,
        commits: autor.commits,
        loc: autor.linesAdded + autor.linesDeleted,
        prs: autor.prs,
        score: Math.round(totalScore),
        bugCommits: autor.bugCommits,
        featureCommits: autor.featureCommits
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(autor => ({
      ...autor,
      name: autor.name.split(' ')[0]
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard DORA</h1>
        <p className="text-muted-foreground mt-2">
          Métricas de DevOps Research and Assessment (DORA) para análise de performance
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o projeto e período para análise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seleção de Projeto */}
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={projetoSelecionado} onValueChange={setProjetoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unified">🌐 Todos os Projetos (Unificado)</SelectItem>
                  {projetos.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projeto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Atualizar */}
            <div className="flex items-end">
              <Button 
                onClick={buscarMetricas} 
                disabled={loading || !projetoSelecionado}
                className="w-full"
              >
                <ArrowClockwise className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar Métricas'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      {currentData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Deployment Frequency */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployment Frequency</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentData.totais.deploymentFrequencyPerDay.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">deploys/dia</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: {currentData.totais.deploymentsCount} deploys
                </p>
              </CardContent>
            </Card>

            {/* Lead Time for Changes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Time for Changes</CardTitle>
                <TrendUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentData.totais.leadTimeAvgHours?.toFixed(1) || 0}h
                </div>
                <p className="text-xs text-muted-foreground">
                  tempo médio de entrega
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatarTempo(currentData.totais.leadTimeAvgMinutes)}
                </p>
              </CardContent>
            </Card>

            {/* Total de Commits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Commits</CardTitle>
                <GitCommit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentData.totais.commitsCount}
                </div>
                <p className="text-xs text-muted-foreground">commits na branch main</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">✓ {currentData.totais.featureCommitsCount} features</span>
                  <span className="text-red-600">✗ {currentData.totais.bugCommitsCount} bugs</span>
                </div>
              </CardContent>
            </Card>

            {/* Pull Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentData.totais.pullRequestsCount}
                </div>
                <p className="text-xs text-muted-foreground">PRs completos</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Commits por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Commits por Tipo</CardTitle>
                <CardDescription>Distribuição de commits por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={commitsTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {commitsTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Aging (só para projeto individual) */}
            {!isUnified && agingChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Aging de Commits</CardTitle>
                  <CardDescription>Distribuição por idade dos commits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agingChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="commits" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Novos Gráficos de Análise de Contribuições */}
          {autoresArray.length > 0 && (
            <>
              <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Análise de Contribuições por Autor</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Número de Commits por Autor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Commits por Autor</CardTitle>
                    <CardDescription>Top 10 autores com mais commits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={commitsPorAutorData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="commits" fill="#0088FE" name="Commits" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. Linhas de Código Alteradas (LOC Churn) */}
                <Card>
                  <CardHeader>
                    <CardTitle>LOC Churn por Autor</CardTitle>
                    <CardDescription>Linhas adicionadas e removidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={locChurnData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="adicionadas" stackId="a" fill="#00C49F" name="Adicionadas" />
                        <Bar dataKey="removidas" stackId="a" fill="#FF8042" name="Removidas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 3. Percentual de Contribuição por Autor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Percentual de Contribuição</CardTitle>
                    <CardDescription>Distribuição de commits entre autores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={contribuicaoData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.percentual.toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="commits"
                        >
                          {contribuicaoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [
                          `${value} commits (${props.payload.percentual.toFixed(1)}%)`,
                          'Commits'
                        ]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 4. Impact Score - Métrica Composta */}
                <Card>
                  <CardHeader>
                    <CardTitle>Impact Score</CardTitle>
                    <CardDescription>Métrica composta (commits + LOC + PRs)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={impactScoreData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                  <p className="font-bold">{data.name}</p>
                                  <p className="text-sm">Score: {data.score}</p>
                                  <p className="text-sm">Commits: {data.commits}</p>
                                  <p className="text-sm">LOC: {data.loc.toLocaleString()}</p>
                                  <p className="text-sm">PRs: {data.prs}</p>
                                  <p className="text-sm text-green-600">Features: {data.featureCommits}</p>
                                  <p className="text-sm text-red-600">Bugs: {data.bugCommits}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="score" fill="#FFBB28" name="Impact Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 5. Tabela de Ownership de Código (Blame-based) */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Ownership de Código (Análise de Contribuições)</CardTitle>
                  <CardDescription>Detalhamento completo das contribuições por autor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Autor</TableHead>
                          <TableHead className="text-right">Commits</TableHead>
                          <TableHead className="text-right">LOC+</TableHead>
                          <TableHead className="text-right">LOC-</TableHead>
                          <TableHead className="text-right">Churn Total</TableHead>
                          <TableHead className="text-right">PRs</TableHead>
                          <TableHead className="text-right">Features</TableHead>
                          <TableHead className="text-right">Bugs</TableHead>
                          <TableHead className="text-right">Impact Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {autoresArray
                          .map(autor => ({
                            ...autor,
                            churnTotal: autor.linesAdded + autor.linesDeleted,
                            impactScore: Math.round(
                              autor.commits * 1 +
                              (autor.linesAdded + autor.linesDeleted) * 0.01 +
                              autor.prs * 5
                            )
                          }))
                          .sort((a, b) => b.impactScore - a.impactScore)
                          .map(autor => (
                            <TableRow key={autor.email}>
                              <TableCell className="font-medium">{autor.name}</TableCell>
                              <TableCell className="text-right">{autor.commits}</TableCell>
                              <TableCell className="text-right text-green-600">
                                +{autor.linesAdded.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                -{autor.linesDeleted.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {autor.churnTotal.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">{autor.prs}</TableCell>
                              <TableCell className="text-right text-green-600">
                                {autor.featureCommits}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {autor.bugCommits}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {autor.impactScore}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Tabela de Repositórios (só para projeto individual) */}
          {!isUnified && metrics?.repositorios && metrics.repositorios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Repositório</CardTitle>
                <CardDescription>Métricas individuais de cada repositório</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Repositório</TableHead>
                        <TableHead className="text-right">Commits</TableHead>
                        <TableHead className="text-right">Bugs</TableHead>
                        <TableHead className="text-right">Features</TableHead>
                        <TableHead className="text-right">PRs</TableHead>
                        <TableHead className="text-right">Lead Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.repositorios.map(repo => (
                        <TableRow key={repo.repositorioId}>
                          <TableCell className="font-medium">{repo.repositorioNome}</TableCell>
                          <TableCell className="text-right">{repo.commits.total}</TableCell>
                          <TableCell className="text-right text-red-600">{repo.commits.bugs}</TableCell>
                          <TableCell className="text-right text-green-600">{repo.commits.features}</TableCell>
                          <TableCell className="text-right">{repo.pullRequests.total}</TableCell>
                          <TableCell className="text-right">{repo.pullRequests.leadTimeAvgHours.toFixed(1)}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Projetos (só para visão unificada) */}
          {isUnified && unifiedMetrics?.projetos && unifiedMetrics.projetos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Métricas por Projeto</CardTitle>
                <CardDescription>Visão consolidada de todos os projetos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projeto</TableHead>
                        <TableHead className="text-right">Commits</TableHead>
                        <TableHead className="text-right">Bugs</TableHead>
                        <TableHead className="text-right">Features</TableHead>
                        <TableHead className="text-right">PRs</TableHead>
                        <TableHead className="text-right">Lead Time</TableHead>
                        <TableHead className="text-right">Deploys</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unifiedMetrics.projetos.map(proj => (
                        <TableRow key={proj.projetoId}>
                          <TableCell className="font-medium">{proj.projetoNome}</TableCell>
                          <TableCell className="text-right">{proj.totais.commitsCount}</TableCell>
                          <TableCell className="text-right text-red-600">{proj.totais.bugCommitsCount}</TableCell>
                          <TableCell className="text-right text-green-600">{proj.totais.featureCommitsCount}</TableCell>
                          <TableCell className="text-right">{proj.totais.pullRequestsCount}</TableCell>
                          <TableCell className="text-right">{proj.totais.leadTimeAvgHours?.toFixed(1) || 0}h</TableCell>
                          <TableCell className="text-right">{proj.totais.deploymentsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Mensagem quando não há dados */}
      {!currentData && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <ChartBarHorizontal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Selecione um projeto e clique em "Atualizar Métricas" para visualizar os dados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
