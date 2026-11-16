/**
 * Baixa as 2 fotos de cada exercício do catálogo (base free-exercise-db, Unlicense)
 * e salva em web/public/exercicios/<slug>/0.jpg e 1.jpg.
 * Rodar uma vez: npx tsx scripts/copy-exercise-images.ts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EXERCISES } from '../src/catalog/exercises.js';

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const OUT = path.resolve(import.meta.dirname, '../../web/public/exercicios');

for (const e of EXERCISES) {
  const dir = path.join(OUT, e.slug);
  await mkdir(dir, { recursive: true });
  for (const n of [0, 1]) {
    const res = await fetch(`${BASE}/${e.sourceId}/${n}.jpg`);
    if (!res.ok) throw new Error(`Falhou ${e.sourceId}/${n}.jpg: ${res.status}`);
    await writeFile(path.join(dir, `${n}.jpg`), Buffer.from(await res.arrayBuffer()));
  }
  console.log('ok', e.slug);
}
