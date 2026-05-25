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
    this.waterCreature = false;

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
      case 'frog':    this.#buildFrog(); break;
      case 'glowbug': this.#buildGlowbug(); break;
      case 'goat':    this.#buildGoat(); break;
      case 'snake':   this.#buildSnake(); break;
      case 'owl':     this.#buildOwl(); break;
      case 'bison':   this.#buildBison(); break;
      case 'heron':   this.#buildHeron(); break;
      case 'jackrabbit': this.#buildJackrabbit(); break;
      case 'fish':     this.#buildFish(); break;
      case 'seaturtle': this.#buildSeaTurtle(); break;
      case 'jellyfish': this.#buildJellyfish(); break;
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

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), mat(0x111111));
      eye.position.set(s * 0.1, 1.15, -1.05);
      g.add(eye);
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

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0x111111));
      eye.position.set(s * 0.12, 1.15, -1.08);
      g.add(eye);
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

  #buildFrog() {
    const g = this.group;
    const green = 0x4CAF50, light = 0x81C784, dark = 0x2E7D32, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat(green));
    body.scale.set(1, 0.6, 1.4);
    body.position.y = 0.12;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mat(green));
    head.position.set(0, 0.18, -0.28);
    head.scale.set(1, 0.7, 0.8);
    g.add(head);

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(green));
      eye.position.set(s * 0.1, 0.28, -0.3);
      g.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(black));
      pupil.position.set(s * 0.1, 0.29, -0.33);
      g.add(pupil);
    }

    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.15, 4), mat(dark));
      leg.position.set(s * 0.15, 0.02, 0.14);
      leg.rotation.x = 0.5;
      g.add(leg);
    }

    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.08, 4), mat(dark));
      leg.position.set(s * 0.09, 0.02, -0.14);
      g.add(leg);
    }
  }

  #buildGlowbug() {
    const g = this.group;
    const hue = Math.random() * 0.3 + 0.7;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.4),
      emissive: new THREE.Color().setHSL(hue, 0.6, 0.2),
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.2,
      flatShading: true,
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 5), bodyMat);
    body.position.y = 0.08;
    g.add(body);

    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.06, 4), new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.3, 0.6),
        transparent: true, opacity: 0.5, flatShading: true,
      }));
      wing.position.set(s * 0.1, 0.1, 0);
      wing.rotation.z = s * 0.3;
      g.add(wing);
    }

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 5), new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.6),
      emissive: new THREE.Color().setHSL(hue, 0.8, 0.4),
      emissiveIntensity: 0.8,
      flatShading: true,
    }));
    glow.position.set(0, 0.12, -0.08);
    g.add(glow);

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 4), mat(0x111111));
      eye.position.set(s * 0.02, 0.09, -0.07);
      g.add(eye);
    }
  }

  #buildGoat() {
    const g = this.group;
    const fur = 0xC8C0B0, dark = 0x6A6050, horn = 0x4A3A2A, black = 0x111111;

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.9), mat(fur));
    body.position.y = 0.4;
    body.castShadow = true;
    g.add(body);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.15), mat(fur));
    neck.position.set(0, 0.6, -0.4);
    g.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.3), mat(fur));
    head.position.set(0, 0.72, -0.55);
    g.add(head);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), mat(dark));
    beard.position.set(0, 0.58, -0.65);
    beard.rotation.x = 0.3;
    g.add(beard);

    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.3, 4), mat(horn));
      horn.position.set(s * 0.1, 0.88, -0.48);
      horn.rotation.z = s * 0.3;
      horn.rotation.x = -0.4;
      g.add(horn);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(black));
      eye.position.set(s * 0.07, 0.76, -0.65);
      g.add(eye);
    }

    for (const [x, z] of [[0.2, 0.3], [-0.2, 0.3], [0.2, -0.3], [-0.2, -0.3]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 4), mat(dark));
      leg.position.set(x, 0.15, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), mat(fur));
    tail.position.set(0, 0.5, 0.5);
    g.add(tail);
  }

  #buildSnake() {
    const g = this.group;
    const tan = 0xC4A46A, pattern = 0x8B6B3A, dark = 0x5A3A1A, black = 0x111111;

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 0.5, 5), mat(tan));
    body.position.y = 0.03;
    body.rotation.x = 0.2;
    g.add(body);

    const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.3, 5), mat(pattern));
    mid.position.set(0, 0.02, 0.35);
    mid.rotation.x = -0.1;
    g.add(mid);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.15, 5), mat(pattern));
    tail.position.set(0, 0.02, 0.52);
    tail.rotation.x = 0.3;
    g.add(tail);

    const rattle = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 4), mat(dark));
    rattle.position.set(0, 0.04, 0.6);
    g.add(rattle);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.08), mat(tan));
    head.position.set(0, 0.04, -0.28);
    g.add(head);

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), mat(black));
      eye.position.set(s * 0.025, 0.05, -0.29);
      g.add(eye);
    }
  }

  #buildOwl() {
    const g = this.group;
    const brown = 0x6A4A2A, light = 0xC8B08A, dark = 0x3A2A1A, yellow = 0xDDCC44, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat(brown));
    body.scale.set(1, 0.85, 0.9);
    body.position.y = 0.35;
    g.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), mat(light));
    belly.scale.set(0.8, 0.7, 0.5);
    belly.position.set(0, 0.3, -0.12);
    g.add(belly);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), mat(brown));
    head.position.set(0, 0.55, -0.15);
    g.add(head);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), mat(dark));
      ear.position.set(s * 0.07, 0.66, -0.15);
      ear.rotation.z = s * 0.3;
      g.add(ear);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), mat(yellow));
      eye.position.set(s * 0.06, 0.56, -0.24);
      g.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(black));
      pupil.position.set(s * 0.06, 0.56, -0.26);
      g.add(pupil);
    }

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), mat(yellow));
    beak.position.set(0, 0.53, -0.28);
    beak.rotation.x = 0.3;
    g.add(beak);

    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 4), mat(dark));
      wing.position.set(s * 0.22, 0.32, 0);
      wing.rotation.z = s * 0.6;
      g.add(wing);
    }
  }

  #buildBison() {
    const g = this.group;
    const brown = 0x4A3020, dark = 0x2A1A10, black = 0x111111;

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 1.6), mat(brown));
    body.position.y = 0.6;
    body.castShadow = true;
    g.add(body);

    const hump = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), mat(dark));
    hump.position.set(0, 0.85, -0.2);
    g.add(hump);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.5), mat(brown));
    head.position.set(0, 0.7, -1.0);
    head.castShadow = true;
    g.add(head);

    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), mat(black));
      horn.position.set(s * 0.15, 0.85, -0.95);
      horn.rotation.z = s * 0.4;
      g.add(horn);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0x111111));
      eye.position.set(s * 0.12, 0.78, -1.15);
      g.add(eye);
    }

    for (const [x, z] of [[0.4, 0.6], [-0.4, 0.6], [0.4, -0.6], [-0.4, -0.6]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 5), mat(dark));
      leg.position.set(x, 0.22, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.25, 4), mat(dark));
    tail.position.set(0, 0.6, 0.85);
    tail.rotation.x = 0.4;
    g.add(tail);

    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), mat(dark));
    tuft.position.set(0, 0.65, 0.95);
    g.add(tuft);
  }

  #buildHeron() {
    const g = this.group;
    const white = 0xE8E0D0, dark = 0x4A3A2A, orange = 0xDD6622, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat(white));
    body.scale.set(1, 0.8, 1.3);
    body.position.y = 0.5;
    g.add(body);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 5), mat(white));
    neck.position.set(0, 0.75, -0.2);
    g.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), mat(white));
    head.position.set(0, 0.95, -0.3);
    g.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.15, 4), mat(orange));
    beak.position.set(0, 0.94, -0.4);
    beak.rotation.x = 0.2;
    g.add(beak);

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), mat(black));
      eye.position.set(s * 0.025, 0.96, -0.32);
      g.add(eye);
    }

    for (const [x, z] of [[0.06, 0.22], [-0.06, 0.22]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 4), mat(orange));
      leg.position.set(x, 0.2, z);
      g.add(leg);
    }

    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.06, 4), mat(0xC8C0B0));
      wing.position.set(s * 0.18, 0.5, 0);
      wing.rotation.z = s * 0.5;
      g.add(wing);
    }
  }

  #buildJackrabbit() {
    const g = this.group;
    const tan = 0xC4A46A, light = 0xE8D8B8, dark = 0x8A6A3A, black = 0x111111;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat(tan));
    body.scale.set(1.2, 0.9, 1.1);
    body.position.y = 0.25;
    g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), mat(tan));
    head.position.set(0, 0.38, -0.28);
    g.add(head);

    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.3, 4), mat(tan));
      ear.position.set(s * 0.08, 0.6, -0.22);
      ear.rotation.z = s * 0.2;
      g.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 4), mat(light));
      inner.position.set(s * 0.08, 0.55, -0.22);
      inner.rotation.z = s * 0.2;
      g.add(inner);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), mat(black));
      eye.position.set(s * 0.07, 0.4, -0.34);
      g.add(eye);
    }

    for (const [x, z] of [[0.1, 0.12], [-0.1, 0.12], [0.14, -0.12], [-0.14, -0.12]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.18, 4), mat(dark));
      leg.position.set(x, 0.09, z);
      g.add(leg);
    }

    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), mat(light));
    tail.position.set(0, 0.22, 0.28);
    g.add(tail);
  }

  #buildFish() {
    const g = this.group;
    const hue = Math.random() * 0.6 + 0.05;
    const sat = 0.7 + Math.random() * 0.3;
    const light = 0.5 + Math.random() * 0.3;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, sat, light),
      emissive: new THREE.Color().setHSL(hue, sat * 0.5, light * 0.2),
      emissiveIntensity: 0.4,
      roughness: 0.4,
      flatShading: true,
    });
    const finMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, sat * 0.6, light * 0.5),
      roughness: 0.6,
      flatShading: true,
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 7), bodyMat);
    body.scale.set(1, 0.3, 0.5);
    g.add(body);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), finMat);
    tail.position.set(0, 0, 0.16);
    tail.rotation.x = 0.2;
    g.add(tail);

    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 3), finMat);
      fin.position.set(s * 0.12, 0, 0);
      fin.rotation.z = s * 0.3;
      g.add(fin);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), mat(0x111111));
      eye.position.set(s * 0.06, 0.02, -0.14);
      g.add(eye);
    }
  }

  #buildSeaTurtle() {
    const g = this.group;
    const shell = 0x5a7a3a, skin = 0x7a9a5a, dark = 0x3a4a2a;

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat(skin));
    body.scale.set(1.1, 0.4, 0.8);
    g.add(body);

    const shellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mat(shell));
    shellMesh.scale.set(1, 0.35, 0.8);
    shellMesh.position.y = 0.04;
    g.add(shellMesh);

    for (const s of [-1, 1]) {
      const flipper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.18, 4), mat(dark));
      flipper.position.set(s * 0.12, -0.03, 0.12);
      flipper.rotation.z = s * 0.4;
      flipper.rotation.x = -0.3;
      g.add(flipper);
      const front = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.18, 4), mat(dark));
      front.position.set(s * 0.12, -0.03, -0.12);
      front.rotation.z = s * 0.4;
      front.rotation.x = 0.3;
      g.add(front);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat(0x111111));
      eye.position.set(s * 0.06, 0, -0.18);
      g.add(eye);
    }
  }

  #buildJellyfish() {
    const g = this.group;
    const hue = Math.random() * 0.2 + 0.75;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.5, 0.5),
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
      metalness: 0.1,
      flatShading: true,
    });

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), bodyMat);
    bell.scale.set(1, 0.5, 1);
    g.add(bell);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.008, 0.2, 3), bodyMat);
      tentacle.position.set(Math.cos(a) * 0.06, -0.1, Math.sin(a) * 0.06);
      tentacle.rotation.x = Math.cos(a) * 0.2;
      tentacle.rotation.z = Math.sin(a) * 0.2;
      g.add(tentacle);
    }

    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), mat(0x111111));
      eye.position.set(s * 0.04, 0.04, -0.1);
      g.add(eye);
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
      if (!this.waterCreature && ty < 0.3) { this.waitTimer = 0.1; return; }
      if (this.waterCreature && ty >= 0.3) { this.waitTimer = 0.1; return; }
      this.targetPos = new THREE.Vector3(tx, this.waterCreature ? p.y : ty, tz);
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
      const bio = this.getBiomeInfo(px, pz);

      if (py < 0.3) {
        if (bio.land < 0.3) {
          const r2 = Math.random();
          const wType = r2 < 0.6 ? 'fish' : r2 < 0.85 ? 'jellyfish' : 'seaturtle';
          const depth = wType === 'fish' ? -0.5 + Math.random() * 0.4 : wType === 'jellyfish' ? -0.8 + Math.random() * 0.4 : -0.4 + Math.random() * 0.3;
          const pos = new THREE.Vector3(px, depth, pz);
          const animal = new FaunaAnimal(wType, pos, this.getHeight);
          animal.group.position.y = pos.y;
          this.scene.add(animal.group);
          this.animals.push(animal);
        }
        continue;
      }

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
    if (swamp > 0.3) return this.#weightedPick([['frog', 5], ['heron', 1], ['deer', 2], ['bear', 1]]);
    if (canyon > 0.2) return this.#weightedPick([['goat', 3], ['rabbit', 5]]);
    if (badlands > 0.2) return this.#weightedPick([['snake', 3], ['lizard', 4], ['rabbit', 5]]);
    if (desert > 0.3) return this.#weightedPick([['lizard', 4], ['jackrabbit', 3], ['rabbit', 5]]);
    if (tundra > 0.3) return this.#weightedPick([['arcticfox', 3], ['rabbit', 5], ['deer', 2], ['bear', 1]]);
    if (forest > 0.3) return this.#weightedPick([['deer', 3], ['rabbit', 5], ['owl', 2], ['bear', 1]]);
    if (plains > 0.15 || (mountain > 0.3 && mountain < 0.7)) {
      return this.#weightedPick([['bison', 1], ['deer', 3], ['rabbit', 5], ['lizard', 4]]);
    }
    return this.#weightedPick([['rabbit', 5], ['deer', 2]]);
  }

  clearAll() {
    for (const a of this.animals) a.removeFrom(this.scene);
    this.animals = [];
  }
}
