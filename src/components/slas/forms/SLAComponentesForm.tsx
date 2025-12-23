import { SLAComponentes } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAComponentesFormProps {
  data?: SLAComponentes;
  onChange: (data: SLAComponentes) => void;
}

export function SLAComponentesForm({ data, onChange }: SLAComponentesFormProps) {
  const handleChange = (field: keyof SLAComponentes, value: string) => {
    onChange({
      slaBancoDados: data?.slaBancoDados || '',
      slaRede: data?.slaRede || '',
      slaStorage: data?.slaStorage || '',
      slaMicroservico: data?.slaMicroservico || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA Baseado em Componentes</h3>
      
      <div className="space-y-2">
        <Label htmlFor="banco-dados">SLA de Banco de Dados</Label>
        <Textarea
          id="banco-dados"
          value={data?.slaBancoDados || ''}
          onChange={(e) => handleChange('slaBancoDados', e.target.value)}
          placeholder="Ex: Disponibilidade 99.95%, backup a cada 6h"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rede">SLA de Rede</Label>
        <Textarea
          id="rede"
          value={data?.slaRede || ''}
          onChange={(e) => handleChange('slaRede', e.target.value)}
          placeholder="Ex: Latência < 50ms, packet loss < 0.1%"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storage">SLA de Storage</Label>
        <Textarea
          id="storage"
          value={data?.slaStorage || ''}
          onChange={(e) => handleChange('slaStorage', e.target.value)}
          placeholder="Ex: IOPS mínimo 3000, latência < 10ms"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="microservico">SLA de Microserviço</Label>
        <Textarea
          id="microservico"
          value={data?.slaMicroservico || ''}
          onChange={(e) => handleChange('slaMicroservico', e.target.value)}
          placeholder="Ex: Tempo de resposta < 200ms, disponibilidade 99.9%"
          rows={2}
        />
      </div>
    </div>
  );
}
