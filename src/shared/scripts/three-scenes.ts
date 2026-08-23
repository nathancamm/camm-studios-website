import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Line,
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
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type SceneName = 'monogram' | 'bronzed' | 'stellar';
type Pointer = { x: number; y: number };
type SceneModel = {
  root: Group;
  update: (time: number, pointer: Pointer) => void;
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const runtimes = new Map<HTMLCanvasElement, SceneRuntime>();

function makeGlass(color = new Color('#ffffff'), thickness = 1.35) {
  return new MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.045,
    transmission: 1,
    thickness,
    ior: 1.46,
    attenuationColor: new Color('#edf1f4'),
    attenuationDistance: 10,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    specularIntensity: 1,
    dispersion: 0.012,
    envMapIntensity: 1.55,
    side: DoubleSide,
  });
}

function addOpticalEdge(mesh: Mesh, opacity = 0.14) {
  mesh.add(new LineSegments(
    new EdgesGeometry(mesh.geometry, 38),
    new LineBasicMaterial({ color: new Color('#34424e'), transparent: true, opacity }),
  ));
}

function makeCrescent(depth = 0.42, curveSegments = 72) {
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
    depth,
    steps: 1,
    curveSegments,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  });
  geometry.center();
  return geometry;
}

function makeTerminalPrism(top: boolean) {
  const direction = top ? 1 : -1;
  const shape = new Shape();
  shape.moveTo(0.98, 0.64 * direction);
  shape.lineTo(1.88, 1.23 * direction);
  shape.lineTo(1.68, 1.39 * direction);
  shape.lineTo(0.86, 0.84 * direction);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.045,
    bevelThickness: 0.045,
  });
  geometry.translate(0.185, 0, -0.25);
  return geometry;
}

function makeReflectionBand(start: number, end: number, color: Color, opacity: number) {
  const shape = new Shape();
  const outer = 2.17;
  const inner = 1.23;
  shape.moveTo(Math.cos(start) * outer, Math.sin(start) * outer);
  shape.absarc(0, 0, outer, start, end, false);
  shape.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
  shape.absarc(0, 0, inner, end, start, true);
  shape.closePath();
  const band = new Mesh(
    new ShapeGeometry(shape, 24),
    new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: DoubleSide }),
  );
  band.position.z = 0.31;
  return band;
}

function particleField(count: number, radius: number, color: Color, size = 0.035) {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const theta = index * 2.399963;
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const spread = Math.sqrt(1 - y * y);
    positions.push(Math.cos(theta) * spread * radius, y * radius, Math.sin(theta) * spread * radius);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(geometry, new PointsMaterial({ color, size, transparent: true, opacity: 0.42 }));
}

function dotMatrix(columns: number, rows: number, spacing: number, color: Color, opacity: number, size: number) {
  const positions: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column - (columns - 1) / 2) * spacing;
      const y = (row - (rows - 1) / 2) * spacing;
      const z = Math.sin(column * 0.42) * 0.012 + Math.cos(row * 0.36) * 0.012;
      positions.push(x, y, z);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const field = new Points(
    geometry,
    new PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true }),
  );
  field.renderOrder = -2;
  return field;
}

function makeTickRing(radius: number, count: number, color: Color, opacity = 0.42) {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const length = index % 6 === 0 ? 0.18 : index % 3 === 0 ? 0.11 : 0.065;
    positions.push(
      Math.cos(angle) * (radius - length), Math.sin(angle) * (radius - length), 0,
      Math.cos(angle) * radius, Math.sin(angle) * radius, 0,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color, transparent: true, opacity }));
}

function makeCalibrationRing(radius: number, color: Color, opacity = 0.34) {
  const group = new Group();
  const ring = new Mesh(
    new TorusGeometry(radius, 0.012, 8, 160),
    new MeshBasicMaterial({ color, transparent: true, opacity }),
  );
  group.add(ring, makeTickRing(radius + 0.15, 48, color, opacity * 0.9));

  const crosshair = new BufferGeometry();
  crosshair.setAttribute('position', new Float32BufferAttribute([
    -radius - 0.28, 0, 0, -radius + 0.28, 0, 0,
    radius - 0.28, 0, 0, radius + 0.28, 0, 0,
    0, -radius - 0.28, 0, 0, -radius + 0.28, 0,
    0, radius - 0.28, 0, 0, radius + 0.28, 0,
  ], 3));
  group.add(new LineSegments(crosshair, new LineBasicMaterial({ color, transparent: true, opacity: opacity * 0.7 })));
  return group;
}

function makeWaveLine(y: number, z: number, amplitude: number, color: Color, opacity: number, phase = 0) {
  const points: Vector3[] = [];
  for (let index = 0; index <= 64; index += 1) {
    const x = -3.5 + (index / 64) * 7;
    points.push(new Vector3(x, y + Math.sin(index * 0.19 + phase) * amplitude, z));
  }
  const geometry = new BufferGeometry().setFromPoints(points);
  return new Line(geometry, new LineBasicMaterial({ color, transparent: true, opacity }));
}

function makeWaveRibbon(width: number, height: number, z: number, color: Color, phase = 0) {
  const geometry = new PlaneGeometry(width, height, 64, 1);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    position.setY(index, position.getY(index) + Math.sin(x * 2.2 + phase) * 0.11);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  const ribbon = new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color,
      roughness: 0.12,
      transmission: 0.86,
      thickness: 0.16,
      transparent: true,
      opacity: 0.2,
      side: DoubleSide,
      envMapIntensity: 1.2,
    }),
  );
  ribbon.position.z = z;
  return ribbon;
}

function makeDatumNode(radius: number, angle: number, color: Color, size = 0.065) {
  const node = new Mesh(
    new SphereGeometry(size, 16, 16),
    new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.22 }),
  );
  node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.15);
  return node;
}

function makeSolarInstrument(accent: Color, secondary: Color) {
  const root = new Group();
  const lensAssembly = new Group();
  const lens = new Mesh(new SphereGeometry(1.55, 64, 32), makeGlass(new Color('#ffffff'), 1.8));
  lens.scale.z = 0.28;
  lensAssembly.add(lens);

  const innerLens = new Mesh(
    new SphereGeometry(1.28, 48, 24),
    new MeshPhysicalMaterial({
      color: new Color('#ffffff'),
      roughness: 0.18,
      transmission: 0.72,
      thickness: 0.42,
      transparent: true,
      opacity: 0.26,
      side: DoubleSide,
      envMapIntensity: 1.35,
    }),
  );
  innerLens.scale.z = 0.12;
  innerLens.position.z = 0.18;
  lensAssembly.add(innerLens);

  const solarCore = new Mesh(
    new IcosahedronGeometry(0.42, 3),
    new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.7, roughness: 0.28 }),
  );
  solarCore.position.z = -0.42;
  lensAssembly.add(solarCore);

  const measurementRing = makeCalibrationRing(2.1, new Color('#53616d'), 0.4);
  root.add(measurementRing);
  const amberArc = new Mesh(
    new TorusGeometry(2.11, 0.036, 10, 96, Math.PI * 1.18),
    new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }),
  );
  amberArc.rotation.z = -0.4;
  root.add(amberArc);
  const marker = new Mesh(
    new ConeGeometry(0.1, 0.24, 3),
    new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.65, roughness: 0.26 }),
  );
  marker.position.set(Math.cos(0.82) * 2.38, Math.sin(0.82) * 2.38, 0.12);
  marker.rotation.z = 0.82 - Math.PI / 2;
  root.add(marker);

  const cloudBands = [
    makeWaveRibbon(3.5, 0.23, 0.62, secondary, 0.4),
    makeWaveRibbon(3.1, 0.17, 0.78, new Color('#ffffff'), 2.2),
  ];
  cloudBands[0].position.y = 0.38;
  cloudBands[1].position.y = -0.42;
  root.add(lensAssembly, ...cloudBands);

  const scan = new Mesh(
    new PlaneGeometry(0.07, 3.1),
    new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.22,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  scan.position.z = 0.96;
  root.add(scan);

  const weather = new Group();
  [-0.9, -0.56, 0.82].forEach((y, index) => {
    weather.add(makeWaveLine(y, -1.3 - index * 0.08, 0.08 + index * 0.02, new Color('#61707c'), 0.18, index * 1.4));
  });
  root.add(weather);

  return { root, lensAssembly, measurementRing, cloudBands, scan, marker, solarCore, weather };
}

function makeTrackNodes(radius: number, count: number, color: Color, z: number) {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size: 0.16, transparent: true, opacity: 0.92, sizeAttenuation: true }),
  );
}

function makeConstellation(accent: Color, secondary: Color) {
  const root = new Group();
  const tracks: Group[] = [];
  const settings = [
    { radius: 1.02, count: 3, z: 0.2 },
    { radius: 1.48, count: 6, z: 0 },
    { radius: 1.94, count: 9, z: -0.2 },
  ];

  settings.forEach(({ radius, count, z }, index) => {
    const track = new Group();
    const ring = new Mesh(
      new TorusGeometry(radius, 0.014, 8, 160),
      new MeshBasicMaterial({ color: index === 1 ? accent : new Color('#62717e'), transparent: true, opacity: 0.35 }),
    );
    ring.position.z = z;
    track.add(ring, makeTrackNodes(radius, count, index === 1 ? accent : secondary, z + 0.04));
    tracks.push(track);
    root.add(track);
  });

  const starPositions: number[] = [];
  for (let index = 0; index < 9; index += 1) {
    const a = (index / 9) * Math.PI * 2 - Math.PI / 2;
    const b = (((index + 4) % 9) / 9) * Math.PI * 2 - Math.PI / 2;
    starPositions.push(Math.cos(a) * 1.94, Math.sin(a) * 1.94, -0.12, Math.cos(b) * 1.94, Math.sin(b) * 1.94, -0.12);
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new Float32BufferAttribute(starPositions, 3));
  const rosette = new LineSegments(
    starGeometry,
    new LineBasicMaterial({ color: secondary, transparent: true, opacity: 0.38 }),
  );
  root.add(rosette);

  const ribbons: Mesh[] = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = (index / 3) * Math.PI * 2 - Math.PI / 2;
    const points = [
      new Vector3(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0.28),
      new Vector3(Math.cos(angle + 0.32) * 1.05, Math.sin(angle + 0.32) * 1.05, 0.1),
      new Vector3(Math.cos(angle - 0.2) * 1.5, Math.sin(angle - 0.2) * 1.5, -0.04),
      new Vector3(Math.cos(angle + 0.18) * 1.93, Math.sin(angle + 0.18) * 1.93, -0.16),
    ];
    const curve = new CatmullRomCurve3(points);
    const ribbon = new Mesh(
      new TubeGeometry(curve, 48, 0.026, 7, false),
      new MeshPhysicalMaterial({
        color: index === 1 ? accent : new Color('#aeb9c2'),
        roughness: 0.08,
        transmission: 0.9,
        thickness: 0.25,
        transparent: true,
        opacity: 0.78,
        envMapIntensity: 1.4,
      }),
    );
    ribbons.push(ribbon);
    root.add(ribbon);
  }

  const seed = new Mesh(new IcosahedronGeometry(0.42, 2), makeGlass(new Color('#ffffff'), 0.9));
  seed.rotation.set(0.42, 0.68, 0.16);
  root.add(seed, makeCalibrationRing(2.46, new Color('#667582'), 0.24));
  return { root, tracks, ribbons, rosette, seed };
}

function stageTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(384, 60, 0, 384, 180, 580);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f1f5f8');
    gradient.addColorStop(1, '#dfe6ec');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'rgba(41, 55, 67, 0.12)';
    for (let y = 24; y < canvas.height; y += 24) {
      for (let x = 24; x < canvas.width; x += 24) context.fillRect(x, y, 1.25, 1.25);
    }
    context.strokeStyle = 'rgba(41, 55, 67, 0.1)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(384, 318, 188, 0, Math.PI * 2);
    context.arc(384, 318, 248, 0, Math.PI * 2);
    context.moveTo(92, 318);
    context.lineTo(676, 318);
    context.moveTo(384, 26);
    context.lineTo(384, 610);
    context.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function monogramModel(_accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const mark = new Group();
  const body = new Mesh(makeCrescent(), makeGlass(new Color('#ffffff'), 1.45));
  addOpticalEdge(body, 0.12);
  mark.add(body);

  const upperTerminal = new Mesh(makeTerminalPrism(true), makeGlass(new Color('#eef2f4'), 1.2));
  const lowerTerminal = new Mesh(makeTerminalPrism(false), makeGlass(new Color('#eef2f4'), 1.2));
  addOpticalEdge(upperTerminal, 0.16);
  addOpticalEdge(lowerTerminal, 0.16);
  upperTerminal.position.z = 0.05;
  lowerTerminal.position.z = 0.05;
  mark.add(upperTerminal, lowerTerminal);

  const reflectionBands = new Group();
  reflectionBands.add(
    makeReflectionBand(1.92, 2.28, new Color('#3b4853'), 0.11),
    makeReflectionBand(3.02, 3.36, new Color('#ffffff'), 0.34),
    makeReflectionBand(3.95, 4.34, new Color('#46535e'), 0.09),
  );
  mark.add(reflectionBands);

  const innerHalo = new Mesh(
    new TorusGeometry(1.01, 0.025, 8, 128, Math.PI * 2 - 1.16),
    new MeshBasicMaterial({ color: new Color('#ffffff'), transparent: true, opacity: 0.7 }),
  );
  innerHalo.rotation.z = 0.58;
  innerHalo.position.z = 0.33;
  mark.add(innerHalo);
  mark.rotation.set(-0.13, -0.46, -0.07);
  root.add(mark);

  const calibration = makeCalibrationRing(2.85, new Color('#52616e'), 0.3);
  calibration.rotation.x = 0.12;
  calibration.position.z = -0.55;
  root.add(calibration);
  const nodes = [
    makeDatumNode(2.85, 0.18, new Color('#ffffff'), 0.072),
    makeDatumNode(2.85, 2.25, new Color('#697884'), 0.058),
    makeDatumNode(2.85, 4.36, new Color('#ffffff'), 0.058),
  ];
  root.add(...nodes);

  const nearField = dotMatrix(35, 27, 0.23, new Color('#43525e'), 0.34, 0.024);
  nearField.position.z = -0.95;
  const farField = dotMatrix(23, 19, 0.38, secondary, 0.13, 0.019);
  farField.position.set(0.12, -0.06, -2.25);
  root.add(nearField, farField);

  return {
    root,
    update: (time, pointer) => {
      const rest = reduceMotion.matches;
      const drift = rest ? 0 : Math.sin(time * 0.46) * 0.012;
      const settle = rest ? 1 : Math.min(1, time / 2.2);
      mark.rotation.y = MathUtils.lerp(mark.rotation.y, -0.46 + pointer.x * 0.07 + settle * 0.1, 0.04);
      mark.rotation.x = MathUtils.lerp(mark.rotation.x, -0.13 - pointer.y * 0.045 + drift, 0.04);
      mark.position.y = drift * 2;
      upperTerminal.rotation.z = (1 - settle) * -0.05;
      lowerTerminal.rotation.z = (1 - settle) * 0.05;
      innerHalo.material.opacity = rest ? 0.7 : 0.5 + Math.sin(time * 0.74) * 0.18;
      calibration.rotation.z = rest ? -0.04 : Math.sin(time * 0.1) * 0.035;
      nearField.position.x = MathUtils.lerp(nearField.position.x, pointer.x * -0.08, 0.035);
      nearField.position.y = MathUtils.lerp(nearField.position.y, pointer.y * 0.065, 0.035);
      farField.position.x = MathUtils.lerp(farField.position.x, 0.12 + pointer.x * -0.03, 0.025);
    },
  };
}

function bronzedModel(accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const instrument = makeSolarInstrument(accent, secondary);
  root.add(instrument.root);
  const field = dotMatrix(29, 23, 0.3, new Color('#5d6b77'), 0.16, 0.022);
  field.position.z = -2.1;
  root.add(field);
  root.rotation.x = -0.08;

  return {
    root,
    update: (time, pointer) => {
      const rest = reduceMotion.matches;
      const settle = rest ? 1 : Math.min(1, time / 2.4);
      root.rotation.y = MathUtils.lerp(root.rotation.y, pointer.x * 0.07, 0.035);
      root.rotation.x = MathUtils.lerp(root.rotation.x, -0.08 - pointer.y * 0.045, 0.04);
      instrument.lensAssembly.position.z = MathUtils.lerp(-0.2, 0, settle);
      instrument.measurementRing.position.z = MathUtils.lerp(0.28, 0, settle);
      instrument.cloudBands[0].position.z = MathUtils.lerp(1, 0.62, settle);
      instrument.cloudBands[1].position.z = MathUtils.lerp(1.18, 0.78, settle);
      instrument.scan.position.x = rest ? 0.72 : Math.sin(time * 0.72) * 1.32;
      instrument.scan.material.opacity = rest ? 0.18 : 0.12 + (Math.sin(time * 0.72) + 1) * 0.07;
      instrument.solarCore.rotation.y = rest ? 0.35 : time * 0.12;
      instrument.weather.position.x = MathUtils.lerp(instrument.weather.position.x, pointer.x * -0.08, 0.03);
      field.position.x = MathUtils.lerp(field.position.x, pointer.x * -0.045, 0.03);
    },
  };
}

function stellarModel(accent: Color, secondary: Color): SceneModel {
  const root = new Group();
  const constellation = makeConstellation(accent, secondary);
  root.add(constellation.root);
  const field = particleField(180, 3.25, new Color('#71808d'), 0.024);
  field.position.z = -1.25;
  root.add(field);

  return {
    root,
    update: (time, pointer) => {
      const rest = reduceMotion.matches;
      const settle = rest ? 1 : Math.min(1, time / 2.6);
      root.rotation.y = MathUtils.lerp(root.rotation.y, pointer.x * 0.065, 0.035);
      root.rotation.x = MathUtils.lerp(root.rotation.x, -pointer.y * 0.045, 0.04);
      constellation.tracks.forEach((track, index) => {
        const reveal = MathUtils.clamp(settle * 1.65 - index * 0.28, 0.001, 1);
        track.scale.setScalar(reveal);
        track.rotation.z = rest ? index * 0.035 : Math.sin(time * (0.12 + index * 0.02)) * 0.045 * (index % 2 ? -1 : 1);
      });
      constellation.ribbons.forEach((ribbon, index) => {
        ribbon.scale.setScalar(MathUtils.clamp(settle * 1.55 - 0.42 - index * 0.08, 0.001, 1));
      });
      constellation.seed.rotation.y = rest ? 0.58 : 0.58 + Math.sin(time * 0.28) * 0.12;
      constellation.seed.scale.setScalar(rest ? 1 : 1 + Math.sin(time * 0.32) * 0.012);
      field.rotation.z = rest ? 0 : Math.sin(time * 0.08) * 0.03;
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
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 100);
  private readonly model: SceneModel;
  private readonly pointer = { x: 0, y: 0 };
  private readonly resizeObserver: ResizeObserver;
  private readonly environment: Texture;
  private readonly backplateTexture: CanvasTexture;
  private visible = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const name = (canvas.dataset.threeScene ?? 'monogram') as SceneName;
    const accent = new Color(canvas.dataset.accent ?? '#ffffff');
    const secondary = new Color(canvas.dataset.secondary ?? '#aab4be');

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 720,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setClearColor(0x000000, 0);

    const room = new RoomEnvironment();
    const reflectionMaterial = new MeshBasicMaterial({ color: new Color('#17212a'), side: DoubleSide });
    const reflectionCardLeft = new Mesh(new PlaneGeometry(1.65, 11), reflectionMaterial);
    reflectionCardLeft.position.set(-5.2, 1.4, 2.8);
    reflectionCardLeft.rotation.y = 1.04;
    const reflectionCardRight = new Mesh(new PlaneGeometry(1.2, 9), reflectionMaterial);
    reflectionCardRight.position.set(5.4, -0.6, -1.8);
    reflectionCardRight.rotation.y = -1.12;
    room.add(reflectionCardLeft, reflectionCardRight);
    const pmrem = new PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environment = this.environment;
    room.dispose();
    pmrem.dispose();

    this.camera.position.set(0, 0, name === 'monogram' ? 11.2 : 10.2);
    this.scene.add(new AmbientLight(0xffffff, 0.85));
    const key = new DirectionalLight(0xffffff, 3.8);
    key.position.set(4.5, 6.5, 7);
    this.scene.add(key);
    const darkRim = new PointLight(0xb8c1c9, 13, 14, 2);
    darkRim.position.set(-4.8, -1.8, 3.8);
    const topRim = new PointLight(name === 'monogram' ? 0xffffff : secondary, 11, 12, 2);
    topRim.position.set(3.8, 4.5, 2.8);
    this.scene.add(darkRim, topRim);

    this.backplateTexture = stageTexture();
    const backplate = new Mesh(new PlaneGeometry(15, 12), new MeshBasicMaterial({ map: this.backplateTexture }));
    backplate.position.z = -4.6;
    this.scene.add(backplate);

    this.model = createModel(name, accent, secondary);
    this.scene.add(this.model.root);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    canvas.addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
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

  private readonly onContextRestored = () => {
    this.canvas.closest<HTMLElement>('[data-three-frame]')?.classList.add('is-rendered');
    this.refreshVisibility();
  };

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.15 : 1.55);
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
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.scene.traverse((object: Object3D) => {
      if (object instanceof Mesh || object instanceof Points || object instanceof Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.environment.dispose();
    this.backplateTexture.dispose();
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
