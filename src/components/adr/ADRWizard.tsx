import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ADR, StatusADR, StatusAplicacaoADR, Aplicacao } from '@/lib/types';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Plus,
  Trash,
  X,
  PencilSimple
} from '@phosphor-icons/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ADRWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingADR?: ADR;
}

interface AplicacaoAssociacao {
  aplicacaoId: string;
  dataInicio: string;
  dataTermino: string;
  status: StatusAplicacaoADR;
  observacoes: string;
}

export function ADRWizard({ open, onClose, onSuccess, editingADR }: ADRWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({
    descricao: '',
    status: 'Proposto' as StatusADR,
    contexto: '',
    decisao: '',
    justificativa: '',
    consequenciasPositivas: '',
    consequenciasNegativas: '',
    riscos: '',
    alternativasConsideradas: '',
    complianceConstitution: '',
    adrSubstitutaId: ''
  });

  const [aplicacoesAssociadas, setAplicacoesAssociadas] = useState<AplicacaoAssociacao[]>([]);
  const [editingAppIndex, setEditingAppIndex] = useState<number | null>(null);
  const [currentApp, setCurrentApp] = useState<AplicacaoAssociacao>({
    aplicacaoId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataTermino: '',
    status: 'Ativo',
    observacoes: ''
  });
  const [saving, setSaving] = useState(false);

  const totalSteps = 3; // 1: Dados Básicos, 2: Detalhes, 3: Aplicações

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [adrsRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/api/adrs`),
        fetch(`${API_URL}/api/aplicacoes`)
      ]);

      if (adrsRes.ok) {
        const adrsData = await adrsRes.json();
        setAdrs(adrsData);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setAplicacoes(appsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  // Atualizar formulário quando editingADR mudar
  useEffect(() => {
    if (editingADR) {
      setFormData({
        descricao: editingADR.descricao || '',
        status: editingADR.status || 'Proposto',
        contexto: editingADR.contexto || '',
        decisao: editingADR.decisao || '',
        justificativa: editingADR.justificativa || '',
        consequenciasPositivas: editingADR.consequenciasPositivas || '',
        consequenciasNegativas: editingADR.consequenciasNegativas || '',
        riscos: editingADR.riscos || '',
        alternativasConsideradas: editingADR.alternativasConsideradas || '',
        complianceConstitution: editingADR.complianceConstitution || '',
        adrSubstitutaId: editingADR.adrSubstitutaId || ''
      });

      // Carregar aplicações associadas
      if (editingADR.aplicacoes) {
        setAplicacoesAssociadas(editingADR.aplicacoes.map(app => ({
          aplicacaoId: app.aplicacaoId,
          dataInicio: app.dataInicio || '',
          dataTermino: app.dataTermino || '',
          status: app.status,
          observacoes: app.observacoes || ''
        })));
      }
    } else if (!open) {
      // Resetar formulário quando fechar
      setCurrentStep(0);
      setFormData({
        descricao: '',
        status: 'Proposto',
        contexto: '',
        decisao: '',
        justificativa: '',
        consequenciasPositivas: '',
        consequenciasNegativas: '',
        riscos: '',
        alternativasConsideradas: '',
        complianceConstitution: '',
        adrSubstitutaId: ''
      });
      setAplicacoesAssociadas([]);
    }
  }, [editingADR, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOrUpdateAplicacao = () => {
    if (!currentApp.aplicacaoId) {
      toast.error('Selecione uma aplicação');
      return;
    }

    // Se não houver data de início, usar a data atual
    const dataInicio = currentApp.dataInicio || new Date().toISOString().split('T')[0];

    const aplicacaoComData = { ...currentApp, dataInicio };

    if (editingAppIndex !== null) {
      // Atualizar aplicação existente
      setAplicacoesAssociadas(prev => prev.map((app, i) => 
        i === editingAppIndex ? aplicacaoComData : app
      ));
      toast.success('Aplicação atualizada');
    } else {
      // Adicionar nova aplicação
      setAplicacoesAssociadas(prev => [...prev, aplicacaoComData]);
      toast.success('Aplicação adicionada');
    }

    // Limpar formulário
    setCurrentApp({
      aplicacaoId: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataTermino: '',
      status: 'Ativo',
      observacoes: ''
    });
    setEditingAppIndex(null);
  };

  const handleEditAplicacao = (index: number) => {
    setCurrentApp(aplicacoesAssociadas[index]);
    setEditingAppIndex(index);
  };

  const handleCancelEdit = () => {
    setCurrentApp({
      aplicacaoId: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataTermino: '',
      status: 'Ativo',
      observacoes: ''
    });
    setEditingAppIndex(null);
  };

  const removeAplicacao = (index: number) => {
    setAplicacoesAssociadas(prev => prev.filter((_, i) => i !== index));
    if (editingAppIndex === index) {
      handleCancelEdit();
    }
    toast.success('Aplicação removida');
  };

  const handleNext = () => {
    if (currentStep === 0 && !formData.descricao) {
      toast.error('O campo Descrição é obrigatório');
      return;
    }

    if (currentStep === 0 && formData.status === 'Substituído' && !formData.adrSubstitutaId) {
      toast.error('ADR Substituta é obrigatória quando status é Substituído');
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.descricao) {
      toast.error('O campo Descrição é obrigatório');
      return;
    }

    if (formData.status === 'Substituído' && !formData.adrSubstitutaId) {
      toast.error('ADR Substituta é obrigatória quando status é Substituído');
      return;
    }

    try {
      setSaving(true);
      
      const adrUrl = editingADR 
        ? `${API_URL}/api/adrs/${editingADR.id}`
        : `${API_URL}/api/adrs`;
      
      const adrMethod = editingADR ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        aplicacoes: aplicacoesAssociadas.filter(app => app.aplicacaoId)
      };

      console.log('🔍 Salvando ADR:', {
        method: adrMethod,
        aplicacoesCount: payload.aplicacoes.length,
        aplicacoes: payload.aplicacoes,
      });

      const adrResponse = await fetch(adrUrl, {
        method: adrMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!adrResponse.ok) {
        const error = await adrResponse.json();
        throw new Error(error.error || 'Erro ao salvar ADR');
      }

      toast.success(editingADR ? 'ADR atualizado com sucesso' : 'ADR criado com sucesso');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar ADR:', error);
      toast.error(error.message || 'Erro ao salvar ADR');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    // Etapa 0: Dados Básicos
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="descricao">Descrição * (máx. 500 caracteres)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descrição da decisão arquitetônica..."
              maxLength={500}
              rows={8}
              className="resize-none overflow-y-auto"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proposto">Proposto</SelectItem>
                  <SelectItem value="Aceito">Aceito</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="Substituído">Substituído</SelectItem>
                  <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                  <SelectItem value="Adiado/Retirado">Adiado/Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'Substituído' && (
              <div className="space-y-3">
                <Label htmlFor="adrSubstituta">ADR Substituta *</Label>
                <Select value={formData.adrSubstitutaId} onValueChange={(value) => handleChange('adrSubstitutaId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ADR..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adrs.filter(a => editingADR ? a.id !== editingADR.id : true).map(adr => (
                      <SelectItem key={adr.id} value={adr.id}>
                        ADR-{adr.sequencia}: {adr.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="contexto">Contexto</Label>
            <Textarea
              id="contexto"
              value={formData.contexto}
              onChange={(e) => handleChange('contexto', e.target.value)}
              placeholder="Descreva o contexto da decisão..."
              rows={12}
              className="resize-none overflow-y-scroll max-h-[300px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="decisao">Decisão</Label>
            <Textarea
              id="decisao"
              value={formData.decisao}
              onChange={(e) => handleChange('decisao', e.target.value)}
              placeholder="Descreva a decisão tomada..."
              rows={12}
              className="resize-none overflow-y-scroll max-h-[300px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea
              id="justificativa"
              value={formData.justificativa}
              onChange={(e) => handleChange('justificativa', e.target.value)}
              placeholder="Justifique a decisão..."
              rows={12}
              className="resize-none overflow-y-scroll max-h-[300px]"
            />
          </div>
        </div>
      );
    }

    // Etapa 1: Detalhes
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="consequenciasPositivas">Consequências Positivas</Label>
            <Textarea
              id="consequenciasPositivas"
              value={formData.consequenciasPositivas}
              onChange={(e) => handleChange('consequenciasPositivas', e.target.value)}
              placeholder="Liste as consequências positivas..."
              rows={10}
              className="resize-none overflow-y-scroll max-h-[250px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="consequenciasNegativas">Consequências Negativas</Label>
            <Textarea
              id="consequenciasNegativas"
              value={formData.consequenciasNegativas}
              onChange={(e) => handleChange('consequenciasNegativas', e.target.value)}
              placeholder="Liste as consequências negativas..."
              rows={10}
              className="resize-none overflow-y-scroll max-h-[250px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="riscos">Riscos</Label>
            <Textarea
              id="riscos"
              value={formData.riscos}
              onChange={(e) => handleChange('riscos', e.target.value)}
              placeholder="Descreva os riscos associados..."
              rows={10}
              className="resize-none overflow-y-scroll max-h-[250px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="alternativasConsideradas">Alternativas Consideradas</Label>
            <Textarea
              id="alternativasConsideradas"
              value={formData.alternativasConsideradas}
              onChange={(e) => handleChange('alternativasConsideradas', e.target.value)}
              placeholder="Liste as alternativas que foram consideradas..."
              rows={10}
              className="resize-none overflow-y-scroll max-h-[250px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="complianceConstitution">Compliance com Constitution</Label>
            <Textarea
              id="complianceConstitution"
              value={formData.complianceConstitution}
              onChange={(e) => handleChange('complianceConstitution', e.target.value)}
              placeholder="Descreva a conformidade com a constitution..."
              rows={10}
              className="resize-none overflow-y-scroll max-h-[250px]"
            />
          </div>
        </div>
      );
    }

    // Etapa 2: Aplicações Associadas
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="font-semibold mb-4">
            {editingAppIndex !== null ? 'Editar Aplicação' : 'Adicionar Aplicação'}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Aplicação *</Label>
                <Select 
                  value={currentApp.aplicacaoId} 
                  onValueChange={(value) => setCurrentApp(prev => ({ ...prev, aplicacaoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aplicação..." />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes.map(aplicacao => (
                      <SelectItem key={aplicacao.id} value={aplicacao.id}>
                        {aplicacao.sigla} - {aplicacao.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início (Padrão: Hoje)</Label>
                <Input
                  type="date"
                  value={currentApp.dataInicio}
                  onChange={(e) => setCurrentApp(prev => ({ ...prev, dataInicio: e.target.value }))}
                  placeholder={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Término</Label>
                <Input
                  type="date"
                  value={currentApp.dataTermino}
                  onChange={(e) => setCurrentApp(prev => ({ ...prev, dataTermino: e.target.value }))}
                  min={currentApp.dataInicio}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingAppIndex !== null && (
                <Button type="button" onClick={handleCancelEdit} variant="outline" className="flex-1">
                  <X size={16} className="mr-2" />
                  Cancelar
                </Button>
              )}
              <Button type="button" onClick={handleAddOrUpdateAplicacao} className="flex-1">
                {editingAppIndex !== null ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Atualizar Aplicação
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Adicionar Aplicação
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {aplicacoesAssociadas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Aplicações Associadas ({aplicacoesAssociadas.length})</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sigla</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Término</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aplicacoesAssociadas.map((app, index) => {
                    const aplicacao = aplicacoes.find(a => a.id === app.aplicacaoId);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {aplicacao?.sigla || '-'}
                        </TableCell>
                        <TableCell>{app.dataInicio || '-'}</TableCell>
                        <TableCell>{app.dataTermino || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAplicacao(index)}
                              title="Editar"
                            >
                              <PencilSimple size={16} className="text-blue-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAplicacao(index)}
                              title="Excluir"
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="min-w-[1120px] w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingADR ? `Editar ADR-${editingADR.sequencia}` : 'Novo ADR'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 0 && 'Dados básicos da decisão arquitetônica'}
            {currentStep === 1 && 'Análise de impacto e compliance'}
            {currentStep === 2 && 'Aplicações que utilizam esta decisão'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`h-2 rounded-full transition-colors flex-1 ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {index < totalSteps - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <ScrollArea className="flex-1 overflow-y-auto pr-4 min-h-0">
          <div className="py-4">
            {renderStepContent()}
          </div>
        </ScrollArea>

        <Separator className="flex-shrink-0" />

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Etapa {currentStep + 1} de {totalSteps}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>

            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={saving}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
            )}

            {currentStep < totalSteps - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={saving}
              >
                Próximo
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {editingADR ? 'Atualizar' : 'Criar ADR'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
