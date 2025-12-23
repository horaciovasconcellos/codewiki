import { SLAPrioridade } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAPrioridadeFormProps {
  data?: SLAPrioridade;
  onChange: (data: SLAPrioridade) => void;
}

export function SLAPrioridadeForm({ data, onChange }: SLAPrioridadeFormProps) {
  const handleChange = (field: keyof SLAPrioridade, value: string) => {
    onChange({
      p1: data?.p1 || '',
      p2: data?.p2 || '',
      p3: data?.p3 || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA por Nível de Prioridade / Severidade</h3>
      
      <div className="space-y-2">
        <Label htmlFor="p1">P1 (Crítico)</Label>
        <Textarea
          id="p1"
          value={data?.p1 || ''}
          onChange={(e) => handleChange('p1', e.target.value)}
          placeholder="Ex: Resposta em 15 minutos, resolução em 4 horas"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p2">P2 (Alto)</Label>
        <Textarea
          id="p2"
          value={data?.p2 || ''}
          onChange={(e) => handleChange('p2', e.target.value)}
          placeholder="Ex: Resposta em 1 hora, resolução em 8 horas"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p3">P3 (Médio)</Label>
        <Textarea
          id="p3"
          value={data?.p3 || ''}
          onChange={(e) => handleChange('p3', e.target.value)}
          placeholder="Ex: Resposta em 4 horas, resolução em 24 horas"
          rows={2}
        />
      </div>
    </div>
  );
}
