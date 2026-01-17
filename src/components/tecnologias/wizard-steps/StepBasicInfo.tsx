import { CamadaTecnologia, CategoriaTecnologia, StatusTecnologia, TipoLicenciamento } from '@/lib/types';
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
  camada: CamadaTecnologia;
  setCamada: (value: CamadaTecnologia) => void;
  categoria: CategoriaTecnologia;
  setCategoria: (value: CategoriaTecnologia) => void;
  status: StatusTecnologia;
  setStatus: (value: StatusTecnologia) => void;
  fornecedorFabricante: string;
  setFornecedorFabricante: (value: string) => void;
  tipoLicenciamento: TipoLicenciamento;
  setTipoLicenciamento: (value: TipoLicenciamento) => void;
}

const camadaOptions: CamadaTecnologia[] = [
  'Front-End',
  'UI',
  'Design',
  'Back-end',
  'Linguagem',
];

const categoriaOptions: CategoriaTecnologia[] = [
  'Aplicação Terceira',
  'Banco de Dados',
  'Biblioteca',
  'Framework',
  'Gerenciador',
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
  camada,
  setCamada,
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
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            Até 50 caracteres
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
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            Até 50 caracteres
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
            maxLength={100}
            placeholder="React"
          />
          <p className="text-xs text-muted-foreground">
            Até 100 caracteres
          </p>
        </div>

        {/* Camada, Categoria e Status na mesma linha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="camada">
              Camada <span className="text-destructive">*</span>
            </Label>
            <Select value={camada} onValueChange={(value) => setCamada(value as CamadaTecnologia)}>
              <SelectTrigger id="camada">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {camadaOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        {/* Fornecedor e Tipo de Licenciamento na mesma linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="fornecedorFabricante">
              Fornecedor/Fabricante <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fornecedorFabricante"
              value={fornecedorFabricante}
              onChange={(e) => setFornecedorFabricante(e.target.value)}
              maxLength={100}
              placeholder="Meta (Facebook)"
            />
            <p className="text-xs text-muted-foreground">
              Até 100 caracteres
            </p>
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
    </div>
  );
}
