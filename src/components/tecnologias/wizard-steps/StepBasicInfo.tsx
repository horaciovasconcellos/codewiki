import { CategoriaTecnologia, StatusTecnologia, TipoLicenciamento } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepBasicInfoProps {
  sigla: string;
  setSigla: (value: string) => void;
  nome: string;
  setNome: (value: string) => void;
  versaoRelease: string;
  setVersaoRelease: (value: string) => void;
  categoria: CategoriaTecnologia;
  setCategoria: (value: CategoriaTecnologia) => void;
  status: StatusTecnologia;
  setStatus: (value: StatusTecnologia) => void;
  fornecedorFabricante: string;
  setFornecedorFabricante: (value: string) => void;
  tipoLicenciamento: TipoLicenciamento;
  setTipoLicenciamento: (value: TipoLicenciamento) => void;
}

const categoriaOptions: CategoriaTecnologia[] = [
  'Aplicação Terceira',
  'Banco de Dados',
  'Biblioteca',
  'Frontend',
  'Backend',
  'Infraestrutura',
  'Devops',
  'Segurança',
  'Analytics',
  'Integração',
  'Inteligencia Artificial',
  'Outras',
];

const statusOptions: StatusTecnologia[] = [
  'Ativa',
  'Em avaliação',
  'Obsoleta',
  'Descontinuada',
];

const tipoLicenciamentoOptions: TipoLicenciamento[] = [
  'Open Source',
  'Proprietária',
  'SaaS',
  'Subscription',
];

export function StepBasicInfo({
  sigla,
  setSigla,
  nome,
  setNome,
  versaoRelease,
  setVersaoRelease,
  categoria,
  setCategoria,
  status,
  setStatus,
  fornecedorFabricante,
  setFornecedorFabricante,
  tipoLicenciamento,
  setTipoLicenciamento,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sigla">
            Sigla <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sigla"
            value={sigla}
            onChange={(e) => setSigla(e.target.value.toUpperCase())}
            placeholder="REACT-18"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            Até 30 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="versaoRelease">
            Versão ou Release <span className="text-destructive">*</span>
          </Label>
          <Input
            id="versaoRelease"
            value={versaoRelease}
            onChange={(e) => setVersaoRelease(e.target.value)}
            placeholder="18.2.0"
          />
          <p className="text-xs text-muted-foreground">
            Versão completa da tecnologia
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">
            Nome da Tecnologia <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={50}
            placeholder="React"
          />
          <p className="text-xs text-muted-foreground">
            Nome completo ou comercial (máximo 50 caracteres)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">
            Categoria <span className="text-destructive">*</span>
          </Label>
          <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaTecnologia)}>
            <SelectTrigger id="categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoriaOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusTecnologia)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fornecedorFabricante">
            Fornecedor/Fabricante <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fornecedorFabricante"
            value={fornecedorFabricante}
            onChange={(e) => setFornecedorFabricante(e.target.value)}
            maxLength={50}
            placeholder="Meta (Facebook)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoLicenciamento">
            Tipo de Licenciamento <span className="text-destructive">*</span>
          </Label>
          <Select value={tipoLicenciamento} onValueChange={(value) => setTipoLicenciamento(value as TipoLicenciamento)}>
            <SelectTrigger id="tipoLicenciamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipoLicenciamentoOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
