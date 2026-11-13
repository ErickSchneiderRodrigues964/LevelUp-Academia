type LogoProps = {
  /** Altura do ícone em pixels; o texto acompanha. */
  size?: number;
  /** Mostra só o ícone, sem o nome ao lado. */
  iconOnly?: boolean;
};

/** Ícone da marca: três barras subindo, a última em forma de seta. */
export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <rect x="11" y="38" width="10" height="15" rx="2" className="fill-on-primary" />
      <rect x="27" y="28" width="10" height="25" rx="2" className="fill-on-primary" />
      <path d="M43 53V24h-3.5L48 11l8.5 13H53v29Z" className="fill-on-primary" />
    </svg>
  );
}

export function Logo({ size = 32, iconOnly = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-3" role="img" aria-label="Level Up">
      <LogoIcon size={size} />
      {!iconOnly && (
        <span
          aria-hidden="true"
          className="font-display tracking-[2px] leading-none"
          style={{ fontSize: size }}
        >
          LEVEL <span className="text-primary">UP</span>
        </span>
      )}
    </span>
  );
}
