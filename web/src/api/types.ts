// Formatos devolvidos pela API. Espelham os tipos de api/src.

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: { id: string; name: string } | null;
  planExpiresAt: string | null;
};

export type AuthResult = { token: string; user: User };

export type Plan = {
  id: string;
  name: string;
  priceCents: number;
  durationMonths: number;
  description: string;
};

export type Modality = { id: string; name: string; description: string };

export type ScheduleClass = {
  id: string;
  /** 0 = domingo ... 6 = sábado */
  weekday: number;
  /** "HH:MM" */
  startTime: string;
  durationMinutes: number;
  capacity: number;
  modality: { id: string; name: string };
  instructor: { id: string; name: string };
};

export type MuscleGroup = { id: string; label: string };

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  level: string;
  primaryMuscle: string;
  description: string;
  steps: string[];
  /** Duas fotos: posição inicial e final. */
  images: string[];
};

export type WorkoutItem = {
  id: string;
  position: number;
  sets: number;
  reps: number;
  exercise: Exercise;
};

export type Workout = { id: string; name: string; items: WorkoutItem[] };
