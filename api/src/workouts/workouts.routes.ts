import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';

/**
 * Fichas de treino do aluno. ESTE ARQUIVO É A SUA PARTE.
 * O guia está em docs/guia-rotas-ficha.md e os testes em tests/workouts.test.ts.
 *
 * Regra central: cada usuário só enxerga e altera as PRÓPRIAS fichas.
 * Ficha de outra pessoa responde 404, como se não existisse.
 */
export const workoutRoutes = Router();

// Tudo daqui para baixo exige login.
workoutRoutes.use(requireAuth);

// TODO 1: GET    /workouts                        lista as minhas fichas (com os exercícios)
// TODO 2: POST   /workouts                        cria uma ficha { name }
// TODO 3: PATCH  /workouts/:id                    renomeia { name }
// TODO 4: DELETE /workouts/:id                    apaga a ficha
// TODO 5: POST   /workouts/:id/items              adiciona exercício { exerciseId, sets, reps }
// TODO 6: PATCH  /workouts/:id/items/:itemId      muda séries/repetições
// TODO 7: DELETE /workouts/:id/items/:itemId      remove o exercício (e reorganiza as posições)
// TODO 8: PUT    /workouts/:id/order              reordena { itemIds: [...] }
