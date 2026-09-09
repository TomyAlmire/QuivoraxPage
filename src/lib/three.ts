/**
 * Constantes y helpers compartidos de Three.js.
 * Mantener acá los valores "mágicos" para que las escenas sean legibles.
 */
import * as THREE from 'three';

/** Configuración por defecto del <Canvas> de R3F (se puede sobrescribir por escena). */
export const CANVAS_GL: Partial<THREE.WebGLRendererParameters> = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true,
};

/** Espacio de color y tone mapping estándar para look "filmic" premium. */
export function configureRenderer(gl: THREE.WebGLRenderer): void {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.1;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  // El vidrio (material.transmission) se muestrea de un buffer aparte; a media
  // resolución casi no se nota y ahorra bastante, sobre todo en mobile.
  const withTransmission = gl as THREE.WebGLRenderer & { transmissionResolutionScale?: number };
  if (typeof withTransmission.transmissionResolutionScale === 'number') {
    withTransmission.transmissionResolutionScale = 0.5;
  }
}

/** Libera geometría + material(es) + texturas de un objeto y sus hijos. */
export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    for (const mat of materials) {
      for (const key of Object.keys(mat)) {
        const value = (mat as unknown as Record<string, unknown>)[key];
        if (value instanceof THREE.Texture) value.dispose();
      }
      mat.dispose();
    }
  });
}

export const V3_ZERO = new THREE.Vector3(0, 0, 0);
export const AXIS_Y = new THREE.Vector3(0, 1, 0);
