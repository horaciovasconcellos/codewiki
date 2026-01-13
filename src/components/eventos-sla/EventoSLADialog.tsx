import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface EventoSLA {
  id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  source: 'monitoring' | 'manual' | 'api';
  sla_eligible: boolean;
}

interface EventoSLADialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (evento: any) => void;
  evento?: EventoSLA;
}

export function EventoSLADialog({ open, onClose, onSave, evento }: EventoSLADialogProps) {
  const [eventId, setEventId] = useState('');
  const [eventType, setEventType] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [source, setSource] = useState<'monitoring' | 'manual' | 'api'>('manual');
  const [slaEligible, setSlaEligible] = useState(true);

  useEffect(() => {
    if (evento) {
      setEventId(evento.event_id || '');
      setEventType(evento.event_type || '');
      setOccurredAt(evento.occurred_at ? evento.occurred_at.substring(0, 16) : '');
      setSource(evento.source || 'manual');
      setSlaEligible(evento.sla_eligible ?? true);
    } else {
      // Reset para novo evento
      setEventId('');
      setEventType('');
      setOccurredAt('');
      setSource('manual');
      setSlaEligible(true);
    }
  }, [evento, open]);

  const handleSubmit = () => {
    if (!eventType || !occurredAt) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    onSave({
      event_id: eventId || undefined,
      event_type: eventType,
      occurred_at: occurredAt,
      source,
      sla_eligible: slaEligible,
    });

    // Resetar formulário
    setEventId('');
    setEventType('');
    setOccurredAt('');
    setSource('manual');
    setSlaEligible(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar Evento' : 'Incluir Evento'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do evento. Se o Event ID já existir, apenas campos vazios serão preenchidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventId">ID do Evento (opcional)</Label>
            <Input
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Deixe vazio para gerar automaticamente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Tipo de Evento *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Selecione o tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sla.incident.opened">Incidente Aberto</SelectItem>
                <SelectItem value="sla.incident.paused">Incidente Pausado</SelectItem>
                <SelectItem value="sla.incident.resumed">Incidente Retomado</SelectItem>
                <SelectItem value="sla.incident.closed">Incidente Fechado</SelectItem>
                <SelectItem value="maintenance.started">Manutenção Iniciada</SelectItem>
                <SelectItem value="maintenance.ended">Manutenção Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurredAt">Data/Hora de Ocorrência *</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Origem *</Label>
            <Select value={source} onValueChange={(value: any) => setSource(value)}>
              <SelectTrigger id="source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monitoring">Monitoramento</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="slaEligible"
              checked={slaEligible}
              onCheckedChange={(checked) => setSlaEligible(checked as boolean)}
            />
            <Label htmlFor="slaEligible" className="cursor-pointer">
              Elegível para SLA
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
