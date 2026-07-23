import { api } from './client';
import type { InteractionStatus, Paginated, InteractionRow, TicketDetail } from '../types';

export interface TicketFilters {
  agentId?: string;
  status?: InteractionStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Servicio del módulo Tickets. */
export const ticketsApi = {
  list: (filters: TicketFilters) =>
    api.get<Paginated<InteractionRow>>('/tickets', { params: filters }).then((r) => r.data),

  get: (id: string) => api.get<TicketDetail>(`/tickets/${id}`).then((r) => r.data),

  create: (body: {
    agentId: string;
    subject: string;
    description?: string;
    priority?: string;
    callId?: string;
  }) => api.post('/tickets', body).then((r) => r.data),

  changeStatus: (id: string, status: InteractionStatus) =>
    api.patch(`/tickets/${id}/status`, { status }).then((r) => r.data),

  tipify: (id: string, dispositionId: string) =>
    api.patch(`/tickets/${id}/disposition`, { dispositionId }).then((r) => r.data),
};
