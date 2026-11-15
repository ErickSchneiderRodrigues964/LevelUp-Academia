import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { AppError } from '../errors.js';
import type { Role } from '../generated/prisma/client.js';

export type TokenPayload = { sub: string; role: Role };

const EXPIRES_IN = '7d';
const ROLES: readonly string[] = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];

export function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: EXPIRES_IN,
  });
}

/** Devolve o conteúdo do token ou lança 401 se ele for inválido ou estiver vencido. */
export function verifyToken(token: string): TokenPayload {
  try {
    // Fixar o algoritmo impede que alguém forje um token trocando o cabeçalho.
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (
      typeof payload === 'object' &&
      typeof payload.sub === 'string' &&
      ROLES.includes(payload.role)
    ) {
      return { sub: payload.sub, role: payload.role as Role };
    }
  } catch {
    // cai no erro abaixo
  }
  throw new AppError(401, 'UNAUTHENTICATED', 'Sessão inválida ou expirada. Entre novamente.');
}
