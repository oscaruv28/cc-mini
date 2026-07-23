import { api } from './client';
import { callsApi } from './calls.api';
import { ticketsApi } from './tickets.api';
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

/**
 * Read model unificado (solo lectura): el timeline combinado de llamadas + tickets
 * lo sirve GET /interactions. Las mutaciones NO viven aquí: se despachan al módulo
 * correspondiente (`callsApi` / `ticketsApi`) según el tipo de la fila.
 */
export const interactionsApi = {
  list: (filters: InteractionFilters) =>
    api
      .get<Paginated<InteractionRow>>('/interactions', { params: filters })
      .then((r) => r.data),

  changeStatus: (type: InteractionType, id: string, status: InteractionStatus) =>
    type === 'CALL' ? callsApi.changeStatus(id, status) : ticketsApi.changeStatus(id, status),

  tipify: (type: InteractionType, id: string, dispositionId: string) =>
    type === 'CALL' ? callsApi.tipify(id, dispositionId) : ticketsApi.tipify(id, dispositionId),
};
