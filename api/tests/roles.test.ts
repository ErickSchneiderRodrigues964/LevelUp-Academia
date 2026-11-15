import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signToken } from '../src/auth/token.js';
import { prisma } from '../src/db.js';
import { createPlan, createUser, resetDb } from './helpers.js';

const app = createApp();
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(resetDb);

describe('GET /auth/me', () => {
  it('devolve o usuário do token', async () => {
    const plan = await createPlan({ name: 'Mensal' });
    const user = await createUser({ email: 'ana@mail.com', planId: plan.id });

    const res = await request(app).get('/auth/me').set(bearer(signToken(user)));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: user.id,
      email: 'ana@mail.com',
      role: 'STUDENT',
      plan: { name: 'Mensal' },
    });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('sem token devolve 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('cabeçalho que não é Bearer devolve 401', async () => {
    const res = await request(app).get('/auth/me').set({ Authorization: 'Basic abc123' });

    expect(res.status).toBe(401);
  });

  it('token malformado devolve 401', async () => {
    const res = await request(app).get('/auth/me').set(bearer('isto-nao-e-um-token'));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token assinado com outro segredo devolve 401', async () => {
    const user = await createUser();
    const forged = jwt.sign({ role: 'ADMIN' }, 'outro-segredo-qualquer', { subject: user.id });

    const res = await request(app).get('/auth/me').set(bearer(forged));

    expect(res.status).toBe(401);
  });

  it('token vencido devolve 401', async () => {
    const user = await createUser();
    const expired = jwt.sign({ role: user.role }, process.env.JWT_SECRET!, {
      subject: user.id,
      expiresIn: -10,
    });

    const res = await request(app).get('/auth/me').set(bearer(expired));

    expect(res.status).toBe(401);
  });

  it('token de usuário apagado devolve 401', async () => {
    const user = await createUser();
    const token = signToken(user);
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app).get('/auth/me').set(bearer(token));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('GET /admin/users', () => {
  it('aluno recebe 403 FORBIDDEN', async () => {
    const student = await createUser({ role: 'STUDENT' });

    const res = await request(app).get('/admin/users').set(bearer(signToken(student)));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('instrutor recebe 403 FORBIDDEN', async () => {
    const instructor = await createUser({ role: 'INSTRUCTOR' });

    const res = await request(app).get('/admin/users').set(bearer(signToken(instructor)));

    expect(res.status).toBe(403);
  });

  it('visitante sem token recebe 401', async () => {
    const res = await request(app).get('/admin/users');

    expect(res.status).toBe(401);
  });

  it('admin recebe a lista, sem hashes de senha', async () => {
    const admin = await createUser({ role: 'ADMIN', email: 'admin@mail.com' });
    await createUser({ email: 'ana@mail.com' });

    const res = await request(app).get('/admin/users').set(bearer(signToken(admin)));

    expect(res.status).toBe(200);
    expect(res.body.map((u: { email: string }) => u.email).sort()).toEqual([
      'admin@mail.com',
      'ana@mail.com',
    ]);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('vale o perfil atual do banco, não o que está gravado no token', async () => {
    const user = await createUser({ role: 'ADMIN' });
    const tokenFromWhenAdmin = signToken(user);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'STUDENT' } });

    const res = await request(app).get('/admin/users').set(bearer(tokenFromWhenAdmin));

    expect(res.status).toBe(403);
  });
});

describe('POST /auth/demo', () => {
  it('devolve token do perfil pedido', async () => {
    await createUser({ email: 'instrutor@demo.com', role: 'INSTRUCTOR' });

    const res = await request(app).post('/auth/demo').send({ role: 'INSTRUCTOR' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'instrutor@demo.com', role: 'INSTRUCTOR' });

    const me = await request(app).get('/auth/me').set(bearer(res.body.token));
    expect(me.body.email).toBe('instrutor@demo.com');
  });

  it('perfil inválido devolve 400', async () => {
    const res = await request(app).post('/auth/demo').send({ role: 'SUPERUSER' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('role');
  });

  it('sem os dados de exemplo carregados devolve 503', async () => {
    const res = await request(app).post('/auth/demo').send({ role: 'ADMIN' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DEMO_UNAVAILABLE');
  });
});
