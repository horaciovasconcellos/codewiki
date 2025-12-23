import { SLAOperacional } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAOperacionalFormProps {
  data?: SLAOperacional;
  onChange: (data: SLAOperacional) => void;
}

export function SLAOperacionalForm({ data, onChange }: SLAOperacionalFormProps) {
  const handleChange = (field: keyof SLAOperacional, value: string) => {
    onChange({
      infraestrutura: data?.infraestrutura || '',
      servico: data?.servico || '',
      rede: data?.rede || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA Operacional</h3>
      
      <div className="space-y-2">
        <Label htmlFor="infraestrutura">Infraestrutura</Label>
        <Textarea
          id="infraestrutura"
          value={data?.infraestrutura || ''}
          onChange={(e) => handleChange('infraestrutura', e.target.value)}
          placeholder="Ex: Restauração de servidor em 2 horas"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="servico">Serviço</Label>
        <Textarea
          id="servico"
          value={data?.servico || ''}
          onChange={(e) => handleChange('servico', e.target.value)}
          placeholder="Ex: Restauração de serviço em 1 hora"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rede">Rede</Label>
        <Textarea
          id="rede"
          value={data?.rede || ''}
          onChange={(e) => handleChange('rede', e.target.value)}
          placeholder="Ex: Restauração de conectividade em 30 minutos"
          rows={2}
        />
      </div>
    </div>
  );
}
