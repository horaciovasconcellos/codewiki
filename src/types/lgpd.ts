export type HierarquiaSensibilidade =
  | 'Dados Publicos'
  | 'Dados Corporativos'
  | 'Dados Pessoais'
  | 'Dados Identificadores'
  | 'Dados Sensíveis';

export type TipoDadoLGPD = 
  | 'Identificadores Direto'
  | 'Identificadores Indireto'
  | 'Sensível'
  | 'Financeiro'
  | 'Localização';

export type TecnicaAnonimizacao = 
  | 'Supressão'
  | 'Generalização'
  | 'Embaralhamento'
  | 'Permutação'
  | 'Sem Anonimização';

export type DepartamentoLGPD = 
  | 'Vendas'
  | 'Marketing'
  | 'Financeiro'
  | 'RH'
  | 'Logistica'
  | 'Assistencia Técnica'
  | 'Analytics';

export interface MatrizAnonimizacao {
  vendas: TecnicaAnonimizacao;
  marketing: TecnicaAnonimizacao;
  financeiro: TecnicaAnonimizacao;
  rh: TecnicaAnonimizacao;
  logistica: TecnicaAnonimizacao;
  assistenciaTecnica: TecnicaAnonimizacao;
  analytics: TecnicaAnonimizacao;
}

export interface LGPDCampo {
  id: number;
  lgpdId: number;
  nomeCampo: string;
  descricao: string;
  baseLegal?: string;
  matrizAnonimizacao: MatrizAnonimizacao;
  createdAt?: string;
  updatedAt?: string;
}

export interface LGPDRegistro {
  id: number;
  identificacaoDados: string;
  hierarquiaSensibilidade: HierarquiaSensibilidade;
  tipoDados: TipoDadoLGPD;
  tecnicaAnonimizacao: TecnicaAnonimizacao;
  dataInicio: string;
  dataTermino?: string;
  ativo: boolean;
  campos?: LGPDCampo[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LGPDRegistroFormData {
  identificacaoDados: string;
  hierarquiaSensibilidade: HierarquiaSensibilidade;
  tipoDados: TipoDadoLGPD;
  tecnicaAnonimizacao: TecnicaAnonimizacao;
  dataInicio: string;
  dataTermino?: string;
  campos: LGPDCampoFormData[];
}

export interface LGPDCampoFormData {
  nomeCampo: string;
  descricao: string;
  baseLegal?: string;
  matrizAnonimizacao: MatrizAnonimizacao;
}
