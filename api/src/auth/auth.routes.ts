import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../validate.js';
import { login, signup } from './auth.service.js';

// Normaliza antes de validar: " Ana@Mail.com " e "ana@mail.com" são o mesmo e-mail.
const email = z
  .string('Informe o e-mail.')
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido.'));

const signupSchema = z.object({
  name: z.string('Informe o nome.').trim().min(2, 'Informe o nome completo.').max(100),
  email,
  // O bcrypt só considera os primeiros 72 bytes, por isso o limite.
  password: z
    .string('Informe a senha.')
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
  planId: z.string('Escolha um plano.').min(1, 'Escolha um plano.'),
});

const loginSchema = z.object({
  email,
  password: z.string('Informe a senha.').min(1, 'Informe a senha.'),
});

export const authRoutes = Router();

authRoutes.post('/signup', validate(signupSchema), async (req, res) => {
  res.status(201).json(await signup(req.body));
});

authRoutes.post('/login', validate(loginSchema), async (req, res) => {
  res.json(await login(req.body));
});
