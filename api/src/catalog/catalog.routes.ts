import { Router } from 'express';
import { MUSCLE_GROUPS } from './exercises.js';
import { prisma } from '../db.js';
import { AppError } from '../errors.js';

/** Dados que qualquer visitante pode ver, sem login. */
export const catalogRoutes = Router();

catalogRoutes.get('/plans', async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { priceCents: 'asc' } });
  res.json(plans);
});

catalogRoutes.get('/modalities', async (_req, res) => {
  const modalities = await prisma.modality.findMany({ orderBy: { name: 'asc' } });
  res.json(modalities);
});

const GROUP_IDS: string[] = MUSCLE_GROUPS.map((g) => g.id);

/** Lista os exercícios. Com ?group=peito, só os dessa região do corpo. */
catalogRoutes.get('/exercises', async (req, res) => {
  const group = req.query.group;
  if (group !== undefined && (typeof group !== 'string' || !GROUP_IDS.includes(group))) {
    throw new AppError(400, 'INVALID_GROUP', 'Região do corpo inválida.');
  }
  const exercises = await prisma.exercise.findMany({
    where: group ? { muscleGroup: group } : undefined,
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  });
  res.json(exercises);
});

/** As regiões do corpo disponíveis, na ordem em que aparecem na tela. */
catalogRoutes.get('/muscle-groups', (_req, res) => {
  res.json(MUSCLE_GROUPS);
});

catalogRoutes.get('/exercises/:slug', async (req, res) => {
  const exercise = await prisma.exercise.findUnique({ where: { slug: req.params.slug } });
  if (!exercise) throw new AppError(404, 'NOT_FOUND', 'Exercício não encontrado.');
  res.json(exercise);
});

catalogRoutes.get('/schedule', async (_req, res) => {
  const classes = await prisma.classTemplate.findMany({
    // "select" escolhe campo a campo o que sai. Do instrutor vão só id e nome:
    // e-mail e hash de senha nunca chegam a uma rota pública.
    select: {
      id: true,
      weekday: true,
      startTime: true,
      durationMinutes: true,
      capacity: true,
      modality: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true } },
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
  });
  res.json(classes);
});
