import { useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';

/**
 * Scope de GSAP atado al ciclo de vida de un componente.
 *
 * Todo lo que crees dentro de `setup` (tweens, timelines, ScrollTriggers)
 * queda dentro de un `gsap.context()` y se limpia solo al desmontar o al
 * cambiar `deps`. `ctx.add(...)` / selectores relativos al `scope` funcionan igual
 * que con `@gsap/react`, sin la dependencia extra.
 *
 * @example
 * const scope = useRef<HTMLDivElement>(null);
 * useGsapScope(scope, (ctx) => {
 *   ctx.add(() => {
 *     gsap.from('.title', { y: 40, opacity: 0, stagger: 0.1 });
 *   });
 * }, []);
 */
export function useGsapScope<T extends HTMLElement>(
  scope: RefObject<T | null>,
  setup: (ctx: gsap.Context) => void,
  deps: DependencyList = [],
): void {
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      setupRef.current(self);
    }, scope.current ?? undefined);
    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
