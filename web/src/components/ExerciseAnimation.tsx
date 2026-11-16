import { useEffect, useState } from 'react';

// Cada posição fica parada um tempo e depois a foto seguinte surge devagar:
// a pausa deixa ver a postura, a transição lenta sugere o movimento.
const HOLD_MS = 1100;
const FADE_MS = 700;

const LABELS = ['Início', 'Fim'];

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Demonstração do exercício: as duas fotos (posição inicial e final) se
 * alternam em loop. As duas ficam empilhadas e só a opacidade muda, então
 * não há nova requisição a cada quadro.
 * Quem pediu "reduzir movimento" no sistema começa pausado, na primeira foto.
 * `controls` mostra o botão de pausar e o rótulo da posição (use no detalhe).
 */
export function ExerciseAnimation({
  images,
  alt,
  className = '',
  controls = false,
}: {
  images: string[];
  alt: string;
  className?: string;
  controls?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);

  useEffect(() => {
    if (paused || images.length < 2) return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % images.length), HOLD_MS + FADE_MS);
    return () => clearInterval(timer);
  }, [paused, images.length]);

  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ${className}`}>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === 0 ? `Demonstração: ${alt}` : ''}
          aria-hidden={index === 0 ? undefined : true}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            opacity: index === frame ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}
      {controls && images.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-primary">
            {LABELS[frame] ?? ''}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Reproduzir animação' : 'Pausar animação'}
            className="min-h-11 min-w-11 rounded-full bg-black/70 text-sm font-bold text-text hover:bg-black"
          >
            {paused ? '▶' : '❚❚'}
          </button>
        </div>
      )}
    </div>
  );
}
