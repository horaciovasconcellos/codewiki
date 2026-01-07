import { NivelMaturidade, Frequencia, Complexidade } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface StepBasicInfoProcessoProps {
  identificacao: string;
  setIdentificacao: (value: string) => void;
  nome: string;
  setNome: (value: string) => void;
  descricao: string;
  setDescricao: (value: string) => void;
  nivelMaturidade: NivelMaturidade;
  setNivelMaturidade: (value: NivelMaturidade) => void;
  areaResponsavel: string;
  setAreaResponsavel: (value: string) => void;
  frequencia: Frequencia;
  setFrequencia: (value: Frequencia) => void;
  duracaoMedia: number;
  setDuracaoMedia: (value: number) => void;
  complexidade: Complexidade;
  setComplexidade: (value: Complexidade) => void;
}

export function StepBasicInfoProcesso({
  identificacao,
  setIdentificacao,
  nome,
  setNome,
  descricao,
  setDescricao,
  nivelMaturidade,
  setNivelMaturidade,
  areaResponsavel,
  setAreaResponsavel,
  frequencia,
  setFrequencia,
  duracaoMedia,
  setDuracaoMedia,
  complexidade,
  setComplexidade,
}: StepBasicInfoProcessoProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="identificacao">
            Sigla <span className="text-destructive">*</span>
          </Label>
          <Input
            id="identificacao"
            value={identificacao}
            onChange={(e) => setIdentificacao(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123-12345"
            maxLength={12}
          />
          <p className="text-xs text-muted-foreground">
            Formato: 6 alfanuméricos-5 dígitos
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">
            Nome do Processo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Gestão de Contratos"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Nome descritivo do processo
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area-responsavel">
            Área Responsável <span className="text-destructive">*</span>
          </Label>
          <Input
            id="area-responsavel"
            value={areaResponsavel}
            onChange={(e) => setAreaResponsavel(e.target.value)}
            placeholder="Ex: Tecnologia da Informação"
          />
          <p className="text-xs text-muted-foreground">
            Área gestora do processo
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o processo de negócio detalhadamente"
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {descricao.length}/500 caracteres
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nivel-maturidade">Nível de Maturidade</Label>
          <Select value={nivelMaturidade} onValueChange={(value) => setNivelMaturidade(value as NivelMaturidade)}>
            <SelectTrigger id="nivel-maturidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inicial">Inicial</SelectItem>
              <SelectItem value="Repetível">Repetível</SelectItem>
              <SelectItem value="Definido">Definido</SelectItem>
              <SelectItem value="Gerenciado">Gerenciado</SelectItem>
              <SelectItem value="Otimizado">Otimizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequencia">Frequência</Label>
          <Select value={frequencia} onValueChange={(value) => setFrequencia(value as Frequencia)}>
            <SelectTrigger id="frequencia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Diário">Diário</SelectItem>
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Quinzenal">Quinzenal</SelectItem>
              <SelectItem value="Mensal">Mensal</SelectItem>
              <SelectItem value="Trimestral">Trimestral</SelectItem>
              <SelectItem value="Ad-Hoc">Ad-Hoc</SelectItem>
              <SelectItem value="Anual">Anual</SelectItem>
              <SelectItem value="Bi-Anual">Bi-Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="complexidade">Complexidade</Label>
          <Select value={complexidade} onValueChange={(value) => setComplexidade(value as Complexidade)}>
            <SelectTrigger id="complexidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Muito Baixa">Muito Baixa</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Muito Alta">Muito Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracao-media">
            Duração Média (horas) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="duracao-media"
            type="number"
            value={duracaoMedia || ''}
            onChange={(e) => setDuracaoMedia(Number(e.target.value) || 0)}
            placeholder="Ex: 4"
            min="0.1"
            step="0.5"
          />
          <p className="text-xs text-muted-foreground">
            Tempo médio de execução
          </p>
        </div>
      </div>
    </div>
  );
}
