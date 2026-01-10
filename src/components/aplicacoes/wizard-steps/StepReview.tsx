import { useState, useEffect } from 'react';
import { 
  Aplicacao, 
  Tecnologia, 
  ProcessoNegocio, 
  CapacidadeNegocio,
  AssociacaoTecnologiaAplicacao,
  AmbienteTecnologico,
  AssociacaoCapacidadeNegocio,
  AssociacaoProcessoNegocio,
  IntegracaoAplicacao,
  AssociacaoSLAAplicacao,
  AssociacaoRunbookAplicacao,
  FaseCicloVida,
  CriticidadeNegocio,
  TipoAplicacao,
  Contrato,
  StatusContrato
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowSquareOut, BookOpen, HardDrives, GitBranch } from '@phosphor-icons/react';

interface StepReviewProps {
  sigla: string;
  descricao: string;
  urlDocumentacao: string;
  tipoAplicacao?: TipoAplicacao;
  faseCicloVida: FaseCicloVida;
  criticidadeNegocio: CriticidadeNegocio;
  optInOut?: boolean;
  tecnologias: Tecnologia[];
  tecnologiasAssociadas: AssociacaoTecnologiaAplicacao[];
  ambientes: AmbienteTecnologico[];
  capacidades: CapacidadeNegocio[];
  capacidadesAssociadas: AssociacaoCapacidadeNegocio[];
  processos: ProcessoNegocio[];
  processosAssociados: AssociacaoProcessoNegocio[];
  aplicacoes: Aplicacao[];
  integracoes: IntegracaoAplicacao[];
  slas: AssociacaoSLAAplicacao[];
  runbooks: AssociacaoRunbookAplicacao[];
  contratos: Contrato[];
  aplicacaoId?: string;
}

interface Servidor {
  id: string;
  sigla: string;
  hostname: string;
  tipo: string;
  sistemaOperacional: string;
  status: string;
}

interface Projeto {
  id: string;
  produto: string;
  projeto: string;
  workItemProcess: string;
  dataInicial: string;
  status: 'Pendente' | 'Processado';
  urlProjeto?: string;
  nomeTime?: string;
}

export function StepReview({
  sigla,
  descricao,
  urlDocumentacao,
  tipoAplicacao,
  faseCicloVida,
  criticidadeNegocio,
  optInOut,
  tecnologias,
  tecnologiasAssociadas,
  ambientes,
  capacidades,
  capacidadesAssociadas,
  processos,
  processosAssociados,
  aplicacoes,
  integracoes,
  slas,
  runbooks,
  contratos,
  aplicacaoId,
}: StepReviewProps) {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadingServidores, setLoadingServidores] = useState(false);
  const [loadingProjetos, setLoadingProjetos] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Carregar servidores associados
  useEffect(() => {
    if (aplicacaoId) {
      const loadServidores = async () => {
        try {
          setLoadingServidores(true);
          const response = await fetch(`${API_URL}/api/aplicacoes/${aplicacaoId}/servidores`);
          if (response.ok) {
            const data = await response.json();
            setServidores(data);
          }
        } catch (error) {
          console.error('[StepReview] Erro ao carregar servidores:', error);
        } finally {
          setLoadingServidores(false);
        }
      };
      loadServidores();
    }
  }, [aplicacaoId]);

  // Carregar projetos gerados
  useEffect(() => {
    const loadProjetos = async () => {
      try {
        setLoadingProjetos(true);
        const response = await fetch(`${API_URL}/api/projetos?produto=${encodeURIComponent(sigla)}`);
        if (response.ok) {
          const data = await response.json();
          setProjetos(data);
        }
      } catch (error) {
        console.error('[StepReview] Erro ao carregar projetos:', error);
      } finally {
        setLoadingProjetos(false);
      }
    };
    if (sigla) {
      loadProjetos();
    }
  }, [sigla]);
  const getTecnologiaNome = (id: string) => {
    const tec = tecnologias.find(t => t.id === id);
    return tec ? `${tec.sigla} - ${tec.nome}` : id;
  };

  const getCapacidadeNome = (id: string) => {
    const cap = capacidades.find(c => c.id === id);
    return cap ? cap.nome : id;
  };

  const getProcessoNome = (id: string) => {
    const proc = processos.find(p => p.id === id);
    return proc ? `${proc.identificacao} - ${proc.descricao}` : id;
  };

  const getAplicacaoNome = (id: string) => {
    const app = aplicacoes.find(a => a.id === id);
    return app ? `${app.sigla} - ${app.descricao}` : id;
  };

  const getStatusContratoColor = (status: StatusContrato) => {
    switch (status) {
      case 'Vigente': return 'bg-green-100 text-green-800';
      case 'Vencido': return 'bg-red-100 text-red-800';
      case 'Em Renovação': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    // Lidar com formato ISO 8601 (2025-12-15T00:00:00.000Z) ou YYYY-MM-DD
    if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já está no formato DD/MM/YYYY, retornar como está
    if (dateString.includes('/')) {
      return dateString;
    }
    
    return dateString;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sigla</p>
              <p className="text-base font-semibold">{sigla}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-base">{descricao}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">URL da Documentação</p>
            <p className="text-base text-blue-600">{urlDocumentacao}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {tipoAplicacao && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Aplicação</p>
                <Badge className="mt-1">{tipoAplicacao}</Badge>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fase do Ciclo de Vida</p>
              <Badge className="mt-1">{faseCicloVida}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Criticidade do Negócio</p>
              <Badge className="mt-1">{criticidadeNegocio}</Badge>
            </div>
          </div>
          {optInOut && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Opt-In/Out</p>
              <Badge variant="secondary" className="mt-1">Ativo</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Associações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Tecnologias ({tecnologiasAssociadas.filter(t => t.status === 'Ativo').length})</p>
            {tecnologiasAssociadas.filter(t => t.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tecnologia associada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tecnologiasAssociadas.filter(t => t.status === 'Ativo').map((t) => (
                  <Badge key={t.id} variant="outline">{getTecnologiaNome(t.tecnologiaId)}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Ambientes ({ambientes.filter(a => a.status === 'Ativo').length})</p>
            {ambientes.filter(a => a.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ambiente configurado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ambientes.filter(a => a.status === 'Ativo').map((a) => (
                  <Badge key={a.id} variant="outline">{a.tipoAmbiente}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Capacidades de Negócio ({capacidadesAssociadas.filter(c => c.status === 'Ativo').length})</p>
            {capacidadesAssociadas.filter(c => c.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma capacidade associada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {capacidadesAssociadas.filter(c => c.status === 'Ativo').map((c) => (
                  <Badge key={c.id} variant="outline">{getCapacidadeNome(c.capacidadeId)}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Processos de Negócio ({processosAssociados.filter(p => p.status === 'Ativo').length})</p>
            {processosAssociados.filter(p => p.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum processo associado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {processosAssociados.filter(p => p.status === 'Ativo').map((p) => (
                  <Badge key={p.id} variant="outline">{getProcessoNome(p.processoId)}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Integrações ({integracoes.filter(i => i.status === 'Ativo').length})</p>
            {integracoes.filter(i => i.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma integração configurada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {integracoes.filter(i => i.status === 'Ativo').map((i) => (
                  <Badge key={i.id} variant="outline">{getAplicacaoNome(i.aplicacaoDestinoId)}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">SLAs ({slas.filter(s => s.status === 'Ativo').length})</p>
            {slas.filter(s => s.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum SLA configurado</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slas.filter(s => s.status === 'Ativo').map((s) => (
                  <Badge key={s.id} variant="outline">{s.descricao}</Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <BookOpen size={16} />
              Runbooks ({runbooks.filter(r => r.status === 'Ativo').length})
            </p>
            {runbooks.filter(r => r.status === 'Ativo').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum runbook associado</p>
            ) : (
              <div className="space-y-2">
                {runbooks.filter(r => r.status === 'Ativo').map((runbook) => (
                  <div key={runbook.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{runbook.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      Data de associação: {formatDate(runbook.dataAssociacao)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Contratos ({contratos.length})</p>
            {contratos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado</p>
            ) : (
              <div className="space-y-2">
                {contratos.map((contrato) => (
                  <div key={contrato.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{contrato.numeroContrato}</p>
                      <p className="text-sm text-muted-foreground">
                        Vigência: {formatDate(contrato.dataVigenciaInicial)} até {formatDate(contrato.dataVigenciaFinal)}
                      </p>
                    </div>
                    <Badge className={getStatusContratoColor(contrato.status)}>
                      {contrato.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Servidores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrives size={20} />
            Servidores Associados
          </CardTitle>
          <CardDescription>
            Servidores onde a aplicação está hospedada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingServidores ? (
            <p className="text-sm text-muted-foreground">Carregando servidores...</p>
          ) : servidores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum servidor associado</p>
          ) : (
            <div className="space-y-2">
              {servidores.map((servidor) => (
                <div key={servidor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{servidor.sigla}</p>
                      <Badge variant="outline">{servidor.tipo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {servidor.hostname} • {servidor.sistemaOperacional}
                    </p>
                  </div>
                  <Badge className={servidor.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {servidor.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projetos Gerados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch size={20} />
            Projetos Gerados
          </CardTitle>
          <CardDescription>
            Projetos criados automaticamente para esta aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProjetos ? (
            <p className="text-sm text-muted-foreground">Carregando projetos...</p>
          ) : projetos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum projeto gerado</p>
          ) : (
            <div className="space-y-2">
              {projetos.map((projeto) => (
                <div key={projeto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{projeto.projeto}</p>
                      <Badge variant="outline">{projeto.workItemProcess}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Produto: {projeto.produto} • Data: {formatDate(projeto.dataInicial)}
                    </p>
                    {projeto.nomeTime && (
                      <p className="text-sm text-muted-foreground">Time: {projeto.nomeTime}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={projeto.status === 'Processado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {projeto.status}
                    </Badge>
                    {projeto.urlProjeto && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(projeto.urlProjeto, '_blank')}
                      >
                        <ArrowSquareOut size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
