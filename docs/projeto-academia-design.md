# Sistema de academia: documento de design

Data: 12/11/2026

## 1. Intenção

Projeto pessoal de portfólio. O objetivo é mostrar habilidade full-stack a
recrutadores e desenvolvedores que vão abrir o link por poucos minutos e
olhar o repositório em seguida. O site não precisa vender matrículas de
verdade; precisa provar que o autor sabe construir um sistema com regras de
negócio reais, autenticação, banco de dados e uma interface bem cuidada.

## 2. Objetivos, não-objetivos e o que seria um fracasso

**Objetivos**

- Um sistema de academia com dois pilares: aulas coletivas e musculação.
- Quatro perfis de usuário com permissões diferentes.
- No ar, com link público, usuários de demonstração e dados de exemplo.
- README com prints, descrição, decisões tomadas e instruções para rodar.
- Cada etapa de construção termina num estado apresentável.

**Não-objetivos**

- Pagamento real. O plano do aluno e o vencimento são apenas dados
  cadastrados; não há cobrança nem integração com gateway.
- Aplicativo de celular. O site é responsivo e pensado primeiro para
  celular, mas é só web.
- Controle de catraca, check-in físico, estoque ou financeiro da academia.
- Envio de e-mail ou notificações push. Avisos aparecem dentro do sistema.

**Seria um fracasso se**

- Ficasse pela metade, sem nenhuma versão publicada.
- O avaliador precisasse criar conta ou configurar algo para ver funcionando.
- As permissões fossem só visuais (botão escondido no front, rota aberta na API).
- Parecesse um template genérico de academia.

## 3. Restrições

- Tecnologias que o autor já conhece (JavaScript, React, Express,
  PostgreSQL), com TypeScript como única novidade grande.
- Hospedagem gratuita.
- Trabalho dividido meio a meio (seção 9): o autor escreve as regras de
  negócio para conseguir explicá-las em entrevista.

## 4. Abordagens consideradas

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| Next.js com tudo junto | Um projeto só, deploy simples | Esconde a separação entre front e API, que é o que se quer mostrar |
| **React + API Express separados, em TypeScript (escolhida)** | Mostra API REST e consumo dela; aproveita o que o autor já sabe | Dois deploys |
| React + Spring Boot | Java é forte no mercado brasileiro | O autor usou pouco Java; o tempo iria para a ferramenta |

O autor escolheu a segunda e confirmou o uso de TypeScript.

## 5. Tecnologias

Decididas pelo autor:

- Front: React com Vite, TypeScript
- API: Node com Express, TypeScript
- Banco: PostgreSQL
- Login: JWT

Escolhas do Claude (podem ser trocadas):

- Tailwind CSS para o estilo
- Prisma para acesso ao banco e migrações
- Zod para validar entradas da API
- Senhas com bcrypt
- Vitest para os testes, concentrados nas regras de vaga e lista de espera
- Um repositório com duas pastas: `web` e `api`
- Deploy: Vercel (front), Render (API), Neon (PostgreSQL)

## 6. Perfis

| Perfil | O que faz |
|---|---|
| Visitante | Vê a página pública e se cadastra como aluno |
| Aluno | Agenda e cancela aulas, vê a própria ficha, registra treinos |
| Instrutor | Monta fichas de treino dos alunos, vê inscritos das próprias aulas |
| Admin | Cadastra modalidades, aulas, instrutores e planos; vê os números |

Regras de perfil:

- Quem se cadastra pelo site vira aluno. Instrutores e admins são criados
  pelo admin.
- Toda rota da API verifica o perfil. O front apenas esconde o que não se
  aplica.
- A tela de login tem três botões de demonstração: entrar como aluno, como
  instrutor e como admin.

## 7. Funcionalidades

### 7.1 Página pública

- Apresentação da academia, modalidades, planos com preço visível, grade
  semanal de aulas, localização e contato.
- Botão de cadastro. No cadastro o visitante escolhe um plano, sem pagamento.

### 7.2 Aulas coletivas

- O admin cadastra aulas recorrentes na grade semanal: modalidade,
  instrutor, dia da semana, horário, duração e número de vagas.
- O aluno vê a grade da semana e se inscreve numa aula de uma data específica.
- **Limite de vagas:** quando a aula lota, a inscrição entra na lista de
  espera, com a posição mostrada ao aluno.
- **Cancelamento:** permitido até 2 horas antes do início. Ao cancelar, o
  primeiro da lista de espera é promovido automaticamente e vê um aviso na
  próxima vez que entrar.
- **Disputa pela última vaga:** a inscrição roda dentro de uma transação
  no banco, de modo que duas pessoas simultâneas nunca ocupem a mesma vaga.
- O aluno não pode se inscrever duas vezes na mesma aula nem em aulas que
  já começaram.
- O instrutor vê a lista de inscritos e a fila de cada aula sua.

### 7.3 Musculação

- O instrutor monta a ficha do aluno: treinos nomeados (A, B, C), cada um
  com exercícios, séries, repetições e observação.
- Existe um catálogo de exercícios (nome e grupo muscular) já carregado
  com dados de exemplo.
- O aluno abre o treino do dia, marca cada exercício feito e registra a
  carga usada. Ao terminar, o treino fica salvo no histórico.
- O aluno vê o histórico e a última carga de cada exercício.

### 7.4 Tela inicial do aluno

```
Olá, Erick                              [Sair]
------------------------------------------------
PRÓXIMAS AULAS            |  TREINO DE HOJE
Seg 19h  Spinning  ✔      |  Treino B - Costas e bíceps
Qua 18h  Funcional (fila) |  5 exercícios   [Começar]
[Ver grade completa]      |  Último treino: há 2 dias
------------------------------------------------
Plano: Mensal   |   Vence em 12 dias
```

### 7.5 Extras (só depois do resto pronto)

- Gráfico de evolução de carga por exercício.
- Painel do admin com alunos ativos e aulas mais cheias.
- Modo escuro.

## 8. Etapas

1. **Base:** estrutura do repositório, banco, cadastro, login, perfis,
   página pública, dados de exemplo e primeiro deploy.
2. **Aulas coletivas:** grade, inscrição, lista de espera, cancelamento e
   testes dessas regras. **Aqui o projeto já é publicável no portfólio.**
3. **Musculação:** catálogo, ficha, registro de treino e histórico.
4. **Extras e README final.**

## 9. Divisão do trabalho

| Claude | Autor |
|---|---|
| Estrutura inicial do repositório e configurações | Regras de inscrição, limite de vagas e lista de espera |
| Modelagem inicial do banco (revisada pelo autor) | Regra de cancelamento e promoção da fila |
| Cadastro, login e verificação de perfil | Lógica da ficha e do registro de treino |
| Telas e cadastros repetitivos (modalidades, planos, instrutores) | Testes das regras acima |
| Dados de exemplo e configuração de deploy | README e decisões explicadas com as próprias palavras |
| Revisão do código do autor, quando ele pedir | |

## 10. Em aberto

- **Identidade visual e nome da academia: decidido.** O autor trouxe um
  design próprio, a marca **Level Up** (pranchas em `docs/design`): fundo
  preto `#0C0C0C`, verde-limão `#C8FF3D`, off-white `#F4F4F0`, títulos em
  Anton e textos em Inter. Isso substitui o requisito anterior de evitar
  preto com neon; o que diferencia a marca é o conceito de "subir de nível"
  e a tipografia, não a paleta.
- **Diferenças entre o design e este documento, ainda a decidir:**
  - O design mostra check-in por QR code na catraca, que aqui é não-objetivo.
  - O design mostra cronômetro de descanso, sequência de dias, volume
    semanal e recordes pessoais; aqui só a evolução de carga está prevista,
    como extra da etapa 4.
  - Modalidades do design: Musculação, Cross training, Muay thai, Spinning
    e Mobilidade. Planos do design: Mensal, Semestral e Anual.
- **Idioma do código.** Proposta: interface em português, código e nomes
  de tabelas em inglês, que é o costume do mercado.

## 11. Deixado para quem for construir

- Nomes exatos de tabelas, rotas e componentes.
- Biblioteca de gráficos da etapa 4.
- Organização interna das pastas de `web` e `api`.
