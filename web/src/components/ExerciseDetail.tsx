import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Exercise, Workout } from '../api/types';
import { messageOf } from '../api/useWorkouts';
import { ExerciseAnimation } from './ExerciseAnimation';
import { Button, ErrorNotice } from './ui';

/** Campo numérico com rótulo (séries, repetições). */
export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex w-24 flex-col gap-1 text-sm font-semibold">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-h-11 rounded-xl border-[1.5px] border-border-strong bg-surface px-3 font-normal"
      />
    </label>
  );
}

/** Janela com o detalhe do exercício e o formulário "adicionar à ficha". */
export function ExerciseDetail({
  exercise,
  workouts,
  workoutsError,
  onClose,
  onChanged,
}: {
  exercise: Exercise;
  workouts: Workout[] | null;
  workoutsError: string | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [workoutId, setWorkoutId] = useState('');
  const [newName, setNewName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // Esc fecha; o foco vai para o botão de fechar ao abrir.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // A primeira ficha da lista vem selecionada.
  const selected = workoutId || workouts?.[0]?.id || '';
  const creating = workouts !== null && workouts.length === 0;

  async function add(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(null);
    setBusy(true);
    try {
      let target = selected;
      let targetName = workouts?.find((w) => w.id === selected)?.name ?? '';
      if (creating) {
        const created = await api.post<Workout>('/workouts', { name: newName });
        target = created.id;
        targetName = created.name;
      }
      await api.post(`/workouts/${target}/items`, { exerciseId: exercise.id, sets, reps });
      await onChanged();
      setWorkoutId(target);
      setDone(`Adicionado à ficha "${targetName}".`);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercicio-titulo"
        onClick={(event) => event.stopPropagation()}
        className="page-enter max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-surface p-6 sm:rounded-3xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="exercicio-titulo" className="font-display text-4xl uppercase leading-none">
            {exercise.name}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-11 min-w-11 rounded-full border border-border-strong text-lg hover:border-text"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {exercise.videoUrl ? (
              <video
                src={exercise.videoUrl}
                poster={exercise.images[0]}
                controls
                loop
                muted
                playsInline
                aria-label={`Vídeo: ${exercise.name}`}
                className="aspect-[4/3] w-full rounded-2xl bg-black object-contain"
              />
            ) : (
              <ExerciseAnimation images={exercise.images} alt={exercise.name} controls />
            )}
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ['Músculo', exercise.primaryMuscle],
                  ['Equipamento', exercise.equipment],
                  ['Nível', exercise.level],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-bg p-3">
                  <dt className="text-xs text-subtle">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-4">
            <p className="leading-relaxed text-muted">{exercise.description}</p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
              {exercise.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <form onSubmit={add} className="mt-6 flex flex-col gap-4 rounded-2xl bg-bg p-5">
          <h3 className="font-semibold">Adicionar à minha ficha</h3>

          {workoutsError ? (
            <ErrorNotice>{workoutsError}</ErrorNotice>
          ) : workouts === null ? (
            <p className="text-sm text-muted">Carregando suas fichas…</p>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              {creating ? (
                <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold">
                  Nome da sua primeira ficha
                  <input
                    required
                    maxLength={40}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Treino A"
                    className="min-h-11 rounded-xl border-[1.5px] border-border-strong bg-surface px-3 font-normal"
                  />
                </label>
              ) : (
                <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold">
                  Ficha
                  <select
                    value={selected}
                    onChange={(e) => setWorkoutId(e.target.value)}
                    className="min-h-11 rounded-xl border-[1.5px] border-border-strong bg-surface px-3 font-normal"
                  >
                    {workouts.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <NumberField label="Séries" value={sets} min={1} max={10} onChange={setSets} />
              <NumberField label="Repetições" value={reps} min={1} max={100} onChange={setReps} />
              <Button type="submit" disabled={busy}>
                {busy ? 'Adicionando…' : 'Adicionar'}
              </Button>
            </div>
          )}

          {error && <ErrorNotice>{error}</ErrorNotice>}
          {done && (
            <p role="status" className="text-sm font-semibold text-primary">
              {done}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
