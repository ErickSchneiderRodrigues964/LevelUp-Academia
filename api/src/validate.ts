import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './errors.js';

/**
 * Valida `req.body` contra o schema. Se passar, substitui o corpo pelo
 * resultado já limpo (campos desconhecidos são descartados). Se não passar,
 * devolve 400 com uma mensagem por campo.
 */
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'body';
        fields[field] ??= issue.message;
      }
      next(new AppError(400, 'VALIDATION', 'Dados inválidos.', fields));
      return;
    }

    req.body = result.data;
    next();
  };
}
