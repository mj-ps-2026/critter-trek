import * as THREE from 'three';

const ITEM_DEFS = {
  stick: { name: 'Stick', icon: '🪵', minDmg: 2, maxDmg: 5, color: 0x8B5E3C, category: 'weapon' },
  rock:  { name: 'Rock',  icon: '🪨', minDmg: 3, maxDmg: 6, color: 0x808080, category: 'weapon' },
  sharpstick: { name: 'Sharp Stick', icon: '🗡️', minDmg: 4, maxDmg: 8, color: 0x6B3E1C, category: 'weapon' },
  cactusneedle: { name: 'Cactus Needle', icon: '🌵', minDmg: 3, maxDmg: 7, color: 0x3A7A2A, category: 'weapon' },
  herb: { name: 'Herb', icon: '🌿', minHeal: 6, maxHeal: 12, color: 0x5AAA3A, category: 'heal' },
  berry: { name: 'Berry', icon: '🫐', minHeal: 3, maxHeal: 7, color: 0xAA3377, category: 'heal' },
  bone: { name: 'Bone', icon: '🦴', minDmg: 5, maxDmg: 10, color: 0xE8DCC8, category: 'weapon' },
  mushroom: { name: 'Mushroom', icon: '🍄', atkMult: 1.5, color: 0xCC4444, category: 'buff' },
};

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
    const mat = new THREE.MeshStandardMaterial({ color: info.color, roughness: 0.8, flatShading: true });

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
    this.inventory = { stick: 0, rock: 0, sharpstick: 0, cactusneedle: 0, herb: 0, berry: 0, bone: 0, mushroom: 0 };
  }

  #smoothstep(t, lo, hi) {
    t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  }

  #pickItemType(x, z) {
    if (!this.getBiomeInfo) {
      const r = Math.random();
      if (r < 0.2) return 'stick';
      if (r < 0.35) return 'rock';
      if (r < 0.5) return 'berry';
      if (r < 0.6) return 'sharpstick';
      if (r < 0.7) return 'bone';
      if (r < 0.8) return 'cactusneedle';
      if (r < 0.9) return 'herb';
      return 'mushroom';
    }
    const bio = this.getBiomeInfo(x, z);
    const forest = this.#smoothstep(bio.temp, 0, 0.3) * this.#smoothstep(bio.moist, 0.2, 0.5) * (1 - bio.mountain * 0.3);
    const desert = this.#smoothstep(bio.temp, 0.12, 0.42) * (1 - this.#smoothstep(bio.moist, -0.2, 0.1)) * (1 - bio.mountain * 0.4);
    const r = Math.random();
    if (desert > 0.3) {
      if (r < 0.25) return 'rock';
      if (r < 0.45) return 'cactusneedle';
      if (r < 0.55) return 'bone';
      if (r < 0.7) return 'stick';
      if (r < 0.85) return 'sharpstick';
      return 'mushroom';
    }
    if (forest > 0.3) {
      if (r < 0.2) return 'stick';
      if (r < 0.35) return 'sharpstick';
      if (r < 0.5) return 'herb';
      if (r < 0.6) return 'berry';
      if (r < 0.7) return 'mushroom';
      if (r < 0.85) return 'rock';
      return 'bone';
    }
    if (r < 0.18) return 'stick';
    if (r < 0.32) return 'rock';
    if (r < 0.46) return 'berry';
    if (r < 0.56) return 'sharpstick';
    if (r < 0.66) return 'bone';
    if (r < 0.76) return 'mushroom';
    if (r < 0.86) return 'herb';
    return 'cactusneedle';
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
    while (this.items.length < 35 && attempts < 300) {
      attempts++;
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 25;
      const x = foxPos.x + Math.cos(a) * r;
      const z = foxPos.z + Math.sin(a) * r;
      const y = this.getHeight(x, z);
      if (y < 0.3) continue;
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

  clearAll() {
    for (const item of this.items) item.removeFrom(this.scene);
    this.items = [];
    this.inventory = { stick: 0, rock: 0, sharpstick: 0, cactusneedle: 0, herb: 0, berry: 0, bone: 0, mushroom: 0 };
  }
}

export { WorldItem, ItemManager, ITEM_DEFS };
