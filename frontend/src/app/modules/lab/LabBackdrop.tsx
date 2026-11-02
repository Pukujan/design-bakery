import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { createLensPass, lensGeometry } from './lensing';
import { flowField, type FlowObstacle } from './flow';
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
 * The pointer moves the camera, so the sky shifts with parallax, and each body answers it in its own way.
 * Scroll and swipe move the camera and spin the sky. It pauses when off
 * screen or in a background tab, and holds one still frame under prefers-reduced-motion.
 */

export type BackdropVariant = 'hole' | 'pulsar' | 'giant' | 'system';

const STAR_COUNT = 220;
const LINK_DISTANCE = 2.1;
const MAX_PIXEL_RATIO = 1.75;
const FOV = 50;
/**
 * The build-up (adaptive visuals): the page starts at stage 0, a modest starfield with a lighter body, and
 * steps up while frames stay steady. The last stage is the full look the owner decided.
 */
const STAGES = [
  { stars: 90, body: 0.3 },
  { stars: 130, body: 0.45 },
  { stars: 170, body: 0.6 },
  { stars: 200, body: 0.8 },
  { stars: STAR_COUNT, body: 1 },
];
/** A window of steady frames whose median is above this means the device cannot keep up at this stage. */
const SLOW_FRAME_MS = 24;
/** How long the frames are sampled at one stage before it is judged. */
const SAMPLE_WINDOW_MS = 2000;
/** Frames ignored after mount, after a resize or keyboard opening, and after a route change. */
const WARMUP_MS = 1200;
const RESIZE_QUIET_MS = 1200;
const SWAP_QUIET_MS = 800;
/** The pause after a stage goes up, before it is judged, so the new particles are counted. */
const STAGE_COOLDOWN_MS = 600;
/** A gap this long between rendered frames is a stall (a freeze), not a frame. Slow frames below it still count. */
const STALL_MS = 1000;
/** Reading pages: where the body sits (fractions of the half view) and how large it is. */
const CORNER_X = 0.8;
const CORNER_Y = 0.72;
const CORNER_SCALE = 0.45;
/** List pages: the body stays in place at this share of its size, so the flowing text is pushed around less. */
const COMPACT_SCALE = 0.4;
/** On the list pages the flowing text keeps only this share of the body's flow radius: just the middle of the star. */
const COMPACT_FLOW = 0.45;
/** How strongly the blog sky keeps zooming in. It was 0.45, which made the star rush at the reader. */
const AMBIENT_ZOOM = 0.08;
/** The pace of a switch between bodies. */
const FLIGHT_SPEED = 0.55;
/** How far away the warp starts, in world units. */
const WARP_DEPTH = 30;
/** Desktop screens get brighter bodies and a stronger lens fringe; phones keep the plain look. */
const DESKTOP_VIVID = 1.5;
const VIVID_QUERY = '(min-width: 1024px)';

/** The warp peaks as the old body passes the camera, then settles: rising to the peak, then falling away. */
function warpPeak(p: number): number {
  return p < 0.55 ? Math.sin((Math.PI / 2) * (p / 0.55)) : Math.cos((Math.PI / 2) * ((p - 0.55) / 0.45));
}

function smoothStep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

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

  // Links are written in order of their later star, so the links among the first k stars are a prefix.
  // linkEnd[k] is how many line vertices to draw when only the first k stars show.
  const links: number[] = [];
  const linkEnd = new Uint32Array(STAR_COUNT + 1);
  for (let j = 0; j < STAR_COUNT; j++) {
    for (let i = 0; i < j; i++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) {
        links.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        links.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
      }
    }
    linkEnd[j + 1] = links.length / 3;
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
    linkEnd,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
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


/** `corner` tucks the body into the bottom-right corner, smaller, so a reading page has the whole width. */
/** `compact` keeps the body where it is but smaller, and the text that flows round it gets a smaller obstacle. */
export function LabBackdrop({
  variant = 'hole',
  corner = false,
  compact = false,
}: {
  variant?: BackdropVariant;
  corner?: boolean;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const variantRef = useRef<BackdropVariant>(variant);
  variantRef.current = variant;
  const cornerRef = useRef(corner);
  cornerRef.current = corner;
  const compactRef = useRef(compact);
  compactRef.current = compact;
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

    // The build-up. Stage 0 is drawn at once; the stage moves up while frames stay steady, and once a
    // slow window is seen it steps back one stage and holds there. Reduced motion has no animation, so it gets the full look.
    const build = {
      stage: reduceMotion ? STAGES.length - 1 : 0,
      settled: reduceMotion,
      quietUntil: performance.now() + WARMUP_MS,
      windowStart: -1,
      samples: [] as number[],
      median: 0,
    };
    const applyStage = (next: number) => {
      build.stage = next;
      sky.stars.geometry.setDrawRange(0, STAGES[next].stars);
      sky.lines.geometry.setDrawRange(0, sky.linkEnd[STAGES[next].stars]);
      body?.density?.(STAGES[next].body);
    };
    // Frames in these spans are not judged: the page is loading, resizing, swapping bodies or cooling after a step up.
    const quiet = (ms: number) => {
      build.quietUntil = Math.max(build.quietUntil, performance.now() + ms);
      build.windowStart = -1;
      build.samples = [];
    };

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
      const from = previous ? previous.anchor(halfW, halfH, look.sx, look.sy) : null;
      body = buildBody(next);
      body.density?.(STAGES[build.stage].body);
      quiet(SWAP_QUIET_MS);
      const to = body.anchor(halfW, halfH, look.sx, look.sy);
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
    // A swipe kicks the look in its direction, and it settles back once the finger stops.
    const swipe = { x: 0, y: 0 };
    // What the sky and the bodies answer to: the eased pointer plus the swipe kick.
    const look = { sx: 0, sy: 0, vivid: 1 };
    let lastTouch: { x: number; y: number } | null = null;

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
      const touch = event.touches[0];
      lastTouch = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !lastTouch) return;
      const dx = touch.clientX - lastTouch.x;
      const dy = touch.clientY - lastTouch.y;
      lastTouch = { x: touch.clientX, y: touch.clientY };
      swipe.x = THREE.MathUtils.clamp(swipe.x + (dx / window.innerWidth) * 3, -1, 1);
      swipe.y = THREE.MathUtils.clamp(swipe.y + (dy / window.innerHeight) * 3, -1, 1);
      spin.velocity -= dy * 0.00045;
    };
    const onTouchEnd = () => {
      lastTouch = null;
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
      quiet(RESIZE_QUIET_MS);
      if (reduceMotion) render(performance.now());
    });
    observer.observe(container);
    resize();

    let cornerK = cornerRef.current ? CORNER_SCALE : compactRef.current ? COMPACT_SCALE : 1;
    let frame = 0;
    let last = performance.now();
    let visible = true;
    const clock = { elapsed: 0 };
    // When the last judged frame started; null after a pause, so the first frame back is not a gap.
    let lastFrameAt: number | null = null;

    // A frame's interval feeds the build-up: a steady window moves the stage up, a slow one steps it back and holds.
    const judge = (now: number) => {
      const dt = lastFrameAt === null ? 0 : now - lastFrameAt;
      lastFrameAt = now;
      if (build.settled) return;
      if (now < build.quietUntil || dt <= 0 || dt > STALL_MS) {
        build.windowStart = -1;
        build.samples = [];
        return;
      }
      if (build.windowStart < 0) build.windowStart = now;
      build.samples.push(dt);
      if (now - build.windowStart < SAMPLE_WINDOW_MS) return;

      build.median = median(build.samples);
      build.samples = [];
      build.windowStart = -1;
      if (build.median > SLOW_FRAME_MS) {
        // The last stage that held is one below this one; stop there.
        if (build.stage > 0) applyStage(build.stage - 1);
        build.settled = true;
      } else if (build.stage < STAGES.length - 1) {
        applyStage(build.stage + 1);
        quiet(STAGE_COOLDOWN_MS);
      } else {
        build.settled = true;
      }
    };
    const onVisibility = () => {
      if (!document.hidden) quiet(RESIZE_QUIET_MS);
    };
    const onViewportResize = () => quiet(RESIZE_QUIET_MS);

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
      // The fringe is stronger on desktop, where the bodies are seen larger and brighter.
      lens.uniforms.uChroma.value = (1 + (look.vivid - 1) * 2) * (current.lensChroma ?? 1);
      lens.uniforms.uRingGlow.value = current.lensRing ?? 1;
    };

    const vividScreen = window.matchMedia(VIVID_QUERY);

    // What page text flows round, in viewport pixels: the body's disc, and any blades of light it has.
    const publishFlow = (current: Body) => {
      current.group.updateMatrixWorld(true);
      camera.updateMatrixWorld();
      const box = container.getBoundingClientRect();
      const toViewport = (point: THREE.Vector3) => {
        const ndc = point.clone().project(camera);
        return { x: box.left + (ndc.x * 0.5 + 0.5) * box.width, y: box.top + (0.5 - ndc.y * 0.5) * box.height };
      };
      const obstacles: FlowObstacle[] = [];
      if (current.flowRadius) {
        const centre = current.group.getWorldPosition(new THREE.Vector3());
        // On the list pages the text only bends right at the centre of the body, not around its whole reach.
        const reach = compactRef.current ? COMPACT_FLOW : 1;
        const edge = centre.clone().add(new THREE.Vector3(current.flowRadius * reach * current.group.scale.x * (current.flowScale?.() ?? 1), 0, 0));
        const c = toViewport(centre);
        const e = toViewport(edge);
        obstacles.push({ kind: 'disc', x: c.x, y: c.y, r: Math.abs(e.x - c.x) });
      }
      for (const points of current.flowShapes?.() ?? []) {
        obstacles.push({ kind: 'shape', points: points.map(toViewport) });
      }
      flowField.obstacles = obstacles;
    };

    const render = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock.elapsed += delta;

      if (variantRef.current !== bodyVariant) swapBody(variantRef.current);

      pointer.sx += (pointer.x - pointer.sx) * 0.05;
      pointer.sy += (pointer.y - pointer.sy) * 0.05;
      scroll.value += (scroll.target - scroll.value) * 0.08;
      swipe.x *= 0.93;
      swipe.y *= 0.93;
      look.sx = pointer.sx + swipe.x;
      look.sy = pointer.sy + swipe.y;
      look.vivid = vividScreen.matches ? DESKTOP_VIVID : 1;
      spin.velocity *= 0.94;
      spin.angle += spin.velocity * delta * 60;

      root.rotation.y = spin.angle * 0.2 + clock.elapsed * 0.02;
      root.rotation.x = scroll.value * 0.2;
      // The sky slides against the bodies as the look moves, the way a background does when the viewer moves.
      root.position.x = -look.sx * 1.0;
      root.position.y = look.sy * 0.6;
      const distance = 10 - scroll.value * 3.2;
      turnProgress = Math.min(1, turnProgress + delta * FLIGHT_SPEED);
      // On blog pages the sky keeps a faint slow zoom, so its lines drift past.
      const ambient = variantRef.current === 'giant' && !reduceMotion ? AMBIENT_ZOOM + AMBIENT_ZOOM * 0.4 * Math.sin(clock.elapsed * 0.35) : 0;
      const warp = Math.max(warpPeak(turnProgress), ambient);
      // The flyby, like a ship going past: the camera slides beside the body it is leaving, banks as it
      // goes, and warps on into the next body.
      const sideX = (leaving[0]?.from.x ?? 0) * 0.6 * warp;
      camera.position.set(sideX, -look.sy * 0.4, distance);
      camera.lookAt(sideX, 0, 0);
      camera.rotateZ(-flightSide * 0.16 * warp);
      // The space warp: the view stretches, the stars rush past the camera and grow streaked, then it settles.
      camera.fov = FOV + 34 * warp;
      camera.updateProjectionMatrix();
      root.position.z = 16 * warp;
      (sky.stars.material as THREE.PointsMaterial).size = 0.07 + 0.22 * warp;

      const halfH = Math.tan((FOV * Math.PI) / 360) * 10;
      const halfW = halfH * camera.aspect;

      // The old body leaves as the warp peaks: it accelerates at the camera, grows, and goes past it.
      const passing = smoothStep((turnProgress - 0.05) / 0.6);
      for (const old of leaving) {
        old.body.update(clock.elapsed, delta, look);
        old.body.group.position.set(old.from.x, old.from.y, old.from.z + 16 * passing);
        old.body.group.scale.setScalar(1 + passing * 1.2);
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
      // Ease toward the corner size, or jump there under reduced motion.
      const cornerSize = cornerRef.current ? CORNER_SCALE : compactRef.current ? COMPACT_SCALE : 1;
      cornerK += (cornerSize - cornerK) * (reduceMotion ? 1 : 0.06);
      intro = reduceMotion ? 1 : Math.min(1, intro + delta * 1.4);
      current.group.scale.setScalar(Math.max(0.001, easeOut(intro)) * cornerK);
      current.update(clock.elapsed, delta, look);

      const spot = current.anchor(halfW, halfH, look.sx, look.sy);
      if (cornerRef.current) spot.set(halfW * CORNER_X, -halfH * CORNER_Y, spot.z);
      if (!placed) {
        current.group.position.copy(spot);
        placed = true;
      }
      if (turnProgress < 1) {
        // Warping in as the old body leaves: the new one comes out of the tunnel and settles into its place.
        const arrive = easeOut(Math.min(1, Math.max(0, (turnProgress - 0.3) / 0.7)));
        const start = new THREE.Vector3(spot.x, spot.y, -WARP_DEPTH);
        current.group.position.lerpVectors(start, spot, arrive);
        current.group.scale.setScalar((0.25 + 0.75 * arrive) * cornerK);
      } else {
        current.group.position.lerp(spot, reduceMotion ? 1 : 0.06);
      }

      publishFlow(current);
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
      if (!visible || document.hidden) {
        lastFrameAt = null;
        return;
      }
      judge(now);
      render(now);
    };

    applyStage(build.stage);
    // The debug value is for development checks only; production builds never set it.
    if (import.meta.env.DEV) {
      (window as unknown as { __lab?: unknown }).__lab = {
        get stage() {
          return build.stage;
        },
        get stars() {
          return STAGES[build.stage].stars;
        },
        get settled() {
          return build.settled;
        },
        get medianFrameMs() {
          return build.median;
        },
      };
    }

    if (reduceMotion) {
      render(performance.now());
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('resize', onViewportResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      window.visualViewport?.addEventListener('resize', onViewportResize);
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
        window.removeEventListener('resize', onViewportResize);
        document.removeEventListener('visibilitychange', onVisibility);
        window.visualViewport?.removeEventListener('resize', onViewportResize);
        observer.disconnect();
        if (import.meta.env.DEV) delete (window as unknown as { __lab?: unknown }).__lab;
        teardown();
      };
    }

    function teardown() {
      flowField.obstacles = [];
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
