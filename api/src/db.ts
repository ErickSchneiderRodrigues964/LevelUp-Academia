import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
import { PrismaClient } from './generated/prisma/client.js';

/** Instância única do Prisma, compartilhada pela aplicação inteira. */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});
