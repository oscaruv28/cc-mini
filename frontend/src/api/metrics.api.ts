import { api } from './client';
import type { Metrics } from '../types';

export const metricsApi = {
  get: (params: { from: string; to: string; agentId?: string }) =>
    api.get<Metrics>('/metrics', { params }).then((r) => r.data),
};
