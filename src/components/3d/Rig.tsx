import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

interface RigProps {
  /** Cuánto se desplaza la cámara con el puntero */
  strength?: number;
  /** Cuánto retrocede la cámara con el scroll (dolly) */
  scrollDolly?: number;
  lookAt?: [number, number, number];
}

/**
 * Movimiento de cámara: parallax suave con el puntero + dolly con el scroll.
 * Todo por lerp dentro de useFrame (frame-rate independiente vía damping).
 */
export function Rig({ strength = 0.6, scrollDolly = 2.2, lookAt = [0, 0, 0] }: RigProps) {
  const target = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3(...lookAt));
  const { camera } = useThree();
  const baseZ = useRef(camera.position.z);

  useFrame((_, delta) => {
    const { pointer, scroll } = useAppStore.getState();
    const damp = 1 - Math.pow(0.0018, delta); // ~suave e independiente de FPS

    target.current.set(pointer.x * strength, pointer.y * strength * 0.6, baseZ.current + scroll * scrollDolly);

    camera.position.lerp(target.current, damp);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
