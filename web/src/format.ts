const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 12990 -> "R$ 129,90" */
export function formatPrice(cents: number): string {
  return brl.format(cents / 100);
}

/** Quantos dias faltam até a data (negativo se já passou). */
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const ms = new Date(isoDate).getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
