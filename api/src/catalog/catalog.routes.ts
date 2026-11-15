import { Router } from 'express';
import { prisma } from '../db.js';

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
