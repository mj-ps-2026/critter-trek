import * as THREE from 'three';
import { Noise } from './noise.js';

const CHUNK_SIZE = 50;
const SEGMENTS = 28;
const SEA_LEVEL = 0;

function smoothstep(t, lo, hi) {
  t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

export class ChunkManager {
  constructor(scene, seed = 42) {
    this.scene = scene;
    this.loadedChunks = new Map();
    this.chunkCache = new Map();
    this.cacheMaxSize = 200;
    this.lastCX = null;
    this.lastCZ = null;
    this.renderDist = 4;

    const n = new Noise(seed * 7 + 13);
    const n2 = new Noise(seed * 31 + 7);

    this.getHeight = (x, z) => {
      const continent = n.noise2D(x * 0.0007, z * 0.0007);
      const temp = n.noise2D(x * 0.0008, z * 0.0008);
      const moist = n.noise2D(x * 0.0009, z * 0.0009);
      const magic = n2.noise2D(x * 0.0007, z * 0.0007);

      const land = smoothstep(continent, -0.35, 0.05);
      const mountain = smoothstep(continent, 0.15, 0.55);
      const desert = smoothstep(temp, 0.12, 0.42) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain * 0.4);
      const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain * 0.3);
      const tundra = 1 - smoothstep(temp, -0.35, 0);
      const swamp = smoothstep(-moist, 0, 0.3) * (1 - mountain) * land;
      const badlands = smoothstep(temp, 0.08, 0.35) * (1 - smoothstep(moist, -0.3, 0.05)) * Math.max(0, mountain - 0.15) * 1.5;
      const crystal = smoothstep(magic, 0.45, 0.7) * land;
      const canyon = smoothstep(temp, -0.1, 0.2) * smoothstep(-moist, -0.3, 0.05) * (1 - smoothstep(continent, 0.3, 0.5)) * (1 - mountain) * land;
      const riverFactor = smoothstep(moist, -0.1, 0.35);

      let h = 0;
      h += continent * 10;

      const ridge = 1 - Math.abs(n.noise2D(x * 0.002, z * 0.002));
      const ridges = ridge * ridge * ridge * 60;

      const peakNoise = n.noise2D(x * 0.003, z * 0.003);
      const sharpRidge = 1 - Math.abs(peakNoise);
      const sharpPeaks = sharpRidge * sharpRidge * sharpRidge * 40;

      const cliffNoise = Math.abs(n.noise2D(x * 0.004, z * 0.004) - n.noise2D(x * 0.0045, z * 0.0045));
      const cliffs = cliffNoise * cliffNoise * 30;

      const tallPeak = Math.max(0, n.noise2D(x * 0.001, z * 0.001) - 0.25) * 50;

      h += ridges * mountain;
      h += sharpPeaks * Math.max(0, mountain - 0.1);
      h += cliffs * Math.max(0, mountain - 0.25) * 2;
      h += tallPeak * Math.max(0, mountain - 0.1);

      const hills = n.noise2D(x * 0.009, z * 0.009) * 4;
      h += hills * (1 - mountain * 0.7);

      const detail = n.noise2D(x * 0.02, z * 0.02) * 0.8;
      h += detail;

      if (desert > 0.05) {
        const dx = x * 0.008 + n2.noise2D(x * 0.015, z * 0.015) * 0.8;
        const dz = z * 0.008;
        h += (Math.sin(dx) * Math.sin(dz) * 3 + n.noise2D(x * 0.025, z * 0.025)) * desert;
      }

      if (swamp > 0.05) {
        h = h * (1 - swamp * 0.8) - swamp * 1.5;
        h += n2.noise2D(x * 0.015, z * 0.015) * swamp * 0.6;
      }

      if (badlands > 0.05) {
        const mesa = Math.floor(n.noise2D(x * 0.003, z * 0.003) * 3) / 3;
        h += (mesa * 7 - h * 0.3) * Math.min(1, badlands * 2);
      }

      if (crystal > 0.1) {
        h += Math.abs(n2.noise2D(x * 0.035, z * 0.035)) * 14 * crystal;
        h += Math.abs(n2.noise2D(x * 0.06, z * 0.06)) * 7 * crystal;
      }

      if (tundra > 0.3) {
        h += n2.noise2D(x * 0.03, z * 0.03) * tundra * 0.5;
      }

      if (riverFactor > 0.05) {
        const riverNoise = Math.abs(n2.noise2D(x * 0.004, z * 0.004));
        const riverValley = Math.max(0, 1 - riverNoise * 5);
        h -= riverValley * riverFactor * 1.8;
      }

      if (canyon > 0.05) {
        const nx = n2.noise2D(x * 0.004, z * 0.003);
        const nz = n2.noise2D(x * 0.003, z * 0.004);
        const cf = Math.abs(nx * nz * 1.5 + n2.noise2D(x * 0.006, z * 0.006) * 0.3);
        h -= (1 - cf * cf) * 10 * canyon;
      }

      const flatSeafloor = continent * 2 - 7;
      h = h * land + flatSeafloor * (1 - land);

      return h;
    };

    this.getBiomeInfo = (x, z) => {
      const continent = n.noise2D(x * 0.0007, z * 0.0007);
      const temp = n.noise2D(x * 0.0008, z * 0.0008);
      const moist = n.noise2D(x * 0.0009, z * 0.0009);
      const magic = n2.noise2D(x * 0.0007, z * 0.0007);
      const land = smoothstep(continent, -0.35, 0.05);
      const mountain = smoothstep(continent, 0.15, 0.55);
      return { continent, temp, moist, magic, land, mountain };
    };

    this.water = this.#createWater();
    scene.add(this.water);
  }

  #createWater() {
    const geo = new THREE.PlaneGeometry(400, 400);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a5a7a,
      transparent: true,
      opacity: 0.55,
      roughness: 0.15,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = SEA_LEVEL;
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
        this.scene.remove(chunk.group);
        this.chunkCache.set(key, chunk);
        if (this.chunkCache.size > this.cacheMaxSize) {
          const oldestKey = this.chunkCache.keys().next().value;
          this.#disposeChunk(this.chunkCache.get(oldestKey));
          this.chunkCache.delete(oldestKey);
        }
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) this.loadedChunks.delete(key);

    for (let dx = -this.renderDist; dx <= this.renderDist; dx++) {
      for (let dz = -this.renderDist; dz <= this.renderDist; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.loadedChunks.has(key)) {
          let chunk;
          if (this.chunkCache.has(key)) {
            chunk = this.chunkCache.get(key);
            this.chunkCache.delete(key);
          } else {
            chunk = new Chunk(cx + dx, cz + dz, this.getHeight, this.getBiomeInfo);
          }
          this.loadedChunks.set(key, chunk);
          this.scene.add(chunk.group);
        }
      }
    }

    this.water.position.x = cx * CHUNK_SIZE;
    this.water.position.z = cz * CHUNK_SIZE;
  }

  dispose() {
    for (const chunk of this.loadedChunks.values()) this.#disposeChunk(chunk);
    this.loadedChunks.clear();
    for (const chunk of this.chunkCache.values()) this.#disposeChunk(chunk);
    this.chunkCache.clear();
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
  constructor(cx, cz, getHeight, getBiomeInfo) {
    this.cx = cx;
    this.cz = cz;
    this.group = new THREE.Group();
    this.#generate(getHeight, getBiomeInfo);
  }

  #generate(getHeight, getBiomeInfo) {
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
        const c = getTerrainColor(x, y, z, getBiomeInfo);
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

    this.#scatterObjects(getHeight, getBiomeInfo, ox, oz);
  }

  #scatterObjects(getHeight, getBiomeInfo, ox, oz) {
    const rng = this.#seededRandom(this.cx * 10000 + this.cz);

    const treePositions = [];
    const midX = ox + CHUNK_SIZE / 2;
    const midZ = oz + CHUNK_SIZE / 2;
    const bio = getBiomeInfo(midX, midZ);
    const desert = smoothstep(bio.temp, 0.15, 0.45) * (1 - smoothstep(bio.moist, -0.2, 0.1)) * (1 - bio.mountain * 0.4);
    const forest = smoothstep(bio.temp, 0, 0.3) * smoothstep(bio.moist, 0.2, 0.5) * (1 - bio.mountain * 0.3);
    const tundra = 1 - smoothstep(bio.temp, -0.35, 0);
    const swamp = smoothstep(-bio.moist, 0, 0.3) * (1 - bio.mountain) * smoothstep(bio.continent, -0.3, 0.05);
    const crystal = smoothstep(bio.magic, 0.45, 0.7) * smoothstep(bio.continent, -0.3, 0.05);
    const canyon = smoothstep(bio.temp, -0.1, 0.2) * smoothstep(-bio.moist, -0.3, 0.05) * (1 - smoothstep(bio.continent, 0.3, 0.5)) * (1 - bio.mountain) * bio.land;
    const badlands = smoothstep(bio.temp, 0.08, 0.35) * (1 - smoothstep(bio.moist, -0.3, 0.05)) * Math.max(0, bio.mountain - 0.15) * 1.5;
    const plains = Math.max(0, 1 - desert - forest - tundra - swamp - crystal - canyon - badlands - bio.mountain) * 0.6;

    let treeCount = 5, bushCount = 5, rockCount = 3, snowDriftCount = 0;
    let cattailCount = 0, rockPillarCount = 0, dryScrubCount = 0;

    if (forest > 0.3) treeCount = 16;
    else if (plains > 0.2) treeCount = 8;
    else if (swamp > 0.2) treeCount = 10;
    else if (tundra > 0.3) treeCount = 0;
    else if (bio.mountain > 0.4) treeCount = 6;
    else if (canyon > 0.2) treeCount = 3;
    else if (badlands > 0.15) treeCount = 4;
    else if (desert > 0.2) treeCount = 8;
    else treeCount = 5;

    if (tundra > 0.3) { bushCount = 0; snowDriftCount = 12 + Math.floor(rng() * 12); }
    else if (desert > 0.2 || swamp > 0.2) bushCount = 8;
    else if (bio.mountain > 0.4) bushCount = 3;
    else if (badlands > 0.15) bushCount = 4;
    else if (canyon > 0.2) bushCount = 4;
    else bushCount = 5;

    if (canyon > 0.2) rockCount = 10;
    else if (badlands > 0.15) rockCount = 12;
    else if (bio.mountain > 0.4 || bio.mountain > 0.5) rockCount = 8;
    else if (tundra > 0.3) rockCount = 10;
    else rockCount = 3;

    const maxTreeHeight = 12 + bio.mountain * 25;

    for (let i = 0; i < treeCount; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > SEA_LEVEL + 0.5 && y < maxTreeHeight) {
        let ok = true;
        for (const tp of treePositions) {
          const dx = tp.x - x, dz = tp.z - z;
          if (dx * dx + dz * dz < 20) { ok = false; break; }
        }
        if (ok) {
          treePositions.push({ x, z });
          let tree;
          const rr = rng();
          if (forest > 0.3) {
            if (rr < 0.35) tree = createPineTree(rng);
            else if (rr < 0.55) tree = createOakTree(rng);
            else if (rr < 0.7) tree = createCherryTree(rng);
            else if (rr < 0.85) tree = createMushroomTree(rng);
            else tree = createCactus(rng);
          } else if (swamp > 0.2) {
            if (rr < 0.35) tree = createSwampTree(rng);
            else if (rr < 0.55) tree = createMushroomTree(rng);
            else if (rr < 0.7) tree = createDeadTree(rng);
            else if (rr < 0.85) tree = createOakTree(rng);
            else { tree = createPineTree(rng); tree.userData.baseScale = 0.4 + rng() * 0.3; }
          } else if (tundra > 0.3) {
            if (rr < 0.35) { tree = createPineTree(rng); tree.userData.baseScale = 0.3 + rng() * 0.3; }
            else if (rr < 0.6) tree = createDeadTree(rng);
            else if (rr < 0.75) tree = createOakTree(rng);
            else tree = createCactus(rng);
          } else if (desert > 0.2) {
            if (rr < 0.35) tree = createCactus(rng);
            else if (rr < 0.55) tree = createSaguaro(rng);
            else if (rr < 0.7) tree = createPalmTree(rng);
            else if (rr < 0.85) tree = createDeadTree(rng);
            else { tree = createPineTree(rng); tree.userData.baseScale = 0.4 + rng() * 0.3; }
          } else if (bio.mountain > 0.4) {
            if (rr < 0.35) { tree = createPineTree(rng); tree.userData.baseScale = 0.5 + rng() * 0.4; }
            else if (rr < 0.55) tree = createDeadTree(rng);
            else if (rr < 0.7) tree = createOakTree(rng);
            else if (rr < 0.85) tree = createCherryTree(rng);
            else tree = createCactus(rng);
          } else if (canyon > 0.2) {
            if (rr < 0.3) { tree = createDeadTree(rng); tree.userData.baseScale = 0.4 + rng() * 0.3; }
            else if (rr < 0.5) tree = createPalmTree(rng);
            else if (rr < 0.7) tree = createCactus(rng);
            else tree = createOakTree(rng);
          } else if (badlands > 0.15) {
            if (rr < 0.35) { tree = createCactus(rng); tree.userData.baseScale = 0.3 + rng() * 0.3; }
            else if (rr < 0.55) tree = createDeadTree(rng);
            else if (rr < 0.7) tree = createSaguaro(rng);
            else if (rr < 0.85) tree = createOakTree(rng);
            else { tree = createPineTree(rng); tree.userData.baseScale = 0.4 + rng() * 0.3; }
          } else {
            if (rr < 0.35) tree = createOakTree(rng);
            else if (rr < 0.6) tree = createCherryTree(rng);
            else if (rr < 0.75) tree = createPineTree(rng);
            else if (rr < 0.9) tree = createPalmTree(rng);
            else tree = createCactus(rng);
          }
          tree.position.set(x, y, z);
          const s = tree.userData.baseScale || 1.0 + rng() * 0.8;
          tree.scale.setScalar(s);
          tree.rotation.y = rng() * Math.PI * 2;
          this.group.add(tree);
        }
      }
    }

    for (let i = 0; i < bushCount; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > SEA_LEVEL + 0.3 && y < 6) {
        const isDry = desert > 0.2 || canyon > 0.2 || badlands > 0.15;
        const bush = createBush(rng, isDry, crystal > 0.3);
        bush.position.set(x, y, z);
        bush.scale.setScalar(0.4 + rng() * 0.9);
        this.group.add(bush);
      }
    }

    for (let i = 0; i < rockCount; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > SEA_LEVEL + 0.5 && y < 20) {
        const rock = createRock(rng, tundra > 0.3);
        rock.position.set(x, y, z);
        rock.scale.setScalar(0.3 + rng() * 0.8);
        this.group.add(rock);
      }
    }

    for (let i = 0; i < snowDriftCount; i++) {
      const x = ox + rng() * CHUNK_SIZE;
      const z = oz + rng() * CHUNK_SIZE;
      const y = getHeight(x, z);
      if (y > SEA_LEVEL + 0.3 && y < 12) {
        const drift = createSnowDrift(rng);
        drift.position.set(x, y, z);
        drift.scale.setScalar(0.4 + rng() * 0.8);
        drift.rotation.y = rng() * Math.PI * 2;
        this.group.add(drift);
      }
    }

    if (swamp > 0.2) {
      cattailCount = 6 + Math.floor(rng() * 6);
      for (let i = 0; i < cattailCount; i++) {
        const x = ox + rng() * CHUNK_SIZE;
        const z = oz + rng() * CHUNK_SIZE;
        const y = getHeight(x, z);
        if (y > SEA_LEVEL + 0.2 && y < 2) {
          const cattail = createCattail(rng);
          cattail.position.set(x, y, z);
          cattail.scale.setScalar(0.6 + rng() * 0.8);
          cattail.rotation.y = rng() * Math.PI * 2;
          this.group.add(cattail);
        }
      }
    }

    if (canyon > 0.2) {
      rockPillarCount = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < rockPillarCount; i++) {
        const x = ox + rng() * CHUNK_SIZE;
        const z = oz + rng() * CHUNK_SIZE;
        const y = getHeight(x, z);
        if (y > SEA_LEVEL + 0.5 && y < 15) {
          const pillar = createRockPillar(rng);
          pillar.position.set(x, y, z);
          pillar.scale.setScalar(0.5 + rng() * 0.8);
          pillar.rotation.y = rng() * Math.PI * 2;
          this.group.add(pillar);
        }
      }
    }

    if (badlands > 0.15) {
      dryScrubCount = 4 + Math.floor(rng() * 5);
      for (let i = 0; i < dryScrubCount; i++) {
        const x = ox + rng() * CHUNK_SIZE;
        const z = oz + rng() * CHUNK_SIZE;
        const y = getHeight(x, z);
        if (y > SEA_LEVEL + 0.3 && y < 8) {
          const scrub = createDryScrub(rng);
          scrub.position.set(x, y, z);
          scrub.scale.setScalar(0.4 + rng() * 0.8);
          scrub.rotation.y = rng() * Math.PI * 2;
          this.group.add(scrub);
        }
      }
    }

    if (crystal > 0.2) {
      for (let i = 0; i < 6 + Math.floor(rng() * 6); i++) {
        const x = ox + rng() * CHUNK_SIZE;
        const z = oz + rng() * CHUNK_SIZE;
        const y = getHeight(x, z);
        if (y > SEA_LEVEL + 0.5) {
          const spire = createCrystalSpire(rng);
          spire.position.set(x, y, z);
          spire.scale.setScalar(0.5 + rng() * 1.2);
          spire.rotation.y = rng() * Math.PI * 2;
          this.group.add(spire);
        }
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

function mountainHeight(mountain, maxExtra) {
  return 2 + mountain * maxExtra;
}

function getTerrainColor(x, y, z, getBiomeInfo) {
  const bio = getBiomeInfo(x, z);
  const { continent, temp, moist, magic, land, mountain } = bio;

  const desert = smoothstep(temp, 0.15, 0.45) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain * 0.4);
  const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain * 0.3);
  const tundra = (1 - smoothstep(temp, -0.35, 0)) * (1 - mountain);
  const swamp = smoothstep(-moist, 0, 0.3) * (1 - mountain) * land;
  const crystal = smoothstep(magic, 0.45, 0.7) * land;
  const canyon = smoothstep(temp, -0.1, 0.2) * smoothstep(-moist, -0.3, 0.05) * (1 - smoothstep(continent, 0.3, 0.5)) * (1 - mountain) * land;
  const badlands = smoothstep(temp, 0.08, 0.35) * (1 - smoothstep(moist, -0.3, 0.05)) * Math.max(0, mountain - 0.15) * 1.5;

  if (y < SEA_LEVEL) {
    const depth = Math.min(1, (SEA_LEVEL - y) / 8);
    return { r: 0.05 + depth * 0.15, g: 0.18 + depth * 0.2, b: 0.3 + depth * 0.3 };
  }

  if (crystal > 0.3 && y > 0.5) {
    const hue = (Math.sin(x * 0.02 + z * 0.02) * 0.5 + 0.5) * 0.3 + 0.7;
    return hslToRgb(hue, 0.7, 0.35 + (y % 2) * 0.2);
  }

  if (canyon > 0.2) {
    const depth = Math.max(0, Math.min(1, (y + 3) / 10));
    const light = { r: 0.65, g: 0.35, b: 0.15 };
    const dark = { r: 0.30, g: 0.15, b: 0.08 };
    return lerpColor(light, dark, depth);
  }

  if (desert > 0.2) {
    const dune = Math.sin(x * 0.03 + z * 0.02) * 0.5 + 0.5;
    return { r: 0.65 + dune * 0.25, g: 0.45 + dune * 0.2, b: 0.15 + dune * 0.1 };
  }

  if (swamp > 0.3) return { r: 0.2, g: 0.3, b: 0.1 };

  if (tundra > 0.3) {
    const pat = Math.sin(x * 0.02) * Math.sin(z * 0.02) * 0.5 + 0.5;
    return { r: 0.75 + pat * 0.15, g: 0.74 + pat * 0.15, b: 0.82 + pat * 0.12 };
  }

  if (badlands > 0.15) {
    const pat = Math.sin(x * 0.05 + z * 0.03) * 0.5 + 0.5;
    return { r: 0.55 + pat * 0.25, g: 0.25 + pat * 0.15, b: 0.1 + pat * 0.08 };
  }

  if (y < 2) {
    if (forest > 0.3) return { r: 0.18, g: 0.38, b: 0.1 };
    return { r: 0.3, g: 0.5, b: 0.16 };
  }
  if (y < 6) {
    const t = (y - 2) / 4;
    const low = forest > 0.3 ? { r: 0.18, g: 0.38, b: 0.1 } : { r: 0.3, g: 0.5, b: 0.16 };
    return lerpColor(low, { r: 0.4, g: 0.48, b: 0.25 }, t);
  }
  if (y < 12) {
    const t = (y - 6) / 6;
    return lerpColor({ r: 0.4, g: 0.48, b: 0.25 }, { r: 0.48, g: 0.46, b: 0.35 }, t);
  }
  if (y < 24) {
    const t = (y - 12) / 12;
    return lerpColor({ r: 0.48, g: 0.46, b: 0.35 }, { r: 0.50, g: 0.44, b: 0.42 }, t);
  }
  if (y < 40) {
    const t = (y - 24) / 16;
    return lerpColor({ r: 0.50, g: 0.44, b: 0.42 }, { r: 0.55, g: 0.52, b: 0.55 }, t);
  }
  const snowPat = Math.sin(x * 0.04) * Math.sin(z * 0.04) * 0.5 + 0.5;
  return { r: 0.65 + snowPat * 0.3, g: 0.65 + snowPat * 0.3, b: 0.75 + snowPat * 0.2 };
}

function lerpColor(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

function hslToRgb(h, s, l) {
  h = h % 1;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 1 / 6) { r = c; g = x; b = 0; }
  else if (h < 2 / 6) { r = x; g = c; b = 0; }
  else if (h < 3 / 6) { r = 0; g = c; b = x; }
  else if (h < 4 / 6) { r = 0; g = x; b = c; }
  else if (h < 5 / 6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: r + m, g: g + m, b: b + m };
}

function createPineTree(rng) {
  const g = new THREE.Group();
  const h = 8 + rng() * 10;
  const trunkH = h * 0.25;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C3317, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  const layers = 3 + Math.floor(rng() * 3);
  const greens = [
    new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.8, flatShading: true }),
  ];

  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const radius = (1 + rng() * 0.6) * (1 - t * 0.3);
    const lh = (1.2 + rng() * 0.4) * h * 0.2;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, lh, 7), greens[i % 3]);
    cone.position.y = trunkH + i * (h * 0.15) + lh / 2;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

function createOakTree(rng) {
  const g = new THREE.Group();
  const trunkH = 4 + rng() * 4;
  const canopyR = 3 + rng() * 3;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B3A1F, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.25 + rng() * 0.08, 0.45, 0.22 + rng() * 0.1),
    roughness: 0.8,
    flatShading: true,
  });

  const main = new THREE.Mesh(new THREE.SphereGeometry(canopyR, 7, 7), canopyMat);
  main.position.y = trunkH + canopyR * 0.6;
  main.castShadow = true;
  g.add(main);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng() * 0.3;
    const d = canopyR * 0.5;
    const sub = new THREE.Mesh(
      new THREE.SphereGeometry(canopyR * (0.5 + rng() * 0.4), 6, 6),
      canopyMat
    );
    sub.position.set(Math.cos(a) * d, trunkH + canopyR * 0.4 + rng() * 0.5, Math.sin(a) * d);
    sub.castShadow = true;
    g.add(sub);
  }
  return g;
}

function createSwampTree(rng) {
  const g = new THREE.Group();
  const h = 6 + rng() * 6;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, h * 0.5, 6), trunkMat);
  trunk.position.y = h * 0.25;
  g.add(trunk);

  const capMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.8, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.8, flatShading: true });

  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2 + rng() * 0.6, 6, 6), capMat);
  cap.position.y = h * 0.5 + 0.6;
  cap.castShadow = true;
  g.add(cap);

  for (let i = 0; i < 3; i++) {
    const a = rng() * Math.PI * 2;
    const d = 0.6 + rng() * 0.6;
    const sub = new THREE.Mesh(new THREE.SphereGeometry(0.4 + rng() * 0.4, 5, 5), darkMat);
    sub.position.set(Math.cos(a) * d, h * 0.5 + rng() * 0.4, Math.sin(a) * d);
    g.add(sub);
  }
  return g;
}

function createCactus(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8, flatShading: true });
  const h = 3 + rng() * 5;
  const main = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.25, h, 6), mat);
  main.position.y = h / 2;
  main.castShadow = true;
  g.add(main);
  if (rng() > 0.4) {
    const armH = 1 + rng() * 2;
    const side = rng() > 0.5 ? 1 : -1;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, armH, 6), mat);
    arm.position.set(side * 0.3, h * 0.5, 0);
    arm.rotation.z = side * 0.3;
    arm.castShadow = true;
    g.add(arm);
  }
  return g;
}

function createPalmTree(rng) {
  const g = new THREE.Group();
  const h = 5 + rng() * 5;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B6B3A, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, h, 6), trunkMat);
  trunk.position.y = h / 2;
  trunk.rotation.z = (rng() - 0.5) * 0.15;
  trunk.castShadow = true;
  g.add(trunk);

  const frondMat = new THREE.MeshStandardMaterial({ color: 0x2A6B2A, roughness: 0.7, flatShading: true });
  const fronds = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + rng() * 0.2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.8 + rng() * 0.4, 4), frondMat);
    frond.position.set(Math.cos(a) * 0.15, h, Math.sin(a) * 0.15);
    frond.rotation.x = Math.cos(a) * 0.6;
    frond.rotation.z = -Math.sin(a) * 0.6;
    g.add(frond);
  }
  return g;
}

function createDeadTree(rng) {
  const g = new THREE.Group();
  const h = 4 + rng() * 5;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h, 5), trunkMat);
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const branchMat = new THREE.MeshStandardMaterial({ color: 0x2A1A0A, roughness: 0.95 });
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) {
    const a = rng() * Math.PI * 2;
    const bh = 0.4 + rng() * 1.0;
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, bh, 3), branchMat);
    branch.position.set(Math.cos(a) * 0.15, h * (0.3 + rng() * 0.5), Math.sin(a) * 0.15);
    branch.rotation.z = Math.cos(a) * 0.5;
    branch.rotation.x = Math.sin(a) * 0.5;
    g.add(branch);
  }
  return g;
}

function createCherryTree(rng) {
  const g = new THREE.Group();
  const trunkH = 3 + rng() * 3;
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1A, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, trunkH, 6), trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  g.add(trunk);

  const canopyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.92, 0.5, 0.5 + rng() * 0.15),
    roughness: 0.7,
    flatShading: true,
  });
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(2 + rng() * 1.5, 7, 7), canopyMat);
  canopy.position.y = trunkH + 1.5;
  canopy.castShadow = true;
  g.add(canopy);

  const subMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.92, 0.4, 0.45 + rng() * 0.1),
    roughness: 0.7,
    flatShading: true,
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng() * 0.3;
    const sub = new THREE.Mesh(new THREE.SphereGeometry(0.8 + rng() * 0.5, 6, 6), subMat);
    sub.position.set(Math.cos(a) * 1.2, trunkH + 0.5 + rng() * 0.8, Math.sin(a) * 1.2);
    g.add(sub);
  }
  return g;
}

function createSaguaro(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x2A6B2A, roughness: 0.8, flatShading: true });
  const h = 4 + rng() * 6;
  const main = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 6), mat);
  main.position.y = h / 2;
  main.castShadow = true;
  g.add(main);

  const arms = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < arms; i++) {
    const side = i === 0 ? 1 : -1;
    const ah = 1.5 + rng() * 2.5;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, ah, 5), mat);
    arm.position.set(side * 0.3, h * 0.5, (rng() - 0.5) * 0.3);
    arm.rotation.z = side * 0.4;
    arm.castShadow = true;
    g.add(arm);
  }
  return g;
}

function createMushroomTree(rng) {
  const g = new THREE.Group();
  const h = 2 + rng() * 3;
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.8 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 6), stemMat);
  stem.position.y = h / 2;
  g.add(stem);

  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(rng() * 0.1 + 0.05, 0.6, 0.3 + rng() * 0.2),
    roughness: 0.7,
    flatShading: true,
  });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.8 + rng() * 0.6, 6, 6), capMat);
  cap.scale.set(1, 0.5, 1);
  cap.position.y = h + 0.2;
  cap.castShadow = true;
  g.add(cap);

  const dotMat = new THREE.MeshStandardMaterial({ color: 0xE8E8D0, roughness: 0.7 });
  for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * 0.5;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), dotMat);
    dot.position.set(Math.cos(a) * d, h + 0.3 + rng() * 0.3, Math.sin(a) * d);
    g.add(dot);
  }
  return g;
}

function createCrystalSpire(rng) {
  const g = new THREE.Group();
  const hue = rng();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue * 0.3 + 0.6, 0.8, 0.4 + rng() * 0.3),
    roughness: 0.2,
    metalness: 0.6,
    emissive: new THREE.Color().setHSL(hue * 0.3 + 0.6, 0.6, 0.1),
    emissiveIntensity: 0.3,
    flatShading: true,
  });
  const h = 2 + rng() * 6;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.2 + rng() * 0.3, h, 5), mat);
  spire.position.y = h / 2;
  spire.castShadow = true;
  g.add(spire);
  return g;
}

function createBush(rng, isDry, isCrystal) {
  const g = new THREE.Group();
  let mat;
  if (isCrystal) {
    const hue = rng() * 0.3 + 0.7;
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.3 + rng() * 0.2),
      roughness: 0.3,
      metalness: 0.4,
      emissive: new THREE.Color().setHSL(hue, 0.5, 0.05),
      flatShading: true,
    });
  } else if (isDry) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08 + rng() * 0.05, 0.3, 0.3 + rng() * 0.15),
      roughness: 0.8,
      flatShading: true,
    });
  } else {
    const hue = 0.22 + rng() * 0.12;
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.45, 0.18 + rng() * 0.15),
      roughness: 0.8,
      flatShading: true,
    });
  }
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const size = 0.25 + rng() * 0.35;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), mat);
    sphere.position.set((rng() - 0.5) * 0.8, rng() * 0.4 - size * 0.2, (rng() - 0.5) * 0.8);
    g.add(sphere);
  }
  return g;
}

function createRock(rng, isTundra = false) {
  const scale = 0.4 + rng() * 0.7;
  const geo = new THREE.DodecahedronGeometry(scale);
  const lightness = isTundra ? 0.65 + rng() * 0.25 : 0.3 + rng() * 0.25;
  const hue = isTundra ? 0.6 : 0;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, isTundra ? 0.1 : 0, lightness),
    roughness: isTundra ? 0.4 : 0.9,
    metalness: isTundra ? 0.2 : 0,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
  return mesh;
}

function createCattail(rng) {
  const g = new THREE.Group();
  const matStem = new THREE.MeshStandardMaterial({ color: 0x3A6B2A, roughness: 0.8 });
  const matHead = new THREE.MeshStandardMaterial({ color: 0x6B3A1A, roughness: 0.9 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.2, 4), matStem);
  stem.position.y = 0.6;
  g.add(stem);

  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25, 5), matHead);
  head.position.y = 1.25;
  g.add(head);

  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.5, 4), matStem);
  leaf.position.set(0.04, 0.8, 0);
  leaf.rotation.z = 0.3;
  g.add(leaf);

  const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.5, 4), matStem);
  leaf2.position.set(-0.04, 0.8, 0);
  leaf2.rotation.z = -0.3;
  g.add(leaf2);

  return g;
}

function createRockPillar(rng) {
  const h = 1.5 + rng() * 3;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.08, 0.15, 0.35 + rng() * 0.2),
    roughness: 0.9,
    flatShading: true,
  });
  const geo = new THREE.CylinderGeometry(0.2 + rng() * 0.2, 0.35 + rng() * 0.3, h, 6);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  return mesh;
}

function createDryScrub(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.08 + rng() * 0.05, 0.2, 0.25 + rng() * 0.1),
    roughness: 0.9,
    flatShading: true,
  });
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const size = 0.2 + rng() * 0.3;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 5, 5), mat);
    sphere.position.set((rng() - 0.5) * 0.6, rng() * 0.3, (rng() - 0.5) * 0.6);
    sphere.scale.y = 0.6 + rng() * 0.3;
    g.add(sphere);
  }
  return g;
}

function createSnowDrift(rng) {
  const scale = 0.3 + rng() * 0.7;
  const geo = new THREE.SphereGeometry(scale, 7, 5);
  geo.scale(1, 0.2 + rng() * 0.2, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.6, 0.05, 0.82 + rng() * 0.12),
    roughness: 0.6,
    metalness: 0,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}
