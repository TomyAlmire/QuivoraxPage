import { useEffect, useState } from 'react';

/**
 * Progreso de salida del "hero" 3D: 0 arriba de todo → 1 cuando ya scrolleaste
 * ~70% de la primera pantalla. Se usa para atenuar el canvas y el HUD, y para
 * apagar el render loop cuando el 3D ya no se ve.
 *
 * Listener de scroll con throttle por rAF (barato). Funciona con o sin Lenis.
 */
export function useHeroProgress(): number {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const h = window.innerHeight || 1;
      const next = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
      setP((prev) => (Math.abs(prev - next) > 0.004 ? next : prev));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return p;
}
