# Guia: rotas da ficha de treino (sua parte)

Arquivo para escrever: [`api/src/workouts/workouts.routes.ts`](../api/src/workouts/workouts.routes.ts).
Os testes que dizem o que cada rota deve fazer já estão em [`api/tests/workouts.test.ts`](../api/tests/workouts.test.ts).
Eles **falham agora** de propósito. Seu trabalho é fazê-los passar, um por vez:

```bash
cd api
npx vitest run tests/workouts.test.ts
```

## A regra que você vai explicar na entrevista

> Cada aluno só vê e altera as próprias fichas. Ficha de outra pessoa responde **404**, como se não existisse.

Por que 404 e não 403? Com 403 o sistema confirma que aquele id existe, e um curioso poderia descobrir fichas
alheias tentando ids. Com 404 não há como distinguir "não é sua" de "não existe".

Como fazer na prática: **nunca busque só por `id`**. Sempre busque por `id` **e** `userId` do usuário logado
(`req.user.id`, preenchido pelo `requireAuth`):

```ts
const workout = await prisma.workout.findFirst({ where: { id, userId: req.user.id } });
if (!workout) throw new AppError(404, 'NOT_FOUND', 'Ficha não encontrada.');
```

Dica: como isso se repete em quase toda rota, vale criar uma função `findOwnWorkout(id, userId)`.

## Rotas (ordem sugerida, igual aos testes)

| # | Rota | O que faz | Resposta |
| --- | --- | --- | --- |
| 1 | `POST /workouts` | cria ficha `{ name }` | 201 + ficha com `items: []` |
| 2 | `GET /workouts` | lista **minhas** fichas, com `items` ordenados por `position` e o `exercise` de cada um | 200 |
| 3 | `PATCH /workouts/:id` | renomeia | 200 + ficha |
| 4 | `DELETE /workouts/:id` | apaga (itens vão junto: `onDelete: Cascade`) | 204 sem corpo |
| 5 | `POST /workouts/:id/items` | adiciona `{ exerciseId, sets, reps }` no fim | 201 + item |
| 6 | `PATCH /workouts/:id/items/:itemId` | muda séries/repetições | 200 + item |
| 7 | `DELETE /workouts/:id/items/:itemId` | remove e reorganiza as posições | 204 |
| 8 | `PUT /workouts/:id/order` | reordena `{ itemIds }` | 200 |

## Peças que já existem para você usar

- `requireAuth` já está aplicado no arquivo; depois dele `req.user` existe.
- `validate(schemaZod)` (em `src/validate.ts`) valida o corpo e devolve `400 VALIDATION` com `fields`. Exemplo de uso em `src/auth/auth.routes.ts`.
- `AppError(status, code, message)` para erros previstos (`src/errors.ts`).
- `prisma.workout`, `prisma.workoutItem`, `prisma.exercise` (modelos em `api/prisma/schema.prisma`).

## Regras de validação (os testes cobrem)

- `name`: texto, sem espaços nas pontas (`trim`), de 1 a 40 caracteres.
- `sets`: inteiro de 1 a 10. `reps`: inteiro de 1 a 100. Número quebrado (`2.5`) ou texto (`"3"`) é erro.
- Exercício inexistente: 404.

## Pontos que merecem atenção

1. **Posição do novo item**: é a quantidade de itens que a ficha já tem (começa em 0).
2. **Ao remover um item**, as posições dos outros precisam voltar a ser 0, 1, 2… Faça tudo dentro de uma
   `prisma.$transaction([...])` para não ficar pela metade se algo falhar.
3. **Reordenar**: `itemIds` precisa ter *exatamente* os itens da ficha (nem a mais, nem a menos, sem repetir).
   Caso contrário, 400. Depois, grave a posição de cada um conforme a ordem recebida (também numa transação).
4. **Item pertence à ficha?** Na rota `/workouts/:id/items/:itemId`, confira que o item é daquela ficha
   (`where: { id: itemId, workoutId: workout.id }`), senão alguém poderia editar item de outra ficha.

## Como saber se terminou

Todos os testes de `workouts.test.ts` verdes e `npm test` inteiro sem falhas. Quando passar, me avise: aí eu
ligo as telas à API (a tela de montar a ficha já vai estar pronta esperando).
