import { SLAApoio } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAApoioFormProps {
  data?: SLAApoio;
  onChange: (data: SLAApoio) => void;
}

export function SLAApoioForm({ data, onChange }: SLAApoioFormProps) {
  const handleChange = (field: keyof SLAApoio, value: string) => {
    onChange({
      slaEmpresa: data?.slaEmpresa || '',
      slaFornecedores: data?.slaFornecedores || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Apoio</h3>
      
      <div className="space-y-2">
        <Label htmlFor="sla-empresa">SLA da Empresa</Label>
        <Textarea
          id="sla-empresa"
          value={data?.slaEmpresa || ''}
          onChange={(e) => handleChange('slaEmpresa', e.target.value)}
          placeholder="Descreva o SLA da empresa"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sla-fornecedores">SLA de Fornecedores Terceirizados</Label>
        <Textarea
          id="sla-fornecedores"
          value={data?.slaFornecedores || ''}
          onChange={(e) => handleChange('slaFornecedores', e.target.value)}
          placeholder="Descreva os SLAs dos fornecedores terceirizados"
          rows={3}
        />
      </div>
    </div>
  );
}
