import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapScene } from '@/scenes/MapScene';
import { Loader } from '@/components/ui/Loader';
import { MapOverlay, useMapKeys } from '@/components/ui/MapOverlay';
import { NodePanel } from '@/components/ui/NodePanel';
import { SiteContent } from '@/components/site/SiteContent';
import { NODES } from '@/data/map';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useHeroProgress } from '@/hooks/useHeroProgress';
import { useIsMobile } from '@/hooks/useIsMobile';
import { CANVAS_GL, configureRenderer } from '@/lib/three';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';
import styles from './Map.module.css';

/**
 * Página principal: hero 3D fijo (canvas + HUD) y, debajo, el contenido
 * scrolleable del sitio. El 3D se atenúa y se congela al salir del hero.
 */
export function MapPage() {
  const device = useAppStore((s) => s.device);
  const setUserControlled = useMapStore((s) => s.setUserControlled);
  const mode = useMapStore((s) => s.mode);
  const branch = useMapStore((s) => s.branch);
  const node = useMapStore((s) => s.node);
  const isMobile = useIsMobile();
  const hero = useHeroProgress();
  const away = hero > 0.85;

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
      <div
        className={styles.canvasHolder}
        style={{ opacity: 1 - hero * 0.92, pointerEvents: away ? 'none' : undefined }}
        aria-hidden={away}
      >
        <Canvas
          style={{ width: '100%', height: '100%' }}
          dpr={[1, device.dprMax]}
          gl={CANVAS_GL}
          frameloop={away ? 'demand' : 'always'}
          camera={{ position: [0, 1, 22], fov: isMobile ? 55 : 42, near: 0.1, far: 120 }}
          resize={{ scroll: false }}
          onCreated={({ gl }) => configureRenderer(gl)}
        >
          <Suspense fallback={null}>
            <MapScene />
          </Suspense>
        </Canvas>
      </div>

      <div className={styles.heroDecor} style={{ opacity: 1 - hero }} aria-hidden>
        <div className={styles.grain} />
        <div className={styles.vignette} />
        <div className={styles.frame} />
        <div className={styles.frameB} />
        <span className={styles.coord}>
          {mode === 'node' && node
            ? `NODO · ${node}`
            : mode === 'branch' && branch
              ? `RAMA · ${branch}`
              : `MAPA · 03 RAMAS · ${NODES.length} NODOS`}
        </span>
      </div>

      <Loader />
      <MapOverlay heroProgress={hero} />
      <NodePanel heroProgress={hero} />
      <SiteContent />
    </>
  );
}
