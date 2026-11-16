import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware.js';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';
import { validate } from '../validate.js';

/**
 * Fichas de treino do aluno.
 *
 * Regra central: cada usuário só enxerga e altera as PRÓPRIAS fichas.
 * Ficha de outra pessoa responde 404, como se não existisse (com 403 o
 * sistema confirmaria que aquele id existe).
 */
export const workoutRoutes = Router();

// Tudo daqui para baixo exige login; depois disto, req.user existe.
workoutRoutes.use(requireAuth);

// ---------- Validação dos dados que chegam ----------

const nameSchema = z.object({
  name: z
    .string('Informe o nome da ficha.')
    .trim()
    .min(1, 'Informe o nome da ficha.')
    .max(40, 'O nome pode ter no máximo 40 caracteres.'),
});

// z.number() já recusa texto ("3"); .int() recusa número quebrado (2.5).
const sets = z
  .number('Informe as séries.')
  .int('As séries devem ser um número inteiro.')
  .min(1, 'Mínimo de 1 série.')
  .max(10, 'Máximo de 10 séries.');
const reps = z
  .number('Informe as repetições.')
  .int('As repetições devem ser um número inteiro.')
  .min(1, 'Mínimo de 1 repetição.')
  .max(100, 'Máximo de 100 repetições.');

const addItemSchema = z.object({
  exerciseId: z.string('Escolha um exercício.').min(1, 'Escolha um exercício.'),
  sets,
  reps,
});

// No PATCH os campos são opcionais, mas é preciso mandar pelo menos um.
const editItemSchema = z
  .object({ sets: sets.optional(), reps: reps.optional() })
  .refine((v) => v.sets !== undefined || v.reps !== undefined, 'Informe séries ou repetições.');

const orderSchema = z.object({
  itemIds: z.array(z.string(), 'Informe a nova ordem.'),
});

// ---------- Peças reutilizadas ----------

/** Ficha com os exercícios em ordem, no formato que a tela usa. */
const withItems = {
  items: { include: { exercise: true }, orderBy: { position: 'asc' as const } },
};

/**
 * Busca a ficha pelo id E pelo dono. É aqui que mora a regra central:
 * nunca se busca só por id. Se não for do usuário, o resultado é o mesmo
 * de uma ficha que não existe: 404.
 */
async function findOwnWorkout(id: string, userId: string) {
  const workout = await prisma.workout.findFirst({ where: { id, userId } });
  if (!workout) throw new AppError(404, 'NOT_FOUND', 'Ficha não encontrada.');
  return workout;
}

/** Confere que o item pertence mesmo àquela ficha (e portanto ao usuário). */
async function findItem(itemId: string, workoutId: string) {
  const item = await prisma.workoutItem.findFirst({ where: { id: itemId, workoutId } });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Exercício não encontrado na ficha.');
  return item;
}

// ---------- Fichas ----------

workoutRoutes.get('/', async (req, res) => {
  const workouts = await prisma.workout.findMany({
    where: { userId: req.user!.id },
    include: withItems,
    orderBy: { createdAt: 'asc' },
  });
  res.json(workouts);
});

workoutRoutes.post('/', validate(nameSchema), async (req, res) => {
  const workout = await prisma.workout.create({
    data: { name: req.body.name, userId: req.user!.id },
    include: withItems,
  });
  res.status(201).json(workout);
});

workoutRoutes.patch('/:id', validate(nameSchema), async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);
  const workout = await prisma.workout.update({
    where: { id: own.id },
    data: { name: req.body.name },
    include: withItems,
  });
  res.json(workout);
});

workoutRoutes.delete('/:id', async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);
  // Os itens saem junto (onDelete: Cascade no schema).
  await prisma.workout.delete({ where: { id: own.id } });
  res.status(204).end();
});

// ---------- Exercícios dentro da ficha ----------

workoutRoutes.post('/:id/items', validate(addItemSchema), async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);

  const exercise = await prisma.exercise.findUnique({ where: { id: req.body.exerciseId } });
  if (!exercise) throw new AppError(404, 'NOT_FOUND', 'Exercício não encontrado.');

  // O novo exercício entra no fim: a posição é a quantidade que a ficha já tem.
  const position = await prisma.workoutItem.count({ where: { workoutId: own.id } });
  const item = await prisma.workoutItem.create({
    data: {
      workoutId: own.id,
      exerciseId: exercise.id,
      position,
      sets: req.body.sets,
      reps: req.body.reps,
    },
    include: { exercise: true },
  });
  res.status(201).json(item);
});

workoutRoutes.patch('/:id/items/:itemId', validate(editItemSchema), async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);
  const item = await findItem(String(req.params.itemId), own.id);

  const updated = await prisma.workoutItem.update({
    where: { id: item.id },
    data: { sets: req.body.sets, reps: req.body.reps },
    include: { exercise: true },
  });
  res.json(updated);
});

workoutRoutes.delete('/:id/items/:itemId', async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);
  const item = await findItem(String(req.params.itemId), own.id);

  // Em transação: ou apaga e reorganiza tudo, ou não muda nada.
  await prisma.$transaction(async (tx) => {
    await tx.workoutItem.delete({ where: { id: item.id } });
    const left = await tx.workoutItem.findMany({
      where: { workoutId: own.id },
      orderBy: { position: 'asc' },
    });
    // Renumera 0, 1, 2… para não ficar buraco onde o item saiu.
    for (const [index, other] of left.entries()) {
      if (other.position !== index) {
        await tx.workoutItem.update({ where: { id: other.id }, data: { position: index } });
      }
    }
  });
  res.status(204).end();
});

workoutRoutes.put('/:id/order', validate(orderSchema), async (req, res) => {
  const own = await findOwnWorkout(String(req.params.id), req.user!.id);
  const itemIds: string[] = req.body.itemIds;

  const current = await prisma.workoutItem.findMany({
    where: { workoutId: own.id },
    select: { id: true },
  });

  // A nova ordem precisa trazer exatamente os itens da ficha: nem a mais,
  // nem a menos, sem repetir.
  const sameItems =
    itemIds.length === current.length &&
    new Set(itemIds).size === itemIds.length &&
    current.every((c) => itemIds.includes(c.id));
  if (!sameItems) {
    throw new AppError(400, 'VALIDATION', 'A ordem deve conter exatamente os exercícios da ficha.', {
      itemIds: 'Lista inválida.',
    });
  }

  await prisma.$transaction(
    itemIds.map((id, position) => prisma.workoutItem.update({ where: { id }, data: { position } })),
  );

  const workout = await prisma.workout.findUniqueOrThrow({
    where: { id: own.id },
    include: withItems,
  });
  res.json(workout);
});
