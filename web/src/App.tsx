import { BRAND } from './brand';
import { Logo } from './components/Logo';

/** Tela provisória: só confirma que a identidade visual está aplicada. */
export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <Logo size={36} />
      <p className="text-sm font-semibold uppercase tracking-[3px] text-primary">
        {BRAND.eyebrow}
      </p>
      <h1 className="font-display text-6xl uppercase leading-none sm:text-8xl">
        Cada treino
        <br />é uma fase.
        <br />
        <span className="text-primary">Suba de nível.</span>
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted">{BRAND.description}</p>
      <p className="text-sm text-subtle">Site em construção.</p>
    </main>
  );
}
