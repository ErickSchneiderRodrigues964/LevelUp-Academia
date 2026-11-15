import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '../components/Logo';

/** Moldura das telas de login e cadastro. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-5 py-10">
      <Link to="/" aria-label="Level Up, página inicial">
        <Logo size={28} />
      </Link>
      <main className="flex flex-col gap-6">
        <h1 className="font-display text-5xl uppercase leading-none">{title}</h1>
        {children}
      </main>
    </div>
  );
}
