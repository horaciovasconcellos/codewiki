import { SLAPerformance } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SLAPerformanceFormProps {
  data?: SLAPerformance;
  onChange: (data: SLAPerformance) => void;
}

export function SLAPerformanceForm({ data, onChange }: SLAPerformanceFormProps) {
  const handleChange = (field: keyof SLAPerformance, value: number) => {
    onChange({
      latenciaMaxima: data?.latenciaMaxima || 0,
      throughput: data?.throughput || 0,
      iopsStorage: data?.iopsStorage || 0,
      errosPorMinuto: data?.errosPorMinuto || 0,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Performance</h3>
      
      <div className="space-y-2">
        <Label htmlFor="latencia">Latência Máxima (ms)</Label>
        <Input
          id="latencia"
          type="number"
          min="0"
          value={data?.latenciaMaxima || ''}
          onChange={(e) => handleChange('latenciaMaxima', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="throughput">Throughput (req/s)</Label>
        <Input
          id="throughput"
          type="number"
          min="0"
          value={data?.throughput || ''}
          onChange={(e) => handleChange('throughput', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 1000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="iops">IOPS de Storage</Label>
        <Input
          id="iops"
          type="number"
          min="0"
          value={data?.iopsStorage || ''}
          onChange={(e) => handleChange('iopsStorage', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 3000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="erros">Erros por Minuto</Label>
        <Input
          id="erros"
          type="number"
          min="0"
          value={data?.errosPorMinuto || ''}
          onChange={(e) => handleChange('errosPorMinuto', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 5"
        />
      </div>
    </div>
  );
}
