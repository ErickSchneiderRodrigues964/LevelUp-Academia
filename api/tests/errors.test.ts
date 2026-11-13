import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/app.js';
import { AppError, errorHandler, notFoundHandler } from '../src/errors.js';
import { validate } from '../src/validate.js';

/** App mínimo só com as peças de erro, para testá-las isoladas das rotas reais. */
function buildTestApp() {
  const app = express();
  app.use(express.json());

  const schema = z.object({ email: z.email(), age: z.number().int().min(18) });
  app.post('/echo', validate(schema), (req, res) => {
    res.json(req.body);
  });
  app.get('/known', () => {
    throw new AppError(409, 'EMAIL_TAKEN', 'Este e-mail já está em uso.');
  });
  app.get('/boom', () => {
    throw new Error('senha do banco: 123456');
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('tratamento de erros', () => {
  it('erro de validação devolve 400 com os campos', async () => {
    const res = await request(buildTestApp())
      .post('/echo')
      .send({ email: 'não-é-email', age: 30 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(res.body.error.fields).toEqual({ email: expect.any(String) });
  });

  it('corpo válido passa pela validação e chega à rota', async () => {
    const res = await request(buildTestApp())
      .post('/echo')
      .send({ email: 'ana@mail.com', age: 30 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'ana@mail.com', age: 30 });
  });

  it('validação descarta campos que não estão no schema', async () => {
    const res = await request(buildTestApp())
      .post('/echo')
      .send({ email: 'ana@mail.com', age: 30, role: 'ADMIN' });

    expect(res.body).not.toHaveProperty('role');
  });

  it('AppError devolve o status e o código informados', async () => {
    const res = await request(buildTestApp()).get('/known');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_TAKEN', message: 'Este e-mail já está em uso.' },
    });
  });

  it('rota inexistente devolve 404 NOT_FOUND', async () => {
    const res = await request(createApp()).get('/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('JSON malformado devolve 400 INVALID_JSON', async () => {
    const res = await request(createApp())
      .post('/qualquer')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('erro inesperado devolve 500 INTERNAL sem vazar a mensagem original', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(buildTestApp()).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL');
    expect(JSON.stringify(res.body)).not.toContain('123456');
    consoleError.mockRestore();
  });
});
