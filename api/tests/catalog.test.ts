import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { createPlan, createUser, resetDb } from './helpers.js';

const app = createApp();

beforeEach(resetDb);

async function createClass(data: {
  modality: string;
  weekday: number;
  startTime: string;
  instructorId: string;
}) {
  const modality = await prisma.modality.upsert({
    where: { name: data.modality },
    update: {},
    create: { name: data.modality, description: `Aula de ${data.modality}` },
  });
  return prisma.classTemplate.create({
    data: {
      modalityId: modality.id,
      instructorId: data.instructorId,
      weekday: data.weekday,
      startTime: data.startTime,
      durationMinutes: 45,
      capacity: 12,
    },
  });
}

describe('rotas públicas', () => {
  it('/plans vem ordenado do mais barato ao mais caro', async () => {
    await createPlan({ name: 'Anual', priceCents: 8900 });
    await createPlan({ name: 'Mensal', priceCents: 12900 });
    await createPlan({ name: 'Semestral', priceCents: 9900 });

    const res = await request(app).get('/plans');

    expect(res.status).toBe(200);
    expect(res.body.map((p: { name: string }) => p.name)).toEqual(['Anual', 'Semestral', 'Mensal']);
    expect(res.body[0]).toEqual({
      id: expect.any(String),
      name: 'Anual',
      priceCents: 8900,
      durationMonths: 1,
      description: 'Plano de teste',
    });
  });

  it('/modalities vem em ordem alfabética', async () => {
    await prisma.modality.createMany({
      data: [
        { name: 'Spinning', description: 'Bike' },
        { name: 'Cross training', description: 'Alta intensidade' },
      ],
    });

    const res = await request(app).get('/modalities');

    expect(res.body.map((m: { name: string }) => m.name)).toEqual(['Cross training', 'Spinning']);
  });

  it('/schedule vem ordenado por dia e horário', async () => {
    const instructor = await createUser({ role: 'INSTRUCTOR', name: 'Bia Lima' });
    await createClass({ modality: 'Spinning', weekday: 3, startTime: '18:30', instructorId: instructor.id });
    await createClass({ modality: 'Muay thai', weekday: 1, startTime: '20:00', instructorId: instructor.id });
    await createClass({ modality: 'Cross training', weekday: 1, startTime: '06:00', instructorId: instructor.id });

    const res = await request(app).get('/schedule');

    expect(res.status).toBe(200);
    expect(
      res.body.map((c: { weekday: number; startTime: string }) => `${c.weekday} ${c.startTime}`),
    ).toEqual(['1 06:00', '1 20:00', '3 18:30']);
    expect(res.body[0]).toEqual({
      id: expect.any(String),
      weekday: 1,
      startTime: '06:00',
      durationMinutes: 45,
      capacity: 12,
      modality: { id: expect.any(String), name: 'Cross training' },
      instructor: { id: instructor.id, name: 'Bia Lima' },
    });
  });

  it('/schedule não expõe e-mail nem senha do instrutor', async () => {
    const instructor = await createUser({ role: 'INSTRUCTOR', email: 'bia@mail.com' });
    await createClass({ modality: 'Spinning', weekday: 2, startTime: '12:00', instructorId: instructor.id });

    const res = await request(app).get('/schedule');

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('bia@mail.com');
    expect(body).not.toContain('passwordHash');
  });

  it('com o banco vazio, as três rotas devolvem lista vazia', async () => {
    for (const path of ['/plans', '/modalities', '/schedule']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    }
  });
});
