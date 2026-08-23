import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three';

type SceneName = 'monogram' | 'bronzed' | 'stellar';
type SceneModel = {
  root: Group;
  update: (time: number, pointer: { x: number; y: number }) => void;
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runtimes = new Map<HTMLCanvasElement, SceneRuntime>();

function makeGlass(color: Color) {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0.02,
    roughness: 0.08,
    transmission: 0.94,
    thickness: 0.9,
    ior: 1.38,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    iridescence: 0.18,
    iridescenceIOR: 1.3,
    opacity: 1,
    side: DoubleSide,
  });
}

function addEdge(mesh: Mesh, color: Color, opacity = 0.52) {
  const edge = new LineSegments(
    new EdgesGeometry(mesh.geometry, 22),
    new LineBasicMaterial({ color, transparent: true, opacity }),
  );
  mesh.add(edge);
}

function makeCrescent() {
  const shape = new Shape();
  const outer = 2.24;
  const inner = 1.16;
  const start = 0.58;
  const end = Math.PI * 2 - 0.58;

  shape.moveTo(Math.cos(start) * outer, Math.sin(start) * outer);
  shape.absarc(0, 0, outer, start, end, false);
  shape.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
  shape.absarc(0, 0, inner, end, start, true);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.34,
    steps: 1,
    curveSegments: 64,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.1,
    bevelThickness: 0.1,
  });
  geometry.center();
  return geometry;
}

function particleField(count: number, radius: number, color: Color, size = 0.035) {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const theta = index * 2.399963;
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const spread = Math.sqrt(1 - y * y);
    positions.push(
      Math.cos(theta) * spread * radius,
      y * radius,
      Math.sin(theta) * spread * radius,
    );
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size, transparent: true, opacity: 0.72, blending: AdditiveBlending }),
  );
}

function monogramModel(accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const geometry = makeCrescent();
  const layers: Mesh[] = [];

  [secondary, new Color('#f4f2ea'), accent].forEach((color, index) => {
    const mesh = new Mesh(geometry, makeGlass(color));
    mesh.position.z = (index - 1) * 0.34;
    mesh.scale.setScalar(1 - index * 0.025);
    addEdge(mesh, color, index === 1 ? 0.7 : 0.38);
    root.add(mesh);
    layers.push(mesh);
  });

  const signal = new Mesh(
    new SphereGeometry(0.1, 24, 24),
    new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 4, roughness: 0.2 }),
  );
  root.add(signal);

  const field = particleField(96, 3.35, secondary, 0.022);
  field.rotation.z = 0.42;
  root.add(field);

  root.rotation.set(-0.12, -0.48, -0.08);

  return {
    root,
    update: (time, pointer) => {
      const drift = reduceMotion.matches ? 0 : Math.sin(time * 0.45);
      root.rotation.y = MathUtils.lerp(root.rotation.y, -0.48 + pointer.x * 0.18, 0.045);
      root.rotation.x = MathUtils.lerp(root.rotation.x, -0.12 - pointer.y * 0.12, 0.045);
      layers.forEach((layer, index) => {
        layer.position.z = (index - 1) * (0.34 + drift * 0.055);
        layer.rotation.z = (index - 1) * drift * 0.012;
      });
      signal.position.set(1.53 + Math.cos(time * 0.72) * 0.11, Math.sin(time * 0.72) * 0.34, 0.72);
      field.rotation.y = time * 0.025;
    },
  };
}

function bronzedModel(accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const sun = new Mesh(
    new IcosahedronGeometry(1.45, 5),
    new MeshPhysicalMaterial({
      color: accent,
      roughness: 0.22,
      metalness: 0.04,
      emissive: accent,
      emissiveIntensity: 0.7,
      clearcoat: 0.65,
    }),
  );
  root.add(sun);

  const rings: Mesh[] = [];
  [1.88, 2.28, 2.68].forEach((radius, index) => {
    const ring = new Mesh(
      new TorusGeometry(radius, 0.018 + index * 0.006, 10, 160),
      new MeshBasicMaterial({ color: index === 1 ? accent : secondary, transparent: true, opacity: 0.48 }),
    );
    ring.rotation.set(Math.PI / 2 + index * 0.17, index * 0.22, index * 0.35);
    rings.push(ring);
    root.add(ring);
  });

  const shell = new Mesh(new SphereGeometry(1.78, 64, 64), makeGlass(new Color('#f8d4ba')));
  addEdge(shell, accent, 0.28);
  root.add(shell);
  const field = particleField(180, 3.1, accent, 0.028);
  root.add(field);
  root.rotation.x = -0.16;

  return {
    root,
    update: (time, pointer) => {
      root.rotation.y = MathUtils.lerp(root.rotation.y, pointer.x * 0.18 + time * 0.035, 0.035);
      root.rotation.x = MathUtils.lerp(root.rotation.x, -0.16 - pointer.y * 0.1, 0.04);
      if (!reduceMotion.matches) {
        sun.scale.setScalar(1 + Math.sin(time * 1.4) * 0.025);
        rings.forEach((ring, index) => { ring.rotation.z += 0.0008 * (index + 1); });
        field.rotation.y = -time * 0.035;
      }
    },
  };
}

function stellarModel(accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const core = new Mesh(
    new SphereGeometry(1.24, 64, 64),
    makeGlass(new Color('#d8d7ff')),
  );
  addEdge(core, secondary, 0.32);
  root.add(core);

  const orbiters: Mesh[] = [];
  [1.72, 2.2, 2.72].forEach((radius, index) => {
    const orbit = new Mesh(
      new TorusGeometry(radius, 0.024, 12, 180),
      new MeshBasicMaterial({
        color: index === 2 ? secondary : accent,
        transparent: true,
        opacity: 0.58 - index * 0.1,
      }),
    );
    orbit.rotation.set(0.82 + index * 0.38, index * 0.36, 0.22 + index * 0.28);
    orbiters.push(orbit);
    root.add(orbit);
  });

  const field = particleField(220, 3.35, secondary, 0.028);
  root.add(field);
  const signal = new Mesh(
    new SphereGeometry(0.1, 20, 20),
    new MeshStandardMaterial({ color: secondary, emissive: secondary, emissiveIntensity: 3 }),
  );
  root.add(signal);

  return {
    root,
    update: (time, pointer) => {
      root.rotation.y = MathUtils.lerp(root.rotation.y, pointer.x * 0.2 + time * 0.025, 0.035);
      root.rotation.x = MathUtils.lerp(root.rotation.x, -pointer.y * 0.12, 0.04);
      if (!reduceMotion.matches) {
        orbiters.forEach((orbit, index) => { orbit.rotation.z += 0.0007 * (index + 1); });
        field.rotation.y = time * 0.018;
        const angle = time * 0.62;
        signal.position.set(Math.cos(angle) * 2.2, Math.sin(angle * 1.3) * 0.7, Math.sin(angle) * 2.2);
      } else {
        signal.position.set(1.7, 0.35, 1.2);
      }
    },
  };
}

function createModel(name: SceneName, accent: Color, secondary: Color) {
  if (name === 'bronzed') return bronzedModel(accent, secondary);
  if (name === 'stellar') return stellarModel(accent, secondary);
  return monogramModel(accent, secondary);
}

class SceneRuntime {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(34, 1, 0.1, 100);
  private readonly model: SceneModel;
  private readonly pointer = { x: 0, y: 0 };
  private visible = false;
  private readonly resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const name = (canvas.dataset.threeScene ?? 'monogram') as SceneName;
    const accent = new Color(canvas.dataset.accent ?? '#f06a4f');
    const secondary = new Color(canvas.dataset.secondary ?? '#8fc6ff');

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 720,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setClearColor(0x000000, 0);

    this.camera.position.set(0, 0, name === 'monogram' ? 8.1 : 8.5);
    this.scene.add(new AmbientLight(0xffffff, 1.25));
    const key = new DirectionalLight(0xffffff, 6.5);
    key.position.set(4, 6, 7);
    this.scene.add(key);
    const warm = new PointLight(accent, 38, 14, 2);
    warm.position.set(-3.8, -2, 4.5);
    this.scene.add(warm);
    const cool = new PointLight(secondary, 34, 14, 2);
    cool.position.set(4, 2.4, 3.2);
    this.scene.add(cool);

    const backplate = new Mesh(
      new PlaneGeometry(16, 11),
      new MeshBasicMaterial({ color: 0x10110f }),
    );
    backplate.position.z = -4.5;
    this.scene.add(backplate);

    this.model = createModel(name, accent, secondary);
    this.scene.add(this.model.root);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.closest<HTMLElement>('[data-three-frame]')?.classList.add('is-rendered');
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
    this.canvas.closest<HTMLElement>('[data-three-frame]')?.classList.remove('is-rendered');
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
    this.model.update(time * 0.001, this.pointer);
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
    this.scene.traverse((object: Object3D) => {
      if (object instanceof Mesh || object instanceof Points || object instanceof LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
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
