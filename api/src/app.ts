import cors from 'cors';
import express, { type Express } from 'express';
import { adminRoutes } from './admin/admin.routes.js';
import { authRoutes } from './auth/auth.routes.js';
import { catalogRoutes } from './catalog/catalog.routes.js';
import { env } from './env.js';
import { errorHandler, notFoundHandler } from './errors.js';

/** Monta a aplicação sem abrir porta, para que os testes possam usá-la. */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use(catalogRoutes);

  // Sempre por último: o que não casou com nenhuma rota vira 404,
  // e todo erro passa pelo mesmo formato de resposta.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
