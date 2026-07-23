import { api } from './client';
import type { InteractionRow, InteractionStatus, InteractionType, Paginated } from '../types';

export interface InteractionFilters {
  agentId?: string;
  status?: InteractionStatus;
  type?: InteractionType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const interactionsApi = {
  list: (filters: InteractionFilters) =>
    api
      .get<Paginated<InteractionRow>>('/interactions', { params: filters })
      .then((r) => r.data),

  createCall: (body: {
    agentId: string;
    direction: string;
    phoneNumber?: string;
    durationSec?: number;
    openedAt?: string;
  }) => api.post<{ id: string }>('/interactions/calls', body).then((r) => r.data),

  simulate: (agentId: string, count: number) =>
    api
      .post<{ created: number; ids: string[] }>('/interactions/calls/simulate', {
        agentId,
        count,
      })
      .then((r) => r.data),

  createTicket: (body: {
    agentId: string;
    subject: string;
    description?: string;
    priority?: string;
  }) => api.post('/interactions/tickets', body).then((r) => r.data),

  changeStatus: (type: InteractionType, id: string, status: InteractionStatus) =>
    api
      .patch(`/interactions/${type === 'CALL' ? 'calls' : 'tickets'}/${id}/status`, { status })
      .then((r) => r.data),

  tipify: (type: InteractionType, id: string, dispositionId: string) =>
    api
      .patch(`/interactions/${type === 'CALL' ? 'calls' : 'tickets'}/${id}/disposition`, {
        dispositionId,
      })
      .then((r) => r.data),
};
