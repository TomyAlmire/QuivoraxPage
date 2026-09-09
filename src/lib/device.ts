/**
 * Detección de capacidad del dispositivo y "quality tier".
 *
 * La idea: calcular UNA vez al arranque un nivel de calidad ('low' | 'mid' | 'high')
 * y derivar de ahí todos los presupuestos (DPR, nº de partículas, postprocessing,
 * sombras...). Las escenas leen `getQualityTier()` o el store, nunca hacen
 * `window.innerWidth < X` sueltos.
 */

export type QualityTier = 'low' | 'mid' | 'high';

export interface DeviceProfile {
  tier: QualityTier;
  isMobile: boolean;
  isTouch: boolean;
  /** Límite superior de devicePixelRatio para el <Canvas> */
  dprMax: number;
  /** Presupuesto de partículas para efectos de fondo */
  particleBudget: number;
  /** Si conviene activar postprocessing pesado (DoF, GodRays, SSR...) */
  heavyPostFX: boolean;
  /** Resolución sugerida para sombras */
  shadowMapSize: number;
  prefersReducedMotion: boolean;
}

function detectReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function detectTouch(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const uaMobile = /android|iphone|ipad|ipod|mobile|silk|kindle/i.test(navigator.userAgent);
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 768;
  return uaMobile || (detectTouch() && smallViewport);
}

/** Estima el tier de GPU mirando el renderer de WebGL (barato, sin crear un Canvas real de la app). */
function estimateGpuTier(): QualityTier {
  if (typeof document === 'undefined') return 'mid';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'low';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const r = renderer.toLowerCase();

    // GPUs integradas / móviles conocidas → tier bajo
    if (/(apple a[0-9]|apple gpu|mali|adreno [1-5][0-9]{2}|powervr|swiftshader|llvmpipe|intel.*hd graphics [0-4])/i.test(r)) {
      return 'low';
    }
    // Dedicadas modernas → alto
    if (/(rtx|radeon rx|apple m[1-9]|adreno [67][0-9]{2}|arc a[0-9])/i.test(r)) {
      return 'high';
    }
    return 'mid';
  } catch {
    return 'mid';
  }
}

let cached: DeviceProfile | null = null;

export function getDeviceProfile(): DeviceProfile {
  if (cached) return cached;

  const isMobile = detectMobile();
  const isTouch = detectTouch();
  const prefersReducedMotion = detectReducedMotion();
  const gpu = estimateGpuTier();
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
  const memory = typeof navigator !== 'undefined' ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4) : 4;

  let tier: QualityTier;
  if (isMobile || gpu === 'low' || cores <= 4 || memory <= 2) {
    tier = 'low';
  } else if (gpu === 'high' && cores >= 8 && memory >= 8) {
    tier = 'high';
  } else {
    tier = 'mid';
  }

  const profile: DeviceProfile = {
    tier,
    isMobile,
    isTouch,
    prefersReducedMotion,
    dprMax: tier === 'low' ? 1.5 : tier === 'mid' ? 1.75 : 2,
    particleBudget: tier === 'low' ? 1200 : tier === 'mid' ? 6000 : 20000,
    heavyPostFX: tier === 'high',
    shadowMapSize: tier === 'low' ? 512 : tier === 'mid' ? 1024 : 2048,
  };

  cached = profile;
  return profile;
}

export function getQualityTier(): QualityTier {
  return getDeviceProfile().tier;
}
