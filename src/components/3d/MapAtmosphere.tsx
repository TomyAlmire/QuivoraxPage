import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRANCHES, branchCenter } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';
import { glowTexture, bgGradientTexture } from '@/lib/textures';

/** Fondo: esfera invertida con degradé + nebulosas + estrellas, girando muy despacio. */
function GradientBackdrop() {
  const map = useMemo(() => bgGradientTexture(), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.004;
  });
  return (
    <mesh ref={ref} scale={60} renderOrder={-10}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

/** Rejilla radial tipo "radar" en el plano, muy tenue, girando despacio. */
function RadarGrid() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    // anillos concéntricos
    for (let r = 2; r <= 14; r += 2) {
      const segs = 96;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        positions.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
      }
    }
    // radios
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
        <lineBasicMaterial color="#3a5a8a" transparent opacity={0.09} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/** Aura de color por rama: se intensifica cuando esa rama está enfocada. */
function BranchAuras() {
  const map = useMemo(() => glowTexture(), []);
  const refs = useRef<Record<string, THREE.SpriteMaterial | null>>({});

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
      let target = mode === 'map' || mode === 'intro' ? 0.16 : 0.06;
      if (mode === 'branch' && branch === id) target = 0.4;
      if (mode === 'node' && branch === id) target = 0.28;
      target *= 1 + Math.sin(state.clock.elapsedTime * 0.6 + id.length) * 0.15;
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
      {/* aura central */}
      <sprite position={[0, 0, -0.6]} scale={14}>
        <spriteMaterial map={map} color="#4a6bd8" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

export function MapAtmosphere() {
  // La rejilla es un único lineSegments (~1.4k vértices, 1 draw call): barata,
  // se deja también en mobile para no perder el "piso" de referencia.
  return (
    <>
      <GradientBackdrop />
      <BranchAuras />
      <RadarGrid />
    </>
  );
}
