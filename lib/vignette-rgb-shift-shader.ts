/**
 * Adapted from franky-adl/3d-wave-grid (MIT License).
 * Post-processing shader that applies subtle chromatic aberration (RGB shift)
 * and vignette towards the screen edges.
 */
export const VignetteRGBShiftShader = {
  name: 'VignetteRGBShiftShader',
  uniforms: {
    tDiffuse: { value: null },
    shiftAmount: { value: 0.005 },
    vignetteRadius: { value: 0.3 },
    vignetteSoftness: { value: 0.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float shiftAmount;
    uniform float vignetteRadius;
    uniform float vignetteSoftness;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      float horzQuadrant = sign(vUv.x - center.x);
      float vertQuadrant = sign(vUv.y - center.y);

      float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
      float currentShift = shiftAmount * vignetteFactor;

      vec4 rSample = texture2D(tDiffuse, vUv + vec2(currentShift * horzQuadrant, currentShift * vertQuadrant));
      vec4 gSample = texture2D(tDiffuse, vUv);
      vec4 bSample = texture2D(tDiffuse, vUv - vec2(currentShift * horzQuadrant, currentShift * vertQuadrant));

      float r = rSample.r;
      float g = gSample.g;
      float b = bSample.b;
      float a = max(gSample.a, max(rSample.a, bSample.a));

      float darken = 1.0 - vignetteFactor * 0.35;
      gl_FragColor = vec4(vec3(r, g, b) * darken, a);
    }
  `,
}
