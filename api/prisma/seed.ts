/**
 * Dados de exemplo: planos, modalidades, instrutores, grade de aulas e os
 * três usuários de demonstração. Pode rodar várias vezes sem duplicar nada,
 * porque cada registro é localizado por um campo único (upsert).
 *
 *   npx prisma db seed
 */
import { randomUUID } from 'node:crypto';
import { DEMO_EMAILS } from '../src/auth/auth.service.js';
import { hashPassword } from '../src/auth/password.js';
import { prisma } from '../src/db.js';
import { seedExercises } from '../src/catalog/seed-exercises.js';

const demoPassword = process.env.SEED_DEMO_PASSWORD;
if (!demoPassword || demoPassword.length < 8) {
  console.error('Defina SEED_DEMO_PASSWORD (8+ caracteres) em api/.env antes de rodar o seed.');
  process.exit(1);
}

const plans = [
  {
    name: 'Mensal',
    priceCents: 12990,
    durationMonths: 1,
    description: 'Musculação livre, avaliação física inicial e app de treino.',
  },
  {
    name: 'Semestral',
    priceCents: 9990,
    durationMonths: 6,
    description: 'Tudo do Mensal, aulas coletivas ilimitadas e reavaliação a cada 2 meses.',
  },
  {
    name: 'Anual',
    priceCents: 8990,
    durationMonths: 12,
    description: 'Tudo do Semestral, muay thai incluso e 2 sessões com personal.',
  },
];

const modalities = [
  {
    name: 'Musculação',
    description: 'Equipamentos de ponta, área de peso livre e professores no salão o dia todo.',
  },
  {
    name: 'Cross training',
    description: 'Treinos em grupo de alta intensidade, sempre com escala por nível.',
  },
  {
    name: 'Muay thai',
    description: 'Técnica, condicionamento e confiança. Turmas para iniciantes e avançados.',
  },
  {
    name: 'Spinning',
    description: 'Aula de bike em grupo, com música alta e intervalos de alta intensidade.',
  },
  {
    name: 'Mobilidade',
    description: 'Sessões curtas para recuperar, prevenir lesão e treinar mais pesado.',
  },
];

// Quem dá cada modalidade, quanto dura e quantas vagas tem.
const classInfo: Record<string, { instructor: string; durationMinutes: number; capacity: number }> = {
  'Cross training': { instructor: DEMO_EMAILS.INSTRUCTOR, durationMinutes: 45, capacity: 16 },
  'Muay thai': { instructor: 'camila@levelup.demo', durationMinutes: 60, capacity: 14 },
  Spinning: { instructor: 'bruno@levelup.demo', durationMinutes: 45, capacity: 20 },
  Mobilidade: { instructor: 'bruno@levelup.demo', durationMinutes: 30, capacity: 12 },
};

// Grade do design: [horário, seg/qua, ter/qui, sex]
const weekdayGrid: [string, string, string, string][] = [
  ['06:00', 'Cross training', 'Spinning', 'Cross training'],
  ['07:30', 'Mobilidade', 'Muay thai', 'Mobilidade'],
  ['12:00', 'Spinning', 'Cross training', 'Spinning'],
  ['18:30', 'Muay thai', 'Cross training', 'Muay thai'],
  ['20:00', 'Cross training', 'Mobilidade', 'Cross training'],
];

const saturday: [string, string][] = [
  ['09:00', 'Cross training'],
  ['10:30', 'Muay thai'],
];

function buildSchedule() {
  const classes: { weekday: number; startTime: string; modality: string }[] = [];
  for (const [startTime, monWed, tueThu, fri] of weekdayGrid) {
    classes.push({ weekday: 1, startTime, modality: monWed });
    classes.push({ weekday: 2, startTime, modality: tueThu });
    classes.push({ weekday: 3, startTime, modality: monWed });
    classes.push({ weekday: 4, startTime, modality: tueThu });
    classes.push({ weekday: 5, startTime, modality: fri });
  }
  for (const [startTime, modality] of saturday) {
    classes.push({ weekday: 6, startTime, modality });
  }
  return classes;
}

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { name: plan.name }, update: plan, create: plan });
  }

  for (const modality of modalities) {
    await prisma.modality.upsert({
      where: { name: modality.name },
      update: modality,
      create: modality,
    });
  }

  const semestral = await prisma.plan.findUniqueOrThrow({ where: { name: 'Semestral' } });
  const demoHash = await hashPassword(demoPassword!);
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const users = [
    {
      email: DEMO_EMAILS.STUDENT,
      name: 'Marina Alves',
      role: 'STUDENT' as const,
      passwordHash: demoHash,
      planId: semestral.id,
      planExpiresAt: sixMonthsFromNow,
    },
    {
      email: DEMO_EMAILS.INSTRUCTOR,
      name: 'Rafael Monteiro',
      role: 'INSTRUCTOR' as const,
      passwordHash: demoHash,
    },
    {
      email: DEMO_EMAILS.ADMIN,
      name: 'Admin Level Up',
      role: 'ADMIN' as const,
      passwordHash: demoHash,
    },
    // Instrutores que só aparecem na grade. A senha é aleatória e descartada,
    // então ninguém consegue entrar nessas contas.
    {
      email: 'camila@levelup.demo',
      name: 'Camila Duarte',
      role: 'INSTRUCTOR' as const,
      passwordHash: await hashPassword(randomUUID()),
    },
    {
      email: 'bruno@levelup.demo',
      name: 'Bruno Teixeira',
      role: 'INSTRUCTOR' as const,
      passwordHash: await hashPassword(randomUUID()),
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({ where: { email: user.email }, update: user, create: user });
  }

  const schedule = buildSchedule();
  for (const item of schedule) {
    const info = classInfo[item.modality];
    const modality = await prisma.modality.findUniqueOrThrow({ where: { name: item.modality } });
    const instructor = await prisma.user.findUniqueOrThrow({ where: { email: info.instructor } });
    const data = {
      modalityId: modality.id,
      instructorId: instructor.id,
      weekday: item.weekday,
      startTime: item.startTime,
      durationMinutes: info.durationMinutes,
      capacity: info.capacity,
    };
    await prisma.classTemplate.upsert({
      where: {
        modalityId_weekday_startTime: {
          modalityId: modality.id,
          weekday: item.weekday,
          startTime: item.startTime,
        },
      },
      update: data,
      create: data,
    });
  }

  const exerciseCount = await seedExercises();

  console.log(
    `Seed concluído: ${plans.length} planos, ${modalities.length} modalidades, ` +
      `${users.length} usuários, ${schedule.length} aulas na grade, ${exerciseCount} exercícios.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
