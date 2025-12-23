import { Runbook, TipoRunbook } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepBasicInfoProps {
  data: Partial<Runbook>;
  updateData: (data: Partial<Runbook>) => void;
  runbooks: Runbook[];
}

export function StepBasicInfo({ data, updateData, runbooks }: StepBasicInfoProps) {
  const hasError = (field: string | undefined) => {
    return !field || field.trim() === '';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sigla" className={hasError(data.sigla) ? 'text-destructive' : ''}>
          Sigla *
        </Label>
        <Input
          id="sigla"
          value={data.sigla || ''}
          onChange={(e) => updateData({ sigla: e.target.value })}
          placeholder="Ex: RB-001"
          maxLength={20}
          className={hasError(data.sigla) ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Identificador único do runbook (máx. 20 caracteres)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricaoResumida" className={hasError(data.descricaoResumida) ? 'text-destructive' : ''}>
          Descrição Resumida *
        </Label>
        <Input
          id="descricaoResumida"
          value={data.descricaoResumida || ''}
          onChange={(e) => updateData({ descricaoResumida: e.target.value })}
          placeholder="Ex: Procedimento de Deploy em Produção"
          maxLength={100}
          className={hasError(data.descricaoResumida) ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Título descritivo do runbook (máx. 100 caracteres)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="finalidade" className={hasError(data.finalidade) ? 'text-destructive' : ''}>
          Finalidade *
        </Label>
        <Textarea
          id="finalidade"
          value={data.finalidade || ''}
          onChange={(e) => updateData({ finalidade: e.target.value })}
          placeholder="Descreva o objetivo e propósito deste runbook..."
          rows={4}
          className={hasError(data.finalidade) ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Objetivo e propósito do runbook
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipoRunbook" className={hasError(data.tipoRunbook) ? 'text-destructive' : ''}>
          Tipo de Runbook *
        </Label>
        <Select
          value={data.tipoRunbook}
          onValueChange={(value: TipoRunbook) => updateData({ tipoRunbook: value })}
        >
          <SelectTrigger id="tipoRunbook" className={hasError(data.tipoRunbook) ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Procedimento de Rotina">Procedimento de Rotina</SelectItem>
            <SelectItem value="Contingência">Contingência</SelectItem>
            <SelectItem value="Tratamento de Incidente">Tratamento de Incidente</SelectItem>
            <SelectItem value="Startup / Shutdown">Startup / Shutdown</SelectItem>
            <SelectItem value="Deploy">Deploy</SelectItem>
            <SelectItem value="Backup">Backup</SelectItem>
            <SelectItem value="Restore">Restore</SelectItem>
            <SelectItem value="Operação Programada">Operação Programada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
