import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EDGES, NODE_BY_ID } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';

/**
 * Aristas del grafo como un único LineSegments (barato). El color/opacidad de
 * cada segmento se actualiza por-vertex según la rama activa.
 */
export function MapEdges() {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  const { positions, edgeMeta } = useMemo(() => {
    const positions = new Float32Array(EDGES.length * 6);
    const edgeMeta = EDGES.map(([a, b], i) => {
      const na = NODE_BY_ID[a];
      const nb = NODE_BY_ID[b];
      positions.set([...na.position, ...nb.position], i * 6);
      return { a: na, b: nb };
    });
    return { positions, edgeMeta };
  }, []);

  const colors = useMemo(() => new Float32Array(EDGES.length * 6), []);

  useFrame((_, delta) => {
    const geom = geomRef.current;
    if (!geom) return;
    const { mode, branch, hovered } = useMapStore.getState();
    const damp = 1 - Math.pow(0.01, delta);

    edgeMeta.forEach((e, i) => {
      const touchesBranch =
        e.a.branch === branch || e.b.branch === branch || e.a.kind === 'root' || e.b.kind === 'root';
      const touchesHover = hovered && (e.a.id === hovered || e.b.id === hovered);

      let target = 0.16;
      if (mode === 'branch') target = touchesBranch ? 0.5 : 0.05;
      if (mode === 'node') target = touchesHover || e.a.branch === branch ? 0.4 : 0.04;
      if (touchesHover) target = 0.75;

      for (let v = 0; v < 6; v++) {
        const idx = i * 6 + v;
        colors[idx] = THREE.MathUtils.lerp(colors[idx] || 0, target, damp);
      }
    });

    const attr = geom.getAttribute('color') as THREE.BufferAttribute;
    attr.array.set(colors);
    attr.needsUpdate = true;
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
