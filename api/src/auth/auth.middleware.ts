import type { RequestHandler } from 'express';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';
import type { Plan, Role, User } from '../generated/prisma/client.js';
import { verifyToken } from './token.js';

// Ensina ao TypeScript que, depois do requireAuth, existe req.user.
declare global {
  namespace Express {
    interface Request {
      user?: User & { plan: Plan | null };
    }
  }
}

const unauthenticated = () =>
  new AppError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.');

/**
 * Exige um token válido no cabeçalho "Authorization: Bearer <token>" e
 * carrega o usuário do banco em req.user.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthenticated();

  const { sub } = verifyToken(token);

  // Busca no banco a cada requisição: se a conta foi apagada ou o perfil
  // mudou depois que o token foi emitido, vale o que está no banco.
  const user = await prisma.user.findUnique({ where: { id: sub }, include: { plan: true } });
  if (!user) throw unauthenticated();

  req.user = user;
  next();
};

/** Use depois do requireAuth. Barra quem não tem um dos perfis informados. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Você não tem permissão para acessar isto.');
    }
    next();
  };
}
