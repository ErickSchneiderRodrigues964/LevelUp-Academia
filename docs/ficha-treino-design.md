# Ficha de treino do aluno: desenho e plano

## O que é

O aluno monta a própria ficha: escolhe a região do corpo (peito, costas, ombros…), vê os exercícios
dela, abre um para ler a descrição e ver a demonstração, e adiciona à ficha com séries e repetições.
Serve para os dias em que ele não segue a ficha da academia. A ficha feita pelo instrutor fica para uma etapa futura.

## Decisões

- **Demonstração**: base aberta [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense, domínio público).
  Cada exercício tem 2 fotos (posição inicial e final); o site alterna as duas em loop, como uma animação.
  As imagens são copiadas para `web/public/exercicios/`, sem depender do GitHub em produção.
- **Catálogo**: 56 exercícios, 7 por região (peito, costas, ombros, bíceps, tríceps, pernas, glúteos, abdômen).
  Nomes, descrições e passo a passo escritos em português em `api/prisma/catalog/exercises.ts`
  e gravados no banco pelo seed.
- **Várias fichas**: o aluno pode ter Treino A, B, C…, cada uma com seus exercícios em ordem.
- **Fora desta etapa**: ficha do instrutor, marcar série feita, registrar carga. O modelo já deixa espaço para isso.

## Modelo de dados

- `Exercise`: slug (único), name, muscleGroup, equipment, level, primaryMuscle, description, steps[], images[].
- `Workout`: id, userId, name, createdAt. Pertence a um aluno.
- `WorkoutItem`: id, workoutId, exerciseId, position, sets, reps.

## API

| Rota | Quem | Etapa |
| --- | --- | --- |
| `GET /exercises?group=` e `GET /exercises/:slug` | público | Claude |
| `GET/POST /workouts`, `PATCH/DELETE /workouts/:id` | só o dono | **você** |
| `POST/PATCH/DELETE /workouts/:id/items…` | só o dono | **você** |

Regra de negócio central (sua): o aluno só vê e altera as próprias fichas. Ficha de outro aluno responde 404.

## Plano

1. Corrigir a grade de aulas em telas largas.
2. Modelo, migration, catálogo e seed.
3. Rotas do catálogo com testes.
4. Testes e guia das rotas da ficha (sua parte).
5. Telas: escolher região, lista com animação, detalhe, editor da ficha.
