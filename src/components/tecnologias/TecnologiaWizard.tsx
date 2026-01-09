import { useState, useEffect } from 'react';
import { Tecnologia, Colaborador, CategoriaTecnologia, StatusTecnologia, TipoLicenciamento, MaturidadeInterna, NivelSuporteInterno, Ambiente, ContratoAMS, ContratoTecnologia, ResponsavelTecnologia, CustoSaaS, ManutencaoSaaS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { StepBasicInfo } from './wizard-steps/StepBasicInfo';
import { StepEnvironment } from './wizard-steps/StepEnvironment';
import { StepSupport } from './wizard-steps/StepSupport';
import { StepResponsaveis } from './wizard-steps/StepResponsaveis';
import { StepContracts } from './wizard-steps/StepContracts';
import { StepReview } from './wizard-steps/StepReview';
import { generateUUID } from '@/utils/uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TecnologiaWizardProps {
  tecnologia?: Tecnologia;
  tecnologias: Tecnologia[];
  colaboradores: Colaborador[];
  onSave: (tecnologia: Tecnologia) => void;
  onCancel: () => void;
}

export function TecnologiaWizard({ tecnologia, tecnologias, colaboradores, onSave, onCancel }: TecnologiaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [contratosAMS, setContratosAMS] = useState<ContratoAMS[]>(tecnologia?.contratosAMS || []);
  const [contratos, setContratos] = useState<ContratoTecnologia[]>(tecnologia?.contratos || []);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnologia[]>([]);
  const [custosSaaS, setCustosSaaS] = useState<CustoSaaS[]>(tecnologia?.custosSaaS || []);
  const [manutencoesSaaS, setManutencoesSaaS] = useState<ManutencaoSaaS[]>(tecnologia?.manutencoesSaaS || []);

  const isEditing = !!tecnologia;

  useEffect(() => {
    if (tecnologia?.id) {
      loadResponsaveis(tecnologia.id);
      loadContratos(tecnologia.id);
      loadContratosAMS(tecnologia.id);
      loadCustosSaaS(tecnologia.id);
      loadManutencoesSaaS(tecnologia.id);
    }
  }, [tecnologia?.id]);

  const loadResponsaveis = async (tecnologiaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/responsaveis`);
      if (response.ok) {
        const data = await response.json();
        // Mapear da estrutura da API para a estrutura do frontend
        const responsaveisFormatados = data.map((r: any) => {
          const colaborador = colaboradores.find(c => c.id === r.colaboradorId);
          return {
            id: r.id,
            matriculaFuncionario: colaborador?.matricula || '',
            nomeFuncionario: colaborador?.nome || '',
            dataInicio: r.dataInicio,
            dataTermino: r.dataTermino,
            perfil: r.perfil,
            status: r.status,
          };
        });
        setResponsaveis(responsaveisFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    }
  };

  const loadContratos = async (tecnologiaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos`);
      if (response.ok) {
        const data = await response.json();
        setContratos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
  };

  const loadContratosAMS = async (tecnologiaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/contratos-ams`);
      if (response.ok) {
        const data = await response.json();
        setContratosAMS(data);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos AMS:', error);
    }
  };

  const loadCustosSaaS = async (tecnologiaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/custos-saas`);
      if (response.ok) {
        const data = await response.json();
        setCustosSaaS(data);
      }
    } catch (error) {
      console.error('Erro ao carregar custos SaaS:', error);
    }
  };

  const loadManutencoesSaaS = async (tecnologiaId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tecnologias/${tecnologiaId}/manutencoes-saas`);
      if (response.ok) {
        const data = await response.json();
        setManutencoesSaaS(data);
      }
    } catch (error) {
      console.error('Erro ao carregar manutenções SaaS:', error);
    }
  };

  const totalSteps = 6;

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Dados fundamentais da tecnologia' },
    { number: 2, title: 'Ambientes e Infraestrutura', description: 'Onde a tecnologia está implantada' },
    { number: 3, title: 'Suporte e Maturidade', description: 'Nível de suporte e maturidade interna' },
    { number: 4, title: 'Responsáveis', description: 'Equipe responsável pela tecnologia' },
    { number: 5, title: 'Contratos e Custos', description: 'Informações financeiras e contratuais' },
    { number: 6, title: 'Revisão', description: 'Confirme os dados antes de salvar' },
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!sigla || !nome || !versaoRelease || !fornecedorFabricante) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        if (sigla.length > 30) {
          toast.error('Sigla deve ter até 30 caracteres');
          return false;
        }
        if (nome.length > 50) {
          toast.error('Nome da tecnologia deve ter até 50 caracteres');
          return false;
        }
        if (fornecedorFabricante.length > 50) {
          toast.error('Fornecedor/Fabricante deve ter até 50 caracteres');
          return false;
        }
        const siglaExiste = tecnologias.some(
          t => t.sigla?.toLowerCase() === sigla.toLowerCase() && t.id !== tecnologia?.id
        );
        if (siglaExiste) {
          toast.error('Sigla já cadastrada');
          return false;
        }
        return true;
      case 2:
        if (!ambientes.dev && !ambientes.qa && !ambientes.prod && !ambientes.cloud && !ambientes.onPremise) {
          toast.error('Selecione pelo menos um ambiente');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(1)) return;

    const novaTecnologia: Tecnologia = {
      id: tecnologia?.id || generateUUID(),
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
      contratos,
      contratosAMS,
      responsaveis,
      custosSaaS,
      manutencoesSaaS,
    };

    onSave(novaTecnologia);
    toast.success(isEditing ? 'Tecnologia atualizada com sucesso' : 'Tecnologia cadastrada com sucesso');
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="mr-2" />
                Cancelar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? 'Editar Tecnologia' : 'Nova Tecnologia'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Etapa {currentStep} de {totalSteps}: {steps[currentStep - 1].title}
                </p>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center min-w-[120px]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep > step.number
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.number
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.number ? <Check size={20} /> : step.number}
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-xs font-medium">{step.title}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {currentStep === 1 && (
              <StepBasicInfo
                sigla={sigla}
                setSigla={setSigla}
                nome={nome}
                setNome={setNome}
                versaoRelease={versaoRelease}
                setVersaoRelease={setVersaoRelease}
                categoria={categoria}
                setCategoria={setCategoria}
                status={status}
                setStatus={setStatus}
                fornecedorFabricante={fornecedorFabricante}
                setFornecedorFabricante={setFornecedorFabricante}
                tipoLicenciamento={tipoLicenciamento}
                setTipoLicenciamento={setTipoLicenciamento}
              />
            )}
            {currentStep === 2 && (
              <StepEnvironment
                ambientes={ambientes}
                setAmbientes={setAmbientes}
              />
            )}
            {currentStep === 3 && (
              <StepSupport
                maturidadeInterna={maturidadeInterna}
                setMaturidadeInterna={setMaturidadeInterna}
                nivelSuporteInterno={nivelSuporteInterno}
                setNivelSuporteInterno={setNivelSuporteInterno}
                dataFimSuporteEoS={dataFimSuporteEoS}
                setDataFimSuporteEoS={setDataFimSuporteEoS}
                documentacaoOficial={documentacaoOficial}
                setDocumentacaoOficial={setDocumentacaoOficial}
                repositorioInterno={repositorioInterno}
                setRepositorioInterno={setRepositorioInterno}
              />
            )}
            {currentStep === 4 && (
              <StepResponsaveis
                responsaveis={responsaveis}
                setResponsaveis={setResponsaveis}
                colaboradores={colaboradores}
              />
            )}
            {currentStep === 5 && (
              <StepContracts
                nivelSuporteInterno={nivelSuporteInterno}
                tipoLicenciamento={tipoLicenciamento}
                contratos={contratos}
                setContratos={setContratos}
                contratosAMS={contratosAMS}
                setContratosAMS={setContratosAMS}
                custosSaaS={custosSaaS}
                setCustosSaaS={setCustosSaaS}
                manutencoesSaaS={manutencoesSaaS}
                setManutencoesSaaS={setManutencoesSaaS}
              />
            )}
            {currentStep === 6 && (
              <StepReview
                sigla={sigla}
                nome={nome}
                versaoRelease={versaoRelease}
                categoria={categoria}
                status={status}
                fornecedorFabricante={fornecedorFabricante}
                tipoLicenciamento={tipoLicenciamento}
                ambientes={ambientes}
                dataFimSuporteEoS={dataFimSuporteEoS}
                maturidadeInterna={maturidadeInterna}
                nivelSuporteInterno={nivelSuporteInterno}
                documentacaoOficial={documentacaoOficial}
                repositorioInterno={repositorioInterno}
                contratosAMS={contratosAMS}
                responsaveis={responsaveis}
                custosSaaS={custosSaaS}
                manutencoesSaaS={manutencoesSaaS}
                colaboradores={colaboradores}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2" />
            Anterior
          </Button>
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Check className="mr-2" />
              {isEditing ? 'Atualizar Tecnologia' : 'Cadastrar Tecnologia'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
