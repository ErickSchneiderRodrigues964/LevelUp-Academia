import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Aplica as migrações no banco de teste uma vez, antes de tudo.
    globalSetup: ['tests/global-setup.ts'],
    // Os testes compartilham um banco só, então rodam um arquivo por vez.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-apenas-para-testes',
      CORS_ORIGIN: 'http://localhost:5173',
      // Os testes NUNCA usam o banco de desenvolvimento.
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ?? 'postgresql://localhost:5432/academia_test',
    },
  },
});
