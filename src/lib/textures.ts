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

/**
 * Fondo de la escena: degradé vertical + nebulosas suaves + campo de estrellas.
 * Se dibuja una sola vez en un canvas grande (equirectangular 2:1) y se cachea.
 * RNG determinista para que las estrellas no "salten" entre recargas.
 */
export function bgGradientTexture(): THREE.Texture {
  if (bg) return bg;
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // base vertical (cenit azulado → horizonte → casi negro)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a1020');
    g.addColorStop(0.42, '#070b14');
    g.addColorStop(0.72, '#04060c');
    g.addColorStop(1, '#020308');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // nebulosas: radiales muy tenues en azul/violeta
    const nebula = (x: number, y: number, r: number, color: string, a: number) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a;
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    };
    nebula(w * 0.3, h * 0.4, 640, '#1b2b55', 0.5);
    nebula(w * 0.74, h * 0.55, 560, '#2a1c4a', 0.38);
    nebula(w * 0.53, h * 0.28, 460, '#123048', 0.32);
    ctx.globalAlpha = 1;

    // estrellas (RNG determinista lineal-congruente)
    let seed = 20260908;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 1400; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const s = rand();
      const size = s > 0.986 ? 2.2 : s > 0.9 ? 1.4 : 0.8;
      ctx.globalAlpha = 0.22 + rand() * 0.62;
      ctx.fillStyle = s > 0.97 ? '#bcd0ff' : s > 0.85 ? '#ffffff' : '#e7ecff';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  bg = new THREE.CanvasTexture(canvas);
  bg.colorSpace = THREE.SRGBColorSpace;
  bg.anisotropy = 4;
  return bg;
}
