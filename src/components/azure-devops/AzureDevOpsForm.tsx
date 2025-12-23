import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FloppyDisk, MicrosoftTeamsLogo, Play } from '@phosphor-icons/react';
import { ProjetoAzure, WorkItemProcess } from '@/lib/azure-devops-types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface AzureDevOpsFormProps {
  projeto: ProjetoAzure | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AzureDevOpsForm({ projeto, onClose, onSuccess }: AzureDevOpsFormProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [aplicacoes, setAplicacoes] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  
  // Form state
  const [produto, setProduto] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [workItemProcess, setWorkItemProcess] = useState<WorkItemProcess>('Scrum');
  const [teamName, setTeamName] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [criarTimeSustentacao, setCriarTimeSustentacao] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadAplicacoes();
    loadConfig();
    
    if (projeto) {
      setProduto(projeto.produto);
      setNomeProjeto(projeto.projeto);
      setWorkItemProcess(projeto.workItemProcess as WorkItemProcess);
      setTeamName(projeto.teamName);
      setDataInicial(projeto.dataInicial.split('T')[0]);
      setCriarTimeSustentacao(projeto.criarTimeSustentacao);
    } else {
      setDataInicial(getTodayDate());
    }
  }, [projeto]);

  const loadAplicacoes = async () => {
    try {
      const response = await fetch('/api/aplicacoes');
      if (response.ok) {
        const data = await response.json();
        setAplicacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/configuracoes');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const validateForm = () => {
    if (!produto) {
      toast.error('Selecione o produto');
      return false;
    }
    if (!nomeProjeto) {
      toast.error('Informe o nome do projeto');
      return false;
    }
    if (!teamName) {
      toast.error('Informe o nome do time');
      return false;
    }
    if (!dataInicial) {
      toast.error('Informe a data inicial');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data: any = {
        id: projeto?.id || uuidv4(),
        produto,
        projeto: nomeProjeto,
        workItemProcess,
        teamName,
        dataInicial,
        criarTimeSustentacao,
        status: 'pendente'
      };

      const url = projeto 
        ? `/api/azure-devops-projetos/${projeto.id}`
        : '/api/azure-devops-projetos';
      
      const method = projeto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success(projeto ? 'Projeto atualizado com sucesso' : 'Projeto salvo com sucesso');
        onSuccess();
      } else {
        toast.error('Erro ao salvar projeto');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInAzure = async () => {
    if (!validateForm()) return;

    // Verificar configurações do Azure DevOps
    if (!config.azure_devops_organization || !config.azure_devops_pat) {
      toast.error('Configure a organização e o PAT do Azure DevOps nas configurações de integração');
      return;
    }

    setCreating(true);
    try {
      // Primeiro salvar o registro
      const projetoId = projeto?.id || uuidv4();
      const dataToSave: any = {
        id: projetoId,
        produto,
        projeto: nomeProjeto,
        workItemProcess,
        teamName,
        dataInicial,
        criarTimeSustentacao,
        status: 'criando'
      };

      const saveUrl = projeto 
        ? `/api/azure-devops-projetos/${projeto.id}`
        : '/api/azure-devops-projetos';
      
      const saveMethod = projeto ? 'PUT' : 'POST';

      await fetch(saveUrl, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      // Criar no Azure DevOps
      toast.info('Criando projeto no Azure DevOps...');
      
      const azureResponse = await fetch('/api/azure-devops/setup-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: config.azure_devops_organization,
          pat: config.azure_devops_pat,
          projectName: nomeProjeto,
          workItemProcess,
          teamName,
          startDate: dataInicial,
          criarTimeSustentacao,
          areas: []
        })
      });

      if (azureResponse.ok) {
        const azureResult = await azureResponse.json();
        
        // Atualizar registro com dados do Azure
        await fetch(`/api/azure-devops-projetos/${projetoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...dataToSave,
            status: 'sucesso',
            azureProjectId: azureResult.data.project.id,
            azureProjectUrl: azureResult.data.project.url,
            teamsCreated: azureResult.data.teams.map((t: any) => t.name),
            iterationsCount: azureResult.data.iterations.length,
            areasCount: azureResult.data.areas.length
          })
        });

        toast.success('Projeto criado no Azure DevOps com sucesso!');
        onSuccess();
      } else {
        const error = await azureResponse.json();
        
        // Atualizar status para erro
        await fetch(`/api/azure-devops-projetos/${projetoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...dataToSave,
            status: 'erro',
            errorMessage: error.message || 'Erro desconhecido'
          })
        });

        toast.error(`Erro ao criar projeto: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Erro ao criar no Azure DevOps:', error);
      toast.error(`Erro ao criar projeto: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MicrosoftTeamsLogo className="h-6 w-6" weight="fill" />
              {projeto ? 'Editar Projeto Azure DevOps' : 'Novo Projeto Azure DevOps'}
            </CardTitle>
            <CardDescription>
              {projeto ? 'Atualizar informações do projeto' : 'Criar novo projeto no Azure DevOps'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Produto */}
        <div className="space-y-2">
          <Label htmlFor="produto">Produto (Sigla Aplicação) *</Label>
          <Select value={produto} onValueChange={setProduto}>
            <SelectTrigger id="produto">
              <SelectValue placeholder="Selecione o produto" />
            </SelectTrigger>
            <SelectContent>
              {aplicacoes.map((app) => (
                <SelectItem key={app.sigla} value={app.sigla}>
                  {app.sigla} - {app.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nome do Projeto */}
        <div className="space-y-2">
          <Label htmlFor="projeto">Nome do Projeto *</Label>
          <Input
            id="projeto"
            value={nomeProjeto}
            onChange={(e) => setNomeProjeto(e.target.value)}
            placeholder="Ex: MeuProjeto"
          />
        </div>

        {/* Work Item Process */}
        <div className="space-y-2">
          <Label htmlFor="workItemProcess">Work Item Process *</Label>
          <Select value={workItemProcess} onValueChange={(value) => setWorkItemProcess(value as WorkItemProcess)}>
            <SelectTrigger id="workItemProcess">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scrum">Scrum</SelectItem>
              <SelectItem value="Agile">Agile</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="CMMI">CMMI</SelectItem>
              <SelectItem value="bbtsπdev_Scrum">bbtsπdev_Scrum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nome do Time */}
        <div className="space-y-2">
          <Label htmlFor="teamName">Nome do Time *</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ex: Time Backend"
          />
        </div>

        {/* Data Inicial */}
        <div className="space-y-2">
          <Label htmlFor="dataInicial">Data Inicial *</Label>
          <Input
            id="dataInicial"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>

        {/* Criar Time de Sustentação */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sustentacao"
            checked={criarTimeSustentacao}
            onCheckedChange={(checked) => setCriarTimeSustentacao(checked as boolean)}
          />
          <Label htmlFor="sustentacao" className="font-normal cursor-pointer">
            Criar Time de Sustentação
          </Label>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <FloppyDisk className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
          {!projeto && (
            <Button onClick={handleCreateInAzure} disabled={creating || loading}>
              <Play className="h-4 w-4 mr-2" />
              {creating ? 'Criando...' : 'Salvar e Criar no Azure'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
