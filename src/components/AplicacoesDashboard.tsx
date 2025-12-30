import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DeviceMobile } from '@phosphor-icons/react';

interface AplicacoesStats {
  total: number;
  porTipo: Array<{ tipo: string; quantidade: number }>;
  porFase: Array<{ fase: string; quantidade: number }>;
  porCriticidade: Array<{ criticidade: string; quantidade: number }>;
}

const COLORS = {
  tipo: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444'],
  fase: ['#22c55e', '#eab308', '#f97316', '#ef4444', '#6366f1'],
  criticidade: ['#ef4444', '#f97316', '#eab308', '#22c55e']
};

export function AplicacoesDashboard() {
  const [stats, setStats] = useState<AplicacoesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/aplicacoes-stats');
        if (!response.ok) {
          throw new Error('Erro ao buscar estatísticas');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando estatísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Card de resumo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DeviceMobile size={24} className="text-blue-600" />
            <div>
              <CardTitle>Aplicações Cadastradas</CardTitle>
              <CardDescription>Visão geral das aplicações no sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-sm text-muted-foreground mt-1">Total de aplicações</p>
        </CardContent>
      </Card>

      {/* Cards informativos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Por Tipo de Aplicação e Fase do Ciclo de Vida */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Aplicações</CardTitle>
            <CardDescription>Por tipo e fase do ciclo de vida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Por Tipo de Aplicação */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Por Tipo de Aplicação</h4>
              <div className="space-y-2">
                {stats.porTipo.map((item, index) => {
                  const total = stats.porTipo.reduce((sum, i) => sum + Number(i.quantidade || 0), 0);
                  const percentual = ((Number(item.quantidade || 0) / total) * 100).toFixed(1);
                  return (
                    <div key={item.tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.tipo[index % COLORS.tipo.length] }}
                        />
                        <span className="text-sm">{item.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.quantidade}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">({percentual}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por Fase do Ciclo de Vida */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Por Fase do Ciclo de Vida</h4>
              <div className="space-y-2">
                {stats.porFase.map((item, index) => {
                  const total = stats.porFase.reduce((sum, i) => sum + Number(i.quantidade || 0), 0);
                  const percentual = ((Number(item.quantidade || 0) / total) * 100).toFixed(1);
                  return (
                    <div key={item.fase} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.fase[index % COLORS.fase.length] }}
                        />
                        <span className="text-sm">{item.fase}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{item.quantidade}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">({percentual}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Por Criticidade do Negócio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criticidade do Negócio</CardTitle>
            <CardDescription>Importância das aplicações para o negócio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.porCriticidade.map((item, index) => {
                const total = stats.porCriticidade.reduce((sum, i) => sum + Number(i.quantidade || 0), 0);
                const percentual = ((Number(item.quantidade || 0) / total) * 100).toFixed(1);
                const largura = ((Number(item.quantidade || 0) / total) * 100).toFixed(1);
                return (
                  <div key={item.criticidade} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS.criticidade[index % COLORS.criticidade.length] }}
                        />
                        <span>{item.criticidade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.quantidade}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">({percentual}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${largura}%`,
                          backgroundColor: COLORS.criticidade[index % COLORS.criticidade.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Total: {stats.porCriticidade.reduce((sum, i) => sum + Number(i.quantidade || 0), 0)} aplicações
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
