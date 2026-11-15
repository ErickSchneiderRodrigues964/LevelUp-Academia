import type { ScheduleClass } from '../api/types';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
// Ordem de exibição: segunda a sábado, domingo por último.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Grade semanal: uma coluna por dia (empilhadas no celular). */
export function ScheduleGrid({ classes }: { classes: ScheduleClass[] }) {
  if (classes.length === 0) {
    return <p className="text-muted">A grade ainda não foi publicada. Volte em breve.</p>;
  }

  const hasSunday = classes.some((c) => c.weekday === 0);
  const days = DISPLAY_ORDER.filter((day) => day !== 0 || hasSunday);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {days.map((day) => {
        const dayClasses = classes
          .filter((c) => c.weekday === day)
          // "06:00" < "18:30" funciona em ordem alfabética porque o formato é fixo.
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const headingId = `dia-${day}`;

        return (
          <section
            key={day}
            aria-labelledby={headingId}
            className="rounded-2xl border border-border p-4"
          >
            <h3
              id={headingId}
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-subtle"
            >
              {WEEKDAYS[day]}
            </h3>

            {dayClasses.length === 0 ? (
              <p className="text-sm text-subtle">Sem aulas</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dayClasses.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="w-12 shrink-0 font-bold text-primary">{c.startTime}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{c.modality.name}</span>
                      <span className="block text-xs text-muted">
                        {c.instructor.name} · {c.durationMinutes} min
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
