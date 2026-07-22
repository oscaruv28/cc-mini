import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SessionUser } from '../types';
import { authApi } from '../api/auth.api';
import { session } from '../api/client';

interface AuthContextValue {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => session.getUser());

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    session.setToken(res.access_token);
    session.setUser(res.user);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    session.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
