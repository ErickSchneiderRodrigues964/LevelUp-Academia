import { useEffect, useState } from 'react';
import { onSlowChange } from '../api/client';

/**
 * A API fica num servidor gratuito que "dorme" sem uso e leva até um minuto
 * para acordar. Em vez de deixar a tela parada, avisamos o que está havendo.
 */
export function WakingNotice() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    onSlowChange(setSlow);
    return () => onSlowChange(null);
  }, []);

  if (!slow) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-on-primary"
    >
      Acordando o servidor… A primeira resposta pode levar até um minuto.
    </div>
  );
}
