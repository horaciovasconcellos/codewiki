import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload } from '@phosphor-icons/react';

interface EventoSLA {
  id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  reported_at?: string;
  source: string;
  service?: {
    id: string;
    tier: string;
  };
  contract: {
    contract_id: string;
    sla_type: string;
  };
  impact?: {
    scope: string;
    severity: string;
  };
  sla_eligible: boolean;
  correlation_id?: string;
  evidence?: {
    metrics?: string[];
    logs_ref?: string;
  };
  dataAberturaIncidente?: string;
  dataFechamentoIncidente?: string;
  dataIncidentePausado?: string;
  dataIncidenteRetomado?: string;
  dataInicioManutencao?: string;
  dataFimManutencao?: string;
  tecnologiaId?: string;
  tipoSLAId?: string;
}

interface EventoSLADetailsDialogProps {
  evento: EventoSLA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportUpdate: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EventoSLADetailsDialog({
  evento,
  open,
  onOpenChange,
  onImportUpdate,
}: EventoSLADetailsDialogProps) {
  const [fileInputKey, setFileInputKey] = useState(0);

  if (!evento) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      onImportUpdate(e as any);
      onOpenChange(false);
      setFileInputKey(prev => prev + 1);
    };
    input.click();
  };

  const getEventTypeName = (type: string) => {
    const types: Record<string, string> = {
      'sla.incident.opened': 'Incidente Aberto',
      'sla.incident.paused': 'Incidente Pausado',
      'sla.incident.resumed': 'Incidente Retomado',
      'sla.incident.closed': 'Incidente Fechado',
      'maintenance.started': 'Manutenção Iniciada',
      'maintenance.ended': 'Manutenção Finalizada',
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Evento SLA</DialogTitle>
          <DialogDescription>
            Visualize todos os campos importados. Importe um novo JSON para atualizar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Principais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Event ID</Label>
                <p className="text-sm font-mono">{evento.event_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">ID Interno</Label>
                <p className="text-sm font-mono">{evento.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tipo de Evento</Label>
                <p className="text-sm">{getEventTypeName(evento.event_type)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fonte</Label>
                <Badge variant="outline">{evento.source}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ocorreu em</Label>
                <p className="text-sm">{formatDate(evento.occurred_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reportado em</Label>
                <p className="text-sm">{formatDate(evento.reported_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Elegível para SLA</Label>
                <Badge variant={evento.sla_eligible ? 'default' : 'secondary'}>
                  {evento.sla_eligible ? 'Sim' : 'Não'}
                </Badge>
              </div>
              {evento.correlation_id && (
                <div>
                  <Label className="text-xs text-muted-foreground">ID de Correlação</Label>
                  <p className="text-sm font-mono">{evento.correlation_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contrato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">ID do Contrato</Label>
                <p className="text-sm font-mono">{evento.contract.contract_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tipo de SLA</Label>
                <p className="text-sm">{evento.contract.sla_type}</p>
              </div>
            </div>
          </div>

          {/* Serviço */}
          {evento.service && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Serviço</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID do Serviço</Label>
                  <p className="text-sm font-mono">{evento.service.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tier</Label>
                  <Badge>{evento.service.tier}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Impacto */}
          {evento.impact && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Impacto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Escopo</Label>
                  <Badge variant={evento.impact.scope === 'total' ? 'destructive' : 'default'}>
                    {evento.impact.scope === 'total' ? 'Total' : 'Parcial'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Severidade</Label>
                  <Badge variant={evento.impact.severity === 'sev1' ? 'destructive' : 'secondary'}>
                    {evento.impact.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Datas do Ciclo de Vida */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Ciclo de Vida do Incidente</h3>
            <div className="grid grid-cols-2 gap-4">
              {evento.dataAberturaIncidente && (
                <div>
                  <Label className="text-xs text-muted-foreground">Abertura do Incidente</Label>
                  <p className="text-sm">{formatDate(evento.dataAberturaIncidente)}</p>
                </div>
              )}
              {evento.dataIncidentePausado && (
                <div>
                  <Label className="text-xs text-muted-foreground">Incidente Pausado</Label>
                  <p className="text-sm">{formatDate(evento.dataIncidentePausado)}</p>
                </div>
              )}
              {evento.dataIncidenteRetomado && (
                <div>
                  <Label className="text-xs text-muted-foreground">Incidente Retomado</Label>
                  <p className="text-sm">{formatDate(evento.dataIncidenteRetomado)}</p>
                </div>
              )}
              {evento.dataFechamentoIncidente && (
                <div>
                  <Label className="text-xs text-muted-foreground">Fechamento do Incidente</Label>
                  <p className="text-sm">{formatDate(evento.dataFechamentoIncidente)}</p>
                </div>
              )}
              {evento.dataInicioManutencao && (
                <div>
                  <Label className="text-xs text-muted-foreground">Início da Manutenção</Label>
                  <p className="text-sm">{formatDate(evento.dataInicioManutencao)}</p>
                </div>
              )}
              {evento.dataFimManutencao && (
                <div>
                  <Label className="text-xs text-muted-foreground">Fim da Manutenção</Label>
                  <p className="text-sm">{formatDate(evento.dataFimManutencao)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Evidências */}
          {evento.evidence && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Evidências</h3>
              <div className="space-y-2">
                {evento.evidence.metrics && evento.evidence.metrics.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Métricas</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {evento.evidence.metrics.map((metric, idx) => (
                        <Badge key={idx} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {evento.evidence.logs_ref && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Referência de Logs</Label>
                    <p className="text-sm font-mono">{evento.evidence.logs_ref}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Associações Internas */}
          {(evento.tecnologiaId || evento.tipoSLAId) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Associações Internas</h3>
              <div className="grid grid-cols-2 gap-4">
                {evento.tecnologiaId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">ID da Tecnologia</Label>
                    <p className="text-sm font-mono">{evento.tecnologiaId}</p>
                  </div>
                )}
                {evento.tipoSLAId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">ID do Tipo SLA</Label>
                    <p className="text-sm font-mono">{evento.tipoSLAId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botão de Importação */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleImportClick}
              disabled={!!evento.dataFechamentoIncidente}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {evento.dataFechamentoIncidente 
                ? 'Evento fechado - Não pode ser editado' 
                : 'Importar JSON para Atualizar'}
            </Button>
            {evento.dataFechamentoIncidente && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Eventos fechados não podem ser modificados
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
