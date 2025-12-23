import { useState, useEffect } from 'react';
import { ProjetoGerado, Aplicacao, WorkItemProcess } from '@/lib/types';
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

interface GeradorProjetosFormProps {
  projeto?: ProjetoGerado;
  onSave: (projeto: ProjetoGerado, gerar: boolean) => void;
  onCancel: () => void;
}

type GrupoRepositorio = 'bibliotecas' | 'crm' | 'documentacao' | 'erp' | 'interno' | 'packages' | 'projetos' | 'servico';
type TipoRepositorio = 'acl' | 'api' | 'backend' | 'docs' | 'domínio' | 'frontend' | 'funcionalidade' | 'mobile';
type LinguagemRepositorio = 'abap' | 'c' | 'go' | 'java' | 'javascript' | 'php' | 'pl_sql' | 'python' | 'rust' | 'shell' | 'typescript';

interface RepositorioProjetoExtended {
  id: string;
  grupo: GrupoRepositorio;
  tipo: TipoRepositorio;
  linguagem: LinguagemRepositorio;
  display: string;
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
  const { data: aplicacoes } = useApi<Aplicacao[]>('/aplicacoes', []);
  
  const [aplicacaoBaseId, setAplicacaoBaseId] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [workItemProcess, setWorkItemProcess] = useState<WorkItemProcess>('Scrum');
  const [nomeTime, setNomeTime] = useState('');
  const [dataInicial, setDataInicial] = useState(getNextMonday());
  const [numeroSemanas, setNumeroSemanas] = useState('2');
  const [iteracao, setIteracao] = useState('1');
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
      setWorkItemProcess(projeto.workItemProcess);
      setNomeTime(projeto.nomeTime);
      setDataInicial(projeto.dataInicial);
      setNumeroSemanas(projeto.numeroSemanas ? String(projeto.numeroSemanas) : '2');
      setIteracao(String(projeto.iteracao));
      setIncluirQuery(projeto.incluirQuery);
      setIncluirMaven(projeto.incluirMaven);
      setIncluirLiquibase(projeto.incluirLiquibase);
      setCriarTimeSustentacao(projeto.criarTimeSustentacao);
      setIteracaoMensal(projeto.iteracaoMensal);
      
      const repos: RepositorioProjetoExtended[] = projeto.repositorios.map(r => ({
        id: r.id,
        grupo: r.produto as GrupoRepositorio,
        tipo: r.categoria as any as TipoRepositorio,
        linguagem: r.tecnologia as any as LinguagemRepositorio,
        display: `${r.produto}-${r.categoria}-${r.tecnologia}`
      }));
      setRepositorios(repos);
    }
  }, [projeto, aplicacoes]);

  useEffect(() => {
    if (nomeProjeto.trim()) {
      setNomeTime(`Time - ${nomeProjeto}`);
    } else {
      setNomeTime('');
    }
  }, [nomeProjeto]);

  useEffect(() => {
    if (!criarTimeSustentacao) {
      setIteracaoMensal(false);
    }
  }, [criarTimeSustentacao]);

  const handleAddRepositorio = () => {
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
      grupo: novoRepoGrupo,
      tipo: novoRepoTipo,
      linguagem: novoRepoLinguagem,
      display
    };

    setRepositorios([...repositorios, novoRepo]);
    setNovoRepoGrupo('');
    setNovoRepoTipo('');
    setNovoRepoLinguagem('');
    toast.success('Repositório adicionado');
  };

  const handleRemoveRepositorio = (id: string) => {
    setRepositorios(repositorios.filter(r => r.id !== id));
  };

  const validateForm = (): boolean => {
    if (!aplicacaoBaseId) {
      toast.error('Aplicação Base é obrigatória');
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
      incluirQuery,
      incluirMaven,
      incluirLiquibase,
      criarTimeSustentacao,
      iteracaoMensal,
      repositorios: repositorios.map(r => ({
        id: r.id,
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
          {/* Aplicação Base */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Projeto */}
            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto *</Label>
              <Input
                id="projeto"
                value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)}
                placeholder="Ex: Sistema de Vendas"
              />
            </div>

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
              <Label htmlFor="dataInicial">Data Inicial (Próxima Segunda) *</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                disabled
              />
            </div>

            {/* Número de Semanas */}
            <div className="space-y-2">
              <Label htmlFor="numeroSemanas">Número de Semanas (1-8) *</Label>
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
            <Label>DataTable Repositórios</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={novoRepoGrupo} onValueChange={(v) => setNovoRepoGrupo(v as GrupoRepositorio)}>
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bibliotecas">bibliotecas</SelectItem>
                  <SelectItem value="crm">crm</SelectItem>
                  <SelectItem value="documentacao">documentacao</SelectItem>
                  <SelectItem value="erp">erp</SelectItem>
                  <SelectItem value="interno">interno</SelectItem>
                  <SelectItem value="packages">packages</SelectItem>
                  <SelectItem value="projetos">projetos</SelectItem>
                  <SelectItem value="servico">servico</SelectItem>
                </SelectContent>
              </Select>
              <Select value={novoRepoTipo} onValueChange={(v) => setNovoRepoTipo(v as TipoRepositorio)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acl">acl</SelectItem>
                  <SelectItem value="api">api</SelectItem>
                  <SelectItem value="backend">backend</SelectItem>
                  <SelectItem value="docs">docs</SelectItem>
                  <SelectItem value="domínio">domínio</SelectItem>
                  <SelectItem value="frontend">frontend</SelectItem>
                  <SelectItem value="funcionalidade">funcionalidade</SelectItem>
                  <SelectItem value="mobile">mobile</SelectItem>
                </SelectContent>
              </Select>
              <Select value={novoRepoLinguagem} onValueChange={(v) => setNovoRepoLinguagem(v as LinguagemRepositorio)}>
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
                  <SelectItem value="typescript">typescript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={handleAddRepositorio} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Repositório
            </Button>

            {repositorios.length > 0 && (
              <div className="border rounded-md p-3 space-y-2">
                <div className="font-medium text-sm mb-2">Repositórios Adicionados:</div>
                {repositorios.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                    <div className="flex flex-col">
                      <span className="font-mono font-medium">{repo.display}</span>
                      <span className="text-xs text-muted-foreground">
                        {repo.grupo} / {repo.tipo} / {repo.linguagem}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRepositorio(repo.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2" size={16} />
              Cancelar
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleSubmit(false)}>
              <FloppyDisk className="mr-2" size={16} />
              Salvar (Permitir Integração Azure)
            </Button>
            <Button type="button" onClick={() => handleSubmit(true)}>
              <Play className="mr-2" size={16} />
              Salvar e Gerar Estruturas
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
