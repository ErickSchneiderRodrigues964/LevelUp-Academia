import { hashPassword } from '../src/auth/password.js';
import { prisma } from '../src/db.js';
import type { Plan, Role, User } from '../src/generated/prisma/client.js';

export const TEST_PASSWORD = 'senha-de-teste-123';

/** Apaga todos os dados, respeitando a ordem das chaves estrangeiras. */
export async function resetDb(): Promise<void> {
  await prisma.workoutItem.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.classTemplate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.modality.deleteMany();
}

let counter = 0;

export async function createPlan(overrides: Partial<Plan> = {}): Promise<Plan> {
  counter += 1;
  return prisma.plan.create({
    data: {
      name: `Plano ${counter}`,
      priceCents: 9900,
      durationMonths: 1,
      description: 'Plano de teste',
      ...overrides,
    },
  });
}

export async function createUser(
  overrides: Partial<Pick<User, 'name' | 'email' | 'role' | 'planId'>> & { role?: Role } = {},
): Promise<User> {
  counter += 1;
  return prisma.user.create({
    data: {
      name: `Usuário ${counter}`,
      email: `usuario${counter}@teste.com`,
      passwordHash: await hashPassword(TEST_PASSWORD),
      ...overrides,
    },
  });
}
