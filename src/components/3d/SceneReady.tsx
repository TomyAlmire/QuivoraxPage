import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/store/useAppStore';

/**
 * Marca `ready` en el store una vez que la escena montó y se pintó el primer
 * frame (todo lo que estaba en <Suspense> ya resolvió). Va como último hijo
 * del <Suspense> de la escena.
 */
export function SceneReady() {
  const invalidate = useThree((s) => s.invalidate);
  const setReady = useAppStore((s) => s.setReady);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
      invalidate();
    };
    // Preferimos esperar dos frames reales...
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(finish);
    });
    // ...pero si rAF está pausado (pestaña en segundo plano) no bloqueamos el arranque
    const fallback = window.setTimeout(finish, 1200);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(fallback);
    };
  }, [setReady, invalidate]);

  return null;
}
