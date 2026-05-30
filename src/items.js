import * as THREE from 'three';

// Attack item chart:
//   Common:           Stick (2-5), Rock (3-6), Sharp Stick (4-8), Cactus Needle (flat 3, ignoreDef)
//   Heal:             Herb (6-12), Berry (3-7)
//   Desert/Canyon/Badlands:  cactusneedle, bone abundant;  no mushrooms (too dry)
//   Forest/Swamp/Crystal:    mushrooms, herbs abundant;    no cactusneedle (too wet)
//   Mountain:                rocks, sticks abundant;       no mushrooms/cactus (snowy)
//   Tundra:                  rocks, bone abundant;         no mushrooms/cactus (frozen)
//   Plains:                  mixed;                        cactusneedle rare, mushrooms rare
const ITEM_DEFS = {
  stick: { name: 'Stick', icon: '🪵', minDmg: 2, maxDmg: 5, color: 0x8B5E3C, category: 'weapon' },
  rock:  { name: 'Rock',  icon: '🪨', minDmg: 3, maxDmg: 6, color: 0x808080, category: 'weapon' },
  sharpstick: { name: 'Sharp Stick', icon: '🗡️', minDmg: 4, maxDmg: 8, color: 0x6B3E1C, category: 'weapon' },
  cactusneedle: { name: 'Cactus Needle', icon: '🌵', flatDmg: 3, color: 0x3A7A2A, category: 'weapon', ignoreDef: true },
  herb: { name: 'Herb', icon: '🌿', minHeal: 6, maxHeal: 12, color: 0x5AAA3A, category: 'heal' },
  berry: { name: 'Berry', icon: '🫐', minHeal: 3, maxHeal: 7, color: 0xAA3377, category: 'heal' },
  bone: { name: 'Bone', icon: '🦴', minDmg: 5, maxDmg: 10, color: 0xE8DCC8, category: 'weapon' },
  mushroom: { name: 'Mushroom', icon: '🍄', atkMult: 1.5, color: 0xCC4444, category: 'buff' },
  feather: { name: 'Feather', icon: '🪶', color: 0xE8E0E0, category: 'craft' },
  seaweed: { name: 'Seaweed', icon: '🌱', color: 0x2A7A3A, category: 'craft' },
  jellyfisharm: { name: 'Jellyfish Arm', icon: '🪼', flatDmg: 5, color: 0xAA55CC, category: 'weapon', ignoreDef: true },
  starfisharm: { name: 'Starfish Arm', icon: '⭐', minHeal: 10, maxHeal: 18, color: 0xFF8844, category: 'heal', atkMult: 1.3 },
  animalsword: { name: 'Animal Sword', icon: '⚔️', minDmg: 12, maxDmg: 20, color: 0xE8DCC8, category: 'weapon' },
  animalpickaxe: { name: 'Animal Pickaxe', icon: '⛏️', minDmg: 15, maxDmg: 24, color: 0x6A4A2A, category: 'weapon' },
  animaltrident: { name: 'Animal Trident', icon: '🔱', flatDmg: 18, color: 0x4A7ACC, category: 'weapon', ignoreDef: true },
};

const CRAFTING_RECIPES = [
  { input: { bone: 2, sharpstick: 1 }, output: 'animalsword', label: 'Animal Sword' },
  { input: { bone: 3, rock: 2 }, output: 'animalpickaxe', label: 'Animal Pickaxe' },
  { input: { sharpstick: 2, jellyfisharm: 1 }, output: 'animaltrident', label: 'Animal Trident' },
];

class WorldItem {
  constructor(type, position) {
    this.type = type;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.collected = false;
    this.#build();
  }

  #build() {
    const info = ITEM_DEFS[this.type];
    const mat = new THREE.MeshStandardMaterial({ color: info.color, roughness: 0.8 });

    if (this.type === 'stick') {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 5), mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = Math.random() * Math.PI;
      mesh.position.y = 0.02;
      this.group.add(mesh);
    } else if (this.type === 'sharpstick') {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.35, 5), mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = Math.random() * Math.PI;
      mesh.position.y = 0.02;
      this.group.add(mesh);
    } else if (this.type === 'cactusneedle') {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.15, 5), mat);
      mesh.position.y = 0.02;
      mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, 0);
      this.group.add(mesh);
    } else if (this.type === 'herb') {
      for (let i = 0; i < 3; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat);
        leaf.position.set((Math.random() - 0.5) * 0.06, 0.02 + Math.random() * 0.04, (Math.random() - 0.5) * 0.06);
        leaf.scale.set(1, 0.3, 1);
        this.group.add(leaf);
      }
    } else if (this.type === 'berry') {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat);
      berry.position.y = 0.02;
      this.group.add(berry);
    } else if (this.type === 'bone') {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.25, 5), mat);
      mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      mesh.rotation.z = Math.random() * Math.PI;
      mesh.position.y = 0.02;
      this.group.add(mesh);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat);
      knob.position.set(0, 0.02, 0.12);
      this.group.add(knob);
    } else if (this.type === 'mushroom') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.8 }));
      stem.position.y = 0.03;
      this.group.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat);
      cap.scale.set(1, 0.5, 1);
      cap.position.y = 0.06;
      this.group.add(cap);
    } else if (this.type === 'feather') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xD0C8C8, roughness: 0.6 }));
      shaft.rotation.z = 0.3;
      shaft.position.y = 0.02;
      this.group.add(shaft);
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.002), mat);
      vane.position.set(-0.02, 0.06, 0);
      vane.rotation.z = 0.3;
      this.group.add(vane);
    } else if (this.type === 'seaweed') {
      for (let i = 0; i < 3; i++) {
        const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.15 + Math.random() * 0.1, 4), mat);
        strand.position.set((Math.random() - 0.5) * 0.06, 0.02, (Math.random() - 0.5) * 0.06);
        strand.rotation.z = (Math.random() - 0.5) * 0.4;
        strand.rotation.x = (Math.random() - 0.5) * 0.3;
        this.group.add(strand);
      }
    } else if (this.type === 'jellyfisharm') {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.025, 0.18, 5), new THREE.MeshStandardMaterial({ color: 0xCC77EE, roughness: 0.2, metalness: 0.1 }));
      arm.position.y = 0.02;
      arm.rotation.z = 0.3;
      this.group.add(arm);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), new THREE.MeshStandardMaterial({ color: 0xEE88FF, emissive: 0xAA55CC, emissiveIntensity: 0.3 }));
      tip.position.set(0.03, 0.1, 0);
      this.group.add(tip);
    } else if (this.type === 'starfisharm') {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.005, 0.15, 5), mat);
      arm.position.y = 0.02;
      arm.rotation.z = 0.5;
      this.group.add(arm);
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.005, 0.15, 5), mat);
      arm2.position.y = 0.02;
      arm2.rotation.z = -0.5;
      arm2.rotation.y = 0.5;
      this.group.add(arm2);
    } else if (this.type === 'animalsword') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.005), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.4 }));
      blade.position.y = 0.14;
      this.group.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 5), new THREE.MeshStandardMaterial({ color: 0x5C3D1A, roughness: 0.7 }));
      handle.position.y = 0.03;
      this.group.add(handle);
    } else if (this.type === 'animalpickaxe') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 5), new THREE.MeshStandardMaterial({ color: 0x5C3D1A, roughness: 0.7 }));
      handle.rotation.z = 0.3;
      handle.position.y = 0.06;
      this.group.add(handle);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 5), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.5 }));
      head.position.set(0.04, 0.16, 0);
      head.rotation.z = 0.3;
      this.group.add(head);
    } else if (this.type === 'animaltrident') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.25, 5), new THREE.MeshStandardMaterial({ color: 0x6B3E1C, roughness: 0.7 }));
      shaft.position.y = 0.06;
      this.group.add(shaft);
      for (const s of [-1, 0, 1]) {
        const tine = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x4A7ACC, roughness: 0.4 }));
        tine.position.set(s * 0.025, 0.2, 0);
        this.group.add(tine);
      }
    } else {
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + Math.random() * 0.04), mat);
      mesh.position.y = 0.04;
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.group.add(mesh);
    }
  }

  removeFrom(scene) {
    scene.remove(this.group);
    this.group.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
  }
}

class ItemManager {
  constructor(scene, getHeight, getBiomeInfo) {
    this.scene = scene;
    this.getHeight = getHeight;
    this.getBiomeInfo = getBiomeInfo;
    this.items = [];
    this.inventory = { stick: 0, rock: 0, sharpstick: 0, cactusneedle: 0, herb: 0, berry: 0, bone: 0, mushroom: 0, feather: 0, seaweed: 0, jellyfisharm: 0, starfisharm: 0, animalsword: 0, animalpickaxe: 0, animaltrident: 0 };
  }

  #smoothstep(t, lo, hi) {
    t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  }

  #pickItemType(x, z) {
    if (!this.getBiomeInfo) {
      const r = Math.random();
      if (r < 0.22) return 'stick';
      if (r < 0.40) return 'sharpstick';
      if (r < 0.56) return 'berry';
      if (r < 0.69) return 'rock';
      if (r < 0.82) return 'cactusneedle';
      if (r < 0.93) return 'herb';
      if (r < 0.97) return 'bone';
      return 'mushroom';
    }
    const bio = this.getBiomeInfo(x, z);
    const forest = this.#smoothstep(bio.temp, 0, 0.3) * this.#smoothstep(bio.moist, 0.2, 0.5) * (1 - bio.mountain * 0.3);
    const desert = this.#smoothstep(bio.temp, 0.12, 0.42) * (1 - this.#smoothstep(bio.moist, -0.2, 0.1)) * (1 - bio.mountain * 0.4);
    const region = bio.biomeRegion;
    const r = Math.random();

    if (desert > 0.3 || region === 'canyon' || region === 'badlands') {
      if (r < 0.28) return 'sharpstick';
      if (r < 0.53) return 'cactusneedle';
      if (r < 0.71) return 'stick';
      if (r < 0.88) return 'rock';
      return 'bone';
    }

    if (forest > 0.3 || region === 'swamp') {
      if (r < 0.22) return 'stick';
      if (r < 0.42) return 'sharpstick';
      if (r < 0.58) return 'herb';
      if (r < 0.70) return 'berry';
      if (r < 0.78) return 'feather';
      if (r < 0.88) return 'mushroom';
      if (r < 0.97) return 'rock';
      return 'bone';
    }

    if (region === 'mountain') {
      if (r < 0.30) return 'rock';
      if (r < 0.52) return 'stick';
      if (r < 0.70) return 'sharpstick';
      if (r < 0.82) return 'herb';
      if (r < 0.92) return 'berry';
      return 'bone';
    }

    if (region === 'tundra') {
      if (r < 0.28) return 'rock';
      if (r < 0.46) return 'stick';
      if (r < 0.58) return 'sharpstick';
      if (r < 0.68) return 'bone';
      if (r < 0.78) return 'feather';
      if (r < 0.88) return 'herb';
      return 'berry';
    }

    if (region === 'crystal') {
      if (r < 0.18) return 'mushroom';
      if (r < 0.34) return 'herb';
      if (r < 0.48) return 'stick';
      if (r < 0.60) return 'berry';
      if (r < 0.70) return 'feather';
      if (r < 0.82) return 'sharpstick';
      if (r < 0.92) return 'rock';
      return 'bone';
    }

    if (r < 0.18) return 'stick';
    if (r < 0.34) return 'sharpstick';
    if (r < 0.46) return 'berry';
    if (r < 0.56) return 'rock';
    if (r < 0.66) return 'feather';
    if (r < 0.78) return 'cactusneedle';
    if (r < 0.88) return 'herb';
    if (r < 0.95) return 'bone';
    return 'mushroom';
  }

  #pickOceanItemType() {
    const r = Math.random();
    if (r < 0.45) return 'seaweed';
    if (r < 0.70) return 'jellyfisharm';
    return 'starfisharm';
  }

  update(foxPos) {
    this.items = this.items.filter(item => {
      if (item.group.position.distanceTo(foxPos) > 90) {
        item.removeFrom(this.scene);
        return false;
      }
      return true;
    });

    let attempts = 0;
    while (this.items.length < 45 && attempts < 400) {
      attempts++;
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 25;
      const x = foxPos.x + Math.cos(a) * r;
      const z = foxPos.z + Math.sin(a) * r;
      const y = this.getHeight(x, z);
      if (y < 0.3) {
        const type = this.#pickOceanItemType();
        const item = new WorldItem(type, new THREE.Vector3(x, 0, z));
        this.scene.add(item.group);
        this.items.push(item);
        continue;
      }
      const type = this.#pickItemType(x, z);
      const item = new WorldItem(type, new THREE.Vector3(x, y, z));
      this.scene.add(item.group);
      this.items.push(item);
    }

    for (const item of this.items) {
      if (item.collected) continue;
      if (item.group.position.distanceTo(foxPos) < 1.0) {
        this.collectItem(item);
      }
    }
  }

  collectItem(item) {
    item.collected = true;
    this.inventory[item.type]++;
    item.removeFrom(this.scene);
    this.items = this.items.filter(i => i !== item);
  }

  useItem(type) {
    if (this.inventory[type] <= 0) return null;
    this.inventory[type]--;
    return { ...ITEM_DEFS[type] };
  }

  getCounts() {
    return { ...this.inventory };
  }

  canCraft(recipe) {
    for (const [type, qty] of Object.entries(recipe.input)) {
      if ((this.inventory[type] || 0) < qty) return false;
    }
    return true;
  }

  craft(recipe) {
    if (!this.canCraft(recipe)) return false;
    for (const [type, qty] of Object.entries(recipe.input)) {
      this.inventory[type] -= qty;
    }
    this.inventory[recipe.output] = (this.inventory[recipe.output] || 0) + 1;
    return true;
  }

  clearAll() {
    for (const item of this.items) item.removeFrom(this.scene);
    this.items = [];
    this.inventory = { stick: 0, rock: 0, sharpstick: 0, cactusneedle: 0, herb: 0, berry: 0, bone: 0, mushroom: 0, feather: 0, seaweed: 0, jellyfisharm: 0, starfisharm: 0, animalsword: 0, animalpickaxe: 0, animaltrident: 0 };
  }
}

export { WorldItem, ItemManager, ITEM_DEFS, CRAFTING_RECIPES };
