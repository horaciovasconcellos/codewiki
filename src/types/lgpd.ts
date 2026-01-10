export type TipoDadoLGPD = 
  | 'Dados Identificadores Diretos'
  | 'Dados Identificadores Indiretos'
  | 'Dados Sensíveis'
  | 'Dados Financeiros'
  | 'Dados de Localização';

export type TecnicaAnonimizacao = 
  | 'Anonimização por Supressão'
  | 'Anonimização por Generalização'
  | 'Pseudonimização (Embaralhamento Reversível)'
  | 'Anonimização por Permutação';

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
  matrizAnonimizacao: MatrizAnonimizacao;
  createdAt?: string;
  updatedAt?: string;
}

export interface LGPDRegistro {
  id: number;
  identificacaoDados: string;
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
  tipoDados: TipoDadoLGPD;
  tecnicaAnonimizacao: TecnicaAnonimizacao;
  dataInicio: string;
  dataTermino?: string;
  campos: LGPDCampoFormData[];
}

export interface LGPDCampoFormData {
  nomeCampo: string;
  descricao: string;
  matrizAnonimizacao: MatrizAnonimizacao;
}
