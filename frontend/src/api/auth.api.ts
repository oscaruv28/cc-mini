import { api } from './client';
import type { SessionUser } from '../types';

interface LoginResponse {
  access_token: string;
  user: SessionUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
};
