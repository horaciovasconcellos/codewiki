/**
 * Tipos TypeScript para Azure DevOps
 */

export type WorkItemProcess = 'Scrum' | 'Agile' | 'Basic' | 'CMMI' | 'bbtsπdev_Scrum';

export interface AzureDevOpsProject {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: string;
  revision: number;
  visibility: string;
  lastUpdateTime: string;
}

export interface AzureDevOpsTeam {
  id: string;
  name: string;
  description?: string;
  projectName: string;
  projectId: string;
}

export interface AzureDevOpsIteration {
  id: string;
  name: string;
  path: string;
  attributes?: {
    startDate: string;
    finishDate: string;
  };
}

export interface AzureDevOpsArea {
  id: string;
  name: string;
  path: string;
}

export interface ProjetoAzure {
  id: string;
  produto: string;
  projeto: string;
  workItemProcess: string;
  teamName: string;
  dataInicial: string;
  criarTimeSustentacao: boolean;
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

export interface SetupProjectRequest {
  organization: string;
  pat: string;
  projectName: string;
  workItemProcess: string;
  teamName: string;
  startDate: string;
  criarTimeSustentacao: boolean;
  areas?: Array<{
    name: string;
    path: string | null;
  }>;
}

export interface SetupProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: AzureDevOpsProject;
    teams: AzureDevOpsTeam[];
    iterations: AzureDevOpsIteration[];
    areas: AzureDevOpsArea[];
    configurations: Array<{
      team: string;
      status: string;
    }>;
  };
}
