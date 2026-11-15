import { useEffect, useState } from 'react';
import { api, ApiError } from './client';

type State<T> = { data: T | null; error: string | null; loading: boolean };

/** Busca um recurso da API ao montar o componente e guarda o resultado. */
export function useApi<T>(path: string): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    // Se o componente sair da tela antes da resposta, ignoramos o resultado.
    let cancelled = false;
    setState({ data: null, error: null, loading: true });

    api
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'Não foi possível carregar.';
        setState({ data: null, error: message, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}
