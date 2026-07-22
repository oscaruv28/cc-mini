import { api } from './client';
import type { Paginated, Role, UserRow } from '../types';

export interface CreateUserBody {
  name: string;
  email: string;
  role: Role;
  password: string;
}

export const usersApi = {
  list: (params: { role?: Role; customerId?: string; page?: number; limit?: number }) =>
    api.get<Paginated<UserRow>>('/users', { params }).then((r) => r.data),
  get: (id: string) => api.get<UserRow>(`/users/${id}`).then((r) => r.data),
  create: (body: CreateUserBody) => api.post<UserRow>('/users', body).then((r) => r.data),
  update: (id: string, body: Partial<{ name: string; role: Role; password: string }>) =>
    api.patch<UserRow>(`/users/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
  setAvailability: (id: string, availabilityId: string) =>
    api.patch<UserRow>(`/users/${id}/availability`, { availabilityId }).then((r) => r.data),
};
