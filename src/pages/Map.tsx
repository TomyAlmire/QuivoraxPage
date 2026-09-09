import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapScene } from '@/scenes/MapScene';
import { Loader } from '@/components/ui/Loader';
import { MapOverlay, useMapKeys } from '@/components/ui/MapOverlay';
import { NodePanel } from '@/components/ui/NodePanel';
import { SiteContent } from '@/components/site/SiteContent';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
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
  const away = hero > 0.9;

  // el hero "retrocede" mientras entra el contenido (solo la capa decorativa,
  // no el <Canvas>: aplicarle transform rompe la medición de R3F)
  const ease = hero * hero * (3 - 2 * hero); // smoothstep
  const decorTransform = hero > 0.001 ? `scale(${1 - ease * 0.05}) translateY(${ease * -14}px)` : undefined;

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
    <SmoothScroll>
      <Canvas
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          zIndex: 0,
          opacity: 1 - hero * 0.88,
          pointerEvents: away ? 'none' : 'auto',
        }}
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

      <div
        className={styles.heroDecor}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 1 - hero,
          transform: decorTransform,
          transformOrigin: 'center 42%',
        }}
        aria-hidden
      >
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
      <SiteContent heroProgress={hero} />
    </SmoothScroll>
  );
}
