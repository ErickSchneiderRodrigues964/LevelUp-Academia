import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './client';
import type { Workout } from './types';

/** As fichas do aluno logado, com função para recarregar depois de uma alteração. */
export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setWorkouts(await api.get<Workout[]>('/workouts'));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as fichas.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { workouts, error, reload };
}

/** Texto de erro amigável para mostrar ao aluno. */
export function messageOf(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Algo deu errado. Tente novamente.';
}
