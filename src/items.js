import * as THREE from 'three';

const ITEM_DEFS = {
  stick: { name: 'Stick', icon: '🪵', minDmg: 2, maxDmg: 5, color: 0x8B5E3C },
  rock:  { name: 'Rock',  icon: '🪨', minDmg: 3, maxDmg: 6, color: 0x808080 },
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
  constructor(scene, getHeight) {
    this.scene = scene;
    this.getHeight = getHeight;
    this.items = [];
    this.inventory = { stick: 0, rock: 0 };
  }

  update(foxPos) {
    this.items = this.items.filter(item => {
      if (item.group.position.distanceTo(foxPos) > 90) {
        item.removeFrom(this.scene);
        return false;
      }
      return true;
    });

    while (this.items.length < 12) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 25;
      const x = foxPos.x + Math.cos(a) * r;
      const z = foxPos.z + Math.sin(a) * r;
      const y = this.getHeight(x, z);
      if (y < 0.3) continue;
      const type = Math.random() < 0.5 ? 'stick' : 'rock';
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
    this.inventory = { stick: 0, rock: 0 };
  }
}

export { WorldItem, ItemManager, ITEM_DEFS };
