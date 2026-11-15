import type { Modality, Plan, ScheduleClass } from '../api/types';
import { useApi } from '../api/useApi';
import { BRAND } from '../brand';
import { PublicHeader } from '../components/Header';
import { Logo } from '../components/Logo';
import { PlanCard } from '../components/PlanCard';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { ButtonLink, ErrorNotice, SectionTitle } from '../components/ui';

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Painel do topo: as aulas do próximo dia que tem aula, a partir de hoje. */
function NextClasses({ classes }: { classes: ScheduleClass[] }) {
  const today = new Date().getDay();
  // Procura hoje, depois amanhã, e assim por diante, até achar um dia com aula.
  const offset = [0, 1, 2, 3, 4, 5, 6].find((d) =>
    classes.some((c) => c.weekday === (today + d) % 7),
  );
  if (offset === undefined) return null;

  const day = (today + offset) % 7;
  const label = offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : WEEKDAYS[day];
  const dayClasses = classes
    .filter((c) => c.weekday === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <aside
      aria-label={`Aulas de ${label.toLowerCase()}`}
      className="flex min-w-0 flex-1 basis-[380px] flex-col gap-3 rounded-3xl bg-surface p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-subtle">
        {label} na Level Up
      </p>
      <ul className="flex flex-col gap-3">
        {dayClasses.map((c) => (
          <li key={c.id} className="flex items-center gap-4 rounded-2xl bg-bg p-4">
            <span className="font-display text-2xl text-primary">{c.startTime}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{c.modality.name}</span>
              <span className="block text-sm text-muted">com {c.instructor.name}</span>
            </span>
            <span className="text-sm text-subtle">{c.capacity} vagas</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function Home() {
  const plans = useApi<Plan[]>('/plans');
  const modalities = useApi<Modality[]>('/modalities');
  const schedule = useApi<ScheduleClass[]>('/schedule');

  const loadError = plans.error ?? modalities.error ?? schedule.error;
  // Do contrato mais curto ao mais longo; o do meio ganha o destaque.
  const sortedPlans = [...(plans.data ?? [])].sort((a, b) => a.durationMonths - b.durationMonths);
  const featuredId = sortedPlans[Math.floor((sortedPlans.length - 1) / 2)]?.id;

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main>
        <section className="mx-auto flex max-w-[1320px] flex-wrap items-end gap-12 px-5 pb-20 pt-10 sm:px-8">
          <div className="min-w-0 flex-1 basis-[520px]">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[3px] text-primary">
              {BRAND.eyebrow}
            </p>
            <h1 className="font-display text-6xl uppercase leading-none sm:text-8xl xl:text-[128px]">
              Cada treino
              <br />é uma fase.
              <br />
              <span className="text-primary">Suba de nível.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {BRAND.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#planos"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-8 py-4 text-lg font-bold text-on-primary hover:bg-text"
              >
                Ver planos
              </a>
              <a
                href="#modalidades"
                className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-border-strong px-8 py-4 text-lg font-semibold hover:border-text"
              >
                Conhecer a estrutura
              </a>
            </div>
          </div>
          {schedule.data && <NextClasses classes={schedule.data} />}
        </section>

        {modalities.data && modalities.data.length > 0 && (
          <div className="overflow-hidden bg-primary px-5 py-5 text-on-primary sm:px-8" aria-hidden="true">
            <p className="whitespace-nowrap font-display text-3xl uppercase tracking-wide">
              {[...modalities.data, ...modalities.data].map((m) => m.name).join('  ✕  ')}
            </p>
          </div>
        )}

        {loadError && (
          <div className="mx-auto max-w-[1320px] px-5 pt-10 sm:px-8">
            <ErrorNotice>{loadError}</ErrorNotice>
          </div>
        )}

        <section
          aria-labelledby="titulo-modalidades"
          id="modalidades"
          className="mx-auto max-w-[1320px] scroll-mt-6 px-5 pb-20 pt-28 sm:px-8"
        >
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <SectionTitle id="titulo-modalidades">
              Escolha
              <br />
              sua batalha
            </SectionTitle>
            <p className="max-w-md text-[17px] leading-relaxed text-muted">
              Monte a rotina que cabe na sua semana e troque quando quiser.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modalities.data?.map((modality, index) => (
              <article key={modality.id} className="flex flex-col gap-3 rounded-[20px] bg-surface p-6">
                <span className="text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-3xl uppercase">{modality.name}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{modality.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="titulo-planos"
          id="planos"
          className="mx-auto max-w-[1320px] scroll-mt-6 px-5 py-20 sm:px-8"
        >
          <div className="mb-12">
            <SectionTitle id="titulo-planos">Planos</SectionTitle>
          </div>
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {sortedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured={plan.id === featuredId} />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="titulo-aulas"
          id="aulas"
          className="mx-auto max-w-[1320px] scroll-mt-6 px-5 py-20 sm:px-8"
        >
          <div className="mb-8">
            <SectionTitle id="titulo-aulas">Grade de aulas</SectionTitle>
          </div>
          {schedule.loading ? (
            <p className="text-muted">Carregando a grade…</p>
          ) : (
            schedule.data && <ScheduleGrid classes={schedule.data} />
          )}
        </section>

        <section
          aria-labelledby="titulo-app"
          id="app"
          className="mx-auto max-w-[1320px] scroll-mt-6 px-5 py-20 sm:px-8"
        >
          <div className="flex flex-wrap items-center gap-12 rounded-[32px] bg-surface p-8 sm:p-14">
            <div className="min-w-0 flex-1 basis-[420px]">
              <h2 id="titulo-app" className="font-display text-5xl uppercase leading-none sm:text-6xl">
                Seu treino
                <br />
                no bolso
              </h2>
              <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
                Ficha atualizada pelo professor, reserva de aulas coletivas e evolução de carga
                semana a semana, direto no navegador do celular.
              </p>
            </div>
            <dl className="flex min-w-0 flex-1 basis-[280px] flex-col gap-3">
              {[
                ['Treino de hoje', 'Costas + Bíceps', false],
                ['Próxima aula', 'Cross training, 18:30', false],
                ['Terra', '+10 kg no mês', true],
              ].map(([label, value, highlight]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-bg p-5"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className={`font-bold ${highlight ? 'text-primary' : ''}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-5 py-28 text-center sm:px-8">
          <h2 className="font-display text-6xl uppercase leading-none sm:text-8xl xl:text-[120px]">
            Sua próxima fase
            <br />
            <span className="text-primary">começa hoje.</span>
          </h2>
          <ButtonLink to="/cadastro" className="mt-12 px-10 py-5 text-lg">
            Criar minha conta
          </ButtonLink>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-5 py-10 text-sm text-subtle sm:px-8">
          <Logo size={22} />
          <span>Rua das Fases, 100 · Seg a sex 5h30 às 23h · Sáb 8h às 14h</span>
          <span>Projeto de portfólio. Academia, preços e pessoas são fictícios.</span>
        </div>
      </footer>
    </div>
  );
}
