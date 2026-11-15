import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import type { Role } from '../api/types';
import { homeFor, useAuth } from './AuthContext';

/**
 * Esconde uma tela de quem não tem o perfil certo. Isto é só conforto para o
 * usuário: a proteção de verdade está na API, que recusa a chamada mesmo que
 * alguém force a tela a aparecer.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-muted">
        Carregando sua sessão…
      </p>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return <>{children}</>;
}
