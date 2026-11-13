import type { ErrorRequestHandler, RequestHandler } from 'express';

/**
 * Erro previsto pela aplicação (e-mail repetido, sem permissão, etc.).
 * Qualquer outro erro é tratado como inesperado e vira um 500 genérico.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Rota não encontrada.'));
};

function isMalformedJson(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: string }).type === 'entity.parse.failed'
  );
}

// O Express só reconhece um middleware de erro se ele declarar os 4 parâmetros.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields && { fields: err.fields }),
      },
    });
    return;
  }

  if (isMalformedJson(err)) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'O corpo da requisição não é um JSON válido.' },
    });
    return;
  }

  // O detalhe fica só no log do servidor; o cliente recebe uma mensagem genérica.
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erro interno. Tente novamente em instantes.' },
  });
};
