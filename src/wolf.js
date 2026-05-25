import * as THREE from 'three';

const ENEMY_TYPES = {
  wolf: {
    id: 'wolf', name: 'Wolf', icon: '🐺',
    hp: 12, atk: 4, def: 1,
    bodyColor: 0x6B6B6B, darkColor: 0x4A4A4A, accentColor: 0xD0D0D0,
    scale: 1, speed: 2, patrolSpeed: 1.2, chaseSpeed: 2.8,
    detectionRange: 22, attackRange: 1.8,
    biomes: ['forest', 'plains'], weight: 4,
  },
  scorpion: {
    id: 'scorpion', name: 'Scorpion', icon: '🦂',
    hp: 8, atk: 5, def: 0,
    bodyColor: 0x8B2500, darkColor: 0x5A1800, accentColor: 0xFF4422,
    scale: 0.55, speed: 2.5, patrolSpeed: 1.5, chaseSpeed: 3.5,
    detectionRange: 16, attackRange: 1.2,
    biomes: ['desert'], weight: 5,
  },
  yeti: {
    id: 'yeti', name: 'Yeti', icon: '❄️',
    hp: 20, atk: 7, def: 3,
    bodyColor: 0xE8E8F0, darkColor: 0xC0C0C8, accentColor: 0xFFFFFF,
    scale: 1.4, speed: 1.3, patrolSpeed: 0.7, chaseSpeed: 2.0,
    detectionRange: 28, attackRange: 2.2,
    biomes: ['tundra'], weight: 2,
  },
  croc: {
    id: 'croc', name: 'Crocodile', icon: '🐊',
    hp: 16, atk: 6, def: 2,
    bodyColor: 0x4A7A3A, darkColor: 0x2A5A2A, accentColor: 0x8ABA6A,
    scale: 1.1, speed: 1.8, patrolSpeed: 0.6, chaseSpeed: 3.0,
    detectionRange: 14, attackRange: 1.6,
    biomes: ['swamp'], weight: 3,
  },
  cougar: {
    id: 'cougar', name: 'Cougar', icon: '🐆',
    hp: 10, atk: 4, def: 1,
    bodyColor: 0xC8A060, darkColor: 0x8A6A30, accentColor: 0xE8D0A0,
    scale: 0.85, speed: 3, patrolSpeed: 1.8, chaseSpeed: 4.0,
    detectionRange: 26, attackRange: 1.6,
    biomes: ['mountains', 'badlands'], weight: 3,
  },
  golem: {
    id: 'golem', name: 'Crystal Golem', icon: '💎',
    hp: 24, atk: 8, def: 4,
    bodyColor: 0x66CCFF, darkColor: 0x2266AA, accentColor: 0xAAEEFF,
    scale: 1.2, speed: 1, patrolSpeed: 0.5, chaseSpeed: 1.5,
    detectionRange: 30, attackRange: 2.5,
    biomes: ['crystal'], weight: 1,
  },
  vulture: {
    id: 'vulture', name: 'Vulture', icon: '🦅',
    hp: 8, atk: 4, def: 1,
    bodyColor: 0x3A2A1A, darkColor: 0x1A0A00, accentColor: 0xCC3322,
    scale: 0.8, speed: 2.5, patrolSpeed: 1.5, chaseSpeed: 3.5,
    detectionRange: 28, attackRange: 1.5,
    biomes: ['canyon'], weight: 3,
  },
  boar: {
    id: 'boar', name: 'Wild Boar', icon: '🐗',
    hp: 14, atk: 5, def: 2,
    bodyColor: 0x5A3A1A, darkColor: 0x3A220A, accentColor: 0x8A5A2A,
    scale: 0.9, speed: 2.2, patrolSpeed: 1.0, chaseSpeed: 3.2,
    detectionRange: 20, attackRange: 1.5,
    biomes: ['plains', 'forest'], weight: 2,
  },
  bat: {
    id: 'bat', name: 'Cave Bat', icon: '🦇',
    hp: 5, atk: 2, def: 0,
    bodyColor: 0x3A2A2A, darkColor: 0x1A0A0A, accentColor: 0x6A4A4A,
    scale: 0.5, speed: 3.5, patrolSpeed: 2.0, chaseSpeed: 4.5,
    detectionRange: 18, attackRange: 0.8,
    biomes: ['cave'], weight: 5,
  },
  spider: {
    id: 'spider', name: 'Cave Spider', icon: '🕷️',
    hp: 10, atk: 5, def: 1,
    bodyColor: 0x2A1A3A, darkColor: 0x1A0A2A, accentColor: 0x6A3A8A,
    scale: 0.7, speed: 2.0, patrolSpeed: 1.0, chaseSpeed: 3.0,
    detectionRange: 20, attackRange: 1.2,
    biomes: ['cave'], weight: 3,
  },
  lavabeast: {
    id: 'lavabeast', name: 'Lava Beast', icon: '🔥',
    hp: 22, atk: 8, def: 3,
    bodyColor: 0x8A2A00, darkColor: 0x4A1500, accentColor: 0xFF6600,
    scale: 1.1, speed: 1.5, patrolSpeed: 0.8, chaseSpeed: 2.2,
    detectionRange: 24, attackRange: 2.0,
    biomes: ['cave'], weight: 2,
  },
  anaconda: {
    id: 'anaconda', name: 'Green Anaconda', icon: '🐍',
    hp: 14, atk: 5, def: 1,
    bodyColor: 0x3A7A2A, darkColor: 0x1A4A1A, accentColor: 0x5AAA3A,
    scale: 1.0, speed: 2.0, patrolSpeed: 0.8, chaseSpeed: 2.5,
    detectionRange: 18, attackRange: 1.6,
    biomes: ['forest'], weight: 2,
  },
};

const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true });

export class Wolf {
  constructor(position, getHeight, typeId = 'wolf') {
    const def = ENEMY_TYPES[typeId] || ENEMY_TYPES.wolf;
    this.typeDef = def;
    this.group = new THREE.Group();
    this.getHeight = getHeight;
    this.state = 'PATROL';
    this.targetPos = null;
    this.speed = def.speed;
    this.patrolSpeed = def.patrolSpeed;
    this.chaseSpeed = def.chaseSpeed;
    this.detectionRange = def.detectionRange;
    this.attackRange = def.attackRange;
    this.waitTimer = 2 + Math.random() * 3;
    this.clock = 0;
    this.dead = false;
    this.group.position.copy(position);
    this.group.position.y = getHeight(position.x, position.z);
    this.group.scale.setScalar(def.scale);
    this.#build();
  }

  #build() {
    const t = this.typeDef;
    const bc = t.bodyColor, dc = t.darkColor, ac = t.accentColor;

    const bodyH = t.id === 'yeti' ? 0.50 : t.id === 'croc' ? 0.20 : t.id === 'anaconda' ? 0.15 : 0.35;
    const bodyL = t.id === 'croc' ? 1.6 : t.id === 'anaconda' ? 2.0 : 1.1;
    const bodyY = bodyH / 2;

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.8, bodyH, bodyL), mat(bc));
    this.body.position.y = bodyY;
    this.body.castShadow = true;
    this.group.add(this.body);

    const headH = t.id === 'yeti' ? 0.26 : t.id === 'anaconda' ? 0.15 : 0.22;
    const headW = t.id === 'croc' ? 0.5 : t.id === 'anaconda' ? 0.28 : 0.35;
    const headL = t.id === 'croc' ? 0.45 : t.id === 'anaconda' ? 0.3 : 0.35;
    this.head = new THREE.Mesh(new THREE.BoxGeometry(headW, headH, headL), mat(bc));
    this.head.position.set(0, bodyY + 0.2, -bodyL * 0.5 - 0.08);
    this.head.castShadow = true;
    this.group.add(this.head);

    const snoutH = t.id === 'croc' ? 0.05 : 0.07;
    const snoutL = t.id === 'croc' ? 0.2 : 0.18;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, snoutH, snoutL), mat(dc));
    snout.position.set(0, bodyY + 0.15, -bodyL * 0.5 - 0.22);
    this.group.add(snout);

    if (t.id !== 'golem' && t.id !== 'anaconda') {
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), mat(dc));
        ear.position.set(s * 0.12, bodyY + 0.33, -bodyL * 0.5 - 0.02);
        ear.rotation.z = s * 0.15;
        this.group.add(ear);
      }
    }

    if (t.id === 'golem') {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), mat(ac));
      horn.position.set(0, bodyY + 0.45, -bodyL * 0.5);
      this.group.add(horn);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mat(0x111111));
      eye.position.set(s * 0.10, bodyY + 0.22, -bodyL * 0.5 - 0.13);
      this.group.add(eye);
      if (t.id === 'golem') {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(ac));
        glow.position.set(s * 0.10, bodyY + 0.22, -bodyL * 0.5 - 0.13);
        this.group.add(glow);
      }
    }

    this.legs = [];
    if (t.id === 'anaconda') {
      for (const lp of [{ x: 0.06, z: 0.4 }, { x: -0.06, z: 0.4 }, { x: 0.06, z: -0.35 }, { x: -0.06, z: -0.35 }]) {
        const legGroup = new THREE.Group();
        legGroup.position.set(lp.x, 0, lp.z);
        const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), mat(dc));
        legMesh.position.y = 0;
        legGroup.add(legMesh);
        this.group.add(legGroup);
        this.legs.push(legGroup);
      }
    } else {
      const legZ = bodyL * 0.36;
      const legX = 0.25;
      const legH = t.id === 'croc' ? 0.12 : t.id === 'yeti' ? 0.35 : 0.28;
      const legY = (t.id === 'croc' ? 0.06 : t.id === 'yeti' ? 0.17 : 0.17) - legH / 2;
    const legPositions = [
      { x: legX, z: legZ }, { x: -legX, z: legZ },
      { x: legX, z: -legZ }, { x: -legX, z: -legZ },
    ];
    for (const lp of legPositions) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 0, lp.z);
      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, legH, 0.08), mat(dc));
      legMesh.position.y = legY;
      legGroup.add(legMesh);
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }
    }

    if (t.id === 'scorpion') {
      const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), mat(ac));
      stinger.position.set(0, 0.15, bodyL * 0.5 + 0.1);
      stinger.rotation.x = 0.6;
      this.group.add(stinger);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.15, 5), mat(dc));
      seg.position.set(0, 0.05, bodyL * 0.5 + 0.05);
      seg.rotation.x = 0.3;
      this.group.add(seg);
    }

    if (t.id === 'anaconda') {
      for (let i = 0; i < 3; i++) {
        const r = 0.09 - i * 0.02;
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, 0.25, 5), mat(t.id === 'anaconda' ? dc : bc));
        seg.position.set(0, 0.07, bodyL * 0.5 + 0.1 + i * 0.2);
        seg.rotation.x = 0.2 + i * 0.1;
        this.group.add(seg);
      }
    }

    if (t.id === 'croc') {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), mat(dc));
      tail.position.set(0, 0.08, bodyL * 0.5 + 0.15);
      tail.rotation.x = 0.3;
      this.group.add(tail);
    }

    if (t.id === 'golem') {
      for (const s of [-1, 1]) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), mat(ac));
        spine.position.set(s * 0.2, bodyY + bodyH * 0.3, -bodyL * 0.2);
        spine.rotation.x = 0.3;
        this.group.add(spine);
      }
    }

    if (t.id === 'bat') {
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 4), mat(dc));
        wing.rotation.z = s * 0.7;
        wing.rotation.x = 0.3;
        wing.position.set(s * 0.3, 0.1, 0);
        this.group.add(wing);
      }
    }

    if (t.id === 'vulture') {
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 4), mat(dc));
        wing.rotation.z = s * 0.5;
        wing.rotation.x = 0.2;
        wing.position.set(s * 0.35, bodyY + 0.05, 0);
        this.group.add(wing);
      }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), mat(ac));
      head.position.set(0, bodyY + 0.35, -bodyL * 0.5 - 0.12);
      this.group.add(head);
    }

    if (t.id === 'spider') {
      const extraLegs = [
        { x: 0.25, z: 0.55 }, { x: -0.25, z: 0.55 },
        { x: 0.25, z: -0.55 }, { x: -0.25, z: -0.55 },
      ];
      for (const lp of extraLegs) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.25, 4), mat(dc));
        leg.position.set(lp.x * 1.2, 0, lp.z);
        leg.rotation.z = lp.x > 0 ? 0.4 : -0.4;
        this.group.add(leg);
      }
      for (const s of [-1, 1]) {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.08, 4), mat(ac));
        fang.position.set(s * 0.04, bodyY + 0.08, -bodyL * 0.5 - 0.1);
        this.group.add(fang);
      }
    }

    if (t.id === 'lavabeast') {
      const glowMat = new THREE.MeshStandardMaterial({
        color: 0xFF4400, emissive: 0xFF2200, emissiveIntensity: 0.4, flatShading: true,
      });
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), glowMat);
        spike.position.set((Math.random() - 0.5) * 0.5, bodyY + bodyH * 0.4, (Math.random() - 0.5) * bodyL * 0.6);
        spike.rotation.x = Math.random() * 0.5;
        this.group.add(spike);
      }
    }

    this.tail = new THREE.Group();
    if (t.id !== 'scorpion' && t.id !== 'croc' && t.id !== 'golem' && t.id !== 'anaconda') {
      this.tail.position.set(0, bodyY + 0.05, bodyL * 0.5 + 0.05);
      const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 6), mat(bc));
      tailMesh.position.y = 0.15;
      tailMesh.rotation.x = 0.5;
      this.tail.add(tailMesh);
      const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.06, 6), mat(ac));
      tailTip.position.y = 0.3;
      tailTip.rotation.x = 0.5;
      this.tail.add(tailTip);
      this.group.add(this.tail);
    }
  }

  update(dt, foxPos, hostile = true) {
    if (this.dead) return;
    this.clock += dt;
    if (!hostile && this.state === 'CHASE') {
      this.state = 'PATROL';
      this.targetPos = null;
    }
    switch (this.state) {
      case 'PATROL': return this.#patrol(dt, foxPos, hostile);
      case 'CHASE': return this.#chase(dt, foxPos);
    }
  }

  #patrol(dt, foxPos, hostile) {
    if (hostile) {
      const dist = this.group.position.distanceTo(foxPos);
      if (dist < this.detectionRange) {
        this.state = 'CHASE';
        return 'chasing';
      }
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
    if (dist > 60) {
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
    if (this.legs.length >= 4) {
      this.legs[0].rotation.x = Math.sin(phase) * 0.4;
      this.legs[1].rotation.x = -Math.sin(phase) * 0.4;
      this.legs[2].rotation.x = -Math.sin(phase) * 0.4;
      this.legs[3].rotation.x = Math.sin(phase) * 0.4;
    }
    const bob = moving ? Math.sin(phase * 2) * 0.02 : 0;
    if (this.body) this.body.position.y = (this.typeDef.id === 'croc' ? 0.1 : this.typeDef.id === 'yeti' ? 0.25 : this.typeDef.id === 'anaconda' ? 0.075 : 0.175) + bob;
    if (this.head) this.head.position.y = (this.body ? this.body.position.y : 0) + (this.typeDef.id === 'anaconda' ? 0.12 : 0.2) + bob * 0.8;
  }

  getPosition() { return this.group.position; }

  removeFrom(scene) {
    this.dead = true;
    scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}

function smoothstep(t, lo, hi) {
  t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

export function pickEnemyType(getBiomeInfo, x, z) {
  const bio = getBiomeInfo(x, z);
  const { temp, moist, mountain, magic, continent, land } = bio;
  const desert = smoothstep(temp, 0.15, 0.45) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain);
  const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain);
  const tundra = 1 - smoothstep(temp, -0.35, 0);
  const swamp = smoothstep(temp, 0.1, 0.35) * smoothstep(moist, 0.4, 0.7) * (1 - mountain);
  const crystal = magic ? Math.max(0, (magic - 0.3) * 2) : 0;
  const mountains = mountain;
  const canyon = smoothstep(temp, -0.1, 0.2) * smoothstep(-moist, -0.3, 0.05) * (1 - smoothstep(continent, 0.3, 0.5)) * (1 - mountain) * land;
  const badlands = smoothstep(temp, 0.08, 0.35) * (1 - smoothstep(moist, -0.3, 0.05)) * mountain * 1.2;

  const weights = {};
  weights.desert = desert;
  weights.forest = forest;
  weights.tundra = tundra;
  weights.swamp = swamp;
  weights.crystal = crystal;
  weights.mountains = mountains;
  weights.canyon = canyon;
  weights.plains = Math.max(0, 1 - desert - forest - tundra - swamp - crystal - canyon - badlands - mountains);
  weights.badlands = badlands;

  const candidates = [];
  for (const def of Object.values(ENEMY_TYPES)) {
    let totalW = 0;
    for (const b of def.biomes) {
      totalW += (weights[b] || 0) * def.weight;
    }
    if (totalW > 0.05) candidates.push({ def, weight: totalW });
  }
  if (candidates.length === 0) candidates.push({ def: ENEMY_TYPES.wolf, weight: 1 });

  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.def.id;
  }
  return candidates[candidates.length - 1].def.id;
}
