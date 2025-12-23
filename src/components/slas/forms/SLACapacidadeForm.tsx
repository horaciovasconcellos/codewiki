import { SLACapacidade } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface SLACapacidadeFormProps {
  data?: SLACapacidade;
  onChange: (data: SLACapacidade) => void;
}

export function SLACapacidadeForm({ data, onChange }: SLACapacidadeFormProps) {
  const handleChange = (field: keyof SLACapacidade, value: number | boolean) => {
    onChange({
      percentualCPUMaxima: data?.percentualCPUMaxima || 0,
      capacidadeStorageLivre: data?.capacidadeStorageLivre || 0,
      escalabilidadeAutomatica: data?.escalabilidadeAutomatica || false,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Capacidade</h3>
      
      <div className="space-y-2">
        <Label htmlFor="cpu-maxima">% CPU Máxima</Label>
        <Input
          id="cpu-maxima"
          type="number"
          min="0"
          max="100"
          value={data?.percentualCPUMaxima || ''}
          onChange={(e) => handleChange('percentualCPUMaxima', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 80"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storage-livre">Capacidade de Storage Livre (GB)</Label>
        <Input
          id="storage-livre"
          type="number"
          min="0"
          value={data?.capacidadeStorageLivre || ''}
          onChange={(e) => handleChange('capacidadeStorageLivre', parseFloat(e.target.value) || 0)}
          placeholder="Ex: 100"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="escalabilidade"
          checked={data?.escalabilidadeAutomatica || false}
          onCheckedChange={(checked) => handleChange('escalabilidadeAutomatica', checked === true)}
        />
        <Label htmlFor="escalabilidade" className="cursor-pointer">
          Escalabilidade Automática
        </Label>
      </div>
    </div>
  );
}
