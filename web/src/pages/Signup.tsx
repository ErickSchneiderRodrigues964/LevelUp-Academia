import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import type { Plan } from '../api/types';
import { useApi } from '../api/useApi';
import { homeFor, useAuth } from '../auth/AuthContext';
import { Button, ErrorNotice, Field } from '../components/ui';
import { formatPrice } from '../format';
import { AuthLayout } from './AuthLayout';

export function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plans = useApi<Plan[]>('/plans');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Pré-seleciona o plano vindo do link "Assinar ..." da página inicial.
  useEffect(() => {
    if (!plans.data || planId) return;
    const fromLink = searchParams.get('plano');
    const match = plans.data.find((plan) => plan.id === fromLink);
    if (match) setPlanId(match.id);
  }, [plans.data, planId, searchParams]);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const created = await signup({ name, email, password, planId });
      navigate(homeFor(created.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields ?? {});
        if (!err.fields) setError(err.message);
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  }

  const sortedPlans = [...(plans.data ?? [])].sort((a, b) => a.durationMonths - b.durationMonths);

  return (
    <AuthLayout title="Criar conta">
      <p className="rounded-xl border border-border-strong px-4 py-3 text-sm text-muted">
        Este é um projeto de demonstração. Use nome e e-mail fictícios: o painel do admin é aberto
        a visitantes e mostra os cadastros.
      </p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <Field
          id="nome"
          label="Nome completo"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fields.name}
        />
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
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Plano</legend>
          {plans.loading && <p className="text-sm text-muted">Carregando planos…</p>}
          {plans.error && <ErrorNotice>{plans.error}</ErrorNotice>}
          {sortedPlans.map((plan) => (
            <label
              key={plan.id}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 ${
                planId === plan.id ? 'border-primary' : 'border-border-strong'
              }`}
            >
              <input
                type="radio"
                name="plano"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
                className="size-4 accent-primary"
              />
              <span className="flex-1 font-semibold">{plan.name}</span>
              <span className="text-sm text-muted">{formatPrice(plan.priceCents)} /mês</span>
            </label>
          ))}
          {fields.planId && <p className="text-sm text-danger">{fields.planId}</p>}
          <p className="text-sm text-subtle">
            Projeto de demonstração: nenhum pagamento é cobrado.
          </p>
        </fieldset>

        <Button type="submit" disabled={busy}>
          {busy ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-primary underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
