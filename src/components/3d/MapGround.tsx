import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { useAppStore } from '@/store/useAppStore';

/**
 * "Piso" bajo la constelación: da peso y realismo.
 * - mid/high: plano espejo (MeshReflectorMaterial) → refleja los nodos.
 * - low / reduced-motion: plano mate (sin pasada extra), mismo encuadre.
 * - ContactShadows en todos los tiers: sombra blanda que apoya el grafo
 *   (horneada en los primeros frames, `frames`, así no cuesta por frame).
 */
const GROUND_Y = -5.4;

export function MapGround() {
  const live = useAppStore((s) => s.device.liveReflections);
  const tier = useAppStore((s) => s.quality());

  return (
    <group position={[0, GROUND_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[140, 140]} />
        {live ? (
          <MeshReflectorMaterial
            resolution={tier === 'high' ? 1024 : 512}
            mirror={tier === 'high' ? 0.55 : 0.4}
            mixStrength={tier === 'high' ? 1.1 : 0.8}
            blur={tier === 'high' ? [400, 120] : [0, 0]}
            mixBlur={tier === 'high' ? 1 : 0}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            roughness={0.85}
            metalness={0.45}
            color="#05070c"
          />
        ) : (
          <meshStandardMaterial color="#05070c" roughness={0.55} metalness={0.35} envMapIntensity={0.5} />
        )}
      </mesh>

      <ContactShadows
        position={[0, 0.02, 0]}
        scale={28}
        resolution={tier === 'low' ? 256 : 512}
        blur={2.6}
        opacity={0.55}
        far={13}
        frames={90}
        color="#000308"
      />
    </group>
  );
}
