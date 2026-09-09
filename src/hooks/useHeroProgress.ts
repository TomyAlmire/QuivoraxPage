import { useEffect, useState } from 'react';

/**
 * Progreso de salida del "hero" 3D: 0 arriba de todo → 1 cuando ya scrolleaste
 * ~60% de la primera pantalla. Se usa para atenuar el canvas y el HUD, y para
 * apagar el render loop cuando el 3D ya no se ve.
 *
 * Lee `scrollY` directo en el handler (no fuerza reflow) — sin depender de rAF.
 */
export function useHeroProgress(): number {
  const [p, setP] = useState(0);

  useEffect(() => {
    const read = () => {
      const h = window.innerHeight || 1;
      const next = Math.min(1, Math.max(0, window.scrollY / (h * 0.6)));
      setP((prev) => (Math.abs(prev - next) > 0.004 ? next : prev));
    };
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  return p;
}
