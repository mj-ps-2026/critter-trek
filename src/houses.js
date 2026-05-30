import * as THREE from 'three';
import { Wolf } from './wolf.js';

const LOOT_TABLE = [
  { type: 'stick', weight: 20, count: [2, 5] },
  { type: 'rock', weight: 15, count: [1, 3] },
  { type: 'herb', weight: 12, count: [1, 3] },
  { type: 'berry', weight: 10, count: [2, 4] },
  { type: 'bone', weight: 8, count: [1, 2] },
  { type: 'feather', weight: 6, count: [1, 2] },
  { type: 'mushroom', weight: 5, count: [1, 1] },
  { type: 'sharpstick', weight: 4, count: [1, 2] },
  { type: 'cactusneedle', weight: 3, count: [1, 1] },
  { type: 'jellyfisharm', weight: 2, count: [1, 1] },
  { type: 'starfisharm', weight: 1, count: [1, 1] },
];

const LEGENDARY_LOOT_TABLE = [
  { type: 'animalpickaxe', weight: 15, count: [1, 2] },
  { type: 'animalsword', weight: 15, count: [1, 2] },
  { type: 'animaltrident', weight: 12, count: [1, 1] },
  { type: 'bone', weight: 20, count: [5, 15] },
  { type: 'sharpstick', weight: 18, count: [5, 10] },
  { type: 'rock', weight: 15, count: [10, 20] },
  { type: 'mushroom', weight: 12, count: [3, 8] },
  { type: 'herb', weight: 10, count: [5, 12] },
  { type: 'berry', weight: 10, count: [5, 15] },
  { type: 'jellyfisharm', weight: 8, count: [2, 6] },
  { type: 'starfisharm', weight: 8, count: [2, 5] },
  { type: 'cactusneedle', weight: 8, count: [3, 8] },
  { type: 'feather', weight: 10, count: [4, 10] },
];

const MANSION_LOOT_TABLE = [
  { type: 'bone', weight: 20, count: [3, 8] },
  { type: 'sharpstick', weight: 18, count: [2, 5] },
  { type: 'rock', weight: 15, count: [5, 10] },
  { type: 'mushroom', weight: 12, count: [2, 4] },
  { type: 'herb', weight: 10, count: [3, 6] },
  { type: 'berry', weight: 10, count: [4, 8] },
  { type: 'animalsword', weight: 8, count: [1, 1] },
  { type: 'animalpickaxe', weight: 6, count: [1, 1] },
  { type: 'animaltrident', weight: 4, count: [1, 1] },
  { type: 'jellyfisharm', weight: 5, count: [2, 4] },
  { type: 'starfisharm', weight: 4, count: [1, 3] },
  { type: 'cactusneedle', weight: 6, count: [2, 5] },
  { type: 'feather', weight: 8, count: [3, 6] },
];

const HOUSE_PRICES = {
  normal: [{ type: 'sharpstick', count: 5 }],
  mansion: [{ type: 'animalsword', count: 3 }],
};

const PASSIVE_RESOURCES = [
  { type: 'stick', chance: 0.3 },
  { type: 'rock', chance: 0.2 },
  { type: 'herb', chance: 0.15 },
  { type: 'berry', chance: 0.15 },
  { type: 'bone', chance: 0.1 },
  { type: 'sharpstick', chance: 0.05 },
  { type: 'feather', chance: 0.05 },
];

const MANSION_PASSIVE_RESOURCES = [
  { type: 'bone', chance: 0.25 },
  { type: 'sharpstick', chance: 0.2 },
  { type: 'rock', chance: 0.15 },
  { type: 'herb', chance: 0.1 },
  { type: 'berry', chance: 0.1 },
  { type: 'mushroom', chance: 0.08 },
  { type: 'feather', chance: 0.07 },
  { type: 'cactusneedle', chance: 0.03 },
  { type: 'jellyfisharm', chance: 0.01 },
  { type: 'starfisharm', chance: 0.01 },
];

const WALL_LOOT = [
  { type: 'stick', weight: 20, count: [1, 3] },
  { type: 'rock', weight: 20, count: [1, 2] },
  { type: 'bone', weight: 15, count: [1, 2] },
  { type: 'sharpstick', weight: 10, count: [1, 1] },
  { type: 'feather', weight: 8, count: [1, 2] },
  { type: 'starfisharm', weight: 3, count: [1, 1] },
];

const MANSION_WALL_LOOT = [
  { type: 'bone', weight: 25, count: [2, 4] },
  { type: 'rock', weight: 20, count: [2, 5] },
  { type: 'sharpstick', weight: 15, count: [1, 3] },
  { type: 'mushroom', weight: 12, count: [1, 2] },
  { type: 'animalsword', weight: 5, count: [1, 1] },
  { type: 'animalpickaxe', weight: 3, count: [1, 1] },
  { type: 'jellyfisharm', weight: 5, count: [1, 2] },
  { type: 'starfisharm', weight: 3, count: [1, 2] },
];

function weightedPick(pool, rng) {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const entry of pool) {
    r -= entry.weight;
    if (r <= 0) return entry;
  }
  return pool[pool.length - 1];
}

const woodMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
const darkMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 });

const WOOD_LIGHT = 0x8B6914;
const WOOD_DARK = 0x5C3D1A;
const WOOD_AGED = 0x6B5A3A;
const ROOF_THATCH = 0x7A5A3A;
const WEB_COLOR = 0xCCCCCC;

export class House {
  constructor(cx, cz, posX, posZ, rng, isMansion) {
    this.cx = cx;
    this.cz = cz;
    this.worldX = posX;
    this.worldZ = posZ;
    this.rng = rng;
    this.group = new THREE.Group();
    this.lootSpawned = false;
    this.guardianAlive = false;
    this.guardian = null;
    this.lootContainer = null;
    this.cleared = false;
    this.entered = false;
    this.isMansion = !!isMansion;
    this.walls = [];
    this.roofs = [];
    this.interiorCeiling = null;
    this.interiorView = false;
    this.owned = false;
    this.resourceTimer = 0;
    this.resourceInterval = 8;
    this.legendary = false;
    this.chests = null;

    const y = 0;
    this.group.position.set(posX, y, posZ);
    if (this.isMansion) this.#buildMansion(rng);
    else this.#build(rng);
  }

  #addWall(mesh) {
    this.group.add(mesh);
    this.walls.push(mesh);
  }

  #addRoof(mesh) {
    this.group.add(mesh);
    this.roofs.push(mesh);
  }

  makeLegendary() {
    this.legendary = true;
    this.isMansion = true;

    // Clear existing build meshes (walls/roofs from #build)
    const toRemove = [];
    this.group.traverse(child => {
      if (child.isMesh && child !== this.lootContainer) toRemove.push(child);
    });
    for (const child of toRemove) {
      this.group.remove(child);
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
    this.walls = [];
    this.roofs = [];
    this.lootContainer = null;

    // Build 3-section legendary mansion
    const sectionW = 2.0;
    const D = 3.0;
    const H = 2.0;
    const gap = 0.15;
    const wallThick = 0.08;
    const roofPitch = 0.6;
    const rng = this.rng;

    const woodLight = woodMat(0x9A7A4A);
    const woodDark = woodMat(0x5C3D1A);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8A7A6A, roughness: 0.9 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4A3A2A, roughness: 0.7, metalness: 0.2 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x6A4A2A, roughness: 0.95 });
    const roofTrimMat = new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.8, metalness: 0.1 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x88CCFF, emissive: 0x4488AA, emissiveIntensity: 0.1 });

    // 3 sections: left, center, right
    const sections = [
      { ox: -(sectionW + gap), oz: 0, label: 'left' },
      { ox: 0, oz: 0, label: 'center' },
      { ox: (sectionW + gap), oz: 0, label: 'right' },
    ];

    for (const sec of sections) {
      // Floor
      const floor = new THREE.Mesh(new THREE.BoxGeometry(sectionW, wallThick, D), woodLight);
      floor.position.set(sec.ox, wallThick / 2, sec.oz);
      floor.castShadow = true;
      floor.receiveShadow = true;
      this.group.add(floor);

      // Back wall
      const back = new THREE.Mesh(new THREE.BoxGeometry(sectionW, H, wallThick), woodDark);
      back.position.set(sec.ox, H / 2, sec.oz - D / 2);
      back.castShadow = true;
      this.#addWall(back);

      // Side walls
      for (const s of [-1, 1]) {
        if (sec.label === 'center' || (sec.label === 'left' && s === 1) || (sec.label === 'right' && s === -1)) {
          const side = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), woodLight);
          side.position.set(sec.ox + s * sectionW / 2, H / 2, sec.oz);
          side.castShadow = true;
          this.#addWall(side);
        }
      }

      // Front wall (with door gap for center)
      if (sec.label === 'center') {
        for (const s of [-1, 1]) {
          const plank = new THREE.Mesh(new THREE.BoxGeometry(sectionW * 0.3, H, wallThick), woodDark);
          plank.position.set(sec.ox + s * sectionW * 0.28, H / 2, sec.oz + D / 2);
          plank.castShadow = true;
          this.#addWall(plank);
        }
        const topPlank = new THREE.Mesh(new THREE.BoxGeometry(sectionW * 0.45, 0.12, wallThick), woodLight);
        topPlank.position.set(sec.ox, H - 0.06, sec.oz + D / 2);
        topPlank.castShadow = true;
        this.#addWall(topPlank);
        // Door arch
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x4A2F1A, roughness: 0.95 });
        for (const s of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.65, 0.06), doorMat);
          post.position.set(sec.ox + s * 0.22, H * 0.325, sec.oz + D / 2 + 0.02);
          this.group.add(post);
        }
      } else {
        const front = new THREE.Mesh(new THREE.BoxGeometry(sectionW, H, wallThick), woodLight);
        front.position.set(sec.ox, H / 2, sec.oz + D / 2);
        front.castShadow = true;
        this.#addWall(front);
      }

      // Windows on side walls
      for (const s of [-1, 1]) {
        if (sec.label === 'left' && s === -1) continue;
        if (sec.label === 'right' && s === 1) continue;
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.03), windowMat);
        win.position.set(sec.ox + s * sectionW * 0.25, H * 0.6, sec.oz);
        this.group.add(win);
        const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.17, 0.03), trimMat);
        cross1.position.set(sec.ox + s * sectionW * 0.25, H * 0.6, sec.oz);
        this.group.add(cross1);
        const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.03), trimMat);
        cross2.position.set(sec.ox + s * sectionW * 0.25, H * 0.6, sec.oz);
        this.group.add(cross2);
      }

      // Roof
      for (const rs of [-1, 1]) {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(sectionW + 0.2, wallThick, D * 0.5), roofMat);
        const angle = Math.atan2(roofPitch, D * 0.5);
        roof.position.set(sec.ox, H + roofPitch * 0.35, sec.oz + rs * D * 0.17);
        roof.rotation.x = rs * angle;
        roof.castShadow = true;
        this.#addRoof(roof);
      }
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(sectionW + 0.2, 0.08, 0.08), roofTrimMat);
      ridge.position.set(sec.ox, H + roofPitch, sec.oz);
      this.#addRoof(ridge);
    }

    // Connecting passages (trim between sections)
    for (const ox of [-(sectionW + gap) / 2, (sectionW + gap) / 2]) {
      const connector = new THREE.Mesh(new THREE.BoxGeometry(gap + 0.1, H * 0.5, 0.3), stoneMat);
      connector.position.set(ox, H * 0.25, 0);
      this.group.add(connector);
    }

    // Stone foundation
    for (let sx = -1; sx <= 1; sx++) {
      for (let sz = -1; sz <= 1; sz++) {
        if (sz === 1 && Math.abs(sx) < 0.5) continue;
        const stone = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), stoneMat);
        stone.position.set(sx * (sectionW + gap * 1.2), 0.02, sz * D * 0.42);
        stone.scale.set(1, 0.4, 1);
        this.group.add(stone);
      }
    }

    // 3 loot chests (one per section)
    this.chests = [];
    for (const sec of sections) {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x8A6A3A, roughness: 0.85 }));
      chest.position.set(sec.ox, wallThick + 0.06, sec.oz - D * 0.08);
      chest.userData.isHouseLoot = true;
      chest.userData.house = this;
      this.group.add(chest);
      this.chests.push(chest);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), new THREE.MeshStandardMaterial({ color: 0x6A4A2A, roughness: 0.8 }));
      lid.position.set(sec.ox, wallThick + 0.14, sec.oz - D * 0.08);
      this.group.add(lid);
    }
    this.lootContainer = this.chests[1]; // center chest is primary

    // Interior ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x3A2A1A, roughness: 0.95, side: THREE.DoubleSide,
      transparent: true, opacity: 1,
    });
    this.interiorCeiling = new THREE.Mesh(new THREE.PlaneGeometry(7.5, D * 0.95), ceilingMat);
    this.interiorCeiling.position.set(0, H * 0.98, 0);
    this.interiorCeiling.rotation.x = -Math.PI / 2;
    this.interiorCeiling.visible = false;
    this.group.add(this.interiorCeiling);
  }

  setInteriorView(enabled) {
    this.interiorView = enabled;
    const opacity = enabled ? 0.12 : 1;

    for (const wall of this.walls) {
      if (wall.material) {
        const mats = Array.isArray(wall.material) ? wall.material : [wall.material];
        for (const m of mats) {
          m.transparent = true;
          m.opacity = opacity;
          m.depthWrite = !enabled;
          m.needsUpdate = true;
        }
      }
    }

    for (const roof of this.roofs) {
      roof.visible = !enabled;
    }

    if (this.interiorCeiling) {
      this.interiorCeiling.visible = enabled;
    }
  }

  getBounds() {
    if (this.legendary) {
      return {
        minX: this.worldX - 3.5,
        maxX: this.worldX + 3.5,
        minZ: this.worldZ - 2,
        maxZ: this.worldZ + 2,
        minY: -0.5,
        maxY: 3.5,
      };
    }
    const W = this.isMansion ? 4.5 : 2.5;
    const H = this.isMansion ? 2.8 : 1.6;
    const D = W;
    const halfW = W / 2;
    const halfD = D / 2;
    return {
      minX: this.worldX - halfW,
      maxX: this.worldX + halfW,
      minZ: this.worldZ - halfD,
      maxZ: this.worldZ + halfD,
      minY: -0.5,
      maxY: H + 1.5,
    };
  }

  isPlayerInside(pos) {
    const b = this.getBounds();
    return pos.x >= b.minX && pos.x <= b.maxX &&
           pos.z >= b.minZ && pos.z <= b.maxZ &&
           pos.y >= b.minY && pos.y <= b.maxY;
  }

  isNearChest(pos) {
    const cPos = new THREE.Vector3();
    if (this.legendary && this.chests) {
      for (const chest of this.chests) {
        chest.getWorldPosition(cPos);
        if (pos.distanceTo(cPos) < 1.2) return true;
      }
      return false;
    }
    if (this.lootContainer) {
      this.lootContainer.getWorldPosition(cPos);
      return pos.distanceTo(cPos) < 1.2;
    }
    return false;
  }

  openChest() {
    const items = this.generateLoot();
    this.chestLoot = items;
    return items;
  }

  hasChestLoot() {
    return this.chestLoot && this.chestLoot.length > 0;
  }

  collectChestLoot(itemManager) {
    const items = this.chestLoot || [];
    this.chestLoot = [];
    for (const it of items) {
      if (itemManager) itemManager.addItem(it.type, it.count);
    }
    if (this.legendary && this.chests) {
      for (const chest of this.chests) chest.visible = false;
    }
    if (this.lootContainer) this.lootContainer.visible = false;
    return items;
  }

  #build(rng) {
    const W = 2.5;
    const D = 2.5;
    const H = 1.6;
    const roofPitch = 0.8;
    const wallThick = 0.08;
    const r = () => (rng() - 0.5) * 2;

    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, wallThick, D), woodMat(WOOD_AGED));
    floor.position.y = wallThick / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;
    this.group.add(floor);

    const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, wallThick), woodMat(WOOD_LIGHT));
    back.position.set(0, H / 2, -D / 2);
    this.#addWall(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), woodMat(WOOD_DARK));
    left.position.set(-W / 2, H / 2, 0);
    this.#addWall(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(wallThick, H, D), woodMat(WOOD_DARK));
    right.position.set(W / 2, H / 2, 0);
    this.#addWall(right);

    for (const side of [-1, 1]) {
      const plankW = W * 0.35;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(plankW, H, wallThick), woodMat(WOOD_LIGHT));
      plank.position.set(side * (W * 0.32), H / 2, D / 2);
      this.#addWall(plank);
    }
    const topPlank = new THREE.Mesh(new THREE.BoxGeometry(W * 0.45, 0.12, wallThick), woodMat(WOOD_DARK));
    topPlank.position.set(0, H - 0.06, D / 2);
    this.#addWall(topPlank);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x4A2F1A, roughness: 0.95 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.65, 0.06), doorMat);
      post.position.set(s * 0.28, H * 0.325, D / 2 + 0.02);
      this.group.add(post);
    }

    const roofMat = new THREE.MeshStandardMaterial({ color: ROOF_THATCH, roughness: 0.95 });
    for (const s of [-1, 1]) {
      const roofGeo = new THREE.BoxGeometry(W + 0.3, wallThick, 1.1);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      const angle = Math.atan2(roofPitch, D * 0.55);
      roof.position.set(0, H + roofPitch * 0.4, s * D * 0.15);
      roof.rotation.x = s * angle;
      roof.castShadow = true;
      this.#addRoof(roof);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.08, 0.08), woodMat(WOOD_DARK));
    ridge.position.set(0, H + roofPitch, 0);
    this.#addRoof(ridge);

    for (const [wx, wz] of [[-W * 0.25, -D * 0.25], [W * 0.25, -D * 0.25], [-W * 0.25, D * 0.35], [W * 0.25, D * 0.35]]) {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.9 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.04), frameMat);
      frame.position.set(wx, H * 0.55, wz);
      if (Math.abs(wz) > 0.3) frame.position.z += 0.02;
      this.group.add(frame);
      const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.04), darkMat(0x2A1A0A));
      cross1.position.set(wx, H * 0.55, wz + (Math.abs(wz) > 0.3 ? 0.03 : 0));
      this.group.add(cross1);
      const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.04), darkMat(0x2A1A0A));
      cross2.position.set(wx, H * 0.55, wz + (Math.abs(wz) > 0.3 ? 0.03 : 0));
      this.group.add(cross2);
    }

    const webMat = new THREE.MeshStandardMaterial({ color: WEB_COLOR, transparent: true, opacity: 0.2, roughness: 0.5, side: THREE.DoubleSide });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (sz === 1 && Math.abs(sx) < 0.5) continue;
      const web = new THREE.Mesh(new THREE.CircleGeometry(0.2 + rng() * 0.15, 5), webMat);
      web.position.set(sx * W * 0.42, H * 0.4 + rng() * 0.3, sz * D * 0.42);
      web.lookAt(0, H * 0.3, 0);
      web.scale.set(1, 1 + rng() * 0.3, 1);
      this.group.add(web);
      const strandMat = new THREE.MeshStandardMaterial({ color: WEB_COLOR, transparent: true, opacity: 0.15 });
      for (let i = 0; i < 3; i++) {
        const strand = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.01, 0.25 + rng() * 0.15), strandMat);
        strand.position.set(sx * W * 0.42 + r() * 0.1, H * 0.3 + r() * 0.2, sz * D * 0.42 + r() * 0.1);
        strand.rotation.z = r() * 0.5;
        strand.rotation.x = r() * 0.5;
        this.group.add(strand);
      }
    }

    const crackMat = new THREE.MeshStandardMaterial({ color: 0x1A0A00, roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04 + rng() * 0.08, 0.015), crackMat);
      crack.position.set(r() * W * 0.35, 0.2 + rng() * H * 0.5, -D / 2 + 0.01);
      crack.rotation.z = r() * 0.4;
      this.group.add(crack);
    }

    // Loot chest
    this.lootContainer = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x8A6A3A, roughness: 0.85 }));
    this.lootContainer.position.set(0, wallThick + 0.06, -D * 0.1);
    this.lootContainer.userData.isHouseLoot = true;
    this.lootContainer.userData.house = this;
    this.group.add(this.lootContainer);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), new THREE.MeshStandardMaterial({ color: 0x6A4A2A, roughness: 0.8 }));
    lid.position.set(0, wallThick + 0.14, -D * 0.1);
    lid.userData.isHouseLoot = true;
    this.group.add(lid);

    // Glow
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xFFEE88, emissive: 0xFFDD44, emissiveIntensity: 0.1, transparent: true, opacity: 0.15 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), glowMat);
    glow.position.set(0, H * 0.35, D / 2 + 0.01);
    glow.rotation.y = Math.PI;
    this.group.add(glow);

    // Foundation stones
    const foundMat = new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.95 });
    for (const [fx, fz] of [[-W * 0.45, -D * 0.45], [W * 0.45, -D * 0.45], [-W * 0.45, D * 0.45], [W * 0.45, D * 0.45]]) {
      const stone = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rng() * 0.04, 4, 4), foundMat);
      stone.position.set(fx, 0.02, fz);
      stone.scale.set(1, 0.5, 1);
      this.group.add(stone);
    }

    // Interior ceiling (blocks sky when in interior view)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x3A2A1A,
      roughness: 0.95,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
    this.interiorCeiling = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.95, D * 0.95), ceilingMat);
    this.interiorCeiling.position.set(0, H * 0.98, 0);
    this.interiorCeiling.rotation.x = -Math.PI / 2;
    this.interiorCeiling.visible = false;
    this.group.add(this.interiorCeiling);
  }

  #buildMansion(rng) {
    const W = 4.5;
    const D = 4.5;
    const H = 2.8;
    const wallThick = 0.12;
    const r = () => (rng() - 0.5) * 2;

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.7 });
    const netherMat = new THREE.MeshStandardMaterial({ color: 0x4A0A0A, roughness: 0.6, metalness: 0.3 });
    const diamondMat = new THREE.MeshStandardMaterial({ color: 0x66DDEE, roughness: 0.2, metalness: 0.4, emissive: 0x2288AA, emissiveIntensity: 0.15 });
    const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x44DD77, roughness: 0.3, metalness: 0.3, emissive: 0x22AA55, emissiveIntensity: 0.1 });
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x1A0A2A, roughness: 0.3, metalness: 0.6 });

    const wallMats = [boneMat, netherMat, obsidianMat];

    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, wallThick, D), boneMat);
    floor.position.y = wallThick / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;
    this.group.add(floor);
    for (const [fx, fz] of [[-W * 0.45, 0], [W * 0.45, 0], [0, -D * 0.45], [0, D * 0.45]]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(W * 0.05, 0.03, D * 0.05), obsidianMat);
      trim.position.set(fx, 0.02, fz);
      this.group.add(trim);
    }

    const wallPositions = [
      { pos: [0, H / 2, -D / 2], size: [W, H, wallThick] },
      { pos: [-W / 2, H / 2, 0], size: [wallThick, H, D] },
      { pos: [W / 2, H / 2, 0], size: [wallThick, H, D] },
      { pos: [-W * 0.28, H / 2, D / 2], size: [W * 0.35, H, wallThick] },
      { pos: [W * 0.28, H / 2, D / 2], size: [W * 0.35, H, wallThick] },
      { pos: [0, H - 0.06, D / 2], size: [W * 0.45, 0.12, wallThick] },
    ];
    for (const wp of wallPositions) {
      const mat = wallMats[Math.floor(rng() * wallMats.length)];
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wp.size), mat);
      mesh.position.set(...wp.pos);
      mesh.castShadow = true;
      this.#addWall(mesh);
    }

    for (const [px, pz] of [[-W * 0.42, -D * 0.42], [W * 0.42, -D * 0.42], [-W * 0.42, D * 0.42], [W * 0.42, D * 0.42]]) {
      if (pz > 0 && Math.abs(px) < W * 0.2) continue;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, 0.12), diamondMat);
      pillar.position.set(px, H / 2, pz);
      this.group.add(pillar);
    }

    const emeraldDoorMat = new THREE.MeshStandardMaterial({ color: 0x44DD77, roughness: 0.3, metalness: 0.3, emissive: 0x22AA55, emissiveIntensity: 0.1 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, H * 0.7, 0.08), emeraldDoorMat);
      post.position.set(s * 0.35, H * 0.35, D / 2 + 0.03);
      this.group.add(post);
    }
    const arch = new THREE.Mesh(new THREE.BoxGeometry(W * 0.2, 0.08, 0.08), emeraldDoorMat);
    arch.position.set(0, H * 0.7, D / 2 + 0.03);
    this.group.add(arch);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1A0A2A, roughness: 0.3, metalness: 0.5 });
    for (const s of [-1, 1]) {
      const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, wallThick, D * 0.55), roofMat);
      const angle = Math.atan2(1.2, D * 0.5);
      roof.position.set(0, H + 0.6 * 0.4, s * D * 0.17);
      roof.rotation.x = s * angle;
      roof.castShadow = true;
      this.#addRoof(roof);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.1, 0.1), diamondMat);
    ridge.position.set(0, H + 0.6, 0);
    this.#addRoof(ridge);
    for (const s of [-1, 1]) {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), emeraldMat);
      finial.position.set(s * (W * 0.45), H + 0.65, 0);
      this.group.add(finial);
    }

    const webMat = new THREE.MeshStandardMaterial({ color: WEB_COLOR, transparent: true, opacity: 0.25, roughness: 0.5, side: THREE.DoubleSide });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0.5], [1, 0.5], [-0.5, -1], [0.5, -1]]) {
      if (sz === 1 && Math.abs(sx) < 0.5) continue;
      if (sz === 0.5 && Math.abs(sx) < 0.3) continue;
      const web = new THREE.Mesh(new THREE.CircleGeometry(0.25 + rng() * 0.2, 5), webMat);
      web.position.set(sx * W * 0.4, H * 0.4 + rng() * 0.4, sz * D * 0.4);
      web.lookAt(0, H * 0.3, 0);
      web.scale.set(1, 1 + rng() * 0.4, 1);
      this.group.add(web);
    }

    const crackMat = new THREE.MeshStandardMaterial({ color: 0x0A0000, roughness: 1 });
    for (let i = 0; i < 8; i++) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05 + rng() * 0.1, 0.02), crackMat);
      crack.position.set(r() * W * 0.4, 0.2 + rng() * H * 0.5, r() * D * 0.4);
      crack.rotation.z = r() * 0.5;
      crack.rotation.x = r() * 0.3;
      this.group.add(crack);
    }

    this.lootContainer = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.35), new THREE.MeshStandardMaterial({ color: 0xAA8833, roughness: 0.7, metalness: 0.3 }));
    this.lootContainer.position.set(0, wallThick + 0.09, -D * 0.12);
    this.lootContainer.userData.isHouseLoot = true;
    this.lootContainer.userData.house = this;
    this.group.add(this.lootContainer);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xCCAA44, roughness: 0.6, metalness: 0.4 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.38), lidMat);
    lid.position.set(0, wallThick + 0.2, -D * 0.12);
    lid.userData.isHouseLoot = true;
    this.group.add(lid);
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), diamondMat);
    stud.position.set(0, wallThick + 0.22, -D * 0.12);
    this.group.add(stud);

    const glowMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.2, transparent: true, opacity: 0.2 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), glowMat);
    glow.position.set(0, H * 0.4, D / 2 + 0.01);
    glow.rotation.y = Math.PI;
    this.group.add(glow);

    const emberMat = new THREE.MeshStandardMaterial({ color: 0xFF4422, emissive: 0xFF2200, emissiveIntensity: 0.3, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 3; i++) {
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.02 + rng() * 0.03, 4, 4), emberMat);
      ember.position.set(r() * W * 0.3, 0.05, r() * D * 0.3);
      this.group.add(ember);
    }

    // Interior ceiling for mansion
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1A0A2A,
      roughness: 0.5,
      metalness: 0.4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });
    this.interiorCeiling = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.95, D * 0.95), ceilingMat);
    this.interiorCeiling.position.set(0, H * 0.98, 0);
    this.interiorCeiling.rotation.x = -Math.PI / 2;
    this.interiorCeiling.visible = false;
    this.group.add(this.interiorCeiling);
  }

  getPrice() {
    if (this.legendary) return [{ type: 'animaltrident', count: 3 }, { type: 'bone', count: 20 }];
    return this.isMansion ? HOUSE_PRICES.mansion : HOUSE_PRICES.normal;
  }

  canAfford(inventory) {
    const price = this.getPrice();
    for (const req of price) {
      if ((inventory[req.type] || 0) < req.count) return false;
    }
    return true;
  }

  buy(itemManager) {
    if (this.owned) return false;
    const price = this.getPrice();
    for (const req of price) {
      if (!itemManager.removeItems(req.type, req.count)) return false;
    }
    this.owned = true;
    // Add ownership flag
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x44DD77, emissive: 0x22AA55, emissiveIntensity: 0.2 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.5 }));
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.005), flagMat);
    const bounds = this.getBounds();
    pole.position.set(0, bounds.maxY - 0.5, -bounds.maxZ + 0.1);
    flag.position.set(0.1, bounds.maxY - 0.5 + 0.35, -bounds.maxZ + 0.1);
    this.group.add(pole);
    this.group.add(flag);
    return true;
  }

  updatePassiveResources(dt, itemManager) {
    if (!this.owned) return;
    this.resourceTimer += dt;
    if (this.resourceTimer >= this.resourceInterval) {
      this.resourceTimer -= this.resourceInterval;
      const table = this.isMansion ? MANSION_PASSIVE_RESOURCES : PASSIVE_RESOURCES;
      let totalChance = table.reduce((s, e) => s + e.chance, 0);
      let r = Math.random() * totalChance;
      for (const entry of table) {
        r -= entry.chance;
        if (r <= 0) {
          const count = this.isMansion ? 1 + Math.floor(Math.random() * 2) : 1;
          if (itemManager) itemManager.addItem(entry.type, count);
          return;
        }
      }
    }
  }

  breakWall(foxPos, itemManager) {
    if (this.walls.length === 0) return [];
    let closest = null;
    let closestDist = Infinity;
    for (const wall of this.walls) {
      const wPos = new THREE.Vector3();
      wall.getWorldPosition(wPos);
      const d = foxPos.distanceTo(wPos);
      if (d < closestDist) { closestDist = d; closest = wall; }
    }
    if (!closest || closestDist > 2) return [];

    this.group.remove(closest);
    closest.geometry.dispose();
    if (Array.isArray(closest.material)) closest.material.forEach(m => m.dispose());
    else closest.material.dispose();
    this.walls = this.walls.filter(w => w !== closest);

    const table = this.isMansion ? MANSION_WALL_LOOT : WALL_LOOT;
    const count = 1 + Math.floor(this.rng() * (this.isMansion ? 3 : 2));
    const items = [];
    for (let i = 0; i < count; i++) {
      const pick = weightedPick(table, this.rng);
      const c = pick.count[0] + Math.floor(this.rng() * (pick.count[1] - pick.count[0] + 1));
      if (itemManager) {
        itemManager.addItem(pick.type, c);
      }
      items.push({ type: pick.type, count: c });
    }
    return items;
  }

  activateGuardian(scene) {
    if (this.guardianAlive || this.cleared) return false;
    this.guardianAlive = true;
    this.entered = true;

    const guardianPos = new THREE.Vector3(
      this.worldX + (this.rng() - 0.5) * 0.5,
      0,
      this.worldZ + (this.rng() - 0.5) * 0.5
    );
    const type = this.isMansion ? 'spider' : 'spider';
    this.guardian = new Wolf(guardianPos, () => 0, type);
    this.guardian.group.position.y = 0.3;
    if (this.legendary) {
      this.guardian.group.scale.setScalar(3.0);
      this.guardian.typeDef.hp = 40;
      this.guardian.typeDef.atk = 15;
      this.guardian.typeDef.def = 5;
    } else if (this.isMansion) {
      this.guardian.group.scale.setScalar(2.2);
      this.guardian.typeDef.hp = 20;
      this.guardian.typeDef.atk = 8;
      this.guardian.typeDef.def = 3;
    } else {
      this.guardian.group.scale.setScalar(1.5);
      this.guardian.typeDef.hp = 10;
      this.guardian.typeDef.atk = 5;
      this.guardian.typeDef.def = 1;
    }
    this.guardian.typeDef.detectionRange = 25;
    this.guardian.typeDef.chaseSpeed = 3;
    scene.add(this.guardian.group);
    return true;
  }

  generateLoot() {
    if (this.lootSpawned) return [];
    this.lootSpawned = true;
    let table, count;
    if (this.legendary) {
      table = LEGENDARY_LOOT_TABLE;
      count = 5 + Math.floor(this.rng() * 8);
    } else {
      table = this.isMansion ? MANSION_LOOT_TABLE : LOOT_TABLE;
      count = this.isMansion ? 3 + Math.floor(this.rng() * 5) : 1 + Math.floor(this.rng() * 3);
    }
    const items = [];
    for (let i = 0; i < count; i++) {
      const pick = weightedPick(table, this.rng);
      const c = pick.count[0] + Math.floor(this.rng() * (pick.count[1] - pick.count[0] + 1));
      items.push({ type: pick.type, count: c });
    }
    return items;
  }

  markCleared() {
    this.cleared = true;
    this.guardianAlive = false;
    this.guardian = null;
  }

  update(dt, foxPos, itemManager) {
    if (this.guardian && this.guardianAlive && !this.guardian.dead) {
      this.guardian.update(dt, foxPos, true);
      if (this.guardian.dead) {
        this.markCleared();
      }
    }
    this.updatePassiveResources(dt, itemManager);
  }

  cleanup(scene) {
    if (this.guardian && this.guardian.group.parent) {
      scene.remove(this.guardian.group);
      this.guardian.removeFrom(scene);
    }
    this.group.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    if (this.group.parent) scene.remove(this.group);
  }
}
