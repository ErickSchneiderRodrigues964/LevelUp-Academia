import { execSync } from 'node:child_process';

/** Roda uma vez antes da suíte: deixa o banco de teste com as tabelas atuais. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error('Defina DATABASE_URL_TEST em api/.env para rodar os testes.');
  }
  if (!/_test(\?|$)/.test(url)) {
    throw new Error('DATABASE_URL_TEST precisa apontar para um banco terminado em "_test".');
  }

  execSync('npx --no-install prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url, CI: '1', CHECKPOINT_DISABLE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
