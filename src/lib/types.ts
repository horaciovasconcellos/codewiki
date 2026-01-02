export type TipoTempo = 'D' | 'M' | 'A';

export interface TipoAfastamento {
  id: string;
  sigla: string;
  descricao: string;
  argumentacaoLegal: string;
  numeroDias: number;
  tipoTempo: TipoTempo;
}

export interface Afastamento {
  id: string;
  tipoAfastamentoId: string;
  inicialProvavel: string;
  finalProvavel: string;
  inicialEfetivo?: string;
  finalEfetivo?: string;
}

export type NivelHabilidade = 'Básico' | 'Intermediário' | 'Avançado' | 'Expert';

export interface HabilidadeColaborador {
  id: string;
  habilidadeId: string;
  nivelDeclarado: NivelHabilidade;
  nivelAvaliado: NivelHabilidade;
  dataInicio: string;
  dataTermino?: string;
}

export interface AvaliacaoColaborador {
  id: string;
  colaboradorId: string;
  dataAvaliacao: string;
  resultadosEntregas: number;
  competenciasTecnicas: number;
  qualidadeSeguranca: number;
  comportamentoCultura: number;
  evolucaoAprendizado: number;
  notaFinal?: number;
  observacoes?: string;
  motivo?: string;
  dataConversa?: string;
}

export interface Colaborador {
  id: string;
  matricula: string;
  nome: string;
  setor: string;
  dataAdmissao: string;
  dataDemissao?: string;
  afastamentos: Afastamento[];
  habilidades: HabilidadeColaborador[];
  avaliacoes?: AvaliacaoColaborador[];
}

export type CategoriaTecnologia = 
  | 'Aplicação Terceira'
  | 'Banco de Dados'
  | 'Biblioteca'
  | 'Frontend'
  | 'Backend'
  | 'Infraestrutura'
  | 'Devops'
  | 'Segurança'
  | 'Analytics'
  | 'Integração'
  | 'Inteligencia Artificial'
  | 'Outras';

export type StatusTecnologia = 'Ativa' | 'Em avaliação' | 'Obsoleta' | 'Descontinuada';

export type TipoLicenciamento = 'Open Source' | 'Proprietária' | 'SaaS' | 'Subscription';

export type MaturidadeInterna = 'Experimental' | 'Adotada' | 'Padronizada' | 'Restrita';

export type NivelSuporteInterno = 
  | 'Sem Suporte Interno'
  | 'Suporte Básico'
  | 'Suporte Intermediário'
  | 'Suporte Avançado'
  | 'Suporte Completo / Especializado'
  | 'AMS';

export type PerfilResponsavel = 
  | 'Perfis de Negócio / Operacionais'
  | 'Perfis Técnicos / TI'
  | 'Perfis de Governança / Gestão'
  | 'Perfis de Segurança e Compliance'
  | 'Perfis Específicos de Integração e Dados';

export interface Ambiente {
  dev: boolean;
  qa: boolean;
  prod: boolean;
  cloud: boolean;
  onPremise: boolean;
}

export interface ContratoAMS {
  id: string;
  contrato: string;
  cnpjContratado: string;
  custoAnual: number;
  dataInicio: string;
  dataTermino: string;
  status: 'Ativo' | 'Inativo';
}

export interface ContratoTecnologia {
  id: string;
  numeroContrato: string;
  vigenciaInicial: string;
  vigenciaTermino: string;
  valorContrato: number;
  status: 'Ativo' | 'Inativo';
}

export interface ResponsavelTecnologia {
  id: string;
  matriculaFuncionario: string;
  nomeFuncionario: string;
  dataInicio: string;
  dataTermino?: string;
  perfil: PerfilResponsavel;
  status: 'Ativo' | 'Inativo';
}

export interface CustoSaaS {
  id: string;
  custoTotalSaaS: number;
  custoPorLicenca: number;
  numeroLicencasContratadas: number;
  licencasUtilizadas: number;
  crescimentoCustoMensalMoM: number;
  slaCumprido: number;
}

export interface ManutencaoSaaS {
  id: string;
  dataHoraInicio: string;
  dataHoraTermino: string;
  tempoIndisponibilidadeHoras: number;
}

export interface Tecnologia {
  id: string;
  sigla: string;
  nome: string;
  versaoRelease: string;
  categoria: CategoriaTecnologia;
  status: StatusTecnologia;
  fornecedorFabricante: string;
  tipoLicenciamento: TipoLicenciamento;
  ambientes: Ambiente;
  dataFimSuporteEoS?: string;
  maturidadeInterna: MaturidadeInterna;
  nivelSuporteInterno: NivelSuporteInterno;
  documentacaoOficial?: string;
  repositorioInterno?: string;
  contratos?: ContratoTecnologia[];
  contratosAMS?: ContratoAMS[];
  responsaveis?: ResponsavelTecnologia[];
  custosSaaS?: CustoSaaS[];
  manutencoesSaaS?: ManutencaoSaaS[];
  createdAt?: string;
  updatedAt?: string;
}

export type NivelMaturidade = 'Inicial' | 'Repetível' | 'Definido' | 'Gerenciado' | 'Otimizado';
export type Frequencia = 'Diário' | 'Semanal' | 'Quinzenal' | 'Mensal' | 'Trimestral' | 'Ad-Hoc' | 'Anual' | 'Bi-Anual';
export type Complexidade = 'Muito Baixa' | 'Baixa' | 'Média' | 'Alta' | 'Muito Alta';
export type TipoNorma = 
  | 'Norma Legal'
  | 'Norma Técnica'
  | 'Norma Reguladora'
  | 'Norma Setorial'
  | 'Norma Organizacional'
  | 'Norma Contratual'
  | 'Regulamentação Internacional';

export type ObrigatoriedadeNorma = 
  | 'Não obrigatório'
  | 'Recomendado'
  | 'Obrigatório';

export interface NormaProcesso {
  id: string;
  tipoNorma: TipoNorma;
  obrigatoriedade: ObrigatoriedadeNorma;
  itemNorma: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface ProcessoNegocio {
  id: string;
  identificacao: string;
  descricao: string;
  nivelMaturidade: NivelMaturidade;
  areaResponsavel: string;
  frequencia: Frequencia;
  duracaoMedia: number;
  complexidade: Complexidade;
  normas: NormaProcesso[];
}

export type FaseCicloVida = 'Ideação' | 'Planejamento' | 'Desenvolvimento' | 'Produção' | 'Aposentado';
export type CriticidadeNegocio = 'Muito Baixa' | 'Baixa' | 'Média' | 'Alta' | 'Muito Alta';
export type TipoAplicacao = 'BOT' | 'COTS' | 'INTERNO' | 'MOTS' | 'OSS' | 'OTS' | 'PAAS' | 'SAAS';
export type CloudProvider = 'AWS' | 'Microsoft Azure' | 'Google Cloud' | 'Alibaba Cloud' | 'Oracle' | 'Salesforce' | 'IBM Cloud' | 'Tencent Cloud' | 'ON-PREMISE' | 'Outros';
export type TipoAmbiente = 'Dev' | 'QA' | 'Prod' | 'Cloud' | 'On-Premise';
export type TipoSLA = 
  | 'SLA por Serviço'
  | 'SLA por Cliente'
  | 'SLA por Usuário'
  | 'SLA Baseado em Componentes'
  | 'SLA Operacional'
  | 'SLA de Apoio'
  | 'SLA por Nível de Prioridade / Severidade'
  | 'SLA de Performance'
  | 'SLA de Disponibilidade'
  | 'SLA de Capacidade'
  | 'SLA de Segurança'
  | 'SLA de Suporte / Atendimento';

export interface AssociacaoTecnologiaAplicacao {
  id: string;
  tecnologiaId: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface AmbienteTecnologico {
  id: string;
  tipoAmbiente: TipoAmbiente;
  urlAmbiente: string;
  dataCriacao: string;
  tempoLiberacao: number;
  status: 'Ativo' | 'Inativo';
}

export type NivelCapacidade = 'Nível 1' | 'Nível 2' | 'Nível 3';
export type CategoriaCapacidade = 
  | 'Financeiro'
  | 'RH'
  | 'Logística'
  | 'Atendimento'
  | 'Produção'
  | 'Comercial';

export interface CoberturaEstrategica {
  alinhamentoObjetivos: string;
  beneficiosEsperados: string;
  estadoFuturoDesejado: string;
  gapEstadoAtualFuturo: string;
}

export interface CapacidadeNegocio {
  id: string;
  sigla: string;
  nome: string;
  descricao: string;
  nivel: NivelCapacidade;
  categoria: CategoriaCapacidade;
  coberturaEstrategica: CoberturaEstrategica;
}

export interface AssociacaoCapacidadeNegocio {
  id: string;
  capacidadeId: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface AssociacaoProcessoNegocio {
  id: string;
  processoId: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface IntegracaoAplicacao {
  id: string;
  aplicacaoDestinoId: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface SLASuporteAtendimento {
  tempoResposta: string;
  tempoSolucao: string;
  horaInicialAtendimento: string;
  horaTerminoAtendimento: string;
}

export interface SLASeguranca {
  patchingMensalObrigatorio: boolean;
  mfaParaTodosAcessos: boolean;
  tempoCorrecaoVulnerabilidadeCritical: string;
}

export interface SLACapacidade {
  percentualCPUMaxima: number;
  capacidadeStorageLivre: number;
  escalabilidadeAutomatica: boolean;
}

export interface SLADisponibilidade {
  percentualUptime: number;
}

export interface SLAPerformance {
  latenciaMaxima: number;
  throughput: number;
  iopsStorage: number;
  errosPorMinuto: number;
}

export interface SLAPrioridade {
  p1: string;
  p2: string;
  p3: string;
}

export interface SLAApoio {
  slaEmpresa: string;
  slaFornecedores: string;
}

export interface SLAOperacional {
  infraestrutura: string;
  servico: string;
  rede: string;
}

export interface SLAComponentes {
  slaBancoDados: string;
  slaRede: string;
  slaStorage: string;
  slaMicroservico: string;
}

export interface SLAUsuario {
  suportePrioritarioAreaCritica: string;
  atendimentoEspecialUsuariosChave: string;
}

export interface SLAServico {
  disponibilidadeSistema: string;
  backupDiario: string;
  tempoRespostaAPIs: string;
  rpoRtoDR: string;
  clonagem: string;
  dataAlvoClonagem: string;
}

export interface AssociacaoSLAAplicacao {
  id: string;
  slaId: string;
  descricao: string;
  dataInicio: string;
  dataTermino?: string;
  status: 'Ativo' | 'Inativo';
}

export interface AssociacaoRunbookAplicacao {
  id: string;
  runbookId: string;
  descricao: string;
  dataAssociacao: string;
  status: 'Ativo' | 'Inativo';
}

export interface Aplicacao {
  id: string;
  sigla: string;
  descricao: string;
  urlDocumentacao: string;
  tipoAplicacao?: TipoAplicacao;
  faseCicloVida: FaseCicloVida;
  criticidadeNegocio: CriticidadeNegocio;
  categoriaSistema?: string;
  fornecedor?: string;
  tipoHospedagem?: string;
  cloudProvider?: CloudProvider;
  custoMensal?: number;
  numeroUsuarios?: number;
  dataImplantacao?: string;
  versaoAtual?: string;
  responsavelTecnico?: string;
  responsavelNegocio?: string;
  statusOperacional?: string;
  observacoes?: string;
  tecnologias?: AssociacaoTecnologiaAplicacao[];
  ambientes?: AmbienteTecnologico[];
  capacidades?: AssociacaoCapacidadeNegocio[];
  processos?: AssociacaoProcessoNegocio[];
  integracoes?: IntegracaoAplicacao[];
  slas?: AssociacaoSLAAplicacao[];
  runbooks?: AssociacaoRunbookAplicacao[];
  adrs?: ADRAplicacao[];
  createdAt?: string;
  updatedAt?: string;
}

export type TipoRunbook = 
  | 'Procedimento de Rotina'
  | 'Contingência'
  | 'Tratamento de Incidente'
  | 'Startup / Shutdown'
  | 'Deploy'
  | 'Backup'
  | 'Restore'
  | 'Operação Programada';

export interface PreRequisitosRunbook {
  acessosNecessarios: string;
  validacoesAntesIniciar: string;
  ferramentasNecessarias: string;
}

export interface ProcedimentoOperacional {
  comandos: string;
  pontosAtencao: string;
  checksIntermediarios: string;
  criteriosSucesso: string;
  criteriosFalha: string;
}

export interface PosExecucao {
  validacoesObrigatorias: string;
  verificacaoLogs: string;
  statusEsperadoAplicacao: string;
  notificacoesNecessarias: string;
}

export interface ExecucaoAutomatizada {
  scriptsRelacionados: string;
  jobsAssociados: string;
  urlLocalizacaoScripts: string;
  condicoesAutomacao: string;
}

export interface Evidencias {
  printsLogsNecessarios: string;
  arquivosGerados: string;
  tempoMedioExecucao: string;
}

export interface RiscosMitigacoes {
  principaisRiscos: string;
  acoesPreventivas: string;
  acoesCorretivasRapidas: string;
}

export interface Runbook {
  id: string;
  sigla: string;
  descricaoResumida: string;
  finalidade: string;
  tipoRunbook: TipoRunbook;
  preRequisitos: PreRequisitosRunbook;
  procedimentoOperacional: ProcedimentoOperacional;
  posExecucao: PosExecucao;
  execucaoAutomatizada: ExecucaoAutomatizada;
  evidencias: Evidencias;
  riscosMitigacoes: RiscosMitigacoes;
}

export interface SLA {
  id: string;
  sigla: string;
  descricao: string;
  tipoSLA: TipoSLA;
  dataInicio: string;
  dataTermino?: string;
  suporteAtendimento?: SLASuporteAtendimento;
  seguranca?: SLASeguranca;
  capacidade?: SLACapacidade;
  disponibilidade?: SLADisponibilidade;
  performance?: SLAPerformance;
  prioridade?: SLAPrioridade;
  apoio?: SLAApoio;
  operacional?: SLAOperacional;
  componentes?: SLAComponentes;
  usuario?: SLAUsuario;
  servico?: SLAServico;
  status: 'Ativo' | 'Inativo';
}

export type TipoScript = 
  | 'Automação'
  | 'Administração'
  | 'Banco de Dados'
  | 'Integração'
  | 'Testes'
  | 'Build & Deploy'
  | 'CI/CD'
  | 'Infraestrutura (IaC)'
  | 'Monitoramento'
  | 'Segurança'
  | 'Governança'
  | 'Dados'
  | 'ERP'
  | 'Documentação';

export interface Script {
  id: string;
  sigla: string;
  descricao: string;
  dataInicio: string;
  dataTermino?: string;
  tipoScript: TipoScript;
  arquivo?: string; // Nome do arquivo
  arquivoUrl?: string; // URL/path do arquivo
  arquivoTamanho?: number; // Tamanho em bytes
  arquivoTipo?: string; // MIME type
}

export interface AzureDevOpsConfig {
  urlOrganizacao: string;
  apiVersion: string;
  timeoutSeconds: number;
  pageSize: number;
  personalAccessToken: string;
  autoCreate?: boolean;
}

export interface SysAidConfig {
  urlOrganizacao: string;
  usuarioAutenticado: string;
  personalAccessToken: string;
}

export interface IntegrationConfig {
  azureDevOps: AzureDevOpsConfig;
  sysAid: SysAidConfig;
}

export type TipoWIT = 'Bug' | 'PBI' | 'Task' | 'Spike' | 'Feature';

export type IdadeWIT = 'Hoje' | 'Semana' | '1 Mês' | 'Mais de 1 Mês';

export type CategoriaRepositorio = 
  | 'analiticos'
  | 'api'
  | 'app'
  | 'batch'
  | 'dashboard'
  | 'etl'
  | 'frontend'
  | 'backend'
  | 'integracao'
  | 'portal'
  | 'svc';

export type TecnologiaRepositorio = 
  | 'airflow'
  | 'angular'
  | 'databricks'
  | 'go'
  | 'java'
  | 'kotlin'
  | 'mulesoft'
  | 'node'
  | 'php'
  | 'plsql'
  | 'powerbi'
  | 'python'
  | 'react'
  | 'spark'
  | 'ords';

export type WorkItemProcess = 
  | 'Scrum'
  | 'Agile'
  | 'Basic'
  | 'CMMI'
  | 'bbtsπdev_Scrum';

export interface RepositorioProjeto {
  id: string;
  nome?: string;
  produto: string;
  categoria: CategoriaRepositorio;
  tecnologia: TecnologiaRepositorio;
  urlProjeto?: string; // URL do repositório criado no Azure DevOps
}

export interface ProjetoGerado {
  id: string;
  produto: string;
  workItemProcess: WorkItemProcess;
  projeto: string;
  nomeTime: string;
  dataInicial: string;
  numeroSemanas: number;
  iteracao: number;
  innerSourceProject?: boolean;
  incluirQuery: boolean;
  incluirMaven: boolean;
  incluirLiquibase: boolean;
  criarTimeSustentacao: boolean;
  iteracaoMensal: boolean;
  repositorios: RepositorioProjeto[];
  patToken?: string;
  dataCriacao: string;
  estruturasGeradas: string[];
  status: 'Pendente' | 'Processado';
  urlProjeto?: string;
  aplicacaoBaseId?: string;
  statusRepositorio?: 'N' | 'Y';
}

// Azure DevOps Work Items
export interface AzureWorkItem {
  id: string;
  projetoId: string;
  projetoNome: string;
  timeNome: string;
  workItemId: number;
  workItemType: string;
  title: string;
  state: string;
  assignedTo?: string;
  activity?: string;
  areaPath?: string;
  iterationPath?: string;
  createdDate: string;
  changedDate: string;
  closedDate?: string;
  priority?: number;
  effort?: number;
  remainingWork?: number;
  completedWork?: number;
  storyPoints?: number;
  url?: string;
  syncDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AzureWorkItemHistorico {
  id: string;
  workItemTableId: string;
  workItemId: number;
  projetoNome: string;
  campoAlterado: string;
  valorAnterior?: string;
  valorNovo?: string;
  alteradoPor?: string;
  dataAlteracao: string;
  syncDate: string;
  createdAt: string;
}

export interface AzureSyncLog {
  id: string;
  projetoId: string;
  projetoNome: string;
  inicioSync: string;
  fimSync?: string;
  status: 'em_progresso' | 'sucesso' | 'erro';
  totalWorkItems: number;
  novosWorkItems: number;
  atualizadosWorkItems: number;
  erroMensagem?: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  aplicacaoId: string;
  tipo: TipoWIT;
  titulo: string;
  dataAbertura: string;
  estado: string;
  prioridade?: string;
}

export interface AggregacaoWIT {
  tipo: TipoWIT;
  idade: IdadeWIT;
  quantidade: number;
}

export interface WITsPorAplicacao {
  aplicacaoId: string;
  aplicacaoSigla: string;
  totalAbertos: number;
  aggregacoes: AggregacaoWIT[];
  workItems: WorkItem[];
  dataUltimaAtualizacao: string;
}

export type TipoHabilidade = 'Soft Skills' | 'Hard Skills';

export type DominioHabilidade = 
  | 'Arquitetura & Integração de Sistemas'
  | 'Comunicação & Relacionamento'
  | 'Dados & Informação'
  | 'Desenvolvimento & Engenharia'
  | 'DevOps & DevSecOps'
  | 'ERP & Plataformas Corporativas'
  | 'Ética & Postura Profissional'
  | 'Gestão & Organização'
  | 'Liderança & Influência'
  | 'Pensamento Estratégico'
  | 'Segurança & Compliance';

export interface CertificacaoRelacionada {
  id: string;
  nomeCertificacao: string;
  tempoValidadeDias: number;
}

export interface Habilidade {
  id: string;
  sigla: string;
  descricao: string;
  tipo: TipoHabilidade;
  dominio: DominioHabilidade;
  subcategoria: CategoriaTecnologia;
  certificacoes: CertificacaoRelacionada[];
}

export type TipoComunicacao = 'Sincrono' | 'Assincrono' | 'Ambos';

export type TecnologiaComunicacao = 
  | 'ActiveMQ'
  | 'ANSI X12'
  | 'Apigee'
  | 'Boomi'
  | 'Camunda'
  | 'CSV'
  | 'Debezium'
  | 'EDI'
  | 'EDIFACT'
  | 'Event Mesh'
  | 'EventBridge'
  | 'FTP'
  | 'GoldenGate'
  | 'HTTP'
  | 'HTTP/2'
  | 'HTTP/JSON'
  | 'HTTP POST'
  | 'Kafka/Kinesis'
  | 'Kong'
  | 'MQTT Broker'
  | 'Mulesoft'
  | 'OpenAPI'
  | 'Oracle DB Link'
  | 'Oracle ESB'
  | 'Oracle Replication'
  | 'Protobuf'
  | 'Pub/Sub'
  | 'Pulsar'
  | 'RabbitMQ'
  | 'RTP'
  | 'S3/Blob/GCS'
  | 'SAP API Mgmt'
  | 'SAP BPA'
  | 'SAP Event Mesh'
  | 'SFTP cloud'
  | 'SIS'
  | 'SNS/SQS'
  | 'SQL Views'
  | 'SQS'
  | 'TXT'
  | 'WebRTC'
  | 'WS'
  | 'WSDL'
  | 'WSO2'
  | 'XML';

export interface Comunicacao {
  id: string;
  sigla: string;
  tecnologias: TecnologiaComunicacao[];
  tipo: TipoComunicacao;
  usoTipico: string;
}

export type TipoEntidadeToken = 
  | 'Pessoa Física'
  | 'Pessoa Jurídica'
  | 'Sistema'
  | 'Serviço Interno';

export type EscopoToken = 
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'READ'
  | 'ADMIN'
  | 'FINANCEIRO'
  | 'AUDITORIA'
  | 'INTEGRACAO';

export type AmbienteToken = 
  | 'Produção'
  | 'Homologação'
  | 'Desenvolvimento';

export type StatusToken = 
  | 'Ativo'
  | 'Revogado'
  | 'Expirado'
  | 'Pendente'
  | 'Suspenso';

export type TipoAcaoToken = 
  | 'Criação'
  | 'Renovação'
  | 'Revogação'
  | 'Suspensão'
  | 'Reativação'
  | 'Alteração de Escopos'
  | 'Alteração de Ambiente'
  | 'Uso';

export interface HistoricoTokenAcesso {
  id: string;
  tokenId: string;
  tipoAcao: TipoAcaoToken;
  descricao: string;
  realizadoPor: string;
  dataHora: string;
  dadosAnteriores?: Partial<TokenAcesso>;
  dadosNovos?: Partial<TokenAcesso>;
  ipOrigem?: string;
  localizacao?: string;
}

export interface TokenAcesso {
  id: string;
  tokenHash: string;
  tipoEntidade: TipoEntidadeToken;
  identificadorEntidade: string;
  nomeEntidade: string;
  escopos: EscopoToken[];
  ambiente: AmbienteToken;
  dataGeracao: string;
  dataInicioValidade: string;
  dataExpiracao?: string;
  tokenTemporario: boolean;
  motivoExpiracao?: string;
  permitirRegeneracao: boolean;
  rateLimitPorHora: number;
  origensPermitidas: string[];
  requerMFA: boolean;
  status: StatusToken;
  motivoRevogacao?: string;
  ultimaAtualizacao: string;
  criadoPor: string;
  dataHoraCriacao: string;
  ultimoUso?: string;
  quantidadeAcessos: number;
  origemUltimoAcesso?: string;
  localizacaoUltimoAcesso?: string;
  historico?: HistoricoTokenAcesso[];
}

// ==================== INTEGRAÇÕES ====================

export type TipoDispositivo = 'Web' | 'Mobile' | 'Desktop' | 'Máquinas Industriais' | 'Equipamentos' | 'IoT' | 'Outros';

export type TipoIntegracao = 
  | 'User-to-Cloud' 
  | 'User-to-OnPremise' 
  | 'Cloud-to-Cloud' 
  | 'OnPremise-to-Cloud' 
  | 'OnPremise-to-OnPremise';

export type TipoAutenticacao = 
  | 'API Key' 
  | 'OAuth 2.0' 
  | 'OIDC' 
  | 'SAML 2.0' 
  | 'LDAP' 
  | 'Kerberos' 
  | 'Basic Authentication' 
  | 'mTLS' 
  | 'JWT' 
  | 'Session-Based Authentication' 
  | 'MFA' 
  | 'Passkeys';

export type Periodicidade = 'Real-Time' | 'Near Real-Time' | 'Batch' | 'Event-Driven' | 'On-Demand';

export type FrequenciaUso = 'sob demanda' | 'evento' | 'batch';

export type EstiloIntegracao = 
  | 'Integração de processos'
  | 'Integração de dados'
  | 'Integração de análises'
  | 'Integração do usuário'
  | 'Integração de dispositivos';

export type PadraoCasoUso = 
  | 'A2A – Application-to-Application'
  | 'A2B – Application-to-Business'
  | 'B2B – Business-to-Business'
  | 'B2C – Business-to-Consumer'
  | 'C2B – Consumer-to-Business'
  | 'C2C – Consumer-to-Consumer'
  | 'T2T – Thing-to-Thing (IoT)'
  | 'T2C – Thing-to-Cloud'
  | 'T2A – Thing-to-Application'
  | 'Virtualização de dados'
  | 'Orquestração de dados'
  | 'extração, transformação e carregamento (ETL)'
  | 'Análises incorporadas'
  | 'Análise entre aplicações'
  | 'integração de interface do usuário'
  | 'Integração móvel'
  | 'Integração de chatbot'
  | 'Thing to analytics'
  | 'Thing to process'
  | 'Thing to data lake';

export type IntegracaoTecnologica = 
  | 'APIs (Application Programming Interfaces)'
  | 'Message Brokers'
  | 'ESB / iPaaS'
  | 'Tecnologias de EDI'
  | 'Integração por Arquivos'
  | 'Integração via Banco de Dados'
  | 'ETL/ELT e Data Integration'
  | 'Integração por Microservices'
  | 'IoT (Thing Integration)'
  | 'API Gateway / Gestão de APIs';

export interface Integracao {
  id: string;
  sigla: string;
  nome: string;
  estiloIntegracao?: EstiloIntegracao;
  padraoCasoUso?: PadraoCasoUso;
  integracaoTecnologica?: IntegracaoTecnologica;
  especificacaoFilename?: string;
  especificacaoMimetype?: string;
  especificacaoFile?: File;
  // Novos campos unificados
  tipoIntegracao?: TipoIntegracao;
  tipoDispositivo?: TipoDispositivo;
  nomeDispositivo?: string;
  aplicacaoOrigemId?: string;
  aplicacaoDestinoId?: string;
  comunicacaoId?: string;
  tipoAutenticacao?: TipoAutenticacao;
  periodicidade?: Periodicidade;
  frequenciaUso?: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserToCloud {
  id: string;
  integracaoId: string;
  tipoDispositivo: TipoDispositivo;
  nomeDispositivo: string;
  comunicacaoId: string;
  tipoAutenticacao: TipoAutenticacao;
  periodicidade: Periodicidade;
  frequenciaUso: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserToOnPremise {
  id: string;
  integracaoId: string;
  tipoDispositivo: TipoDispositivo;
  nomeDispositivo: string;
  comunicacaoId: string;
  tipoAutenticacao: TipoAutenticacao;
  periodicidade: Periodicidade;
  frequenciaUso: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export interface CloudToCloud {
  id: string;
  integracaoId: string;
  aplicacaoOrigemId: string;
  aplicacaoDestinoId: string;
  tipoIntegracaoId: string;
  tipoAutenticacao: TipoAutenticacao;
  periodicidade: Periodicidade;
  frequenciaUso: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnPremiseToCloud {
  id: string;
  integracaoId: string;
  aplicacaoOrigemId: string;
  aplicacaoDestinoId: string;
  tipoIntegracaoId: string;
  tipoAutenticacao: TipoAutenticacao;
  periodicidade: Periodicidade;
  frequenciaUso: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnPremiseToOnPremise {
  id: string;
  integracaoId: string;
  aplicacaoOrigemId: string;
  aplicacaoDestinoId: string;
  tipoIntegracaoId: string;
  tipoAutenticacao: TipoAutenticacao;
  periodicidade: Periodicidade;
  frequenciaUso: FrequenciaUso;
  createdAt?: string;
  updatedAt?: string;
}

export type TipoSubIntegracao = 'user-to-cloud' | 'user-to-onpremise' | 'cloud-to-cloud' | 'onpremise-to-cloud' | 'onpremise-to-onpremise';
// ===== Tipos para Servidores =====
export type TipoServidor = 'Físico' | 'Virtual' | 'Cloud';
export type AmbienteServidor = 'Produção' | 'Pré-Produção' | 'Homologação' | 'Teste' | 'Desenvolvimento';
export type FinalidadeServidor = 'Aplicação' | 'Banco de Dados' | 'Integração' | 'Batch' | 'Monitoramento';
export type StatusServidor = 'Ativo' | 'Inativo' | 'Em manutenção' | 'Obsoleto';
export type ProvedorServidor = 'On-Premise' | 'AWS' | 'Azure' | 'OCI' | 'GCP' | 'IBM';
export type VirtualizadorServidor = 'VMware' | 'Hyper-V' | 'KVM' | 'Kubernetes' | 'N/A';
export type SistemaOperacionalServidor = 'Amazon Linux' | 'RHEL' | 'Ubuntu' | 'SLES' | 'Debian' | 'Oracle Linux' | 'Windows Server' | 'Windows';
export type FerramentaMonitoramento = 'Zabbix' | 'Prometheus' | 'Dynatrace' | 'DataDog' | 'SigNoz' | 'N/A';

export interface Servidor {
  id: string;
  // Identificação
  sigla: string;
  hostname: string;
  tipo: TipoServidor;
  ambiente: AmbienteServidor;
  finalidade: FinalidadeServidor;
  status: StatusServidor;
  // Plataforma
  provedor: ProvedorServidor;
  datacenterRegiao?: string;
  zonaAvailability?: string;
  clusterHost?: string;
  virtualizador?: VirtualizadorServidor;
  // Sistema Operacional
  sistemaOperacional: SistemaOperacionalServidor;
  distribuicaoVersao?: string;
  arquitetura?: string;
  // Operação e Monitoramento
  ferramentaMonitoramento?: FerramentaMonitoramento;
  backupDiario: boolean;
  backupSemanal: boolean;
  backupMensal: boolean;
  // Auditoria
  createdAt?: string;
  updatedAt?: string;
}

// ===== Tipos para Aplicação-Servidor =====
export type StatusAplicacaoServidor = 'Planejado' | 'Produção' | 'Aposentado';

export interface AplicacaoServidor {
  id?: string;
  servidorId: string;
  aplicacaoId: string;
  aplicacaoSigla?: string; // Para exibição
  aplicacaoDescricao?: string; // Para exibição
  dataInicio: string;
  dataTermino?: string;
  status: StatusAplicacaoServidor;
  createdAt?: string;
  updatedAt?: string;
}

// ===================================
// Contratos de Aplicações
// ===================================

export type StatusContrato = "Vigente" | "Vencido" | "Em Renovação" | "Cancelado";

export interface Contrato {
  id: string;
  aplicacaoId: string;
  numeroContrato: string;
  dataVigenciaInicial: string;
  dataVigenciaFinal: string;
  status: StatusContrato;
  createdAt?: string;
  updatedAt?: string;
}

// ===================================
// Payloads (OpenAPI Specifications)
// ===================================

export type FormatoArquivoPayload = 'JSON' | 'YAML';

export interface Payload {
  id: string;
  aplicacaoId: string;
  aplicacaoSigla?: string; // Para exibição
  aplicacaoDescricao?: string; // Para exibição
  sigla: string;
  definicao: string;
  descricao?: string;
  formatoArquivo: FormatoArquivoPayload;
  conteudoArquivo: string;
  versaoOpenapi: string;
  arquivoValido: boolean;
  ultimaValidacao?: string;
  errosValidacao?: string;
  dataInicio: string;
  dataTermino?: string;
  createdAt?: string;
  updatedAt?: string;
}

// =====================================================
// STAGES TYPES
// =====================================================

export type TipoStage = 'Build' | 'Test' | 'Security' | 'Deploy' | 'Quality' | 'Notification' | 'Custom';

export interface Stage {
  id: string;
  nome: string;
  descricao?: string;
  yamlContent?: string;
  tipo: TipoStage;
  reutilizavel: boolean;
  timeoutSeconds: number;
  createdAt?: string;
  updatedAt?: string;
}

// =====================================================
// PIPELINE DATABASE TYPES
// =====================================================

export type StatusPipeline = 'Ativa' | 'Em avaliação' | 'Obsoleta' | 'Descontinuada';

export interface Pipeline {
  id: string;
  nome: string;
  status: StatusPipeline;
  dataInicio?: string;
  dataTermino?: string;
  // Grupo trigger
  triggerBranches?: string;
  triggerPaths?: string;
  // Grupo pr
  prBranches?: string;
  // Variables
  variables?: string;
  // Grupo resources
  resourcesRepositories?: string;
  resourcesPipelines?: string;
  resourcesContainers?: string;
  // Grupo schedules
  schedules?: string;
  createdAt?: string;
  updatedAt?: string;
  // Relacionamento
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  stageId: string;
  status: StatusPipeline;
  dataInicio: string;
  dataTermino?: string;
  ordem: number;
  createdAt?: string;
  updatedAt?: string;
  // Relacionamento
  stage?: Stage;
}

// =====================================================
// ADR (ARCHITECTURAL DECISION RECORDS) TYPES
// =====================================================

export type StatusADR = 'Proposto' | 'Aceito' | 'Rejeitado' | 'Substituído' | 'Obsoleto' | 'Adiado/Retirado';
export type StatusAplicacaoADR = 'Ativo' | 'Inativo' | 'Planejado' | 'Descontinuado';

export interface ADR {
  id: string;
  sequencia: number;
  descricao: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  status: StatusADR;
  contexto?: string;
  decisao?: string;
  justificativa?: string;
  consequenciasPositivas?: string;
  consequenciasNegativas?: string;
  riscos?: string;
  alternativasConsideradas?: string;
  complianceConstitution?: string;
  adrSubstitutaId?: string;
  adrSubstitutaSequencia?: number;
  referencias?: string;
  createdAt?: string;
  updatedAt?: string;
  adrSubstituta?: ADR;
  aplicacoes?: ADRAplicacao[];
  aplicacoesCount?: number; // Contador para listagem
}

export interface ADRAplicacao {
  id: string;
  adrId: string;
  aplicacaoId: string;
  aplicacaoSigla?: string;
  aplicacaoNome?: string;
  aplicacaoDescricao?: string;
  dataInicio?: string;
  dataTermino?: string;
  status: StatusAplicacaoADR;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
  aplicacao?: Aplicacao;
}

// InnerSource Projects
export interface InnerSourceOwner {
  login: string;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface InnerSourceMetadata {
  logo?: string;
  topics?: string[];
  participation?: {
    contributors_count?: number;
    commits_last_year?: number;
    pull_requests_count?: number;
  };
  description_extended?: string;
  documentation?: string;
  contribution_guidelines?: string;
  maturity?: 'emerging' | 'growing' | 'mature' | 'graduated';
  contact?: string;
  last_sync?: string;
}

export interface InnerSourceProject {
  id: string;
  nome: string;
  full_nome: string;
  html_url: string;
  descricao?: string;
  stargazers_count: number;
  watchers_count: number;
  language?: string;
  forks_count: number;
  open_issues_count: number;
  license?: string;
  owner: InnerSourceOwner;
  _InnerSourceMetadata: InnerSourceMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentacaoProjeto {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  conteudo: string;
  categoria: 'Arquitetura' | 'Desenvolvimento' | 'Infraestrutura' | 'Segurança' | 'Processos' | 'API' | 'Outros';
  tags: string[];
  versao: string;
  autor: string;
  aplicacaoId?: string;
  aplicacaoNome?: string;
  status: 'Rascunho' | 'Em Revisão' | 'Publicado' | 'Arquivado';
  dataPublicacao?: string;
  dataUltimaAtualizacao: string;
  createdAt: string;
  updatedAt: string;
}
