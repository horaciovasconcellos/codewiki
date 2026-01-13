import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash, Upload } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventoSLA {
  id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  source: string;
  contract: {
    contract_id: string;
    sla_type: string;
  };
  sla_eligible: boolean;
  dataAberturaIncidente?: string;
  dataFechamentoIncidente?: string;
  dataIncidentePausado?: string;
  dataIncidenteRetomado?: string;
  dataInicioManutencao?: string;
  dataFimManutencao?: string;
}

interface EventosSLADataTableProps {
  eventos: EventoSLA[];
  onDelete: (id: string) => void;
  onImportJSON: (evento: EventoSLA) => void;
}

export function EventosSLADataTable({ eventos, onDelete, onImportJSON }: EventosSLADataTableProps) {
  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'sla.incident.opened': 'Incidente Aberto',
      'sla.incident.paused': 'Incidente Pausado',
      'sla.incident.resumed': 'Incidente Retomado',
      'sla.incident.closed': 'Incidente Fechado',
      'maintenance.started': 'Manutenção Iniciada',
      'maintenance.ended': 'Manutenção Finalizada',
    };
    return labels[type] || type;
  };

  const getEventTypeVariant = (type: string) => {
    switch (type) {
      case 'sla.incident.opened':
        return 'destructive';
      case 'sla.incident.paused':
        return 'secondary';
      case 'sla.incident.resumed':
        return 'default';
      case 'sla.incident.closed':
        return 'outline';
      case 'maintenance.started':
        return 'secondary';
      case 'maintenance.ended':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'monitoring': 'Monitoramento',
      'manual': 'Manual',
      'api': 'API',
    };
    return labels[source] || source;
  };

  const isEventoClosed = (evento: EventoSLA) => {
    return !!evento.dataFechamentoIncidente;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos Registrados</CardTitle>
        <CardDescription>
          Lista de eventos que impactam o SLA ({eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Evento</TableHead>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Elegível SLA</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Pausado</TableHead>
                <TableHead>Retomado</TableHead>
                <TableHead>Início Manutenção</TableHead>
                <TableHead>Fim Manutenção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhum evento registrado
                  </TableCell>
                </TableRow>
              ) : (
                eventos.map((evento) => (
                  <TableRow key={evento.id} className={isEventoClosed(evento) ? 'opacity-60' : ''}>
                    <TableCell className="font-mono text-xs">{evento.event_id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant={getEventTypeVariant(evento.event_type)}>
                        {getEventTypeLabel(evento.event_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getSourceLabel(evento.source)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={evento.sla_eligible ? 'default' : 'secondary'}>
                        {evento.sla_eligible ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataAberturaIncidente)}</TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataFechamentoIncidente)}</TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataIncidentePausado)}</TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataIncidenteRetomado)}</TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataInicioManutencao)}</TableCell>
                    <TableCell className="text-sm">{formatDate(evento.dataFimManutencao)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onImportJSON(evento)}
                          disabled={isEventoClosed(evento)}
                          title={isEventoClosed(evento) ? 'Evento fechado não pode ser modificado' : 'Importar JSON para atualizar'}
                        >
                          <Upload size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Excluir"
                            >
                              <Trash size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o evento "{evento.event_id}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(evento.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
