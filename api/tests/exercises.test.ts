import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { EXERCISES, MUSCLE_GROUPS } from '../src/catalog/exercises.js';
import { seedExercises } from '../src/catalog/seed-exercises.js';
import { createApp } from '../src/app.js';
import { resetDb } from './helpers.js';

const app = createApp();

beforeEach(async () => {
  await resetDb();
  await seedExercises();
});

describe('catálogo de exercícios (dados do arquivo)', () => {
  it('tem slugs únicos e entre 6 e 8 exercícios por região', () => {
    const slugs = EXERCISES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const group of MUSCLE_GROUPS) {
      const count = EXERCISES.filter((e) => e.muscleGroup === group.id).length;
      expect(count, group.id).toBeGreaterThanOrEqual(6);
      expect(count, group.id).toBeLessThanOrEqual(8);
    }
  });

  it('todo exercício tem descrição e ao menos 3 passos', () => {
    for (const e of EXERCISES) {
      expect(e.description.length, e.slug).toBeGreaterThan(10);
      expect(e.steps.length, e.slug).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('GET /muscle-groups', () => {
  it('devolve as 8 regiões do corpo', async () => {
    const res = await request(app).get('/muscle-groups');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0]).toEqual({ id: 'peito', label: 'Peito' });
  });
});

describe('GET /exercises', () => {
  it('lista todos os exercícios sem precisar de login', async () => {
    const res = await request(app).get('/exercises');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(EXERCISES.length);
  });

  it('filtra por região do corpo', async () => {
    const res = await request(app).get('/exercises?group=ombros');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((e: { muscleGroup: string }) => e.muscleGroup === 'ombros')).toBe(true);
  });

  it('rejeita região inválida com 400', async () => {
    const res = await request(app).get('/exercises?group=cabelo');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_GROUP');
  });

  it('cada exercício traz as duas fotos', async () => {
    const res = await request(app).get('/exercises?group=peito');
    for (const e of res.body) expect(e.images).toHaveLength(2);
  });
});

describe('GET /exercises/:slug', () => {
  it('devolve o detalhe com o passo a passo', async () => {
    const res = await request(app).get('/exercises/prancha');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Prancha');
    expect(res.body.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('responde 404 para exercício que não existe', async () => {
    const res = await request(app).get('/exercises/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
