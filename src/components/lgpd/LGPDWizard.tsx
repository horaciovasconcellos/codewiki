import { useState, useEffect } from 'react';
import { LGPDRegistro, LGPDCampoFormData, TipoDadoLGPD, TecnicaAnonimizacao, MatrizAnonimizacao } from '@/types/lgpd';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, Eye } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface LGPDWizardProps {
  open: boolean;
  onClose: () => void;
  registro?: LGPDRegistro;
  onSave: (data: any) => Promise<void>;
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

export function LGPDWizard({ open, onClose, registro, onSave }: LGPDWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Dados Mestres
  const [identificacaoDados, setIdentificacaoDados] = useState('');
  const [tipoDados, setTipoDados] = useState<TipoDadoLGPD>('Dados Identificadores Diretos');
  const [tecnicaAnonimizacao, setTecnicaAnonimizacao] = useState<TecnicaAnonimizacao>('Anonimização por Supressão');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataTermino, setDataTermino] = useState('');
  
  // Step 2: Campos
  const [campos, setCampos] = useState<LGPDCampoFormData[]>([]);
  const [showCampoForm, setShowCampoForm] = useState(false);
  const [editingCampoIndex, setEditingCampoIndex] = useState<number | null>(null);
  const [showMatrizDialog, setShowMatrizDialog] = useState(false);
  const [viewingCampoIndex, setViewingCampoIndex] = useState<number | null>(null);
  
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

  useEffect(() => {
    if (registro) {
      setIdentificacaoDados(registro.identificacaoDados);
      setTipoDados(registro.tipoDados);
      setTecnicaAnonimizacao(registro.tecnicaAnonimizacao);
      setDataInicio(registro.dataInicio);
      setDataTermino(registro.dataTermino || '');
      
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
  }, [registro, open]);

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
    setStep(1);
    setIdentificacaoDados('');
    setTipoDados('Dados Identificadores Diretos');
    setTecnicaAnonimizacao('Anonimização por Supressão');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataTermino('');
    setCampos([]);
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
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const novoCampo: LGPDCampoFormData = {
      nomeCampo,
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

  const handleNext = () => {
    if (step === 1) {
      if (!identificacaoDados) {
        alert('Preencha a identificação dos dados');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!identificacaoDados) {
      alert('Preencha a identificação dos dados');
      return;
    }

    setLoading(true);
    try {
      const data = {
        identificacaoDados,
        tipoDados,
        tecnicaAnonimizacao,
        dataInicio,
        dataTermino: dataTermino || undefined,
        campos
      };
      await onSave(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar registro LGPD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {registro ? 'Editar Registro LGPD' : 'Novo Registro LGPD'} - Etapa {step} de 2
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="identificacaoDados">Identificação de Dados *</Label>
                <Input
                  id="identificacaoDados"
                  value={identificacaoDados}
                  onChange={(e) => setIdentificacaoDados(e.target.value)}
                  placeholder="Ex: Dados de Clientes - CRM"
                />
              </div>

              <div>
                <Label htmlFor="tipoDados">Tipo de Dados *</Label>
                <Select value={tipoDados} onValueChange={(v) => setTipoDados(v as TipoDadoLGPD)}>
                  <SelectTrigger id="tipoDados">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DADOS.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tecnicaAnonimizacao">Técnica de Anonimização (Padrão) *</Label>
                <Select value={tecnicaAnonimizacao} onValueChange={(v) => setTecnicaAnonimizacao(v as TecnicaAnonimizacao)}>
                  <SelectTrigger id="tecnicaAnonimizacao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TECNICAS_ANONIMIZACAO.map(tec => (
                      <SelectItem key={tec} value={tec}>{tec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta técnica será aplicada como padrão para todos os campos
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dataTermino">Data de Término</Label>
                  <Input
                    id="dataTermino"
                    type="date"
                    value={dataTermino}
                    onChange={(e) => setDataTermino(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleNext}>Próximo: Campos</Button>
              </div>
            </div>
          )}

          {step === 2 && !showCampoForm && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Campos e Matriz de Anonimização</h3>
                <Button onClick={handleAddCampo} size="sm">
                  <Plus size={16} className="mr-1" />
                  Adicionar Campo
                </Button>
              </div>

              {campos.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border rounded-md">
                  Nenhum campo cadastrado. Clique em "Adicionar Campo" para começar.
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

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={loading || campos.length === 0}>
                    {loading ? 'Salvando...' : (registro ? 'Salvar Alterações' : 'Criar Registro')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && showCampoForm && (
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

                {DEPARTAMENTOS.map(dept => (
                  <div key={dept.key}>
                    <Label htmlFor={dept.key}>{dept.label}</Label>
                    <Select
                      value={eval(`matriz${dept.key.charAt(0).toUpperCase() + dept.key.slice(1)}`)}
                      onValueChange={(v) => {
                        const setter = eval(`setMatriz${dept.key.charAt(0).toUpperCase() + dept.key.slice(1)}`);
                        setter(v as TecnicaAnonimizacao);
                      }}
                    >
                      <SelectTrigger id={dept.key}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TECNICAS_ANONIMIZACAO.map(tec => (
                          <SelectItem key={tec} value={tec}>{tec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
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
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar matriz */}
      <Dialog open={showMatrizDialog} onOpenChange={setShowMatrizDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matriz de Anonimização</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
