export const vertex = /* glsl */ `
uniform float uProgress;
uniform sampler2D uNoise;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  vec2 n = texture2D(uNoise, uv + uTime * 0.01).rg - 0.5;
  float burst = sin(uProgress * 3.14159) * 0.15;
  pos.xy += n * burst;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const fragment = /* glsl */ `
uniform sampler2D uImageA;
uniform sampler2D uImageB;
uniform sampler2D uNoise;
uniform float uProgress;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 noise = texture2D(uNoise, vUv + uTime * 0.01).rg;
  float disp = sin(uProgress * 3.14159) * 0.6;
  vec2 uv = vUv + (noise - 0.5) * disp;

  vec4 colA = texture2D(uImageA, uv);
  vec4 colB = texture2D(uImageB, uv);
  float mixFactor = smoothstep(0.4, 0.6, uProgress);
  vec4 col = mix(colA, colB, mixFactor);

  float dimAtMid = 1.0 - smoothstep(0.45, 0.5, abs(uProgress - 0.5)) * 0.3;
  col.a *= dimAtMid;

  gl_FragColor = col;
}
`;
