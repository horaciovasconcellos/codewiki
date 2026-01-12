import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinOpsDashboard } from './FinOpsDashboard';
import { apiGet, apiPost } from '@/hooks/use-api';
import { toast } from 'sonner';
import type { 
  FinOpsDashboardData, 
  FinOpsProvider, 
  FinOpsResource,
  FinOpsCloudProvider 
} from '@/lib/types';

export function FinOpsView() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<FinOpsDashboardData | null>(null);
  const [providers, setProviders] = useState<FinOpsProvider[]>([]);
  const [resources, setResources] = useState<FinOpsResource[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros de período
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Carregar dados iniciais
  useEffect(() => {
    loadProviders();
    loadDashboardData();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await apiGet<FinOpsProvider[]>('/finops/providers');
      setProviders(data);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      toast.error('Erro ao carregar provedores');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiGet<FinOpsDashboardData>(
        `/finops/dashboard?startDate=${startDate}&endDate=${endDate}`
      );
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await apiGet<FinOpsResource[]>('/finops/resources');
      setResources(data);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      toast.error('Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    loadDashboardData();
  };

  // Dados de exemplo para testes (simulando ingestão)
  const handleTestIngestion = async (provider: FinOpsCloudProvider) => {
    try {
      const testData = {
        provider,
        resources: [
          {
            resource_id: `test-${Date.now()}-001`,
            resource_type: provider === 'AWS' ? 'EC2' : provider === 'Azure' ? 'Virtual Machine' : provider === 'GCP' ? 'Compute Engine' : 'Compute Instance',
            resource_name: `Test Resource ${provider}`,
            region: 'us-east-1',
            tags: { environment: 'test', team: 'engineering' },
            usage: {
              cpu_hours: Math.random() * 100,
              storage_gb: Math.random() * 50,
              network_gb: Math.random() * 200,
              requests_count: Math.floor(Math.random() * 10000)
            },
            cost: {
              cpu_cost: Math.random() * 25,
              storage_cost: Math.random() * 5,
              network_cost: Math.random() * 10,
              total_cost: Math.random() * 50
            },
            service_category: 'Compute',
            cost_date: new Date().toISOString().split('T')[0]
          }
        ]
      };

      await apiPost('/finops/ingest', testData);
      toast.success(`Dados de teste do ${provider} ingeridos com sucesso`);
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao ingerir dados de teste:', error);
      toast.error('Erro ao ingerir dados de teste');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">FinOps-Focus</h1>
        <p className="text-muted-foreground mt-2">
          Análise de custos cloud baseada na metodologia FinOps-Focus
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-white border">
          <TabsTrigger value="dashboard" className="text-black data-[state=active]:bg-white">Dashboard</TabsTrigger>
          <TabsTrigger value="providers" className="text-black data-[state=active]:bg-white">Provedores</TabsTrigger>
          <TabsTrigger value="resources" className="text-black data-[state=active]:bg-white">Recursos</TabsTrigger>
          <TabsTrigger value="ingest" className="text-black data-[state=active]:bg-white">Ingestão de Dados</TabsTrigger>
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard" className="space-y-6 mt-0">
          {/* Filtros de período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros de Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleApplyDateFilter} className="w-full">
                    Aplicar Filtro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {dashboardData && <FinOpsDashboard data={dashboardData} loading={loading} />}
        </TabsContent>

        {/* Tab: Provedores */}
        <TabsContent value="providers" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Provedores Cloud</CardTitle>
              <CardDescription>
                Gerenciamento de provedores de infraestrutura cloud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {providers.map((provider) => (
                  <Card
                    key={provider.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-base">{provider.displayName}</h3>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            provider.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {provider.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Última sincronização:
                        </p>
                        <p className="text-sm font-medium">
                          {provider.lastSyncDate
                            ? new Date(provider.lastSyncDate).toLocaleString('pt-BR')
                            : 'Nunca'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Recursos */}
        <TabsContent value="resources" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recursos Cloud</CardTitle>
                  <CardDescription>
                    Visualização e gerenciamento de recursos cloud
                  </CardDescription>
                </div>
                <Button onClick={loadResources}>Atualizar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-base">
                    Nenhum recurso encontrado. Ingira dados usando a aba "Ingestão de Dados".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="text-left px-6 py-3 font-medium text-sm">Provedor</th>
                        <th className="text-left px-6 py-3 font-medium text-sm">Tipo</th>
                        <th className="text-left px-6 py-3 font-medium text-sm">Resource ID</th>
                        <th className="text-left px-6 py-3 font-medium text-sm">Região</th>
                        <th className="text-left px-6 py-3 font-medium text-sm">Aplicação</th>
                        <th className="text-right px-6 py-3 font-medium text-sm">Custo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr key={resource.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm">{resource.providerName}</td>
                          <td className="px-6 py-4 text-sm">{resource.resourceType}</td>
                          <td className="px-6 py-4 text-sm font-mono text-xs">{resource.resourceId}</td>
                          <td className="px-6 py-4 text-sm">{resource.region || '-'}</td>
                          <td className="px-6 py-4 text-sm">{resource.aplicacaoNome || 'Não alocado'}</td>
                          <td className="px-6 py-4 text-sm text-right font-medium">
                            {(resource as any).totalCost 
                              ? `$${parseFloat((resource as any).totalCost).toFixed(2)}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ingestão de Dados */}
        <TabsContent value="ingest" className="mt-0">
          <div className="space-y-6">
            {/* Card: Testes Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Testes Rápidos</CardTitle>
                <CardDescription>
                  Gere dados de teste aleatórios para cada provedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['AWS', 'Azure', 'GCP', 'OCI'] as FinOpsCloudProvider[]).map((provider) => (
                    <Button
                      key={provider}
                      onClick={() => handleTestIngestion(provider)}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2 text-base"
                    >
                      <span className="text-sm text-muted-foreground">Ingerir dados de teste</span>
                      <strong className="text-lg">{provider}</strong>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card: Arquivos de Carga */}
            <Card>
              <CardHeader>
                <CardTitle>Arquivos de Carga Prontos</CardTitle>
                <CardDescription>
                  Use os comandos abaixo para carregar dados realistas dos provedores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AWS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">AWS</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Amazon Web Services</h4>
                      <p className="text-xs text-muted-foreground">4 recursos (EC2, S3, RDS, Lambda) - $883/dia</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <code className="text-xs font-mono break-all">
                      curl -X POST http://localhost:3000/api/finops/ingest -H "Content-Type: application/json" -d @data-templates/finops-carga.json
                    </code>
                  </div>
                </div>

                {/* Azure */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Azure</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Microsoft Azure</h4>
                      <p className="text-xs text-muted-foreground">4 recursos (VM, Storage, SQL, App Service) - $870.75/dia</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <code className="text-xs font-mono break-all">
                      curl -X POST http://localhost:3000/api/finops/ingest -H "Content-Type: application/json" -d @data-templates/finops-azure-carga.json
                    </code>
                  </div>
                </div>

                {/* GCP */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">GCP</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Google Cloud Platform</h4>
                      <p className="text-xs text-muted-foreground">4 recursos (Compute, Storage, SQL, Functions) - $871.50/dia</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <code className="text-xs font-mono break-all">
                      curl -X POST http://localhost:3000/api/finops/ingest -H "Content-Type: application/json" -d @data-templates/finops-gcp-carga.json
                    </code>
                  </div>
                </div>

                {/* CSV */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">CSV</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">Arquivo Consolidado</h4>
                      <p className="text-xs text-muted-foreground">12 recursos de todos os provedores - $2,625.25/dia</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-2">Arquivo: data-templates/finops.csv</p>
                    <p className="text-xs text-muted-foreground">
                      Processe o CSV com um script Python ou ferramenta ETL. Consulte 
                      <code className="mx-1 px-1 py-0.5 bg-background rounded text-xs">data-templates/README-FINOPS.md</code>
                      para exemplos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Documentação */}
            <Card>
              <CardHeader>
                <CardTitle>Documentação da API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-black">Endpoint de Ingestão</h3>
                  <code className="text-sm bg-white px-3 py-2 rounded border inline-block text-black">
                    POST /api/finops/ingest
                  </code>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm mb-2 text-black">Guias Disponíveis</h3>
                  <ul className="text-sm space-y-2 text-black">
                    <li>• <code className="text-xs bg-white px-2 py-0.5 rounded border text-black">docs/FINOPS-INGESTION-GUIDE.md</code> - Exemplos de JSON para cada provedor</li>
                    <li>• <code className="text-xs bg-white px-2 py-0.5 rounded border text-black">data-templates/README-FINOPS.md</code> - Guia completo de carga de dados</li>
                    <li>• <code className="text-xs bg-white px-2 py-0.5 rounded border text-black">database/create-finops-tables.sql</code> - Estrutura das tabelas</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Dica:</strong> Os arquivos JSON contêm dados realistas com métricas de uso e custo 
                    seguindo o padrão FOCUS (FinOps Open Cost and Usage Specification).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
