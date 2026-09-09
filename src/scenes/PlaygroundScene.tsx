import { lazy, Suspense } from 'react';
import { Environment, Lightformer, ContactShadows, Sparkles, AdaptiveDpr, AdaptiveEvents, BakeShadows } from '@react-three/drei';
import { DistortedBlob } from '@/components/3d/DistortedBlob';
import { Particles } from '@/components/3d/Particles';
import { Lights } from '@/components/3d/Lights';
import { Rig } from '@/components/3d/Rig';
import { Effects } from '@/components/3d/Effects';
import { SceneReady } from '@/components/3d/SceneReady';
import { useAppStore } from '@/store/useAppStore';

const DebugPerf = import.meta.env.DEV
  ? lazy(() => import('@/components/ui/Debug').then((m) => ({ default: m.DebugPerf })))
  : () => null;

/**
 * Escena de verificación del entorno. Toca todas las piezas:
 * cámara + rig, luces, environment procedural (sin fetch), shadows,
 * shader displacement + mouse, partículas en shader, sparkles,
 * y postprocessing (Bloom + Vignette + Chromatic Aberration).
 *
 * El scroll llega vía `store.scroll` (Lenis) y lo leen el blob y el rig.
 */
export function PlaygroundScene() {
  const tier = useAppStore((s) => s.quality());

  return (
    <>
      <color attach="background" args={['#05070a']} />
      <fog attach="fog" args={['#05070a', 8, 22]} />

      <Rig strength={0.7} scrollDolly={2.4} />
      <Lights />

      {/* Environment procedural: reflejos sin descargar HDRs */}
      <Environment resolution={tier === 'low' ? 128 : 256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 3.5, -5]} scale={[10, 5, 1]} color="#acc7ff" />
        <Lightformer form="circle" intensity={3} position={[4, 1.5, 4]} scale={4} color="#fff1de" />
        <Lightformer form="ring" intensity={1.6} position={[-5, -1, 3]} scale={5} color="#3ddc84" />
      </Environment>

      <Suspense fallback={null}>
        <DistortedBlob position={[0, 0, 0]} scale={1.35} />
        <SceneReady />
      </Suspense>

      <Particles radius={7} density={tier === 'low' ? 0.5 : 1} />

      {tier !== 'low' && (
        <Sparkles count={tier === 'high' ? 120 : 60} scale={9} size={2} speed={0.3} color="#cfe0ff" />
      )}

      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.5}
        scale={12}
        blur={2.6}
        far={4}
        resolution={tier === 'low' ? 256 : 512}
        color="#04121b"
      />

      <Effects bloom vignette chromaticAberration bloomIntensity={0.85} />

      {/* Gestión automática de carga en dispositivos que sufren */}
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      {tier === 'low' && <BakeShadows />}

      <Suspense fallback={null}>
        <DebugPerf />
      </Suspense>
    </>
  );
}
