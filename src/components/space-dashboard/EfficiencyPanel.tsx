import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EfficiencyMetrics } from '@/types/space';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  data: EfficiencyMetrics;
}

const EfficiencyPanel: React.FC<Props> = ({ data }) => {
  const wipData = Object.entries(data.wipByState).map(([state, count]) => ({
    name: state,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>E - Efficiency & Flow</CardTitle>
          <CardDescription>
            Eficiência do fluxo de trabalho e previsibilidade de entrega
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Lead Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.leadTime.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Cycle Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.cycleTime.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  WIP Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Object.values(data.wipByState).reduce((a, b) => a + b, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">itens em progresso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Itens Envelhecendo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{data.agingItems.length}</div>
                <p className="text-xs text-muted-foreground mt-1">requerem atenção</p>
              </CardContent>
            </Card>
          </div>

          {/* Cumulative Flow Diagram */}
          <div>
            <h3 className="text-sm font-medium mb-4">Cumulative Flow Diagram</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.cumulativeFlow}>
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
                <Area 
                  type="monotone" 
                  dataKey="done" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Concluído"
                />
                <Area 
                  type="monotone" 
                  dataKey="doing" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Em Progresso"
                />
                <Area 
                  type="monotone" 
                  dataKey="todo" 
                  stackId="1" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  name="A Fazer"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* WIP by State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-4">WIP por Estado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={wipData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {wipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-4">Métricas Ideais</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Lead Time</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ✅ Menos de 7 dias: Excelente<br />
                    ⚠️ 7-14 dias: Bom<br />
                    ❌ Mais de 14 dias: Atenção
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Cycle Time</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ✅ Menos de 3 dias: Excelente<br />
                    ⚠️ 3-7 dias: Bom<br />
                    ❌ Mais de 7 dias: Atenção
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aging Items */}
          {data.agingItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Itens Envelhecendo - Priorizar</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Idade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.agingItems.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {item.state}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${item.age > 14 ? 'text-red-600' : item.age > 7 ? 'text-amber-600' : ''}`}>
                            {item.age} dias
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Insight */}
          <div className="p-4 bg-cyan-50 border border-cyan-200 rounded">
            <p className="text-sm font-medium text-cyan-900">💡 Insight</p>
            <p className="text-sm text-cyan-800 mt-1">
              {data.cycleTime < 3 
                ? 'Excelente fluxo! Time está entregando com agilidade e previsibilidade.'
                : data.cycleTime < 7
                ? 'Fluxo bom, mas há oportunidades de melhoria. Analise itens envelhecendo e WIP.'
                : 'Cycle Time elevado indica possíveis gargalos. Recomenda-se limitar WIP e remover impedimentos.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EfficiencyPanel;
