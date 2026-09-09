// Look "cristal iridiscente": gradiente por elevación + fresnel en los bordes.

uniform float uTime;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorFresnel;
uniform float uFresnelPower;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vElevation;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel (más brillo en los bordes que miran de canto a la cámara)
  float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), uFresnelPower);

  // Color base según la deformación
  float mixT = smoothstep(-0.5, 0.5, vElevation) + 0.15 * sin(vUv.y * 6.2831 + uTime);
  vec3 base = mix(uColorA, uColorB, clamp(mixT, 0.0, 1.0));

  // Un toque de luz especular barata
  vec3 lightDir = normalize(vec3(0.4, 0.8, 0.6));
  float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 24.0);

  vec3 color = base + uColorFresnel * fresnel + spec * 0.35;

  // Aproximación de tone mapping (el material se declara toneMapped={false}
  // para evitar depender de los ShaderChunk de three en shaders custom).
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0 / 2.2));

  gl_FragColor = vec4(color, uOpacity);
}
