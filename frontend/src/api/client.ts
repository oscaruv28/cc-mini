import axios from 'axios';

const TOKEN_KEY = 'cc_token';
const USER_KEY = 'cc_user';

/** Gateway único: baseURL por entorno, Bearer automático y manejo central de 401. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      session.clear();
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Almacenamiento de sesión (token + usuario) en localStorage. */
export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (u: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/** Extrae un mensaje legible de un error de axios. */
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Error inesperado';
}
