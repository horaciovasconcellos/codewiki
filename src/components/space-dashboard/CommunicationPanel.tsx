import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunicationMetrics } from '@/types/space';
import { Clock, Users, MessageSquare, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  data: CommunicationMetrics;
}

const CommunicationPanel: React.FC<Props> = ({ data }) => {
  const prCommentRate = data.totalPrs > 0 
    ? Math.round((data.prsWithComments / data.totalPrs) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>C - Communication & Collaboration</CardTitle>
          <CardDescription>
            Qualidade da colaboração e comunicação entre membros do time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Review Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.avgPrReviewTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo médio de review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Reviewers/PR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.avgReviewersPerPr.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média de reviewers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  PRs com Comentários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{prCommentRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.prsWithComments} de {data.totalPrs}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Itens Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{data.blockedItems}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Blocked Items Table */}
          {data.blockedItemsList.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Itens Bloqueados - Prioridade</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Dias Bloqueado</TableHead>
                      <TableHead>Razão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.blockedItemsList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${item.blockedDays > 3 ? 'text-red-600' : 'text-amber-600'}`}>
                            {item.blockedDays} dias
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.reason || 'Não especificado'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Metrics Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-2">Review Time Ideal</h4>
              <p className="text-sm text-muted-foreground">
                ✅ Menos de 4h: Excelente<br />
                ⚠️ 4-8h: Bom<br />
                ❌ Mais de 8h: Atenção necessária
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-2">Reviewers por PR</h4>
              <p className="text-sm text-muted-foreground">
                ✅ 2-3: Ideal<br />
                ⚠️ 1: Baixa colaboração<br />
                ⚠️ 4+: Possível gargalo
              </p>
            </div>
          </div>

          {/* Insight */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <p className="text-sm font-medium text-purple-900">💡 Insight</p>
            <p className="text-sm text-purple-800 mt-1">
              {data.avgPrReviewTime < 4 
                ? 'Excelente tempo de review! Time está colaborando de forma eficiente.'
                : 'Review time elevado pode indicar sobrecarga ou falta de priorização. Considere pair programming ou mob reviews.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationPanel;
