import * as THREE from 'three';

/**
 * The bodies the lab backdrop can show (TASK-DB-0098): the black hole on /lab, a pulsar on
 * /contact, a nebula on /blogs and a star system on /research. Each is a group the backdrop
 * places, animates and swaps; the constellation behind them is shared. Only the black hole is
 * lensed. The palette is the lab's: paper, one muted grey and the lime accent.
 */

export const PAPER = new THREE.Color('#f2efe8');
export const ACCENT = new THREE.Color('#c6f432');
export const MUTED = new THREE.Color('#8f8b82');
export const HORIZON_RADIUS = 1.05;

export type Body = {
  group: THREE.Group;
  /** Whether the lensing pass bends the frame around this body. */
  lensed: boolean;
  /** The radius, in world units, that the bending is measured from. */
  lensRadius?: number;
  /** Whether the centre goes black (only the black hole). */
  lensBlack?: boolean;
  /** Where the body sits, from the viewport's half-size and the eased pointer. */
  anchor: (halfW: number, halfH: number, sx: number, sy: number) => THREE.Vector3;
  update: (elapsed: number, delta: number) => void;
};

/** A small seeded random, so each body looks the same on every visit. */
export function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft round sprite for stars, glows and the disk. */
export function glowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

/** The black hole: a black horizon, a photon ring, an accretion disk and halo glows. */
export function buildHole(rng: () => number): Body {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.SphereGeometry(HORIZON_RADIUS, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })));

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.14, 0.02, 12, 200),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.95 }),
  );
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.008, 8, 220),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.35 }),
  );
  group.add(ring, outerRing);

  const diskCount = 1100;
  const diskPositions = new Float32Array(diskCount * 3);
  const diskColors = new Float32Array(diskCount * 3);
  const inner = 1.3;
  const outer = 3.1;
  const colour = new THREE.Color();
  for (let i = 0; i < diskCount; i++) {
    const r = inner + Math.sqrt(rng()) * (outer - inner);
    const angle = rng() * Math.PI * 2;
    diskPositions[i * 3] = r * Math.cos(angle);
    diskPositions[i * 3 + 1] = (rng() - 0.5) * 0.05 * r;
    diskPositions[i * 3 + 2] = r * Math.sin(angle);
    const heat = 1 - (r - inner) / (outer - inner);
    colour.copy(PAPER).lerp(ACCENT, heat * 0.85).multiplyScalar(0.55 + heat * 0.6);
    diskColors[i * 3] = colour.r;
    diskColors[i * 3 + 1] = colour.g;
    diskColors[i * 3 + 2] = colour.b;
  }
  const diskGeometry = new THREE.BufferGeometry();
  diskGeometry.setAttribute('position', new THREE.BufferAttribute(diskPositions, 3));
  diskGeometry.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));
  const disk = new THREE.Points(
    diskGeometry,
    new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  disk.rotation.x = 1.12;
  disk.rotation.z = 0.22;
  group.add(disk);

  const halo = new THREE.SpriteMaterial({
    color: ACCENT,
    map: glowTexture(),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const haloNear = new THREE.Sprite(halo);
  haloNear.scale.set(4.4, 4.4, 1);
  const haloFar = new THREE.Sprite(halo.clone());
  haloFar.material.opacity = 0.09;
  haloFar.scale.set(9, 9, 1);
  group.add(haloNear, haloFar);

  return {
    group,
    lensed: true,
    lensRadius: HORIZON_RADIUS,
    lensBlack: true,
    anchor: (halfW, halfH, sx, sy) =>
      new THREE.Vector3(THREE.MathUtils.clamp(halfW * 0.5, 0.9, 3.8) + sx * Math.min(halfW * 0.16, 1.2), halfH * 0.22 - sy * halfH * 0.14, 0),
    update: (_elapsed, delta) => {
      disk.rotation.y += delta * 0.32;
    },
  };
}

/** A textured surface for the pulsar: bright ridges over a dark plate, in the lab palette. */
function ridgeTexture(seed: number, low: number[], high: number[]): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const image = ctx.createImageData(size, size);
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let value = 0;
      let amp = 0.5;
      let freq = 1;
      for (let o = 0; o < 4; o++) {
        value += noise((px / size) * 6 * freq, (py / size) * 6 * freq) * amp;
        amp *= 0.5;
        freq *= 2.1;
      }
      const ridge = Math.pow(Math.max(0, 1 - Math.abs(2 * value - 1) * 3.2), 3);
      const i = (py * size + px) * 4;
      for (let c = 0; c < 3; c++) image.data[i + c] = low[c] + (high[c] - low[c]) * ridge;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** A pulsar: a textured neutron star with three pairs of beams at different tilts and spin speeds, sweeping across the screen. */
export function buildPulsar(): Body {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 48, 36),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: ridgeTexture(9, [40, 44, 40], [198, 244, 50]) }),
  );
  spin.add(surface);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: ACCENT, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  glow.scale.set(2.4, 2.4, 1);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: PAPER, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  halo.scale.set(6, 6, 1);
  group.add(glow, halo);

  // The beam: a bright cone that fades along its length.
  const beamTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.7)');
      gradient.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 4, 256);
    }
    return new THREE.CanvasTexture(canvas);
  })();
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: ACCENT,
    map: beamTexture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beamGeometry = new THREE.ConeGeometry(1.1, 26, 28, 1, true);

  // Three magnetic axes, each with a beam at both poles, turning at their own speeds.
  const axes = [
    { tiltX: 0.3, tiltZ: 0.5, speed: 2.4 },
    { tiltX: -0.6, tiltZ: 1.1, speed: -1.6 },
    { tiltX: 1.2, tiltZ: 0.2, speed: 3.1 },
  ];
  const turning: { group: THREE.Group; speed: number }[] = [];
  for (const axis of axes) {
    const turner = new THREE.Group();
    const magnetic = new THREE.Group();
    magnetic.rotation.set(axis.tiltX, 0, axis.tiltZ);
    turner.add(magnetic);
    const down = new THREE.Mesh(beamGeometry, beamMaterial);
    down.position.y = -13;
    const flip = new THREE.Group();
    flip.rotation.z = Math.PI;
    const up = new THREE.Mesh(beamGeometry, beamMaterial);
    up.position.y = -13;
    flip.add(up);
    magnetic.add(down, flip);
    spin.add(turner);
    turning.push({ group: turner, speed: axis.speed });
  }

  // Solar-style flare arcs off the surface, as on the giant.
  const flares = new THREE.Group();
  spin.add(flares);
  const flareRng = seeded(31);
  const flareTubes: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const dir = new THREE.Vector3(flareRng() * 2 - 1, flareRng() * 2 - 1, 0.4 + flareRng()).normalize();
    const side = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.3 + flareRng() * 0.3);
    const start = dir.clone().multiplyScalar(0.44);
    const end = dir.clone().multiplyScalar(0.44).add(side.clone().multiplyScalar(0.2));
    const control = dir.clone().multiplyScalar(0.44 + 0.5 + flareRng() * 0.3).add(side);
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.035 + flareRng() * 0.02, 8, false),
      new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    flares.add(tube);
    flareTubes.push(tube);
  }

  return {
    group,
    lensed: true,
    lensRadius: 1.2,
    lensBlack: false,
    anchor: (halfW, halfH, sx, sy) =>
      new THREE.Vector3(-halfW * 0.6 + sx * Math.min(halfW * 0.1, 0.8), halfH * 0.58 - sy * halfH * 0.1, 0),
    update: (elapsed) => {
      surface.rotation.y = elapsed * 0.6;
      spin.rotation.y = elapsed * 0.3;
      for (const turner of turning) turner.group.rotation.y = elapsed * turner.speed;
      beamMaterial.opacity = 0.45 + Math.sin(elapsed * 9) * 0.15;
      glow.material.opacity = 0.7 + Math.sin(elapsed * 5) * 0.2;
      flares.rotation.y = elapsed * 0.2;
      flareTubes.forEach((tube, i) => {
        (tube.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.max(0, Math.sin(elapsed * 1.3 + i * 1.9)) * 0.6;
      });
    },
  };
}

/** A lava surface: dark red plates with bright molten cracks, so the star looks like it is burning. */
function lavaTexture(seed: number): THREE.CanvasTexture {
  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const image = ctx.createImageData(size, size);
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let value = 0;
      let amp = 0.5;
      let freq = 1;
      for (let o = 0; o < 4; o++) {
        value += noise((px / size) * 7 * freq, (py / size) * 7 * freq) * amp;
        amp *= 0.5;
        freq *= 2.1;
      }
      // Ridges where the noise crosses the middle: the bright molten cracks.
      const ridge = Math.pow(Math.max(0, 1 - Math.abs(2 * value - 1) * 3.2), 3);
      const i = (py * size + px) * 4;
      image.data[i] = 90 + ridge * 165;
      image.data[i + 1] = 20 + ridge * 130 + value * 20;
      image.data[i + 2] = 14 + ridge * 50;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** A red supergiant: a burning lava surface, glowing corona and solar flare arcs that pulse off its edge. */
export function buildGiant(): Body {
  const group = new THREE.Group();
  const lava = lavaTexture(5);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: lava }),
  );
  group.add(surface);

  const corona = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color('#e0563a'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  corona.scale.set(8.4, 8.4, 1);
  const outer = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color('#b8321e'), transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  outer.scale.set(12, 12, 1);
  group.add(corona, outer);

  // Solar flares: arcs of hot gas that leave the surface on the side facing the camera and fall back.
  const flares = new THREE.Group();
  group.add(flares);
  const flareRng = seeded(23);
  const flareTubes: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const dir = new THREE.Vector3(flareRng() * 2 - 1, flareRng() * 2 - 1, 0.4 + flareRng()).normalize();
    const side = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.8 + flareRng() * 0.8);
    const start = dir.clone().multiplyScalar(4.2 * 1.01);
    const end = dir.clone().multiplyScalar(4.2 * 1.01).add(side.clone().multiplyScalar(0.3));
    const control = dir.clone().multiplyScalar(4.2 + 1.4 + flareRng() * 0.8).add(side);
    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 40, 0.07 + flareRng() * 0.05, 8, false),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a4a'), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    flares.add(tube);
    flareTubes.push(tube);
  }
  // Bright flare knots where the arcs leave the surface.
  for (let i = 0; i < 4; i++) {
    const knot = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color('#ffb36b'), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const dir = new THREE.Vector3(flareRng() * 2 - 1, flareRng() * 2 - 1, 0.5 + flareRng() * 0.5).normalize();
    knot.position.copy(dir.multiplyScalar(4.2 * 1.02));
    knot.scale.set(1.4, 1.4, 1);
    flares.add(knot);
  }

  return {
    group,
    lensed: true,
    lensRadius: 4.2,
    lensBlack: false,
    anchor: (halfW, halfH) => new THREE.Vector3(-halfW * 0.62, -halfH * 0.2, -2),
    update: (elapsed) => {
      // The lava churns across the surface and the star breathes.
      lava.offset.set(elapsed * 0.012, elapsed * 0.004);
      surface.scale.setScalar(1 + Math.sin(elapsed * 0.8) * 0.03);
      corona.material.opacity = 0.5 + Math.sin(elapsed * 0.8) * 0.08;
      flares.rotation.y = elapsed * 0.05;
      flareTubes.forEach((tube, i) => {
        (tube.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.max(0, Math.sin(elapsed * 1.1 + i * 1.7)) * 0.6;
      });
    },
  };
}

/** A spiral galaxy wide across the screen: two dense arms of stars, dark dust lanes between them, sparkling stars and a soft core. */
export function buildSystem(): Body {
  const group = new THREE.Group();
  const rng = seeded(19);
  const galaxy = new THREE.Group();
  galaxy.rotation.x = 0.85;
  group.add(galaxy);
  const colour = new THREE.Color();
  const INK = new THREE.Color('#0b0b0a');

  // The belt: stars spread along two spirals, thin at the tips and dense near the core.
  const armWidth = (t: number) => 0.18 + t * 0.35;
  const count = 3200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const arm = i % 2;
    const t = Math.pow(rng(), 0.8);
    const radius = 0.5 + t * 4.6;
    const across = (rng() * 2 - 1) * armWidth(t);
    const r = radius + across * 0.6;
    const a = t * 5.2 + arm * Math.PI + across / radius;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (rng() - 0.5) * 0.1 * (1 - t * 0.5);
    positions[i * 3 + 2] = Math.sin(a) * r;
    const centre = 1 - Math.abs(across) / armWidth(t);
    colour.copy(MUTED).lerp(PAPER, 0.35 + centre * 0.65);
    if (rng() < 0.05) colour.lerp(ACCENT, 0.8);
    colour.multiplyScalar(0.55 + rng() * 0.45);
    colors[i * 3] = colour.r;
    colors[i * 3 + 1] = colour.g;
    colors[i * 3 + 2] = colour.b;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ size: 0.05, vertexColors: true, map: glowTexture(), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  galaxy.add(stars);

  // Dust lanes: dark specks along the same arms, drawn normally so they darken the stars behind them.
  const dustCount = 1400;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const arm = i % 2;
    const t = Math.pow(rng(), 0.8);
    const radius = 0.7 + t * 4.2;
    const across = (rng() * 2 - 1) * armWidth(t) * 0.5;
    const a = t * 5.2 + arm * Math.PI + across / radius + 0.08;
    dustPositions[i * 3] = Math.cos(a) * (radius + across * 0.4);
    dustPositions[i * 3 + 1] = (rng() - 0.5) * 0.05;
    dustPositions[i * 3 + 2] = Math.sin(a) * (radius + across * 0.4);
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: INK, size: 0.2, map: glowTexture(), transparent: true, opacity: 0.45, depthWrite: false }),
  );
  galaxy.add(dust);

  // Sparkling stars: a few bright points with a soft flare, scattered across the belt.
  const sparkleCount = 90;
  const sparklePositions = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i++) {
    const arm = i % 2;
    const t = Math.pow(rng(), 0.8);
    const radius = 0.6 + t * 4.4;
    const a = t * 5.2 + arm * Math.PI + (rng() - 0.5) * 0.3;
    sparklePositions[i * 3] = Math.cos(a) * radius;
    sparklePositions[i * 3 + 1] = (rng() - 0.5) * 0.08;
    sparklePositions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const sparkleGeometry = new THREE.BufferGeometry();
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
  const sparkles = new THREE.Points(
    sparkleGeometry,
    new THREE.PointsMaterial({ color: PAPER, size: 0.2, map: glowTexture(), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  galaxy.add(sparkles);

  // The core: a soft bright glow with a lime heart, breathing gently.
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: PAPER, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  coreGlow.scale.set(2.4, 2.4, 1);
  const coreHeart = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: ACCENT, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  coreHeart.scale.set(0.9, 0.9, 1);
  galaxy.add(coreGlow, coreHeart);

  return {
    group,
    lensed: true,
    lensRadius: 1.2,
    lensBlack: false,
    anchor: (halfW, halfH) => new THREE.Vector3(halfW * 0.22, -halfH * 0.05, 0),
    update: (elapsed) => {
      // The whole belt turns slowly, its stars and dust together.
      stars.rotation.y = elapsed * 0.05;
      dust.rotation.y = elapsed * 0.05;
      sparkles.rotation.y = elapsed * 0.05;
      coreGlow.material.opacity = 0.55 + Math.sin(elapsed * 0.9) * 0.08;
    },
  };
}
