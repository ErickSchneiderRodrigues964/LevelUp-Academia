import { useEffect, useState } from 'react';

const FRAME_MS = 900;

/**
 * Demonstração do exercício: as duas fotos (posição inicial e final) se
 * alternam em loop. As duas ficam empilhadas e só a opacidade muda, então
 * a troca é suave e não há nova requisição a cada quadro.
 * Quem pediu "reduzir movimento" no sistema vê só a primeira foto.
 */
export function ExerciseAnimation({
  images,
  alt,
  className = '',
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || images.length < 2) return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % images.length), FRAME_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ${className}`}>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={index === 0 ? `Demonstração: ${alt}` : ''}
          aria-hidden={index === 0 ? undefined : true}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
          style={{ opacity: index === frame ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
