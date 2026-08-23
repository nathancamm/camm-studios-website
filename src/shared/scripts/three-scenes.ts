import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type SceneName = 'monogram' | 'bronzed' | 'stellar';
type Pointer = { x: number; y: number };
type SceneWorld = {
  group: Group;
  update: (elapsed: number, pointer: Pointer, rest: boolean) => void;
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runtimes = new Map<HTMLCanvasElement, SceneRuntime>();

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function glassMaterial() {
  return new MeshPhysicalMaterial({
    color: new Color('#9fb4c6'),
    metalness: 0.16,
    roughness: 0.05,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.1,
    emissive: new Color('#bcd9ff'),
    emissiveIntensity: 0,
  });
}

function metalMaterial() {
  return new MeshStandardMaterial({
    color: new Color('#2b3138'),
    metalness: 0.92,
    roughness: 0.32,
    envMapIntensity: 1.1,
  });
}

function glossBlackMaterial() {
  return new MeshPhysicalMaterial({
    color: new Color('#0b0e12'),
    metalness: 0.4,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.2,
  });
}

function glassPanel(width: number, height: number, depth: number, radius: number) {
  const mesh = new Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), glassMaterial());
  const inner = new Mesh(
    new RoundedBoxGeometry(Math.max(width - 0.5, 0.3), Math.max(height - 0.5, 0.3), depth * 0.55, 4, radius * 0.7),
    new MeshPhysicalMaterial({
      color: new Color('#22303d'),
      metalness: 0.55,
      roughness: 0.18,
      transparent: true,
      opacity: 0.62,
      envMapIntensity: 1.1,
    }),
  );
  mesh.add(inner);
  return mesh;
}

function servoJoint(radius = 0.44) {
  const joint = new Group();
  const hub = new Mesh(new CylinderGeometry(radius, radius, 1.05, 28), metalMaterial());
  hub.rotation.x = Math.PI / 2;
  const ring = new Mesh(new TorusGeometry(radius * 0.94, radius * 0.16, 12, 32), glossBlackMaterial());
  const cap = new Mesh(new CylinderGeometry(radius * 0.45, radius * 0.45, 1.16, 20), glossBlackMaterial());
  cap.rotation.x = Math.PI / 2;
  joint.add(hub, ring, cap);
  for (let index = 0; index < 4; index += 1) {
    const bolt = new Mesh(new SphereGeometry(0.05, 10, 10), metalMaterial());
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    bolt.position.set(Math.cos(angle) * radius * 0.68, Math.sin(angle) * radius * 0.68, 0.55);
    joint.add(bolt);
  }
  return joint;
}

function rivetRow(target: Object3D, count: number, length: number, vertical: boolean, z: number) {
  for (let index = 0; index < count; index += 1) {
    const rivet = new Mesh(new SphereGeometry(0.045, 10, 10), metalMaterial());
    const along = (index / (count - 1) - 0.5) * length;
    rivet.position.set(vertical ? 0 : along, vertical ? along : 0, z);
    target.add(rivet);
  }
}

/**
 * The Camm monogram: a translucent robotic serpent coiled into the C mark.
 * Glass vertebra panels, dark servo joints, and a camera eye on the head.
 */
function buildMonogram(): SceneWorld {
  const group = new Group();
  const chain: Mesh[] = [];
  const joints: Group[] = [];

  const addSegment = (mesh: Mesh, x: number, y: number) => {
    mesh.position.set(x, y, 0);
    mesh.userData.base = mesh.position.clone();
    group.add(mesh);
    chain.push(mesh);
    return mesh;
  };

  const tail = addSegment(glassPanel(1.8, 1.7, 1.0, 0.42), 3.05, -1.95);
  const bottomBar = addSegment(glassPanel(5.9, 1.5, 1.0, 0.45), -0.35, -3.05);
  const leftColumn = addSegment(glassPanel(1.5, 5.6, 1.0, 0.45), -3.3, 0);
  const midStub = addSegment(glassPanel(4.4, 1.4, 0.95, 0.4), -1.05, 0.1);
  const topBar = addSegment(glassPanel(5.9, 1.5, 1.0, 0.45), -0.35, 3.05);
  const head = addSegment(glassPanel(2.1, 2.0, 1.15, 0.42), 3.3, 1.75);

  rivetRow(topBar, 5, 4.4, false, 0.52);
  rivetRow(bottomBar, 5, 4.4, false, 0.52);
  rivetRow(leftColumn, 4, 4.4, true, 0.52);
  rivetRow(midStub, 3, 2.4, false, 0.5);

  const jointSpots: Array<[number, number]> = [
    [-2.55, 3.05],
    [2.3, 2.85],
    [-2.55, -3.05],
    [2.25, -2.95],
  ];
  jointSpots.forEach(([x, y]) => {
    const joint = servoJoint();
    joint.position.set(x, y, 0);
    group.add(joint);
    joints.push(joint);
  });

  const eye = new Group();
  const bezel = new Mesh(new CylinderGeometry(0.62, 0.66, 0.2, 32), glossBlackMaterial());
  bezel.rotation.x = Math.PI / 2;
  const bezelRing = new Mesh(new TorusGeometry(0.62, 0.07, 12, 40), metalMaterial());
  bezelRing.position.z = 0.08;
  const lens = new Mesh(new CylinderGeometry(0.44, 0.47, 0.16, 32), glossBlackMaterial());
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.1;
  const irisMaterial = new MeshStandardMaterial({
    color: new Color('#0a1018'),
    emissive: new Color('#7fb4ff'),
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const iris = new Mesh(new CylinderGeometry(0.16, 0.16, 0.06, 24), irisMaterial);
  iris.rotation.x = Math.PI / 2;
  iris.position.z = 0.2;
  eye.add(bezel, bezelRing, lens, iris);
  eye.position.set(0, 0, 0.62);
  head.add(eye);
  rivetRow(head, 2, 1.3, false, 0.6);

  group.scale.setScalar(0.4);
  group.position.y = 0.1;

  const glassParts = [tail, bottomBar, leftColumn, midStub, topBar, head];

  return {
    group,
    update(elapsed, pointer, rest) {
      glassParts.forEach((part, index) => {
        const intro = rest ? 1 : MathUtils.clamp((elapsed - index * 0.09) / 0.65, 0, 1);
        part.scale.setScalar(intro < 1 ? Math.max(easeOutBack(intro), 0.001) : 1);

        const base = part.userData.base as { x: number; y: number };
        const slither = rest ? 0 : Math.sin(elapsed * 1.35 - index * 1.05) * 0.05;
        const wide = part === topBar || part === bottomBar || part === midStub;
        part.position.x = base.x + (wide ? slither : 0);
        part.position.y = base.y + (wide ? 0 : slither);
        part.position.z = rest ? 0 : Math.sin(elapsed * 0.9 - index * 0.7) * 0.04;

        const material = part.material as MeshPhysicalMaterial;
        const phase = (elapsed + 1.2) % 5;
        const center = 0.4 + index * 0.26;
        material.emissiveIntensity = rest ? 0 : Math.exp(-((phase - center) ** 2) / 0.028) * 0.5;
      });

      joints.forEach((joint, index) => {
        joint.rotation.z = rest ? 0 : elapsed * (index % 2 === 0 ? 0.5 : -0.5) + index;
      });

      head.rotation.z = rest ? 0 : Math.sin(elapsed * 0.7) * 0.03;
      eye.rotation.y = MathUtils.lerp(eye.rotation.y, pointer.x * 0.32, 0.08);
      eye.rotation.x = MathUtils.lerp(eye.rotation.x, pointer.y * 0.26, 0.08);
      const aperture = rest ? 1 : 1 + Math.sin(elapsed * 2.1) * 0.08;
      iris.scale.set(aperture, 1, aperture);
      irisMaterial.emissiveIntensity = rest ? 0.9 : 0.8 + Math.sin(elapsed * 2.1) * 0.35;
    },
  };
}

/**
 * Bronzed: a glass solar dial. Twelve rays around an ember core,
 * a tilted orbit with a tracking bead, and a slow instrument hand.
 */
function buildBronzed(accent: Color): SceneWorld {
  const group = new Group();

  const core = new Mesh(new SphereGeometry(1.05, 40, 40), glassMaterial());
  const emberMaterial = new MeshStandardMaterial({
    color: new Color('#3a1a08'),
    emissive: accent,
    emissiveIntensity: 1.1,
    roughness: 0.4,
  });
  const ember = new Mesh(new SphereGeometry(0.52, 28, 28), emberMaterial);
  group.add(core, ember);

  const rayRing = new Group();
  const rays: Mesh[] = [];
  for (let index = 0; index < 12; index += 1) {
    const ray = new Mesh(new RoundedBoxGeometry(1.35, 0.32, 0.32, 4, 0.14), glassMaterial());
    const angle = (index / 12) * Math.PI * 2;
    ray.position.set(Math.cos(angle) * 2.3, Math.sin(angle) * 2.3, 0);
    ray.rotation.z = angle;
    ray.userData.angle = angle;
    rayRing.add(ray);
    rays.push(ray);
  }
  group.add(rayRing);

  const orbit = new Group();
  orbit.rotation.x = 1.15;
  const ring = new Mesh(new TorusGeometry(3.25, 0.045, 12, 72), metalMaterial());
  const beadCarrier = new Group();
  const bead = new Mesh(new SphereGeometry(0.16, 18, 18), emberMaterial.clone());
  bead.position.x = 3.25;
  beadCarrier.add(bead);
  orbit.add(ring, beadCarrier);
  group.add(orbit);

  const hand = new Group();
  const needle = new Mesh(new CylinderGeometry(0.045, 0.02, 2.5, 12), metalMaterial());
  needle.position.y = 1.25;
  const hub = new Mesh(new CylinderGeometry(0.2, 0.2, 0.5, 20), glossBlackMaterial());
  hub.rotation.x = Math.PI / 2;
  hand.add(needle, hub);
  hand.position.z = 0.7;
  group.add(hand);

  group.scale.setScalar(0.66);

  return {
    group,
    update(elapsed, _pointer, rest) {
      const intro = rest ? 1 : MathUtils.clamp(elapsed / 0.8, 0, 1);
      group.scale.setScalar(0.66 * (0.9 + easeOutBack(intro) * 0.1));
      rayRing.rotation.z = rest ? 0 : elapsed * 0.12;
      rays.forEach((ray) => {
        const angle = ray.userData.angle as number;
        const reach = 2.3 + (rest ? 0 : Math.sin(elapsed * 1.2 + angle * 3) * 0.09);
        ray.position.set(Math.cos(angle) * reach, Math.sin(angle) * reach, 0);
      });
      beadCarrier.rotation.z = rest ? 0 : elapsed * 0.45;
      hand.rotation.z = rest ? -0.6 : -0.6 - elapsed * 0.16;
      emberMaterial.emissiveIntensity = rest ? 1.1 : 1 + Math.sin(elapsed * 1.6) * 0.3;
    },
  };
}

/**
 * Stellar: a glass star compass. An eight point star, a lilac core,
 * and two counter rotating orbits carrying three nodes.
 */
function buildStellar(accent: Color): SceneWorld {
  const group = new Group();

  const star = new Group();
  for (let index = 0; index < 4; index += 1) {
    const blade = new Mesh(new RoundedBoxGeometry(index % 2 === 0 ? 4.6 : 3.4, 0.62, 0.62, 4, 0.28), glassMaterial());
    blade.rotation.z = (index / 4) * Math.PI;
    star.add(blade);
  }
  const hub = new Mesh(new CylinderGeometry(0.55, 0.55, 0.9, 28), metalMaterial());
  hub.rotation.x = Math.PI / 2;
  const coreMaterial = new MeshStandardMaterial({
    color: new Color('#141428'),
    emissive: accent,
    emissiveIntensity: 1,
    roughness: 0.3,
  });
  const core = new Mesh(new SphereGeometry(0.34, 24, 24), coreMaterial);
  core.position.z = 0.35;
  star.add(hub, core);
  group.add(star);

  const orbit = new Group();
  orbit.rotation.x = 1.05;
  orbit.add(new Mesh(new TorusGeometry(3.05, 0.04, 12, 72), metalMaterial()));
  const nodeCarrier = new Group();
  const nodes: Mesh[] = [];
  for (let index = 0; index < 3; index += 1) {
    const node = new Mesh(new SphereGeometry(0.2, 18, 18), coreMaterial.clone());
    const angle = (index / 3) * Math.PI * 2;
    node.position.set(Math.cos(angle) * 3.05, Math.sin(angle) * 3.05, 0);
    nodeCarrier.add(node);
    nodes.push(node);
  }
  orbit.add(nodeCarrier);
  group.add(orbit);

  const counterOrbit = new Group();
  counterOrbit.rotation.x = -0.9;
  counterOrbit.rotation.y = 0.4;
  counterOrbit.add(new Mesh(new TorusGeometry(2.45, 0.028, 10, 64), glossBlackMaterial()));
  group.add(counterOrbit);

  group.scale.setScalar(0.68);

  return {
    group,
    update(elapsed, _pointer, rest) {
      const intro = rest ? 1 : MathUtils.clamp(elapsed / 0.8, 0, 1);
      group.scale.setScalar(0.68 * (0.9 + easeOutBack(intro) * 0.1));
      star.rotation.z = rest ? 0 : elapsed * 0.1;
      nodeCarrier.rotation.z = rest ? 0 : elapsed * 0.4;
      counterOrbit.rotation.z = rest ? 0 : -elapsed * 0.24;
      coreMaterial.emissiveIntensity = rest ? 1 : 0.9 + Math.sin(elapsed * 1.4) * 0.3;
      nodes.forEach((node, index) => {
        (node.material as MeshStandardMaterial).emissiveIntensity = rest
          ? 1
          : 0.8 + Math.sin(elapsed * 1.8 + index * 2.1) * 0.4;
      });
    },
  };
}

const builders: Record<SceneName, (accent: Color) => SceneWorld> = {
  monogram: buildMonogram,
  bronzed: buildBronzed,
  stellar: buildStellar,
};

class SceneRuntime {
  private readonly canvas: HTMLCanvasElement;
  private readonly frame: HTMLElement | null;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(31, 1, 0.1, 100);
  private readonly pointer: Pointer = { x: 0, y: 0 };
  private readonly resizeObserver: ResizeObserver;
  private readonly environment: Texture;
  private readonly world: SceneWorld;
  private readonly name: SceneName;
  private visible = false;
  private readonly startedAt: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.frame = canvas.closest<HTMLElement>('[data-three-frame]');
    this.name = (canvas.dataset.threeScene ?? 'monogram') as SceneName;
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 720,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.setClearColor(0x000000, 0);

    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.035).texture;
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = 0.5;
    room.dispose();
    pmrem.dispose();

    this.camera.position.set(0, 0.15, this.name === 'monogram' ? 9.8 : 9.2);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new AmbientLight(0xffffff, 0.45));

    const key = new DirectionalLight(0xffffff, 2.1);
    key.position.set(4.8, 6.2, 7.4);
    const graphiteRim = new PointLight(0xaebbc5, 12, 16, 2);
    graphiteRim.position.set(-4.8, -2.4, 4.2);
    const accent = new Color(this.canvas.dataset.accent ?? '#ffffff');
    const accentRim = new PointLight(accent, this.name === 'monogram' ? 8 : 13, 14, 2);
    accentRim.position.set(4.2, 4.8, 3.2);
    this.scene.add(key, graphiteRim, accentRim);

    this.world = builders[this.name](accent);
    this.scene.add(this.world.group);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    this.startedAt = performance.now();
    this.render(this.startedAt);
    requestAnimationFrame(() => this.frame?.classList.add('is-rendered'));
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    if (reduceMotion.matches) return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
  };

  private readonly onPointerLeave = () => {
    this.pointer.x = 0;
    this.pointer.y = 0;
  };

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.renderer.setAnimationLoop(null);
    this.frame?.classList.remove('is-rendered');
    this.frame?.classList.add('is-unavailable');
  };

  private readonly onContextRestored = () => {
    this.frame?.classList.remove('is-unavailable');
    this.frame?.classList.add('is-rendered');
    this.refreshVisibility();
  };

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.15 : 1.6);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render(performance.now());
  }

  private readonly render = (time: number) => {
    const elapsed = (time - this.startedAt) * 0.001;
    const rest = reduceMotion.matches;
    this.world.group.rotation.y = MathUtils.lerp(this.world.group.rotation.y, this.pointer.x * 0.16, 0.05);
    this.world.group.rotation.x = MathUtils.lerp(this.world.group.rotation.x, -0.04 - this.pointer.y * 0.1, 0.05);
    this.world.group.position.y = rest ? 0 : Math.sin(elapsed * 0.5) * 0.06;
    this.world.update(elapsed, this.pointer, rest);
    this.renderer.render(this.scene, this.camera);
  };

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible || document.hidden || reduceMotion.matches) {
      this.renderer.setAnimationLoop(null);
      if (visible) this.render(performance.now());
      return;
    }
    this.renderer.setAnimationLoop(this.render);
  }

  refreshVisibility() {
    this.setVisible(this.visible);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.environment.dispose();
    this.renderer.dispose();
  }
}

const sceneObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const canvas = entry.target as HTMLCanvasElement;
    let runtime = runtimes.get(canvas);
    if (entry.isIntersecting && !runtime) {
      try {
        runtime = new SceneRuntime(canvas);
        runtimes.set(canvas, runtime);
      } catch {
        canvas.closest<HTMLElement>('[data-three-frame]')?.classList.add('is-unavailable');
        sceneObserver.unobserve(canvas);
        return;
      }
    }
    runtime?.setVisible(entry.isIntersecting);
  });
}, { rootMargin: '180px 0px', threshold: 0.01 });

document.querySelectorAll<HTMLCanvasElement>('canvas[data-three-scene]').forEach((canvas) => {
  sceneObserver.observe(canvas);
});

document.addEventListener('visibilitychange', () => {
  runtimes.forEach((runtime) => runtime.refreshVisibility());
});

reduceMotion.addEventListener('change', () => {
  runtimes.forEach((runtime) => runtime.refreshVisibility());
});

window.addEventListener('pagehide', () => {
  sceneObserver.disconnect();
  runtimes.forEach((runtime) => runtime.dispose());
  runtimes.clear();
}, { once: true });
