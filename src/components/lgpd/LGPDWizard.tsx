import { useState, useEffect } from 'react';
import { LGPDRegistro, LGPDCampoFormData, TipoDadoLGPD, TecnicaAnonimizacao, MatrizAnonimizacao } from '@/types/lgpd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, X, Plus, Trash, Eye } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface LGPDWizardProps {
  registro?: LGPDRegistro;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

const TIPOS_DADOS: TipoDadoLGPD[] = [
  'Dados Identificadores Diretos',
  'Dados Identificadores Indiretos',
  'Dados Sensíveis',
  'Dados Financeiros',
  'Dados de Localização'
];

const TECNICAS_ANONIMIZACAO: TecnicaAnonimizacao[] = [
  'Anonimização por Supressão',
  'Anonimização por Generalização',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Permutação'
];

const DEPARTAMENTOS = [
  { key: 'vendas', label: 'Vendas' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'rh', label: 'RH' },
  { key: 'logistica', label: 'Logística' },
  { key: 'assistenciaTecnica', label: 'Assistência Técnica' },
  { key: 'analytics', label: 'Analytics' }
];

export function LGPDWizard({ registro, onSave, onCancel }: LGPDWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Dados Mestres
  const [identificacaoDados, setIdentificacaoDados] = useState('');
  const [tipoDados, setTipoDados] = useState<TipoDadoLGPD>('Dados Sensíveis');
  const [tecnicaAnonimizacao, setTecnicaAnonimizacao] = useState<TecnicaAnonimizacao>('Anonimização por Generalização');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataTermino, setDataTermino] = useState('');
  const [ativo, setAtivo] = useState(true);
  
  // Step 2: Campos
  const [campos, setCampos] = useState<LGPDCampoFormData[]>([]);
  const [showCampoForm, setShowCampoForm] = useState(false);
  const [editingCampoIndex, setEditingCampoIndex] = useState<number | null>(null);
  const [showMatrizDialog, setShowMatrizDialog] = useState(false);
  const [viewingCampoIndex, setViewingCampoIndex] = useState<number | null>(null);
  const [csvText, setCsvText] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  
  // Formulário de Campo
  const [nomeCampo, setNomeCampo] = useState('');
  const [descricaoCampo, setDescricaoCampo] = useState('');
  const [matrizVendas, setMatrizVendas] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizMarketing, setMatrizMarketing] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizFinanceiro, setMatrizFinanceiro] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizRH, setMatrizRH] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizLogistica, setMatrizLogistica] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizAssistenciaTecnica, setMatrizAssistenciaTecnica] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);
  const [matrizAnalytics, setMatrizAnalytics] = useState<TecnicaAnonimizacao>(tecnicaAnonimizacao);

  const isEditing = !!registro;
  const totalSteps = 2;

  const steps = [
    { number: 1, title: 'Dados Mestres', description: 'Informações básicas do registro LGPD' },
    { number: 2, title: 'Campos e Matriz', description: 'Campos de dados e matriz de anonimização' },
  ];

  useEffect(() => {
    if (registro) {
      setIdentificacaoDados(registro.identificacaoDados);
      setTipoDados(registro.tipoDados);
      setTecnicaAnonimizacao(registro.tecnicaAnonimizacao);
      // Converter data ISO para formato yyyy-MM-dd
      setDataInicio(registro.dataInicio ? registro.dataInicio.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDataTermino(registro.dataTermino ? registro.dataTermino.split('T')[0] : '');
      setAtivo(registro.ativo ?? true);
      
      if (registro.campos) {
        setCampos(registro.campos.map(c => ({
          nomeCampo: c.nomeCampo,
          descricao: c.descricao,
          matrizAnonimizacao: c.matrizAnonimizacao
        })));
      }
    } else {
      resetForm();
    }
  }, [registro]);

  // Resetar matriz ao mudar técnica padrão
  useEffect(() => {
    setMatrizVendas(tecnicaAnonimizacao);
    setMatrizMarketing(tecnicaAnonimizacao);
    setMatrizFinanceiro(tecnicaAnonimizacao);
    setMatrizRH(tecnicaAnonimizacao);
    setMatrizLogistica(tecnicaAnonimizacao);
    setMatrizAssistenciaTecnica(tecnicaAnonimizacao);
    setMatrizAnalytics(tecnicaAnonimizacao);
  }, [tecnicaAnonimizacao]);

  const resetForm = () => {
    setCurrentStep(1);
    setIdentificacaoDados('');
    setTipoDados('Dados Sensíveis');
    setTecnicaAnonimizacao('Anonimização por Generalização');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataTermino('');
    setAtivo(true);
    setCampos([]);
    setCsvText('');
    setShowCsvImport(false);
    resetCampoForm();
  };

  const resetCampoForm = () => {
    setNomeCampo('');
    setDescricaoCampo('');
    setMatrizVendas(tecnicaAnonimizacao);
    setMatrizMarketing(tecnicaAnonimizacao);
    setMatrizFinanceiro(tecnicaAnonimizacao);
    setMatrizRH(tecnicaAnonimizacao);
    setMatrizLogistica(tecnicaAnonimizacao);
    setMatrizAssistenciaTecnica(tecnicaAnonimizacao);
    setMatrizAnalytics(tecnicaAnonimizacao);
    setEditingCampoIndex(null);
  };

  const handleAddCampo = () => {
    setShowCampoForm(true);
    resetCampoForm();
  };

  const handleEditCampo = (index: number) => {
    const campo = campos[index];
    setNomeCampo(campo.nomeCampo);
    setDescricaoCampo(campo.descricao);
    setMatrizVendas(campo.matrizAnonimizacao.vendas);
    setMatrizMarketing(campo.matrizAnonimizacao.marketing);
    setMatrizFinanceiro(campo.matrizAnonimizacao.financeiro);
    setMatrizRH(campo.matrizAnonimizacao.rh);
    setMatrizLogistica(campo.matrizAnonimizacao.logistica);
    setMatrizAssistenciaTecnica(campo.matrizAnonimizacao.assistenciaTecnica);
    setMatrizAnalytics(campo.matrizAnonimizacao.analytics);
    setEditingCampoIndex(index);
    setShowCampoForm(true);
  };

  const handleSaveCampo = () => {
    if (!nomeCampo || !descricaoCampo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoCampo: LGPDCampoFormData = {
      nomeCampo: nomeCampo.toUpperCase(),
      descricao: descricaoCampo,
      matrizAnonimizacao: {
        vendas: matrizVendas,
        marketing: matrizMarketing,
        financeiro: matrizFinanceiro,
        rh: matrizRH,
        logistica: matrizLogistica,
        assistenciaTecnica: matrizAssistenciaTecnica,
        analytics: matrizAnalytics
      }
    };

    if (editingCampoIndex !== null) {
      const novosCampos = [...campos];
      novosCampos[editingCampoIndex] = novoCampo;
      setCampos(novosCampos);
    } else {
      setCampos([...campos, novoCampo]);
    }

    setShowCampoForm(false);
    resetCampoForm();
  };

  const handleDeleteCampo = (index: number) => {
    setCampos(campos.filter((_, i) => i !== index));
  };

  const handleViewMatriz = (index: number) => {
    setViewingCampoIndex(index);
    setShowMatrizDialog(true);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImportCsv = () => {
    try {
      const lines = csvText.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        toast.error('Nenhum dado para importar');
        return;
      }

      // Mapear técnicas simplificadas para valores completos
      const mapTecnica = (valor: string): TecnicaAnonimizacao => {
        const v = valor.trim().toLowerCase();
        if (v.includes('supress')) return 'Anonimização por Supressão';
        if (v.includes('generaliz')) return 'Anonimização por Generalização';
        if (v.includes('pseudo')) return 'Pseudonimização (Embaralhamento Reversível)';
        if (v.includes('permut')) return 'Anonimização por Permutação';
        return 'Anonimização por Generalização'; // default
      };

      // Primeira linha pode ser cabeçalho ou dados
      const hasHeader = lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('campo');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const novosCampos: LGPDCampoFormData[] = dataLines.map(line => {
        const cols = parseCsvLine(line);
        
        const nomeCampo = (cols[0] || '').toUpperCase();
        const descricao = cols[1] || '';
        
        // Mapear técnicas de anonimização para cada departamento
        const vendas = mapTecnica(cols[2] || 'Generalização');
        const marketing = mapTecnica(cols[3] || 'Generalização');
        const financeiro = mapTecnica(cols[4] || 'Generalização');
        const rh = mapTecnica(cols[5] || 'Generalização');
        const logistica = mapTecnica(cols[6] || 'Generalização');
        const assistenciaTecnica = mapTecnica(cols[7] || 'Generalização');
        const analytics = mapTecnica(cols[8] || 'Generalização');

        return {
          nomeCampo,
          descricao,
          matrizAnonimizacao: {
            vendas,
            marketing,
            financeiro,
            rh,
            logistica,
            assistenciaTecnica,
            analytics
          }
        };
      });

      setCampos([...campos, ...novosCampos]);
      setCsvText('');
      setShowCsvImport(false);
      toast.success(`${novosCampos.length} campo(s) importado(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      toast.error('Erro ao processar CSV. Verifique o formato.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!identificacaoDados || !identificacaoDados.trim()) {
          toast.error('Informe a identificação dos dados');
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

  const handleSubmit = async () => {
    if (!validateStep(1)) return;

    setLoading(true);
    try {
      const data = {
        identificacaoDados,
        tipoDados,
        tecnicaAnonimizacao,
        dataInicio,
        dataTermino: dataTermino || undefined,
        ativo,
        campos
      };
      await onSave(data);
      toast.success(isEditing ? 'Registro LGPD atualizado com sucesso' : 'Registro LGPD cadastrado com sucesso');
      resetForm();
      onCancel();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar registro LGPD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? 'Editar Registro LGPD' : 'Novo Registro LGPD'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Passo {currentStep} de {totalSteps}: {steps[currentStep - 1].description}
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
              {step.number < totalSteps && (
                <div className="w-16 h-0.5 bg-muted mx-2 mt-[-20px]" />
              )}
            </div>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
            <div className="space-y-6 py-4">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="identificacaoDados" className="text-base font-medium">
                    Identificação de Dados *
                  </Label>
                  <Input
                    id="identificacaoDados"
                    value={identificacaoDados}
                    onChange={(e) => setIdentificacaoDados(e.target.value)}
                    placeholder="Ex: Dados de Clientes - CRM"
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome ou identificação clara do conjunto de dados pessoais
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoDados" className="text-base font-medium">
                      Tipo de Dados *
                    </Label>
                    <Select value={tipoDados} onValueChange={(v) => setTipoDados(v as TipoDadoLGPD)}>
                      <SelectTrigger id="tipoDados" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_DADOS.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tecnicaAnonimizacao" className="text-base font-medium">
                      Técnica de Anonimização *
                    </Label>
                    <Select value={tecnicaAnonimizacao} onValueChange={(v) => setTecnicaAnonimizacao(v as TecnicaAnonimizacao)}>
                      <SelectTrigger id="tecnicaAnonimizacao" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECNICAS_ANONIMIZACAO.map(tec => (
                          <SelectItem key={tec} value={tec}>{tec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataInicio" className="text-base font-medium">
                      Data de Início *
                    </Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataTermino" className="text-base font-medium">
                      Data de Término
                    </Label>
                    <Input
                      id="dataTermino"
                      type="date"
                      value={dataTermino}
                      onChange={(e) => setDataTermino(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ativo" className="text-base font-medium">
                      Status
                    </Label>
                    <Select value={ativo ? '1' : '0'} onValueChange={(v) => setAtivo(v === '1')}>
                      <SelectTrigger id="ativo" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ativo</SelectItem>
                        <SelectItem value="0">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            )}

            {currentStep === 2 && !showCampoForm && !showCsvImport && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-xl font-semibold">Campos e Matriz de Anonimização</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure as técnicas de anonimização específicas para cada departamento
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCsvImport(true)} size="lg" variant="outline">
                    <Plus size={18} className="mr-2" />
                    Importar CSV
                  </Button>
                  <Button onClick={handleAddCampo} size="lg">
                    <Plus size={18} className="mr-2" />
                    Adicionar Campo
                  </Button>
                </div>
              </div>              {campos.length === 0 ? (
                <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                  <div className="space-y-3">
                    <Plus size={48} className="mx-auto opacity-20" />
                    <p className="text-base">Nenhum campo cadastrado</p>
                    <p className="text-sm">Clique em "Adicionar Campo" para começar a configurar a matriz de anonimização</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Campo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Matriz</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campos.map((campo, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{campo.nomeCampo}</TableCell>
                          <TableCell className="max-w-xs truncate">{campo.descricao}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMatriz(index)}
                            >
                              <Eye size={14} className="mr-1" />
                              Ver Matriz
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => handleEditCampo(index)}>
                                Editar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Deseja excluir o campo "{campo.nomeCampo}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCampo(index)}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            )}

            {currentStep === 2 && showCsvImport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-medium">Importar Campos via CSV</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cole o texto CSV ou carregue um arquivo
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Carregar Arquivo CSV</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato esperado: Nome do Campo, Descrição, Vendas, Marketing, Financeiro, RH, Logística, Assistência Técnica, Analytics
                  </p>
                </div>

                <div>
                  <Label htmlFor="csvText">Ou Cole o Texto CSV</Label>
                  <Textarea
                    id="csvText"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Nome do Campo,Descrição,Vendas,Marketing,Financeiro,RH,Logística,Assistência Técnica,Analytics&#10;CPF,Cadastro de Pessoa Física,Supressão,Generalização,Supressão,Supressão,Generalização,Generalização,Pseudonimização"
                    className="font-mono text-sm"
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    • Nome do Campo será convertido para MAIÚSCULO automaticamente<br />
                    • Valores não informados receberão "Generalização" como padrão<br />
                    • Primeira linha pode ser cabeçalho ou dados
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowCsvImport(false); setCsvText(''); }}>
                  Cancelar
                </Button>
                <Button onClick={handleImportCsv} disabled={!csvText.trim()}>
                  Importar Campos
                </Button>
              </div>
            </div>
            )}

            {currentStep === 2 && showCampoForm && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {editingCampoIndex !== null ? 'Editar Campo' : 'Adicionar Campo'}
              </h3>

              <div>
                <Label htmlFor="nomeCampo">Nome do Campo *</Label>
                <Input
                  id="nomeCampo"
                  value={nomeCampo}
                  onChange={(e) => setNomeCampo(e.target.value)}
                  placeholder="Ex: cpf, email, telefone"
                />
              </div>

              <div>
                <Label htmlFor="descricaoCampo">Descrição *</Label>
                <Textarea
                  id="descricaoCampo"
                  value={descricaoCampo}
                  onChange={(e) => setDescricaoCampo(e.target.value)}
                  placeholder="Descreva o campo e seu uso"
                  rows={3}
                />
              </div>

              <div className="border rounded-md p-4 space-y-3">
                <h4 className="font-medium">Matriz de Anonimização por Departamento</h4>
                <p className="text-xs text-muted-foreground">
                  Técnica padrão: <strong>{tecnicaAnonimizacao}</strong> (configurada na etapa anterior)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  {DEPARTAMENTOS.map(dept => {
                    const matrizMap: Record<string, TecnicaAnonimizacao> = {
                      vendas: matrizVendas,
                      marketing: matrizMarketing,
                      financeiro: matrizFinanceiro,
                      rh: matrizRH,
                      logistica: matrizLogistica,
                      assistenciaTecnica: matrizAssistenciaTecnica,
                      analytics: matrizAnalytics
                    };
                    
                    const setterMap: Record<string, (v: TecnicaAnonimizacao) => void> = {
                      vendas: setMatrizVendas,
                      marketing: setMatrizMarketing,
                      financeiro: setMatrizFinanceiro,
                      rh: setMatrizRH,
                      logistica: setMatrizLogistica,
                      assistenciaTecnica: setMatrizAssistenciaTecnica,
                      analytics: setMatrizAnalytics
                    };

                    return (
                      <div key={dept.key} className="space-y-2">
                        <Label htmlFor={dept.key} className="text-sm">{dept.label}</Label>
                        <Select
                          value={matrizMap[dept.key]}
                          onValueChange={(v) => setterMap[dept.key](v as TecnicaAnonimizacao)}
                        >
                          <SelectTrigger id={dept.key}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Anonimização por Supressão">Supressão</SelectItem>
                            <SelectItem value="Anonimização por Generalização">Generalização</SelectItem>
                            <SelectItem value="Pseudonimização (Embaralhamento Reversível)">Pseudonimização</SelectItem>
                            <SelectItem value="Anonimização por Permutação">Permutação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCampoForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCampo}>
                  {editingCampoIndex !== null ? 'Salvar Alterações' : 'Adicionar Campo'}
                </Button>
              </div>
            </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <Button onClick={handleNext}>
                    Próximo
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading || campos.length === 0}>
                    {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Registro')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para visualizar matriz */}
      <AlertDialog open={showMatrizDialog} onOpenChange={setShowMatrizDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Matriz de Anonimização</AlertDialogTitle>
          </AlertDialogHeader>
          {viewingCampoIndex !== null && campos[viewingCampoIndex] && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Campo: {campos[viewingCampoIndex].nomeCampo}</p>
                <p className="text-sm text-muted-foreground">{campos[viewingCampoIndex].descricao}</p>
              </div>
              <div className="space-y-2">
                {DEPARTAMENTOS.map(dept => {
                  const key = dept.key as keyof MatrizAnonimizacao;
                  return (
                    <div key={dept.key} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{dept.label}</span>
                      <Badge variant="outline">
                        {campos[viewingCampoIndex].matrizAnonimizacao[key]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowMatrizDialog(false)}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
