import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EDGES, NODE_BY_ID, nodeColor } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';

/**
 * Aristas del grafo como un único LineSegments (barato). Cada segmento lleva el
 * color de su rama; la intensidad reacciona a la rama activa / hover.
 */
export function MapEdges() {
  const geomRef = useRef<THREE.BufferGeometry>(null);

  const { positions, baseColors, edgeMeta } = useMemo(() => {
    const positions = new Float32Array(EDGES.length * 6);
    const baseColors = new Float32Array(EDGES.length * 6);
    const c = new THREE.Color();
    const edgeMeta = EDGES.map(([a, b], i) => {
      const na = NODE_BY_ID[a];
      const nb = NODE_BY_ID[b];
      positions.set([...na.position, ...nb.position], i * 6);
      const contact = na.kind === 'contact' || nb.kind === 'contact';
      // color = dorado si toca el CTA; si no, el de la rama (o gris para root-root)
      const owner = na.branch ?? nb.branch;
      c.set(contact ? '#ffd27a' : owner ? nodeColor(na.branch ? na : nb) : '#8ea3c8');
      for (let v = 0; v < 6; v += 3) {
        baseColors[i * 6 + v] = c.r;
        baseColors[i * 6 + v + 1] = c.g;
        baseColors[i * 6 + v + 2] = c.b;
      }
      return { a: na, b: nb, contact };
    });
    return { positions, baseColors, edgeMeta };
  }, []);

  const colors = useMemo(() => new Float32Array(EDGES.length * 6), []);
  const intensity = useMemo(() => new Float32Array(EDGES.length), []);

  useFrame((state, delta) => {
    const geom = geomRef.current;
    if (!geom) return;
    const { mode, branch, hovered } = useMapStore.getState();
    const damp = 1 - Math.pow(0.02, delta);

    edgeMeta.forEach((e, i) => {
      const touchesBranch =
        e.a.branch === branch || e.b.branch === branch || e.a.kind === 'root' || e.b.kind === 'root';
      const touchesHover = hovered && (e.a.id === hovered || e.b.id === hovered);

      let target = 0.35;
      if (mode === 'branch') target = touchesBranch ? 1 : 0.1;
      if (mode === 'node') target = touchesHover || e.a.branch === branch ? 0.85 : 0.08;
      if (e.contact) {
        // el hilo al CTA late suave y nunca se apaga del todo
        target = mode === 'node' ? 0.12 : 0.7 + Math.sin(state.clock.elapsedTime * 1.6) * 0.28;
      }
      if (touchesHover) target = 1.4;

      intensity[i] = THREE.MathUtils.lerp(intensity[i], target, damp);
      const k = intensity[i];
      for (let v = 0; v < 6; v++) {
        colors[i * 6 + v] = baseColors[i * 6 + v] * k;
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
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
