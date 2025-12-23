/**
 * Tipos TypeScript para Integrador
 */

export type WorkItemProcess = 'Scrum' | 'Agile' | 'Basic' | 'CMMI' | 'bbtsπdev_Scrum';

export type CategoriaRepositorio = 'API' | 'BACKEND' | 'FRONTEND' | 'DATABASE' | 'DOCUMENTACAO';

export type TecnologiaRepositorio = 'JAVA' | 'PHP' | 'NODE' | 'BPMS' | 'MKDOWN' | 'GO' | 'RUST';

export interface Repositorio {
  id: string;
  produto: string;
  categoria: CategoriaRepositorio;
  tecnologia: TecnologiaRepositorio;
}

export interface ProjetoIntegrador {
  id: string;
  produto: string;
  projeto: string;
  workItemProcess: WorkItemProcess;
  teamName: string;
  dataInicial: string;
  iteracao: number;
  incluirQueries: boolean;
  incluirMaven: boolean;
  incluirLiquibase: boolean;
  sustentacao: boolean;
  repositorios: Repositorio[];
  azureProjectId?: string;
  azureProjectUrl?: string;
  teamsCreated?: string[];
  iterationsCount?: number;
  areasCount?: number;
  status: 'pendente' | 'criando' | 'sucesso' | 'erro';
  errorMessage?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
}
