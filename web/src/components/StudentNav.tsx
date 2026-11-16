import { NavLink } from 'react-router';

const LINKS = [
  { to: '/aluno', label: 'Início', end: true },
  { to: '/aluno/exercicios', label: 'Exercícios', end: false },
  { to: '/aluno/fichas', label: 'Minhas fichas', end: false },
];

/** Menu das telas do aluno. */
export function StudentNav() {
  return (
    <nav aria-label="Área do aluno" className="border-b border-border">
      <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5">
        {LINKS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
