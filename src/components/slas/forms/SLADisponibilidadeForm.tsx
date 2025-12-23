import { SLADisponibilidade } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SLADisponibilidadeFormProps {
  data?: SLADisponibilidade;
  onChange: (data: SLADisponibilidade) => void;
}

export function SLADisponibilidadeForm({ data, onChange }: SLADisponibilidadeFormProps) {
  const handleChange = (value: number) => {
    onChange({
      percentualUptime: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Disponibilidade</h3>
      
      <div className="space-y-2">
        <Label htmlFor="uptime">Percentual de Uptime (%)</Label>
        <Input
          id="uptime"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={data?.percentualUptime || ''}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          placeholder="Ex: 99.9"
        />
        <p className="text-xs text-muted-foreground">
          Ex: 99.9% = 43.2 minutos de downtime por mês
        </p>
      </div>
    </div>
  );
}
