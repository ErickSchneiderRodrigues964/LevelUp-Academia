# Sistema de academia, Etapa 1 (Base): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar no ar a base do sistema: repositório, banco, cadastro, login com quatro perfis, página pública e dados de exemplo.

**Architecture:** Um repositório com duas pastas. `api` é uma API REST em Express que fala com PostgreSQL via Prisma e autentica por JWT. `web` é um app React (Vite) que consome essa API. As permissões são verificadas na API; o front só esconde o que não se aplica.

**Tech Stack:** TypeScript, Node (LTS atual), Express, Prisma, PostgreSQL, Zod, bcrypt, jsonwebtoken, Vitest, Supertest, React, Vite, React Router, Tailwind CSS.

**Spec:** `projeto-academia-design.md`

**Fora deste plano:** inscrição em aulas e lista de espera (etapa 2), ficha de treino (etapa 3), extras (etapa 4). Os cadastros do admin (modalidades, aulas, planos, instrutores) entram no começo da etapa 2; aqui a página pública lê os dados de exemplo.

## Global Constraints

- Interface em português; código, tabelas e rotas em inglês.
- Sem pagamento real, sem e-mail, sem notificações push.
- Toda rota protegida verifica o perfil na API.
- Quem se cadastra pelo site vira sempre aluno (`STUDENT`).
- Hospedagem gratuita: Vercel (web), Render (api), Neon (banco).
- Senha com no mínimo 8 caracteres, guardada com bcrypt (custo 10).
- JWT com validade de 7 dias, payload `{ sub: userId, role }`.
- Formato único de erro da API: `{ "error": { "code": string, "message": string, "fields"?: Record<string,string> } }`.
- Ao instalar Prisma e Tailwind, seguir o guia de início rápido da versão atual de cada um; a configuração mudou entre versões recentes.
- Segredos só em `.env` (fora do git), com um `.env.example` sem valores reais.

## Review Focus

1. **E-mail com maiúsculas ou espaços** (`" Ana@Mail.com "`): deve ser tratado como o mesmo e-mail de `ana@mail.com` no cadastro e no login. Teste na Task 4.
2. **Tentativa de virar admin pelo cadastro** (corpo com `"role": "ADMIN"`): o campo é ignorado e o usuário nasce `STUDENT`. Teste na Task 4.
3. **Token vencido, malformado ou de usuário apagado:** resposta 401, nunca 500. Teste na Task 5.
4. **Cadastro com plano que não existe:** resposta 400 com o campo `planId` apontado, sem criar usuário. Teste na Task 4.
5. **API dormindo no plano gratuito** (o Render leva até cerca de um minuto para acordar): o front mostra "Acordando o servidor..." em vez de tela em branco ou erro. Teste na Task 8.

---

## Estrutura de arquivos

```
academia/
  package.json            workspaces: api, web
  README.md
  api/
    .env.example
    prisma/schema.prisma
    prisma/seed.ts
    src/env.ts            lê e valida variáveis de ambiente
    src/db.ts             instância única do Prisma
    src/app.ts            monta o Express (sem abrir porta)
    src/server.ts         abre a porta
    src/errors.ts         AppError e middleware de erro
    src/validate.ts       middleware de validação com Zod
    src/auth/password.ts
    src/auth/token.ts
    src/auth/auth.service.ts
    src/auth/auth.routes.ts
    src/auth/auth.middleware.ts
    src/catalog/catalog.routes.ts   planos, modalidades, grade
    src/admin/admin.routes.ts       por enquanto só GET /admin/users
    tests/helpers.ts      limpa o banco de teste, cria usuários
    tests/*.test.ts
  web/
    .env.example
    src/main.tsx
    src/App.tsx           rotas
    src/styles/theme.css  cores e fontes da identidade
    src/brand.ts          nome da academia e textos fixos
    src/api/client.ts
    src/auth/AuthContext.tsx
    src/auth/RequireRole.tsx
    src/pages/Home.tsx, Login.tsx, Signup.tsx
    src/pages/StudentHome.tsx, InstructorHome.tsx, AdminHome.tsx
    src/components/      ScheduleGrid, PlanCard, Header, WakingNotice
```

---

### Task 1: Estrutura do repositório

**Quem faz:** Claude

**Files:**
- Create: `package.json`, `.gitignore`, `api/package.json`, `api/tsconfig.json`, `api/vitest.config.ts`, `api/src/app.ts`, `api/src/server.ts`, `api/src/env.ts`, `api/.env.example`
- Test: `api/tests/health.test.ts`

**Interfaces:**
- Produces: `createApp(): Express` em `api/src/app.ts`; `env` em `api/src/env.ts` com `DATABASE_URL`, `JWT_SECRET`, `PORT` (padrão 3333), `CORS_ORIGIN`.

- [ ] **Step 1:** `git init`, raiz com npm workspaces `api` e `web`, scripts `dev`, `test`, `build` na raiz que chamam os de cada pasta.
- [ ] **Step 2: Teste que falha**

```ts
it('GET /health responde ok', async () => {
  const res = await request(createApp()).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});
```

- [ ] **Step 3:** Rodar `npm test -w api`. Esperado: falha, `createApp` não existe.
- [ ] **Step 4:** Implementar `createApp()` com `express.json()`, CORS restrito a `env.CORS_ORIGIN` e a rota `/health`. `env.ts` valida as variáveis com Zod e encerra com mensagem clara se faltar alguma.
- [ ] **Step 5:** Rodar `npm test -w api`. Esperado: passa.
- [ ] **Step 6:** Commit `chore: estrutura inicial da api`.

### Task 2: Banco de dados e dados de exemplo

**Quem faz:** Claude escreve, autor revisa o modelo antes do commit.

**Files:**
- Create: `api/prisma/schema.prisma`, `api/prisma/seed.ts`, `api/src/db.ts`, `api/tests/helpers.ts`

**Interfaces:**
- Produces: `prisma` (export de `api/src/db.ts`); `resetDb(): Promise<void>` e `createUser(overrides?): Promise<User>` em `tests/helpers.ts`.

Modelos:

| Modelo | Campos |
|---|---|
| `User` | `id`, `name`, `email` (único), `passwordHash`, `role` (`STUDENT`, `INSTRUCTOR`, `ADMIN`), `planId?`, `planExpiresAt?`, `createdAt` |
| `Plan` | `id`, `name`, `priceCents`, `durationMonths`, `description` |
| `Modality` | `id`, `name`, `description` |
| `ClassTemplate` | `id`, `modalityId`, `instructorId`, `weekday` (0 = domingo a 6 = sábado), `startTime` (`"HH:MM"`), `durationMinutes`, `capacity` |

- [ ] **Step 1:** Criar os bancos locais `academia_dev` e `academia_test`. Os testes usam `DATABASE_URL_TEST`.
- [ ] **Step 2:** Escrever o schema e gerar a primeira migração (`init`).
- [ ] **Step 3:** Escrever `seed.ts`: 3 planos (Mensal, Trimestral, Anual), 5 modalidades (Musculação, Spinning, Funcional, Yoga, Pilates), 3 instrutores, 12 aulas espalhadas pela semana e os três usuários de demonstração `aluno@demo.com`, `instrutor@demo.com` e `admin@demo.com`. A senha deles vem da variável `SEED_DEMO_PASSWORD`. O seed pode rodar duas vezes sem duplicar nada.
- [ ] **Step 4:** Rodar o seed duas vezes e conferir no banco: 3 planos, 5 modalidades, 12 aulas, sem duplicatas.
- [ ] **Step 5:** Autor lê o schema e aponta o que não entendeu ou mudaria.
- [ ] **Step 6:** Commit `feat: modelo de dados e seed`.

### Task 3: Erros e validação

**Quem faz:** Claude

**Files:**
- Create: `api/src/errors.ts`, `api/src/validate.ts`
- Modify: `api/src/app.ts`
- Test: `api/tests/errors.test.ts`

**Interfaces:**
- Produces: `class AppError(status: number, code: string, message: string, fields?: Record<string,string>)`; `errorHandler` (middleware); `validate(schema: ZodSchema)` que valida `req.body` e lança `AppError(400, 'VALIDATION', ...)` com `fields`.

- [ ] **Step 1: Testes que falham**

```ts
it('erro de validação devolve 400 com os campos', ...);
// body { error: { code: 'VALIDATION', fields: { email: expect.any(String) } } }
it('rota inexistente devolve 404 NOT_FOUND', ...);
it('erro inesperado devolve 500 INTERNAL sem vazar a mensagem original', ...);
```

- [ ] **Step 2:** Rodar, ver falhar.
- [ ] **Step 3:** Implementar e registrar `errorHandler` por último em `createApp()`.
- [ ] **Step 4:** Rodar, ver passar.
- [ ] **Step 5:** Commit `feat: tratamento de erros e validação`.

### Task 4: Cadastro, login e "quem sou eu"

**Quem faz:** Claude

**Files:**
- Create: `api/src/auth/password.ts`, `api/src/auth/token.ts`, `api/src/auth/auth.service.ts`, `api/src/auth/auth.routes.ts`
- Test: `api/tests/auth.test.ts`

**Interfaces:**
- Consumes: `prisma`, `AppError`, `validate`.
- Produces:
  - `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`
  - `signToken(user: { id: string; role: Role }): string`, `verifyToken(token: string): { sub: string; role: Role }`
  - `POST /auth/signup` `{ name, email, password, planId }` → 201 `{ token, user }`
  - `POST /auth/login` `{ email, password }` → 200 `{ token, user }`
  - `PublicUser = { id, name, email, role, plan: { id, name } | null, planExpiresAt: string | null }`

Regras: e-mail salvo em minúsculas e sem espaços nas pontas; `planExpiresAt` = data do cadastro + `durationMonths` do plano; e-mail repetido → 409 `EMAIL_TAKEN`; login errado → 401 `INVALID_CREDENTIALS` com a mesma mensagem para e-mail ou senha incorretos; `passwordHash` nunca aparece em resposta.

- [ ] **Step 1: Testes que falham**

```ts
it('cadastro cria aluno e devolve token', ...);          // 201, user.role === 'STUDENT'
it('cadastro ignora role enviado no corpo', ...);        // envia role: 'ADMIN', recebe 'STUDENT'
it('cadastro com e-mail repetido devolve 409', ...);     // inclusive ' Ana@Mail.com '
it('cadastro com plano inexistente devolve 400', ...);   // fields.planId, nenhum usuário criado
it('cadastro com senha de 7 caracteres devolve 400', ...);
it('login aceita e-mail com maiúsculas e espaços', ...);
it('login com senha errada devolve 401', ...);
it('resposta nunca contém passwordHash', ...);
```

- [ ] **Step 2:** Rodar, ver falhar.
- [ ] **Step 3:** Implementar `password.ts`, `token.ts`, o serviço e as rotas.
- [ ] **Step 4:** Rodar, ver passar.
- [ ] **Step 5:** Commit `feat: cadastro e login`.

### Task 5: Perfis e acesso de demonstração

**Quem faz:** Claude

**Files:**
- Create: `api/src/auth/auth.middleware.ts`, `api/src/admin/admin.routes.ts`
- Modify: `api/src/auth/auth.routes.ts`
- Test: `api/tests/roles.test.ts`

**Interfaces:**
- Consumes: `verifyToken`, `AppError`, `PublicUser`.
- Produces:
  - `requireAuth` (lê `Authorization: Bearer <token>`, carrega o usuário em `req.user`)
  - `requireRole(...roles: Role[])`
  - `GET /auth/me` → `PublicUser`
  - `POST /auth/demo` `{ role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' }` → `{ token, user }` do usuário de demonstração daquele perfil
  - `GET /admin/users` (só `ADMIN`) → `PublicUser[]`

- [ ] **Step 1: Testes que falham**

```ts
it('sem token devolve 401 UNAUTHENTICATED', ...);
it('token malformado devolve 401', ...);
it('token vencido devolve 401', ...);
it('token de usuário apagado devolve 401', ...);
it('aluno em /admin/users recebe 403 FORBIDDEN', ...);
it('instrutor em /admin/users recebe 403 FORBIDDEN', ...);
it('admin em /admin/users recebe a lista', ...);
it('/auth/demo devolve token do perfil pedido', ...);
it('/auth/demo com perfil inválido devolve 400', ...);
```

- [ ] **Step 2:** Rodar, ver falhar.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar, ver passar.
- [ ] **Step 5:** Commit `feat: perfis e acesso de demonstração`.

### Task 6: Dados públicos

**Quem faz:** Claude

**Files:**
- Create: `api/src/catalog/catalog.routes.ts`
- Test: `api/tests/catalog.test.ts`

**Interfaces:**
- Produces (todas sem login):
  - `GET /plans` → `{ id, name, priceCents, durationMonths, description }[]`, do mais barato ao mais caro
  - `GET /modalities` → `{ id, name, description }[]`
  - `GET /schedule` → `{ id, weekday, startTime, durationMinutes, capacity, modality: { id, name }, instructor: { id, name } }[]`, ordenado por dia e horário

- [ ] **Step 1: Testes que falham**

```ts
it('/plans vem ordenado por preço', ...);
it('/schedule vem ordenado por dia e horário', ...);
it('/schedule não expõe e-mail do instrutor', ...);
it('com o banco vazio, as três rotas devolvem []', ...);
```

- [ ] **Step 2:** Rodar, ver falhar.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar, ver passar.
- [ ] **Step 5:** Commit `feat: rotas públicas de planos, modalidades e grade`.

### Task 7: Identidade visual

**Quem faz:** Claude propõe, autor escolhe.

**Files:**
- Create: `web/` (projeto Vite com React e TypeScript, Tailwind instalado), `web/src/styles/theme.css`, `web/src/brand.ts`

**Interfaces:**
- Produces: variáveis de cor e fonte em `theme.css` (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-primary`, `--color-accent`, `--font-display`, `--font-body`) expostas ao Tailwind; `BRAND = { name, tagline }` em `brand.ts`.

- [ ] **Step 1:** Montar três opções de identidade lado a lado (nome, paleta, fontes e o topo da página pública em cada uma). Nenhuma no padrão preto com neon.
- [ ] **Step 2:** Autor escolhe uma ou pede mistura.
- [ ] **Step 3:** Gravar a escolha em `theme.css` e `brand.ts`. Conferir contraste de texto (mínimo 4,5:1).
- [ ] **Step 4:** Rodar `npm run dev -w web` e ver a página em branco com a fonte e a cor de fundo escolhidas.
- [ ] **Step 5:** Commit `feat: identidade visual`.

### Task 8: Front, parte de login

**Quem faz:** Claude

**Files:**
- Create: `web/src/api/client.ts`, `web/src/auth/AuthContext.tsx`, `web/src/auth/RequireRole.tsx`, `web/src/pages/Login.tsx`, `web/src/pages/Signup.tsx`, `web/src/components/WakingNotice.tsx`, `web/.env.example`
- Modify: `web/src/App.tsx`
- Test: `web/src/api/client.test.ts`, `web/src/auth/RequireRole.test.tsx`

**Interfaces:**
- Consumes: rotas das Tasks 4, 5 e 6.
- Produces:
  - `api.get<T>(path)`, `api.post<T>(path, body)`; lançam `ApiError { status, code, message, fields? }`
  - `useAuth(): { user: PublicUser | null, loading: boolean, login(email, password), signup(data), loginDemo(role), logout() }`
  - `<RequireRole roles={[...]}>`: sem login vai para `/login`; perfil errado vai para a tela inicial do próprio perfil
  - Rotas: `/`, `/login`, `/cadastro`, `/aluno`, `/instrutor`, `/admin`

O token fica no `localStorage`. É a opção simples e fica documentada no README como decisão consciente. Resposta 401 em qualquer chamada limpa o token e leva ao login.

- [ ] **Step 1: Testes que falham**

```ts
it('client envia o token no cabeçalho Authorization', ...);
it('client transforma erro da API em ApiError com code e fields', ...);
it('client avisa quando a resposta demora mais de 4 segundos', ...); // onSlow chamado
it('RequireRole manda visitante para /login', ...);
it('RequireRole manda aluno que abre /admin para /aluno', ...);
```

- [ ] **Step 2:** Rodar `npm test -w web`, ver falhar.
- [ ] **Step 3:** Implementar. `WakingNotice` mostra "Acordando o servidor..." quando o client sinaliza demora.
- [ ] **Step 4:** Telas de login e cadastro com erros por campo vindos de `fields`, e os três botões "Entrar como aluno / instrutor / admin". O cadastro lista os planos de `GET /plans`.
- [ ] **Step 5:** Rodar os testes, ver passar. Conferir à mão no navegador, em largura de celular: cadastrar, sair, entrar, usar os três botões de demonstração.
- [ ] **Step 6:** Commit `feat: login, cadastro e proteção de rotas no front`.

### Task 9: Página pública e telas iniciais

**Quem faz:** Claude

**Files:**
- Create: `web/src/pages/Home.tsx`, `web/src/pages/StudentHome.tsx`, `web/src/pages/InstructorHome.tsx`, `web/src/pages/AdminHome.tsx`, `web/src/components/ScheduleGrid.tsx`, `web/src/components/PlanCard.tsx`, `web/src/components/Header.tsx`
- Test: `web/src/components/ScheduleGrid.test.tsx`

**Interfaces:**
- Consumes: `GET /plans`, `GET /modalities`, `GET /schedule`, `useAuth`.

- [ ] **Step 1: Testes que falham**

```ts
it('ScheduleGrid agrupa as aulas por dia da semana, em ordem de horário', ...);
it('ScheduleGrid mostra "Sem aulas" nos dias vazios', ...);
```

- [ ] **Step 2:** Rodar, ver falhar.
- [ ] **Step 3:** Implementar `ScheduleGrid` (lista por dia no celular, tabela na tela larga) e `PlanCard` (preço em reais a partir de `priceCents`).
- [ ] **Step 4:** Montar `Home`: apresentação, modalidades, planos com preço visível, grade, localização e contato fictícios, botão de cadastro.
- [ ] **Step 5:** Telas iniciais por perfil. `StudentHome` segue o desenho da seção 7.4 do design, com plano e vencimento reais e os blocos de aulas e treino marcados como "em breve". `InstructorHome` mostra as aulas do instrutor na grade. `AdminHome` mostra a lista de `GET /admin/users`.
- [ ] **Step 6:** Rodar os testes. Conferir no navegador em celular e tela larga, e navegar a página inteira só com o teclado.
- [ ] **Step 7:** Commit `feat: página pública e telas iniciais`.

### Task 10: Publicação e README

**Quem faz:** autor cria as contas e escreve o README; Claude configura e confere.

**Files:**
- Create: `README.md`, `render.yaml`
- Modify: `api/package.json` (script de build e de migração em produção)

- [ ] **Step 1:** Autor cria o repositório no GitHub e as contas no Neon, Render e Vercel, e preenche as variáveis de ambiente em cada painel. Nenhum segredo vai para o chat nem para o git.
- [ ] **Step 2:** Configurar o build da API no Render (migração + seed + start) e do front na Vercel (`VITE_API_URL` apontando para a API). `CORS_ORIGIN` da API é o endereço da Vercel.
- [ ] **Step 3:** No link público, em aba anônima: abrir a página, entrar com cada botão de demonstração, cadastrar um aluno novo, conferir que `/admin` é barrado para o aluno.
- [ ] **Step 4:** Autor escreve o README com as próprias palavras: o que é, link, prints, tecnologias, como rodar, decisões (token no `localStorage`, perfis verificados na API, sem pagamento real) e o que vem nas próximas etapas. Claude revisa.
- [ ] **Step 5:** Commit `docs: README e configuração de deploy`.

---

## Depois deste plano

Com a etapa 1 no ar, o próximo plano é o da etapa 2 (aulas coletivas). Nele os papéis se invertem: o autor escreve as regras de inscrição, limite de vagas, lista de espera e cancelamento, e Claude faz os cadastros do admin e revisa.
