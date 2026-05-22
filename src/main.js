import * as THREE from 'three';
import { ChunkManager } from './world.js';
import { Animal } from './animal.js';
import { Controls } from './controls.js';
import { Wolf, WOLF_HP, WOLF_ATK, WOLF_DEF } from './wolf.js';
import { Combat } from './combat.js';
import { FaunaManager } from './fauna.js';
import { ItemManager } from './items.js';
import './style.css';

const EXPLORE = 0, COMBAT = 1, GAME_OVER = 2;
let gameState = EXPLORE;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.prepend(renderer.domElement);

const sky = createSkyDome(scene);

const ambientLight = new THREE.AmbientLight(0x303050, 0.35);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a6d44, 0.5);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xFFD58E, 1.5);
sunLight.position.set(50, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 150;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.03;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x6B8EC5, 0.3);
fillLight.position.set(-40, 20, -40);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xFFEECC, 0.3);
rimLight.position.set(-30, 10, 50);
scene.add(rimLight);

const moonLight = new THREE.DirectionalLight(0x4466AA, 0);
moonLight.position.set(-50, 40, -40);
moonLight.target.position.set(0, 0, 0);
scene.add(moonLight);

const stars = createStars(scene);

const worldSeed = Math.floor(Math.random() * 100000);
const chunkManager = new ChunkManager(scene, worldSeed);
scene.fog = new THREE.FogExp2(0x9dc4b0, 0.002);

const fauna = new FaunaManager(scene, chunkManager.getHeight, chunkManager.getBiomeInfo);
const itemManager = new ItemManager(scene, chunkManager.getHeight);

const animal = new Animal();
const spawn = findSpawn(chunkManager.getHeight);
animal.group.position.set(spawn.x, spawn.y, spawn.z);
scene.add(animal.group);

const controls = new Controls(camera, animal, renderer.domElement, chunkManager.getHeight);

camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const wolves = [];

const combat = new Combat(
  (creature) => {
    gameState = EXPLORE;
    creature.removeFrom(scene);
  },
  () => {
    document.getElementById('game-over-overlay').style.display = 'flex';
    gameState = GAME_OVER;
  },
  itemManager
);

const clock = new THREE.Clock();
const infoEl = document.getElementById('info');

let dayTime = Math.PI * 0.6;
const dayLength = 90;

function findSpawn(getHeight) {
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    const y = getHeight(x, z);
    if (y > 1) return { x, y, z };
  }
  const y = getHeight(0, 0);
  return { x: 0, y, z: 0 };
}

function createSkyDome(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#0b0b2e');
  grad.addColorStop(0.15, '#1a2a5e');
  grad.addColorStop(0.35, '#4a7fb5');
  grad.addColorStop(0.55, '#87CEEB');
  grad.addColorStop(0.75, '#c8e0c0');
  grad.addColorStop(1.0, '#b8c8a8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;

  const geo = new THREE.SphereGeometry(200, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, color: 0xffffff });
  const sky = new THREE.Mesh(geo, mat);
  scene.add(sky);
  return sky;
}

function createStars(scene) {
  const starCount = 4000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 180 + Math.random() * 10;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.5;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.3 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0 });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

function updateDayNight(dt, foxPos) {
  dayTime += dt * (Math.PI * 2 / dayLength);
  const a = dayTime;
  const sunAngle = a;
  const moonAngle = a + Math.PI;

  const sunX = Math.cos(sunAngle) * 55;
  const sunZ = Math.sin(sunAngle) * 40;
  const sunY = Math.sin(sunAngle) * 55 + 8;

  const moonX = Math.cos(moonAngle) * 50;
  const moonZ = Math.sin(moonAngle) * 35;
  const moonY = Math.sin(moonAngle) * 50 + 8;

  const heightFactor = (sunY + 20) / 78;
  const dayFactor = Math.max(0, Math.min(1, heightFactor));

  const moonHeightFactor = (moonY + 20) / 78;
  const moonFactor = Math.max(0, Math.min(1, moonHeightFactor));

  sunLight.position.set(foxPos.x + sunX, sunY, foxPos.z + sunZ);
  sunLight.target.position.copy(foxPos);
  sunLight.target.updateMatrixWorld();
  sunLight.shadow.camera.updateProjectionMatrix();

  sunLight.intensity = Math.max(0, (dayFactor - 0.05) * 1.6);

  const sunHue = dayFactor < 0.3 ? 0.08 - dayFactor * 0.1 : 0.05;
  const sunSat = dayFactor < 0.2 ? 0.9 : 0.3 + dayFactor * 0.4;
  const sunLum = 0.15 + dayFactor * 0.55;
  sunLight.color.setHSL(Math.max(0, sunHue), sunSat, sunLum);

  moonLight.position.set(foxPos.x + moonX, moonY, foxPos.z + moonZ);
  moonLight.target.position.copy(foxPos);
  moonLight.target.updateMatrixWorld();
  moonLight.intensity = Math.max(0, (moonFactor - 0.15) * 0.5) * (1 - dayFactor);

  ambientLight.intensity = 0.30 + dayFactor * 0.20 + moonLight.intensity * 0.15;
  hemiLight.intensity = dayFactor * 0.5;

  const skyHue = 0.62 - dayFactor * 0.07;
  const skySat = 0.2 + dayFactor * 0.3;
  const skyLum = Math.max(0.06, dayFactor * 0.55);
  sky.material.color.setHSL(skyHue, skySat, skyLum);

  scene.fog.color.setHSL(skyHue, skySat * 0.4, Math.max(0.08, skyLum * 0.7));

  stars.material.opacity = Math.max(0, 1 - dayFactor * 1.4);

  renderer.toneMappingExposure = 0.45 + dayFactor * 0.55;
}

function spawnWolf() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 30 + Math.random() * 20;
  const pos = animal.group.position.clone();
  pos.x += Math.cos(angle) * dist;
  pos.z += Math.sin(angle) * dist;
  pos.y = chunkManager.getHeight(pos.x, pos.z);
  const wolf = new Wolf(pos, chunkManager.getHeight);
  scene.add(wolf.group);
  wolves.push(wolf);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  switch (gameState) {
    case EXPLORE: {
      const pos = animal.group.position;
      chunkManager.update(pos);
      fauna.update(pos, dt);
      itemManager.update(pos);
      updateDayNight(dt, pos);

      const targetWolfCount = 4;
      let wolfAttempts = 0;
      while (wolves.length < targetWolfCount && wolfAttempts < 100) {
        wolfAttempts++;
        spawnWolf();
      }

      for (const wolf of wolves) {
        const result = wolf.update(dt, pos);
        if (result === 'attacking') {
          gameState = COMBAT;
          combat.start({
            hp: WOLF_HP, atk: WOLF_ATK, def: WOLF_DEF,
            displayName: 'Wolf', icon: '🐺',
            removeFrom: (s) => {
              wolf.removeFrom(s);
              const idx = wolves.indexOf(wolf);
              if (idx !== -1) wolves.splice(idx, 1);
            }
          }, animal.group, wolf.group);
          break;
        }
      }

      for (const faunaAnimal of fauna.animals) {
        if (faunaAnimal.group.position.distanceTo(pos) < 0.8) {
          gameState = COMBAT;
          const creature = faunaAnimal;
          combat.start({
            hp: creature.hp, atk: creature.atk, def: creature.def,
            displayName: creature.displayName, icon: creature.icon,
            removeFrom: (s) => {
              creature.removeFrom(s);
              fauna.animals = fauna.animals.filter(a => a !== creature);
            }
          }, animal.group, creature.group);
          break;
        }
      }

      controls.update(dt);

      sky.position.copy(camera.position);
      stars.position.copy(camera.position);

      if (controls.superMode) {
        infoEl.textContent = 'SUPER MODE — WASD to fly · Space/Shift up/down · F to toggle';
        infoEl.style.background = 'rgba(200,50,50,0.7)';
      } else {
        const cnt = itemManager.getCounts();
        let items = '';
        if (cnt.stick) items += ` 🪵${cnt.stick}`;
        if (cnt.rock) items += ` 🪨${cnt.rock}`;
        infoEl.textContent = 'WASD to move · Shift to sprint · A/D to turn · Click & drag to orbit · F for super mode' + items;
        infoEl.style.background = 'rgba(0,0,0,0.5)';
      }
      break;
    }
    case COMBAT: {
      const foxPos = animal.group.position;
      const ePos = combat.getEnemyPosition();
      const mid = new THREE.Vector3().addVectors(foxPos, ePos).multiplyScalar(0.5);
      const dist = foxPos.distanceTo(ePos);
      const camDist = Math.max(4, dist * 0.6 + 3);
      camera.position.set(
        mid.x + camDist * 0.6,
        mid.y + 2.5,
        mid.z + camDist * 0.6
      );
      camera.lookAt(mid.x, mid.y + 0.5, mid.z);
      combat.updateHUD(camera);
      sky.position.copy(camera.position);
      stars.position.copy(camera.position);
      break;
    }
    case GAME_OVER: break;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
