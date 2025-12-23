import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getTodayDate } from '@/lib/utils';

interface DadosBasicosStepProps {
  matricula: string;
  setMatricula: (value: string) => void;
  nome: string;
  setNome: (value: string) => void;
  setor: string;
  setSetor: (value: string) => void;
  dataAdmissao: string;
  setDataAdmissao: (value: string) => void;
  dataDemissao: string;
  setDataDemissao: (value: string) => void;
}

export function DadosBasicosStep({
  matricula,
  setMatricula,
  nome,
  setNome,
  setor,
  setSetor,
  dataAdmissao,
  setDataAdmissao,
  dataDemissao,
  setDataDemissao
}: DadosBasicosStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="matricula">
            Matrícula <span className="text-destructive">*</span>
          </Label>
          <Input
            id="matricula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            placeholder="Ex: 5664"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo do colaborador"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setor">
            Setor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            placeholder="Ex: TI, RH, Financeiro"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataAdmissao">
            Data de Admissão <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dataAdmissao"
            type="date"
            value={dataAdmissao}
            onChange={(e) => setDataAdmissao(e.target.value)}
            max={getTodayDate()}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataDemissao">Data de Demissão</Label>
          <Input
            id="dataDemissao"
            type="date"
            value={dataDemissao}
            onChange={(e) => setDataDemissao(e.target.value)}
            min={dataAdmissao}
          />
        </div>
      </div>
    </div>
  );
}
