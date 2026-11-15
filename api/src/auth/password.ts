import bcrypt from 'bcryptjs';

// Custo 10: cada hash leva dezenas de milissegundos, o que torna inviável
// testar milhões de senhas por força bruta caso o banco vaze.
const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
