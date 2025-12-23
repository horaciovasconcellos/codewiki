import { useState } from 'react';
import { 
  Tecnologia, 
  Colaborador, 
  CategoriaTecnologia, 
  StatusTecnologia, 
  TipoLicenciamento,
  MaturidadeInterna,
  NivelSuporteInterno,
  Ambiente
} from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ContratosAMSTable } from './ContratosAMSTable';
import { ResponsaveisTable } from './ResponsaveisTable';
import { CustosSaaSTable } from './CustosSaaSTable';
import { ManutencoesSaaSTable } from './ManutencoesSaaSTable';

interface TecnologiaFormProps {
  tecnologia?: Tecnologia;
  tecnologias: Tecnologia[];
  colaboradores: Colaborador[];
  onSave: (tecnologia: Tecnologia) => void;
  trigger?: React.ReactNode;
}

const categoriaOptions: CategoriaTecnologia[] = [
  'Aplicação Terceira',
  'Banco de Dados',
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

const maturidadeOptions: MaturidadeInterna[] = [
  'Experimental',
  'Adotada',
  'Padronizada',
  'Restrita',
];

const nivelSuporteOptions: NivelSuporteInterno[] = [
  'Sem Suporte Interno',
  'Suporte Básico',
  'Suporte Intermediário',
  'Suporte Avançado',
  'Suporte Completo / Especializado',
  'AMS',
];

export function TecnologiaForm({ tecnologia, tecnologias, colaboradores, onSave, trigger }: TecnologiaFormProps) {
  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState(tecnologia?.sigla || '');
  const [nome, setNome] = useState(tecnologia?.nome || '');
  const [versaoRelease, setVersaoRelease] = useState(tecnologia?.versaoRelease || '');
  const [categoria, setCategoria] = useState<CategoriaTecnologia>(tecnologia?.categoria || 'Backend');
  const [status, setStatus] = useState<StatusTecnologia>(tecnologia?.status || 'Ativa');
  const [fornecedorFabricante, setFornecedorFabricante] = useState(tecnologia?.fornecedorFabricante || '');
  const [tipoLicenciamento, setTipoLicenciamento] = useState<TipoLicenciamento>(tecnologia?.tipoLicenciamento || 'Open Source');
  const [ambientes, setAmbientes] = useState<Ambiente>(tecnologia?.ambientes || {
    dev: false,
    qa: false,
    prod: false,
    cloud: false,
    onPremise: false,
  });
  const [dataFimSuporteEoS, setDataFimSuporteEoS] = useState(tecnologia?.dataFimSuporteEoS || '');
  const [maturidadeInterna, setMaturidadeInterna] = useState<MaturidadeInterna>(tecnologia?.maturidadeInterna || 'Experimental');
  const [nivelSuporteInterno, setNivelSuporteInterno] = useState<NivelSuporteInterno>(tecnologia?.nivelSuporteInterno || 'Sem Suporte Interno');
  const [documentacaoOficial, setDocumentacaoOficial] = useState(tecnologia?.documentacaoOficial || '');
  const [repositorioInterno, setRepositorioInterno] = useState(tecnologia?.repositorioInterno || '');
  const [contratosAMS, setContratosAMS] = useState(tecnologia?.contratosAMS || []);
  const [responsaveis, setResponsaveis] = useState(tecnologia?.responsaveis || []);
  const [custosSaaS, setCustosSaaS] = useState(tecnologia?.custosSaaS || []);
  const [manutencoesSaaS, setManutencoesSaaS] = useState(tecnologia?.manutencoesSaaS || []);

  const isEditing = !!tecnologia;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !isEditing) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSigla('');
    setNome('');
    setVersaoRelease('');
    setCategoria('Backend');
    setStatus('Ativa');
    setFornecedorFabricante('');
    setTipoLicenciamento('Open Source');
    setAmbientes({ dev: false, qa: false, prod: false, cloud: false, onPremise: false });
    setDataFimSuporteEoS('');
    setMaturidadeInterna('Experimental');
    setNivelSuporteInterno('Sem Suporte Interno');
    setDocumentacaoOficial('');
    setRepositorioInterno('');
    setContratosAMS([]);
    setResponsaveis([]);
    setCustosSaaS([]);
    setManutencoesSaaS([]);
  };

  const validateSigla = (siglaValue: string): boolean => {
    const regex = /^[A-Za-z0-9]{1,10}-[A-Za-z0-9]{1,8}$/;
    return regex.test(siglaValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sigla || !nome || !versaoRelease || !fornecedorFabricante) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateSigla(sigla)) {
      toast.error('Sigla deve estar no formato AAAAA-Versao (até 10 caracteres alfanuméricos - até 8 caracteres)');
      return;
    }

    if (nome.length > 50) {
      toast.error('Nome da tecnologia deve ter até 50 caracteres');
      return;
    }

    if (fornecedorFabricante.length > 50) {
      toast.error('Fornecedor/Fabricante deve ter até 50 caracteres');
      return;
    }

    const siglaExiste = tecnologias.some(
      t => t.sigla?.toLowerCase() === sigla.toLowerCase() && t.id !== tecnologia?.id
    );

    if (siglaExiste) {
      toast.error('Sigla já cadastrada');
      return;
    }

    const novaTecnologia: Tecnologia = {
      id: tecnologia?.id || crypto.randomUUID(),
      sigla,
      nome,
      versaoRelease,
      categoria,
      status,
      fornecedorFabricante,
      tipoLicenciamento,
      ambientes,
      dataFimSuporteEoS: dataFimSuporteEoS || undefined,
      maturidadeInterna,
      nivelSuporteInterno,
      documentacaoOficial: documentacaoOficial || undefined,
      repositorioInterno: repositorioInterno || undefined,
      contratos: [],
      contratosAMS,
      responsaveis,
      custosSaaS,
      manutencoesSaaS,
    };

    onSave(novaTecnologia);
    toast.success(isEditing ? 'Tecnologia atualizada com sucesso' : 'Tecnologia cadastrada com sucesso');
    setOpen(false);
    if (!isEditing) {
      resetForm();
    }
  };

  const updateAmbiente = (key: keyof Ambiente, value: boolean) => {
    setAmbientes(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2" />
            Nova Tecnologia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tecnologia' : 'Nova Tecnologia'}</DialogTitle>
          <DialogDescription>
            Configure as informações da tecnologia e seus relacionamentos
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(95vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla (AAAAA-Versao) *</Label>
                  <Input
                    id="sigla"
                    value={sigla}
                    onChange={(e) => setSigla(e.target.value.toUpperCase())}
                    placeholder="REACT-18"
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground">Formato: até 10 caracteres - até 8 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Tecnologia *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={50}
                    placeholder="React"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versaoRelease">Versão ou Release *</Label>
                  <Input
                    id="versaoRelease"
                    value={versaoRelease}
                    onChange={(e) => setVersaoRelease(e.target.value)}
                    placeholder="18.2.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria da Tecnologia *</Label>
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
                  <Label htmlFor="status">Status *</Label>
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
                  <Label htmlFor="fornecedorFabricante">Fornecedor/Fabricante *</Label>
                  <Input
                    id="fornecedorFabricante"
                    value={fornecedorFabricante}
                    onChange={(e) => setFornecedorFabricante(e.target.value)}
                    maxLength={50}
                    placeholder="Meta (Facebook)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoLicenciamento">Tipo de Licenciamento *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="dataFimSuporteEoS">Data Fim de Suporte (EoS/EoL)</Label>
                  <Input
                    id="dataFimSuporteEoS"
                    type="date"
                    value={dataFimSuporteEoS}
                    onChange={(e) => setDataFimSuporteEoS(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maturidadeInterna">Maturidade Interna *</Label>
                  <Select value={maturidadeInterna} onValueChange={(value) => setMaturidadeInterna(value as MaturidadeInterna)}>
                    <SelectTrigger id="maturidadeInterna">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maturidadeOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nivelSuporteInterno">Nível de Suporte Interno *</Label>
                  <Select value={nivelSuporteInterno} onValueChange={(value) => setNivelSuporteInterno(value as NivelSuporteInterno)}>
                    <SelectTrigger id="nivelSuporteInterno">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nivelSuporteOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ambientes *</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="dev" 
                      checked={ambientes.dev}
                      onCheckedChange={(checked) => updateAmbiente('dev', checked as boolean)}
                    />
                    <label htmlFor="dev" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Dev
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="qa" 
                      checked={ambientes.qa}
                      onCheckedChange={(checked) => updateAmbiente('qa', checked as boolean)}
                    />
                    <label htmlFor="qa" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      QA
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prod" 
                      checked={ambientes.prod}
                      onCheckedChange={(checked) => updateAmbiente('prod', checked as boolean)}
                    />
                    <label htmlFor="prod" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Prod
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cloud" 
                      checked={ambientes.cloud}
                      onCheckedChange={(checked) => updateAmbiente('cloud', checked as boolean)}
                    />
                    <label htmlFor="cloud" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Cloud
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="onPremise" 
                      checked={ambientes.onPremise}
                      onCheckedChange={(checked) => updateAmbiente('onPremise', checked as boolean)}
                    />
                    <label htmlFor="onPremise" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      On-Premise
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentacaoOficial">Documentação Oficial (URL)</Label>
                  <Input
                    id="documentacaoOficial"
                    type="url"
                    value={documentacaoOficial}
                    onChange={(e) => setDocumentacaoOficial(e.target.value)}
                    placeholder="https://react.dev"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repositorioInterno">Repositório Interno (URL)</Label>
                  <Input
                    id="repositorioInterno"
                    type="url"
                    value={repositorioInterno}
                    onChange={(e) => setRepositorioInterno(e.target.value)}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            <ResponsaveisTable
              responsaveis={responsaveis}
              colaboradores={colaboradores}
              onChange={setResponsaveis}
            />

            {nivelSuporteInterno === 'AMS' && (
              <>
                <Separator />
                <ContratosAMSTable
                  contratos={contratosAMS}
                  onChange={setContratosAMS}
                />
              </>
            )}

            {tipoLicenciamento === 'SaaS' && (
              <>
                <Separator />
                <CustosSaaSTable
                  custos={custosSaaS}
                  onChange={setCustosSaaS}
                />
                <Separator />
                <ManutencoesSaaSTable
                  manutencoes={manutencoesSaaS}
                  onChange={setManutencoesSaaS}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}