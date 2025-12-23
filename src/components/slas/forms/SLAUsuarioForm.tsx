import { SLAUsuario } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SLAUsuarioFormProps {
  data?: SLAUsuario;
  onChange: (data: SLAUsuario) => void;
}

export function SLAUsuarioForm({ data, onChange }: SLAUsuarioFormProps) {
  const handleChange = (field: keyof SLAUsuario, value: string) => {
    onChange({
      suportePrioritarioAreaCritica: data?.suportePrioritarioAreaCritica || '',
      atendimentoEspecialUsuariosChave: data?.atendimentoEspecialUsuariosChave || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA por Usuário</h3>
      
      <div className="space-y-2">
        <Label htmlFor="area-critica">Suporte Prioritário para Área Crítica</Label>
        <Textarea
          id="area-critica"
          value={data?.suportePrioritarioAreaCritica || ''}
          onChange={(e) => handleChange('suportePrioritarioAreaCritica', e.target.value)}
          placeholder="Ex: Atendimento imediato 24/7 para usuários de áreas críticas"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="usuarios-chave">Atendimento Especial para Usuários-Chave</Label>
        <Textarea
          id="usuarios-chave"
          value={data?.atendimentoEspecialUsuariosChave || ''}
          onChange={(e) => handleChange('atendimentoEspecialUsuariosChave', e.target.value)}
          placeholder="Ex: Canal dedicado, resposta em até 10 minutos"
          rows={3}
        />
      </div>
    </div>
  );
}
