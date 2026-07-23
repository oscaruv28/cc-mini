import { api } from './client';
import type { InteractionStatus, Paginated, InteractionRow } from '../types';

export interface CallFilters {
  agentId?: string;
  status?: InteractionStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Servicio del módulo Calls (llamadas). */
export const callsApi = {
  list: (filters: CallFilters) =>
    api.get<Paginated<InteractionRow>>('/calls', { params: filters }).then((r) => r.data),

  get: (id: string) => api.get(`/calls/${id}`).then((r) => r.data),

  create: (body: {
    agentId: string;
    direction: string;
    phoneNumber?: string;
    durationSec?: number;
    openedAt?: string;
  }) => api.post<{ id: string }>('/calls', body).then((r) => r.data),

  simulate: (agentId: string, count: number) =>
    api
      .post<{ created: number; ids: string[] }>('/calls/simulate', { agentId, count })
      .then((r) => r.data),

  changeStatus: (id: string, status: InteractionStatus) =>
    api.patch(`/calls/${id}/status`, { status }).then((r) => r.data),

  tipify: (id: string, dispositionId: string) =>
    api.patch(`/calls/${id}/disposition`, { dispositionId }).then((r) => r.data),
};
