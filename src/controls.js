import * as THREE from 'three';

export class Controls {
  constructor(camera, animal, domElement, getHeight) {
    this.camera = camera;
    this.animal = animal;
    this.domElement = domElement;
    this.getHeight = getHeight;

    this.theta = 0;
    this.phi = Math.PI / 4;
    this.distance = 8;
    this.distanceTarget = 8;

    this.keys = { forward: false, backward: false, left: false, right: false, up: false, down: false, sprint: false };
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.moveSpeed = 4;
    this.turnSpeed = 2.5;
    this.superMode = false;
    this.superSpeed = 50;
    this.isSwimming = false;

    this.setup();
  }

  setup() {
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.prevMouse.x = e.clientX;
        this.prevMouse.y = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.theta -= dx * 0.008;
      this.phi = Math.max(0.1, Math.min(Math.PI / 2.2, this.phi + dy * 0.008));
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;
    });

    window.addEventListener('mouseup', () => { this.isDragging = false; });

    this.domElement.addEventListener('wheel', (e) => {
      this.distanceTarget = Math.max(3, Math.min(20, this.distanceTarget + e.deltaY * 0.01));
    }, { passive: true });

    window.addEventListener('keydown', (e) => this.#onKey(e, true));
    window.addEventListener('keyup', (e) => this.#onKey(e, false));
  }

  #onKey(e, pressed) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = pressed; break;
      case 'KeyS': this.keys.backward = pressed; break;
      case 'KeyA': this.keys.left = pressed; break;
      case 'KeyD': this.keys.right = pressed; break;
      case 'Space': this.keys.up = pressed; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.down = pressed; this.keys.sprint = pressed; break;
      case 'KeyF': if (pressed) this.superMode = !this.superMode; break;
    }
  }

  update(dt) {
    this.distance += (this.distanceTarget - this.distance) * 0.05;

    if (this.superMode) {
      this.#updateSuper(dt);
    } else {
      this.#updateNormal(dt);
    }

    const target = this.animal.getPosition();
    const cx = target.x + this.distance * Math.sin(this.theta) * Math.cos(this.phi);
    const cy = target.y + this.distance * Math.sin(this.phi);
    const cz = target.z + this.distance * Math.cos(this.theta) * Math.cos(this.phi);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(target.x, target.y + 0.5, target.z);
  }

  #updateNormal(dt) {
    if (this.keys.left) this.animal.group.rotation.y += this.turnSpeed * dt;
    if (this.keys.right) this.animal.group.rotation.y -= this.turnSpeed * dt;

    const localMove = new THREE.Vector3();
    if (this.keys.forward) localMove.z = -1;
    if (this.keys.backward) localMove.z = 1;

    const isMoving = localMove.length() > 0.01;
    const sprintMult = this.keys.sprint ? 1.6 : 1;

    const pos = this.animal.group.position;

    if (isMoving) {
      const worldMove = localMove.clone().applyQuaternion(this.animal.group.quaternion);
      const newX = pos.x + worldMove.x * this.moveSpeed * sprintMult * dt;
      const newZ = pos.z + worldMove.z * this.moveSpeed * sprintMult * dt;
      const terrainY = this.getHeight(newX, newZ);

      pos.x = newX;
      pos.z = newZ;

      if (terrainY <= 0) {
        this.isSwimming = true;
        pos.y = 0 + Math.sin(Date.now() * 0.003) * 0.12;
      } else {
        this.isSwimming = false;
        pos.y = terrainY;
      }
    } else {
      const terrainY = this.getHeight(pos.x, pos.z);
      this.isSwimming = terrainY <= 0;
      if (this.isSwimming) {
        pos.y = 0 + Math.sin(Date.now() * 0.003) * 0.12;
      }
    }

    this.animal.update(dt, this.moveSpeed * sprintMult, isMoving, this.isSwimming);
  }

  #updateSuper(dt) {
    if (this.keys.left) this.animal.group.rotation.y += this.turnSpeed * dt;
    if (this.keys.right) this.animal.group.rotation.y -= this.turnSpeed * dt;

    const localMove = new THREE.Vector3();
    if (this.keys.forward) localMove.z = -1;
    if (this.keys.backward) localMove.z = 1;

    const isMoving = localMove.length() > 0.01;

    if (isMoving) {
      localMove.normalize();
      const worldMove = localMove.clone().applyQuaternion(this.animal.group.quaternion);
      const pos = this.animal.group.position;
      pos.x += worldMove.x * this.superSpeed * dt;
      pos.y += worldMove.y * this.superSpeed * dt;
      pos.z += worldMove.z * this.superSpeed * dt;
    }

    if (this.keys.up) this.animal.group.position.y += this.superSpeed * dt;
    if (this.keys.down) this.animal.group.position.y -= this.superSpeed * dt;

    this.animal.update(dt, this.superSpeed * 10, isMoving);
  }
}
