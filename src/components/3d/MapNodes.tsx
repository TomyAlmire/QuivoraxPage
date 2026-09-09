import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { NODES, nodeColor, type MapNode } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';
import { glowTexture } from '@/lib/textures';

/** ¿este nodo está "activo" en el estado actual? 0..1 */
function nodeActivity(
  node: MapNode,
  mode: string,
  branch: string | null,
  selected: string | null,
  hovered: string | null,
): number {
  if (hovered === node.id) return 1;
  if (mode === 'node') return selected === node.id ? 1 : 0.1;
  if (mode === 'branch') return node.branch === branch || node.kind === 'root' ? 0.9 : 0.12;
  if (node.kind === 'root') return 1;
  if (node.kind === 'contact') return 0.92; // el CTA "Trabajemos" siempre destaca
  return 0.62;
}

/** ¿mostrar la etiqueta de texto de este nodo? */
function labelVisibility(node: MapNode, mode: string, branch: string | null, hovered: string | null): number {
  if (hovered === node.id) return 1;
  if (node.kind === 'root') return mode === 'map' || mode === 'intro' ? 0.9 : 0;
  if (node.kind === 'contact') {
    if (mode === 'map' || mode === 'intro') return 1;
    if (mode === 'branch') return 0.55;
    return 0;
  }
  if (node.kind === 'core') {
    if (mode === 'map' || mode === 'intro') return 0.85;
    if (mode === 'branch') return node.branch === branch ? 1 : 0;
    return 0;
  }
  // leaf: solo cuando su rama está enfocada
  if (mode === 'branch' && node.branch === branch) return 0.8;
  return 0;
}

function NodeMesh({ node }: { node: MapNode }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ping = useRef<THREE.Mesh>(null);
  const pingMat = useRef<THREE.MeshBasicMaterial>(null);
  const labelWrap = useRef<HTMLDivElement>(null);

  const color = useMemo(() => new THREE.Color(nodeColor(node)), [node]);
  const colorHex = useMemo(() => `#${color.getHexString()}`, [color]);
  const glowMap = useMemo(() => glowTexture(), []);

  const isContact = node.kind === 'contact';
  const baseSize =
    node.kind === 'root' ? 0.52 : node.kind === 'core' ? 0.36 : isContact ? 0.3 : 0.19;
  const showRing = node.kind === 'root' || node.kind === 'core' || isContact;

  const setHovered = useMapStore((s) => s.setHovered);
  const goNode = useMapStore((s) => s.goNode);

  useFrame((state, delta) => {
    const { mode, branch, node: selected, hovered } = useMapStore.getState();
    const act = nodeActivity(node, mode, branch, selected, hovered);
    const damp = 1 - Math.pow(0.0015, delta);
    const t = state.clock.elapsedTime;

    if (outer.current) {
      outer.current.position.y = node.position[1] + Math.sin(t * 0.7 + node.position[0]) * 0.06;
      outer.current.position.x = node.position[0] + Math.cos(t * 0.5 + node.position[1]) * 0.04;
    }
    if (inner.current) {
      const s = baseSize * (0.8 + act * 0.55);
      inner.current.scale.lerp(new THREE.Vector3(s, s, s), damp);
    }
    if (mat.current) {
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, 0.5 + act * 3, damp);
      mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, 0.3 + act * 0.7, damp);
    }
    if (glowMat.current) {
      const target = 0.12 + act * (hovered === node.id ? 0.85 : 0.5);
      glowMat.current.opacity = THREE.MathUtils.lerp(glowMat.current.opacity, target, damp);
    }
    if (ring.current && ringMat.current) {
      ring.current.rotation.z = t * (node.kind === 'root' ? 0.25 : 0.5) * (node.position[0] > 0 ? 1 : -1);
      const rt = showRing ? 0.1 + act * 0.55 : 0;
      ringMat.current.opacity = THREE.MathUtils.lerp(ringMat.current.opacity, rt, damp);
      const rs = (node.kind === 'root' ? 1.5 : 1.05) + Math.sin(t * 1.2 + node.position[1]) * 0.06;
      ring.current.scale.setScalar(rs);
    }
    // "ping" del CTA: anillo que se expande y se desvanece en loop
    if (ping.current && pingMat.current) {
      const cyc = (t * 0.5) % 1;
      ping.current.scale.setScalar(1 + cyc * 2.6);
      pingMat.current.opacity = mode === 'node' ? 0 : (1 - cyc) * (1 - cyc) * 0.55;
    }
    if (labelWrap.current) {
      const lv = labelVisibility(node, mode, branch, hovered);
      const cur = Number(labelWrap.current.dataset.o ?? '0');
      const next = THREE.MathUtils.lerp(cur, lv, 1 - Math.pow(0.02, delta));
      labelWrap.current.dataset.o = String(next);
      labelWrap.current.style.opacity = String(next);
      labelWrap.current.style.transform = `translate(-50%,-50%) translateY(${(1 - next) * 6}px)`;
      labelWrap.current.style.pointerEvents = next > 0.5 ? 'auto' : 'none';
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
    <group ref={outer} position={node.position}>
      <group ref={inner} scale={baseSize}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            ref={mat}
            color={color}
            emissive={color}
            emissiveIntensity={1}
            roughness={0.16}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.35}
            envMapIntensity={1.5}
            transparent
            opacity={0.92}
          />
        </mesh>
        {/* núcleo interior brillante */}
        <mesh scale={0.55}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      </group>

      {/* zona de toque ampliada (mobile): invisible pero sí recibe raycast */}
      <mesh onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <sphereGeometry args={[baseSize + 0.34, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showRing && (
        <Billboard>
          <mesh ref={ring} scale={node.kind === 'root' ? 1.5 : 1.05}>
            <ringGeometry args={[0.9, 0.96, 64]} />
            <meshBasicMaterial
              ref={ringMat}
              color={color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      )}

      {isContact && (
        <Billboard>
          <mesh ref={ping} scale={1}>
            <ringGeometry args={[0.82, 0.99, 48]} />
            <meshBasicMaterial
              ref={pingMat}
              color={color}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      )}

      <sprite
        scale={
          node.kind === 'root' ? 7.5 : node.kind === 'core' ? 5.2 : isContact ? 5 : 4
        }
      >
        <spriteMaterial
          ref={glowMat}
          map={glowMap}
          color={color}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <Html position={[0, baseSize + 0.55, 0]} center distanceFactor={9} zIndexRange={[20, 0]} occlude={false}>
        <div
          ref={labelWrap}
          data-o="0"
          style={{
            opacity: 0,
            transform: 'translate(-50%,-50%)',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: node.kind === 'root' ? 13 : 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: node.kind === 'root' ? '#e9eef3' : colorHex,
            textShadow: '0 1px 12px rgba(0,0,0,0.9)',
            userSelect: 'none',
          }}
        >
          {isContact ? (
            <span
              onClick={() => goNode(node.id)}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 999,
                border: `1px solid ${colorHex}`,
                background: 'rgba(255,210,122,0.14)',
                boxShadow: `0 0 18px -2px ${colorHex}`,
                backdropFilter: 'blur(3px)',
              }}
            >
              {node.label} →
            </span>
          ) : (
            <span
              onClick={() => goNode(node.id)}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 9,
                  background: colorHex,
                  boxShadow: `0 0 8px 1px ${colorHex}`,
                }}
              />
              {node.label}
            </span>
          )}
        </div>
      </Html>
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
