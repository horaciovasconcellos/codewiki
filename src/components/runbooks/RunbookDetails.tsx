import { Runbook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilSimple, Trash, ArrowLeft, BookOpen, ListChecks, Play, CheckCircle, Robot, Camera, Warning } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RunbookDetailsProps {
  runbook: Runbook;
  onEdit: (runbook: Runbook) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const tipoColors: Record<string, string> = {
  'Procedimento de Rotina': 'bg-blue-500/10 text-blue-700 border-blue-300',
  'Contingência': 'bg-red-500/10 text-red-700 border-red-300',
  'Tratamento de Incidente': 'bg-orange-500/10 text-orange-700 border-orange-300',
  'Startup / Shutdown': 'bg-purple-500/10 text-purple-700 border-purple-300',
  'Deploy': 'bg-green-500/10 text-green-700 border-green-300',
  'Backup': 'bg-cyan-500/10 text-cyan-700 border-cyan-300',
  'Restore': 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
  'Operação Programada': 'bg-pink-500/10 text-pink-700 border-pink-300',
};

function TextSection({ label, content }: { label: string; content: string }) {
  if (!content || content.trim() === '') {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
      <div className="bg-muted/50 rounded-lg p-4">
        <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
      </div>
    </div>
  );
}

export function RunbookDetails({ runbook, onEdit, onDelete, onBack }: RunbookDetailsProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2" size={16} />
              Voltar
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="font-mono text-base px-3 py-1">
                  {runbook.sigla}
                </Badge>
                <Badge className={tipoColors[runbook.tipoRunbook] || 'bg-gray-500/10 text-gray-700 border-gray-300'}>
                  {runbook.tipoRunbook}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {runbook.descricaoResumida}
              </h1>
              <p className="text-muted-foreground text-lg">
                {runbook.finalidade}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => onEdit(runbook)}>
                <PencilSimple className="mr-2" size={16} />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2" size={16} />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o runbook "{runbook.sigla}"?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(runbook.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="pre-requisitos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pre-requisitos" className="flex items-center gap-2">
              <ListChecks size={16} />
              <span className="hidden md:inline">Pré-Requisitos</span>
            </TabsTrigger>
            <TabsTrigger value="procedimento" className="flex items-center gap-2">
              <Play size={16} />
              <span className="hidden md:inline">Procedimento</span>
            </TabsTrigger>
            <TabsTrigger value="pos-execucao" className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span className="hidden md:inline">Pós-Execução</span>
            </TabsTrigger>
            <TabsTrigger value="automacao" className="flex items-center gap-2">
              <Robot size={16} />
              <span className="hidden md:inline">Automação</span>
            </TabsTrigger>
            <TabsTrigger value="evidencias" className="flex items-center gap-2">
              <Camera size={16} />
              <span className="hidden md:inline">Evidências</span>
            </TabsTrigger>
            <TabsTrigger value="riscos" className="flex items-center gap-2">
              <Warning size={16} />
              <span className="hidden md:inline">Riscos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pre-requisitos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks />
                  Pré-Requisitos
                </CardTitle>
                <CardDescription>
                  Requisitos necessários antes de iniciar a execução do runbook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Acessos Necessários"
                  content={runbook.preRequisitos.acessosNecessarios}
                />
                <TextSection
                  label="Validações antes de iniciar"
                  content={runbook.preRequisitos.validacoesAntesIniciar}
                />
                <TextSection
                  label="Ferramentas necessárias (SSH, console, browser, scripts)"
                  content={runbook.preRequisitos.ferramentasNecessarias}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedimento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play />
                  Procedimento Operacional
                </CardTitle>
                <CardDescription>
                  Passos detalhados para execução do procedimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Comandos"
                  content={runbook.procedimentoOperacional.comandos}
                />
                <TextSection
                  label="Pontos de atenção"
                  content={runbook.procedimentoOperacional.pontosAtencao}
                />
                <TextSection
                  label="Checks intermediários"
                  content={runbook.procedimentoOperacional.checksIntermediarios}
                />
                <TextSection
                  label="Critérios de sucesso"
                  content={runbook.procedimentoOperacional.criteriosSucesso}
                />
                <TextSection
                  label="Critérios de falha"
                  content={runbook.procedimentoOperacional.criteriosFalha}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos-execucao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle />
                  Pós-Execução
                </CardTitle>
                <CardDescription>
                  Validações e verificações após a execução
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Validações obrigatórias"
                  content={runbook.posExecucao.validacoesObrigatorias}
                />
                <TextSection
                  label="Verificação de logs"
                  content={runbook.posExecucao.verificacaoLogs}
                />
                <TextSection
                  label="Status esperado da aplicação"
                  content={runbook.posExecucao.statusEsperadoAplicacao}
                />
                <TextSection
                  label="Notificações Necessárias"
                  content={runbook.posExecucao.notificacoesNecessarias}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Robot />
                  Execução Automatizada
                </CardTitle>
                <CardDescription>
                  Informações sobre automação do procedimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Scripts relacionados"
                  content={runbook.execucaoAutomatizada.scriptsRelacionados}
                />
                <TextSection
                  label="Jobs associados (Scheduler, Cron, Pipelines DevOps)"
                  content={runbook.execucaoAutomatizada.jobsAssociados}
                />
                <TextSection
                  label="URL da Localização dos scripts"
                  content={runbook.execucaoAutomatizada.urlLocalizacaoScripts}
                />
                <TextSection
                  label="Condições para automação"
                  content={runbook.execucaoAutomatizada.condicoesAutomacao}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidencias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera />
                  Evidências
                </CardTitle>
                <CardDescription>
                  Documentação e comprovações da execução
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Prints / Logs necessários"
                  content={runbook.evidencias.printsLogsNecessarios}
                />
                <TextSection
                  label="Arquivos gerados"
                  content={runbook.evidencias.arquivosGerados}
                />
                <TextSection
                  label="Tempo médio de execução"
                  content={runbook.evidencias.tempoMedioExecucao}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riscos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning />
                  Riscos e Mitigações
                </CardTitle>
                <CardDescription>
                  Identificação de riscos e ações preventivas/corretivas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextSection
                  label="Principais riscos"
                  content={runbook.riscosMitigacoes.principaisRiscos}
                />
                <TextSection
                  label="Ações preventivas"
                  content={runbook.riscosMitigacoes.acoesPreventivas}
                />
                <TextSection
                  label="Ações corretivas rápidas"
                  content={runbook.riscosMitigacoes.acoesCorretivasRapidas}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
