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

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por Tipo de Aplicação */}
        {stats.porTipo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Por Tipo de Aplicação</CardTitle>
              <CardDescription>Distribuição por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.porTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, quantidade, percent }) => 
                      `${tipo}: ${quantidade} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {stats.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.tipo[index % COLORS.tipo.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Por Fase do Ciclo de Vida */}
        {stats.porFase.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Por Fase do Ciclo de Vida</CardTitle>
              <CardDescription>Status de desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.porFase}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fase" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8b5cf6">
                    {stats.porFase.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.fase[index % COLORS.fase.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Por Criticidade do Negócio */}
      {stats.porCriticidade.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por Criticidade do Negócio</CardTitle>
            <CardDescription>Importância para o negócio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.porCriticidade} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="criticidade" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#ec4899">
                  {stats.porCriticidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.criticidade[index % COLORS.criticidade.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
