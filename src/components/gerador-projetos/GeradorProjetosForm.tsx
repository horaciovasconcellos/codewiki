import { useState, useEffect } from 'react';
import { ProjetoGerado, Aplicacao, WorkItemProcess } from '@/lib/types';
import { ProjetoSDD } from '@/types/sdd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FloppyDisk, X, Plus, Trash, Play } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/use-api';
import { RepositoriosDataTable } from './RepositoriosDataTable';

interface GeradorProjetosFormProps {
  projeto?: ProjetoGerado;
  onSave: (projeto: ProjetoGerado, gerar: boolean) => void;
  onCancel: () => void;
}

type GrupoRepositorio = 'bibliotecas' | 'crm' | 'doc' | 'erp' | 'interno' | 'packages' | 'projetos' | 'servico';
type TipoRepositorio = 'acl' | 'api' | 'backend' | 'biblioteca' | 'docs' | 'domínio' | 'frontend' | 'funcionalidade' | 'mobile';
type LinguagemRepositorio = 'abap' | 'c' | 'go' | 'java' | 'javascript' | 'php' | 'pl_sql' | 'python' | 'rust' | 'shell' | 'ssg' | 'typescript';

interface RepositorioProjetoExtended {
  id: string;
  nome: string;
  grupo: GrupoRepositorio;
  tipo: TipoRepositorio;
  linguagem: LinguagemRepositorio;
  display: string;
  criado?: boolean; // Se já foi criado no Azure DevOps
}

const getNextMonday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
};

export function GeradorProjetosForm({ projeto, onSave, onCancel }: GeradorProjetosFormProps) {
  const { data: projetosSDDData } = useApi<ProjetoSDD[]>('/sdd/projetos', []);
  const { data: aplicacoes } = useApi<Aplicacao[]>('/aplicacoes', []);
  
  // Filtrar apenas projetos SPEC-KIT que têm gerador_projetos=true E aplicacao_id definido
  const projetosSDD = projetosSDDData?.filter(p => p.gerador_projetos && p.aplicacao_id) || [];
  
  const [projetoSddId, setProjetoSddId] = useState('');
  const [aplicacaoBaseId, setAplicacaoBaseId] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [workItemProcess, setWorkItemProcess] = useState<WorkItemProcess>('Scrum');
  
  // Verificar se o projeto já foi processado (tem URL do projeto ou status Processado)
  const projetoJaProcessado = projeto?.status === 'Processado' || !!projeto?.urlProjeto;
  const [nomeTime, setNomeTime] = useState('');
  const [dataInicial, setDataInicial] = useState(getNextMonday());
  const [numeroSemanas, setNumeroSemanas] = useState('2');
  const [iteracao, setIteracao] = useState('1');
  const [innerSourceProject, setInnerSourceProject] = useState(false);
  const [incluirQuery, setIncluirQuery] = useState(false);
  const [incluirMaven, setIncluirMaven] = useState(false);
  const [incluirLiquibase, setIncluirLiquibase] = useState(false);
  const [criarTimeSustentacao, setCriarTimeSustentacao] = useState(false);
  const [iteracaoMensal, setIteracaoMensal] = useState(false);
  const [repositorios, setRepositorios] = useState<RepositorioProjetoExtended[]>([]);

  const [novoRepoGrupo, setNovoRepoGrupo] = useState<GrupoRepositorio | ''>('');
  const [novoRepoTipo, setNovoRepoTipo] = useState<TipoRepositorio | ''>('');
  const [novoRepoLinguagem, setNovoRepoLinguagem] = useState<LinguagemRepositorio | ''>('');

  useEffect(() => {
    if (projeto) {
      // Se tem aplicacaoBaseId, usar direto. Senão, buscar pelo produto (sigla)
      if (projeto.aplicacaoBaseId) {
        setAplicacaoBaseId(projeto.aplicacaoBaseId);
      } else if (projeto.produto && aplicacoes) {
        const app = aplicacoes.find(a => a.sigla === projeto.produto);
        if (app) {
          setAplicacaoBaseId(app.id);
        }
      }
      
      setNomeProjeto(projeto.projeto);
      
      // Tentar encontrar o projeto SDD correspondente
      if (projetosSDD && projeto.aplicacaoBaseId && projeto.projeto) {
        const projetoSdd = projetosSDD.find(
          p => p.aplicacao_id === projeto.aplicacaoBaseId && p.nome_projeto === projeto.projeto
        );
        if (projetoSdd) {
          setProjetoSddId(projetoSdd.id);
        }
      }
      setWorkItemProcess(projeto.workItemProcess);
      setNomeTime(projeto.nomeTime);
      // Converter data ISO para formato yyyy-MM-dd
      const dataFormatada = projeto.dataInicial.includes('T') 
        ? projeto.dataInicial.split('T')[0] 
        : projeto.dataInicial;
      setDataInicial(dataFormatada);
      setNumeroSemanas(projeto.numeroSemanas ? String(projeto.numeroSemanas) : '2');
      setIteracao(String(projeto.iteracao));
      setInnerSourceProject(projeto.innerSourceProject || false);
      setIncluirQuery(projeto.incluirQuery);
      setIncluirMaven(projeto.incluirMaven);
      setIncluirLiquibase(projeto.incluirLiquibase);
      setCriarTimeSustentacao(projeto.criarTimeSustentacao);
      setIteracaoMensal(projeto.iteracaoMensal);
      
      const repos: RepositorioProjetoExtended[] = projeto.repositorios.map(r => ({
        id: r.id,
        nome: r.nome || `${r.produto}-${r.categoria}-${r.tecnologia}`,
        grupo: r.produto as GrupoRepositorio,
        tipo: r.categoria as any as TipoRepositorio,
        linguagem: r.tecnologia as any as LinguagemRepositorio,
        display: `${r.produto}-${r.categoria}-${r.tecnologia}`,
        // Marcar como criado se tem urlProjeto ou se o projeto inteiro foi processado
        criado: !!r.urlProjeto || projeto.status === 'Processado'
      }));
      setRepositorios(repos);
    }
  }, [projeto, aplicacoes, projetosSDD]);

  useEffect(() => {
    if (!criarTimeSustentacao) {
      setIteracaoMensal(false);
    }
  }, [criarTimeSustentacao]);

  // Auto-preencher Nome do Time quando digitar nome do projeto (apenas modo manual)
  useEffect(() => {
    if (!projetoSddId && nomeProjeto.trim()) {
      setNomeTime(`Time - ${nomeProjeto}`);
    }
  }, [nomeProjeto, projetoSddId]);

  // Handler para quando selecionar um projeto SPEC-KIT
  const handleProjetoSddChange = (projetoId: string) => {
    // Se selecionou MANUAL, limpar tudo
    if (projetoId === 'MANUAL') {
      setProjetoSddId('');
      setAplicacaoBaseId('');
      setNomeProjeto('');
      setNomeTime('');
      return;
    }
    
    setProjetoSddId(projetoId);
    const projetoSdd = projetosSDD.find(p => p.id === projetoId);
    if (projetoSdd) {
      // Preencher aplicação base e nome do projeto automaticamente
      if (projetoSdd.aplicacao_id) {
        setAplicacaoBaseId(projetoSdd.aplicacao_id);
      }
      setNomeProjeto(projetoSdd.nome_projeto);
      setNomeTime(`Time - ${projetoSdd.nome_projeto}`);
    }
  };

  const handleAddRepositorio = () => {
    if (projetoJaProcessado) {
      toast.error('Não é possível adicionar repositórios a um projeto já processado');
      return;
    }
    
    if (!novoRepoGrupo || !novoRepoTipo || !novoRepoLinguagem) {
      toast.error('Preencha todos os campos do repositório');
      return;
    }

    const display = `${novoRepoGrupo}-${novoRepoTipo}-${novoRepoLinguagem}`;
    const exists = repositorios.find(r => r.display === display);
    if (exists) {
      toast.error('Já existe um repositório com essa combinação');
      return;
    }

    const novoRepo: RepositorioProjetoExtended = {
      id: `repo-${Date.now()}`,
      nome: display, // Nome padrão baseado na combinação
      grupo: novoRepoGrupo,
      tipo: novoRepoTipo,
      linguagem: novoRepoLinguagem,
      display,
      criado: false
    };

    setRepositorios([...repositorios, novoRepo]);
    setNovoRepoGrupo('');
    setNovoRepoTipo('');
    setNovoRepoLinguagem('');
    toast.success('Repositório adicionado');
  };

  const handleRemoveRepositorio = (id: string) => {
    const repo = repositorios.find(r => r.id === id);
    if (repo?.criado) {
      toast.error('Não é possível excluir um repositório já criado no Azure DevOps');
      return;
    }
    setRepositorios(repositorios.filter(r => r.id !== id));
    toast.success('Repositório removido');
  };

  const handleUpdateRepositorioNome = (id: string, novoNome: string) => {
    const repo = repositorios.find(r => r.id === id);
    if (repo?.criado) {
      toast.error('Não é possível editar um repositório já criado no Azure DevOps');
      return;
    }
    setRepositorios(repositorios.map(r => 
      r.id === id ? { ...r, nome: novoNome } : r
    ));
  };

  const validateForm = (): boolean => {
    // projetoSddId é opcional - permite criar projeto sem SPEC-KIT associado
    if (projetoSddId && !aplicacaoBaseId) {
      toast.error('Aplicação Base é obrigatória quando um projeto SPEC-KIT é selecionado');
      return false;
    }
    if (!projetoSddId && !aplicacaoBaseId) {
      toast.error('Selecione um projeto SPEC-KIT ou uma Aplicação Base');
      return false;
    }
    if (!nomeProjeto.trim()) {
      toast.error('Nome do Projeto é obrigatório');
      return false;
    }
    if (!nomeTime.trim()) {
      toast.error('Nome do Time é obrigatório');
      return false;
    }
    if (!numeroSemanas.trim()) {
      toast.error('Número de semanas é obrigatório');
      return false;
    }
    const semanas = parseInt(numeroSemanas, 10);
    if (isNaN(semanas) || semanas < 1 || semanas > 8) {
      toast.error('Número de semanas deve estar entre 1 e 8');
      return false;
    }
    if (!iteracao.trim()) {
      toast.error('Iteração é obrigatória');
      return false;
    }
    return true;
  };

  const handleSubmit = (gerar: boolean) => {
    if (!validateForm()) return;
    
    // Impedir geração de projeto já processado
    if (gerar && projetoJaProcessado) {
      toast.error('Este projeto já foi processado e não pode ser gerado novamente');
      return;
    }

    const aplicacao = aplicacoes?.find(a => a.id === aplicacaoBaseId);

    const novoProjeto: ProjetoGerado = {
      id: projeto?.id || `projeto-${Date.now()}`,
      produto: aplicacao?.sigla || '',
      workItemProcess,
      projeto: nomeProjeto.trim(),
      nomeTime: nomeTime.trim(),
      dataInicial,
      numeroSemanas: parseInt(numeroSemanas, 10),
      iteracao: parseInt(iteracao, 10),
      innerSourceProject,
      incluirQuery,
      incluirMaven,
      incluirLiquibase,
      criarTimeSustentacao,
      iteracaoMensal,
      repositorios: repositorios.map(r => ({
        id: r.id,
        nome: r.nome,
        produto: r.grupo,
        categoria: r.tipo as any,
        tecnologia: r.linguagem as any
      })),
      dataCriacao: projeto?.dataCriacao || new Date().toISOString(),
      estruturasGeradas: projeto?.estruturasGeradas || [],
      status: gerar ? 'Processado' : 'Pendente',
      urlProjeto: projeto?.urlProjeto,
      aplicacaoBaseId
    };

    onSave(novoProjeto, gerar);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projeto ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {/* Projeto SPEC-KIT */}
          <div className="space-y-2">
            <Label htmlFor="projetoSdd">Projeto SPEC-KIT (Opcional)</Label>
            <Select value={projetoSddId || 'MANUAL'} onValueChange={handleProjetoSddChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto SPEC-KIT ou deixe em branco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Nenhum (preencher manualmente)</SelectItem>
                {projetosSDD && projetosSDD.length > 0 ? (
                  projetosSDD.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.aplicacao_sigla ? `${proj.aplicacao_sigla} - ${proj.nome_projeto}` : proj.nome_projeto}
                    </SelectItem>
                  ))
                ) : null}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione um projeto SPEC-KIT com "Gerador de Projetos" ativado ou deixe em branco para preencher manualmente
            </p>
          </div>

          {/* Informações do Projeto - Editar ou Visualizar */}
          {projetoSddId ? (
            /* Projeto SPEC-KIT selecionado - apenas visualizar */
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Aplicação Base</Label>
                <p className="text-sm font-medium">
                  {aplicacoes?.find(a => a.id === aplicacaoBaseId)?.sigla || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome do Projeto</Label>
                <p className="text-sm font-medium">{nomeProjeto || '-'}</p>
              </div>
            </div>
          ) : (
            /* Sem SPEC-KIT - permitir edição manual */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aplicacaoBase">Aplicação Base *</Label>
                <Select value={aplicacaoBaseId} onValueChange={setAplicacaoBaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aplicação base" />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicacoes && aplicacoes.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.sigla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projeto">Nome do Projeto *</Label>
                <Input
                  id="projeto"
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  placeholder="Ex: Sistema de Vendas"
                />
              </div>
            </div>
          )}

          {/* Linha única: Processo, Nome do Time, Data Inicial, Número de Semanas e Iteração */}
          <div className="grid grid-cols-5 gap-4">
            {/* Processo */}
            <div className="space-y-2">
              <Label htmlFor="processo">Processo *</Label>
              <Select value={workItemProcess} onValueChange={(v) => setWorkItemProcess(v as WorkItemProcess)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agile">Agile</SelectItem>
                  <SelectItem value="Scrum">Scrum</SelectItem>
                  <SelectItem value="CMMI">CMMI</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Time */}
            <div className="space-y-2">
              <Label htmlFor="nomeTime">Nome do Time *</Label>
              <Input
                id="nomeTime"
                value={nomeTime}
                onChange={(e) => setNomeTime(e.target.value)}
                placeholder="Time - Nome do Projeto"
              />
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <Label htmlFor="dataInicial">Data Inicial *</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                disabled
              />
            </div>

            {/* Número de Semanas */}
            <div className="space-y-2">
              <Label htmlFor="numeroSemanas">Semanas (1-8) *</Label>
              <Input
                id="numeroSemanas"
                type="number"
                min="1"
                max="8"
                value={numeroSemanas}
                onChange={(e) => setNumeroSemanas(e.target.value)}
              />
            </div>

            {/* Iteração */}
            <div className="space-y-2">
              <Label htmlFor="iteracao">Iteração *</Label>
              <Input
                id="iteracao"
                type="number"
                value={iteracao}
                onChange={(e) => setIteracao(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {/* Checkbox InnerSource Project */}
          <div className="flex items-center space-x-2">
            <Checkbox id="innerSourceProject" checked={innerSourceProject} onCheckedChange={(v) => setInnerSourceProject(v === true)} />
            <label htmlFor="innerSourceProject" className="text-sm cursor-pointer">InnerSource Project</label>
          </div>

          <Separator />

          {/* Repositório */}
          <div className="space-y-3">
            <Label>Repositório</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="query" checked={incluirQuery} onCheckedChange={(v) => setIncluirQuery(v === true)} />
                <label htmlFor="query" className="text-sm cursor-pointer">Incluir Shared Queries</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="maven" checked={incluirMaven} onCheckedChange={(v) => setIncluirMaven(v === true)} />
                <label htmlFor="maven" className="text-sm cursor-pointer">Incluir Maven</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="liquibase" checked={incluirLiquibase} onCheckedChange={(v) => setIncluirLiquibase(v === true)} />
                <label htmlFor="liquibase" className="text-sm cursor-pointer">Incluir Liquibase</label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Componentes do Time */}
          <div className="space-y-3">
            <Label>Componentes do Time</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="sustentacao" checked={criarTimeSustentacao} onCheckedChange={(v) => setCriarTimeSustentacao(v === true)} />
                <label htmlFor="sustentacao" className="text-sm cursor-pointer">Criar Time de Sustentação</label>
              </div>
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox 
                  id="mensal" 
                  checked={iteracaoMensal} 
                  onCheckedChange={(v) => setIteracaoMensal(v === true)}
                  disabled={!criarTimeSustentacao}
                />
                <label htmlFor="mensal" className={`text-sm cursor-pointer ${!criarTimeSustentacao ? 'text-muted-foreground' : ''}`}>
                  Mensal
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* DataTable Repositórios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>DataTable Repositórios</Label>
              {projetoJaProcessado && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Projeto Processado
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select 
                value={novoRepoGrupo} 
                onValueChange={(v) => setNovoRepoGrupo(v as GrupoRepositorio)}
                disabled={projetoJaProcessado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bibliotecas">bibliotecas</SelectItem>
                  <SelectItem value="crm">crm</SelectItem>
                  <SelectItem value="doc">doc</SelectItem>
                  <SelectItem value="erp">erp</SelectItem>
                  <SelectItem value="interno">interno</SelectItem>
                  <SelectItem value="packages">packages</SelectItem>
                  <SelectItem value="projetos">projetos</SelectItem>
                  <SelectItem value="servico">servico</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={novoRepoTipo} 
                onValueChange={(v) => setNovoRepoTipo(v as TipoRepositorio)}
                disabled={projetoJaProcessado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acl">acl</SelectItem>
                  <SelectItem value="api">api</SelectItem>
                  <SelectItem value="backend">backend</SelectItem>
                  <SelectItem value="biblioteca">biblioteca</SelectItem>
                  <SelectItem value="docs">docs</SelectItem>
                  <SelectItem value="domínio">domínio</SelectItem>
                  <SelectItem value="frontend">frontend</SelectItem>
                  <SelectItem value="funcionalidade">funcionalidade</SelectItem>
                  <SelectItem value="mobile">mobile</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={novoRepoLinguagem} 
                onValueChange={(v) => setNovoRepoLinguagem(v as LinguagemRepositorio)}
                disabled={projetoJaProcessado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Linguagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abap">abap</SelectItem>
                  <SelectItem value="c">c</SelectItem>
                  <SelectItem value="go">go</SelectItem>
                  <SelectItem value="java">java</SelectItem>
                  <SelectItem value="javascript">javascript</SelectItem>
                  <SelectItem value="php">php</SelectItem>
                  <SelectItem value="pl_sql">pl_sql</SelectItem>
                  <SelectItem value="python">python</SelectItem>
                  <SelectItem value="rust">rust</SelectItem>
                  <SelectItem value="shell">shell</SelectItem>
                  <SelectItem value="ssg">ssg</SelectItem>
                  <SelectItem value="typescript">typescript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="button" 
              onClick={handleAddRepositorio} 
              variant="outline" 
              size="sm"
              disabled={projetoJaProcessado}
            >
              <Plus className="mr-2 h-4 w-4" />
              {projetoJaProcessado ? 'Projeto Já Processado' : 'Adicionar Repositório'}
            </Button>

            {/* DataTable de Repositórios */}
            <RepositoriosDataTable 
              repositorios={repositorios}
              onUpdateNome={handleUpdateRepositorioNome}
              onDelete={handleRemoveRepositorio}
              projetoProcessado={projetoJaProcessado}
            />
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex flex-col gap-3">
            {projetoJaProcessado && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                <strong>ℹ️ Projeto já processado:</strong> Este projeto já foi gerado no Azure DevOps. 
                Não é possível adicionar novos repositórios ou gerar as estruturas novamente.
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2" size={16} />
                Cancelar
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleSubmit(false)}>
                <FloppyDisk className="mr-2" size={16} />
                Salvar (Permitir Integração Azure)
              </Button>
              <Button 
                type="button" 
                onClick={() => handleSubmit(true)}
                disabled={projetoJaProcessado}
                title={projetoJaProcessado ? 'Projeto já foi processado e não pode ser gerado novamente' : 'Gerar estruturas no Azure DevOps'}
              >
                <Play className="mr-2" size={16} />
                {projetoJaProcessado ? 'Projeto Já Processado' : 'Salvar e Gerar Estruturas'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
