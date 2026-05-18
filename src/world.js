import * as THREE from 'three';
import { Noise } from './noise.js';

export function createWorld() {
  const group = new THREE.Group();

  const noise = new Noise(42);
  const size = 200;
  const segments = 128;
  const half = size / 2;
  const step = size / segments;
  const heightScale = 8;

  function getHeight(x, z) {
    let h = 0;
    h += noise.noise2D(x * 0.01, z * 0.01) * heightScale;
    h += noise.noise2D(x * 0.025, z * 0.025) * heightScale * 0.4;
    h += noise.noise2D(x * 0.05, z * 0.05) * heightScale * 0.2;
    const ridge = 1 - Math.abs(noise.noise2D(x * 0.015, z * 0.015));
    h += ridge * ridge * 3;
    return Math.max(h, -1.5) + 1.5;
  }

  const positions = [];
  const colors = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = -half + i * step;
      const z = -half + j * step;
      const y = getHeight(x, z);
      positions.push(x, y, z);

      const c = getTerrainColor(y);
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = i * (segments + 1) + j + 1;
      const c = (i + 1) * (segments + 1) + j;
      const d = (i + 1) * (segments + 1) + j + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  group.add(terrain);

  const treePositions = [];
  for (let attempt = 0; attempt < 500; attempt++) {
    const x = (Math.random() - 0.5) * (size - 10);
    const z = (Math.random() - 0.5) * (size - 10);
    const y = getHeight(x, z);
    if (y > 1 && y < 6) {
      let tooClose = false;
      for (const tp of treePositions) {
        const dx = tp.x - x, dz = tp.z - z;
        if (dx * dx + dz * dz < 9) { tooClose = true; break; }
      }
      if (!tooClose) {
        treePositions.push({ x, z });
        const tree = createTree();
        tree.position.set(x, y, z);
        const s = 0.7 + Math.random() * 0.6;
        tree.scale.setScalar(s);
        tree.rotation.y = Math.random() * Math.PI * 2;
        group.add(tree);
      }
    }
  }

  for (let attempt = 0; attempt < 300; attempt++) {
    const x = (Math.random() - 0.5) * (size - 10);
    const z = (Math.random() - 0.5) * (size - 10);
    const y = getHeight(x, z);
    if (y > 0.8 && y < 5) {
      const bush = createBush();
      bush.position.set(x, y, z);
      const s = 0.5 + Math.random() * 0.8;
      bush.scale.setScalar(s);
      group.add(bush);
    }
  }

  for (let attempt = 0; attempt < 120; attempt++) {
    const x = (Math.random() - 0.5) * (size - 10);
    const z = (Math.random() - 0.5) * (size - 10);
    const y = getHeight(x, z);
    if (y > 2 && y < 7) {
      const rock = createRock();
      rock.position.set(x, y, z);
      const s = 0.4 + Math.random() * 0.6;
      rock.scale.setScalar(s);
      group.add(rock);
    }
  }

  const waterGeo = new THREE.PlaneGeometry(size + 40, size + 40);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4a90b0,
    transparent: true,
    opacity: 0.5,
    roughness: 0.3,
    metalness: 0.1,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.2;
  water.receiveShadow = true;
  group.add(water);

  return { group, getHeight };
}

function getTerrainColor(y) {
  if (y < 0.5) return { r: 0.76, g: 0.70, b: 0.50 };
  if (y < 1.8) return { r: 0.45, g: 0.70, b: 0.30 };
  if (y < 4) return { r: 0.25, g: 0.55, b: 0.20 };
  if (y < 6) return { r: 0.40, g: 0.50, b: 0.25 };
  if (y < 8) return { r: 0.50, g: 0.45, b: 0.40 };
  return { r: 0.85, g: 0.85, b: 0.90 };
}

function createTree() {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1F, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5), trunkMat);
  trunk.position.y = 0.35;
  g.add(trunk);

  const green1 = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8, flatShading: true });
  const green2 = new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.8, flatShading: true });

  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 6), green1);
  f1.position.y = 0.9;
  g.add(f1);

  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 6), green2);
  f2.position.y = 1.25;
  g.add(f2);

  const f3 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 6), green1);
  f3.position.y = 1.55;
  g.add(f3);

  return g;
}

function createBush() {
  const g = new THREE.Group();
  const hue = 0.22 + Math.random() * 0.12;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.5, 0.2 + Math.random() * 0.15),
    roughness: 0.8,
    flatShading: true,
  });
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const size = 0.15 + Math.random() * 0.15;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), mat);
    sphere.position.set(
      (Math.random() - 0.5) * 0.35,
      Math.random() * 0.2 - size * 0.3,
      (Math.random() - 0.5) * 0.35
    );
    g.add(sphere);
  }
  return g;
}

function createRock() {
  const scale = 0.2 + Math.random() * 0.3;
  const geo = new THREE.DodecahedronGeometry(scale);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.3 + Math.random() * 0.2),
    roughness: 0.9,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  return mesh;
}
