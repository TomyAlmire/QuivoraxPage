import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapScene } from '@/scenes/MapScene';
import { Loader } from '@/components/ui/Loader';
import { MapOverlay, useMapKeys } from '@/components/ui/MapOverlay';
import { NodePanel } from '@/components/ui/NodePanel';
import { NODES } from '@/data/map';
import { useHashRoute } from '@/hooks/useHashRoute';
import { CANVAS_GL, configureRenderer } from '@/lib/three';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './Map.module.css';

/**
 * El mapa Quivorax: Canvas fijo fullscreen + HUD 2D encima.
 * Navegación por hash (#/sistemas · #/web/web-frontend …).
 */
export function MapPage() {
  const device = useAppStore((s) => s.device);
  const setUserControlled = useMapStore((s) => s.setUserControlled);
  const mode = useMapStore((s) => s.mode);
  const branch = useMapStore((s) => s.branch);
  const node = useMapStore((s) => s.node);

  useHashRoute();
  useMapKeys();

  // cualquier drag/wheel = el usuario toma control de la órbita
  useEffect(() => {
    const grab = () => setUserControlled(true);
    window.addEventListener('pointerdown', grab);
    window.addEventListener('wheel', grab, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', grab);
      window.removeEventListener('wheel', grab);
    };
  }, [setUserControlled]);

  return (
    <>
      <Canvas
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 0 }}
        dpr={[1, device.dprMax]}
        gl={CANVAS_GL}
        camera={{ position: [0, 1, 22], fov: 42, near: 0.1, far: 120 }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => configureRenderer(gl)}
      >
        <Suspense fallback={null}>
          <MapScene />
        </Suspense>
      </Canvas>

      <div className={styles.grain} aria-hidden />
      <div className={styles.vignette} aria-hidden />
      <div className={styles.frame} aria-hidden />
      <div className={styles.frameB} aria-hidden />
      <span className={styles.coord} aria-hidden>
        {mode === 'works'
          ? 'NÚCLEO · TRABAJOS'
          : mode === 'node' && node
            ? `NODO · ${node}`
            : mode === 'branch' && branch
              ? `RAMA · ${branch}`
              : `MAPA · 03 RAMAS · ${NODES.length} NODOS`}
      </span>

      <Loader />
      <MapOverlay />
      <NodePanel />
    </>
  );
}
