import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'use pelo menos 16 caracteres'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(
    `Variáveis de ambiente ausentes ou inválidas:\n${problems}\n` +
      'Copie api/.env.example para api/.env e preencha os valores.',
  );
  process.exit(1);
}

export const env = parsed.data;
