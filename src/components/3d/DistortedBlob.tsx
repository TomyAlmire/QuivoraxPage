import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import vertexShader from '@/shaders/blob/vertex.glsl';
import fragmentShader from '@/shaders/blob/fragment.glsl';

interface DistortedBlobProps {
  position?: [number, number, number];
  scale?: number;
}

/**
 * Esfera con displacement por ruido (vertex shader), fresnel iridiscente y
 * reacción al puntero. Demuestra: shaders GLSL custom, uniforms animados,
 * interacción con mouse, morphing suave.
 */
export function DistortedBlob({ position = [0, 0, 0], scale = 1 }: DistortedBlobProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const tier = useAppStore((s) => s.quality());

  // Menos subdivisiones en dispositivos flojos (segmentos de la esfera)
  const segments = tier === 'low' ? 96 : tier === 'mid' ? 160 : 256;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistort: { value: 0.42 },
      uFrequency: { value: 1.15 },
      uSpeed: { value: 0.35 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0.55 },
      uColorA: { value: new THREE.Color('#3ddc84') },
      uColorB: { value: new THREE.Color('#6ea8fe') },
      uColorFresnel: { value: new THREE.Color('#eaf2ff') },
      uFresnelPower: { value: 2.6 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value += delta;

    // Puntero suavizado (lerp) desde el store — sin re-render de React
    const { pointer, scroll } = useAppStore.getState();
    const target = mat.uniforms.uPointer.value as THREE.Vector2;
    target.x = THREE.MathUtils.lerp(target.x, pointer.x, 0.06);
    target.y = THREE.MathUtils.lerp(target.y, pointer.y, 0.06);

    // El scroll modula la distorsión y la escala (transición cinematográfica)
    mat.uniforms.uDistort.value = THREE.MathUtils.lerp(0.42, 0.9, scroll);

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      const s = scale * (1 + scroll * 0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02);
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={groupRef} position={position}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1, segments, segments]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}
