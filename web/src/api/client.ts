/**
 * Ponto único de conversa com a API. Todo o resto do front usa
 * api.get / api.post e nunca chama fetch direto.
 */

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
const TOKEN_KEY = 'levelup.token';
const SLOW_AFTER_MS = 4000;

/** Erro devolvido pela API (ou falha de rede), já num formato previsível. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * O token fica no localStorage: simples e sobrevive ao recarregar a página.
 * O preço é que um script malicioso na página conseguiria lê-lo; a
 * alternativa mais segura (cookie httpOnly) está descrita no README.
 */
export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

type SlowListener = ((slow: boolean) => void) | null;
type UnauthorizedListener = (() => void) | null;

let slowListener: SlowListener = null;
let unauthorizedListener: UnauthorizedListener = null;
let slowRequests = 0;

/** Avisa quando alguma chamada passa de 4 s (servidor gratuito acordando). */
export function onSlowChange(listener: SlowListener): void {
  slowListener = listener;
}

/** Avisa quando a API diz que a sessão não vale mais. */
export function onUnauthorized(listener: UnauthorizedListener): void {
  unauthorizedListener = listener;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    if (body?.error?.code) {
      return new ApiError(response.status, body.error.code, body.error.message, body.error.fields);
    }
  } catch {
    // A resposta não era JSON (por exemplo, uma página de erro do servidor).
  }
  return new ApiError(response.status, 'UNKNOWN', 'Algo deu errado. Tente novamente em instantes.');
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const headers = new Headers();
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  let becameSlow = false;
  const slowTimer = setTimeout(() => {
    becameSlow = true;
    slowRequests += 1;
    slowListener?.(true);
  }, SLOW_AFTER_MS);

  try {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        0,
        'NETWORK',
        'Não foi possível falar com o servidor. Confira sua conexão e tente de novo.',
      );
    }

    if (!response.ok) {
      const error = await parseError(response);
      if (error.code === 'UNAUTHENTICATED') {
        tokenStore.clear();
        unauthorizedListener?.();
      }
      throw error;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(slowTimer);
    if (becameSlow) {
      slowRequests -= 1;
      if (slowRequests === 0) slowListener?.(false);
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
};
