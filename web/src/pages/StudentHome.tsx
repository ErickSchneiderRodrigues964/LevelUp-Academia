import type { ScheduleClass } from '../api/types';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/Header';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { StudentNav } from '../components/StudentNav';
import { ButtonLink, ErrorNotice } from '../components/ui';
import { daysUntil, firstName, formatDate } from '../format';

function planStatus(planExpiresAt: string | null): string {
  if (!planExpiresAt) return 'Sem data de vencimento';
  const days = daysUntil(planExpiresAt);
  if (days < 0) return `Venceu em ${formatDate(planExpiresAt)}`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias (${formatDate(planExpiresAt)})`;
}

/** Cartão de uma funcionalidade que chega numa etapa futura do projeto. */
function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-2 rounded-[20px] bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-subtle">
          Em breve
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
    </section>
  );
}

export function StudentHome() {
  const { user } = useAuth();
  const schedule = useApi<ScheduleClass[]>('/schedule');
  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <StudentNav />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <h1 className="font-display text-5xl uppercase leading-none">
          Olá, {firstName(user.name)}
        </h1>

        <section
          aria-label="Seu plano"
          className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-primary p-6 text-on-primary"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Seu plano</p>
            <p className="font-display text-4xl uppercase">{user.plan?.name ?? 'Sem plano'}</p>
          </div>
          <p className="font-semibold">{planStatus(user.planExpiresAt)}</p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <ComingSoon
            title="Próximas aulas"
            text="Aqui você vai reservar vaga nas aulas coletivas, entrar na lista de espera e cancelar."
          />
          <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-6">
            <h2 className="text-lg font-semibold">Minhas fichas</h2>
            <p className="text-sm leading-relaxed text-muted">
              Monte seu próprio treino escolhendo exercícios por região do corpo, com fotos de
              como fazer.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/aluno/exercicios">Escolher exercícios</ButtonLink>
              <ButtonLink to="/aluno/fichas" variant="outline">
                Ver minhas fichas
              </ButtonLink>
            </div>
          </section>
        </div>

        <section aria-labelledby="titulo-grade" className="flex flex-col gap-4">
          <h2 id="titulo-grade" className="text-lg font-semibold">
            Grade da semana
          </h2>
          {schedule.error && <ErrorNotice>{schedule.error}</ErrorNotice>}
          {schedule.loading && <p className="text-muted">Carregando a grade…</p>}
          {schedule.data && <ScheduleGrid classes={schedule.data} />}
        </section>
      </main>
    </div>
  );
}
