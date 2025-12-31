import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceMetrics } from '@/types/space';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface Props {
  data: PerformanceMetrics;
}

const PerformancePanel: React.FC<Props> = ({ data }) => {
  const deliveryData = [
    { name: 'Planejado', value: data.workItemsPlanned },
    { name: 'Entregue', value: data.workItemsDelivered }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>P - Performance</CardTitle>
          <CardDescription>
            Impacto do trabalho entregue e qualidade das releases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taxa de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.deliveryRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.workItemsDelivered} de {data.workItemsPlanned} itens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Bugs Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{data.criticalBugs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.criticalBugsReopened} reabertos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Sucesso Releases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data.releaseSuccessRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa de sucesso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Chart */}
          <div>
            <h3 className="text-sm font-medium mb-4">Planejado vs Entregue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Releases */}
          <div>
            <h3 className="text-sm font-medium mb-3">Releases Recentes</h3>
            <div className="space-y-2">
              {data.releases.slice(0, 5).map((release, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {release.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{release.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(release.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${release.success ? 'text-green-600' : 'text-red-600'}`}>
                    {release.success ? 'Sucesso' : 'Falha'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-900">💡 Insight</p>
            <p className="text-sm text-green-800 mt-1">
              {data.deliveryRate >= 80 
                ? 'Excelente previsibilidade! Time está entregando consistentemente o planejado.'
                : 'Taxa de entrega abaixo de 80%. Considere revisar planejamento ou capacidade do time.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformancePanel;
