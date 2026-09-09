import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';
import styles from './Loader.module.css';

/**
 * Overlay de carga (DOM, fuera del Canvas).
 * - El % viene del LoadingManager de three (`useProgress`) — útil cuando la
 *   escena carga modelos/texturas reales.
 * - Se oculta cuando el store marca `ready` (lo hace <SceneReady/> tras el
 *   primer frame), con un mínimo en pantalla para que no parpadee.
 */
export function Loader() {
  const { progress } = useProgress();
  const setProgress = useAppStore((s) => s.setProgress);
  const setReady = useAppStore((s) => s.setReady);
  const ready = useAppStore((s) => s.ready);
  const [hidden, setHidden] = useState(false);
  const shownAt = useRef(performance.now());

  useEffect(() => {
    setProgress(progress / 100);
  }, [progress, setProgress]);

  // Failsafe absoluto: pase lo que pase, nunca dejamos el loader más de 4s
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(t);
  }, [setReady]);

  useEffect(() => {
    if (!ready) return;
    const elapsed = performance.now() - shownAt.current;
    const wait = Math.max(0, 450 - elapsed);
    const t = window.setTimeout(() => setHidden(true), wait);
    return () => window.clearTimeout(t);
  }, [ready]);

  // Progreso mostrado: el real si hay assets cargando, 100 cuando ya está ready
  const shown = ready ? 100 : Math.round(progress);

  return (
    <div className={styles.loader} data-hidden={hidden || undefined} aria-hidden={hidden}>
      <div className={styles.inner}>
        <span className={styles.mark}>Q</span>
        <div className={styles.bar}>
          <i style={{ transform: `scaleX(${shown / 100})` }} />
        </div>
        <span className={styles.pct}>{shown}%</span>
      </div>
    </div>
  );
}
