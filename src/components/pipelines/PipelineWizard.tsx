import { useState, useEffect } from 'react';
import { Pipeline, StatusPipeline, Stage, PipelineStage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, FloppyDisk, Plus, Trash } from '@phosphor-icons/react';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PipelineWizardProps {
  pipeline?: Pipeline;
  onSave: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: StatusPipeline[] = ['Ativa', 'Em avaliação', 'Obsoleta', 'Descontinuada'];

export function PipelineWizard({ pipeline, onSave, onCancel }: PipelineWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [availableStages, setAvailableStages] = useState<Stage[]>([]);
  const [showAddStageDialog, setShowAddStageDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    status: 'Em avaliação' as StatusPipeline,
    dataInicio: new Date().toISOString().split('T')[0],
    dataTermino: '',
    triggerBranches: '',
    triggerPaths: '',
    prBranches: '',
    variables: '',
    resourcesRepositories: '',
    resourcesPipelines: '',
    resourcesContainers: '',
    schedules: '',
  });

  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [editingStage, setEditingStage] = useState<Partial<PipelineStage>>({
    stageId: '',
    status: 'Ativa' as StatusPipeline,
    dataInicio: new Date().toISOString().split('T')[0],
    dataTermino: '',
  });

  useEffect(() => {
    loadStages();
    if (pipeline) {
      // Normalizar datas para formato YYYY-MM-DD
      const normalizeDate = (date?: string) => {
        if (!date) return '';
        return date.split('T')[0];
      };

      setFormData({
        nome: pipeline.nome,
        status: pipeline.status,
        dataInicio: normalizeDate(pipeline.dataInicio) || new Date().toISOString().split('T')[0],
        dataTermino: normalizeDate(pipeline.dataTermino),
        triggerBranches: pipeline.triggerBranches || '',
        triggerPaths: pipeline.triggerPaths || '',
        prBranches: pipeline.prBranches || '',
        variables: pipeline.variables || '',
        resourcesRepositories: pipeline.resourcesRepositories || '',
        resourcesPipelines: pipeline.resourcesPipelines || '',
        resourcesContainers: pipeline.resourcesContainers || '',
        schedules: pipeline.schedules || '',
      });
      if (pipeline.stages) {
        setPipelineStages(pipeline.stages.map(s => ({
          ...s,
          dataInicio: normalizeDate(s.dataInicio),
          dataTermino: normalizeDate(s.dataTermino),
        })));
      }
    }
  }, [pipeline]);

  const loadStages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stages`);
      if (response.ok) {
        const data = await response.json();
        setAvailableStages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar stages:', error);
    }
  };

  const handleAddStage = () => {
    if (!editingStage.stageId) {
      toast.error('Selecione um stage');
      return;
    }
    if (!editingStage.dataInicio) {
      toast.error('Data de início é obrigatória');
      return;
    }

    const stage = availableStages.find(s => s.id === editingStage.stageId);
    if (!stage) return;

    const newStage: PipelineStage = {
      id: editingStage.id || uuidv4(),
      pipelineId: pipeline?.id || '',
      stageId: editingStage.stageId,
      status: editingStage.status || 'Ativa',
      dataInicio: editingStage.dataInicio!,
      dataTermino: editingStage.dataTermino,
      ordem: pipelineStages.length,
      stage,
    };

    if (editingStage.id) {
      setPipelineStages(pipelineStages.map(s => s.id === editingStage.id ? newStage : s));
      toast.success('Stage atualizado');
    } else {
      setPipelineStages([...pipelineStages, newStage]);
      toast.success('Stage adicionado');
    }

    console.log('🔍 Stages atuais:', [...pipelineStages, newStage].length);

    setEditingStage({
      stageId: '',
      status: 'Ativa' as StatusPipeline,
      dataInicio: new Date().toISOString().split('T')[0],
      dataTermino: '',
    });
    setShowAddStageDialog(false);
  };

  const handleRemoveStage = (id: string) => {
    setPipelineStages(pipelineStages.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const url = pipeline
        ? `${API_URL}/api/pipelines/${pipeline.id}`
        : `${API_URL}/api/pipelines`;
      
      const method = pipeline ? 'PUT' : 'POST';

      // Garantir que as datas estão no formato YYYY-MM-DD (sem timestamp)
      const normalizeDate = (date?: string) => {
        if (!date) return null;
        return date.split('T')[0];
      };

      const payload = {
        ...formData,
        dataInicio: normalizeDate(formData.dataInicio),
        dataTermino: normalizeDate(formData.dataTermino),
        stages: pipelineStages.map(s => ({
          id: s.id,
          stageId: s.stageId,
          status: s.status,
          dataInicio: normalizeDate(s.dataInicio),
          dataTermino: normalizeDate(s.dataTermino),
          ordem: s.ordem,
        })),
      };

      console.log('🔍 Salvando pipeline:', {
        method,
        url,
        stagesCount: pipelineStages.length,
        stages: payload.stages,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(pipeline ? 'Pipeline atualizada com sucesso' : 'Pipeline criada com sucesso');
        onSave();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar pipeline');
      }
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      toast.error('Erro ao salvar pipeline');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: 'Informações Básicas', description: 'Dados principais da pipeline' },
    { title: 'Trigger & PR', description: 'Configuração de gatilhos' },
    { title: 'Resources', description: 'Recursos utilizados' },
    { title: 'Schedules & Variables', description: 'Agendamentos e variáveis' },
    { title: 'Stages', description: 'Estágios da pipeline' },
  ];

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Backend API Pipeline"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as StatusPipeline })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataTermino">Data de Término</Label>
                <Input
                  id="dataTermino"
                  type="date"
                  value={formData.dataTermino}
                  onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Grupo Trigger</h3>
              <div className="space-y-2">
                <Label htmlFor="triggerBranches">Branches</Label>
                <Textarea
                  id="triggerBranches"
                  value={formData.triggerBranches}
                  onChange={(e) => setFormData({ ...formData, triggerBranches: e.target.value })}
                  placeholder="Ex: main, develop, feature/*"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="triggerPaths">Paths</Label>
                <Textarea
                  id="triggerPaths"
                  value={formData.triggerPaths}
                  onChange={(e) => setFormData({ ...formData, triggerPaths: e.target.value })}
                  placeholder="Ex: src/**, tests/**"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Grupo PR</h3>
              <div className="space-y-2">
                <Label htmlFor="prBranches">Branches</Label>
                <Textarea
                  id="prBranches"
                  value={formData.prBranches}
                  onChange={(e) => setFormData({ ...formData, prBranches: e.target.value })}
                  placeholder="Ex: main, develop"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Grupo Resources</h3>
            <div className="space-y-2">
              <Label htmlFor="resourcesRepositories">Repositories</Label>
              <Textarea
                id="resourcesRepositories"
                value={formData.resourcesRepositories}
                onChange={(e) => setFormData({ ...formData, resourcesRepositories: e.target.value })}
                placeholder="Ex: self, repo1, repo2"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourcesPipelines">Pipelines</Label>
              <Textarea
                id="resourcesPipelines"
                value={formData.resourcesPipelines}
                onChange={(e) => setFormData({ ...formData, resourcesPipelines: e.target.value })}
                placeholder="Ex: pipeline1, pipeline2"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resourcesContainers">Containers</Label>
              <Textarea
                id="resourcesContainers"
                value={formData.resourcesContainers}
                onChange={(e) => setFormData({ ...formData, resourcesContainers: e.target.value })}
                placeholder="Ex: container1:latest, container2:v1.0"
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedules">Schedules</Label>
              <Textarea
                id="schedules"
                value={formData.schedules}
                onChange={(e) => setFormData({ ...formData, schedules: e.target.value })}
                placeholder="Ex: cron: '0 0 * * *'"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variables">Variables</Label>
              <Textarea
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder="Ex: VAR1=value1, VAR2=value2"
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Stages da Pipeline</h3>
              <Dialog open={showAddStageDialog} onOpenChange={setShowAddStageDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingStage({ 
                    stageId: '',
                    status: 'Ativa' as StatusPipeline,
                    dataInicio: new Date().toISOString().split('T')[0],
                    dataTermino: '',
                  })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Stage
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Stage</DialogTitle>
                    <DialogDescription>
                      Selecione um stage e configure suas datas e status
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Select
                        value={editingStage.stageId || ''}
                        onValueChange={(value) => setEditingStage({ ...editingStage, stageId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.nome} ({stage.tipo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editingStage.status || 'Ativa'}
                        onValueChange={(value) => setEditingStage({ ...editingStage, status: value as StatusPipeline })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={editingStage.dataInicio || ''}
                          onChange={(e) => setEditingStage({ ...editingStage, dataInicio: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={editingStage.dataTermino || ''}
                          onChange={(e) => setEditingStage({ ...editingStage, dataTermino: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddStageDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddStage}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {pipelineStages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum stage adicionado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Término</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineStages.map((ps) => (
                      <TableRow key={ps.id}>
                        <TableCell className="font-medium">{ps.stage?.nome || '-'}</TableCell>
                        <TableCell>{ps.stage?.tipo || '-'}</TableCell>
                        <TableCell>
                          <Badge className={ps.status === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {ps.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(ps.dataInicio)}</TableCell>
                        <TableCell>{formatDate(ps.dataTermino)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(ps.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{pipeline ? 'Editar Pipeline' : 'Nova Pipeline'}</CardTitle>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-xs mt-1 text-center">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              <FloppyDisk className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Pipeline'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

