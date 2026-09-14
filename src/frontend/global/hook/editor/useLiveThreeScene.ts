import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { slotTransform } from '../../helper/editor/geometry';
import { Layout, Slot } from '../../../../types/types';

// Asset URLs
import carGlbUrl from './3d_assets/car.glb?url';
import tree1Url from './3d_assets/tree/Tree1.glb?url';
import tree2Url from './3d_assets/tree/Tree2.glb?url';
import tree3Url from './3d_assets/tree/Tree3.glb?url';
import tree4Url from './3d_assets/tree/Tree4.glb?url';
import smallTree1Url from './3d_assets/tree/smallTree_1.glb?url';

const TREE_URLS = [tree1Url, tree2Url, tree3Url, tree4Url, smallTree1Url];

// Model Caches
let carModelCache: THREE.Group | null = null;
let treeModelsCache: THREE.Group[] = [];
let modelsLoadingPromise: Promise<void> | null = null;

async function loadModels() {
  if (modelsLoadingPromise) return modelsLoadingPromise;
  modelsLoadingPromise = (async () => {
    const loader = new GLTFLoader();

    try {
      const carGltf = await loader.loadAsync(carGlbUrl);
      carModelCache = carGltf.scene;

      const treeGltfs = await Promise.all(
        TREE_URLS.map((url) => loader.loadAsync(url).catch(() => null)),
      );
      treeModelsCache = treeGltfs.filter((g) => g !== null).map((gltf) => gltf!.scene);
    } catch (e) {
      console.error('Error loading 3D assets:', e);
    }
  })();
  return modelsLoadingPromise;
}

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
  areaMesh: THREE.Mesh | null;
  areaEdge: THREE.LineSegments | null;
  environmentGroup: THREE.Group | null;
}

export function useLiveThreeScene(
  mountRef: React.RefObject<HTMLDivElement | null>,
  layout: Layout,
) {
  const stateRef = useRef<SceneState>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    slotMeshes: {},
    animating: {},
    areaMesh: null,
    areaEdge: null,
    environmentGroup: null,
  });

  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  // ── Scene init ────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const S = stateRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);
    S.renderer = renderer;

    // Scene
    const scene = new THREE.Scene();
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
    controls.maxDistance = 150;
    S.controls = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xabc4ff, 0.5);
    fill.position.set(-10, 5, -5);
    scene.add(fill);

    // Ground grid
    const grid = new THREE.GridHelper(200, 100, 0xe2e8f0, 0xf1f5f9);
    scene.add(grid);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1,
    });
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
  }, [mountRef]);

  // ── Rebuild geometry when layout changes ──────────────
  useEffect(() => {
    const S = stateRef.current;
    if (!S.scene || !modelsLoaded) return;

    // Clear old slot meshes
    Object.values(S.slotMeshes).forEach(({ group, car }) => {
      S.scene?.remove(group);
      S.scene?.remove(car);
    });
    S.slotMeshes = {};

    // Remove old area mesh & env
    if (S.areaMesh) {
      S.scene.remove(S.areaMesh);
      S.areaMesh = null;
    }
    if (S.areaEdge) {
      S.scene.remove(S.areaEdge);
      S.areaEdge = null;
    }
    if (S.environmentGroup) {
      S.scene.remove(S.environmentGroup);
      S.environmentGroup = null;
    }

    const { area, slots } = layout;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // Area extrusion
    if (area && area.length >= 3) {
      buildAreaMesh(S, area);
      area.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    }

    // Slots
    if (slots) {
      for (const slot of slots) {
        buildSlotMesh(S, slot);
        slot.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        });
      }
    }

    // Camera centering & Environment Decoration
    if (minX !== Infinity) {
      const bounds = {
        minX: minX * SCALE,
        maxX: maxX * SCALE,
        minZ: minY * SCALE,
        maxZ: maxY * SCALE,
      };
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cz = (bounds.minZ + bounds.maxZ) / 2;

      // Update camera
      if (S.camera && S.controls) {
        S.controls.target.set(cx, 0, cz);

        const width = bounds.maxX - bounds.minX;
        const depth = bounds.maxZ - bounds.minZ;
        const maxDim = Math.max(width, depth);
        const camHeight = Math.max(12, maxDim * 0.8);
        const camOffset = Math.max(15, maxDim * 0.9);

        S.camera.position.set(cx, camHeight, cz + camOffset);
        S.camera.lookAt(cx, 0, cz);
        S.controls.update();
      }

      // Decorate trees around the bounding box
      if (treeModelsCache.length > 0) {
        decorateEnvironment(S, bounds);
      }
    }
  }, [layout, modelsLoaded]);

  // ── Sync occupied state changes without full rebuild ──
  const syncOccupied = useCallback((slots: Slot[]) => {
    const S = stateRef.current;
    for (const slot of slots) {
      const entry = S.slotMeshes[slot.id];
      if (!entry) continue;
      // Only animate if status changed
      const currentlyOccupied = entry.car.visible && !S.animating[slot.id]?.hide;
      if (currentlyOccupied !== slot.occupied) {
        updateSlotOccupied(S, entry, slot.id.toString(), slot.occupied);
      }
    }
  }, []);

  return { syncOccupied };
}

// ──────────────────────────────────────────────────────────
// Geometry builders
// ──────────────────────────────────────────────────────────

function toV3(p: { x: number; y: number }) {
  return new THREE.Vector3(p.x * SCALE, 0, p.y * SCALE);
}

function buildAreaMesh(S: SceneState, area: { x: number; y: number }[]) {
  if (!S.scene) return;

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
  const wallMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 }); // Slate-400
  const wallLines = new THREE.LineSegments(wallGeo, wallMat);
  S.scene.add(wallLines);
  S.areaEdge = wallLines;
}

function buildSlotMesh(S: SceneState, slot: Slot) {
  if (!S.scene) return;
  const { cx, cy, angle } = slotTransform(slot.points);

  const pts = slot.points;
  const w = Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2) * SCALE;
  const h = Math.sqrt((pts[3].x - pts[0].x) ** 2 + (pts[3].y - pts[0].y) ** 2) * SCALE;

  const group = new THREE.Group();
  group.position.set(cx * SCALE, 0, cy * SCALE);
  group.rotation.y = -angle;

  // Slot base plane
  const baseGeo = new THREE.PlaneGeometry(w, h);
  const baseMat = new THREE.MeshStandardMaterial({
    color: slot.occupied ? 0xfee2e2 : 0xf8fafc,
    roughness: 0.8,
    transparent: true,
    opacity: 0.9,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.01;
  base.receiveShadow = true;
  group.add(base);

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
    color: slot.occupied ? 0xef4444 : 0x22c55e,
  });
  const border = new THREE.Line(borderGeo, borderMat);
  group.add(border);

  // Label sprite
  const label = makeTextSprite(slot.label, slot.occupied ? '#ef4444' : '#22c55e');
  label.position.set(0, 0.1, 0);
  group.add(label);

  S.scene.add(group);

  // Car mesh
  const car = buildCarMesh(w, h);
  car.position.set(cx * SCALE, slot.occupied ? 0.05 : 3, cy * SCALE);
  car.rotation.y = -angle;
  car.visible = !!slot.occupied;
  S.scene.add(car);

  S.slotMeshes[slot.id] = { group, base, border, label, car, baseMat, borderMat, w, h };
}

function updateSlotOccupied(
  S: SceneState,
  entry: SlotMeshEntry,
  slotId: string,
  occupied: boolean,
) {
  const { baseMat, borderMat, car, label } = entry;
  baseMat.color.setHex(occupied ? 0xfee2e2 : 0xf8fafc);
  borderMat.color.setHex(occupied ? 0xef4444 : 0x22c55e);

  // Update label sprite color
  const newLabel = makeTextSprite(
    entry.label.userData.text || slotId,
    occupied ? '#ef4444' : '#22c55e',
  );
  newLabel.position.set(0, 0.1, 0);
  entry.group.remove(label);
  entry.group.add(newLabel);
  entry.label = newLabel;

  if (occupied) {
    car.visible = true;
    S.animating[slotId] = { startY: 4, targetY: 0.05, start: performance.now() };
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
  const group = new THREE.Group();

  if (carModelCache) {
    const cloned = carModelCache.clone();

    // Compute bounding box to scale the car appropriately
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());

    // Determine whether the slot was drawn "wide" or "tall"
    const isWider = slotW > slotH;

    const slotLength = Math.max(slotW, slotH);
    const slotWidth = Math.min(slotW, slotH);

    // Scale car to fit inside the slot (slightly smaller)
    const targetLength = slotLength * 0.85;
    const targetWidth = slotWidth * 0.7;

    const carLength = Math.max(size.x, size.z);
    const carWidth = Math.min(size.x, size.z);

    const scale = Math.min(targetWidth / carWidth, targetLength / carLength);
    cloned.scale.set(scale, scale, scale);

    // Apply random car color to materials that look like car body
    const randomColor = new THREE.Color(randomCarColor());
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const oldMat = child.material;
        child.material = oldMat.clone();
        child.material.color.lerp(randomColor, 0.7);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Center the model
    box.setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    cloned.position.set(-center.x, -box.min.y, -center.z);

    // Wrap in another group so centering applies locally FIRST
    const wrapper = new THREE.Group();
    wrapper.add(cloned);

    // If the slot is drawn wide (W > H), align the car along the local X axis.
    // If the slot is drawn tall (H > W), align the car along the local Z axis.
    // Rotate the wrapper so it pivots perfectly around the centered origin.
    wrapper.rotation.y = (isWider ? 0 : Math.PI / 2) + Math.PI / 2;

    group.add(wrapper);
  } else {
    // Fallback blocky car
    const carW = Math.min(slotW * 0.55, 1.0);
    const carL = Math.min(slotH * 0.8, 1.9);
    const carH = 0.28;

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
  }

  return group;
}

function decorateEnvironment(
  S: SceneState,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
) {
  if (!S.scene || treeModelsCache.length === 0) return;

  const envGroup = new THREE.Group();

  const numTrees = 80; // How many trees to scatter
  const scatterMargin = 3; // Minimum distance from the layout border
  const scatterRadius = 10; // Max distance from the layout border

  for (let i = 0; i < numTrees; i++) {
    // Pick a random tree
    const template = treeModelsCache[Math.floor(Math.random() * treeModelsCache.length)];
    const tree = template.clone();

    // Scale tree to be much smaller and add some random variation
    const baseScale = 0.15; // Significantly reduced base scale
    const scale = baseScale + Math.random() * baseScale;
    tree.scale.set(scale, scale, scale);

    // Place tree in a perimeter around the bounds
    const side = Math.floor(Math.random() * 4);
    let x = 0,
      z = 0;

    const marginX = (bounds.maxX - bounds.minX) / 2 + scatterMargin;
    const marginZ = (bounds.maxZ - bounds.minZ) / 2 + scatterMargin;
    const cx = (bounds.maxX + bounds.minX) / 2;
    const cz = (bounds.maxZ + bounds.minZ) / 2;

    if (side === 0) {
      // Top
      x = cx + (Math.random() - 0.5) * (marginX * 2 + scatterRadius * 2);
      z = cz - marginZ - Math.random() * scatterRadius;
    } else if (side === 1) {
      // Bottom
      x = cx + (Math.random() - 0.5) * (marginX * 2 + scatterRadius * 2);
      z = cz + marginZ + Math.random() * scatterRadius;
    } else if (side === 2) {
      // Left
      x = cx - marginX - Math.random() * scatterRadius;
      z = cz + (Math.random() - 0.5) * (marginZ * 2 + scatterRadius * 2);
    } else {
      // Right
      x = cx + marginX + Math.random() * scatterRadius;
      z = cz + (Math.random() - 0.5) * (marginZ * 2 + scatterRadius * 2);
    }

    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;

    tree.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    envGroup.add(tree);
  }

  S.scene.add(envGroup);
  S.environmentGroup = envGroup;
}

const CAR_COLORS = [
  0xff4444, 0x4488ff, 0xffdd33, 0xffffff, 0x33cc77, 0xff8800, 0xaa44cc, 0x111111,
  0xaaaaaa,
];
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
  sprite.userData = { text };
  return sprite;
}
