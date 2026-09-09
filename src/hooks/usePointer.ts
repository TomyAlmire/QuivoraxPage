import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

/**
 * Escribe el puntero normalizado (-1..1, y hacia arriba) en el store global.
 * Montar una sola vez (en App). El suavizado/lerp lo hace cada consumidor
 * en su propio `useFrame` para no acoplar la velocidad de interpolación.
 */
export function usePointerTracking(): void {
  const setPointer = useAppStore((s) => s.setPointer);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);
    };
    // Reset suave al salir de la ventana
    const onLeave = () => setPointer(0, 0);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [setPointer]);
}
