import * as THREE from 'three';

const WOLF_HP = 12;
const WOLF_ATK = 4;
const WOLF_DEF = 1;

export { WOLF_HP, WOLF_ATK, WOLF_DEF };

export class Wolf {
  constructor(position, getHeight) {
    this.group = new THREE.Group();
    this.getHeight = getHeight;
    this.state = 'PATROL';
    this.targetPos = null;
    this.speed = 2;
    this.patrolSpeed = 1.2;
    this.chaseSpeed = 2.8;
    this.detectionRange = 22;
    this.attackRange = 1.8;
    this.waitTimer = 2 + Math.random() * 3;
    this.clock = 0;
    this.dead = false;
    this.group.position.copy(position);
    this.group.position.y = getHeight(position.x, position.z);
    this.buildWolf();
  }

  buildWolf() {
    const gray = 0x6B6B6B;
    const darkGray = 0x4A4A4A;
    const white = 0xD0D0D0;
    const black = 0x111111;

    const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true });

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 1.1), mat(gray));
    this.body.position.y = 0.35;
    this.body.castShadow = true;
    this.group.add(this.body);

    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.35), mat(gray));
    this.head.position.set(0, 0.55, -0.65);
    this.head.castShadow = true;
    this.group.add(this.head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.18), mat(darkGray));
    snout.position.set(0, 0.50, -0.85);
    this.group.add(snout);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), mat(darkGray));
      ear.position.set(s * 0.12, 0.68, -0.62);
      ear.rotation.z = s * 0.15;
      this.group.add(ear);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mat(black));
      eye.position.set(s * 0.10, 0.57, -0.73);
      this.group.add(eye);
    }

    this.legs = [];
    const legPositions = [
      { x: 0.25, z: 0.40 }, { x: -0.25, z: 0.40 },
      { x: 0.25, z: -0.40 }, { x: -0.25, z: -0.40 },
    ];
    for (const lp of legPositions) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 0.17, lp.z);
      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), mat(darkGray));
      legMesh.position.y = -0.14;
      legGroup.add(legMesh);
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }

    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.40, 0.60);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), mat(gray));
    tailMesh.position.y = 0.18;
    tailMesh.rotation.x = 0.5;
    this.tail.add(tailMesh);
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.06, 6), mat(white));
    tailTip.position.y = 0.35;
    tailTip.rotation.x = 0.5;
    this.tail.add(tailTip);
    this.group.add(this.tail);
  }

  update(dt, foxPos) {
    if (this.dead) return;
    this.clock += dt;
    switch (this.state) {
      case 'PATROL': return this.#patrol(dt, foxPos);
      case 'CHASE': return this.#chase(dt, foxPos);
    }
  }

  #patrol(dt, foxPos) {
    const dist = this.group.position.distanceTo(foxPos);
    if (dist < this.detectionRange) {
      this.state = 'CHASE';
      return 'chasing';
    }

    if (!this.targetPos || this.group.position.distanceTo(this.targetPos) < 1.5) {
      this.waitTimer -= dt;
      if (this.waitTimer > 0) {
        this.#animate(dt, 0, false);
        return 'patrolling';
      }
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 15;
      this.targetPos = new THREE.Vector3(
        this.group.position.x + Math.cos(angle) * r,
        0,
        this.group.position.z + Math.sin(angle) * r
      );
      this.targetPos.y = this.getHeight(this.targetPos.x, this.targetPos.z);
      this.waitTimer = 1.5 + Math.random() * 3;
    }

    this.#moveToward(this.targetPos, dt, this.patrolSpeed);
    this.#animate(dt, this.patrolSpeed, true);
    return 'patrolling';
  }

  #chase(dt, foxPos) {
    const dist = this.group.position.distanceTo(foxPos);
    if (dist < this.attackRange) {
      this.#animate(dt, 0, false);
      return 'attacking';
    }
    if (dist > 45) {
      this.state = 'PATROL';
      this.targetPos = null;
      return 'lost';
    }
    this.#moveToward(foxPos, dt, this.chaseSpeed);
    this.#animate(dt, this.chaseSpeed, true);
    return 'chasing';
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

  #animate(dt, speed, moving) {
    const phase = moving ? this.clock * speed * 4 : 0;
    this.legs[0].rotation.x = Math.sin(phase) * 0.4;
    this.legs[1].rotation.x = -Math.sin(phase) * 0.4;
    this.legs[2].rotation.x = -Math.sin(phase) * 0.4;
    this.legs[3].rotation.x = Math.sin(phase) * 0.4;

    const bob = moving ? Math.sin(phase * 2) * 0.02 : 0;
    this.body.position.y = 0.35 + bob;
    this.head.position.y = 0.55 + bob * 0.8;
  }

  getPosition() {
    return this.group.position;
  }

  removeFrom(scene) {
    this.dead = true;
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
