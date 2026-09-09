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

let bgLite: THREE.Texture | null = null;

/**
 * Fondo simple para mobile / tier bajo: degradé frío + viñeta + un par de
 * glows muy suaves. Sin malla de puntos ni scanlines (que en pantallas
 * chicas se ven como ruido de color). Canvas chico cacheado.
 */
export function bgSimpleTexture(): THREE.Texture {
  if (bgLite) return bgLite;
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a121d');
    g.addColorStop(0.55, '#060c14');
    g.addColorStop(1, '#03070c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const glow = (x: number, y: number, r: number, color: string, a: number) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = a;
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    };
    glow(w * 0.35, h * 0.4, 240, '#16305a', 0.35);
    glow(w * 0.7, h * 0.62, 200, '#1c2450', 0.25);
    ctx.globalAlpha = 1;

    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
  bgLite = new THREE.CanvasTexture(canvas);
  bgLite.colorSpace = THREE.SRGBColorSpace;
  return bgLite;
}

let bg: THREE.Texture | null = null;

/**
 * Fondo de la escena: NO es el espacio, es un ciberespacio / sala de datos.
 * Degradé frío + malla de puntos (data grid) + anillos HUD concéntricos +
 * scanlines tenues. Sin estrellas ni nebulosas. Canvas grande cacheado.
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
    // base vertical fría
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#081019');
    g.addColorStop(0.5, '#050b12');
    g.addColorStop(1, '#03070c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // viñeta suave
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // anillos HUD concéntricos, muy tenues
    ctx.strokeStyle = 'rgba(90,170,235,0.06)';
    ctx.lineWidth = 1.5;
    for (let r = 120; r < w * 0.6; r += 130) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // malla de puntos / cruces (data grid)
    const step = 46;
    for (let y = step; y < h; y += step) {
      for (let x = step; x < w; x += step) {
        const near = 1 - Math.min(1, Math.hypot(x - w / 2, y - h / 2) / (w * 0.5));
        ctx.globalAlpha = 0.05 + near * 0.09;
        ctx.fillStyle = '#7cc2f0';
        // cruz de 3px
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
    ctx.globalAlpha = 1;

    // scanlines horizontales
    ctx.fillStyle = 'rgba(120,200,255,0.02)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  }
  bg = new THREE.CanvasTexture(canvas);
  bg.colorSpace = THREE.SRGBColorSpace;
  bg.anisotropy = 4;
  return bg;
}

let hudSphere: THREE.Texture | null = null;

/**
 * Textura para la "cáscara HUD" del orbe: líneas finas tipo escáner sobre fondo
 * transparente (latitudes, meridianos, ticks, cruces). Se mapea en una esfera
 * apenas más grande que el vidrio y se anima girando. Cacheada.
 */
export function hudSphereTexture(): THREE.Texture {
  if (hudSphere) return hudSphere;
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,215,255,0.55)';
    ctx.fillStyle = 'rgba(150,215,255,0.55)';
    ctx.lineWidth = 1.4;

    // latitudes
    for (let i = 1; i < 6; i++) {
      const y = (i / 6) * h;
      ctx.globalAlpha = i === 3 ? 0.7 : 0.32;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // meridianos con guiones
    ctx.setLineDash([6, 8]);
    for (let i = 0; i < 8; i++) {
      const x = (i / 8) * w;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ticks sobre la latitud ecuatorial
    ctx.globalAlpha = 0.6;
    for (let x = 0; x < w; x += 22) {
      const long = x % 88 === 0 ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(x, h / 2 - long);
      ctx.lineTo(x, h / 2 + long);
      ctx.stroke();
    }

    // un par de cruces / marcas de foco
    const mark = (cx: number, cy: number, s: number) => {
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy);
      ctx.lineTo(cx + s, cy);
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx, cy + s);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
    };
    mark(w * 0.22, h * 0.34, 14);
    mark(w * 0.68, h * 0.62, 12);
    mark(w * 0.82, h * 0.28, 9);
    ctx.globalAlpha = 1;
  }
  hudSphere = new THREE.CanvasTexture(canvas);
  hudSphere.colorSpace = THREE.SRGBColorSpace;
  hudSphere.wrapS = THREE.RepeatWrapping;
  return hudSphere;
}
