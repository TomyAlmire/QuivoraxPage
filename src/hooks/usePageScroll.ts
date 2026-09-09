import { useEffect, useState } from 'react';

interface PageScroll {
  /** progreso 0..1 sobre todo el documento */
  progress: number;
  /** ya se scrolleó lo suficiente como para dejar atrás el hero */
  past: boolean;
}

/**
 * Estado de scroll de la página como valor reactivo. Funciona con o sin Lenis
 * (Lenis scrollea `window`, así que dispara `scroll` igual). Sin rAF.
 */
export function usePageScroll(): PageScroll {
  const [state, setState] = useState<PageScroll>({ progress: 0, past: false });

  useEffect(() => {
    const read = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setState((prev) => {
        const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        const past = y > window.innerHeight * 0.45;
        return Math.abs(prev.progress - progress) > 0.003 || prev.past !== past
          ? { progress, past }
          : prev;
      });
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  return state;
}
