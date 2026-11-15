import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { toPublicUser } from '../auth/auth.service.js';
import { prisma } from '../db.js';

export const adminRoutes = Router();

// Tudo o que for registrado neste router exige login de administrador.
adminRoutes.use(requireAuth, requireRole('ADMIN'));

adminRoutes.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users.map(toPublicUser));
});
