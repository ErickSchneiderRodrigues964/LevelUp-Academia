import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import type { Workout, WorkoutItem } from '../api/types';
import { messageOf, useWorkouts } from '../api/useWorkouts';
import { NumberField } from '../components/ExerciseDetail';
import { AppHeader } from '../components/Header';
import { StudentNav } from '../components/StudentNav';
import { Button, ButtonLink, ErrorNotice } from '../components/ui';

type Run = (action: () => Promise<unknown>) => Promise<void>;

/** Uma linha da ficha: foto, nome, séries x repetições e ações. */
function ItemRow({
  workout,
  item,
  index,
  run,
}: {
  workout: Workout;
  item: WorkoutItem;
  index: number;
  run: Run;
}) {
  const [sets, setSets] = useState(item.sets);
  const [reps, setReps] = useState(item.reps);
  const changed = sets !== item.sets || reps !== item.reps;
  const base = `/workouts/${workout.id}/items/${item.id}`;

  function move(delta: -1 | 1) {
    const ids = workout.items.map((i) => i.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    return run(() => api.put(`/workouts/${workout.id}/order`, { itemIds: ids }));
  }

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-2xl bg-bg p-3">
      <img
        src={item.exercise.images[0]}
        alt=""
        className="h-16 w-20 rounded-xl bg-white object-contain"
      />
      <div className="min-w-40 flex-1">
        <p className="font-semibold">{item.exercise.name}</p>
        <p className="text-sm text-muted">{item.exercise.primaryMuscle}</p>
      </div>
      <NumberField label="Séries" value={sets} min={1} max={10} onChange={setSets} />
      <NumberField label="Reps" value={reps} min={1} max={100} onChange={setReps} />
      <div className="flex flex-wrap gap-2">
        {changed && (
          <Button onClick={() => run(() => api.patch(base, { sets, reps }))}>Salvar</Button>
        )}
        <Button
          variant="outline"
          aria-label={`Subir ${item.exercise.name}`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          ↑
        </Button>
        <Button
          variant="outline"
          aria-label={`Descer ${item.exercise.name}`}
          disabled={index === workout.items.length - 1}
          onClick={() => move(1)}
        >
          ↓
        </Button>
        <Button
          variant="outline"
          aria-label={`Remover ${item.exercise.name}`}
          onClick={() => run(() => api.delete(base))}
        >
          Remover
        </Button>
      </div>
    </li>
  );
}

function WorkoutCard({ workout, run }: { workout: Workout; run: Run }) {
  const [name, setName] = useState(workout.name);
  const [confirming, setConfirming] = useState(false);
  const renamed = name.trim() !== '' && name.trim() !== workout.name;

  return (
    <section
      aria-label={`Ficha ${workout.name}`}
      className="flex flex-col gap-4 rounded-[20px] bg-surface p-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold">
          Nome da ficha
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 rounded-xl border-[1.5px] border-border-strong bg-bg px-3 font-display text-2xl font-normal uppercase"
          />
        </label>
        {renamed && (
          <Button onClick={() => run(() => api.patch(`/workouts/${workout.id}`, { name }))}>
            Renomear
          </Button>
        )}
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Apagar esta ficha?</span>
            <Button onClick={() => run(() => api.delete(`/workouts/${workout.id}`))}>
              Sim, apagar
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Não
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Apagar ficha
          </Button>
        )}
      </div>

      {workout.items.length === 0 ? (
        <p className="text-sm text-muted">
          Ficha vazia. Abra a aba Exercícios e adicione o primeiro.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {workout.items.map((item, index) => (
            <ItemRow
              key={`${item.id}-${item.sets}-${item.reps}`}
              workout={workout}
              item={item}
              index={index}
              run={run}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

/** Todas as fichas do aluno: editar séries, ordem, nome, apagar. */
export function Workouts() {
  const { workouts, error, reload } = useWorkouts();
  const [actionError, setActionError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Toda alteração passa por aqui: executa, recarrega e mostra o erro, se houver.
  const run: Run = async (action) => {
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(messageOf(err));
    }
  };

  async function create(event: FormEvent) {
    event.preventDefault();
    await run(() => api.post('/workouts', { name: newName }));
    setNewName('');
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <StudentNav />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
        <h1 className="font-display text-5xl uppercase leading-none">Minhas fichas</h1>
        <p className="max-w-xl text-muted">
          Monte o treino dos dias em que você não segue a ficha da academia.
        </p>

        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-48 flex-col gap-1 text-sm font-semibold">
            Nova ficha
            <input
              required
              maxLength={40}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Treino B"
              className="min-h-11 rounded-xl border-[1.5px] border-border-strong bg-surface px-3 font-normal"
            />
          </label>
          <Button type="submit">Criar ficha</Button>
          <ButtonLink to="/aluno/exercicios" variant="outline">
            Escolher exercícios
          </ButtonLink>
        </form>

        {(error ?? actionError) && <ErrorNotice>{error ?? actionError}</ErrorNotice>}
        {workouts === null && !error && <p className="text-muted">Carregando suas fichas…</p>}
        {workouts?.length === 0 && (
          <p className="text-muted">Você ainda não tem nenhuma ficha. Crie a primeira acima.</p>
        )}

        {workouts?.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} run={run} />
        ))}
      </main>
    </div>
  );
}
