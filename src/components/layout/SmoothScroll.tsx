import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useAppStore } from '@/store/useAppStore';
import { getDeviceProfile } from '@/lib/device';

const LenisContext = createContext<Lenis | null>(null);

/** Acceso a la instancia de Lenis desde cualquier componente hijo. */
// eslint-disable-next-line react-refresh/only-export-components
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

interface SmoothScrollProps {
  children: ReactNode;
}

/**
 * Scroll suave (Lenis) con inercia/easing en la rueda del mouse. En touch usa
 * el scroll nativo (que en móvil ya es bueno). Publica el progreso en el store.
 * Respeta `prefers-reduced-motion`: ahí no monta Lenis.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const setScroll = useAppStore((s) => s.setScroll);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef(0);
  const { prefersReducedMotion } = useMemo(() => getDeviceProfile(), []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });

    const onScroll = (i: Lenis) => setScroll(Number.isFinite(i.progress) ? i.progress : 0);
    instance.on('scroll', onScroll);

    let killed = false;
    const kill = () => {
      if (killed) return;
      killed = true;
      cancelAnimationFrame(rafRef.current);
      instance.off('scroll', onScroll);
      instance.destroy();
    };

    let ticks = 0;
    const raf = (time: number) => {
      ticks++;
      instance.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    // Guardia: si rAF no corre (tab en 2º plano, WebView raro), Lenis se comería
    // el scroll sin animarlo → página trabada. Ahí volvemos a scroll nativo.
    const guard = window.setTimeout(() => {
      if (ticks < 2) {
        kill();
        setLenis(null);
      }
    }, 1000);

    setLenis(instance);
    if (import.meta.env.DEV) {
      (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    }

    return () => {
      window.clearTimeout(guard);
      kill();
      setLenis(null);
    };
  }, [prefersReducedMotion, setScroll]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
