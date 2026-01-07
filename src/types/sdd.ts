export type IAType = 
  | 'claude'
  | 'gemini'
  | 'copilot'
  | 'cursor-agent'
  | 'qwen'
  | 'opencode'
  | 'codex'
  | 'windsurf'
  | 'kilocode'
  | 'auggie'
  | 'roo'
  | 'codebuddy'
  | 'amp'
  | 'shai'
  | 'q'
  | 'bobouqoder';

export type StatusRequisito =
  | 'BACKLOG'
  | 'REFINAMENTO'
  | 'PRONTO P/DEV'
  | 'DONE'
  | 'BLOQUEADO'
  | 'EM RETRABALHO'
  | 'SPIKE TÉCNICO'
  | 'PAUSADO'
  | 'CANCELADO'
  | 'ROLLBACK';

export type StatusTarefa = 'TO DO' | 'IN PROGRESS' | 'DONE';

export type StatusADR = 'Proposta' | 'Aceita' | 'Supersedida' | 'Depreciada';

export interface ProjetoSDD {
  id: string;
  aplicacao_id?: string;
  aplicacao_nome?: string;
  aplicacao_sigla?: string;
  nome_projeto: string;
  ia_selecionada: IAType;
  constituicao?: string;
  gerador_projetos: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequisitoSDD {
  id: string;
  projeto_id: string;
  sequencia: string;
  nome: string;
  descricao?: string;
  status: StatusRequisito;
  status_anterior?: StatusRequisito;
  created_at: string;
  updated_at: string;
  tarefas_count?: number;
  tarefas_done_count?: number;
}

export interface TarefaSDD {
  id: string;
  requisito_id: string;
  requisito_sequencia?: string;
  descricao: string;
  data_inicio: string;
  data_termino?: string;
  status: StatusTarefa;
  dias_decorridos?: number;
  created_at: string;
  updated_at: string;
}

export interface DecisaoArquiteturalSDD {
  id: string;
  projeto_id: string;
  adr_id: string;
  adr_titulo?: string;
  data_inicio: string;
  data_termino?: string;
  status: StatusADR;
  created_at: string;
  updated_at: string;
}
