import { useState } from 'react';
import type { Exercise, MuscleGroup } from '../api/types';
import { useApi } from '../api/useApi';
import { useWorkouts } from '../api/useWorkouts';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { AppHeader } from '../components/Header';
import { StudentNav } from '../components/StudentNav';
import { ErrorNotice } from '../components/ui';

/** Escolha a região do corpo, veja os exercícios e adicione à sua ficha. */
export function Exercises() {
  const groups = useApi<MuscleGroup[]>('/muscle-groups');
  const [group, setGroup] = useState('peito');
  const exercises = useApi<Exercise[]>(`/exercises?group=${group}`);
  const { workouts, error: workoutsError, reload } = useWorkouts();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = exercises.data?.find((e) => e.slug === openSlug) ?? null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <StudentNav />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
        <h1 className="font-display text-5xl uppercase leading-none">Exercícios</h1>
        <p className="max-w-xl text-muted">
          Escolha a região do corpo e abra um exercício para ver como se faz. Depois é só
          adicionar à sua ficha.
        </p>

        <div role="group" aria-label="Região do corpo" className="flex flex-wrap gap-2">
          {groups.data?.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={g.id === group}
              onClick={() => setGroup(g.id)}
              className={`min-h-11 rounded-full px-5 text-sm font-bold transition duration-200 active:scale-[0.97] ${
                g.id === group
                  ? 'bg-primary text-on-primary'
                  : 'border-[1.5px] border-border-strong text-text hover:border-text'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {(groups.error ?? exercises.error) && (
          <ErrorNotice>{groups.error ?? exercises.error}</ErrorNotice>
        )}
        {exercises.loading && <p className="text-muted">Carregando exercícios…</p>}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.data?.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => setOpenSlug(exercise.slug)}
                className="card-hover flex h-full w-full flex-col gap-3 rounded-[20px] border-[1.5px] border-transparent bg-surface p-3 text-left hover:border-primary"
              >
                <ExerciseAnimation images={exercise.images} alt={exercise.name} />
                <span className="px-2 pb-2">
                  <span className="block font-semibold">{exercise.name}</span>
                  <span className="block text-sm text-muted">
                    {exercise.equipment} · {exercise.primaryMuscle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>

      {open && (
        <ExerciseDetail
          exercise={open}
          workouts={workouts}
          workoutsError={workoutsError}
          onClose={() => setOpenSlug(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
