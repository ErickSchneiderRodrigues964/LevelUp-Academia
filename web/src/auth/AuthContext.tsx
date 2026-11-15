import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, onUnauthorized, tokenStore } from '../api/client';
import type { AuthResult, Role, User } from '../api/types';

export type SignupData = { name: string; email: string; password: string; planId: string };

export type AuthState = {
  user: User | null;
  /** true enquanto ainda não sabemos se há uma sessão salva válida. */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  loginDemo: (role: Role) => Promise<User>;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

/** Tela inicial de cada perfil. */
export function homeFor(role: Role): string {
  return { STUDENT: '/aluno', INSTRUCTOR: '/instrutor', ADMIN: '/admin' }[role];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => tokenStore.get() !== null);

  // Ao abrir o site: se há um token salvo, pergunta à API de quem ele é.
  useEffect(() => {
    onUnauthorized(() => setUser(null));

    let cancelled = false;
    if (tokenStore.get()) {
      api
        .get<User>('/auth/me')
        .then((me) => {
          if (!cancelled) setUser(me);
        })
        .catch(() => {
          // Token inválido já foi apagado pelo client; segue como visitante.
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
      onUnauthorized(null);
    };
  }, []);

  const value = useMemo<AuthState>(() => {
    const startSession = (result: AuthResult): User => {
      tokenStore.set(result.token);
      setUser(result.user);
      return result.user;
    };

    return {
      user,
      loading,
      login: async (email, password) =>
        startSession(await api.post<AuthResult>('/auth/login', { email, password })),
      signup: async (data) => startSession(await api.post<AuthResult>('/auth/signup', data)),
      loginDemo: async (role) => startSession(await api.post<AuthResult>('/auth/demo', { role })),
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
