import { Aplicacao, Tecnologia, ProcessoNegocio, CapacidadeNegocio, SLA, AssociacaoSLAAplicacao } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pencil, Link as LinkIcon, Trash } from '@phosphor-icons/react';
import { Separator } from '@/components/ui/separator';
import { AssociacaoSLADialog } from './AssociacaoSLADialog';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AplicacaoDetailsProps {
  aplicacao: Aplicacao;
  tecnologias: Tecnologia[];
  processos: ProcessoNegocio[];
  capacidades: CapacidadeNegocio[];
  aplicacoes: Aplicacao[];
  onBack: () => void;
  onEdit: (aplicacao: Aplicacao) => void;
}

export function AplicacaoDetails({
  aplicacao,
  tecnologias,
  processos,
  capacidades,
  aplicacoes,
  onBack,
  onEdit,
}: AplicacaoDetailsProps) {
  const [aplicacoesState, setAplicacoes] = useLocalStorage<Aplicacao[]>('aplicacoes', []);
  const [slas] = useLocalStorage<SLA[]>('slas', []);

  const getTecnologiaNome = (id: string) => {
    const tec = tecnologias.find(t => t.id === id);
    return tec ? `${tec.sigla} - ${tec.nome}` : 'Não encontrada';
  };

  const getCapacidadeNome = (id: string) => {
    const cap = capacidades.find(c => c.id === id);
    return cap ? cap.nome : 'Não encontrada';
  };

  const getProcessoNome = (id: string) => {
    const proc = processos.find(p => p.id === id);
    return proc ? `${proc.identificacao} - ${proc.descricao}` : 'Não encontrado';
  };

  const getAplicacaoNome = (id: string) => {
    const app = aplicacoes.find(a => a.id === id);
    return app ? `${app.sigla} - ${app.descricao}` : 'Não encontrada';
  };

  const getSLANome = (id: string) => {
    const sla = (slas || []).find(s => s.id === id);
    return sla ? `${sla.sigla} - ${sla.descricao}` : 'SLA não encontrado';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleSaveAssociacaoSLA = (associacao: AssociacaoSLAAplicacao) => {
    setAplicacoes((current) => {
      const currentList = current || [];
      return currentList.map(app => {
        if (app.id === aplicacao.id) {
          const exists = app.slas.find(s => s.id === associacao.id);
          const updatedSlas = exists
            ? app.slas.map(s => s.id === associacao.id ? associacao : s)
            : [...app.slas, associacao];
          
          return { ...app, slas: updatedSlas };
        }
        return app;
      });
    });
  };

  const handleRemoveAssociacaoSLA = (associacaoId: string) => {
    setAplicacoes((current) => {
      const currentList = current || [];
      return currentList.map(app => {
        if (app.id === aplicacao.id) {
          return {
            ...app,
            slas: app.slas.map(s =>
              s.id === associacaoId ? { ...s, status: 'Inativo' as const } : s
            )
          };
        }
        return app;
      });
    });
    toast.success('Associação de SLA removida com sucesso');
  };

  const currentAplicacao = (aplicacoesState || []).find(a => a.id === aplicacao.id) || aplicacao;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="mr-2" />
              Voltar
            </Button>
            <Button variant="outline" onClick={() => onEdit(aplicacao)}>
              <Pencil className="mr-2" />
              Editar
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{aplicacao.sigla}</h1>
              <p className="text-muted-foreground mt-2">{aplicacao.descricao}</p>
              <div className="flex gap-2 mt-4">
                <Badge>{aplicacao.faseCicloVida}</Badge>
                <Badge variant="outline">{aplicacao.criticidadeNegocio}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="tecnologias">Tecnologias</TabsTrigger>
            <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
            <TabsTrigger value="capacidades">Capacidades</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
            <TabsTrigger value="slas">SLAs</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">URL da Documentação</p>
                  <a 
                    href={aplicacao.urlDocumentacao} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                  >
                    <LinkIcon size={16} />
                    {aplicacao.urlDocumentacao}
                  </a>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fase do Ciclo de Vida</p>
                    <p className="text-base font-semibold mt-1">{aplicacao.faseCicloVida}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Criticidade do Negócio</p>
                    <p className="text-base font-semibold mt-1">{aplicacao.criticidadeNegocio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tecnologias">
            <Card>
              <CardHeader>
                <CardTitle>Tecnologias Associadas</CardTitle>
                <CardDescription>
                  {currentAplicacao.tecnologias.filter(t => t.status === 'Ativo').length} tecnologias ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAplicacao.tecnologias.filter(t => t.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma tecnologia associada</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.tecnologias.filter(t => t.status === 'Ativo').map((t) => (
                      <div key={t.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{getTecnologiaNome(t.tecnologiaId)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Início: {formatDate(t.dataInicio)} | Término: {formatDate(t.dataTermino)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ambientes">
            <Card>
              <CardHeader>
                <CardTitle>Ambientes Tecnológicos</CardTitle>
                <CardDescription>
                  {currentAplicacao.ambientes.filter(a => a.status === 'Ativo').length} ambientes ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAplicacao.ambientes.filter(a => a.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhum ambiente configurado</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.ambientes.filter(a => a.status === 'Ativo').map((a) => (
                      <div key={a.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{a.tipoAmbiente}</p>
                          <Badge variant="outline">{a.tempoLiberacao} dias</Badge>
                        </div>
                        <a 
                          href={a.urlAmbiente} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 block"
                        >
                          {a.urlAmbiente}
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          Criado em: {formatDate(a.dataCriacao)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capacidades">
            <Card>
              <CardHeader>
                <CardTitle>Capacidades de Negócio</CardTitle>
                <CardDescription>
                  {currentAplicacao.capacidades.filter(c => c.status === 'Ativo').length} capacidades ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAplicacao.capacidades.filter(c => c.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma capacidade associada</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.capacidades.filter(c => c.status === 'Ativo').map((c) => (
                      <div key={c.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{getCapacidadeNome(c.capacidadeId)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Início: {formatDate(c.dataInicio)} | Término: {formatDate(c.dataTermino)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processos">
            <Card>
              <CardHeader>
                <CardTitle>Processos de Negócio</CardTitle>
                <CardDescription>
                  {currentAplicacao.processos.filter(p => p.status === 'Ativo').length} processos ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAplicacao.processos.filter(p => p.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhum processo associado</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.processos.filter(p => p.status === 'Ativo').map((p) => (
                      <div key={p.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{getProcessoNome(p.processoId)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Início: {formatDate(p.dataInicio)} | Término: {formatDate(p.dataTermino)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  {currentAplicacao.integracoes.filter(i => i.status === 'Ativo').length} integrações ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAplicacao.integracoes.filter(i => i.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma integração configurada</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.integracoes.filter(i => i.status === 'Ativo').map((i) => (
                      <div key={i.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{getAplicacaoNome(i.aplicacaoDestinoId)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Início: {formatDate(i.dataInicio)} | Término: {formatDate(i.dataTermino)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slas">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Service Level Agreements (SLAs)</CardTitle>
                    <CardDescription>
                      {currentAplicacao.slas.filter(s => s.status === 'Ativo').length} SLAs ativos
                    </CardDescription>
                  </div>
                  <AssociacaoSLADialog onSave={handleSaveAssociacaoSLA} />
                </div>
              </CardHeader>
              <CardContent>
                {currentAplicacao.slas.filter(s => s.status === 'Ativo').length === 0 ? (
                  <p className="text-muted-foreground">Nenhum SLA associado</p>
                ) : (
                  <div className="space-y-3">
                    {currentAplicacao.slas.filter(s => s.status === 'Ativo').map((s) => (
                      <div key={s.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{getSLANome(s.slaId)}</p>
                            <p className="text-sm text-muted-foreground mt-2">{s.descricao}</p>
                            <div className="flex gap-4 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Início</p>
                                <p className="text-sm font-medium">{formatDate(s.dataInicio)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Término</p>
                                <p className="text-sm font-medium">{formatDate(s.dataTermino)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <AssociacaoSLADialog 
                              associacao={s}
                              onSave={handleSaveAssociacaoSLA}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveAssociacaoSLA(s.id)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
