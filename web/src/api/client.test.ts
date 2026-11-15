import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, onSlowChange, onUnauthorized, tokenStore } from './client';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();

/** Espera a chamada falhar e devolve o erro, para o teste inspecionar. */
async function failure(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('A chamada deveria ter falhado.');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  onSlowChange(null);
  onUnauthorized(null);
});

describe('api client', () => {
  it('envia o token no cabeçalho Authorization', async () => {
    tokenStore.set('meu-token');
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await api.get('/auth/me');

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer meu-token');
  });

  it('não envia Authorization quando não há token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await api.get('/plans');

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('envia o corpo do POST como JSON e devolve a resposta', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { token: 't' }));

    const result = await api.post<{ token: string }>('/auth/login', { email: 'a@b.com' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/login$/);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ email: 'a@b.com' }));
    expect(result).toEqual({ token: 't' });
  });

  it('transforma erro da API em ApiError com code e fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: { code: 'VALIDATION', message: 'Dados inválidos.', fields: { email: 'E-mail inválido.' } },
      }),
    );

    const error = await failure(api.post('/auth/signup', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION',
      message: 'Dados inválidos.',
      fields: { email: 'E-mail inválido.' },
    });
  });

  it('falha de rede vira ApiError NETWORK com mensagem legível', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await failure(api.get('/plans'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('NETWORK');
    expect(error.message).not.toContain('Failed to fetch');
  });

  it('resposta de erro que não é JSON vira ApiError em vez de quebrar', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 502 }));

    const error = await failure(api.get('/plans'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
  });

  it('401 UNAUTHENTICATED apaga o token e avisa quem está ouvindo', async () => {
    tokenStore.set('token-vencido');
    const listener = vi.fn();
    onUnauthorized(listener);
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'UNAUTHENTICATED', message: 'Sessão expirada.' } }),
    );

    await api.get('/auth/me').catch(() => {});

    expect(tokenStore.get()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('401 de senha errada não desloga ninguém', async () => {
    tokenStore.set('token-bom');
    const listener = vi.fn();
    onUnauthorized(listener);
    fetchMock.mockResolvedValue(
      jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' } }),
    );

    await api.post('/auth/login', {}).catch(() => {});

    expect(tokenStore.get()).toBe('token-bom');
    expect(listener).not.toHaveBeenCalled();
  });

  it('avisa quando a resposta demora mais de 4 segundos e desfaz o aviso ao terminar', async () => {
    vi.useFakeTimers();
    const slow = vi.fn();
    onSlowChange(slow);
    let respond!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));

    const pending = api.get('/plans');
    await vi.advanceTimersByTimeAsync(3900);
    expect(slow).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(slow).toHaveBeenLastCalledWith(true);

    respond(jsonResponse(200, []));
    await pending;
    expect(slow).toHaveBeenLastCalledWith(false);
  });

  it('resposta rápida não dispara o aviso de demora', async () => {
    const slow = vi.fn();
    onSlowChange(slow);
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await api.get('/plans');

    expect(slow).not.toHaveBeenCalled();
  });
});
