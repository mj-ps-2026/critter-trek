import * as THREE from 'three';
import { ITEM_DEFS } from './items.js';

class PlacedObject {
  constructor(type, position, rotationY) {
    this.type = type;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.rotation.y = rotationY || 0;
    this.#build();
  }

  #build() {
    const info = ITEM_DEFS[this.type];
    const mat = new THREE.MeshStandardMaterial({ color: info.color, roughness: 0.8 });

    if (this.type === 'stick') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 5), mat);
      m.rotation.x = Math.PI / 2;
      m.position.y = 0.03;
      this.group.add(m);
    } else if (this.type === 'sharpstick') {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.4, 5), mat);
      m.rotation.x = Math.PI / 2;
      m.position.y = 0.03;
      this.group.add(m);
    } else if (this.type === 'cactusneedle') {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 5), mat);
      m.position.y = 0.03;
      this.group.add(m);
    } else if (this.type === 'herb') {
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat);
        leaf.position.set((Math.random() - 0.5) * 0.1, 0.03 + Math.random() * 0.06, (Math.random() - 0.5) * 0.1);
        leaf.scale.set(1, 0.3, 1);
        this.group.add(leaf);
      }
    } else if (this.type === 'berry') {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), mat);
      b.position.y = 0.03;
      this.group.add(b);
    } else if (this.type === 'bone') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.3, 5), mat);
      m.rotation.x = Math.PI / 2 + 0.2;
      m.position.y = 0.03;
      this.group.add(m);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), mat);
      knob.position.set(0, 0.03, 0.14);
      this.group.add(knob);
    } else if (this.type === 'mushroom') {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 5), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.8 }));
      stem.position.y = 0.04;
      this.group.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), mat);
      cap.scale.set(1, 0.5, 1);
      cap.position.y = 0.08;
      this.group.add(cap);
    } else if (this.type === 'feather') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0xD0C8C8, roughness: 0.6 }));
      shaft.rotation.z = 0.3;
      shaft.position.y = 0.03;
      this.group.add(shaft);
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.003), mat);
      vane.position.set(-0.025, 0.08, 0);
      vane.rotation.z = 0.3;
      this.group.add(vane);
    } else if (this.type === 'seaweed') {
      for (let i = 0; i < 4; i++) {
        const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.2 + Math.random() * 0.15, 4), mat);
        strand.position.set((Math.random() - 0.5) * 0.08, 0.03, (Math.random() - 0.5) * 0.08);
        strand.rotation.z = (Math.random() - 0.5) * 0.5;
        strand.rotation.x = (Math.random() - 0.5) * 0.4;
        this.group.add(strand);
      }
    } else if (this.type === 'jellyfisharm') {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.03, 0.22, 5), new THREE.MeshStandardMaterial({ color: 0xCC77EE, roughness: 0.2, metalness: 0.1 }));
      arm.position.y = 0.03;
      arm.rotation.z = 0.3;
      this.group.add(arm);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5), new THREE.MeshStandardMaterial({ color: 0xEE88FF, emissive: 0xAA55CC, emissiveIntensity: 0.3 }));
      tip.position.set(0.04, 0.13, 0);
      this.group.add(tip);
    } else if (this.type === 'starfisharm') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.008, 0.18, 5), mat);
        arm.position.set(Math.cos(a) * 0.04, 0.03, Math.sin(a) * 0.04);
        arm.rotation.z = 0.4;
        arm.rotation.y = a;
        this.group.add(arm);
      }
    } else if (this.type === 'animalsword') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.008), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.4 }));
      blade.position.y = 0.18;
      this.group.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 5), new THREE.MeshStandardMaterial({ color: 0x5C3D1A, roughness: 0.7 }));
      handle.position.y = 0.04;
      this.group.add(handle);
    } else if (this.type === 'animalpickaxe') {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.28, 5), new THREE.MeshStandardMaterial({ color: 0x5C3D1A, roughness: 0.7 }));
      handle.rotation.z = 0.3;
      handle.position.y = 0.08;
      this.group.add(handle);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 5), new THREE.MeshStandardMaterial({ color: 0xE8DCC8, roughness: 0.5 }));
      head.position.set(0.05, 0.2, 0);
      head.rotation.z = 0.3;
      this.group.add(head);
    } else if (this.type === 'animaltrident') {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 5), new THREE.MeshStandardMaterial({ color: 0x6B3E1C, roughness: 0.7 }));
      shaft.position.y = 0.08;
      this.group.add(shaft);
      for (const s of [-1, 0, 1]) {
        const tine = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.1, 4), new THREE.MeshStandardMaterial({ color: 0x4A7ACC, roughness: 0.4 }));
        tine.position.set(s * 0.03, 0.25, 0);
        this.group.add(tine);
      }
    } else if (this.type === 'rock') {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1), mat);
      m.position.y = 0.04;
      this.group.add(m);
    } else {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1), mat);
      m.position.y = 0.04;
      this.group.add(m);
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

class BuildingManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.selectedType = null;
    this.placeCooldown = 0;
  }

  getSaveData() {
    return this.objects.map(o => ({
      type: o.type,
      x: o.group.position.x,
      y: o.group.position.y,
      z: o.group.position.z,
      ry: o.group.rotation.y,
    }));
  }

  loadSaveData(data) {
    for (const d of data) {
      const obj = new PlacedObject(d.type, new THREE.Vector3(d.x, d.y, d.z), d.ry);
      this.scene.add(obj.group);
      this.objects.push(obj);
    }
  }

  place(type, posY, foxPos) {
    const offset = new THREE.Vector3(2, 0, 0);
    offset.applyQuaternion(foxPos.quaternion || new THREE.Quaternion());
    const pos = new THREE.Vector3().copy(foxPos).add(offset);
    pos.y = posY || foxPos.y;
    pos.y = Math.max(pos.y, 0.05);

    // snap to nearest 0.5 grid for tidy placement
    pos.x = Math.round(pos.x * 2) / 2;
    pos.z = Math.round(pos.z * 2) / 2;
    pos.y = Math.round(pos.y * 4) / 4;

    // check no overlap
    for (const obj of this.objects) {
      if (obj.group.position.distanceTo(pos) < 0.4) return false;
    }

    const obj = new PlacedObject(type, pos, Math.floor(Math.random() * 8) * Math.PI / 4);
    this.scene.add(obj.group);
    this.objects.push(obj);
    return true;
  }

  pickupAt(foxPos, range) {
    range = range || 1.2;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj.group.position.distanceTo(foxPos) < range) {
        obj.removeFrom(this.scene);
        this.objects.splice(i, 1);
        return obj.type;
      }
    }
    return null;
  }

  interactWith(foxPos, toolType, range) {
    range = range || 1.5;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj.group.position.distanceTo(foxPos) < range) {
        if (toolType === 'animalsword') {
          obj.group.rotation.y += Math.PI / 4;
          return 'rotated';
        }
        if (toolType === 'animalpickaxe') {
          obj.removeFrom(this.scene);
          this.objects.splice(i, 1);
          return obj.type;
        }
        if (toolType === 'animaltrident') {
          const offset = new THREE.Vector3(3, 0, 0);
          offset.applyQuaternion(foxPos.quaternion || new THREE.Quaternion());
          const newPos = new THREE.Vector3().copy(foxPos).add(offset);
          obj.group.position.copy(newPos);
          return 'moved';
        }
        break;
      }
    }
    return null;
  }

  update(foxPos) {
    if (this.placeCooldown > 0) this.placeCooldown -= 0.016;

    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.objects[i].group.position.distanceTo(foxPos) > 90) {
        this.objects[i].removeFrom(this.scene);
        this.objects.splice(i, 1);
      }
    }
  }

  clearAll() {
    for (const obj of this.objects) obj.removeFrom(this.scene);
    this.objects = [];
  }

  getNearby(foxPos, range) {
    range = range || 2;
    return this.objects.filter(o => o.group.position.distanceTo(foxPos) < range);
  }
}

export { BuildingManager, PlacedObject };
