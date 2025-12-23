import { useState, useEffect } from 'react';
import { Servidor, AplicacaoServidor, Aplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { StepBasicInfo } from './wizard-steps/StepBasicInfo';
import { StepAplicacoes } from './wizard-steps/StepAplicacoes';
import { StepReview } from './wizard-steps/StepReview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ServidorWizardProps {
  servidor?: Servidor;
  onSave: (servidor: Servidor, aplicacoesServidor?: AplicacaoServidor[]) => void;
  onCancel: () => void;
}

export function ServidorWizard({ servidor, onSave, onCancel }: ServidorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  
  // Dados do Servidor (Step 1)
  const [sigla, setSigla] = useState(servidor?.sigla || '');
  const [hostname, setHostname] = useState(servidor?.hostname || '');
  const [tipo, setTipo] = useState(servidor?.tipo || 'Virtual');
  const [ambiente, setAmbiente] = useState(servidor?.ambiente || 'Produção');
  const [finalidade, setFinalidade] = useState(servidor?.finalidade || 'Aplicação');
  const [status, setStatus] = useState(servidor?.status || 'Ativo');
  const [provedor, setProvedor] = useState(servidor?.provedor || 'On-Premise');
  const [datacenterRegiao, setDatacenterRegiao] = useState(servidor?.datacenterRegiao || '');
  const [zonaAvailability, setZonaAvailability] = useState(servidor?.zonaAvailability || '');
  const [clusterHost, setClusterHost] = useState(servidor?.clusterHost || '');
  const [virtualizador, setVirtualizador] = useState(servidor?.virtualizador || 'VMware');
  const [sistemaOperacional, setSistemaOperacional] = useState(servidor?.sistemaOperacional || 'Ubuntu');
  const [distribuicaoVersao, setDistribuicaoVersao] = useState(servidor?.distribuicaoVersao || '');
  const [arquitetura, setArquitetura] = useState(servidor?.arquitetura || '');
  const [ferramentaMonitoramento, setFerramentaMonitoramento] = useState(servidor?.ferramentaMonitoramento || 'Zabbix');
  const [backupDiario, setBackupDiario] = useState(servidor?.backupDiario || false);
  const [backupSemanal, setBackupSemanal] = useState(servidor?.backupSemanal || false);
  const [backupMensal, setBackupMensal] = useState(servidor?.backupMensal || false);
  
  // Aplicações do Servidor (Step 2)
  const [aplicacoesServidor, setAplicacoesServidor] = useState<AplicacaoServidor[]>([]);

  const isEditing = !!servidor;

  useEffect(() => {
    loadAplicacoes();
    if (servidor?.id) {
      loadAplicacoesServidor(servidor.id);
    }
  }, [servidor?.id]);

  const loadAplicacoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/aplicacoes`);
      if (response.ok) {
        const data = await response.json();
        setAplicacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
    }
  };

  const loadAplicacoesServidor = async (servidorId: string) => {
    try {
      console.log('Carregando aplicações do servidor:', servidorId);
      const response = await fetch(`${API_URL}/api/servidores/${servidorId}/aplicacoes`);
      if (response.ok) {
        const data = await response.json();
        console.log('Aplicações carregadas:', data);
        setAplicacoesServidor(data);
      } else {
        console.error('Erro na resposta:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicações do servidor:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Dados do servidor' },
    { number: 2, title: 'Aplicações', description: 'Aplicações do servidor' },
    { number: 3, title: 'Revisão', description: 'Confirme os dados' }
  ];

  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!sigla || sigla.length > 20) {
          toast.error('Sigla é obrigatória e deve ter no máximo 20 caracteres');
          return false;
        }
        if (!hostname || hostname.length > 50) {
          toast.error('Hostname é obrigatório e deve ter no máximo 50 caracteres');
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      const servidorData: Servidor = {
        id: servidor?.id || '',
        sigla,
        hostname,
        tipo,
        ambiente,
        finalidade,
        status,
        provedor,
        datacenterRegiao,
        zonaAvailability,
        clusterHost,
        virtualizador,
        sistemaOperacional,
        distribuicaoVersao,
        arquitetura,
        ferramentaMonitoramento,
        backupDiario,
        backupSemanal,
        backupMensal
      };

      // Passar as aplicações para serem salvas no ServidoresView
      onSave(servidorData, aplicacoesServidor);
      toast.success(isEditing ? 'Servidor atualizado com sucesso' : 'Servidor cadastrado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar servidor:', error);
      toast.error('Erro ao salvar servidor');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicInfo
            sigla={sigla}
            setSigla={setSigla}
            hostname={hostname}
            setHostname={setHostname}
            tipo={tipo}
            setTipo={setTipo}
            ambiente={ambiente}
            setAmbiente={setAmbiente}
            finalidade={finalidade}
            setFinalidade={setFinalidade}
            status={status}
            setStatus={setStatus}
            provedor={provedor}
            setProvedor={setProvedor}
            datacenterRegiao={datacenterRegiao}
            setDatacenterRegiao={setDatacenterRegiao}
            zonaAvailability={zonaAvailability}
            setZonaAvailability={setZonaAvailability}
            clusterHost={clusterHost}
            setClusterHost={setClusterHost}
            virtualizador={virtualizador}
            setVirtualizador={setVirtualizador}
            sistemaOperacional={sistemaOperacional}
            setSistemaOperacional={setSistemaOperacional}
            distribuicaoVersao={distribuicaoVersao}
            setDistribuicaoVersao={setDistribuicaoVersao}
            arquitetura={arquitetura}
            setArquitetura={setArquitetura}
            ferramentaMonitoramento={ferramentaMonitoramento}
            setFerramentaMonitoramento={setFerramentaMonitoramento}
            backupDiario={backupDiario}
            setBackupDiario={setBackupDiario}
            backupSemanal={backupSemanal}
            setBackupSemanal={setBackupSemanal}
            backupMensal={backupMensal}
            setBackupMensal={setBackupMensal}
          />
        );
      case 2:
        return (
          <StepAplicacoes
            aplicacoes={aplicacoes}
            aplicacoesServidor={aplicacoesServidor}
            setAplicacoesServidor={setAplicacoesServidor}
          />
        );
      case 3:
        return (
          <StepReview
            servidor={{
              sigla,
              hostname,
              tipo,
              ambiente,
              finalidade,
              status,
              provedor,
              datacenterRegiao,
              zonaAvailability,
              clusterHost,
              virtualizador,
              sistemaOperacional,
              distribuicaoVersao,
              arquitetura,
              ferramentaMonitoramento,
              backupDiario,
              backupSemanal,
              backupMensal
            } as Servidor}
            aplicacoesServidor={aplicacoesServidor}
            aplicacoes={aplicacoes}
          />
        );
      default:
        return null;
    }
  };

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
                  {isEditing ? 'Editar Servidor' : 'Novo Servidor'}
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
            {renderStep()}
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
              {isEditing ? 'Atualizar Servidor' : 'Cadastrar Servidor'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
