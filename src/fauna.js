import * as THREE from 'three';

const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true });

function smoothstep(t, lo, hi) {
  t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

class FaunaAnimal {
  constructor(type, position, getHeight) {
    this.type = type;
    this.group = new THREE.Group();
    this.getHeight = getHeight;
    this.state = 'WANDER';
    this.targetPos = null;
    this.waitTimer = 0.5 + Math.random() * 3;
    this.clock = Math.random() * 10;
    this.speed = 2;
    this.fleeDist = 12;
    this.roamRadius = 15;
    this.hp = 5;
    this.atk = 2;
    this.def = 0;
    this.displayName = 'Creature';
    this.icon = '🐾';

    switch (type) {
      case 'rabbit': this.speed = 5; this.fleeDist = 10; this.roamRadius = 10; this.hp = 3; this.atk = 1; this.def = 0; this.displayName = 'Rabbit'; this.icon = '🐇'; break;
      case 'deer':   this.speed = 4; this.fleeDist = 20; this.roamRadius = 25; this.hp = 8; this.atk = 3; this.def = 1; this.displayName = 'Deer'; this.icon = '🦌'; break;
      case 'lizard': this.speed = 3.5; this.fleeDist = 8; this.roamRadius = 8; this.hp = 4; this.atk = 1; this.def = 0; this.displayName = 'Lizard'; this.icon = '🦎'; break;
      case 'bear':   this.speed = 2.5; this.fleeDist = 16; this.roamRadius = 20; this.hp = 18; this.atk = 6; this.def = 2; this.displayName = 'Bear'; this.icon = '🐻'; break;
      case 'arcticfox': this.speed = 4; this.fleeDist = 14; this.roamRadius = 18; this.hp = 6; this.atk = 3; this.def = 1; this.displayName = 'Arctic Fox'; this.icon = '🦊'; break;
    }

    this.group.position.set(position.x, getHeight(position.x, position.z), position.z);
    this.#build();
  }

  #build() {
    switch (this.type) {
      case 'rabbit': this.#buildRabbit(); break;
      case 'deer':   this.#buildDeer(); break;
      case 'lizard': this.#buildLizard(); break;
      case 'bear':   this.#buildBear(); break;
      case 'arcticfox': this.#buildArcticFox(); break;
    }
  }

  #buildRabbit() {
    const g = this.group;
    const white = 0xE8E0D0, pink = 0xFFB5B5, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), mat(white));
    body.position.y = 0.3;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat(white));
    head.position.set(0, 0.45, -0.3);
    g.add(head);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 4), mat(white));
      ear.position.set(s * 0.12, 0.72, -0.24);
      ear.rotation.z = s * 0.25;
      g.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), mat(pink));
      inner.position.set(s * 0.12, 0.66, -0.24);
      inner.rotation.z = s * 0.25;
      g.add(inner);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mat(black));
      eye.position.set(s * 0.1, 0.48, -0.39);
      g.add(eye);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 4, 4), mat(white));
    tail.position.set(0, 0.25, 0.3);
    g.add(tail);

    for (const [x, z] of [[0.12, 0.15], [-0.12, 0.15], [0.12, -0.15], [-0.12, -0.15]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.18, 4), mat(white));
      leg.position.set(x, 0.09, z);
      g.add(leg);
    }
  }

  #buildDeer() {
    const g = this.group;
    const brown = 0x8B6914, dark = 0x5C3D1A, white = 0xF5F0E6;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 1.3), mat(brown));
    body.position.y = 0.6;
    body.castShadow = true;
    g.add(body);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), mat(brown));
    neck.position.set(0, 0.9, -0.55);
    g.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.45), mat(brown));
    head.position.set(0, 1.1, -0.8);
    head.castShadow = true;
    g.add(head);

    for (const s of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.35, 4), mat(dark));
      ant.position.set(s * 0.18, 1.35, -0.7);
      ant.rotation.z = s * 0.4;
      g.add(ant);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.18, 4), mat(dark));
      tip.position.set(s * 0.3, 1.5, -0.6);
      tip.rotation.z = s * 0.7;
      g.add(tip);
    }

    for (const [x, z] of [[0.3, 0.45], [-0.3, 0.45], [0.3, -0.45], [-0.3, -0.45]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.5, 4), mat(dark));
      leg.position.set(x, 0.25, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 4, 4), mat(white));
    tail.position.set(0, 0.75, 0.7);
    g.add(tail);
  }

  #buildLizard() {
    const g = this.group;
    const green = 0x4a8a3a, dark = 0x2a5a2a, yellow = 0xddcc44;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.48), mat(green));
    body.position.y = 0.08;
    g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.14), mat(green));
    head.position.set(0, 0.1, -0.3);
    g.add(head);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), mat(dark));
    tail.position.set(0, 0.04, 0.32);
    tail.rotation.x = 0.3;
    g.add(tail);

    for (const [x, z] of [[0.06, 0.14], [-0.06, 0.14], [0.06, -0.14], [-0.06, -0.14]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.06, 4), mat(dark));
      leg.position.set(x, -0.02, z);
      g.add(leg);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(yellow));
      eye.position.set(s * 0.04, 0.12, -0.34);
      g.add(eye);
    }
  }

  #buildBear() {
    const g = this.group;
    const brown = 0x4A2F1A, dark = 0x2A1A0A;

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.7, 1.6), mat(brown));
    body.position.y = 0.7;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), mat(brown));
    head.position.set(0, 1.1, -0.9);
    head.castShadow = true;
    g.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.15), mat(dark));
    snout.position.set(0, 1.05, -1.15);
    g.add(snout);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 5, 5), mat(brown));
      ear.position.set(s * 0.2, 1.3, -0.85);
      g.add(ear);
    }

    for (const [x, z] of [[0.45, 0.6], [-0.45, 0.6], [0.45, -0.6], [-0.45, -0.6]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 5), mat(dark));
      leg.position.set(x, 0.25, z);
      g.add(leg);
    }
  }

  #buildArcticFox() {
    const g = this.group;
    const white = 0xE8E8F0, dark = 0xC0C0D0, black = 0x111111;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.7), mat(white));
    body.position.y = 0.3;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.22), mat(white));
    head.position.set(0, 0.44, -0.42);
    g.add(head);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 4), mat(white));
      ear.position.set(s * 0.1, 0.6, -0.36);
      ear.rotation.z = s * 0.2;
      g.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), mat(dark));
      inner.position.set(s * 0.1, 0.56, -0.36);
      inner.rotation.z = s * 0.2;
      g.add(inner);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(black));
      eye.position.set(s * 0.075, 0.46, -0.5);
      g.add(eye);
    }

    for (const [x, z] of [[0.12, 0.25], [-0.12, 0.25], [0.12, -0.25], [-0.12, -0.25]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 4), mat(white));
      leg.position.set(x, 0.1, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 5), mat(white));
    tail.position.set(0, 0.3, 0.4);
    tail.scale.set(1, 0.9, 1.5);
    g.add(tail);
  }

  update(dt, foxPos) {
    this.clock += dt;
    const dist = this.group.position.distanceTo(foxPos);

    if (dist < this.fleeDist) {
      this.state = 'FLEE';
    }

    switch (this.state) {
      case 'WANDER': this.#doWander(dt); break;
      case 'FLEE': this.#doFlee(dt, foxPos); break;
    }
  }

  #doWander(dt) {
    if (!this.targetPos || this.group.position.distanceTo(this.targetPos) < 0.5) {
      this.waitTimer -= dt;
      if (this.waitTimer > 0) return;
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * this.roamRadius;
      const p = this.group.position;
      const tx = p.x + Math.cos(a) * r;
      const tz = p.z + Math.sin(a) * r;
      this.targetPos = new THREE.Vector3(tx, this.getHeight(tx, tz), tz);
      this.waitTimer = 1.5 + Math.random() * 4;
    }
    this.#moveToward(this.targetPos, dt, this.speed * 0.3);
  }

  #doFlee(dt, foxPos) {
    const dir = new THREE.Vector3().subVectors(this.group.position, foxPos);
    dir.y = 0;
    dir.normalize();
    const p = this.group.position;
    const tx = p.x + dir.x * 15;
    const tz = p.z + dir.z * 15;
    const target = new THREE.Vector3(tx, this.getHeight(tx, tz), tz);
    this.#moveToward(target, dt, this.speed);

    if (this.group.position.distanceTo(foxPos) > this.fleeDist * 3) {
      this.state = 'WANDER';
      this.targetPos = null;
    }
  }

  #moveToward(target, dt, speed) {
    const pos = this.group.position;
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    if (dir.length() < 0.1) return;
    dir.normalize();
    pos.x += dir.x * speed * dt;
    pos.z += dir.z * speed * dt;
    pos.y = this.getHeight(pos.x, pos.z);
    this.group.rotation.y = Math.atan2(dir.x, -dir.z);
  }

  removeFrom(scene) {
    scene.remove(this.group);
    this.group.traverse((child) => {
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

export class FaunaManager {
  constructor(scene, getHeight, getBiomeInfo) {
    this.scene = scene;
    this.getHeight = getHeight;
    this.getBiomeInfo = getBiomeInfo;
    this.animals = [];
  }

  update(foxPos, dt) {
    this.animals = this.animals.filter((a) => {
      const d = a.group.position.distanceTo(foxPos);
      if (d > 90) {
        a.removeFrom(this.scene);
        return false;
      }
      return true;
    });

    const targetCount = 18;
    let faunaAttempts = 0;
    while (this.animals.length < targetCount && faunaAttempts < 500) {
      faunaAttempts++;
      const a = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 25;
      const px = foxPos.x + Math.cos(a) * r;
      const pz = foxPos.z + Math.sin(a) * r;
      const py = this.getHeight(px, pz);
      if (py < 0.3) continue;

      const bio = this.getBiomeInfo(px, pz);
      const type = this.#pickType(bio);
      if (!type) continue;

      const pos = new THREE.Vector3(px, py, pz);
      const animal = new FaunaAnimal(type, pos, this.getHeight);
      this.scene.add(animal.group);
      this.animals.push(animal);
    }

    for (const a of this.animals) {
      a.update(dt, foxPos);
    }
  }

  #pickType(bio) {
    const { temp, moist, mountain } = bio;
    const desert = smoothstep(temp, 0.12, 0.42) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain);
    const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain * 0.3);
    const tundra = 1 - smoothstep(temp, -0.35, 0);
    const plains = Math.max(0, 1 - desert - forest - tundra - mountain) * 0.5;

    const r = Math.random();
    if (desert > 0.3) return r < 0.7 ? 'lizard' : 'rabbit';
    if (tundra > 0.3) return r < 0.45 ? 'arcticfox' : r < 0.75 ? 'rabbit' : r < 0.9 ? 'deer' : 'bear';
    if (forest > 0.3) {
      return r < 0.4 ? 'deer' : r < 0.7 ? 'rabbit' : 'bear';
    }
    if (plains > 0.15 || (mountain > 0.3 && mountain < 0.7)) {
      return r < 0.5 ? 'deer' : r < 0.8 ? 'rabbit' : 'lizard';
    }
    return r < 0.5 ? 'rabbit' : r < 0.75 ? 'deer' : null;
  }

  clearAll() {
    for (const a of this.animals) a.removeFrom(this.scene);
    this.animals = [];
  }
}
