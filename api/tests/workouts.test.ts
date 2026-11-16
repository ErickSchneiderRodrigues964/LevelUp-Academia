import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { seedExercises } from '../src/catalog/seed-exercises.js';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth/token.js';
import { prisma } from '../src/db.js';
import { createUser, resetDb } from './helpers.js';

// Estes testes descrevem o que as rotas de /workouts devem fazer.
// Eles FALHAM até você implementar api/src/workouts/workouts.routes.ts.
// Guia: docs/guia-rotas-ficha.md

const app = createApp();
const as = (user: Parameters<typeof signToken>[0]) => ({
  Authorization: `Bearer ${signToken(user)}`,
});

beforeEach(async () => {
  await resetDb();
  await seedExercises();
});

async function exerciseId(slug = 'prancha') {
  const e = await prisma.exercise.findUniqueOrThrow({ where: { slug } });
  return e.id;
}

describe('autenticação', () => {
  it('sem login devolve 401 em todas as rotas', async () => {
    expect((await request(app).get('/workouts')).status).toBe(401);
    expect((await request(app).post('/workouts').send({ name: 'A' })).status).toBe(401);
  });
});

describe('POST /workouts', () => {
  it('cria uma ficha vazia para o usuário logado', async () => {
    const ana = await createUser();
    const res = await request(app).post('/workouts').set(as(ana)).send({ name: '  Treino A  ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Treino A', items: [] });
    const saved = await prisma.workout.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(saved.userId).toBe(ana.id);
  });

  it('rejeita nome vazio ou grande demais com 400 VALIDATION', async () => {
    const ana = await createUser();
    const empty = await request(app).post('/workouts').set(as(ana)).send({ name: '   ' });
    const long = await request(app).post('/workouts').set(as(ana)).send({ name: 'x'.repeat(41) });

    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe('VALIDATION');
    expect(long.status).toBe(400);
  });
});

describe('GET /workouts', () => {
  it('lista só as fichas de quem está logado, com os exercícios em ordem', async () => {
    const ana = await createUser();
    const bia = await createUser();
    const a = await request(app).post('/workouts').set(as(ana)).send({ name: 'A' });
    await request(app).post('/workouts').set(as(bia)).send({ name: 'Da Bia' });
    await request(app)
      .post(`/workouts/${a.body.id}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId('prancha'), sets: 3, reps: 12 });
    await request(app)
      .post(`/workouts/${a.body.id}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId('leg-press'), sets: 4, reps: 10 });

    const res = await request(app).get('/workouts').set(as(ana));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('A');
    expect(res.body[0].items.map((i: { exercise: { slug: string } }) => i.exercise.slug)).toEqual([
      'prancha',
      'leg-press',
    ]);
    expect(res.body[0].items[1]).toMatchObject({ sets: 4, reps: 10, position: 1 });
  });
});

describe('isolamento entre alunos (a regra central)', () => {
  it('ficha de outro aluno responde 404 em todas as rotas', async () => {
    const ana = await createUser();
    const bia = await createUser();
    const ficha = await request(app).post('/workouts').set(as(ana)).send({ name: 'Da Ana' });
    const item = await request(app)
      .post(`/workouts/${ficha.body.id}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId(), sets: 3, reps: 10 });
    const id = ficha.body.id;
    const itemId = item.body.id;

    const attempts = [
      request(app).patch(`/workouts/${id}`).set(as(bia)).send({ name: 'Roubada' }),
      request(app).delete(`/workouts/${id}`).set(as(bia)),
      request(app)
        .post(`/workouts/${id}/items`)
        .set(as(bia))
        .send({ exerciseId: await exerciseId(), sets: 3, reps: 10 }),
      request(app).patch(`/workouts/${id}/items/${itemId}`).set(as(bia)).send({ sets: 9 }),
      request(app).delete(`/workouts/${id}/items/${itemId}`).set(as(bia)),
      request(app).put(`/workouts/${id}/order`).set(as(bia)).send({ itemIds: [itemId] }),
    ];
    for (const res of await Promise.all(attempts)) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }

    // E nada mudou na ficha da Ana.
    const intact = await prisma.workout.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
    expect(intact.name).toBe('Da Ana');
    expect(intact.items).toHaveLength(1);
    expect(intact.items[0].sets).toBe(3);
  });
});

describe('PATCH e DELETE /workouts/:id', () => {
  it('renomeia a ficha', async () => {
    const ana = await createUser();
    const ficha = await request(app).post('/workouts').set(as(ana)).send({ name: 'A' });
    const res = await request(app)
      .patch(`/workouts/${ficha.body.id}`)
      .set(as(ana))
      .send({ name: 'Peito e tríceps' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Peito e tríceps');
  });

  it('apaga a ficha e os itens dela', async () => {
    const ana = await createUser();
    const ficha = await request(app).post('/workouts').set(as(ana)).send({ name: 'A' });
    await request(app)
      .post(`/workouts/${ficha.body.id}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId(), sets: 3, reps: 10 });

    const res = await request(app).delete(`/workouts/${ficha.body.id}`).set(as(ana));

    expect(res.status).toBe(204);
    expect(await prisma.workout.count()).toBe(0);
    expect(await prisma.workoutItem.count()).toBe(0);
  });
});

describe('itens da ficha', () => {
  async function fichaComUmItem() {
    const ana = await createUser();
    const ficha = await request(app).post('/workouts').set(as(ana)).send({ name: 'A' });
    const item = await request(app)
      .post(`/workouts/${ficha.body.id}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId(), sets: 3, reps: 12 });
    return { ana, workoutId: ficha.body.id as string, item: item.body };
  }

  it('adiciona exercício no fim da ficha (201)', async () => {
    const { item } = await fichaComUmItem();
    expect(item).toMatchObject({ sets: 3, reps: 12, position: 0 });
  });

  it('rejeita exercício que não existe com 404', async () => {
    const { ana, workoutId } = await fichaComUmItem();
    const res = await request(app)
      .post(`/workouts/${workoutId}/items`)
      .set(as(ana))
      .send({ exerciseId: '00000000-0000-0000-0000-000000000000', sets: 3, reps: 10 });

    expect(res.status).toBe(404);
  });

  it('rejeita séries e repetições fora dos limites (1 a 10 séries, 1 a 100 reps)', async () => {
    const { ana, workoutId } = await fichaComUmItem();
    const id = await exerciseId('abdominal-crunch');
    const bad = [
      { exerciseId: id, sets: 0, reps: 10 },
      { exerciseId: id, sets: 11, reps: 10 },
      { exerciseId: id, sets: 3, reps: 0 },
      { exerciseId: id, sets: 3, reps: 101 },
      { exerciseId: id, sets: 2.5, reps: 10 },
      { exerciseId: id, sets: '3', reps: 10 },
    ];
    for (const body of bad) {
      const res = await request(app).post(`/workouts/${workoutId}/items`).set(as(ana)).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION');
    }
  });

  it('edita séries e repetições', async () => {
    const { ana, workoutId, item } = await fichaComUmItem();
    const res = await request(app)
      .patch(`/workouts/${workoutId}/items/${item.id}`)
      .set(as(ana))
      .send({ sets: 5, reps: 8 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sets: 5, reps: 8 });
  });

  it('ao remover um item, as posições dos outros ficam 0, 1, 2…', async () => {
    const { ana, workoutId, item } = await fichaComUmItem();
    for (const slug of ['leg-press', 'barra-fixa']) {
      await request(app)
        .post(`/workouts/${workoutId}/items`)
        .set(as(ana))
        .send({ exerciseId: await exerciseId(slug), sets: 3, reps: 10 });
    }

    const del = await request(app).delete(`/workouts/${workoutId}/items/${item.id}`).set(as(ana));
    expect(del.status).toBe(204);

    const left = await prisma.workoutItem.findMany({
      where: { workoutId },
      orderBy: { position: 'asc' },
    });
    expect(left.map((i) => i.position)).toEqual([0, 1]);
  });

  it('reordena a ficha com PUT /order', async () => {
    const { ana, workoutId, item } = await fichaComUmItem();
    const second = await request(app)
      .post(`/workouts/${workoutId}/items`)
      .set(as(ana))
      .send({ exerciseId: await exerciseId('leg-press'), sets: 3, reps: 10 });

    const res = await request(app)
      .put(`/workouts/${workoutId}/order`)
      .set(as(ana))
      .send({ itemIds: [second.body.id, item.id] });

    expect(res.status).toBe(200);
    const list = await request(app).get('/workouts').set(as(ana));
    expect(list.body[0].items.map((i: { id: string }) => i.id)).toEqual([second.body.id, item.id]);
  });

  it('rejeita reordenação que não traz exatamente os itens da ficha (400)', async () => {
    const { ana, workoutId } = await fichaComUmItem();
    const res = await request(app)
      .put(`/workouts/${workoutId}/order`)
      .set(as(ana))
      .send({ itemIds: [] });

    expect(res.status).toBe(400);
  });
});
