import * as THREE from 'three';
import { furMaterial, furVariation, smoothDisplace } from './realism.js';
import { buildBody, buildLimb, buildEars, buildHead, addEyes } from './animalshapes.js';

export class Animal {
  constructor() {
    this.group = new THREE.Group();
    this.clock = 0;
    this.buildFox();
  }

  buildFox() {
    const orange = 0xD4641A;
    const bodyColor = furVariation(orange);

    // Organic body using CatmullRomCurve3 (sleek fox shape)
    const body = buildBody(
      [[0, 0.2, 0.3], [0, 0.28, 0.12], [0, 0.34, -0.02], [0, 0.38, -0.16], [0, 0.42, -0.28], [0, 0.5, -0.38]],
      [0.16, 0.2, 0.24, 0.22, 0.16, 0.08], 14, 10
    );
    body.material.dispose();
    body.material = furMaterial(bodyColor, { variation: 18, roughness: 0.85 });
    smoothDisplace(body.geometry, 0.015);
    body.castShadow = true;
    this.body = body;
    this.group.add(body);

    // Chest (lighter color)
    const chestColor = furVariation(0xF5F0E6);
    const chest = buildBody(
      [[0, 0.2, -0.1], [0, 0.25, -0.18], [0, 0.28, -0.26]],
      [0.1, 0.12, 0.07], 6, 7
    );
    chest.material.dispose();
    chest.material = furMaterial(chestColor, { variation: 12, roughness: 0.85 });
    smoothDisplace(chest.geometry, 0.01);
    this.group.add(chest);

    // Head
    const head = buildHead([0, 0.62, -0.42], 1, 0.12, bodyColor);
    this.head = head;
    this.group.add(head);

    // Snout
    const snoutMat = furMaterial(chestColor, { variation: 10, roughness: 0.8 });
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), snoutMat);
    snout.position.set(0, 0.58, -0.56);
    snout.scale.set(1.4, 0.7, 1.6);
    smoothDisplace(snout.geometry, 0.008);
    this.group.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    nose.position.set(0, 0.58, -0.62);
    this.group.add(nose);

    // Ears
    buildEars(this.group, [0.1, 0.72, -0.36], 0.16, 0.045, bodyColor, furVariation(0xF5F0E6));

    // Eyes
    addEyes(this.group, [0.07, 0.64, -0.46], [-0.07, 0.64, -0.46], 0x8B5E3C, 0.8);

    // Legs
    this.legs = [];
    const legColor = furVariation(0x2A1A0A);
    for (const [offX, offZ] of [[0.15, 0.2], [-0.15, 0.2], [0.15, -0.2], [-0.15, -0.2]]) {
      const legGroup = new THREE.Group();
      const leg = buildLimb(
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, -0.25, 0),
        0.035, 0.03, 5, legColor
      );
      if (leg) {
        smoothDisplace(leg.geometry, 0.008);
        legGroup.add(leg);
      }
      legGroup.position.set(offX, 0.15, offZ);
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }

    // Tail (bushy, curving up)
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.3, 0.45);
    const tailBottom = new THREE.Vector3(0, 0, 0);
    const tailMid = new THREE.Vector3(0.05, 0.15, 0);
    const tailTip = new THREE.Vector3(0, 0.3, -0.02);
    const tailSeg1 = buildLimb(tailBottom, tailMid, 0.06, 0.05, 5, bodyColor);
    if (tailSeg1) { smoothDisplace(tailSeg1.geometry, 0.008); this.tail.add(tailSeg1); }
    const tailSeg2 = buildLimb(tailMid, tailTip, 0.05, 0.035, 5, bodyColor);
    if (tailSeg2) { smoothDisplace(tailSeg2.geometry, 0.008); this.tail.add(tailSeg2); }
    const tailFluff = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), furMaterial(chestColor, { variation: 10, roughness: 0.85 }));
    tailFluff.position.copy(tailTip);
    smoothDisplace(tailFluff.geometry, 0.01);
    this.tail.add(tailFluff);
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
      this.body.position.y = bob;
      this.body.rotation.z = Math.sin(Date.now() * 0.002) * 0.08;
      this.head.position.y = 0.62 + bob * 0.8;

      this.tail.rotation.z = Math.sin(Date.now() * 0.003) * 0.4;
      return;
    }

    const legSwing = isMoving ? Math.sin(this.clock) * 0.5 : 0;
    this.legs[0].rotation.x = legSwing;
    this.legs[1].rotation.x = -legSwing;
    this.legs[2].rotation.x = -legSwing;
    this.legs[3].rotation.x = legSwing;

    const bob = isMoving ? Math.sin(this.clock * 2) * 0.025 : 0;
    this.body.position.y = bob;
    this.body.rotation.z = 0;
    this.head.position.y = 0.62 + bob * 0.8;

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
