import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import type { Role } from '../api/types';
import { homeFor, useAuth } from '../auth/AuthContext';
import { Button, ErrorNotice, Field } from '../components/ui';
import { AuthLayout } from './AuthLayout';

const demoProfiles: { role: Role; label: string }[] = [
  { role: 'STUDENT', label: 'Aluno' },
  { role: 'INSTRUCTOR', label: 'Instrutor' },
  { role: 'ADMIN', label: 'Admin' },
];

export function Login() {
  const { user, login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Quem já está logado não precisa ver esta tela.
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function run(action: () => Promise<{ role: Role }>) {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const loggedIn = await action();
      navigate(homeFor(loggedIn.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields ?? {});
        // Com erro por campo, a mensagem geral ("Dados inválidos") seria repetição.
        if (!err.fields) setError(err.message);
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() => login(email, password));
  }

  return (
    <AuthLayout title="Entrar">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <Field
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fields.email}
        />
        <Field
          id="senha"
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-primary underline">
          Criar conta
        </Link>
      </p>

      <section aria-labelledby="titulo-demo" className="rounded-2xl border border-border p-5">
        <h2 id="titulo-demo" className="text-base font-semibold">
          Só quer conhecer o sistema?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Entre com uma conta de demonstração e veja a tela de cada perfil.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {demoProfiles.map(({ role, label }) => (
            <Button
              key={role}
              type="button"
              variant="outline"
              className="px-2 text-sm"
              disabled={busy}
              onClick={() => void run(() => loginDemo(role))}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
    </AuthLayout>
  );
}
