import { useState } from 'react';
import { ExecucaoTeste, Colaborador, CasoTeste, AmbienteTeste, StatusExecucao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft as ArrowLeftIcon, Upload as UploadIcon, X as XIcon, FileText as FileTextIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ExecucaoTesteWizardProps {
  onClose: () => void;
  onSave: (execucao: Partial<ExecucaoTeste>, arquivo?: File) => Promise<void>;
  execucao?: ExecucaoTeste;
  casosTeste: CasoTeste[];
  colaboradores: Colaborador[];
  aplicacaoId: string;
  aplicacaoNome?: string;
}

const ambientes: AmbienteTeste[] = ['DEV', 'QA', 'HML', 'PRD'];
const statusExecucoes: StatusExecucao[] = ['Aguardando', 'Em Execucao', 'Passou', 'Falhou', 'Bloqueado', 'Cancelado'];

type WizardStep = 'basicos' | 'registros' | 'evidencia';

export function ExecucaoTesteWizard({
  onClose,
  onSave,
  execucao,
  casosTeste,
  colaboradores,
  aplicacaoId,
  aplicacaoNome
}: ExecucaoTesteWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basicos');
  const [loading, setLoading] = useState(false);
  
  const [casoTesteTitulo, setCasoTesteTitulo] = useState(execucao?.casoTesteTitulo || '');
  const [requisitoVinculado, setRequisitoVinculado] = useState(execucao?.requisitoVinculado || '');
  const [ambiente, setAmbiente] = useState<AmbienteTeste>(execucao?.ambiente || 'QA');
  const [executorId, setExecutorId] = useState(execucao?.executorId || '');
  const [dataHoraInicio] = useState(
    execucao?.dataHoraInicio 
      ? new Date(execucao.dataHoraInicio).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );
  const [dataHoraTermino, setDataHoraTermino] = useState(
    execucao?.dataHoraTermino ? new Date(execucao.dataHoraTermino).toISOString().slice(0, 16) : ''
  );
  const [registroAtividades, setRegistroAtividades] = useState(execucao?.registroAtividades || '');
  const [resultadoExecucao, setResultadoExecucao] = useState(execucao?.resultadoExecucao || '');
  const [statusExecucao, setStatusExecucao] = useState<StatusExecucao>(execucao?.statusExecucao || 'Aguardando');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoExistente, setArquivoExistente] = useState(execucao?.arquivoNomeOriginal || '');

  const isEditing = !!execucao;

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'basicos', label: 'Informações Básicas' },
    { id: 'registros', label: 'Registros e Resultados' },
    { id: 'evidencia', label: 'Upload de Evidência' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleProximo = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleAnterior = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      setArquivoExistente('');
    }
  };

  const handleSubmit = async () => {
    if (!casoTesteTitulo || !executorId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const execucaoData: Partial<ExecucaoTeste> = {
        aplicacaoId,
        casoTesteTitulo,
        requisitoVinculado,
        ambiente,
        executorId,
        dataHoraInicio,
        dataHoraTermino: dataHoraTermino || undefined,
        registroAtividades,
        resultadoExecucao,
        statusExecucao
      };

      await onSave(execucaoData, arquivo || undefined);
      onClose();
      toast.success(`Execução de teste ${isEditing ? 'atualizada' : 'criada'} com sucesso`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} execução de teste`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basicos':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="casoTesteTitulo">
                Caso de Teste <span className="text-red-500">*</span>
              </Label>
              <Input
                id="casoTesteTitulo"
                value={casoTesteTitulo}
                onChange={(e) => setCasoTesteTitulo(e.target.value.slice(0, 100))}
                maxLength={100}
                placeholder="Digite o título do caso de teste..."
              />
              <div className="text-xs text-muted-foreground text-right">
                {casoTesteTitulo.length}/100 caracteres
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requisito">Requisito Vinculado</Label>
              <Input
                id="requisito"
                value={requisitoVinculado}
                onChange={(e) => setRequisitoVinculado(e.target.value)}
                placeholder="Ex: REQ-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Ambiente <span className="text-red-500">*</span>
                </Label>
                <Select value={ambiente} onValueChange={(value) => setAmbiente(value as AmbienteTeste)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ambientes.map((amb) => (
                      <SelectItem key={amb} value={amb}>
                        {amb}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status da Execução</Label>
                <Select value={statusExecucao} onValueChange={(value) => setStatusExecucao(value as StatusExecucao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusExecucoes.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Executor <span className="text-red-500">*</span>
              </Label>
              <Select value={executorId} onValueChange={setExecutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o executor" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores
                    .filter(c => !c.dataDemissao)
                    .map((colab) => (
                      <SelectItem key={colab.id} value={colab.id.toString()}>
                        {colab.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataHoraInicio">Data/Hora Início</Label>
                <Input
                  id="dataHoraInicio"
                  type="datetime-local"
                  value={dataHoraInicio}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataHoraTermino">Data/Hora Término</Label>
                <Input
                  id="dataHoraTermino"
                  type="datetime-local"
                  value={dataHoraTermino}
                  onChange={(e) => setDataHoraTermino(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'registros':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registroAtividades">Registro de Atividades</Label>
              <Textarea
                id="registroAtividades"
                value={registroAtividades}
                onChange={(e) => setRegistroAtividades(e.target.value)}
                placeholder="Descreva as atividades realizadas durante a execução..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultadoExecucao">Resultado da Execução</Label>
              <Textarea
                id="resultadoExecucao"
                value={resultadoExecucao}
                onChange={(e) => setResultadoExecucao(e.target.value)}
                placeholder="Descreva os resultados obtidos..."
                rows={8}
              />
            </div>
          </div>
        );

      case 'evidencia':
        return (
          <div className="space-y-4">
            <CardDescription>
              Anexe documentos de evidência (prints, relatórios, etc.)
            </CardDescription>

            {arquivoExistente && !arquivo && (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{arquivoExistente}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setArquivoExistente('')}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {arquivo && (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{arquivo.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setArquivo(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('arquivo-input')?.click()}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <input
                id="arquivo-input"
                type="file"
                className="hidden"
                onChange={handleArquivoChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">
                {isEditing ? 'Editar' : 'Nova'} Execução de Teste
              </h1>
              {aplicacaoNome && (
                <p className="text-sm text-muted-foreground">Aplicação: {aplicacaoNome}</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Etapa {currentStepIndex + 1} de {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-sm text-center max-w-[120px]">
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-[2px] mx-4 mb-8 transition-colors ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card with Step Content */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{steps[currentStepIndex].label}</CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={handleAnterior}
            disabled={currentStepIndex === 0}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            
            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={handleProximo}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
