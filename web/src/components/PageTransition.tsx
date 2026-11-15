import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router';

/**
 * Envolve as rotas: a cada troca de página, o conteúdo entra com uma
 * animação curta e a rolagem volta ao topo.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  // Só o caminho importa: clicar em "#planos" muda o endereço, mas não a página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // A "key" faz o React recriar este elemento a cada página, e é isso
  // que dispara a animação de entrada de novo.
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
