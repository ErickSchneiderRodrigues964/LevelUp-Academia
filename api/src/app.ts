import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './env.js';

/** Monta a aplicação sem abrir porta, para que os testes possam usá-la. */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
