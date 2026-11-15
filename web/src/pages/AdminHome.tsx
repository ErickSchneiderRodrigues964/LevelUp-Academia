import type { Role, User } from '../api/types';
import { useApi } from '../api/useApi';
import { AppHeader } from '../components/Header';
import { ErrorNotice } from '../components/ui';
import { formatDate } from '../format';

const roleLabel: Record<Role, string> = {
  STUDENT: 'Aluno',
  INSTRUCTOR: 'Instrutor',
  ADMIN: 'Admin',
};

const rolePlural: Record<Role, string> = {
  STUDENT: 'Alunos',
  INSTRUCTOR: 'Instrutores',
  ADMIN: 'Admins',
};

export function AdminHome() {
  const users = useApi<User[]>('/admin/users');

  const count = (role: Role) => users.data?.filter((u) => u.role === role).length ?? 0;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <h1 className="font-display text-5xl uppercase leading-none">Painel</h1>

        {users.error && <ErrorNotice>{users.error}</ErrorNotice>}
        {users.loading && <p className="text-muted">Carregando usuários…</p>}

        {users.data && (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              {(['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const).map((role) => (
                <div key={role} className="rounded-[20px] bg-surface p-5">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-subtle">
                    {rolePlural[role]}
                  </dt>
                  <dd className="font-display text-5xl">{count(role)}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="titulo-usuarios" className="flex flex-col gap-4">
              <h2 id="titulo-usuarios" className="text-lg font-semibold">
                Usuários
              </h2>
              {/* Em telas estreitas a tabela rola dentro da própria caixa. */}
              <div className="overflow-x-auto rounded-[20px] border border-border">
                <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-subtle">
                      <th scope="col" className="px-5 py-4 font-semibold">Nome</th>
                      <th scope="col" className="px-5 py-4 font-semibold">E-mail</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Perfil</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Plano</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.map((user) => (
                      <tr key={user.id} className="border-t border-border">
                        <td className="px-5 py-4 font-semibold">{user.name}</td>
                        <td className="px-5 py-4 text-muted">{user.email}</td>
                        <td className="px-5 py-4">{roleLabel[user.role]}</td>
                        <td className="px-5 py-4">{user.plan?.name ?? '—'}</td>
                        <td className="px-5 py-4 text-muted">
                          {user.planExpiresAt ? formatDate(user.planExpiresAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
