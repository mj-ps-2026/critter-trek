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

    switch (type) {
      case 'rabbit': this.speed = 5; this.fleeDist = 10; this.roamRadius = 10; break;
      case 'deer':   this.speed = 4; this.fleeDist = 20; this.roamRadius = 25; break;
      case 'lizard': this.speed = 3.5; this.fleeDist = 8; this.roamRadius = 8; break;
      case 'bear':   this.speed = 2.5; this.fleeDist = 16; this.roamRadius = 20; break;
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
    }
  }

  #buildRabbit() {
    const g = this.group;
    const white = 0xE8E0D0, pink = 0xFFB5B5, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(white));
    body.position.y = 0.1;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mat(white));
    head.position.set(0, 0.15, -0.1);
    g.add(head);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), mat(white));
      ear.position.set(s * 0.04, 0.24, -0.08);
      ear.rotation.z = s * 0.25;
      g.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 4), mat(pink));
      inner.position.set(s * 0.04, 0.22, -0.08);
      inner.rotation.z = s * 0.25;
      g.add(inner);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), mat(black));
      eye.position.set(s * 0.035, 0.16, -0.13);
      g.add(eye);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat(white));
    tail.position.set(0, 0.08, 0.1);
    g.add(tail);

    for (const [x, z] of [[0.04, 0.05], [-0.04, 0.05], [0.04, -0.05], [-0.04, -0.05]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.06, 4), mat(white));
      leg.position.set(x, 0.03, z);
      g.add(leg);
    }
  }

  #buildDeer() {
    const g = this.group;
    const brown = 0x8B6914, dark = 0x5C3D1A, white = 0xF5F0E6;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.45), mat(brown));
    body.position.y = 0.25;
    body.castShadow = true;
    g.add(body);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), mat(brown));
    neck.position.set(0, 0.35, -0.2);
    g.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.15), mat(brown));
    head.position.set(0, 0.42, -0.28);
    head.castShadow = true;
    g.add(head);

    for (const s of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.12, 4), mat(dark));
      ant.position.set(s * 0.06, 0.52, -0.25);
      ant.rotation.z = s * 0.4;
      g.add(ant);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.06, 4), mat(dark));
      tip.position.set(s * 0.1, 0.56, -0.22);
      tip.rotation.z = s * 0.7;
      g.add(tip);
    }

    for (const [x, z] of [[0.1, 0.15], [-0.1, 0.15], [0.1, -0.15], [-0.1, -0.15]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.18, 4), mat(dark));
      leg.position.set(x, 0.09, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat(white));
    tail.position.set(0, 0.3, 0.25);
    g.add(tail);
  }

  #buildLizard() {
    const g = this.group;
    const green = 0x4a8a3a, dark = 0x2a5a2a, yellow = 0xddcc44;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.12), mat(green));
    body.position.y = 0.02;
    g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.035), mat(green));
    head.position.set(0, 0.025, -0.075);
    g.add(head);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 4), mat(dark));
    tail.position.set(0, 0.01, 0.08);
    tail.rotation.x = 0.3;
    g.add(tail);

    for (const [x, z] of [[0.015, 0.035], [-0.015, 0.035], [0.015, -0.035], [-0.015, -0.035]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.015, 4), mat(dark));
      leg.position.set(x, -0.005, z);
      g.add(leg);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), mat(yellow));
      eye.position.set(s * 0.01, 0.03, -0.085);
      g.add(eye);
    }
  }

  #buildBear() {
    const g = this.group;
    const brown = 0x4A2F1A, dark = 0x2A1A0A;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.65), mat(brown));
    body.position.y = 0.3;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.18), mat(brown));
    head.position.set(0, 0.45, -0.38);
    head.castShadow = true;
    g.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.06), mat(dark));
    snout.position.set(0, 0.42, -0.48);
    g.add(snout);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5), mat(brown));
      ear.position.set(s * 0.08, 0.52, -0.35);
      g.add(ear);
    }

    for (const [x, z] of [[0.18, 0.25], [-0.18, 0.25], [0.18, -0.25], [-0.18, -0.25]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 5), mat(dark));
      leg.position.set(x, 0.1, z);
      g.add(leg);
    }
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

    const targetCount = 30;
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
    const { temp, moist, mountain, continent } = bio;
    const desert = smoothstep(temp, 0.15, 0.45) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain);
    const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain);
    const tundra = (1 - smoothstep(temp, -0.35, 0)) * (1 - mountain);
    const plains = Math.max(0, 1 - desert - forest - tundra - mountain) * 0.5;

    if (desert > 0.3) return 'lizard';
    if (tundra > 0.3) return 'rabbit';
    if (forest > 0.3) {
      const r = Math.random();
      return r < 0.5 ? 'deer' : r < 0.8 ? 'rabbit' : 'bear';
    }
    if (plains > 0.15 || (mountain > 0.3 && mountain < 0.7)) {
      return Math.random() < 0.6 ? 'deer' : 'rabbit';
    }
    return Math.random() < 0.3 ? 'rabbit' : null;
  }

  clearAll() {
    for (const a of this.animals) a.removeFrom(this.scene);
    this.animals = [];
  }
}
