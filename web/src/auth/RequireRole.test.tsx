import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { User } from '../api/types';
import { AuthContext, type AuthState } from './AuthContext';
import { RequireRole } from './RequireRole';

const student: User = {
  id: '1',
  name: 'Ana',
  email: 'ana@mail.com',
  role: 'STUDENT',
  plan: null,
  planExpiresAt: null,
};

function renderAt(path: string, auth: Partial<AuthState>) {
  const value = { user: null, loading: false, ...auth } as AuthState;
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>tela de login</p>} />
          <Route path="/aluno" element={<p>área do aluno</p>} />
          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN']}>
                <p>painel do admin</p>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireRole', () => {
  it('manda visitante para /login', () => {
    renderAt('/admin', { user: null });

    expect(screen.getByText('tela de login')).toBeInTheDocument();
    expect(screen.queryByText('painel do admin')).not.toBeInTheDocument();
  });

  it('manda aluno que abre /admin para /aluno', () => {
    renderAt('/admin', { user: student });

    expect(screen.getByText('área do aluno')).toBeInTheDocument();
    expect(screen.queryByText('painel do admin')).not.toBeInTheDocument();
  });

  it('mostra o conteúdo para quem tem o perfil certo', () => {
    renderAt('/admin', { user: { ...student, role: 'ADMIN' } });

    expect(screen.getByText('painel do admin')).toBeInTheDocument();
  });

  it('enquanto a sessão carrega, não redireciona nem mostra o conteúdo', () => {
    renderAt('/admin', { user: null, loading: true });

    expect(screen.queryByText('tela de login')).not.toBeInTheDocument();
    expect(screen.queryByText('painel do admin')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
