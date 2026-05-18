import * as THREE from 'three';
import { Noise } from './noise.js';

const CHUNK_SIZE = 50;
const SEGMENTS = 24;

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.loadedChunks = new Map();
    this.lastCX = null;
    this.lastCZ = null;
    this.renderDist = 3;

    const noise = new Noise(42);
    const heightScale = 8;
    this.getHeight = (x, z) => {
      let h = 0;
      h += noise.noise2D(x * 0.01, z * 0.01) * heightScale;
      h += noise.noise2D(x * 0.025, z * 0.025) * heightScale * 0.4;
      h += noise.noise2D(x * 0.05, z * 0.05) * heightScale * 0.2;
      const ridge = 1 - Math.abs(noise.noise2D(x * 0.015, z * 0.015));
      h += ridge * ridge * 3;
      return Math.max(h, -1.5) + 1.5;
    };

    this.water = this.#createWater();
    scene.add(this.water);
  }

  #createWater() {
    const geo = new THREE.PlaneGeometry(200, 200);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a90b0,
      transparent: true,
      opacity: 0.5,
      roughness: 0.3,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.2;
    mesh.receiveShadow = true;
    return mesh;
  }

  update(foxPos) {
    const cx = Math.floor(foxPos.x / CHUNK_SIZE);
    const cz = Math.floor(foxPos.z / CHUNK_SIZE);

    if (cx === this.lastCX && cz === this.lastCZ) return;
    this.lastCX = cx;
    this.lastCZ = cz;

    const keysToRemove = [];
    for (const [key, chunk] of this.loadedChunks) {
      const dx = chunk.cx - cx;
      const dz = chunk.cz - cz;
      if (Math.abs(dx) > this.renderDist || Math.abs(dz) > this.renderDist) {
        this.#disposeChunk(chunk);
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) this.loadedChunks.delete(key);

    for (let dx = -this.renderDist; dx <= this.renderDist; dx++) {
      for (let dz = -this.renderDist; dz <= this.renderDist; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.loadedChunks.has(key)) {
          const chunk = new Chunk(cx + dx, cz + dz, this.getHeight);
          this.loadedChunks.set(key, chunk);
          this.scene.add(chunk.group);
        }
      }
    }

    this.water.position.x = cx * CHUNK_SIZE;
    this.water.position.z = cz * CHUNK_SIZE;
  }

  #disposeChunk(chunk) {
    this.scene.remove(chunk.group);
    chunk.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

class Chunk {
  constructor(cx, cz, getHeight) {
    this.cx = cx;
    this.cz = cz;
    this.group = new THREE.Group();
    this.#generate(getHeight);
  }

  #generate(getHeight) {
    const ox = this.cx * CHUNK_SIZE;
    const oz = this.cz * CHUNK_SIZE;
    const step = CHUNK_SIZE / SEGMENTS;

    const positions = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      for (let j = 0; j <= SEGMENTS; j++) {
        const x = ox + i * step;
        const z = oz + j * step;
        const y = getHeight(x, z);
        positions.push(x, y, z);
        const c = getTerrainColor(y);
        colors.push(c.r, c.g, c.b);
      }
    }

    for (let i = 0; i < SEGMENTS; i++) {
      for (let j = 0; j < SEGMENTS; j++) {
        const a = i * (SEGMENTS + 1) + j;
        const b = i * (SEGMENTS + 1) + j + 1;
        const c = (i + 1) * (SEGMENTS + 1) + j;
        const d = (i + 1) * (SEGMENTS + 1) + j + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.group.add(mesh);

    this.#scatterObjects(getHeight, ox, oz);
  }

  #scatterObjects(getHeight, ox, oz) {
    const rng = this.#seededRandom(this.cx * 10000 + this.cz);

    const treePositions = [];
    for (let i = 0; i < 8; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 1 && y < 6) {
        let ok = true;
        for (const tp of treePositions) {
          const dx = tp.x - x, dz = tp.z - z;
          if (dx * dx + dz * dz < 9) { ok = false; break; }
        }
        if (ok) {
          treePositions.push({ x, z });
          const tree = createTree(rng);
          tree.position.set(x, y, z);
          const s = 0.6 + rng() * 0.6;
          tree.scale.setScalar(s);
          tree.rotation.y = rng() * Math.PI * 2;
          this.group.add(tree);
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 0.8 && y < 5) {
        const bush = createBush(rng);
        bush.position.set(x, y, z);
        bush.scale.setScalar(0.4 + rng() * 0.8);
        this.group.add(bush);
      }
    }

    for (let i = 0; i < 3; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 2 && y < 7) {
        const rock = createRock(rng);
        rock.position.set(x, y, z);
        rock.scale.setScalar(0.3 + rng() * 0.6);
        this.group.add(rock);
      }
    }
  }

  #seededRandom(seed) {
    return () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }
}

const TERRAIN_COLORS = [
  { limit: 0.5, color: { r: 0.76, g: 0.70, b: 0.50 } },
  { limit: 1.8, color: { r: 0.45, g: 0.70, b: 0.30 } },
  { limit: 4.0, color: { r: 0.25, g: 0.55, b: 0.20 } },
  { limit: 6.0, color: { r: 0.40, g: 0.50, b: 0.25 } },
  { limit: 8.0, color: { r: 0.50, g: 0.45, b: 0.40 } },
  { limit: Infinity, color: { r: 0.85, g: 0.85, b: 0.90 } },
];

function getTerrainColor(y) {
  for (const tc of TERRAIN_COLORS) {
    if (y <= tc.limit) return tc.color;
  }
  return TERRAIN_COLORS[TERRAIN_COLORS.length - 1].color;
}

function createTree(rng) {
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

function createBush(rng) {
  const g = new THREE.Group();
  const hue = 0.22 + rng() * 0.12;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.5, 0.2 + rng() * 0.15),
    roughness: 0.8,
    flatShading: true,
  });
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const size = 0.15 + rng() * 0.15;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), mat);
    sphere.position.set(
      (rng() - 0.5) * 0.35,
      rng() * 0.2 - size * 0.3,
      (rng() - 0.5) * 0.35
    );
    g.add(sphere);
  }
  return g;
}

function createRock(rng) {
  const scale = 0.2 + rng() * 0.3;
  const geo = new THREE.DodecahedronGeometry(scale);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.3 + rng() * 0.2),
    roughness: 0.9,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  return mesh;
}
