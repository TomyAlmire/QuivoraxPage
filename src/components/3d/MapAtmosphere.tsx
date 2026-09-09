import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRANCHES, branchCenter } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';
import { useAppStore } from '@/store/useAppStore';
import { glowTexture, bgGradientTexture, bgSimpleTexture } from '@/lib/textures';

/** Fondo: esfera invertida con degradé, girando muy despacio. */
function GradientBackdrop({ lite }: { lite: boolean }) {
  const map = useMemo(() => (lite ? bgSimpleTexture() : bgGradientTexture()), [lite]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.004;
  });
  return (
    <mesh ref={ref} scale={60} renderOrder={-10}>
      <sphereGeometry args={[1, lite ? 24 : 48, lite ? 24 : 48]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

/** Rejilla radial tipo "radar" en el plano, muy tenue, girando despacio. */
function RadarGrid() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (let r = 2; r <= 14; r += 2) {
      const segs = 96;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        positions.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      positions.push(0, 0, 0, Math.cos(a) * 14, Math.sin(a) * 14, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.02;
  });

  return (
    <group ref={group} position={[0, 0, -1.2]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#4d80b4" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/** Aura de color por rama: se intensifica cuando esa rama está enfocada. */
function BranchAuras({ lite }: { lite: boolean }) {
  const map = useMemo(() => glowTexture(), []);
  const refs = useRef<Record<string, THREE.SpriteMaterial | null>>({});
  const k = lite ? 0.55 : 1;

  const centers = useMemo(
    () => BRANCHES.map((b) => ({ id: b.id, color: b.color, c: branchCenter(b.id) })),
    [],
  );

  useFrame((state, delta) => {
    const { mode, branch } = useMapStore.getState();
    const damp = 1 - Math.pow(0.05, delta);
    for (const { id } of centers) {
      const m = refs.current[id];
      if (!m) continue;
      let target = mode === 'map' || mode === 'intro' ? 0.09 : 0.04;
      if (mode === 'branch' && branch === id) target = 0.22;
      if (mode === 'node' && branch === id) target = 0.14;
      target *= k * (1 + Math.sin(state.clock.elapsedTime * 0.6 + id.length) * 0.15);
      m.opacity = THREE.MathUtils.lerp(m.opacity, target, damp);
    }
  });

  return (
    <>
      {centers.map(({ id, color, c }) => (
        <sprite key={id} position={[c.x, c.y, c.z - 0.5]} scale={11}>
          <spriteMaterial
            ref={(r) => {
              refs.current[id] = r;
            }}
            map={map}
            color={color}
            transparent
            opacity={0.15}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
      {!lite && (
        <sprite position={[0, 0, -0.6]} scale={14}>
          <spriteMaterial map={map} color="#4a6bd8" transparent opacity={0.055} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
    </>
  );
}

export function MapAtmosphere() {
  const lite = useAppStore((s) => s.device.lite);
  return (
    <>
      <GradientBackdrop lite={lite} />
      <BranchAuras lite={lite} />
      {!lite && <RadarGrid />}
    </>
  );
}
