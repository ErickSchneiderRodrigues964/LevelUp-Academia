import { prisma } from '../db.js';
import { EXERCISES } from './exercises.js';

/** Grava o catálogo no banco. Pode rodar várias vezes: atualiza o que já existe. */
export async function seedExercises(): Promise<number> {
  for (const e of EXERCISES) {
    const data = {
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment,
      level: e.level,
      primaryMuscle: e.primaryMuscle,
      description: e.description,
      steps: e.steps,
      images: [`/exercicios/${e.slug}/0.jpg`, `/exercicios/${e.slug}/1.jpg`],
    };
    await prisma.exercise.upsert({
      where: { slug: e.slug },
      update: data,
      create: { slug: e.slug, ...data },
    });
  }
  return EXERCISES.length;
}
