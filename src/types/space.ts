// Tipos para Dashboard SPACE (Satisfaction, Performance, Activity, Communication, Efficiency)

export interface SpaceDashboardData {
  satisfaction: SatisfactionMetrics;
  performance: PerformanceMetrics;
  activity: ActivityMetrics;
  communication: CommunicationMetrics;
  efficiency: EfficiencyMetrics;
  period: {
    startDate: string;
    endDate: string;
    sprint?: string;
  };
}

// S - Satisfaction & Well-Being
export interface SatisfactionMetrics {
  enps: number; // -100 a 100
  enpsTrend: Array<{ date: string; score: number }>;
  teamMood?: 'positive' | 'neutral' | 'negative';
  comments?: string[];
  lastUpdate: string;
}

// P - Performance
export interface PerformanceMetrics {
  workItemsPlanned: number;
  workItemsDelivered: number;
  deliveryRate: number; // percentual
  criticalBugs: number;
  criticalBugsReopened: number;
  releaseSuccessRate: number; // percentual
  releases: Array<{
    name: string;
    date: string;
    success: boolean;
  }>;
}

// A - Activity
export interface ActivityMetrics {
  pullRequestsCreated: number;
  pullRequestsMerged: number;
  commits: number;
  workItemsMovements: number;
  prTrend: Array<{ date: string; created: number; merged: number }>;
  commitTrend: Array<{ date: string; count: number }>;
}

// C - Communication & Collaboration
export interface CommunicationMetrics {
  avgPrReviewTime: number; // horas
  avgReviewersPerPr: number;
  prsWithComments: number;
  totalPrs: number;
  blockedItems: number;
  blockedItemsList: Array<{
    id: string;
    title: string;
    blockedDays: number;
    reason?: string;
  }>;
}

// E - Efficiency & Flow
export interface EfficiencyMetrics {
  leadTime: number; // dias
  cycleTime: number; // dias
  wipByState: Record<string, number>;
  agingItems: Array<{
    id: string;
    title: string;
    state: string;
    age: number; // dias
  }>;
  cumulativeFlow: Array<{
    date: string;
    todo: number;
    doing: number;
    done: number;
  }>;
}

export interface SpaceFilter {
  teamId?: string;
  projectName?: string;
  startDate: string;
  endDate: string;
  sprint?: string;
}
