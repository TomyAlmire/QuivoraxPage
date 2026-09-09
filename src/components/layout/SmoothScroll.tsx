import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { connectLenis, ScrollTrigger } from '@/lib/gsap';
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
 * Provee scroll suave (Lenis) sincronizado con GSAP/ScrollTrigger y publica el
 * progreso global en el store (`state.scroll`, 0..1).
 *
 * - Un único RAF loop (el de GSAP) mueve Lenis.
 * - Respeta `prefers-reduced-motion` (desactiva el smoothing).
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const setScroll = useAppStore((s) => s.setScroll);
  const { prefersReducedMotion } = useMemo(() => getDeviceProfile(), []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion,
      syncTouch: false,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const disconnect = connectLenis(lenis);

    const onScroll = (instance: Lenis) => {
      const p = instance.progress;
      setScroll(Number.isFinite(p) ? p : 0);
    };
    lenis.on('scroll', onScroll);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      lenis.off('scroll', onScroll);
      disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion, setScroll]);

  return <LenisContext.Provider value={lenisRef.current}>{children}</LenisContext.Provider>;
}
