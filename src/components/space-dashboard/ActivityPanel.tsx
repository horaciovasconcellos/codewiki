import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityMetrics } from '@/types/space';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GitPullRequest, GitCommit, ListChecks } from 'lucide-react';

interface Props {
  data: ActivityMetrics;
}

const ActivityPanel: React.FC<Props> = ({ data }) => {
  const prMergeRate = data.pullRequestsCreated > 0 
    ? Math.round((data.pullRequestsMerged / data.pullRequestsCreated) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>A - Activity</CardTitle>
          <CardDescription>
            Volume de atividade (não deve ser usado como KPI principal de produtividade)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4" />
                  PRs Criados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.pullRequestsCreated}</div>
                <p className="text-xs text-muted-foreground mt-1">No período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-green-600" />
                  PRs Mergeados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data.pullRequestsMerged}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {prMergeRate}% de taxa de merge
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitCommit className="h-4 w-4" />
                  Commits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.commits}</div>
                <p className="text-xs text-muted-foreground mt-1">No período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.workItemsMovements}</div>
                <p className="text-xs text-muted-foreground mt-1">Itens movidos no board</p>
              </CardContent>
            </Card>
          </div>

          {/* PR Trend */}
          <div>
            <h3 className="text-sm font-medium mb-4">Tendência de Pull Requests</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.prTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#8884d8" 
                  name="Criados"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="merged" 
                  stroke="#82ca9d" 
                  name="Mergeados"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Commit Trend */}
          <div>
            <h3 className="text-sm font-medium mb-4">Tendência de Commits</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.commitTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                />
                <Bar dataKey="count" fill="#8884d8" name="Commits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm font-medium text-amber-900">⚠️ Atenção</p>
            <p className="text-sm text-amber-800 mt-1">
              Métricas de atividade não devem ser usadas isoladamente para medir produtividade. 
              Use-as como contexto para entender padrões de trabalho do time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPanel;
