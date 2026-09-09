/**
 * Isotipo de Quivorax: un rombo grande formado por cuatro clusters de rombos
 * (N/S/E/O) alrededor de un rombo central, con acentos en las diagonales y en
 * las puntas. Usa `currentColor`, así que hereda el color del contenedor.
 */
interface LogoProps {
  className?: string;
  /** Si se pasa, el SVG se anuncia como imagen con este texto alternativo. */
  title?: string;
}

interface D {
  x: number;
  y: number;
  r: number;
}

const CR = 4.3; // radio de los rombos del cluster
const CD = 12.4; // distancia del cluster al centro
const off: [number, number][] = [
  [-CR, -CR],
  [CR, -CR],
  [-CR, CR],
  [CR, CR],
];
const clusters: [number, number][] = [
  [0, -CD],
  [0, CD],
  [-CD, 0],
  [CD, 0],
];

const DIAMONDS: D[] = [
  { x: 0, y: 0, r: 2.4 },
  ...clusters.flatMap(([cx, cy]) => off.map(([ox, oy]) => ({ x: cx + ox, y: cy + oy, r: CR }))),
  // diagonales
  { x: -15.5, y: -15.5, r: 4.6 },
  { x: 15.5, y: -15.5, r: 4.6 },
  { x: -15.5, y: 15.5, r: 4.6 },
  { x: 15.5, y: 15.5, r: 4.6 },
  // puntas
  { x: 0, y: -26.5, r: 2 },
  { x: 0, y: 26.5, r: 2 },
  { x: -26.5, y: 0, r: 2 },
  { x: 26.5, y: 0, r: 2 },
];

function pts(d: D): string {
  return `${d.x},${d.y - d.r} ${d.x + d.r},${d.y} ${d.x},${d.y + d.r} ${d.x - d.r},${d.y}`;
}

export function Logo({ className, title }: LogoProps) {
  return (
    <svg
      viewBox="-32 -32 64 64"
      className={className}
      fill="currentColor"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {DIAMONDS.map((d, i) => (
        <polygon key={i} points={pts(d)} />
      ))}
    </svg>
  );
}
