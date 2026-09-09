import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from '@/lib/gsap';
import { useMapStore } from '@/store/useMapStore';
import { useAppStore } from '@/store/useAppStore';
import { NODES, NODE_BY_ID, branchCenter, type BranchId } from '@/data/map';

/**
 * Cámara del mapa. Máquina de estados intro→map→branch→node: cada modo define
 * una posición y un punto de mira objetivo; GSAP interpola entre ellos y en
 * cada frame se aplica con damping + parallax de puntero + órbita idle.
 */
export function MapCamera() {
  const { camera } = useThree();
  const finishIntro = useMapStore((s) => s.finishIntro);

  const targetPos = useRef(new THREE.Vector3(0, 1, 22));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const orbit = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const current = useMemo(() => ({ look: new THREE.Vector3(0, 0, 0) }), []);

  useEffect(() => {
    const apply = (mode: string, branch: BranchId | null, node: string | null) => {
      tlRef.current?.kill();
      const tl = gsap.timeline({ defaults: { duration: 1.25, ease: 'power3.inOut', overwrite: 'auto' } });
      tlRef.current = tl;

      let pos: [number, number, number] = [0, 0.6, 13.5];
      let look: [number, number, number] = [0, 0, 0];

      if (mode === 'intro') {
        pos = [0, 0.6, 13.5];
        tl.add(() => finishIntro(), 2.1);
      } else if (mode === 'works') {
        // acercamos al núcleo; la galería tapa casi todo, pero da profundidad
        pos = [0.6, 0.2, 6];
        look = [0, 0, 0];
      } else if (mode === 'node' && node && NODE_BY_ID[node]) {
        const p = NODE_BY_ID[node].position;
        pos = [p[0] + 1.7, p[1] + 1, p[2] + 3.3];
        look = [p[0], p[1], p[2]];
      } else if (mode === 'branch' && branch) {
        const c = branchCenter(branch);
        // encuadre según qué tan lejos llegan los nodos de esa rama (web tiene
        // trabajos en un arco externo, ocupa más).
        let maxR = 2;
        for (const n of NODES) {
          if (n.branch !== branch) continue;
          maxR = Math.max(maxR, Math.hypot(n.position[0] - c.x, n.position[1] - c.y));
        }
        const off = c.clone().setLength(3.4);
        pos = [c.x + off.x * 0.4, c.y + off.y * 0.4 + 1.2, Math.max(6.6, maxR * 2.1 + 2.6)];
        look = [c.x, c.y, c.z];
      }

      tl.to(targetPos.current, { x: pos[0], y: pos[1], z: pos[2] }, 0);
      tl.to(targetLook.current, { x: look[0], y: look[1], z: look[2] }, 0);
    };

    const s0 = useMapStore.getState();
    apply(s0.mode, s0.branch, s0.node);

    return useMapStore.subscribe((s, prev) => {
      if (s.mode !== prev.mode || s.branch !== prev.branch || s.node !== prev.node) {
        apply(s.mode, s.branch, s.node);
      }
    });
  }, [finishIntro]);

  useFrame((_, delta) => {
    const { mode, userControlled } = useMapStore.getState();
    const pointer = useAppStore.getState().pointer;
    const damp = 1 - Math.pow(0.0025, delta);
    const isMapLike = mode === 'map' || mode === 'intro';

    if (isMapLike && !userControlled) orbit.current += delta * 0.06;

    const radius = Math.hypot(targetPos.current.x, targetPos.current.z);
    const wantX = isMapLike ? Math.sin(orbit.current) * radius : targetPos.current.x;
    const wantZ = isMapLike ? Math.cos(orbit.current) * radius : targetPos.current.z;

    const px = pointer.x * (mode === 'node' ? 0.25 : 0.9);
    const py = pointer.y * (mode === 'node' ? 0.15 : 0.5);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, wantX + px, damp);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetPos.current.y + py, damp);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, wantZ, damp);

    current.look.lerp(targetLook.current, damp);
    camera.lookAt(current.look);
  });

  return null;
}
