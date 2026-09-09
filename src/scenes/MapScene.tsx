import { lazy, Suspense } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { MapNodes } from '@/components/3d/MapNodes';
import { MapEdges } from '@/components/3d/MapEdges';
import { MapAtmosphere } from '@/components/3d/MapAtmosphere';
import { MapGround } from '@/components/3d/MapGround';
import { MapCamera } from '@/components/3d/MapCamera';
import { Particles } from '@/components/3d/Particles';
import { Effects } from '@/components/3d/Effects';
import { SceneReady } from '@/components/3d/SceneReady';
import { useAppStore } from '@/store/useAppStore';
import { useMapStore } from '@/store/useMapStore';

const DebugPerf = import.meta.env.DEV
  ? lazy(() => import('@/components/ui/Debug').then((m) => ({ default: m.DebugPerf })))
  : () => null;

/** Plano invisible detrás de todo: click en el vacío = un nivel hacia atrás. */
function Backdrop() {
  const goMap = useMapStore((s) => s.goMap);
  const goBranch = useMapStore((s) => s.goBranch);
  return (
    <mesh
      position={[0, 0, -6]}
      onClick={(e) => {
        e.stopPropagation();
        const { mode, branch } = useMapStore.getState();
        if (mode === 'node' && branch) goBranch(branch);
        else goMap();
      }}
    >
      <planeGeometry args={[120, 120]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export function MapScene() {
  const tier = useAppStore((s) => s.quality());

  return (
    <>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#070c16', 16, 46]} />

      <MapCamera />

      {/* Luz: ambiente bajo + hemisférico (cielo/piso) + key cálida + relleno frío. */}
      <ambientLight intensity={0.32} />
      <hemisphereLight args={['#9fb8ff', '#0a0f1a', 0.4]} />
      <directionalLight position={[6, 9, 7]} intensity={0.85} color="#fff2e0" />
      <directionalLight position={[-8, 3, -6]} intensity={0.45} color="#5b7cff" />
      <Environment resolution={tier === 'low' ? 128 : 256}>
        <Lightformer form="rect" intensity={0.9} position={[0, 4, -6]} scale={[12, 6, 1]} color="#9fb8ff" />
        <Lightformer form="circle" intensity={1.2} position={[5, -2, 4]} scale={5} color="#3ddc84" />
        <Lightformer form="circle" intensity={1} position={[-5, 1, 3]} scale={5} color="#b39dff" />
      </Environment>

      <MapAtmosphere />

      <Suspense fallback={null}>
        <Backdrop />
        <MapGround />
        <MapEdges />
        <MapNodes />
        <SceneReady />
      </Suspense>

      <Particles radius={18} color="#7d93c8" density={tier === 'low' ? 0.6 : 0.85} />

      <Effects bloom vignette colorGrade bloomIntensity={0.42} />

      <Suspense fallback={null}>
        <DebugPerf />
      </Suspense>
    </>
  );
}
