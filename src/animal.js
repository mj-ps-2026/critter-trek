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

    const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

    this.body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), mat(orange));
    this.body.scale.set(1.4, 0.7, 1.9);
    this.body.position.y = 0.3;
    this.body.castShadow = true;
    this.group.add(this.body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mat(cream));
    chest.scale.set(1.1, 0.8, 1);
    chest.position.set(0, 0.2, -0.4);
    this.group.add(chest);

    const headMat = mat(orange);
    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), headMat);
    this.head.scale.set(1.5, 1.1, 1.4);
    this.head.position.set(0, 0.5, -0.52);
    this.head.castShadow = true;
    this.group.add(this.head);

    this.snout = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(cream));
    this.snout.scale.set(1.2, 0.7, 1.5);
    this.snout.position.set(0, 0.46, -0.68);
    this.group.add(this.snout);

    this.nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), mat(black));
    this.nose.position.set(0, 0.46, -0.74);
    this.group.add(this.nose);

    const earMat = mat(darkOrange);
    const earInnerMat = mat(cream);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), earMat);
      ear.position.set(side * 0.1, 0.62, -0.52);
      ear.rotation.z = side * 0.2;
      this.group.add(ear);

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 8), earInnerMat);
      inner.position.set(side * 0.1, 0.6, -0.52);
      inner.rotation.z = side * 0.2;
      this.group.add(inner);
    }

    const eyeMat = mat(black);
    const eyeWhiteMat = mat(0xFFFFFF);
    for (const side of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeWhiteMat);
      white.position.set(side * 0.09, 0.52, -0.6);
      this.group.add(white);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
      pupil.position.set(side * 0.09, 0.52, -0.6);
      this.group.add(pupil);
    }

    const legMat = mat(darkBrown);
    this.legs = [];
    const legPositions = [
      { x: 0.2, z: 0.3 },
      { x: -0.2, z: 0.3 },
      { x: 0.2, z: -0.3 },
      { x: -0.2, z: -0.3 },
    ];
    for (const lp of legPositions) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lp.x, 0.15, lp.z);
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8), legMat);
      legMesh.position.y = -0.125;
      legGroup.add(legMesh);
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }

    const tailMat = mat(orange);
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.35, 0.48);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), tailMat);
    tailMesh.position.y = 0.15;
    tailMesh.rotation.x = 0.3;
    this.tail.add(tailMesh);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 8), mat(cream));
    tailTip.position.set(0, 0.3, 0);
    tailTip.rotation.x = 0.3;
    this.tail.add(tailTip);

    this.group.add(this.tail);
  }

  update(dt, speed, isMoving, isSwimming) {
    this.clock += dt * speed * 4;

    if (isSwimming) {
      const phase = isMoving ? this.clock * 1.5 : Date.now() * 0.003;
      this.legs[0].rotation.x = Math.sin(phase) * 0.6;
      this.legs[1].rotation.x = -Math.sin(phase) * 0.6;
      this.legs[2].rotation.x = -Math.sin(phase) * 0.6;
      this.legs[3].rotation.x = Math.sin(phase) * 0.6;

      const bob = Math.sin(Date.now() * 0.004) * 0.04;
      this.body.position.y = 0.3 + bob;
      this.body.rotation.z = Math.sin(Date.now() * 0.002) * 0.08;
      this.head.position.y = 0.52 + bob * 0.8;

      this.tail.rotation.z = Math.sin(Date.now() * 0.003) * 0.4;
      return;
    }

    const legSwing = isMoving ? Math.sin(this.clock) * 0.5 : 0;
    this.legs[0].rotation.x = legSwing;
    this.legs[1].rotation.x = -legSwing;
    this.legs[2].rotation.x = -legSwing;
    this.legs[3].rotation.x = legSwing;

    const bob = isMoving ? Math.sin(this.clock * 2) * 0.025 : 0;
    this.body.position.y = 0.3 + bob;
    this.body.rotation.z = 0;
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
