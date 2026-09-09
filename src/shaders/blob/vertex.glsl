// Desplazamiento de una esfera con ruido + tiempo + puntero.
// Pasa al fragment: normal desplazada, "elevación" y coords de vista para el fresnel.

#include '../lib/noise.glsl';

uniform float uTime;
uniform float uDistort;    // intensidad del desplazamiento
uniform float uFrequency;  // escala del ruido
uniform float uSpeed;
uniform vec2  uPointer;    // -1..1
uniform float uPointerStrength;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vElevation;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;
  float t = uTime * uSpeed;

  // Ruido base + una segunda capa más lenta para "respiración"
  float noise = fbm(pos * uFrequency + vec3(0.0, t, 0.0), 4);
  noise += 0.35 * snoise(pos * (uFrequency * 0.5) - vec3(t * 0.4));

  // Atracción hacia el puntero (proyectado sobre la esfera)
  vec3 pointerDir = normalize(vec3(uPointer, 0.6));
  float pull = pow(max(dot(normalize(pos), pointerDir), 0.0), 3.0);
  noise += pull * uPointerStrength;

  float elevation = noise * uDistort;
  vElevation = elevation;

  vec3 displaced = pos + normal * elevation;

  // Normal aproximada por diferencias finitas (suficiente para el look)
  float eps = 0.08;
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)) + 1e-4);
  vec3 bitangent = normalize(cross(normal, tangent));
  float nT = fbm((pos + tangent * eps) * uFrequency + vec3(0.0, t, 0.0), 4) * uDistort;
  float nB = fbm((pos + bitangent * eps) * uFrequency + vec3(0.0, t, 0.0), 4) * uDistort;
  vec3 dispT = (pos + tangent * eps) + normal * nT - displaced;
  vec3 dispB = (pos + bitangent * eps) + normal * nB - displaced;
  vNormal = normalize(normalMatrix * normalize(cross(dispT, dispB)));

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
