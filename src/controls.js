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

    this.keys = { forward: false, backward: false, left: false, right: false };
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.moveSpeed = 4;

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
    }
  }

  update(dt) {
    this.distance += (this.distanceTarget - this.distance) * 0.05;

    const forward = new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta));
    const right = new THREE.Vector3(Math.cos(this.theta), 0, -Math.sin(this.theta));

    const moveInput = new THREE.Vector3();
    if (this.keys.forward) moveInput.add(forward);
    if (this.keys.backward) moveInput.sub(forward);
    if (this.keys.right) moveInput.add(right);
    if (this.keys.left) moveInput.sub(right);

    const isMoving = moveInput.length() > 0.01;

    if (isMoving) {
      moveInput.normalize();
      const pos = this.animal.group.position;
      pos.x += moveInput.x * this.moveSpeed * dt;
      pos.z += moveInput.z * this.moveSpeed * dt;
      pos.y = this.getHeight(pos.x, pos.z);

      const targetDir = new THREE.Vector3().copy(pos).add(moveInput);
      this.animal.lookAt(targetDir);
    }

    this.animal.update(dt, this.moveSpeed, isMoving);

    const target = this.animal.getPosition();
    const cx = target.x + this.distance * Math.sin(this.theta) * Math.cos(this.phi);
    const cy = target.y + this.distance * Math.sin(this.phi);
    const cz = target.z + this.distance * Math.cos(this.theta) * Math.cos(this.phi);
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(target.x, target.y + 0.5, target.z);
  }
}
