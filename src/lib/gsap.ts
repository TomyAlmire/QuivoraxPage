/**
 * Punto único de entrada de GSAP.
 *
 * - Registra ScrollTrigger una sola vez.
 * - Exporta `gsap` y `ScrollTrigger` ya configurados.
 * - `connectLenis()` sincroniza Lenis (scroll de la ventana) con el ticker de GSAP
 *   y con ScrollTrigger. Esto es lo que hace que el scroll-driven quede perfecto:
 *   ScrollTrigger.update() en cada frame de Lenis y un único RAF loop.
 *
 * Uso en componentes React: SIEMPRE dentro de `gsap.context()` / `useGsapScope`
 * para que la limpieza sea automática.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power3.out', duration: 1 });

let connected = false;

/**
 * Enlaza una instancia de Lenis (que scrollea `window`) al loop de GSAP.
 * Idempotente: si ya hay una conexión activa devuelve un noop.
 */
export function connectLenis(lenis: Lenis): () => void {
  if (connected) return () => undefined;
  connected = true;

  const onScroll = () => ScrollTrigger.update();
  lenis.on('scroll', onScroll);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  const onRefresh = () => lenis.resize();
  ScrollTrigger.addEventListener('refresh', onRefresh);
  ScrollTrigger.refresh();

  return () => {
    lenis.off('scroll', onScroll);
    gsap.ticker.remove(raf);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    connected = false;
  };
}

export { gsap, ScrollTrigger };
