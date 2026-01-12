import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CapacidadeNegocio, NivelCapacidade, CategoriaCapacidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CapacidadeFormProps {
  capacidades: CapacidadeNegocio[];
  capacidadeToEdit?: CapacidadeNegocio;
  onSave: (capacidade: CapacidadeNegocio) => void | Promise<void>;
  onCancel: () => void;
}

const NIVEIS: NivelCapacidade[] = ['Nível 1', 'Nível 2', 'Nível 3'];
const CATEGORIAS: CategoriaCapacidade[] = ['Financeiro', 'RH', 'Logística', 'Atendimento', 'Produção', 'Comercial'];

export function CapacidadeForm({ capacidades, capacidadeToEdit, onSave, onCancel }: CapacidadeFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sigla, setSigla] = useState(capacidadeToEdit?.sigla || '');
  const [nome, setNome] = useState(capacidadeToEdit?.nome || '');
  const [descricao, setDescricao] = useState(capacidadeToEdit?.descricao || '');
  const [nivel, setNivel] = useState<NivelCapacidade>(capacidadeToEdit?.nivel || 'Nível 1');
  const [categoria, setCategoria] = useState<CategoriaCapacidade>(capacidadeToEdit?.categoria || 'Financeiro');
  const [alinhamentoObjetivos, setAlinhamentoObjetivos] = useState(capacidadeToEdit?.coberturaEstrategica?.alinhamentoObjetivos || '');
  const [beneficiosEsperados, setBeneficiosEsperados] = useState(capacidadeToEdit?.coberturaEstrategica?.beneficiosEsperados || '');
  const [estadoFuturoDesejado, setEstadoFuturoDesejado] = useState(capacidadeToEdit?.coberturaEstrategica?.estadoFuturoDesejado || '');
  const [gapEstadoAtualFuturo, setGapEstadoAtualFuturo] = useState(capacidadeToEdit?.coberturaEstrategica?.gapEstadoAtualFuturo || '');

  const handleSubmit = async () => {
    if (!sigla.trim() || !nome.trim()) {
      toast.error('Preencha a sigla e o nome da capacidade');
      return;
    }

    const siglaExistente = capacidades.find(
      c => c.sigla?.toUpperCase() === sigla.toUpperCase() && c.id !== capacidadeToEdit?.id
    );

    if (siglaExistente) {
      toast.error('Já existe uma capacidade com esta sigla');
      return;
    }

    try {
      setSaving(true);
      const capacidade: CapacidadeNegocio = {
        id: capacidadeToEdit?.id || uuidv4(),
        sigla: sigla.trim().toUpperCase(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        nivel,
        categoria,
        coberturaEstrategica: {
          alinhamentoObjetivos: alinhamentoObjetivos.trim(),
          beneficiosEsperados: beneficiosEsperados.trim(),
          estadoFuturoDesejado: estadoFuturoDesejado.trim(),
          gapEstadoAtualFuturo: gapEstadoAtualFuturo.trim(),
        },
      };

      await onSave(capacidade);
      toast.success(capacidadeToEdit ? 'Capacidade atualizada com sucesso' : 'Capacidade criada com sucesso');
      onCancel();
    } catch (error) {
      console.error('Erro ao salvar capacidade:', error);
      toast.error('Erro ao salvar capacidade');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Informações Básicas', description: 'Dados principais da capacidade' },
    { number: 2, title: 'Cobertura Estratégica', description: 'Alinhamento estratégico' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla *</Label>
                <Input
                  id="sigla"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ex: FIN-01"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Até 20 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome da capacidade"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição detalhada da capacidade"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nível</Label>
                <Select value={nivel} onValueChange={(value) => setNivel(value as NivelCapacidade)}>
                  <SelectTrigger id="nivel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVEIS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria da Capacidade</Label>
                <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaCapacidade)}>
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alinhamento">Alinhamento com Objetivos Estratégicos</Label>
              <Textarea
                id="alinhamento"
                value={alinhamentoObjetivos}
                onChange={(e) => setAlinhamentoObjetivos(e.target.value)}
                placeholder="Descreva como esta capacidade se alinha aos objetivos estratégicos da organização"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficios">Benefícios Esperados</Label>
              <Textarea
                id="beneficios"
                value={beneficiosEsperados}
                onChange={(e) => setBeneficiosEsperados(e.target.value)}
                placeholder="Liste os benefícios esperados com o desenvolvimento desta capacidade"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estadoFuturo">Estado Futuro Desejado (Target State)</Label>
              <Textarea
                id="estadoFuturo"
                value={estadoFuturoDesejado}
                onChange={(e) => setEstadoFuturoDesejado(e.target.value)}
                placeholder="Descreva o estado futuro desejado para esta capacidade"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gap">Gap entre Estado Atual e Futuro</Label>
              <Textarea
                id="gap"
                value={gapEstadoAtualFuturo}
                onChange={(e) => setGapEstadoAtualFuturo(e.target.value)}
                placeholder="Identifique as lacunas entre o estado atual e o estado futuro desejado"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {capacidadeToEdit ? 'Editar Capacidade de Negócio' : 'Nova Capacidade de Negócio'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Passo {currentStep} de {steps.length}: {steps[currentStep - 1].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.number
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number}
                </div>
                <span className="text-xs mt-2 text-center max-w-[100px]">
                  {step.title}
                </span>
              </div>
              {step.number < steps.length && (
                <div className="w-16 h-0.5 bg-muted mx-2 mt-[-20px]" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px]">
              {renderStep()}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                <FloppyDisk className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : (capacidadeToEdit ? 'Atualizar Capacidade' : 'Criar Capacidade')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
