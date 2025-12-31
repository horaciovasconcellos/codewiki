import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SatisfactionMetrics } from '@/types/space';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown } from 'lucide-react';

interface Props {
  data: SatisfactionMetrics;
}

const SatisfactionPanel: React.FC<Props> = ({ data }) => {
  const getENPSCategory = (score: number) => {
    if (score >= 50) return { label: 'Excelente', color: 'text-green-600', icon: Smile };
    if (score >= 30) return { label: 'Bom', color: 'text-blue-600', icon: Smile };
    if (score >= 0) return { label: 'Razoável', color: 'text-yellow-600', icon: Meh };
    return { label: 'Crítico', color: 'text-red-600', icon: Frown };
  };

  const category = getENPSCategory(data.enps);
  const Icon = category.icon;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>S - Satisfaction & Well-Being</CardTitle>
          <CardDescription>
            Satisfação e bem-estar do time medidos através de pesquisas periódicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* eNPS Score */}
          <div className="flex items-center justify-between p-6 border rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">eNPS Score</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-5xl font-bold ${category.color}`}>{data.enps}</span>
                <div>
                  <Icon className={`h-8 w-8 ${category.color}`} />
                  <p className={`text-sm font-medium ${category.color}`}>{category.label}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Última atualização: {new Date(data.lastUpdate).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="text-right">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Escala</p>
                <p className="text-xs"><span className="text-green-600">■</span> 50-100: Excelente</p>
                <p className="text-xs"><span className="text-blue-600">■</span> 30-49: Bom</p>
                <p className="text-xs"><span className="text-yellow-600">■</span> 0-29: Razoável</p>
                <p className="text-xs"><span className="text-red-600">■</span> -100-0: Crítico</p>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div>
            <h3 className="text-sm font-medium mb-4">Tendência Trimestral</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.enpsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { month: 'short' })}
                />
                <YAxis domain={[-100, 100]} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                  formatter={(value: number) => [value, 'eNPS']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comments */}
          {data.comments && data.comments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Comentários Qualitativos (Anonimizados)</h3>
              <div className="space-y-2">
                {data.comments.slice(0, 5).map((comment, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded text-sm italic">
                    "{comment}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900">💡 Insight</p>
            <p className="text-sm text-blue-800 mt-1">
              {data.enps >= 30 
                ? 'Time demonstra boa satisfação. Continue investindo em bem-estar e autonomia.'
                : 'Atenção: satisfação abaixo do esperado. Recomenda-se conversa com o time para identificar pontos de melhoria.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionPanel;
