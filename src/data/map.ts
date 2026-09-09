/**
 * El "mapa Quivorax": tres ramas (sistemas · ciberseguridad · desarrollo web)
 * como clusters en el espacio 3D, más un núcleo central y un nodo de contacto.
 *
 * Cada rama = un core + 3 hojas (los sub-servicios de los slides de Tomás).
 * Las posiciones se calculan una vez acá para que la escena sea declarativa.
 */
import * as THREE from 'three';

export type BranchId = 'sistemas' | 'ciber' | 'web';
export type NodeKind = 'core' | 'leaf' | 'root' | 'contact';

export interface MapNode {
  id: string;
  label: string;
  branch: BranchId | null; // null = root / contact
  kind: NodeKind;
  position: [number, number, number];
  /** Título + cuerpo del panel de detalle */
  title: string;
  body: string;
}

export interface Branch {
  id: BranchId;
  label: string;
  short: string;
  tagline: string;
  color: string;
  coreId: string;
  /** ángulo alrededor del centro, en radianes */
  angle: number;
}

export const BRANCH_COLOR: Record<BranchId | 'root', string> = {
  ciber: '#3ddc84', // verde señal
  sistemas: '#6ea8fe', // azul
  web: '#b39dff', // violeta
  root: '#e9eef3',
};

export const BRANCHES: Branch[] = [
  {
    id: 'web',
    label: 'Desarrollo web',
    short: 'Web',
    tagline: 'Una web tiene que hacer más que verse bien.',
    color: BRANCH_COLOR.web,
    coreId: 'web',
    angle: Math.PI / 2, // arriba
  },
  {
    id: 'sistemas',
    label: 'Sistemas',
    short: 'Sistemas',
    tagline: 'Menos pasos, más eficiencia.',
    color: BRANCH_COLOR.sistemas,
    coreId: 'sistemas',
    angle: Math.PI / 2 + (2 * Math.PI) / 3, // abajo-izquierda
  },
  {
    id: 'ciber',
    label: 'Ciberseguridad',
    short: 'Ciber',
    tagline: 'Una sola barrera no alcanza.',
    color: BRANCH_COLOR.ciber,
    coreId: 'ciber',
    angle: Math.PI / 2 + (4 * Math.PI) / 3, // abajo-derecha
  },
];

interface LeafSeed {
  id: string;
  label: string;
  title: string;
  body: string;
}

const LEAVES: Record<BranchId, LeafSeed[]> = {
  web: [
    { id: 'web-uxui', label: 'Diseño UX/UI', title: 'Diseño UX/UI', body: 'Experiencias claras, simples y fáciles de usar. Menos fricción, más gente que llega a donde quería ir.' },
    { id: 'web-frontend', label: 'Frontend', title: 'Frontend', body: 'Interfaces rápidas, prolijas y adaptadas a cada pantalla. Accesibles y fáciles de mantener.' },
    { id: 'web-backend', label: 'Backend', title: 'Backend', body: 'Que la parte técnica funcione, conecte y responda. APIs, datos e integraciones que no se rompen.' },
  ],
  sistemas: [
    { id: 'sis-procesos', label: 'Ordenar procesos', title: 'Ordenar procesos', body: 'Una forma más clara y simple de trabajar. Sacamos los pasos que sobran antes de automatizar nada.' },
    { id: 'sis-integrar', label: 'Conectar herramientas', title: 'Conectar herramientas', body: 'Que los sistemas que ya usás se entiendan entre sí. Menos copiar y pegar, menos islas.' },
    { id: 'sis-automatizar', label: 'Automatizar tareas', title: 'Automatizar tareas', body: 'Menos pasos manuales, menos errores. Lo repetitivo lo hace la máquina; vos decidís.' },
  ],
  ciber: [
    { id: 'cib-accesos', label: 'Revisar accesos', title: 'Revisar accesos', body: 'Cómo están protegidas tus cuentas, sistemas y herramientas. Quién puede entrar y a qué.' },
    { id: 'cib-riesgos', label: 'Detectar riesgos', title: 'Detectar riesgos', body: 'Encontrar los puntos débiles antes de que sean un problema. Pensamos como quien querría entrar.' },
    { id: 'cib-mejoras', label: 'Proponer mejoras', title: 'Proponer mejoras', body: 'Reforzar la seguridad de forma clara y concreta. Prioridades, no una lista infinita de miedos.' },
  ],
};

/** radios del layout */
const CORE_DIST = 4.1;
const LEAF_DIST = 1.85;

/** ruido determinista -1..1 (para que el layout no cambie entre recargas) */
const jitter = (seed: number) => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

function build(): { nodes: MapNode[]; edges: [string, string][] } {
  const nodes: MapNode[] = [];
  const edges: [string, string][] = [];

  // Núcleo
  nodes.push({
    id: 'quivorax',
    label: 'Quivorax',
    branch: null,
    kind: 'root',
    position: [0, 0, 0],
    title: 'Un mismo criterio',
    body: 'Tres frentes —sistemas, seguridad y web— con la misma idea de fondo: que funcione y que no falle. Elegí una rama para ver de qué se trata.',
  });

  BRANCHES.forEach((b, bi) => {
    const cx = Math.cos(b.angle) * CORE_DIST;
    const cy = Math.sin(b.angle) * CORE_DIST;
    const cz = jitter(bi + 1) * 0.3;

    nodes.push({
      id: b.coreId,
      label: b.label,
      branch: b.id,
      kind: 'core',
      position: [cx, cy, cz],
      title: b.label,
      body: b.tagline,
    });
    edges.push(['quivorax', b.coreId]);

    LEAVES[b.id].forEach((leaf, i) => {
      const spread = (2 * Math.PI) / 3;
      const a = b.angle + Math.PI + (i - 1) * spread; // hojas "hacia afuera" del centro
      const lx = cx + Math.cos(a) * LEAF_DIST;
      const ly = cy + Math.sin(a) * LEAF_DIST;
      const lz = cz + jitter(bi * 10 + i + 3) * 0.4;
      nodes.push({
        id: leaf.id,
        label: leaf.label,
        branch: b.id,
        kind: 'leaf',
        position: [lx, ly, lz],
        title: leaf.title,
        body: leaf.body,
      });
      edges.push([b.coreId, leaf.id]);
    });
  });

  // Nodo de contacto, orbitando el núcleo
  nodes.push({
    id: 'trabajemos',
    label: 'Trabajemos',
    branch: null,
    kind: 'contact',
    position: [0.2, -0.4, 2.6],
    title: '¿Tenés algo que construir o blindar?',
    body: 'Contame qué necesitás y lo charlamos. Respondo en menos de 24 h — hola@quivorax.com',
  });
  edges.push(['quivorax', 'trabajemos']);

  return { nodes, edges };
}

const graph = build();
export const NODES: MapNode[] = graph.nodes;
export const EDGES: [string, string][] = graph.edges;

export const NODE_BY_ID: Record<string, MapNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));

export function nodeColor(node: MapNode): string {
  if (node.kind === 'contact') return '#ffd27a';
  if (node.branch) return BRANCH_COLOR[node.branch];
  return BRANCH_COLOR.root;
}

/** Centro (promedio) de una rama, para apuntar la cámara */
export function branchCenter(branch: BranchId): THREE.Vector3 {
  const pts = NODES.filter((n) => n.branch === branch);
  const v = new THREE.Vector3();
  for (const p of pts) v.add(new THREE.Vector3(...p.position));
  return v.divideScalar(pts.length || 1);
}
