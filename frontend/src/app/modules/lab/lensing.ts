import * as THREE from 'three';

/**
 * Gravitational lensing as a screen-space pass (TASK-DB-0098). Ported from the ACS
 * constellation's lib/lensing.ts (Pukujan/acs-constellation). Pixels near the hole are pulled
 * toward its silhouette, and red and blue are displaced by different amounts, so the starfield
 * gains a chromatic fringe. The shadow stays opaque black. The photon ring takes the site accent.
 */

const LENS_RING = new THREE.Color('#c6f432');

/** The hole's on-screen size and reach, from its world radius and the camera. Ported as-is. */
export function lensGeometry(worldRadius: number, distance: number, fovDegrees: number, aspect: number) {
  const visibleHeight = Math.max(0.001, 2 * distance * Math.tan((fovDegrees * Math.PI) / 360));
  const shadow = Math.min(0.9, Math.max(0.005, worldRadius / visibleHeight));
  return {
    shadow,
    outer: Math.min(1.8, shadow * 4),
    strength: shadow * 0.34,
    aspect,
  };
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uShadow;
  uniform float uOuter;
  uniform float uStrength;
  uniform float uActive;
  uniform vec3 uRing;
  uniform float uBlack;
  uniform float uChroma;
  uniform float uRingGlow;
  varying vec2 vUv;

  void main(){
    if (uActive < 0.001){
      gl_FragColor = texture2D(tDiffuse, vUv);
      return;
    }

    vec2 d = vUv - uCenter;
    d.x *= uAspect;
    float r = length(d);

    // Outside the reach of the bend the frame is untouched: one fetch.
    if (r > uOuter){
      gl_FragColor = texture2D(tDiffuse, vUv);
      return;
    }

    vec2 dir = r > 1e-5 ? d / r : vec2(0.0);

    float span = max(uOuter - uShadow, 1e-4);
    float t = clamp((r - uShadow) / span, 0.0, 1.0);

    // A wide drag over the neighbourhood, and a tight fold on the rim that wraps the sky over the edge.
    float wide = pow(1.0 - t, 3.2);
    float rimT = (r - uShadow) / max(uShadow * 0.9, 1e-4);
    float rim = exp(-rimT * rimT * 1.6);
    float bend = uStrength * (wide + rim * 0.7);

    vec2 offset = dir * bend;
    offset.x /= uAspect;

    // Refraction splits by wavelength: red bends least, blue most.
    vec2 ca = dir * bend * 0.3 * uChroma;
    ca.x /= uAspect;

    vec2 uv = vUv - offset;
    vec4 centre = texture2D(tDiffuse, uv);
    vec4 col;
    col.r = texture2D(tDiffuse, uv + ca).r;
    col.g = centre.g;
    col.b = texture2D(tDiffuse, uv - ca).b;
    col.a = centre.a;

    // Inside the silhouette the sky stops: the hole is black, not a window onto the page.
    float shadow = smoothstep(uShadow * 0.8, uShadow * 1.04, r);
    float s = mix(1.0, shadow, uBlack);
    col.rgb *= s;
    col.a = mix(1.0, col.a, s);

    // Light that orbited the hole, held in a hairline at the edge of the shadow.
    float ringR = (r - uShadow * 1.07) / max(uShadow * 0.13, 1e-4);
    float photon = exp(-ringR * ringR);
    col.rgb += uRing * photon * 0.22 * uActive * uRingGlow;

    gl_FragColor = col;
  }
`;

/** A full-screen pass that reads the rendered scene from `source` and writes the lensed frame to the canvas. */
export function createLensPass(source: THREE.Texture) {
  const uniforms = {
    tDiffuse: { value: source as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAspect: { value: 1.6 },
    uShadow: { value: 0.1 },
    uOuter: { value: 0.4 },
    uStrength: { value: 0.03 },
    uActive: { value: 1 },
    uRing: { value: LENS_RING.clone() },
    uBlack: { value: 1 },
    uChroma: { value: 1 },
    uRingGlow: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    uniforms,
    scene,
    camera,
    dispose() {
      quad.geometry.dispose();
      material.dispose();
    },
  };
}
