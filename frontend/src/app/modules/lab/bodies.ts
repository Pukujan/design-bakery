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
  /** The radius, in world units, of the disc that page text flows round. Without one, text runs over the body. */
  flowRadius?: number;
  /** How much bigger than its group the body is drawn at the moment, so its flow disc can grow with it. Defaults to 1. */
  flowScale?: () => number;
  /** How strong the lens colour fringe is on this body. Defaults to 1; 0 leaves the colours as they are. */
  lensChroma?: number;
  /** How strong the lime ring at the body's edge is. Defaults to 1; 0 removes it. */
  lensRing?: number;
  /** Outlines, in world units, that page text flows round as well: for moving blades of light. */
  flowShapes?: () => THREE.Vector3[][];
  /** Where the body sits, from the viewport's half-size and the eased pointer. */
  anchor: (halfW: number, halfH: number, sx: number, sy: number) => THREE.Vector3;
  /** Animates the body. `look` is the eased pointer, from -1 to 1 on each axis. */
  update: (elapsed: number, delta: number, look: Look) => void;
  /** Draws only the first share of the body's particles (0 to 1). The full set is built once; a lighter stage just draws less. */
  density?: (fraction: number) => void;
};

/** The eased pointer, as the backdrop reads it, and how vivid the screen is (brighter on desktop). */
export type Look = { sx: number; sy: number; vivid: number };

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

/** Draws only the first share of a geometry's items: `perItem` vertices each, so line pairs stay whole. */
function share(geometry: THREE.BufferGeometry, total: number, fraction: number, perItem = 1) {
  geometry.setDrawRange(0, Math.max(1, Math.round(total * fraction)) * perItem);
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
    flowRadius: HORIZON_RADIUS * 1.3,
    anchor: (halfW, halfH, sx, sy) =>
      new THREE.Vector3(THREE.MathUtils.clamp(halfW * 0.5, 0.9, 3.8) + sx * Math.min(halfW * 0.22, 1.8), halfH * 0.22 - sy * halfH * 0.14, 0),
    update: (_elapsed, delta) => {
      disk.rotation.y += delta * 0.32;
    },
    density: (fraction) => share(diskGeometry, diskCount, fraction),
  };
}

/** The pulsar's colours: electric blue and violet field lines, a few pink ones, a white-hot core and a blue halo. */
const PULSAR_BLUE = new THREE.Color('#5f8bff');
const PULSAR_VIOLET = new THREE.Color('#8f78ff');
const PULSAR_PINK = new THREE.Color('#ff7a8a');
const PULSAR_HALO = new THREE.Color('#1f6fff');

/** How far behind the picture plane the star sits, so its field can spread across the screen. */
const STAR_DEPTH = 3;
/** The camera sits 10 units from the picture plane, so a point at the star's depth is drawn this much smaller. */
const DEPTH_SCALE = (10 + STAR_DEPTH) / 10;

/**
 * A pulsar as a magnetosphere: a white-hot core, with field lines looping from one pole to the other,
 * the way a magnetar's field does. The whole field turns slowly, tilted off its axis.
 */
export function buildPulsar(): Body {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = 1.1;
  const spin = new THREE.Group();
  tilt.add(spin);
  // Everything the star is made of sits in one sized group, so the whole star grows together.
  const sized = new THREE.Group();
  sized.add(tilt);
  group.add(sized);
  const rng = seeded(41);
  // How big the star is drawn: much bigger on desktop, where it should fill more of the screen.
  let size = 1;

  // The core: a white-hot point, a bright glow round it and a blue halo beyond.
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const coreGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: 0xe6f0ff, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  coreGlow.scale.set(2.6, 2.6, 1);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: PULSAR_HALO, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  halo.scale.set(7, 7, 1);
  // The haze: a broad violet glow that fills the space round the core, as in the reference.
  const haze = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), color: PULSAR_VIOLET, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  haze.scale.set(14, 14, 1);
  sized.add(haze, halo, coreGlow, core);

  // The field lines are dipole lines, r = L sin²θ: each runs out from one pole, round the star at distance L, and back to the other.
  // Each line lies in its own plane, so together they fill a bundle, most of them close to the core.
  const SEGMENTS = 56;
  const LINES = 420;
  const positions: number[] = [];
  const colors: number[] = [];
  const colour = new THREE.Color();
  for (let i = 0; i < LINES; i++) {
    const L = 1.25 + Math.pow(rng(), 1.6) * 3.4;
    const azimuth = rng() * Math.PI * 2;
    const pick = rng();
    const base = pick < 0.55 ? PULSAR_BLUE : pick < 0.8 ? PULSAR_VIOLET : PULSAR_PINK;
    colour.copy(base).multiplyScalar(0.45 + rng() * 0.55);
    // Keep each line outside the core, so the lines start and end on its surface.
    const thetaMin = Math.asin(Math.min(1, Math.sqrt(0.36 / L)));
    let previous: THREE.Vector3 | null = null;
    for (let k = 0; k <= SEGMENTS; k++) {
      const theta = thetaMin + ((Math.PI - 2 * thetaMin) * k) / SEGMENTS;
      const r = L * Math.sin(theta) ** 2;
      const point = new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(azimuth),
        r * Math.cos(theta),
        r * Math.sin(theta) * Math.sin(azimuth),
      );
      if (previous) {
        positions.push(previous.x, previous.y, previous.z, point.x, point.y, point.z);
        colors.push(colour.r, colour.g, colour.b, colour.r, colour.g, colour.b);
      }
      previous = point;
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  spin.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  return {
    group,
    lensed: true,
    lensRadius: 1.2,
    lensBlack: false,
    // Text flows round the field's dense inner loops, not just the core.
    flowRadius: 2.8,
    flowScale: () => size,
    anchor: (halfW, halfH) => new THREE.Vector3(-halfW * 0.6 * DEPTH_SCALE, halfH * 0.58 * DEPTH_SCALE, -STAR_DEPTH),
    update: (elapsed, _delta, look) => {
      // The star leans toward the cursor, and its field turns slowly about its axis.
      group.rotation.set(look.sy * 0.5, look.sx * 0.7, 0);
      // On desktop the star is drawn much larger, so its field fills more of the screen.
      size = look.vivid > 1 ? 1.8 : 1;
      sized.scale.setScalar(size);
      spin.rotation.y = elapsed * 0.35;
      // A slow tumble on the other axis, so the field rolls over as it turns.
      spin.rotation.x = Math.sin(elapsed * 0.7) * 0.15;
      const breath = Math.sin(elapsed * 2.2);
      lineMaterial.opacity = Math.min(1, (0.85 + 0.1 * breath) * look.vivid);
      coreGlow.material.opacity = Math.min(1, (0.9 + 0.1 * breath) * look.vivid);
    },
    density: (fraction) => share(lineGeometry, LINES, fraction, 2 * SEGMENTS),
  };
}

/**
 * The blog pages' backdrop: only the pulsar's blue field lines, with no bright star. The field moves toward the
 * viewer and back, so its lines stream past as we fall in, and at the far end we are behind the star.
 */
export function buildGiant(): Body {
  const pulsar = buildPulsar();
  // Keep only the field: take the star's core, halo and haze out of the sized group, and leave the field's tilted group.
  const sized = pulsar.group.children[0] as THREE.Group;
  for (const child of [...sized.children]) {
    if (!(child instanceof THREE.Group)) sized.remove(child);
  }
  // How far in we are: 0 is pulled back, 1 is zoomed in.
  let zoom = 0;
  // The star's depth from the picture plane: from 3 units behind it, to 14 units beyond it, so at the far end we are behind the star.
  const depthOf = () => -3 + 17 * zoom;
  return {
    ...pulsar,
    anchor: (halfW, halfH) => {
      const z = depthOf();
      const k = (10 - z) / 10;
      return halfW < halfH
        ? new THREE.Vector3(0, -halfH * 0.5 * k, z)
        : new THREE.Vector3(-halfW * 0.15 * k, -halfH * 0.05 * k, z);
    },
    update: (elapsed, delta, look) => {
      zoom = 0.6 + 0.4 * Math.sin(elapsed * 0.35);
      pulsar.update(elapsed, delta, look);
    },
  };
}

/** A spiral galaxy wide across the screen: two dense arms of stars, dark dust lanes between them, sparkling stars and a soft core. */
export function buildSystem(): Body {
  const group = new THREE.Group();
  const rng = seeded(19);
  const galaxy = new THREE.Group();
  galaxy.rotation.x = 0.85;
  galaxy.scale.setScalar(0.8);
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
    flowRadius: 1.8,
    // The core sits in the reading column, so the page text wraps round its disc.
    anchor: (halfW, halfH) => new THREE.Vector3(halfW * 0.3, -halfH * 0.05, 0),
    update: (elapsed, _delta, look) => {
      // The whole belt turns slowly, its stars and dust together.
      stars.rotation.y = elapsed * 0.05;
      dust.rotation.y = elapsed * 0.05;
      sparkles.rotation.y = elapsed * 0.05;
      coreGlow.material.opacity = Math.min(1, (0.55 + Math.sin(elapsed * 0.9) * 0.08) * look.vivid);
    },
    density: (fraction) => {
      share(starGeometry, count, fraction);
      share(dustGeometry, dustCount, fraction);
      share(sparkleGeometry, sparkleCount, fraction);
    },
  };
}
