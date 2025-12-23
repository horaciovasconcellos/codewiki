import { HistoricoTokenAcesso } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, Globe } from '@phosphor-icons/react';

interface TokenHistoryPanelProps {
  historico: HistoricoTokenAcesso[];
}

const tipoAcaoColors: Record<string, string> = {
  'Criação': 'bg-green-500',
  'Renovação': 'bg-blue-500',
  'Revogação': 'bg-red-500',
  'Suspensão': 'bg-orange-500',
  'Reativação': 'bg-emerald-500',
  'Alteração de Escopos': 'bg-purple-500',
  'Alteração de Ambiente': 'bg-indigo-500',
  'Uso': 'bg-gray-500'
};

export function TokenHistoryPanel({ historico }: TokenHistoryPanelProps) {
  if (!historico || historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} weight="duotone" />
            Histórico de Alterações
          </CardTitle>
          <CardDescription>
            Nenhuma alteração registrada para este token
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={20} weight="duotone" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>
          {historico.length} registro(s) encontrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {historico.map((item, index) => (
              <div
                key={item.id}
                className="relative pl-6 pb-4 border-l-2 border-border last:border-0 last:pb-0"
              >
                <div
                  className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${
                    tipoAcaoColors[item.tipoAcao] || 'bg-gray-500'
                  }`}
                />
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {item.tipoAcao}
                      </Badge>
                      <p className="text-sm font-medium">{item.descricao}</p>
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.dataHora).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{item.realizadoPor}</span>
                    </div>
                    {item.ipOrigem && (
                      <div className="flex items-center gap-1">
                        <Globe size={14} />
                        <span>{item.ipOrigem}</span>
                      </div>
                    )}
                    {item.localizacao && (
                      <div className="flex items-center gap-1 col-span-2">
                        <MapPin size={14} />
                        <span>{item.localizacao}</span>
                      </div>
                    )}
                  </div>

                  {item.dadosAnteriores && item.dadosNovos && (
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-semibold text-red-600 mb-1">Anterior:</p>
                          <pre className="text-[10px] overflow-auto">
                            {JSON.stringify(item.dadosAnteriores, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="font-semibold text-green-600 mb-1">Novo:</p>
                          <pre className="text-[10px] overflow-auto">
                            {JSON.stringify(item.dadosNovos, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
