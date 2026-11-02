import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { createLensPass, lensGeometry } from './lensing';

/**
 * The hero's background: a black hole sitting in a constellation (TASK-DB-0098).
 * Adapted from the ACS constellation's hotloader (Pukujan/acs-constellation, lib/blackhole.ts):
 * an event horizon, a photon ring, an accretion disk and halo glows, set in a field of stars
 * joined by constellation lines. The pointer tilts the sky, scroll and swipe push it forward and
 * spin it. It pauses when off screen or in a background tab, and holds one still frame under
 * prefers-reduced-motion.
 */

const PAPER = new THREE.Color('#f2efe8');
const ACCENT = new THREE.Color('#c6f432');
const STAR_COUNT = 220;
const LINK_DISTANCE = 2.1;
const DISK_COUNT = 1100;
const MAX_PIXEL_RATIO = 1.75;
const FOV = 50;
const HORIZON_RADIUS = 1.05;

/** A small seeded random, so the constellation is the same on every visit. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft round sprite for stars, the disk and the halo. */
function glowTexture(): THREE.CanvasTexture {
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

function buildSky(rng: () => number) {
  const positions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = rng() * 2 - 1;
    const theta = rng() * Math.PI * 2;
    const radius = 5 + rng() * 6;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = radius * s * Math.cos(theta);
    positions[i * 3 + 1] = radius * u * 0.6;
    positions[i * 3 + 2] = radius * s * Math.sin(theta);
  }

  const links: number[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    for (let j = i + 1; j < STAR_COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) {
        links.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        links.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
      }
    }
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(links, 3));
  return {
    stars: new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: PAPER, size: 0.09, map: glowTexture(), transparent: true, depthWrite: false }),
    ),
    lines: new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.12, depthWrite: false }),
    ),
  };
}

function buildHole(rng: () => number) {
  const hole = new THREE.Group();

  // Event horizon: black, so the stars behind it are hidden.
  hole.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })));

  // Photon ring, and a fainter one just outside it.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.14, 0.02, 12, 200),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.95 }),
  );
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.008, 8, 220),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.35 }),
  );
  hole.add(ring, outerRing);

  // Accretion disk: tilted, its particles brighter and more accent-coloured near the hole.
  const diskPositions = new Float32Array(DISK_COUNT * 3);
  const diskColors = new Float32Array(DISK_COUNT * 3);
  const inner = 1.3;
  const outer = 3.1;
  const colour = new THREE.Color();
  for (let i = 0; i < DISK_COUNT; i++) {
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
  hole.add(disk);

  // Halo: two wide soft glows around the whole hole.
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
  hole.add(haloNear, haloFar);

  return { hole, disk };
}

export function LabBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const rng = seeded(7);
    const sky = buildSky(rng);
    const { hole, disk } = buildHole(rng);
    const root = new THREE.Group();
    // The hole is not in the rotating sky group: it sits off-centre and drifts with the cursor.
    root.add(sky.stars, sky.lines);
    scene.add(root, hole);
    const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
    const lens = createLensPass(target.texture);

    // Pointer, scroll and swipe are read into targets; the frame loop eases toward them.
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const scroll = { target: 0, value: 0 };
    const spin = { velocity: 0, angle: 0 };
    let lastTouchY: number | null = null;

    const onPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll.target = Math.min(window.scrollY / (window.innerHeight * 1.2), 1);
    };
    const onWheel = (event: WheelEvent) => {
      spin.velocity += event.deltaY * 0.00035;
    };
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || lastTouchY === null) return;
      spin.velocity += (lastTouchY - y) * 0.00045;
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const ratio = renderer.getPixelRatio();
      target.setSize(Math.round(width * ratio), Math.round(height * ratio));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    // With reduced motion there is no loop, so a resize redraws the single still frame.
    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) render(performance.now());
    });
    observer.observe(container);
    resize();

    let frame = 0;
    let last = performance.now();
    let visible = true;
    const clock = { elapsed: 0 };

    // Off-centre: to the right on a wide screen, upper on a phone, drifting toward the cursor.
    let placed = false;
    const placeHole = (ease: number) => {
      const halfH = Math.tan((FOV * Math.PI) / 360) * 10;
      const halfW = halfH * camera.aspect;
      const x = THREE.MathUtils.clamp(halfW * 0.5, 0.9, 3.8) + pointer.sx * Math.min(halfW * 0.16, 1.2);
      const y = halfH * 0.22 - pointer.sy * halfH * 0.14;
      if (!placed) {
        hole.position.set(x, y, 0);
        placed = true;
        return;
      }
      hole.position.x += (x - hole.position.x) * ease;
      hole.position.y += (y - hole.position.y) * ease;
    };

    // The lens pass needs the hole's place on screen and its size, both from this frame's camera.
    const updateLens = () => {
      const centre = hole.getWorldPosition(new THREE.Vector3());
      const screen = centre.clone().project(camera);
      const lensed = lensGeometry(HORIZON_RADIUS, camera.position.distanceTo(centre), FOV, camera.aspect);
      lens.uniforms.uCenter.value.set(screen.x * 0.5 + 0.5, screen.y * 0.5 + 0.5);
      lens.uniforms.uAspect.value = camera.aspect;
      lens.uniforms.uShadow.value = lensed.shadow;
      lens.uniforms.uOuter.value = lensed.outer;
      lens.uniforms.uStrength.value = lensed.strength;
    };

    const render = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock.elapsed += delta;

      pointer.sx += (pointer.x - pointer.sx) * 0.05;
      pointer.sy += (pointer.y - pointer.sy) * 0.05;
      scroll.value += (scroll.target - scroll.value) * 0.08;
      spin.velocity *= 0.94;
      spin.angle += spin.velocity * delta * 60;

      root.rotation.y = pointer.sx * 0.3 + spin.angle * 0.2 + clock.elapsed * 0.02;
      root.rotation.x = pointer.sy * 0.18 + scroll.value * 0.2;
      camera.position.z = 10 - scroll.value * 3.2;
      camera.position.y = -pointer.sy * 0.4;
      camera.lookAt(0, 0, 0);
      disk.rotation.y += delta * 0.32;

      placeHole(reduceMotion ? 1 : 0.06);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      updateLens();
      renderer.render(lens.scene, lens.camera);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      render(now);
    };

    if (reduceMotion) {
      render(performance.now());
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(container);
      frame = requestAnimationFrame(loop);
      last = performance.now();
      onScroll();

      return () => {
        cancelAnimationFrame(frame);
        io.disconnect();
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        observer.disconnect();
        teardown();
      };
    }

    function teardown() {
      scene.traverse((object) => {
        const item = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        item.geometry?.dispose();
        const materials = Array.isArray(item.material) ? item.material : item.material ? [item.material] : [];
        for (const material of materials) {
          const map = (material as THREE.Material & { map?: THREE.Texture | null }).map;
          map?.dispose();
          material.dispose();
        }
      });
      target.dispose();
      lens.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }

    return () => {
      observer.disconnect();
      teardown();
    };
  }, [reduceMotion]);

  return <div ref={containerRef} className="lab-backdrop" />;
}
