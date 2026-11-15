import type { ScheduleClass } from '../api/types';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { AppHeader } from '../components/Header';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { ErrorNotice } from '../components/ui';
import { firstName } from '../format';

export function InstructorHome() {
  const { user } = useAuth();
  const schedule = useApi<ScheduleClass[]>('/schedule');
  if (!user) return null;

  const myClasses = schedule.data?.filter((c) => c.instructor.id === user.id);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <h1 className="font-display text-5xl uppercase leading-none">
          Olá, {firstName(user.name)}
        </h1>

        <section aria-labelledby="titulo-aulas" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-aulas" className="text-lg font-semibold">
              Suas aulas na semana
            </h2>
            {myClasses && (
              <p className="text-sm text-muted">
                {myClasses.length === 1 ? '1 aula' : `${myClasses.length} aulas`}
              </p>
            )}
          </div>
          {schedule.error && <ErrorNotice>{schedule.error}</ErrorNotice>}
          {schedule.loading && <p className="text-muted">Carregando suas aulas…</p>}
          {myClasses &&
            (myClasses.length > 0 ? (
              <ScheduleGrid classes={myClasses} />
            ) : (
              <p className="text-muted">Você ainda não tem aulas na grade.</p>
            ))}
        </section>

        <section className="rounded-[20px] bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Fichas de treino e inscritos</h2>
            <span className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-subtle">
              Em breve
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Aqui você vai montar a ficha de cada aluno e ver quem está inscrito nas suas aulas.
          </p>
        </section>
      </main>
    </div>
  );
}
