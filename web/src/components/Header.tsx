import { Link } from 'react-router';
import { homeFor, useAuth } from '../auth/AuthContext';
import { firstName } from '../format';
import { Logo } from './Logo';
import { ButtonLink } from './ui';

/** Cabeçalho da página pública. */
export function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
      <Link to="/" aria-label="Level Up, página inicial">
        <Logo size={30} />
      </Link>
      <nav aria-label="Seções" className="hidden gap-7 text-[15px] font-medium text-muted md:flex">
        <a href="#modalidades" className="hover:text-text">Modalidades</a>
        <a href="#planos" className="hover:text-text">Planos</a>
        <a href="#aulas" className="hover:text-text">Aulas</a>
        <a href="#app" className="hover:text-text">App</a>
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <ButtonLink to={homeFor(user.role)}>Minha área</ButtonLink>
        ) : (
          <>
            <Link to="/login" className="px-2 py-3 text-[15px] font-semibold hover:text-primary">
              Entrar
            </Link>
            <ButtonLink to="/cadastro">Criar conta</ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}

const roleLabel = { STUDENT: 'Aluno', INSTRUCTOR: 'Instrutor', ADMIN: 'Admin' } as const;

/** Cabeçalho das telas de quem está logado. */
export function AppHeader() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" aria-label="Level Up, página inicial">
          <Logo size={24} />
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">
            {firstName(user.name)}
            <span className="ml-2 rounded-full border border-border-strong px-2 py-0.5 text-xs text-subtle">
              {roleLabel[user.role]}
            </span>
          </span>
          <button
            type="button"
            className="min-h-11 px-2 font-semibold hover:text-primary"
            // Ao encerrar a sessão, o RequireRole da tela atual leva para /login.
            onClick={logout}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
