// Punto circular con caída suave (sin textura).

uniform vec3 uColor;

varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float mask = smoothstep(0.5, 0.0, d);
  if (mask <= 0.001) discard;

  float glow = smoothstep(0.5, 0.15, d);
  vec3 color = uColor + glow * 0.4;

  gl_FragColor = vec4(color, mask * vAlpha);
}
