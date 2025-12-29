import { SLAUsuario } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAClienteFormProps {
  data?: SLAUsuario;
  onChange: (data: SLAUsuario) => void;
}

export function SLAClienteForm({ data, onChange }: SLAClienteFormProps) {
  const handleChange = (field: keyof SLAUsuario, value: string) => {
    onChange({
      suportePrioritarioAreaCritica: data?.suportePrioritarioAreaCritica || '',
      atendimentoEspecialUsuariosChave: data?.atendimentoEspecialUsuariosChave || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA por Cliente</h3>
      
      <div className="space-y-2">
        <Label htmlFor="area-critica-cliente">Suporte Prioritário para Área Crítica</Label>
        <Textarea
          id="area-critica-cliente"
          value={data?.suportePrioritarioAreaCritica || ''}
          onChange={(e) => handleChange('suportePrioritarioAreaCritica', e.target.value)}
          placeholder="Ex: Atendimento imediato 24/7 para clientes de áreas críticas"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientes-chave">Atendimento Especial para Clientes-Chave</Label>
        <Textarea
          id="clientes-chave"
          value={data?.atendimentoEspecialUsuariosChave || ''}
          onChange={(e) => handleChange('atendimentoEspecialUsuariosChave', e.target.value)}
          placeholder="Ex: Canal dedicado, resposta em até 10 minutos"
          rows={3}
        />
      </div>
    </div>
  );
}
