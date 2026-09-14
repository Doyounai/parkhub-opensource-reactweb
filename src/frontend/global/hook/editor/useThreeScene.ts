import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { slotTransform } from '../utils/geometry'
// import { Layout, Slot } from '../types'
import { slotTransform } from '../../helper/editor/geometry';
import { Layout, Slot } from '../../../../types/types';

// World scale: 1 editor unit = 0.05 meters (so 20px ≈ 1m)
const SCALE = 0.05;
const WALL_H = 0.3;
const CAR_ANIM_DURATION = 800; // ms for car drop-in

interface SlotMeshEntry {
  group: THREE.Group;
  base: THREE.Mesh;
  border: THREE.Line | THREE.LineSegments;
  label: THREE.Sprite;
  car: THREE.Group;
  baseMat: THREE.MeshStandardMaterial;
  borderMat: THREE.LineBasicMaterial;
  w: number;
  h: number;
}

interface AnimationState {
  startY: number;
  targetY: number;
  start: number;
  hide?: boolean;
}

interface SceneState {
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  controls: OrbitControls | null;
  slotMeshes: Record<string, SlotMeshEntry>;
  animating: Record<string, AnimationState>;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  clickables: THREE.Object3D[];
  areaMesh: THREE.Mesh | null;
  areaEdge: THREE.LineSegments | null;
}

export function useThreeScene(
  mountRef: React.RefObject<HTMLDivElement | null>,
  layout: Layout,
  onSlotToggle: (id: string) => void,
) {
  const stateRef = useRef<SceneState>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    slotMeshes: {},
    animating: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clickables: [],
    areaMesh: null,
    areaEdge: null,
  });

  // ── Scene init ────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const S = stateRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);
    S.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x0a0c10);
    // scene.fog = new THREE.FogExp2(0x0a0c10, 0.018);
    S.scene = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500,
    );
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);
    S.camera = camera;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 80;
    S.controls = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0x1a2030, 1.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x0044ff, 0.4);
    fill.position.set(-10, 5, -5);
    scene.add(fill);

    // Ground grid
    const grid = new THREE.GridHelper(200, 100, 0x1e2530, 0x141820);
    scene.add(grid);

    // Ground plane (receive shadows)
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d1018, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Render loop
    let animId: number;
    const tick = (time: number) => {
      animId = requestAnimationFrame(tick);
      controls.update();
      tickCarAnimations(S, time);
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(tick);

    // Resize
    const ro = new ResizeObserver(() => {
      if (!mount) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [mountRef]); // dependency on mountRef

  // ── Rebuild geometry when layout changes ──────────────
  useEffect(() => {
    const S = stateRef.current;
    if (!S.scene) return;

    // Clear old slot meshes
    Object.values(S.slotMeshes).forEach(({ group, car }) => {
      S.scene?.remove(group);
      S.scene?.remove(car);
    });
    S.slotMeshes = {};
    S.clickables = [];

    // Remove old area mesh
    if (S.areaMesh) {
      S.scene.remove(S.areaMesh);
      S.areaMesh = null;
    }
    if (S.areaEdge) {
      S.scene.remove(S.areaEdge);
      S.areaEdge = null;
    }

    const { area, slots } = layout;

    // Area extrusion
    if (area.length >= 3) {
      buildAreaMesh(S, area);
    }

    // Slots
    for (const slot of slots) {
      buildSlotMesh(S, slot);
    }
  }, [layout]);

  // ── Click handler for toggling slots ─────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const S = stateRef.current;
      if (!S.renderer || !S.camera) return;
      const rect = S.renderer.domElement.getBoundingClientRect();
      S.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      S.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      S.raycaster.setFromCamera(S.mouse, S.camera);
      const hits = S.raycaster.intersectObjects(S.clickables, false);
      if (hits.length > 0) {
        const slotId = hits[0].object.userData.slotId;
        if (slotId) onSlotToggle(slotId);
      }
    },
    [onSlotToggle],
  );

  // ── Sync occupied state changes without full rebuild ──
  const syncOccupied = useCallback((slots: Slot[]) => {
    const S = stateRef.current;
    for (const slot of slots) {
      const entry = S.slotMeshes[slot.id];
      if (!entry) continue;
      updateSlotOccupied(S, entry, slot.id.toString(), slot.occupied);
    }
  }, []);

  return { handleClick, syncOccupied };
}

// ──────────────────────────────────────────────────────────
// Geometry builders
// ──────────────────────────────────────────────────────────

function toV3(p: { x: number; y: number }) {
  return new THREE.Vector3(p.x * SCALE, 0, p.y * SCALE);
}

function buildAreaMesh(S: SceneState, area: { x: number; y: number }[]) {
  if (!S.scene) return;
  const pts2d = area.map((p) => new THREE.Vector2(p.x * SCALE, p.y * SCALE));
  const shape = new THREE.Shape(pts2d);
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111820,
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  // const mesh = new THREE.Mesh(geo, mat);
  // mesh.rotation.x = -Math.PI / 2;
  // mesh.position.y = 0.005;
  // mesh.receiveShadow = true;
  // S.scene.add(mesh);
  // S.areaMesh = mesh;

  // Outline walls
  const points3d = [...area, area[0]].map((p) => toV3(p));
  const wallPoints: THREE.Vector3[] = [];
  for (let i = 0; i < points3d.length - 1; i++) {
    const p = points3d[i];
    const next = points3d[i + 1];
    wallPoints.push(
      new THREE.Vector3(p.x, 0, p.z),
      new THREE.Vector3(p.x, WALL_H, p.z),
      new THREE.Vector3(p.x, WALL_H, p.z),
      new THREE.Vector3(next.x, WALL_H, next.z),
      new THREE.Vector3(next.x, WALL_H, next.z),
      new THREE.Vector3(next.x, 0, next.z),
    );
  }
  const wallGeo = new THREE.BufferGeometry().setFromPoints(wallPoints);
  const wallMat = new THREE.LineBasicMaterial({ color: 0x00e5ff });
  const wallLines = new THREE.LineSegments(wallGeo, wallMat);
  S.scene.add(wallLines);
  S.areaEdge = wallLines;
}

function buildSlotMesh(S: SceneState, slot: Slot) {
  if (!S.scene) return;
  const { cx, cy, angle } = slotTransform(slot.points);

  // Compute slot dimensions from bounding quad
  const pts = slot.points;
  const w = Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2) * SCALE;
  const h = Math.sqrt((pts[3].x - pts[0].x) ** 2 + (pts[3].y - pts[0].y) ** 2) * SCALE;

  const group = new THREE.Group();
  group.position.set(cx * SCALE, 0, cy * SCALE);
  group.rotation.y = -angle;

  // Slot base plane
  const baseGeo = new THREE.PlaneGeometry(w, h);
  const baseMat = new THREE.MeshStandardMaterial({
    color: slot.occupied ? 0x3a1010 : 0x0d2010,
    roughness: 0.8,
    transparent: true,
    opacity: 0.9,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.01;
  base.receiveShadow = true;
  base.userData.slotId = slot.id;
  group.add(base);
  S.clickables.push(base);

  // Slot border lines
  const hw = w / 2,
    hh = h / 2;
  const corners = [
    new THREE.Vector3(-hw, 0.015, -hh),
    new THREE.Vector3(hw, 0.015, -hh),
    new THREE.Vector3(hw, 0.015, hh),
    new THREE.Vector3(-hw, 0.015, hh),
    new THREE.Vector3(-hw, 0.015, -hh),
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(corners);
  const borderMat = new THREE.LineBasicMaterial({
    color: slot.occupied ? 0xff2d55 : 0x39ff14,
  });
  const border = new THREE.Line(borderGeo, borderMat);
  group.add(border);

  // Label sprite
  const label = makeTextSprite(slot.label, slot.occupied ? '#ff2d55' : '#39ff14');
  label.position.set(0, 0.1, 0);
  group.add(label);

  S.scene.add(group);

  // Car mesh (hidden until occupied)
  const car = buildCarMesh(w, h);
  car.position.set(cx * SCALE, slot.occupied ? 0.15 : 3, cy * SCALE);
  car.rotation.y = -angle;
  car.visible = slot.occupied;
  S.scene.add(car);

  S.slotMeshes[slot.id] = { group, base, border, label, car, baseMat, borderMat, w, h };
  if (slot.occupied) {
    car.position.y = 0.15;
    car.visible = true;
  }
}

function updateSlotOccupied(
  S: SceneState,
  entry: SlotMeshEntry,
  slotId: string,
  occupied: boolean,
) {
  const { baseMat, borderMat, car } = entry;
  baseMat.color.setHex(occupied ? 0x3a1010 : 0x0d2010);
  borderMat.color.setHex(occupied ? 0xff2d55 : 0x39ff14);
  if (occupied) {
    car.visible = true;
    S.animating[slotId] = { startY: 4, targetY: 0.15, start: performance.now() };
  } else {
    S.animating[slotId] = {
      startY: car.position.y,
      targetY: 4,
      start: performance.now(),
      hide: true,
    };
  }
}

function tickCarAnimations(S: SceneState, time: number) {
  for (const [id, anim] of Object.entries(S.animating)) {
    const entry = S.slotMeshes[id];
    if (!entry) {
      delete S.animating[id];
      continue;
    }
    const t = Math.min(1, (time - anim.start) / CAR_ANIM_DURATION);
    const eased = easeOutBounce(t);
    entry.car.position.y = anim.startY + (anim.targetY - anim.startY) * eased;
    if (t >= 1) {
      if (anim.hide) entry.car.visible = false;
      delete S.animating[id];
    }
  }
}

function easeOutBounce(x: number): number {
  const n1 = 7.5625,
    d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

function buildCarMesh(slotW: number, slotH: number): THREE.Group {
  const carW = Math.min(slotW * 0.55, 1.0);
  const carL = Math.min(slotH * 0.8, 1.9);
  const carH = 0.28;

  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(carW, carH, carL);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: randomCarColor(),
    metalness: 0.6,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = carH / 2 + 0.06;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(carW * 0.75, carH * 0.7, carL * 0.5);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    metalness: 0.2,
    roughness: 0.6,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, carH + 0.06, -carL * 0.05);
  cabin.castShadow = true;
  group.add(cabin);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const positions: [number, number, number][] = [
    [-carW / 2 - 0.01, 0.07, carL * 0.32],
    [carW / 2 + 0.01, 0.07, carL * 0.32],
    [-carW / 2 - 0.01, 0.07, -carL * 0.32],
    [carW / 2 + 0.01, 0.07, -carL * 0.32],
  ];
  for (const [x, y, z] of positions) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    group.add(w);
  }

  return group;
}

const CAR_COLORS = [0xff4444, 0x4488ff, 0xffdd33, 0xffffff, 0x33cc77, 0xff8800, 0xaa44cc];
function randomCarColor() {
  return CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
}

function makeTextSprite(text: string, color = '#ffffff'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Sprite();
  ctx.clearRect(0, 0, 128, 64);
  ctx.font = 'bold 28px Rajdhani, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.3, 1);
  return sprite;
}
