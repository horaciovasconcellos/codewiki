import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Upload, Plus, FileArrowDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { EventosSLADataTable } from './EventosSLADataTable';
import { EventoSLADialog } from './EventoSLADialog';
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
  const [tecnologiaSelecionada, setTecnologiaSelecionada] = useState<string>('');
  const [contratoSelecionado, setContratoSelecionado] = useState<string>('');
  const [tipoSLASelecionado, setTipoSLASelecionado] = useState<string>('');
  const [eventos, setEventos] = useState<EventoSLA[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

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
        contract_id: existingEvent?.contract.contract_id || data.contract.contract_id,
        sla_type: existingEvent?.contract.sla_type || data.contract.sla_type
      },
      impact: existingEvent?.impact || data.impact,
      sla_eligible: existingEvent?.sla_eligible !== undefined ? existingEvent.sla_eligible : data.sla_eligible,
      correlation_id: existingEvent?.correlation_id || data.correlation_id,
      evidence: existingEvent?.evidence || data.evidence,
      tecnologiaId: existingEvent?.tecnologiaId || tecnologiaSelecionada,
      tipoSLAId: existingEvent?.tipoSLAId || tipoSLASelecionado,
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

  const saveEvento = async (evento: EventoSLA) => {
    try {
      const response = await fetch(`${API_URL}/api/eventos-sla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar evento');
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento no servidor');
    }
  };

  const handleAddEvento = async (novoEvento: Partial<EventoSLA>) => {
    try {
      const evento: EventoSLA = {
        id: crypto.randomUUID(),
        event_id: novoEvento.event_id || crypto.randomUUID(),
        event_type: novoEvento.event_type!,
        occurred_at: novoEvento.occurred_at!,
        source: novoEvento.source || 'manual',
        contract: {
          contract_id: contratoSelecionado,
          sla_type: tipoSLASelecionado
        },
        sla_eligible: novoEvento.sla_eligible ?? true,
        tecnologiaId: tecnologiaSelecionada,
        tipoSLAId: tipoSLASelecionado,
      };

      // Verificar se event_id já existe
      const existingEvent = eventos.find(e => e.event_id === evento.event_id);
      
      if (existingEvent && existingEvent.dataFechamentoIncidente) {
        toast.error('Evento já fechado, não pode ser modificado');
        return;
      }

      const processedEvent = processEventData(evento, existingEvent);

      if (existingEvent) {
        const updatedEventos = eventos.map(e => 
          e.event_id === evento.event_id ? processedEvent : e
        );
        setEventos(updatedEventos);
      } else {
        setEventos([...eventos, processedEvent]);
      }

      await saveEvento(processedEvent);
      setShowDialog(false);
      toast.success(existingEvent ? 'Evento atualizado com sucesso' : 'Evento adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast.error('Erro ao adicionar evento');
    }
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

  const handleExportTemplate = () => {
    const template = {
      event_id: "uuid",
      event_type: "sla.incident.opened",
      occurred_at: new Date().toISOString(),
      reported_at: new Date().toISOString(),
      source: "monitoring",
      service: {
        id: "billing-api",
        tier: "critical"
      },
      contract: {
        contract_id: "CTR-001",
        sla_type: "availability"
      },
      impact: {
        scope: "total",
        severity: "sev1"
      },
      sla_eligible: true,
      correlation_id: "INC-456",
      evidence: {
        metrics: ["latency", "error_rate"],
        logs_ref: "trace-id"
      }
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-evento-sla.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Eventos para Controle de SLA</h1>
                <p className="text-muted-foreground mt-2">
                  Registro e acompanhamento de eventos que impactam SLA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Selecione a tecnologia, contrato e tipo de SLA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tecnologia">Tecnologia *</Label>
                  <Select value={tecnologiaSelecionada} onValueChange={setTecnologiaSelecionada}>
                    <SelectTrigger id="tecnologia">
                      <SelectValue placeholder="Selecione a tecnologia" />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnologias.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.sigla} - {tech.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contrato">Contrato *</Label>
                  <Select value={contratoSelecionado} onValueChange={setContratoSelecionado}>
                    <SelectTrigger id="contrato">
                      <SelectValue placeholder="Selecione o contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnologias
                        .find(t => t.id === tecnologiaSelecionada)
                        ?.contratos?.map((contrato) => (
                          <SelectItem key={contrato.id} value={contrato.numeroContrato}>
                            {contrato.numeroContrato}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoSLA">Tipo de SLA *</Label>
                  <Select value={tipoSLASelecionado} onValueChange={setTipoSLASelecionado}>
                    <SelectTrigger id="tipoSLA">
                      <SelectValue placeholder="Selecione o tipo de SLA" />
                    </SelectTrigger>
                    <SelectContent>
                      {slas.map((sla) => (
                        <SelectItem key={sla.id} value={sla.id}>
                          {sla.sigla} - {sla.tipoSLA}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowDialog(true)}
                  disabled={!tecnologiaSelecionada || !contratoSelecionado || !tipoSLASelecionado}
                >
                  <Plus className="mr-2" />
                  Incluir Evento
                </Button>

                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={!tecnologiaSelecionada || !contratoSelecionado || !tipoSLASelecionado}
                >
                  <Upload className="mr-2" />
                  Importar JSON
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />

                <Button variant="outline" onClick={handleExportTemplate}>
                  <FileArrowDown className="mr-2" />
                  Baixar Template JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando eventos...</p>
            </div>
          ) : (
            <EventosSLADataTable
              eventos={eventos}
              onDelete={handleDeleteEvento}
              onImportJSON={(evento) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => handleImportJSON(e as any);
                input.click();
              }}
            />
          )}
        </div>
      </div>

      {showDialog && (
        <EventoSLADialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleAddEvento}
        />
      )}
    </div>
  );
}
