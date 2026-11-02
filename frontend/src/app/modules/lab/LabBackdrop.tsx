import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { createLensPass, lensGeometry } from './lensing';
import {
  HORIZON_RADIUS,
  PAPER,
  buildHole,
  buildGiant,
  buildPulsar,
  buildSystem,
  glowTexture,
  seeded,
  type Body,
} from './bodies';

/**
 * The lab backdrop (TASK-DB-0098): a constellation with one body in it. The black hole on /lab
 * (lensed, from the ACS constellation), a pulsar on /contact, a nebula on /blogs and a star system
 * on /research. The canvas stays mounted across pages; a route change swaps the body and fades it in.
 * The pointer tilts the sky, scroll and swipe move the camera and spin it. It pauses when off
 * screen or in a background tab, and holds one still frame under prefers-reduced-motion.
 */

export type BackdropVariant = 'hole' | 'pulsar' | 'giant' | 'system';

const STAR_COUNT = 220;
const LINK_DISTANCE = 2.1;
const MAX_PIXEL_RATIO = 1.75;
const FOV = 50;
/** How far a body flies in or out of frame on a switch, and the pace of the switch. */
const FLY = 26;
const FLIGHT_SPEED = 0.55;
/** How far away the warp starts, in world units. */
const WARP_DEPTH = 30;

/** The constellation: stars joined by faint lines, the same on every page. */
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
      new THREE.PointsMaterial({ color: PAPER, size: 0.07, map: glowTexture(), transparent: true, opacity: 0.7, depthWrite: false }),
    ),
    lines: new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.06, depthWrite: false }),
    ),
  };
}

function buildBody(variant: BackdropVariant): Body {
  switch (variant) {
    case 'pulsar':
      return buildPulsar();
    case 'giant':
      return buildGiant();
    case 'system':
      return buildSystem();
    default:
      return buildHole(seeded(7));
  }
}

/** Frees a body's geometry, materials and textures. */
function disposeTree(object: THREE.Object3D) {
  object.traverse((item) => {
    const mesh = item as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const material of materials) {
      (material as THREE.Material & { map?: THREE.Texture | null }).map?.dispose();
      material.dispose();
    }
  });
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}


export function LabBackdrop({ variant = 'hole' }: { variant?: BackdropVariant }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const variantRef = useRef<BackdropVariant>(variant);
  variantRef.current = variant;
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
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const sky = buildSky(seeded(7));
    const root = new THREE.Group();
    root.add(sky.stars, sky.lines);
    scene.add(root);

    const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
    const lens = createLensPass(target.texture);

    // The body on screen. A route change swaps it; the new one fades in.
    let body: Body | null = null;
    let bodyVariant: BackdropVariant | null = null;
    let placed = false;
    let intro = 0;
    // The camera turn toward a new body: progress 0 starts the turn, 1 is facing forward.
    let turnProgress = 1;
    // The outgoing bodies, each with where it was and which side it flies off.
    const leaving: { body: Body; from: THREE.Vector3; side: number }[] = [];
    let flightSide = 1;
    const viewHalf = () => {
      const halfH = Math.tan((FOV * Math.PI) / 360) * 10;
      return { halfW: halfH * camera.aspect, halfH };
    };
    const swapBody = (next: BackdropVariant) => {
      const { halfW, halfH } = viewHalf();
      const previous = body;
      const from = previous ? previous.anchor(halfW, halfH, pointer.sx, pointer.sy) : null;
      body = buildBody(next);
      const to = body.anchor(halfW, halfH, pointer.sx, pointer.sy);
      // The new body comes in from the side away from the old one, which leaves the other way.
      flightSide = from && to.x !== from.x ? Math.sign(to.x - from.x) : 1;
      if (previous && from) leaving.push({ body: previous, from, side: flightSide });
      body.group.scale.setScalar(previous ? 1 : 0.001);
      scene.add(body.group);
      bodyVariant = next;
      placed = false;
      intro = previous ? 1 : 0;
      turnProgress = previous && !reduceMotion ? 0 : 1;
    };

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

    // The lens pass needs the body's place on screen and its size, both from this frame's camera.
    const updateLens = (current: Body) => {
      const centre = current.group.getWorldPosition(new THREE.Vector3());
      const screen = centre.clone().project(camera);
      const lensed = lensGeometry(current.lensRadius ?? HORIZON_RADIUS, camera.position.distanceTo(centre), FOV, camera.aspect);
      lens.uniforms.uBlack.value = current.lensBlack ? 1 : 0;
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

      if (variantRef.current !== bodyVariant) swapBody(variantRef.current);

      pointer.sx += (pointer.x - pointer.sx) * 0.05;
      pointer.sy += (pointer.y - pointer.sy) * 0.05;
      scroll.value += (scroll.target - scroll.value) * 0.08;
      spin.velocity *= 0.94;
      spin.angle += spin.velocity * delta * 60;

      root.rotation.y = pointer.sx * 0.3 + spin.angle * 0.2 + clock.elapsed * 0.02;
      root.rotation.x = pointer.sy * 0.18 + scroll.value * 0.2;
      const distance = 10 - scroll.value * 3.2;
      turnProgress = Math.min(1, turnProgress + delta * FLIGHT_SPEED);
      const warp = Math.sin(Math.PI * turnProgress);
      // The flyby, like a ship going past: the camera slides beside the body it is leaving, banks as it
      // goes, and warps on into the next body.
      const sideX = (leaving[0]?.from.x ?? 0) * 0.6 * warp;
      camera.position.set(sideX, -pointer.sy * 0.4, distance);
      camera.lookAt(sideX, 0, 0);
      camera.rotateZ(-flightSide * 0.16 * warp);
      // The space warp: the view stretches, the stars rush past the camera and grow streaked, then it settles.
      camera.fov = FOV + 34 * warp;
      camera.updateProjectionMatrix();
      root.position.z = 16 * warp;
      (sky.stars.material as THREE.PointsMaterial).size = 0.07 + 0.22 * warp;

      const halfH = Math.tan((FOV * Math.PI) / 360) * 10;
      const halfW = halfH * camera.aspect;

      const e = easeOut(turnProgress);
      for (const old of leaving) {
        old.body.update(clock.elapsed, delta);
        // The old body is passed: it rushes at the camera, grows, and goes past it.
        old.body.group.position.set(old.from.x, old.from.y, old.from.z + WARP_DEPTH * 1.6 * e);
        old.body.group.scale.setScalar(1 + e * 0.8);
      }
      if (turnProgress >= 1) {
        for (const old of leaving) {
          scene.remove(old.body.group);
          disposeTree(old.body.group);
        }
        leaving.length = 0;
      }

      const current = body as Body | null;
      if (!current) return;
      intro = reduceMotion ? 1 : Math.min(1, intro + delta * 1.4);
      current.group.scale.setScalar(Math.max(0.001, easeOut(intro)));
      current.update(clock.elapsed, delta);

      const spot = current.anchor(halfW, halfH, pointer.sx, pointer.sy);
      if (!placed) {
        current.group.position.copy(spot);
        placed = true;
      }
      if (turnProgress < 1) {
        // Warping in: the new body comes out of deep space and settles into its place.
        const start = new THREE.Vector3(spot.x, spot.y, -WARP_DEPTH);
        current.group.position.lerpVectors(start, spot, e);
      } else {
        current.group.position.lerp(spot, reduceMotion ? 1 : 0.06);
      }

      if (current.lensed) {
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        updateLens(current);
        renderer.render(lens.scene, lens.camera);
      } else {
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(scene, camera);
      }
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
      disposeTree(scene);
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
