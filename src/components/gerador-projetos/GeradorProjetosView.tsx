import { useState } from 'react';
import { useLogging } from '@/hooks/use-logging';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApi, apiPost, apiPut, apiDelete } from '@/hooks/use-api';
import { ProjetoGerado } from '@/lib/types';
import { Plus } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { GeradorProjetosForm } from './GeradorProjetosForm';
import { GeradorProjetosDataTable } from './GeradorProjetosDataTable';
import { Badge } from '@/components/ui/badge';

export function GeradorProjetosView() {
  const { logClick, logEvent, logError } = useLogging('geradorprojetos-view');
  const { data: projetosGerados, refetch } = useApi<ProjetoGerado[]>('/estruturas-projeto', []);
  
  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<ProjetoGerado | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projetoToDelete, setProjetoToDelete] = useState<ProjetoGerado | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<ProjetoGerado | null>(null);
  const [showAzureDialog, setShowAzureDialog] = useState(false);
  const [projetoToAzure, setProjetoToAzure] = useState<ProjetoGerado | null>(null);
  const [showRepositoriesDialog, setShowRepositoriesDialog] = useState(false);
  const [projetoToCreateRepos, setProjetoToCreateRepos] = useState<ProjetoGerado | null>(null);
  const [repositoriosCriados, setRepositoriosCriados] = useState<Set<string>>(new Set());

  const handleSave = async (projeto: ProjetoGerado, gerar: boolean) => {
    try {
      // Se gerar = true, incluir URL do projeto (simulado)
      if (gerar && !projeto.urlProjeto) {
        projeto.urlProjeto = `https://dev.azure.com/organization/${projeto.projeto}`;
      }

      if (editingProjeto) {
        await apiPut(`/estruturas-projeto/${editingProjeto.id}`, projeto);
        toast.success(gerar ? 'Projeto gerado com sucesso!' : 'Projeto atualizado com sucesso!');
      } else {
        await apiPost('/estruturas-projeto', projeto);
        toast.success(gerar ? 'Projeto criado e gerado com sucesso!' : 'Projeto salvo como Pendente!');
      }
      
      refetch();
      handleCancel();
    } catch (error) {
      toast.error('Erro ao salvar projeto');
      console.error(error);
    }
  };

  const handleEdit = (projeto: ProjetoGerado) => {
    const status = projeto.status || 'Pendente';
    if (status === 'Processado') {
      toast.error('Projetos processados não podem ser editados');
      return;
    }
    setEditingProjeto(projeto);
    setShowForm(true);
  };

  const handleDelete = (projeto: ProjetoGerado) => {
    setProjetoToDelete(projeto);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!projetoToDelete) return;
    
    try {
      await apiDelete(`/estruturas-projeto/${projetoToDelete.id}`);
      toast.success('Projeto excluído com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir projeto');
      console.error(error);
    } finally {
      setShowDeleteDialog(false);
      setProjetoToDelete(null);
    }
  };

  const handleView = (projeto: ProjetoGerado) => {
    setSelectedProjeto(projeto);
    setShowDetailsDialog(true);
  };

  const handleIntegrarAzure = (projeto: ProjetoGerado) => {
    const status = projeto.status || 'Pendente';
    if (status === 'Processado') {
      toast.error('Projeto já foi processado');
      return;
    }
    setProjetoToAzure(projeto);
    setShowAzureDialog(true);
  };

  const confirmIntegracaoAzure = async () => {
    if (!projetoToAzure) return;

    try {
      console.log('[INTEGRAÇÃO AZURE] Step 1: Iniciando integração automática');
      console.log('[INTEGRAÇÃO AZURE] Projeto:', projetoToAzure.projeto);

      toast.info('Iniciando integração com Azure DevOps...', { duration: 2000 });

      // Chamar endpoint de integração automática
      logEvent('api_call_start', 'api_call');

      const response = await fetch('/api/azure-devops/integrar-projeto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetoId: projetoToAzure.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao integrar projeto');
      }

      console.log('[INTEGRAÇÃO AZURE] Step 2: Projeto criado no Azure:', result);

      // Atualizar projeto no banco com status Processado e URL
      const projetoProcessado: ProjetoGerado = {
        ...projetoToAzure,
        nomeTime: projetoToAzure.nomeTime || `Time - ${projetoToAzure.projeto}`,
        numeroSemanas: projetoToAzure.numeroSemanas || 2,
        iteracaoMensal: projetoToAzure.iteracaoMensal || false,
        status: 'Processado',
        urlProjeto: result.projectUrl
      };

      console.log('[INTEGRAÇÃO AZURE] Step 3: Atualizando banco de dados');

      await apiPut(`/estruturas-projeto/${projetoToAzure.id}`, projetoProcessado);
      
      console.log('[INTEGRAÇÃO AZURE] Step 4: Integração completa!');
      
      toast.success(`Projeto integrado com sucesso!\nURL: ${result.projectUrl}`, { duration: 5000 });
      
      refetch();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[INTEGRAÇÃO AZURE] ERRO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao integrar: ${errorMessage}`);
    } finally {
      setShowAzureDialog(false);
      setProjetoToAzure(null);
    }
  };

  const handleCriarRepositorios = (projeto: ProjetoGerado) => {
    const status = projeto.status || 'Pendente';
    if (status !== 'Processado') {
      toast.error('Apenas projetos processados podem ter repositórios criados');
      return;
    }
    if (!projeto.repositorios || projeto.repositorios.length === 0) {
      toast.error('Este projeto não possui repositórios configurados');
      return;
    }
    setProjetoToCreateRepos(projeto);
    setShowRepositoriesDialog(true);
  };

  const confirmCriarRepositorios = async () => {
    if (!projetoToCreateRepos) return;

    try {
      console.log('[CRIAR REPOSITÓRIOS] Step 1: Iniciando criação de repositórios Git');
      console.log('[CRIAR REPOSITÓRIOS] Projeto:', projetoToCreateRepos.projeto);
      console.log('[CRIAR REPOSITÓRIOS] Repositórios:', projetoToCreateRepos.repositorios);

      toast.info('Criando repositórios Git no Azure DevOps...', { duration: 3000 });

      logEvent('api_call_start', 'api_call');


      const response = await fetch('/api/azure-devops/criar-repositorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetoId: projetoToCreateRepos.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar repositórios');
      }

      console.log('[CRIAR REPOSITÓRIOS] Step 2: Repositórios criados:', result);

      // Verificar quantos já existiam
      const jaExistentes = result.repositoriosCriados?.filter((r: any) => r.status === 'já existente').length || 0;
      const novos = result.sucesso - jaExistentes;

      let mensagem = '';
      if (novos > 0 && jaExistentes > 0) {
        mensagem = `${novos} repositório(s) criado(s) e ${jaExistentes} já existente(s).\nEstrutura inicial, CODEOWNERS e políticas de branch configuradas.`;
      } else if (novos > 0) {
        mensagem = `${novos} repositório(s) criado(s) com sucesso!\nEstrutura inicial, CODEOWNERS e políticas de branch configuradas.`;
      } else {
        mensagem = `${jaExistentes} repositório(s) já existente(s). Nenhuma alteração necessária.`;
      }

      // Marcar repositórios como criados
      setRepositoriosCriados(prev => new Set(prev).add(projetoToCreateRepos.id));
      logClick('repositories_created', { projeto_id: projetoToCreateRepos.id, count: result.sucesso });

      toast.success(mensagem, { duration: 6000 });

      refetch();
    } catch (error) {
      logError(error as Error, 'error_caught');
      console.error('[CRIAR REPOSITÓRIOS] ERRO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao criar repositórios: ${errorMessage}`);
    } finally {
      setShowRepositoriesDialog(false);
      setProjetoToCreateRepos(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProjeto(undefined);
  };

  const handleNew = () => {
    setEditingProjeto(undefined);
    setShowForm(true);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerador de Projetos</h1>
          <p className="text-muted-foreground">Crie e gerencie projetos no Azure DevOps</p>
        </div>
      </div>
      
      <Separator className="mb-6" />
      
      {showForm ? (
        <GeradorProjetosForm 
          projeto={editingProjeto}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projetos</CardTitle>
              <Button onClick={handleNew}>
                <Plus className="mr-2" size={16} />
                Novo Projeto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GeradorProjetosDataTable 
              projetos={projetosGerados || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onIntegrarAzure={handleIntegrarAzure}
              onCriarRepositorios={handleCriarRepositorios}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Projeto</DialogTitle>
            <DialogDescription>
              Informações completas do projeto gerado
            </DialogDescription>
          </DialogHeader>
          {selectedProjeto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Aplicação Base</div>
                  <div className="text-base">{selectedProjeto.produto || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <Badge variant={(selectedProjeto.status || 'Pendente') === 'Processado' ? 'default' : 'secondary'}>
                    {selectedProjeto.status || 'Pendente'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Projeto</div>
                  <div className="text-base">{selectedProjeto.projeto}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Processo</div>
                  <div className="text-base">{selectedProjeto.workItemProcess}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nome do Time</div>
                  <div className="text-base">{selectedProjeto.nomeTime || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Data Inicial</div>
                  <div className="text-base">{new Date(selectedProjeto.dataInicial).toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Número de Semanas</div>
                  <div className="text-base">{selectedProjeto.numeroSemanas || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Iteração</div>
                  <div className="text-base">{selectedProjeto.iteracao}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Configurações</div>
                <div className="space-y-1 text-sm">
                  <div>Shared Queries: {selectedProjeto.incluirQuery ? '✓' : '✗'}</div>
                  <div>Maven: {selectedProjeto.incluirMaven ? '✓' : '✗'}</div>
                  <div>Liquibase: {selectedProjeto.incluirLiquibase ? '✓' : '✗'}</div>
                  <div>Time de Sustentação: {selectedProjeto.criarTimeSustentacao ? '✓' : '✗'}</div>
                  {selectedProjeto.criarTimeSustentacao && (
                    <div>Iteração Mensal: {selectedProjeto.iteracaoMensal ? '✓' : '✗'}</div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Repositórios ({selectedProjeto.repositorios.length})</div>
                <div className="space-y-1">
                  {selectedProjeto.repositorios.map((repo, idx) => (
                    <div key={idx} className="text-sm font-mono bg-muted p-2 rounded">
                      {repo.produto}-{repo.categoria}-{repo.tecnologia}
                    </div>
                  ))}
                </div>
              </div>

              {selectedProjeto.urlProjeto && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">URL do Projeto</div>
                    <a 
                      href={selectedProjeto.urlProjeto} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      {selectedProjeto.urlProjeto}
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{projetoToDelete?.projeto}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Integração Azure */}
      <AlertDialog open={showAzureDialog} onOpenChange={setShowAzureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Integrar com Azure DevOps</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma a integração do projeto "{projetoToAzure?.projeto}" com o Azure DevOps? 
              O status será alterado para "Processado" e o projeto não poderá mais ser editado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmIntegracaoAzure}>Integrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Criação de Repositórios */}
      <AlertDialog open={showRepositoriesDialog} onOpenChange={setShowRepositoriesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Repositórios Git</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <p>
                  Confirma a criação de {projetoToCreateRepos?.repositorios?.length || 0} repositório(s) Git no Azure DevOps para o projeto "{projetoToCreateRepos?.projeto}"?
                </p>
                <p className="mt-2">Cada repositório será criado com:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Estrutura inicial (README.md, docs/, mkdocs.yml)</li>
                  <li>CODEOWNERS configurado</li>
                  <li>Templates de Pull Request por branch</li>
                  <li>Políticas de branch (revisores, builds, etc)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCriarRepositorios} className="bg-green-600 hover:bg-green-700">
              Criar Repositórios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
