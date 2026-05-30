import * as THREE from 'three';
import {
  makeRabbit, makeDeer, makeBear, makeLizard, makeArcticFox, makeFrog,
  makeGlowbug, makeGoat, makeSnake, makeOwl, makeBison, makeHeron,
  makeJackrabbit, makeFish, makeSeaTurtle, makeJellyfish
} from './animalshapes.js';

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
    this.waterCreature = false;
    this.amphibious = false;

    switch (type) {
      case 'rabbit': this.speed = 5; this.fleeDist = 18; this.roamRadius = 10; this.hp = 3; this.atk = 1; this.def = 0; this.displayName = 'Rabbit'; this.icon = '🐇'; break;
      case 'deer':   this.speed = 4; this.fleeDist = 12; this.roamRadius = 25; this.hp = 8; this.atk = 3; this.def = 1; this.displayName = 'Deer'; this.icon = '🦌'; break;
      case 'lizard': this.speed = 3.5; this.fleeDist = 16; this.roamRadius = 8; this.hp = 4; this.atk = 1; this.def = 0; this.displayName = 'Lizard'; this.icon = '🦎'; break;
      case 'bear':   this.speed = 2.5; this.fleeDist = 8; this.roamRadius = 25; this.hp = 18; this.atk = 6; this.def = 2; this.displayName = 'Bear'; this.icon = '🐻'; break;
      case 'arcticfox': this.speed = 4; this.fleeDist = 14; this.roamRadius = 18; this.hp = 6; this.atk = 3; this.def = 1; this.displayName = 'Arctic Fox'; this.icon = '🦊'; break;
      case 'frog':    this.speed = 3; this.fleeDist = 18; this.roamRadius = 6; this.hp = 2; this.atk = 1; this.def = 0; this.displayName = 'Frog'; this.icon = '🐸'; break;
      case 'glowbug': this.speed = 3.5; this.fleeDist = 20; this.roamRadius = 8; this.hp = 1; this.atk = 1; this.def = 0; this.displayName = 'Glowbug'; this.icon = '✨'; break;
      case 'goat':    this.speed = 3.5; this.fleeDist = 8; this.roamRadius = 22; this.hp = 10; this.atk = 4; this.def = 2; this.displayName = 'Mountain Goat'; this.icon = '🐐'; break;
      case 'snake':   this.speed = 2.5; this.fleeDist = 14; this.roamRadius = 10; this.hp = 3; this.atk = 2; this.def = 0; this.displayName = 'Rattlesnake'; this.icon = '🐍'; break;
      case 'owl':     this.speed = 3; this.fleeDist = 12; this.roamRadius = 15; this.hp = 3; this.atk = 1; this.def = 0; this.displayName = 'Owl'; this.icon = '🦉'; break;
      case 'bison':   this.speed = 3; this.fleeDist = 7; this.roamRadius = 25; this.hp = 20; this.atk = 5; this.def = 3; this.displayName = 'Bison'; this.icon = '🦬'; break;
      case 'heron':   this.speed = 3; this.fleeDist = 12; this.roamRadius = 12; this.hp = 4; this.atk = 2; this.def = 0; this.displayName = 'Heron'; this.icon = '🦩'; break;
      case 'jackrabbit': this.speed = 6; this.fleeDist = 16; this.roamRadius = 12; this.hp = 3; this.atk = 1; this.def = 0; this.displayName = 'Jackrabbit'; this.icon = '🐇'; break;
      case 'fish':     this.speed = 3; this.fleeDist = 8; this.roamRadius = 15; this.hp = 1; this.atk = 1; this.def = 0; this.displayName = 'Fish'; this.icon = '🐟'; this.waterCreature = true; break;
      case 'seaturtle': this.speed = 1.5; this.fleeDist = 6; this.roamRadius = 20; this.hp = 6; this.atk = 2; this.def = 2; this.displayName = 'Sea Turtle'; this.icon = '🐢'; this.waterCreature = true; break;
      case 'jellyfish': this.speed = 1; this.fleeDist = 10; this.roamRadius = 10; this.hp = 2; this.atk = 1; this.def = 0; this.displayName = 'Jellyfish'; this.icon = '🪼'; this.waterCreature = true; break;
    }

    if (!this.waterCreature && this.hp <= 4) this.amphibious = true;

    const h = getHeight(position.x, position.z);
    this.group.position.set(position.x, this.waterCreature ? position.y : this.amphibious && h < 0.3 ? 0 : h, position.z);
    this.#build();
  }

  #build() {
    switch (this.type) {
      case 'rabbit': makeRabbit(this.group); break;
      case 'deer':   makeDeer(this.group); break;
      case 'lizard': makeLizard(this.group); break;
      case 'bear':   makeBear(this.group); break;
      case 'arcticfox': makeArcticFox(this.group); break;
      case 'frog':    makeFrog(this.group); break;
      case 'glowbug': makeGlowbug(this.group); break;
      case 'goat':    makeGoat(this.group); break;
      case 'snake':   makeSnake(this.group); break;
      case 'owl':     makeOwl(this.group); break;
      case 'bison':   makeBison(this.group); break;
      case 'heron':   makeHeron(this.group); break;
      case 'jackrabbit': makeJackrabbit(this.group); break;
      case 'fish':     makeFish(this.group); break;
      case 'seaturtle': makeSeaTurtle(this.group); break;
      case 'jellyfish': makeJellyfish(this.group); break;
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
      const ty = this.getHeight(tx, tz);
      if (!this.waterCreature && !this.amphibious && ty < 0.3) { this.waitTimer = 0.1; return; }
      if (this.waterCreature && ty >= 0.3) { this.waitTimer = 0.1; return; }
      const targetY = this.waterCreature ? p.y : this.amphibious && ty < 0.3 ? 0 : ty;
      this.targetPos = new THREE.Vector3(tx, targetY, tz);
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
    const targetY = this.waterCreature ? p.y : this.getHeight(tx, tz);
    const target = new THREE.Vector3(tx, targetY, tz);
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
    if (!this.waterCreature) {
      const h = this.getHeight(pos.x, pos.z);
      pos.y = this.amphibious && h < 0.3 ? 0 : h;
    }
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

    let waterCount = this.animals.filter(a => a.waterCreature).length;
    let landCount = this.animals.length - waterCount;
    const waterTarget = foxPos.y < 0.3 ? 20 : 5;
    const landTarget = 30 - waterTarget;
    let faunaAttempts = 0;
    while (faunaAttempts < 500) {
      if (waterCount >= waterTarget && landCount >= landTarget) break;
      faunaAttempts++;
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 20;
      const px = foxPos.x + Math.cos(a) * r;
      const pz = foxPos.z + Math.sin(a) * r;
      const py = this.getHeight(px, pz);
      const bio = this.getBiomeInfo(px, pz);

      if (py < 0.3 && waterCount < waterTarget) {
        const r2 = Math.random();
        const wType = r2 < 0.5 ? 'fish' : r2 < 0.7 ? 'jellyfish' : r2 < 0.85 ? 'seaturtle' : 'snake';
        const depth = wType === 'fish' ? -0.3 + Math.random() * 0.3 : wType === 'jellyfish' ? -0.6 + Math.random() * 0.3 : -0.3 + Math.random() * 0.2;
        const pos = new THREE.Vector3(px, depth, pz);
        const animal = new FaunaAnimal(wType, pos, this.getHeight);
        animal.waterCreature = true;
        animal.group.position.y = pos.y;
        this.scene.add(animal.group);
        this.animals.push(animal);
        waterCount++;
        continue;
      }

      if (py >= 0.3 && landCount < landTarget) {
        const type = this.#pickType(bio);
        if (!type) continue;
        const pos = new THREE.Vector3(px, py, pz);
        const animal = new FaunaAnimal(type, pos, this.getHeight);
        this.scene.add(animal.group);
        this.animals.push(animal);
        landCount++;
      }
    }

    for (const a of this.animals) {
      a.update(dt, foxPos);
    }
  }

  #weightedPick(pool) {
    const total = pool.reduce((s, e) => s + e[1], 0);
    let r = Math.random() * total;
    for (const [type, weight] of pool) {
      r -= weight;
      if (r <= 0) return type;
    }
    return pool[0][0];
  }

  #pickType(bio) {
    const { temp, moist, mountain, magic, continent, land } = bio;
    const desert = smoothstep(temp, 0.12, 0.42) * (1 - smoothstep(moist, -0.2, 0.1)) * (1 - mountain);
    const forest = smoothstep(temp, 0, 0.3) * smoothstep(moist, 0.2, 0.5) * (1 - mountain * 0.3);
    const tundra = 1 - smoothstep(temp, -0.35, 0);
    const swamp = smoothstep(-moist, 0, 0.3) * (1 - mountain) * land;
    const crystal = smoothstep(magic, 0.45, 0.7) * land;
    const canyon = smoothstep(temp, -0.1, 0.2) * smoothstep(-moist, -0.3, 0.05) * (1 - smoothstep(continent, 0.3, 0.5)) * (1 - mountain) * land;
    const badlands = smoothstep(temp, 0.08, 0.35) * (1 - smoothstep(moist, -0.3, 0.05)) * mountain * 1.2;
    const plains = Math.max(0, 1 - desert - forest - tundra - swamp - crystal - canyon - badlands - mountain) * 0.5;

    if (crystal > 0.3) return this.#weightedPick([['glowbug', 1], ['deer', 3], ['rabbit', 5]]);
    if (swamp > 0.3) return this.#weightedPick([['frog', 5], ['heron', 1], ['deer', 3], ['bear', 1]]);
    if (canyon > 0.2) return this.#weightedPick([['goat', 1], ['rabbit', 5]]);
    if (badlands > 0.2) return this.#weightedPick([['snake', 3], ['lizard', 4], ['rabbit', 5]]);
    if (desert > 0.3) return this.#weightedPick([['lizard', 4], ['jackrabbit', 3], ['rabbit', 5]]);
    if (tundra > 0.3) return this.#weightedPick([['arcticfox', 3], ['rabbit', 5], ['deer', 2], ['bear', 1]]);
    if (forest > 0.3) return this.#weightedPick([['deer', 3], ['rabbit', 5], ['owl', 1], ['bear', 1]]);
    if (plains > 0.15 || (mountain > 0.3 && mountain < 0.7)) {
      return this.#weightedPick([['bison', 1], ['deer', 3], ['rabbit', 5], ['lizard', 4]]);
    }
    return this.#weightedPick([['rabbit', 5], ['deer', 2]]);
  }

  clearAll() {
    for (const a of this.animals) a.removeFrom(this.scene);
    this.animals = [];
  }

  spawnAnimalAt(pos) {
    const bio = this.getBiomeInfo(pos.x, pos.z);
    const type = this.#pickType(bio);
    if (!type) return false;
    const y = this.getHeight(pos.x, pos.z);
    const spawnPos = new THREE.Vector3(
      pos.x + (Math.random() - 0.5) * 4,
      y > 0.3 ? y : -0.3,
      pos.z + (Math.random() - 0.5) * 4
    );
    const animal = new FaunaAnimal(type, spawnPos, this.getHeight);
    if (spawnPos.y < 0.3) animal.waterCreature = true;
    this.scene.add(animal.group);
    this.animals.push(animal);
    return true;
  }
}
