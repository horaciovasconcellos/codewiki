import { SLAServico } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface SLAServicoFormProps {
  data?: SLAServico;
  onChange: (data: SLAServico) => void;
}

export function SLAServicoForm({ data, onChange }: SLAServicoFormProps) {
  const handleChange = (field: keyof SLAServico, value: string) => {
    onChange({
      disponibilidadeSistema: data?.disponibilidadeSistema || '',
      backupDiario: data?.backupDiario || '',
      tempoRespostaAPIs: data?.tempoRespostaAPIs || '',
      rpoRtoDR: data?.rpoRtoDR || '',
      clonagem: data?.clonagem || '',
      dataAlvoClonagem: data?.dataAlvoClonagem || '',
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">SLA por Serviço</h3>
      
      <div className="space-y-2">
        <Label htmlFor="disponibilidade">Disponibilidade de Sistema</Label>
        <Textarea
          id="disponibilidade"
          value={data?.disponibilidadeSistema || ''}
          onChange={(e) => handleChange('disponibilidadeSistema', e.target.value)}
          placeholder="Ex: 99.9% de disponibilidade 24/7"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backup">Backup Diário</Label>
        <Textarea
          id="backup"
          value={data?.backupDiario || ''}
          onChange={(e) => handleChange('backupDiario', e.target.value)}
          placeholder="Ex: Backup completo às 02:00, retenção de 30 dias"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tempo-api">Tempo de Resposta de APIs</Label>
        <Textarea
          id="tempo-api"
          value={data?.tempoRespostaAPIs || ''}
          onChange={(e) => handleChange('tempoRespostaAPIs', e.target.value)}
          placeholder="Ex: 95% das requisições em < 200ms"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rpo-rto">RPO/RTO de DR</Label>
        <Textarea
          id="rpo-rto"
          value={data?.rpoRtoDR || ''}
          onChange={(e) => handleChange('rpoRtoDR', e.target.value)}
          placeholder="Ex: RPO 1 hora, RTO 4 horas"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clonagem">Clonagem</Label>
        <Textarea
          id="clonagem"
          value={data?.clonagem || ''}
          onChange={(e) => handleChange('clonagem', e.target.value)}
          placeholder="Ex: Clonagem de ambiente disponível sob demanda"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data-alvo">Data Alvo de Clonagem</Label>
        <Input
          id="data-alvo"
          type="date"
          value={data?.dataAlvoClonagem || ''}
          onChange={(e) => handleChange('dataAlvoClonagem', e.target.value)}
        />
      </div>
    </div>
  );
}
