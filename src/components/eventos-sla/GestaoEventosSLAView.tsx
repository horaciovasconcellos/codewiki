import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { EventosSLADataTable } from './EventosSLADataTable';
import { EventoSLADetailsDialog } from './EventoSLADetailsDialog';
import { Tecnologia, SLA } from '@/lib/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EventoSLA {
  id: string;
  event_id: string;
  event_type: 'sla.incident.opened' | 'sla.incident.paused' | 'sla.incident.resumed' | 'sla.incident.closed' | 'maintenance.started' | 'maintenance.ended';
  occurred_at: string;
  reported_at?: string;
  source: 'monitoring' | 'manual' | 'api';
  service?: {
    id: string;
    tier: string;
  };
  contract: {
    contract_id: string;
    sla_type: string;
  };
  impact?: {
    scope: 'total' | 'partial';
    severity: 'sev1' | 'sev2' | 'sev3';
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

export function GestaoEventosSLAView() {
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([]);
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [eventos, setEventos] = useState<EventoSLA[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<EventoSLA | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadTecnologias();
    loadSLAs();
    loadEventos();
  }, []);

  const loadTecnologias = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias`);
      if (response.ok) {
        const data = await response.json();
        setTecnologias(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tecnologias:', error);
      toast.error('Erro ao carregar tecnologias');
    }
  };

  const loadSLAs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/slas`);
      if (response.ok) {
        const data = await response.json();
        setSLAs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar SLAs:', error);
      toast.error('Erro ao carregar SLAs');
    }
  };

  const loadEventos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/eventos-sla`);
      if (response.ok) {
        const data = await response.json();
        setEventos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const validateJSON = (data: any): boolean => {
    if (!data.occurred_at) {
      toast.error('Campo obrigatório ausente: occurred_at');
      return false;
    }
    if (!data.event_type) {
      toast.error('Campo obrigatório ausente: event_type');
      return false;
    }
    if (data.sla_eligible === undefined) {
      toast.error('Campo obrigatório ausente: sla_eligible');
      return false;
    }
    if (!data.contract?.contract_id) {
      toast.error('Campo obrigatório ausente: contract_id');
      return false;
    }
    return true;
  };

  const processEventData = (data: any, existingEvent?: EventoSLA): EventoSLA => {
    const baseEvent: EventoSLA = {
      id: existingEvent?.id || crypto.randomUUID(),
      event_id: data.event_id || crypto.randomUUID(),
      event_type: data.event_type,
      occurred_at: data.occurred_at,
      reported_at: existingEvent?.reported_at || data.reported_at,
      source: data.source || 'manual',
      service: existingEvent?.service || data.service,
      contract: {
        contract_id: existingEvent?.contract?.contract_id || data.contract?.contract_id || '',
        sla_type: existingEvent?.contract?.sla_type || data.contract?.sla_type || ''
      },
      impact: existingEvent?.impact || data.impact,
      sla_eligible: existingEvent?.sla_eligible !== undefined ? existingEvent.sla_eligible : data.sla_eligible,
      correlation_id: existingEvent?.correlation_id || data.correlation_id,
      evidence: existingEvent?.evidence || data.evidence,
      tecnologiaId: existingEvent?.tecnologiaId,
      tipoSLAId: existingEvent?.tipoSLAId,
    };

    // Preencher campos de data baseado no tipo de evento, apenas se não existirem
    switch (data.event_type) {
      case 'sla.incident.opened':
        if (!existingEvent?.dataAberturaIncidente) {
          baseEvent.dataAberturaIncidente = data.occurred_at;
        }
        break;
      case 'sla.incident.closed':
        if (!existingEvent?.dataFechamentoIncidente) {
          baseEvent.dataFechamentoIncidente = data.occurred_at;
        }
        break;
      case 'sla.incident.paused':
        if (!existingEvent?.dataIncidentePausado) {
          baseEvent.dataIncidentePausado = data.occurred_at;
        }
        break;
      case 'sla.incident.resumed':
        if (!existingEvent?.dataIncidenteRetomado) {
          baseEvent.dataIncidenteRetomado = data.occurred_at;
        }
        break;
      case 'maintenance.started':
        if (!existingEvent?.dataInicioManutencao) {
          baseEvent.dataInicioManutencao = data.occurred_at;
        }
        break;
      case 'maintenance.ended':
        if (!existingEvent?.dataFimManutencao) {
          baseEvent.dataFimManutencao = data.occurred_at;
        }
        break;
    }

    // Preservar datas existentes
    if (existingEvent) {
      baseEvent.dataAberturaIncidente = existingEvent.dataAberturaIncidente || baseEvent.dataAberturaIncidente;
      baseEvent.dataFechamentoIncidente = existingEvent.dataFechamentoIncidente || baseEvent.dataFechamentoIncidente;
      baseEvent.dataIncidentePausado = existingEvent.dataIncidentePausado || baseEvent.dataIncidentePausado;
      baseEvent.dataIncidenteRetomado = existingEvent.dataIncidenteRetomado || baseEvent.dataIncidenteRetomado;
      baseEvent.dataInicioManutencao = existingEvent.dataInicioManutencao || baseEvent.dataInicioManutencao;
      baseEvent.dataFimManutencao = existingEvent.dataFimManutencao || baseEvent.dataFimManutencao;
    }

    return baseEvent;
  };

  const saveEvento = async (evento: EventoSLA) => {
    try {
      const response = await fetch(`${API_URL}/api/eventos-sla/${evento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar evento');
      }
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast.error('Erro ao salvar evento no servidor');
      throw error;
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateJSON(data)) {
        return;
      }

      // Verificar se event_id já existe
      const existingEvent = eventos.find(e => e.event_id === data.event_id);
      
      if (existingEvent && existingEvent.dataFechamentoIncidente) {
        toast.error('Evento já fechado, não pode ser modificado');
        return;
      }

      const processedEvent = processEventData(data, existingEvent);

      if (existingEvent) {
        // Atualizar evento existente
        const updatedEventos = eventos.map(e => 
          e.event_id === data.event_id ? processedEvent : e
        );
        setEventos(updatedEventos);
        toast.success('Evento atualizado com sucesso');
      } else {
        // Adicionar novo evento
        setEventos([...eventos, processedEvent]);
        toast.success('Evento importado com sucesso');
      }

      // Salvar no backend
      await saveEvento(processedEvent);
    } catch (error) {
      console.error('Erro ao importar JSON:', error);
      toast.error('Erro ao processar arquivo JSON. Verifique o formato.');
    }

    // Limpar input
    event.target.value = '';
  };

  const handleNovoEvento = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => handleImportJSON(e as any);
    input.click();
  };

  const handleEditEvento = (evento: EventoSLA) => {
    setSelectedEvento(evento);
    setDetailsOpen(true);
  };

  const handleDeleteEvento = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/eventos-sla/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEventos(eventos.filter(e => e.id !== id));
        toast.success('Evento excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="flex h-16 items-center px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-4 ml-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">Gestão de Eventos SLA</h1>
              <p className="text-sm text-muted-foreground">
                Importe eventos via JSON para controle de SLA
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <Button onClick={handleNovoEvento}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-6">
        <EventosSLADataTable
          eventos={eventos}
          tecnologias={tecnologias}
          slas={slas}
          onEdit={handleEditEvento}
          onDelete={handleDeleteEvento}
          loading={loading}
        />
      </div>

      <EventoSLADetailsDialog
        evento={selectedEvento}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onImportUpdate={handleImportJSON}
      />
    </div>
  );
}
