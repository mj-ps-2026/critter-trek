import * as THREE from 'three';
import { Noise } from './noise.js';

const CHUNK_SIZE = 50;
const SEGMENTS = 28;

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.loadedChunks = new Map();
    this.lastCX = null;
    this.lastCZ = null;
    this.renderDist = 3;

    const noise = new Noise(42);
    this.getHeight = (x, z) => {
      const warp = noise.noise2D(x * 0.003, z * 0.003) * 60;
      const wx = x + warp;
      const wz = z + warp;

      const continent = noise.noise2D(wx * 0.005, wz * 0.005);
      const mountainMask = Math.max(0, (continent - 0.15) * 1.8);

      const hills = noise.noise2D(wx * 0.018, wz * 0.018);

      const detail = noise.noise2D(wx * 0.05, wz * 0.05);

      const ridge = 1 - Math.abs(noise.noise2D(wx * 0.009, wz * 0.009));
      const ridges = ridge * ridge * ridge;

      const cliffs = Math.max(0, noise.noise2D(wx * 0.012, wz * 0.012) - 0.3) * 2;
      const cliffRidge = cliffs * cliffs * 4;

      let h = 0;
      h += continent * 5;
      h += hills * 2.5 * (1 + mountainMask * 3);
      h += detail * 0.8;
      h += ridges * 8 * mountainMask;
      h += cliffRidge * mountainMask;

      const flatValley = Math.max(0, 1 - mountainMask * 2);
      h = Math.max(h, -0.5 + Math.abs(continent) * 0.3);

      return Math.max(h, 0) + 0.5;
    };

    this.water = this.#createWater();
    scene.add(this.water);
  }

  #createWater() {
    const geo = new THREE.PlaneGeometry(300, 300);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a7ca5,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.3;
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
      const dx = chunk.cx - cx, dz = chunk.cz - cz;
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
        const c = getTerrainColor(x, y, z);
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
      roughness: 0.85,
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
    const treeCount = 10 + Math.floor(rng() * 6);
    for (let i = 0; i < treeCount; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 1.2 && y < 6) {
        let ok = true;
        for (const tp of treePositions) {
          const dx = tp.x - x, dz = tp.z - z;
          if (dx * dx + dz * dz < 20) { ok = false; break; }
        }
        if (ok) {
          treePositions.push({ x, z });
          const treeType = rng();
          const tree = treeType < 0.6 ? createPineTree(rng) : treeType < 0.85 ? createOakTree(rng) : createGiantTree(rng);
          tree.position.set(x, y, z);
          const s = tree.userData.baseScale || 0.8 + rng() * 0.5;
          tree.scale.setScalar(s);
          tree.rotation.y = rng() * Math.PI * 2;
          this.group.add(tree);
        }
      }
    }

    for (let i = 0; i < 6; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 0.8 && y < 5) {
        const bush = createBush(rng);
        bush.position.set(x, y, z);
        bush.scale.setScalar(0.5 + rng() * 0.9);
        this.group.add(bush);
      }
    }

    for (let i = 0; i < 4; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > 2.5 && y < 8) {
        const rock = createRock(rng);
        rock.position.set(x, y, z);
        rock.scale.setScalar(0.4 + rng() * 0.8);
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

function getTerrainColor(x, y, z) {
  if (y < 0.3) return { r: 0.76, g: 0.70, b: 0.50 };
  if (y < 1.2) return { r: 0.50, g: 0.72, b: 0.32 };
  if (y < 2.5) return { r: 0.30, g: 0.58, b: 0.22 };
  if (y < 4.5) return { r: 0.28, g: 0.50, b: 0.18 };
  if (y < 6.5) return { r: 0.42, g: 0.48, b: 0.28 };
  if (y < 8.5) return { r: 0.50, g: 0.45, b: 0.40 };
  return { r: 0.80, g: 0.80, b: 0.88 };
}

function createPineTree(rng) {
  const g = new THREE.Group();
  const h = 4 + rng() * 4;
  const trunkH = h * 0.3;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  const layers = 3 + Math.floor(rng() * 3);
  const darkGreen = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.8, flatShading: true });
  const midGreen = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8, flatShading: true });
  const lightGreen = new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.8, flatShading: true });
  const greens = [darkGreen, midGreen, lightGreen];

  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const radius = (0.6 + rng() * 0.3) * (1 - t * 0.3);
    const lh = (0.7 + rng() * 0.2) * h * 0.18;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, lh, 7), greens[i % 3]);
    cone.position.y = trunkH + i * (h * 0.16) + lh / 2;
    cone.castShadow = true;
    g.add(cone);
  }

  return g;
}

function createOakTree(rng) {
  const g = new THREE.Group();
  const trunkH = 2 + rng() * 2;
  const canopyR = 1.5 + rng() * 1.5;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1F, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.25 + rng() * 0.08, 0.5, 0.25 + rng() * 0.1),
    roughness: 0.8,
    flatShading: true,
  });

  const mainCanopy = new THREE.Mesh(new THREE.SphereGeometry(canopyR, 7, 7), canopyMat);
  mainCanopy.position.y = trunkH + canopyR * 0.6;
  mainCanopy.castShadow = true;
  g.add(mainCanopy);

  const subR = canopyR * 0.6;
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + rng() * 0.3;
    const dist = canopyR * 0.5;
    const sub = new THREE.Mesh(
      new THREE.SphereGeometry(subR * (0.6 + rng() * 0.4), 6, 6),
      canopyMat
    );
    sub.position.set(
      Math.cos(angle) * dist,
      trunkH + canopyR * 0.4 + rng() * 0.5,
      Math.sin(angle) * dist
    );
    sub.castShadow = true;
    g.add(sub);
  }

  return g;
}

function createGiantTree(rng) {
  const g = new THREE.Group();
  const h = 10 + rng() * 5;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A2F1A, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, h * 0.6, 7), trunkMat);
  trunk.position.y = h * 0.3;
  trunk.castShadow = true;
  g.add(trunk);

  const darkGreen = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.8, flatShading: true });
  const midGreen = new THREE.MeshStandardMaterial({ color: 0x2E6B2E, roughness: 0.8, flatShading: true });

  const layers = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r = (0.8 + rng() * 0.3) * (1 - t * 0.25);
    const lh = 1.0 + rng() * 0.3;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, lh, 7), i % 2 === 0 ? darkGreen : midGreen);
    cone.position.y = h * 0.6 + i * (h * 0.1) + lh / 2;
    cone.castShadow = true;
    g.add(cone);
  }

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
    const size = 0.15 + rng() * 0.2;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), mat);
    sphere.position.set(
      (rng() - 0.5) * 0.4,
      rng() * 0.2 - size * 0.2,
      (rng() - 0.5) * 0.4
    );
    g.add(sphere);
  }
  return g;
}

function createRock(rng) {
  const scale = 0.2 + rng() * 0.4;
  const geo = new THREE.DodecahedronGeometry(scale);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0, 0, 0.3 + rng() * 0.25),
    roughness: 0.9,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  return mesh;
}
