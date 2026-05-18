import * as THREE from 'three';

export class Animal {
  constructor() {
    this.group = new THREE.Group();
    this.clock = 0;
    this.buildFox();
  }

  buildFox() {
    const orange = 0xD4641A;
    const darkOrange = 0xB8500A;
    const cream = 0xF5F0E6;
    const darkBrown = 0x2A1A0A;
    const black = 0x111111;

    const flatMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true });

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.3, 0.85), flatMat(orange));
    this.body.position.y = 0.3;
    this.body.castShadow = true;
    this.group.add(this.body);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.15), flatMat(cream));
    chest.position.set(0, 0.2, -0.4);
    this.group.add(chest);

    const headMat = flatMat(orange);
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.28), headMat);
    this.head.position.set(0, 0.5, -0.52);
    this.head.castShadow = true;
    this.group.add(this.head);

    this.snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.12), flatMat(cream));
    this.snout.position.set(0, 0.46, -0.68);
    this.group.add(this.snout);

    this.nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), flatMat(black));
    this.nose.position.set(0, 0.46, -0.74);
    this.group.add(this.nose);

    const earMat = flatMat(darkOrange);
    const earInnerMat = flatMat(cream);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), earMat);
      ear.position.set(side * 0.1, 0.62, -0.52);
      ear.rotation.z = side * 0.2;
      this.group.add(ear);

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), earInnerMat);
      inner.position.set(side * 0.1, 0.6, -0.52);
      inner.rotation.z = side * 0.2;
      this.group.add(inner);
    }

    const eyeMat = flatMat(black);
    const eyeWhiteMat = flatMat(0xFFFFFF);
    for (const side of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeWhiteMat);
      white.position.set(side * 0.09, 0.52, -0.6);
      this.group.add(white);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeMat);
      pupil.position.set(side * 0.09, 0.52, -0.6);
      this.group.add(pupil);
    }

    const legMat = flatMat(darkBrown);
    this.legs = [];
    const legPositions = [
      { x: 0.2, z: 0.3 },  // front-left
      { x: -0.2, z: 0.3 }, // front-right
      { x: 0.2, z: -0.3 }, // back-left
      { x: -0.2, z: -0.3 }, // back-right
    ];
    for (const lp of legPositions) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 0.15, lp.z);
      const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.25, 0.07), legMat);
      legMesh.position.y = -0.125;
      legGroup.add(legMesh);
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }

    const tailMat = flatMat(orange);
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.35, 0.48);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 6), tailMat);
    tailMesh.position.y = 0.15;
    tailMesh.rotation.x = 0.3;
    this.tail.add(tailMesh);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 6), flatMat(cream));
    tailTip.position.set(0, 0.3, 0);
    tailTip.rotation.x = 0.3;
    this.tail.add(tailTip);

    this.group.add(this.tail);
  }

  update(dt, speed, isMoving) {
    this.clock += dt * speed * 4;

    const legSwing = isMoving ? Math.sin(this.clock) * 0.5 : 0;
    this.legs[0].rotation.x = legSwing;
    this.legs[1].rotation.x = -legSwing;
    this.legs[2].rotation.x = -legSwing;
    this.legs[3].rotation.x = legSwing;

    const bob = isMoving ? Math.sin(this.clock * 2) * 0.025 : 0;
    this.body.position.y = 0.3 + bob;
    this.head.position.y = 0.5 + bob * 0.8;

    const tailWag = isMoving ? Math.sin(this.clock * 0.5) * 0.3 : Math.sin(Date.now() * 0.002) * 0.1;
    this.tail.rotation.z = tailWag;
  }

  getPosition() {
    return this.group.position;
  }

  lookAt(target) {
    const pos = this.group.position;
    const dir = new THREE.Vector3().subVectors(target, pos);
    dir.y = 0;
    if (dir.length() > 0.001) {
      this.group.rotation.y = Math.atan2(dir.x, -dir.z);
    }
  }
}
