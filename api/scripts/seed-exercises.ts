/**
 * Grava só o catálogo de exercícios no banco apontado por DATABASE_URL.
 * Não mexe em usuários, planos nem aulas. Pode rodar quantas vezes quiser.
 */
import { seedExercises } from '../src/catalog/seed-exercises.js';
import { prisma } from '../src/db.js';

try {
  const count = await seedExercises();
  console.log(`${count} exercícios gravados.`);
} finally {
  await prisma.$disconnect();
}
