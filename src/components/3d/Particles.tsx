import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import vertexShader from '@/shaders/particles/vertex.glsl';
import fragmentShader from '@/shaders/particles/fragment.glsl';

interface ParticlesProps {
  /** Radio de la nube esférica */
  radius?: number;
  color?: string;
  /** Fracción del presupuesto de partículas del dispositivo a usar (0..1) */
  density?: number;
  /** Tamaño base del punto (uniform uSize) */
  size?: number;
}

/**
 * Nube de partículas en shader. El nº de puntos sale de `device.particleBudget`
 * (low ~1.2k / mid ~6k / high ~20k), así que en mobile ya viene limitada.
 */
export function Particles({ radius = 6, color = '#8fb3ff', density = 1, size = 24 }: ParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const budget = useAppStore((s) => s.device.particleBudget);
  const dpr = useThree((s) => s.viewport.dpr);

  const count = Math.max(200, Math.floor(budget * THREE.MathUtils.clamp(density, 0, 1)));

  const { positions, scales, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribución esférica uniforme
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      scales[i] = 0.4 + Math.random() * 1.6;
      seeds[i] = Math.random();
    }
    return { positions, scales, seeds };
  }, [count, radius]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uDrift: { value: 0.7 },
      uColor: { value: new THREE.Color(color) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerRadius: { value: 0.8 },
      uPixelRatio: { value: dpr },
    }),
    [color, dpr, size],
  );

  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value += delta;
    const { pointer } = useAppStore.getState();
    const p = mat.uniforms.uPointer.value as THREE.Vector2;
    p.x = THREE.MathUtils.lerp(p.x, pointer.x, 0.05);
    p.y = THREE.MathUtils.lerp(p.y, pointer.y, 0.05);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
