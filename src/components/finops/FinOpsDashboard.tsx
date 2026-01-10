import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FinOpsDashboardData } from '@/lib/types';

interface FinOpsDashboardProps {
  data: FinOpsDashboardData;
  loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export function FinOpsDashboard({ data, loading }: FinOpsDashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  // Transformar dados de custo por dia para o gráfico de linha
  const costByDayData = Object.entries(
    data.costByDay.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][item.aplicacao] = item.cost;
      return acc;
    }, {} as Record<string, any>)
  ).map(([_, values]) => values);

  // Dados para gráfico de pizza (custo por serviço)
  const pieData = data.costByService.map(item => ({
    name: item.service,
    value: item.cost
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Daily Cost */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Daily Cost</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(data.kpis.totalDailyCost)}
            </div>
          </CardContent>
        </Card>

        {/* Unallocated Cost % */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">% Unallocated Cost</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatPercentage(data.kpis.unallocatedCostPercentage)}
            </div>
          </CardContent>
        </Card>

        {/* Top Applications */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top 5 Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.kpis.topApplications.slice(0, 3).map((app, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">{app.name}</span>
                  <span className="text-sm font-medium ml-2">{formatCurrency(app.cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha: Custo diário por aplicação */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Custo Diário por Aplicação</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costByDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              {data.kpis.topApplications.map((app, index) => (
                <Line
                  key={app.name}
                  type="monotone"
                  dataKey={app.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras: Custo por provedor */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Custo por Provedor</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.costByProvider}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#8884d8">
                {data.costByProvider.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pizza: Distribuição por serviço */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Distribuição por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pizza: Tagged vs Untagged */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Tagged vs Untagged Cost</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Tagged', value: data.taggedVsUntagged.tagged },
                  { name: 'Untagged', value: data.taggedVsUntagged.untagged }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#00C49F" />
                <Cell fill="#FF8042" />
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pizza: Allocated vs Unallocated */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Allocated vs Unallocated Cost</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Allocated', value: data.allocatedVsUnallocated.allocated },
                  { name: 'Unallocated', value: data.allocatedVsUnallocated.unallocated }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#0088FE" />
                <Cell fill="#FFBB28" />
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
