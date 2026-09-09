import { useEffect, useRef } from 'react';
import { NODES, EDGES, NODE_BY_ID, nodeColor } from '@/data/map';
import { useMapStore } from '@/store/useMapStore';
import s from './overlay.module.css';

const SIZE = 116;
const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

/** Proyección top-down (X,Y) del grafo. Dibuja "dónde estás". */
export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    ctx.scale(DPR, DPR);

    const xs = NODES.map((n) => n.position[0]);
    const ys = NODES.map((n) => n.position[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 14;
    const span = Math.max(maxX - minX, maxY - minY) || 1;
    const project = (x: number, y: number): [number, number] => [
      pad + ((x - minX) / span) * (SIZE - pad * 2),
      SIZE - (pad + ((y - minY) / span) * (SIZE - pad * 2)),
    ];

    const draw = () => {
      const { mode, branch, node, hovered } = useMapStore.getState();
      ctx.clearRect(0, 0, SIZE, SIZE);

      // aristas
      ctx.lineWidth = 1;
      for (const [a, b] of EDGES) {
        const [ax, ay] = project(...toXY(a));
        const [bx, by] = project(...toXY(b));
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // nodos
      for (const n of NODES) {
        const [x, y] = project(n.position[0], n.position[1]);
        const active =
          hovered === n.id ||
          (mode === 'node' && node === n.id) ||
          (mode === 'branch' && (n.branch === branch || n.kind === 'root'));
        ctx.fillStyle = active ? nodeColor(n) : 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(x, y, n.kind === 'root' ? 3 : active ? 2.6 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // "estás aquí": anillo pulsante alrededor del foco
      const focusId = node ?? (branch ? NODE_BY_ID[branch]?.id : 'quivorax');
      const focus = focusId ? NODE_BY_ID[focusId] : null;
      if (focus) {
        const [x, y] = project(focus.position[0], focus.position[1]);
        const t = performance.now() * 0.003;
        const r = 4 + Math.sin(t) * 1.5;
        ctx.strokeStyle = nodeColor(focus);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

    };
    draw();
    // el minimapa no necesita 60fps; así funciona aunque rAF esté pausado
    const interval = window.setInterval(draw, 100);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={s.minimap} aria-hidden>
      <span className={s.minimapLabel}>Mapa · estás aquí</span>
      <canvas ref={canvasRef} className={s.minimapCanvas} style={{ width: SIZE, height: SIZE }} />
    </div>
  );
}

function toXY(id: string): [number, number] {
  const n = NODE_BY_ID[id];
  return [n.position[0], n.position[1]];
}
