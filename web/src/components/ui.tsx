import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

// Peças pequenas de interface, reutilizadas em várias telas.

const base =
  'inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-base font-bold ' +
  'transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ' +
  'motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-60';
const variants = {
  primary: 'bg-primary text-on-primary hover:bg-text',
  outline: 'border-[1.5px] border-border-strong font-semibold text-text hover:border-text',
};

type Variant = keyof typeof variants;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

/** Campo de formulário com rótulo e mensagem de erro ligados ao input. */
export function Field({
  label,
  error,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; id: string }) {
  const describedBy = error ? `${id}-erro` : hint ? `${id}-dica` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-12 rounded-xl border-[1.5px] bg-surface px-4 text-base text-text placeholder:text-subtle ${
          error ? 'border-danger' : 'border-border-strong'
        }`}
        {...props}
      />
      {error ? (
        <p id={`${id}-erro`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="text-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Aviso de erro geral de um formulário ou de uma tela. */
export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-danger px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}

/** Título de seção no estilo do design: Anton, caixa alta. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-5xl uppercase leading-none sm:text-7xl">
      {children}
    </h2>
  );
}
