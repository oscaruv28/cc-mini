export type Role = 'ADMIN' | 'AGENT';
export type InteractionType = 'CALL' | 'TICKET';
export type InteractionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  documentId?: string | null;
  createdAt: string;
}

export interface AgentAvailability {
  id: string;
  code: string;
  label: string;
  canTakeCalls: boolean;
  active: boolean;
}

export interface Disposition {
  id: string;
  code: string;
  label: string;
  active: boolean;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  customer?: Customer;
  availability?: AgentAvailability | null;
  createdAt: string;
}

export interface InteractionRow {
  id: string;
  type: InteractionType;
  status: InteractionStatus;
  agentId: string;
  dispositionId: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AgentMetric {
  agentId: string;
  agentName: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  avgResolutionSeconds: number | null;
}

export interface DailyVolume {
  day: string;
  total: number;
}

export interface Metrics {
  range: { from: string; to: string; timezone: string };
  perAgent: AgentMetric[];
  dailyVolume: DailyVolume[];
}
