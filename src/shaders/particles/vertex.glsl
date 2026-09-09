// Nube de partículas: cada punto orbita/deriva con ruido y reacciona al puntero.

#include '../lib/noise.glsl';

uniform float uTime;
uniform float uSize;
uniform float uDrift;
uniform vec2  uPointer;
uniform float uPointerRadius;
uniform float uPixelRatio;

attribute float aScale;   // variación de tamaño por partícula
attribute float aSeed;    // semilla por partícula

varying float vAlpha;

void main() {
  vec3 pos = position;

  float t = uTime * 0.15 + aSeed * 6.2831;

  // Deriva orgánica
  vec3 drift = vec3(
    snoise(pos * 0.35 + vec3(t, 0.0, 0.0)),
    snoise(pos * 0.35 + vec3(0.0, t, 10.0)),
    snoise(pos * 0.35 + vec3(0.0, 0.0, t + 20.0))
  );
  pos += drift * uDrift;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Repulsión suave respecto del puntero (en espacio de pantalla aproximado)
  vec2 screen = mvPosition.xy / max(-mvPosition.z, 0.001);
  float d = distance(screen, uPointer * 1.5);
  float repel = smoothstep(uPointerRadius, 0.0, d);
  mvPosition.xy += normalize(screen - uPointer * 1.5 + 1e-4) * repel * 0.4;

  gl_Position = projectionMatrix * mvPosition;

  // Tamaño con atenuación por distancia
  gl_PointSize = uSize * aScale * uPixelRatio;
  gl_PointSize *= (1.0 / max(-mvPosition.z, 0.001));

  vAlpha = 0.35 + 0.65 * repel + 0.15 * sin(t * 3.0);
}
