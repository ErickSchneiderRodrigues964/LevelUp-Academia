import { Link } from 'react-router';
import type { Plan } from '../api/types';
import { formatPrice } from '../format';

/** Cartão de plano. O destaque inverte as cores, como no design. */
export function PlanCard({ plan, featured = false }: { plan: Plan; featured?: boolean }) {
  return (
    <article
      className={`flex flex-col gap-5 rounded-3xl p-8 ${
        featured ? 'bg-primary text-on-primary' : 'border-[1.5px] border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        {featured && (
          <span className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold text-text">
            MAIS ESCOLHIDO
          </span>
        )}
      </div>

      <p className="font-display text-5xl">
        {formatPrice(plan.priceCents)}
        <span className={`font-body text-base ${featured ? 'text-on-primary/70' : 'text-subtle'}`}>
          {' '}
          /mês
        </span>
      </p>

      <p className={`text-[15px] leading-relaxed ${featured ? 'font-medium' : 'text-muted'}`}>
        {plan.description}
      </p>
      <p className={`text-sm ${featured ? 'text-on-primary/70' : 'text-subtle'}`}>
        {plan.durationMonths === 1 ? 'Sem fidelidade' : `Contrato de ${plan.durationMonths} meses`}
      </p>

      <Link
        to={`/cadastro?plano=${plan.id}`}
        className={`mt-auto rounded-full px-4 py-4 text-center font-bold ${
          featured
            ? 'bg-bg text-text hover:bg-surface'
            : 'border-[1.5px] border-border-strong hover:border-text'
        }`}
      >
        Assinar {plan.name.toLowerCase()}
      </Link>
    </article>
  );
}
