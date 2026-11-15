import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { homeFor, useAuth } from '../auth/AuthContext';
import { firstName } from '../format';
import { Logo } from './Logo';
import { ButtonLink } from './ui';
import { useActiveSection } from './useActiveSection';

const SECTIONS = [
  { id: 'modalidades', label: 'Modalidades' },
  { id: 'planos', label: 'Planos' },
  { id: 'aulas', label: 'Aulas' },
  { id: 'app', label: 'App' },
] as const;
const SECTION_IDS = SECTIONS.map((section) => section.id);

/** Cabeçalho da página pública: fica preso no topo e destaca a seção atual. */
export function PublicHeader() {
  const { user } = useAuth();
  const active = useActiveSection(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);

  // Depois de rolar um pouco, o cabeçalho ganha fundo translúcido e uma linha.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? 'border-border bg-bg/85 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <Link to="/" aria-label="Level Up, página inicial">
        <Logo size={30} />
      </Link>
      <nav aria-label="Seções" className="hidden gap-7 text-[15px] font-medium md:flex">
        {SECTIONS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={isActive ? 'true' : undefined}
              className={`relative py-2 transition-colors duration-200 hover:text-text ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              {label}
              {/* Traço que cresce sob o item da seção em que a pessoa está. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary transition-transform duration-300 ${
                  isActive ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </a>
          );
        })}
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
