import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type SceneName = 'monogram' | 'bronzed' | 'stellar';
type Pointer = { x: number; y: number };
type NamedPart = {
  object: Object3D;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runtimes = new Map<HTMLCanvasElement, SceneRuntime>();

function remember(model: Group, name: string): NamedPart | undefined {
  const object = model.getObjectByName(name);
  if (!object) return undefined;
  return {
    object,
    position: object.position.clone(),
    rotation: new Vector3(object.rotation.x, object.rotation.y, object.rotation.z),
    scale: object.scale.clone(),
  };
}

function fitModel(model: Group, targetSize: number) {
  model.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  const longestSide = Math.max(size.x, size.y, size.z, 0.001);
  model.scale.multiplyScalar(targetSize / longestSide);
  model.updateMatrixWorld(true);
  const fittedBounds = new Box3().setFromObject(model);
  model.position.sub(fittedBounds.getCenter(new Vector3()));
}

function disposeObject(object: Object3D) {
  if (!(object instanceof Mesh)) return;
  object.geometry.dispose();
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => material.dispose());
}

class SceneRuntime {
  private readonly canvas: HTMLCanvasElement;
  private readonly frame: HTMLElement | null;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(31, 1, 0.1, 100);
  private readonly pointer: Pointer = { x: 0, y: 0 };
  private readonly resizeObserver: ResizeObserver;
  private readonly environment: Texture;
  private model?: Group;
  private readonly name: SceneName;
  private parts = new Map<string, NamedPart>();
  private visible = false;
  private loadedAt = 0;
  private disposed = false;

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
    this.renderer.toneMappingExposure = this.name === 'monogram' ? 1.08 : 1.02;
    this.renderer.setClearColor(0x000000, 0);

    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.035).texture;
    this.scene.environment = this.environment;
    room.dispose();
    pmrem.dispose();

    this.camera.position.set(0, 0.15, this.name === 'monogram' ? 9.8 : 9.2);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new AmbientLight(0xffffff, 1.35));

    const key = new DirectionalLight(0xffffff, 4.8);
    key.position.set(4.8, 6.2, 7.4);
    const graphiteRim = new PointLight(0xaebbc5, 20, 16, 2);
    graphiteRim.position.set(-4.8, -2.4, 4.2);
    const accent = new Color(canvas.dataset.accent ?? '#ffffff');
    const opticalRim = new PointLight(accent, this.name === 'monogram' ? 8 : 13, 14, 2);
    opticalRim.position.set(4.2, 4.8, 3.2);
    this.scene.add(key, graphiteRim, opticalRim);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    void this.load(canvas.dataset.modelUrl ?? '');
  }

  private async load(modelUrl: string) {
    try {
      if (!modelUrl) throw new Error('Missing authored model URL');
      const gltf = await new GLTFLoader().loadAsync(modelUrl);
      if (this.disposed) {
        gltf.scene.traverse(disposeObject);
        return;
      }

      const model = gltf.scene;
      fitModel(model, this.name === 'monogram' ? 3.05 : 4.55);
      model.rotation.x += this.name === 'monogram' ? -0.025 : -0.04;
      model.rotation.y += this.name === 'bronzed' ? -0.06 : 0.02;
      this.model = model;
      this.scene.add(model);
      this.captureParts();
      this.loadedAt = performance.now();
      this.render(this.loadedAt);
      requestAnimationFrame(() => this.frame?.classList.add('is-rendered'));
      this.refreshVisibility();
    } catch {
      this.frame?.classList.add('is-unavailable');
    }
  }

  private captureParts() {
    if (!this.model) return;
    const names = this.name === 'monogram'
      ? ['SnakeHead', 'SnakeEye', 'SnakeBody', 'ServoJoint_01', 'ServoJoint_02', 'ServoJoint_03', 'ServoJoint_04']
      : this.name === 'bronzed'
        ? ['HeliostatLens', 'HeliostatGnomon', 'FilterCarriage', 'SolarBeam']
        : ['LoomLeafMorning', 'LoomLeafAfternoon', 'LoomLeafEvening', 'LoomPrism'];
    names.forEach((name) => {
      const part = remember(this.model as Group, name);
      if (part) this.parts.set(name, part);
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
    this.renderer.setAnimationLoop(null);
    this.frame?.classList.remove('is-rendered');
    this.frame?.classList.add('is-unavailable');
  };

  private readonly onContextRestored = () => {
    this.frame?.classList.remove('is-unavailable');
    if (this.model) this.frame?.classList.add('is-rendered');
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

  private animatePart(name: string, apply: (part: NamedPart) => void) {
    const part = this.parts.get(name);
    if (part) apply(part);
  }

  private animateModel(elapsed: number) {
    if (!this.model) return;
    const rest = reduceMotion.matches;
    const drift = rest ? 0 : Math.sin(elapsed * 0.52) * 0.025;
    this.model.rotation.y = MathUtils.lerp(this.model.rotation.y, this.pointer.x * 0.055, 0.035);
    this.model.rotation.x = MathUtils.lerp(this.model.rotation.x, -0.035 - this.pointer.y * 0.035, 0.035);
    this.model.position.y = drift;

    if (this.name === 'monogram') {
      this.animatePart('SnakeHead', (part) => {
        part.object.position.x = part.position.x + (rest ? 0 : Math.sin(elapsed * 0.72) * 0.025);
      });
      this.animatePart('SnakeEye', (part) => {
        part.object.rotation.z = part.rotation.z + (rest ? 0 : Math.sin(elapsed * 0.48) * 0.14);
        const pulse = rest ? 1 : 1 + Math.sin(elapsed * 1.1) * 0.022;
        part.object.scale.set(part.scale.x * pulse, part.scale.y * pulse, part.scale.z * pulse);
      });
      for (let index = 1; index <= 4; index += 1) {
        this.animatePart(`ServoJoint_0${index}`, (part) => {
          part.object.rotation.y = part.rotation.y + (rest ? 0 : Math.sin(elapsed * 0.36 + index) * 0.035);
        });
      }
      return;
    }

    if (this.name === 'bronzed') {
      this.animatePart('HeliostatLens', (part) => {
        part.object.rotation.y = part.rotation.y + (rest ? 0 : Math.sin(elapsed * 0.28) * 0.065);
        part.object.rotation.z = part.rotation.z + (rest ? 0 : Math.sin(elapsed * 0.18) * 0.025);
      });
      this.animatePart('HeliostatGnomon', (part) => {
        part.object.rotation.z = part.rotation.z + (rest ? 0 : Math.sin(elapsed * 0.34) * 0.035);
      });
      this.animatePart('FilterCarriage', (part) => {
        part.object.position.y = part.position.y + (rest ? 0 : Math.sin(elapsed * 0.46) * 0.035);
      });
      this.animatePart('SolarBeam', (part) => {
        const pulse = rest ? 1 : 1 + Math.sin(elapsed * 0.8) * 0.018;
        part.object.scale.set(part.scale.x * pulse, part.scale.y, part.scale.z * pulse);
      });
      return;
    }

    ['LoomLeafMorning', 'LoomLeafAfternoon', 'LoomLeafEvening'].forEach((name, index) => {
      this.animatePart(name, (part) => {
        part.object.rotation.y = part.rotation.y + (rest ? 0 : Math.sin(elapsed * 0.3 + index * 2.1) * 0.045);
      });
    });
    this.animatePart('LoomPrism', (part) => {
      part.object.rotation.y = part.rotation.y + (rest ? 0 : elapsed * 0.08);
      const pulse = rest ? 1 : 1 + Math.sin(elapsed * 0.42) * 0.018;
      part.object.scale.set(part.scale.x * pulse, part.scale.y * pulse, part.scale.z * pulse);
    });
  }

  private readonly render = (time: number) => {
    const elapsed = this.loadedAt ? (time - this.loadedAt) * 0.001 : 0;
    this.animateModel(elapsed);
    this.renderer.render(this.scene, this.camera);
  };

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible || document.hidden || reduceMotion.matches || !this.model) {
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
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.scene.traverse(disposeObject);
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
