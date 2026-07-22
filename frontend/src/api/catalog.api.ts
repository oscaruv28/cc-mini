import { api } from './client';
import type { AgentAvailability, Customer, Disposition, Role } from '../types';

export const catalogApi = {
  roles: () => api.get<Role[]>('/roles').then((r) => r.data),
  customers: () => api.get<Customer[]>('/customers').then((r) => r.data),
  dispositions: () => api.get<Disposition[]>('/dispositions').then((r) => r.data),
  availabilities: () =>
    api.get<AgentAvailability[]>('/agent-availabilities').then((r) => r.data),
};
