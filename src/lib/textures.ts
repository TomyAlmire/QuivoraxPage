import * as THREE from 'three';

let glow: THREE.Texture | null = null;

/** Textura de glow radial (blanco → transparente) generada en canvas. Cacheada. */
export function glowTexture(): THREE.Texture {
  if (glow) return glow;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

let bg: THREE.Texture | null = null;

/** Degradé vertical para el fondo de la escena (arriba azulado → abajo casi negro). */
export function bgGradientTexture(): THREE.Texture {
  if (bg) return bg;
  const w = 4;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(0.45, '#070b13');
    g.addColorStop(1, '#03050a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  bg = new THREE.CanvasTexture(canvas);
  bg.colorSpace = THREE.SRGBColorSpace;
  return bg;
}
