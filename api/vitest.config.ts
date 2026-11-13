import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Os testes compartilham um banco só, então rodam um arquivo por vez.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-apenas-para-testes',
      CORS_ORIGIN: 'http://localhost:5173',
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ?? 'postgresql://localhost:5432/academia_test',
    },
  },
});
