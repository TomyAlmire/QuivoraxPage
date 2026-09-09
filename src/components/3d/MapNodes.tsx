import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { NODES, nodeColor, type MapNode } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';
import { glowTexture } from '@/lib/textures';

/** ¿este nodo está "activo" en el estado actual? */
function nodeActivity(
  node: MapNode,
  mode: string,
  branch: string | null,
  selected: string | null,
  hovered: string | null,
): number {
  if (hovered === node.id) return 1;
  if (mode === 'node') return selected === node.id ? 1 : 0.12;
  if (mode === 'branch') return node.branch === branch || node.kind === 'root' ? 0.85 : 0.14;
  // map / intro
  return node.kind === 'root' ? 1 : 0.6;
}

interface NodeMeshProps {
  node: MapNode;
}

function NodeMesh({ node }: NodeMeshProps) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const glowRef = useRef<THREE.Sprite>(null);

  const color = useMemo(() => new THREE.Color(nodeColor(node)), [node]);
  const glowMap = useMemo(() => glowTexture(), []);
  const baseSize = node.kind === 'root' ? 0.5 : node.kind === 'core' ? 0.34 : node.kind === 'contact' ? 0.26 : 0.2;

  const setHovered = useMapStore((s) => s.setHovered);
  const goNode = useMapStore((s) => s.goNode);

  useFrame((state, delta) => {
    const { mode, branch, node: selected, hovered } = useMapStore.getState();
    const act = nodeActivity(node, mode, branch, selected, hovered);
    const damp = 1 - Math.pow(0.001, delta);

    if (group.current) {
      const target = baseSize * (0.85 + act * 0.5);
      group.current.scale.lerp(new THREE.Vector3(target, target, target), damp);
      // leve flotación
      group.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 0.8 + node.position[0]) * 0.05;
    }
    if (mat.current) {
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, 0.4 + act * 2.6, damp);
      mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, 0.25 + act * 0.75, damp);
    }
    if (glowMat.current) {
      const targetGlow = act * (hovered === node.id ? 0.9 : 0.55);
      glowMat.current.opacity = THREE.MathUtils.lerp(glowMat.current.opacity, targetGlow, damp);
    }
    if (glowRef.current) {
      const pulse = 4.5 + Math.sin(state.clock.elapsedTime * 1.4 + node.position[1]) * 0.4;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(node.id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    setHovered(null);
    document.body.style.cursor = '';
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    goNode(node.id);
  };

  return (
    <group ref={group} position={node.position}>
      <mesh onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          ref={mat}
          color={color}
          emissive={color}
          emissiveIntensity={1}
          roughness={0.35}
          metalness={0}
          transparent
          opacity={0.9}
        />
      </mesh>
      <sprite ref={glowRef} scale={4.5}>
        <spriteMaterial
          ref={glowMat}
          map={glowMap}
          color={color}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

export function MapNodes() {
  return (
    <group>
      {NODES.map((node) => (
        <NodeMesh key={node.id} node={node} />
      ))}
    </group>
  );
}
