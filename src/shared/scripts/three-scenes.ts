import {
  ACESFilmicToneMapping,
  AmbientLight,
  AnimationMixer,
  Box3,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  LoopOnce,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type SceneName = 'monogram' | 'bronzed' | 'stellar';
type Pointer = { x: number; y: number };
type SceneWorld = {
  group: Group;
  ready?: Promise<void>;
  update: (elapsed: number, pointer: Pointer, rest: boolean) => void;
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runtimes = new Map<HTMLCanvasElement, SceneRuntime>();

function createEnvironment(renderer: WebGLRenderer) {
  const studio = new Scene();
  studio.background = new Color(0x777777);
  const flags = [
    { x: -4, y: 0, z: 2, width: 1.8, height: 9, color: 0x14171b },
    { x: 4, y: 1, z: 1, width: 0.8, height: 8, color: 0x14171b },
    { x: 0, y: 5, z: -1, width: 7, height: 1.2, color: 0xffffff },
    { x: -2, y: 2, z: 5, width: 3, height: 7, color: 0xffffff },
    { x: 4, y: 0, z: 4, width: 1.5, height: 8, color: 0xffffff },
  ];
  flags.forEach((flag) => {
    const card = new Mesh(
      new PlaneGeometry(flag.width, flag.height),
      new MeshBasicMaterial({ color: flag.color }),
    );
    card.position.set(flag.x, flag.y, flag.z);
    card.lookAt(0, 0, 0);
    studio.add(card);
  });
  const generator = new PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, 0.015);
  generator.dispose();
  studio.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as MeshBasicMaterial).dispose();
    }
  });
  return environment;
}

function buildWorld(name: SceneName): SceneWorld {
  const group = new Group();
  let mixer: AnimationMixer | undefined;
  let lastTime = 0;
  let wasResting = false;
  let startIdle = () => {};
  const model = name === 'monogram' ? 'camm' : name;
  const ready = new GLTFLoader()
    .loadAsync(`/models/${model}-crystal.glb`)
    .then((gltf) => {
      const bounds = new Box3().setFromObject(gltf.scene);
      gltf.scene.position.sub(bounds.getCenter(new Vector3()));
      const size = bounds.getSize(new Vector3());
      const normalized = new Group();
      normalized.add(gltf.scene);
      normalized.scale.setScalar(5 / Math.max(size.x, size.y, size.z));
      gltf.scene.traverse((object) => {
        if (!(object instanceof Mesh) || /eye|pupil/i.test(object.name)) return;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => {
          if (
            material instanceof MeshPhysicalMaterial &&
            material.transmission > 0.5
          ) {
            material.toneMapped = false;
            material.thickness = 1.1;
            material.ior = 1.5;
            material.clearcoat = 1;
            material.clearcoatRoughness = 0.035;
            material.roughness = Math.min(material.roughness, 0.055);
            material.envMapIntensity = 1.2;
          }
        });
      });
      group.add(normalized);
      if (gltf.animations.length) {
        mixer = new AnimationMixer(gltf.scene);
        const introClip = gltf.animations.find((clip) =>
          /assemble/i.test(clip.name),
        );
        const idleClip =
          gltf.animations.find((clip) => /idle/i.test(clip.name)) ??
          gltf.animations.find((clip) => clip !== introClip);
        startIdle = () => {
          if (idleClip) mixer!.clipAction(idleClip).reset().fadeIn(0.5).play();
        };
        if (!reduceMotion.matches && introClip) {
          const action = mixer.clipAction(introClip);
          action.setLoop(LoopOnce, 1);
          action.clampWhenFinished = true;
          action.play();
          mixer.addEventListener('finished', () => {
            startIdle();
            action.fadeOut(0.5);
          });
        } else if (!reduceMotion.matches) {
          startIdle();
        }
      }
    });
  return {
    group,
    ready,
    update(elapsed, _pointer, rest) {
      if (rest) {
        if (!wasResting) mixer?.stopAllAction();
      } else {
        if (wasResting) startIdle();
        mixer?.update(Math.max(elapsed - lastTime, 0));
      }
      lastTime = elapsed;
      wasResting = rest;
      const scale = rest
        ? 0.82
        : 0.82 * (0.94 + 0.06 * Math.min(elapsed / 1.2, 1));
      group.scale.setScalar(scale);
      group.rotation.z = rest
        ? -0.13
        : -0.13 + Math.sin(elapsed * 0.25) * 0.035;
    },
  };
}

class SceneRuntime {
  private readonly canvas: HTMLCanvasElement;
  private readonly frame: HTMLElement | null;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(31, 1, 0.1, 100);
  private readonly pointer: Pointer = { x: 0, y: 0 };
  private readonly resizeObserver: ResizeObserver;
  private environment: WebGLRenderTarget;
  private readonly world: SceneWorld;
  private readonly name: SceneName;
  private visible = false;
  private disposed = false;
  private ready = false;
  private contextLost = false;
  private pausedAt?: number;
  private startedAt: number;

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

    this.environment = createEnvironment(this.renderer);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 1;

    this.camera.position.set(0, 0.15, this.name === 'monogram' ? 11 : 9.2);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new AmbientLight(0xffffff, 0.45));

    const key = new DirectionalLight(0xffffff, 2.1);
    key.position.set(4.8, 6.2, 7.4);
    const graphiteRim = new PointLight(0xffffff, 12, 16, 2);
    graphiteRim.position.set(-4.8, -2.4, 4.2);
    const accent = new Color(0xffffff);
    const accentRim = new PointLight(
      accent,
      this.name === 'monogram' ? 8 : 13,
      14,
      2,
    );
    accentRim.position.set(4.2, 4.8, 3.2);
    this.scene.add(key, graphiteRim, accentRim);

    this.world = buildWorld(this.name);
    this.scene.add(this.world.group);
    this.startedAt = performance.now();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
    });
    canvas.addEventListener('pointerleave', this.onPointerLeave, {
      passive: true,
    });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);

    Promise.resolve(this.world.ready)
      .then(() => {
        if (this.disposed) {
          this.disposeMeshes();
          return;
        }
        this.startedAt = performance.now();
        this.ready = true;
        if (this.contextLost) return;
        this.render(performance.now());
        this.frame?.classList.add('is-rendered');
        this.refreshVisibility();
      })
      .catch(() => {
        this.frame?.classList.add('is-unavailable');
        this.renderer.setAnimationLoop(null);
      });
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
    this.contextLost = true;
    this.renderer.setAnimationLoop(null);
    this.frame?.classList.remove('is-rendered');
    this.frame?.classList.add('is-unavailable');
  };

  private readonly onContextRestored = () => {
    if (this.disposed) return;
    try {
      this.environment.dispose();
      this.environment = createEnvironment(this.renderer);
      this.scene.environment = this.environment.texture;
      this.contextLost = false;
      if (this.ready) {
        this.render(performance.now());
        this.frame?.classList.remove('is-unavailable');
        this.frame?.classList.add('is-rendered');
        this.refreshVisibility();
      }
    } catch {
      this.frame?.classList.add('is-unavailable');
    }
  };

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 720 ? 1.15 : 1.6,
    );
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render(performance.now());
  }

  private readonly render = (time: number) => {
    if (!this.ready || this.disposed || this.contextLost) return;
    const elapsed = (time - this.startedAt) * 0.001;
    if (document.documentElement.classList.contains('motion-paused')) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const rest = reduceMotion.matches;
    this.world.group.rotation.y = MathUtils.lerp(
      this.world.group.rotation.y,
      (this.name === 'monogram' ? -0.35 : 0) + this.pointer.x * 0.24,
      0.05,
    );
    this.world.group.rotation.x = MathUtils.lerp(
      this.world.group.rotation.x,
      -0.04 - this.pointer.y * 0.1,
      0.05,
    );
    const hero = this.name === 'monogram';
    const wide = window.innerWidth > 900;
    const viewWidth =
      2 *
      Math.tan(MathUtils.degToRad(this.camera.fov / 2)) *
      this.camera.position.z *
      this.camera.aspect;
    const settledX = hero && wide ? viewWidth * 0.26 : 0;
    const progress = rest || !hero ? 1 : MathUtils.clamp(elapsed / 5, 0, 1);
    const travel = 1 - (1 - progress) ** 3;
    this.world.group.position.x = hero
      ? MathUtils.lerp(-viewWidth * 0.6 - 3, settledX, travel)
      : 0;
    this.world.group.position.y = rest
      ? 0
      : Math.sin(elapsed * (progress < 1 ? 3 : 0.5)) *
        (progress < 1 ? 0.18 : 0.06);
    this.world.update(elapsed, this.pointer, rest);
    this.renderer.render(this.scene, this.camera);
  };

  setVisible(visible: boolean) {
    this.visible = visible;
    if (
      !this.ready ||
      this.contextLost ||
      !visible ||
      document.hidden ||
      reduceMotion.matches ||
      document.documentElement.classList.contains('motion-paused')
    ) {
      this.renderer.setAnimationLoop(null);
      if (visible) this.render(performance.now());
      return;
    }
    this.renderer.setAnimationLoop(this.render);
  }

  pause() {
    this.renderer.setAnimationLoop(null);
  }

  refreshVisibility() {
    const paused = document.documentElement.classList.contains('motion-paused');
    if (paused && this.pausedAt === undefined)
      this.pausedAt = performance.now();
    if (!paused && this.pausedAt !== undefined) {
      this.startedAt += performance.now() - this.pausedAt;
      this.pausedAt = undefined;
    }
    this.setVisible(this.visible);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener(
      'webglcontextrestored',
      this.onContextRestored,
    );
    this.disposeMeshes();
    this.environment.dispose();
    this.renderer.dispose();
  }

  private disposeMeshes() {
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }
}

const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const canvas = entry.target as HTMLCanvasElement;
      let runtime = runtimes.get(canvas);
      if (entry.isIntersecting && !runtime) {
        try {
          runtime = new SceneRuntime(canvas);
          runtimes.set(canvas, runtime);
        } catch {
          canvas
            .closest<HTMLElement>('[data-three-frame]')
            ?.classList.add('is-unavailable');
          sceneObserver.unobserve(canvas);
          return;
        }
      }
      runtime?.setVisible(entry.isIntersecting);
    });
  },
  { rootMargin: '180px 0px', threshold: 0.01 },
);

document
  .querySelectorAll<HTMLCanvasElement>('canvas[data-three-scene]')
  .forEach((canvas) => {
    sceneObserver.observe(canvas);
  });

document.addEventListener('visibilitychange', () => {
  runtimes.forEach((runtime) => runtime.refreshVisibility());
});

window.addEventListener('camm:motionchange', () => {
  runtimes.forEach((runtime) => runtime.refreshVisibility());
});

reduceMotion.addEventListener('change', () => {
  runtimes.forEach((runtime) => runtime.refreshVisibility());
});

window.addEventListener('pagehide', (event) => {
  if (event.persisted) {
    runtimes.forEach((runtime) => runtime.pause());
    return;
  }
  sceneObserver.disconnect();
  runtimes.forEach((runtime) => runtime.dispose());
  runtimes.clear();
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted)
    runtimes.forEach((runtime) => runtime.refreshVisibility());
});
