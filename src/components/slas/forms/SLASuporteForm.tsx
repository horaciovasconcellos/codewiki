import { SLASuporteAtendimento } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SLASuporteFormProps {
  data?: SLASuporteAtendimento;
  onChange: (data: SLASuporteAtendimento) => void;
}

export function SLASuporteForm({ data, onChange }: SLASuporteFormProps) {
  const handleChange = (field: keyof SLASuporteAtendimento, value: string) => {
    onChange({
      tempoResposta: data?.tempoResposta || '',
      tempoSolucao: data?.tempoSolucao || '',
      horaInicialAtendimento: data?.horaInicialAtendimento || '',
      horaTerminoAtendimento: data?.horaTerminoAtendimento || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA de Suporte / Atendimento</h3>
      
      <div className="space-y-2">
        <Label htmlFor="tempo-resposta">Tempo de Resposta</Label>
        <Input
          id="tempo-resposta"
          value={data?.tempoResposta || ''}
          onChange={(e) => handleChange('tempoResposta', e.target.value)}
          placeholder="Ex: 2 horas"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempo-solucao">Tempo de Solução</Label>
        <Input
          id="tempo-solucao"
          value={data?.tempoSolucao || ''}
          onChange={(e) => handleChange('tempoSolucao', e.target.value)}
          placeholder="Ex: 24 horas"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hora-inicial">Hora Inicial de Atendimento</Label>
          <Input
            id="hora-inicial"
            type="time"
            value={data?.horaInicialAtendimento || ''}
            onChange={(e) => handleChange('horaInicialAtendimento', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora-termino">Hora de Término de Atendimento</Label>
          <Input
            id="hora-termino"
            type="time"
            value={data?.horaTerminoAtendimento || ''}
            onChange={(e) => handleChange('horaTerminoAtendimento', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
