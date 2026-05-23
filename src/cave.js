import * as THREE from 'three';

const CAVE_Y = -80;
const CAVE_RADIUS = 22;
const CAVE_HEIGHT = 9;

export class CaveManager {
  constructor(scene, getHeight) {
    this.scene = scene;
    this.getHeight = getHeight;
    this.isUnderground = false;
    this.surfacePosition = new THREE.Vector3();
    this.group = new THREE.Group();
    this.entranceMarkers = [];
    this.caveEnemies = [];
    this.exitPos = new THREE.Vector3();
    this.#buildChamber();
  }

  #buildChamber() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2A1A0A, roughness: 0.95, flatShading: true });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3A2A1A, roughness: 0.9, flatShading: true });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x4488FF, emissive: 0x2244AA, emissiveIntensity: 0.3 });

    const floor = new THREE.Mesh(new THREE.CircleGeometry(CAVE_RADIUS, 32), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.group.add(floor);

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = CAVE_RADIUS * 0.85;
      const pillarH = CAVE_HEIGHT * (0.6 + Math.sin(i * 2.7) * 0.4);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, pillarH, 6), wallMat);
      pillar.position.set(Math.cos(a) * r, pillarH / 2, Math.sin(a) * r);
      this.group.add(pillar);
    }

    const ceiling = new THREE.Mesh(new THREE.CircleGeometry(CAVE_RADIUS * 0.8, 24), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = CAVE_HEIGHT;
    this.group.add(ceiling);

    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * (CAVE_RADIUS * 0.6);
      const h = 1 + Math.random() * 4;
      const stal = new THREE.Mesh(new THREE.ConeGeometry(0.08 + Math.random() * 0.15, h, 5), wallMat);
      stal.position.set(Math.cos(a) * r, CAVE_HEIGHT - h * 0.5, Math.sin(a) * r);
      this.group.add(stal);
    }

    const glowMat2 = new THREE.MeshStandardMaterial({ color: 0x4488FF, emissive: 0x4488FF, emissiveIntensity: 0.5 });
    const exitGlow = new THREE.Mesh(new THREE.CircleGeometry(1.8, 12), glowMat2);
    exitGlow.rotation.x = -Math.PI / 2;
    exitGlow.position.set(0, 0.05, CAVE_RADIUS * 0.55);
    this.group.add(exitGlow);
    this.exitPos.set(0, 0.5, CAVE_RADIUS * 0.55);

    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 8, 16), glowMat2);
    arch.position.set(0, 1.8, CAVE_RADIUS * 0.55);
    this.group.add(arch);

    const torchMat = new THREE.MeshStandardMaterial({ color: 0xFF8800, emissive: 0xFF4400, emissiveIntensity: 0.3 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3;
      const r = CAVE_RADIUS * 0.7;
      const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 5), wallMat);
      torch.position.set(Math.cos(a) * r, 0.4, Math.sin(a) * r);
      this.group.add(torch);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), torchMat);
      flame.position.set(Math.cos(a) * r, 0.9, Math.sin(a) * r);
      this.group.add(flame);
    }

    const ambLight = new THREE.AmbientLight(0x222244, 0.6);
    ambLight.position.set(0, CAVE_HEIGHT / 2, 0);
    this.group.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0x4466AA, 0.3);
    dirLight.position.set(5, CAVE_HEIGHT, 5);
    this.group.add(dirLight);

    this.group.position.y = CAVE_Y;
  }

  placeEntranceNear(foxPos) {
    if (this.entranceMarkers.length > 3) return;
    const a = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 25;
    const x = foxPos.x + Math.cos(a) * r;
    const z = foxPos.z + Math.sin(a) * r;
    const y = this.getHeight(x, z);
    if (y < 1) return;
    const mat = new THREE.MeshStandardMaterial({ color: 0x1A0A0A, roughness: 0.9 });
    const marker = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.15, 8, 12), mat);
    marker.position.set(x, y, z);
    marker.rotation.x = Math.PI / 2;
    this.scene.add(marker);
    const darkFill = new THREE.Mesh(new THREE.CircleGeometry(1.3, 12), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    darkFill.position.set(x, y + 0.02, z);
    darkFill.rotation.x = -Math.PI / 2;
    this.scene.add(darkFill);
    marker.userData.isCaveEntrance = true;
    darkFill.userData.isCaveEntrance = true;
    this.entranceMarkers.push({ pos: new THREE.Vector3(x, y, z), meshes: [marker, darkFill] });
  }

  getNearestEntrance(foxPos) {
    let nearest = null, minDist = Infinity;
    for (const e of this.entranceMarkers) {
      const d = e.pos.distanceTo(foxPos);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    if (minDist < 2) return nearest;
    return null;
  }

  enterCave(foxGroup) {
    this.isUnderground = true;
    this.surfacePosition.copy(foxGroup.position);
    this.scene.add(this.group);
    foxGroup.position.set(0, 0.5, -CAVE_RADIUS * 0.4);
    foxGroup.rotation.y = 0;
  }

  exitCave(foxGroup) {
    this.isUnderground = false;
    this.scene.remove(this.group);
    foxGroup.position.copy(this.surfacePosition);
    foxGroup.position.y = this.getHeight(foxGroup.position.x, foxGroup.position.z);
  }

  update(foxPos, dt) {
    if (!this.isUnderground) return null;
    const dist = foxPos.distanceTo(this.exitPos);
    if (dist < 1.8) return 'exit';
    return null;
  }

  cleanupEntrance(marker) {
    for (const m of marker.meshes) {
      this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    }
    this.entranceMarkers = this.entranceMarkers.filter(e => e !== marker);
  }

  clearAll() {
    for (const e of this.entranceMarkers) this.cleanupEntrance(e);
    this.entranceMarkers = [];
    if (this.group.parent) this.scene.remove(this.group);
    this.group.traverse(c => {
      if (c.isMesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
  }
}

export function pickCaveEnemyType() {
  const types = ['bat', 'spider', 'lavabeast'];
  const weights = { bat: 5, spider: 3, lavabeast: 1 };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const t of types) {
    r -= weights[t];
    if (r <= 0) return t;
  }
  return 'bat';
}
