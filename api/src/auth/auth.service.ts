import { prisma } from '../db.js';
import { AppError } from '../errors.js';
import type { Plan, Role, User } from '../generated/prisma/client.js';
import { hashPassword, verifyPassword } from './password.js';
import { signToken } from './token.js';

/** O que a API devolve sobre um usuário. Nunca inclui o hash da senha. */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: { id: string; name: string } | null;
  planExpiresAt: string | null;
};

export type AuthResult = { token: string; user: PublicUser };

export type SignupInput = { name: string; email: string; password: string; planId: string };
export type LoginInput = { email: string; password: string };

type UserWithPlan = User & { plan: Plan | null };

export function toPublicUser(user: UserWithPlan): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan ? { id: user.plan.id, name: user.plan.name } : null,
    planExpiresAt: user.planExpiresAt ? user.planExpiresAt.toISOString() : null,
  };
}

/**
 * Soma meses a uma data. Se o dia não existir no mês de destino
 * (31 de janeiro + 1 mês), usa o último dia desse mês.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

const emailTaken = () => new AppError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.');

export async function signup(input: SignupInput): Promise<AuthResult> {
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError(400, 'VALIDATION', 'Dados inválidos.', { planId: 'Plano não encontrado.' });
  }

  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw emailTaken();
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        // O perfil é fixo: quem se cadastra pelo site é sempre aluno.
        role: 'STUDENT',
        planId: plan.id,
        planExpiresAt: addMonths(new Date(), plan.durationMonths),
      },
      include: { plan: true },
    });
    return { token: signToken(user), user: toPublicUser(user) };
  } catch (err) {
    // Dois cadastros simultâneos com o mesmo e-mail: o banco barra o segundo.
    if (isUniqueViolation(err)) throw emailTaken();
    throw err;
  }
}

// Hash de uma senha qualquer, usado só para gastar o mesmo tempo quando o
// e-mail não existe. Sem isso, a resposta mais rápida revelaria quais
// e-mails estão cadastrados.
const dummyHash = hashPassword('senha-que-ninguem-usa');

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { plan: true },
  });

  const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash));

  if (!user || !passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
  }

  return { token: signToken(user), user: toPublicUser(user) };
}
