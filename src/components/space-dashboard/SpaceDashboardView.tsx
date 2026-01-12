import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpaceDashboardData, SpaceFilter } from '@/types/space';
import SatisfactionPanel from './SatisfactionPanel';
import PerformancePanel from './PerformancePanel';
import ActivityPanel from './ActivityPanel';
import CommunicationPanel from './CommunicationPanel';
import EfficiencyPanel from './EfficiencyPanel';
import { Loader2, RefreshCw, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SpaceDashboardView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<SpaceDashboardData | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Filtros
  const [filter, setFilter] = useState<SpaceFilter>({
    projectName: '',
    startDate: getLastMonthStart(),
    endDate: getTodayDate(),
    sprint: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/estruturas-projeto');
      const data = await response.json();
      // Filtrar apenas projetos que foram processados (integrados ao Azure DevOps)
      const processedProjects = (data || []).filter((p: any) => p.status === 'Processado');
      console.log('[SPACE] Projetos disponíveis:', processedProjects.length, 'de', data?.length || 0);
      setProjects(processedProjects);
      
      if (processedProjects.length === 0) {
        console.warn('[SPACE] Nenhum projeto processado encontrado. Integre projetos no Gerador de Projetos primeiro.');
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const loadDashboard = async () => {
    if (!filter.projectName) {
      alert('Selecione um projeto');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        projectName: filter.projectName,
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(filter.sprint && { sprint: filter.sprint })
      });
      
      const response = await fetch(`/api/space-dashboard?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard SPACE:', error);
      alert('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard SPACE</h1>
          <p className="text-muted-foreground">
            Satisfaction · Performance · Activity · Communication · Efficiency
          </p>
        </div>
        <Button onClick={loadDashboard} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-white border text-black">
        <Info className="h-4 w-4 text-black" />
        <AlertTitle className="text-black">Framework SPACE</AlertTitle>
        <AlertDescription className="text-black">
          Métricas agregadas por time para medir produtividade sustentável, saúde e eficiência de entrega.
          Nenhuma métrica individual é exposta.
        </AlertDescription>
      </Alert>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            {projects.length === 0 
              ? 'Nenhum projeto integrado ao Azure DevOps encontrado. Primeiro, integre projetos no Gerador de Projetos.'
              : 'Selecione o projeto e período para análise'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Projeto *</Label>
              <Select 
                value={filter.projectName} 
                onValueChange={(v) => setFilter({ ...filter, projectName: v })}
                disabled={projects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={projects.length === 0 ? "Nenhum projeto disponível" : "Selecione..."} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.projeto}>
                      {p.projeto} - {p.produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-amber-600">
                  ⚠️ Projetos precisam ter status "Processado" para aparecer aqui
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sprint (opcional)</Label>
              <Input
                placeholder="Sprint 1"
                value={filter.sprint || ''}
                onChange={(e) => setFilter({ ...filter, sprint: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando métricas do Azure DevOps...</span>
        </div>
      )}

      {/* Verificar se o dashboard está vazio */}
      {!loading && dashboardData && (dashboardData as any).isEmpty && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem dados disponíveis</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{(dashboardData as any).message || 'Nenhum work item encontrado para este projeto.'}</p>
            <strong>Possíveis causas:</strong>
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              <li>O projeto não existe no Azure DevOps com este nome exato</li>
              <li>O projeto não possui work items criados no período selecionado</li>
              <li>As credenciais do Azure DevOps podem estar incorretas</li>
              <li>Verifique o nome do projeto em Configurações &gt; Azure DevOps</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!loading && dashboardData && !(dashboardData as any).isEmpty && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">eNPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.satisfaction.enps}</div>
                  <p className="text-xs text-muted-foreground">Satisfação do Time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.performance.deliveryRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.performance.workItemsDelivered}/{dashboardData.performance.workItemsPlanned}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">PRs Mergeados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activity.pullRequestsMerged}</div>
                  <p className="text-xs text-muted-foreground">de {dashboardData.activity.pullRequestsCreated} criados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Review Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.communication.avgPrReviewTime.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Tempo médio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.efficiency.cycleTime.toFixed(1)} dias</div>
                  <p className="text-xs text-muted-foreground">Lead: {dashboardData.efficiency.leadTime.toFixed(1)}d</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Insights Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  ✅ <strong>Performance:</strong> Time entregou {dashboardData.performance.deliveryRate}% do planejado
                </p>
                <p className="text-sm">
                  {dashboardData.communication.blockedItems > 0 ? '⚠️' : '✅'} 
                  <strong> Fluxo:</strong> {dashboardData.communication.blockedItems} itens bloqueados
                </p>
                <p className="text-sm">
                  {dashboardData.performance.criticalBugs > 3 ? '⚠️' : '✅'} 
                  <strong> Qualidade:</strong> {dashboardData.performance.criticalBugs} bugs críticos abertos
                </p>
                <p className="text-sm">
                  {dashboardData.satisfaction.enps >= 30 ? '✅' : '⚠️'} 
                  <strong> Satisfação:</strong> eNPS em {dashboardData.satisfaction.enps} 
                  ({dashboardData.satisfaction.enps >= 30 ? 'Bom' : 'Atenção necessária'})
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="satisfaction">
            <SatisfactionPanel data={dashboardData.satisfaction} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformancePanel data={dashboardData.performance} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityPanel data={dashboardData.activity} />
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationPanel data={dashboardData.communication} />
          </TabsContent>

          <TabsContent value="efficiency">
            <EfficiencyPanel data={dashboardData.efficiency} />
          </TabsContent>
        </Tabs>
      )}

      {!loading && !dashboardData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecione um projeto e clique em Atualizar para visualizar as métricas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function getLastMonthStart(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default SpaceDashboardView;
