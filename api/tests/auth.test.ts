import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { addMonths } from '../src/auth/auth.service.js';
import { prisma } from '../src/db.js';
import { createPlan, createUser, resetDb, TEST_PASSWORD } from './helpers.js';

const app = createApp();

beforeEach(resetDb);

async function signupBody(overrides: Record<string, unknown> = {}) {
  const plan = await createPlan({ name: 'Mensal', durationMonths: 1 });
  return {
    name: 'Ana Souza',
    email: 'ana@mail.com',
    password: 'senha-forte-123',
    planId: plan.id,
    ...overrides,
  };
}

describe('POST /auth/signup', () => {
  it('cria aluno e devolve token', async () => {
    const res = await request(app).post('/auth/signup').send(await signupBody());

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@mail.com',
      role: 'STUDENT',
      plan: { name: 'Mensal' },
    });
  });

  it('define o vencimento do plano a partir da duração', async () => {
    const res = await request(app).post('/auth/signup').send(await signupBody());

    const expires = new Date(res.body.user.planExpiresAt);
    const days = (expires.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(27);
    expect(days).toBeLessThan(32);
  });

  it('ignora role enviado no corpo', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(await signupBody({ role: 'ADMIN' }));

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('STUDENT');
    const saved = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@mail.com' } });
    expect(saved.role).toBe('STUDENT');
  });

  it('guarda o e-mail em minúsculas e sem espaços', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(await signupBody({ email: '  Ana@Mail.com ' }));

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@mail.com');
  });

  it('e-mail repetido devolve 409, mesmo com maiúsculas e espaços', async () => {
    await createUser({ email: 'ana@mail.com' });

    const res = await request(app)
      .post('/auth/signup')
      .send(await signupBody({ email: ' Ana@Mail.com ' }));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('plano inexistente devolve 400 e não cria usuário', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(await signupBody({ planId: '00000000-0000-0000-0000-000000000000' }));

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('planId');
    expect(await prisma.user.count()).toBe(0);
  });

  it('senha de 7 caracteres devolve 400', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(await signupBody({ password: '1234567' }));

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('password');
  });

  it('não guarda a senha em texto puro', async () => {
    await request(app).post('/auth/signup').send(await signupBody());

    const saved = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@mail.com' } });
    expect(saved.passwordHash).not.toContain('senha-forte-123');
  });
});

describe('POST /auth/login', () => {
  it('devolve token com e-mail e senha corretos', async () => {
    await createUser({ email: 'ana@mail.com' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@mail.com', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('ana@mail.com');
  });

  it('aceita e-mail com maiúsculas e espaços', async () => {
    await createUser({ email: 'ana@mail.com' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: ' Ana@Mail.com ', password: TEST_PASSWORD });

    expect(res.status).toBe(200);
  });

  it('senha errada devolve 401', async () => {
    await createUser({ email: 'ana@mail.com' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@mail.com', password: 'senha-errada-123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('e-mail inexistente devolve a mesma resposta de senha errada', async () => {
    await createUser({ email: 'ana@mail.com' });

    const wrongPassword = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@mail.com', password: 'senha-errada-123' });
    const unknownEmail = await request(app)
      .post('/auth/login')
      .send({ email: 'ninguem@mail.com', password: 'senha-errada-123' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});

describe('respostas de autenticação', () => {
  it('nunca contêm passwordHash', async () => {
    const signup = await request(app).post('/auth/signup').send(await signupBody());
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@mail.com', password: 'senha-forte-123' });

    expect(JSON.stringify(signup.body)).not.toContain('passwordHash');
    expect(JSON.stringify(login.body)).not.toContain('passwordHash');
  });
});

describe('addMonths', () => {
  it('soma meses mantendo o dia', () => {
    expect(addMonths(new Date(2026, 0, 15), 1)).toEqual(new Date(2026, 1, 15));
  });

  it('vira o ano', () => {
    expect(addMonths(new Date(2026, 10, 12), 6)).toEqual(new Date(2027, 4, 12));
  });

  it('usa o último dia quando o mês de destino é mais curto', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });
});
