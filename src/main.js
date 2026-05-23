console.log('[main.js] Module started executing');

window.__moduleExecuted = true;

window.addEventListener('unhandledrejection', e => {
  console.log('[main.js] Unhandled promise rejection:', e.reason);
});

import * as THREE from 'three';
console.log('[main.js] THREE imported, version:', THREE.REVISION);

import { ChunkManager } from './world.js';
console.log('[main.js] ChunkManager imported');

import { Animal } from './animal.js';
console.log('[main.js] Animal imported');

import { Controls } from './controls.js';
console.log('[main.js] Controls imported');

import { Wolf, pickEnemyType } from './wolf.js';
console.log('[main.js] Wolf imported');

import { Combat } from './combat.js';
console.log('[main.js] Combat imported');

import { FaunaManager } from './fauna.js';
console.log('[main.js] FaunaManager imported');

import { ItemManager } from './items.js';
console.log('[main.js] ItemManager imported');

import { CaveManager, pickCaveEnemyType } from './cave.js';
console.log('[main.js] CaveManager imported');

import './style.css';
console.log('[main.js] style.css imported');

const _log = document.getElementById('info');
if (_log) _log.textContent = 'Loading...';
const _loading = document.getElementById('loading');
if (_loading) _loading.style.display = 'none';
console.log('[main.js] Loading overlay hidden');

// ── Reset leftover DOM state from previous page lifecycle ──
const _overlay = document.getElementById('game-over-overlay');
if (_overlay) _overlay.style.display = 'none';

const EXPLORE = 0, COMBAT = 1, GAME_OVER = 2, CAVE = 3;
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
renderer.setClearColor(0x1a1a2e);
document.body.prepend(renderer.domElement);
console.log('[main.js] Renderer created, canvas in DOM, size:', window.innerWidth, 'x', window.innerHeight);

console.log('[main.js] Step: creating sky dome...');
const sky = createSkyDome(scene);
console.log('[main.js] Step: sky dome created');

console.log('[main.js] Step: ambient light');
const ambientLight = new THREE.AmbientLight(0x303050, 0.35);
scene.add(ambientLight);

console.log('[main.js] Step: hemi light');
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a6d44, 0.5);
scene.add(hemiLight);

console.log('[main.js] Step: sun light');
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

console.log('[main.js] Step: fill light');
const fillLight = new THREE.DirectionalLight(0x6B8EC5, 0.3);
fillLight.position.set(-40, 20, -40);
scene.add(fillLight);

console.log('[main.js] Step: rim light');
const rimLight = new THREE.DirectionalLight(0xFFEECC, 0.3);
rimLight.position.set(-30, 10, 50);
scene.add(rimLight);

console.log('[main.js] Step: moon light');
const moonLight = new THREE.DirectionalLight(0x4466AA, 0);
moonLight.position.set(-50, 40, -40);
moonLight.target.position.set(0, 0, 0);
scene.add(moonLight);

console.log('[main.js] Step: stars');
const stars = createStars(scene);

console.log('[main.js] Step: chunk manager');
const worldSeed = Math.floor(Math.random() * 100000);
const chunkManager = new ChunkManager(scene, worldSeed);
scene.fog = new THREE.FogExp2(0x9dc4b0, 0.002);

console.log('[main.js] Step: fauna / items / cave managers');
const fauna = new FaunaManager(scene, chunkManager.getHeight, chunkManager.getBiomeInfo);
const itemManager = new ItemManager(scene, chunkManager.getHeight);
const caveManager = new CaveManager(scene, chunkManager.getHeight);
let inCave = false;

console.log('[main.js] Step: animal creation and spawn');
const animal = new Animal();
const spawn = findSpawn(chunkManager.getHeight);
console.log('[main.js] Spawn found:', spawn);
animal.group.position.set(spawn.x, spawn.y, spawn.z);
scene.add(animal.group);

console.log('[main.js] Step: controls');
const controls = new Controls(camera, animal, renderer.domElement, chunkManager.getHeight);

console.log('[main.js] Step: camera init');
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const wolves = [];

console.log('[main.js] Step: combat');
const combat = new Combat(
  (creature) => {
    gameState = EXPLORE;
    const xpGain = Math.max(2, Math.floor(creature.hp * XP_PER_ENEMY_HP));
    foxCurrentHP = combat.foxHP;
    addXP(xpGain);
    creature.removeFrom(scene);
  },
  () => {
    const overlay = document.getElementById('game-over-overlay');
    if (!overlay) return;
    const statsEl = document.getElementById('game-over-stats');
    if (statsEl) statsEl.textContent = `Reached Level ${foxLevel} · ${Math.floor(foxXP)} XP`;
    overlay.style.display = 'flex';
    gameState = GAME_OVER;
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) restartBtn.onclick = () => location.reload();
  },
  itemManager
);
console.log('[main.js] Step: combat created');

// Use Clock despite deprecation warning - Timer needs extra update() calls
const clock = new THREE.Clock();
const infoEl = document.getElementById('info');

let dayTime = Math.PI * 0.6;
const dayLength = 90;

// ── Fox progression ──
const LEVEL_XP_BASE = 15;
const LEVEL_XP_SCALE = 1.4;
const BASE_HP = 20;
const BASE_ATK = 5;
const BASE_DEF = 2;
const HP_PER_LEVEL = 4;
const ATK_PER_LEVEL = 0.8;
const DEF_PER_LEVEL = 0.4;
const XP_PER_ENEMY_HP = 0.6;
const REGEN_HP_PER_SEC = 0.3;

let foxLevel = 1;
let foxXP = 0;
let foxCurrentHP = BASE_HP;

function getMaxHP(level) { return Math.floor(BASE_HP + (level - 1) * HP_PER_LEVEL); }
function getATK(level) { return BASE_ATK + (level - 1) * ATK_PER_LEVEL; }
function getDEF(level) { return BASE_DEF + (level - 1) * DEF_PER_LEVEL; }
function xpForLevel(level) { return Math.floor(LEVEL_XP_BASE * Math.pow(level, LEVEL_XP_SCALE)); }

function addXP(amount) {
  foxXP += amount;
  while (foxXP >= xpForLevel(foxLevel)) {
    foxXP -= xpForLevel(foxLevel);
    foxLevel++;
    foxCurrentHP = Math.min(foxCurrentHP + 5, getMaxHP(foxLevel));
    infoEl.textContent = `🎉 Level ${foxLevel}! HP +${HP_PER_LEVEL}`;
    infoEl.style.background = 'rgba(50,200,50,0.8)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
  }
}
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function findSpawn(getHeight) {
  for (let i = 0; i < 500; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    const y = getHeight(x, z);
    if (y > 1) return { x, y, z };
  }
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 400;
    const z = (Math.random() - 0.5) * 400;
    const y = getHeight(x, z);
    if (y > 0) return { x, y, z };
  }
  return { x: 0, y: Math.max(1, getHeight(0, 0)), z: 0 };
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
  const dist = 25 + Math.random() * 25;
  const pos = animal.group.position.clone();
  pos.x += Math.cos(angle) * dist;
  pos.z += Math.sin(angle) * dist;
  pos.y = chunkManager.getHeight(pos.x, pos.z);
  const typeId = pickEnemyType(chunkManager.getBiomeInfo, pos.x, pos.z);
  const wolf = new Wolf(pos, chunkManager.getHeight, typeId);
  scene.add(wolf.group);
  wolves.push(wolf);
}

let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  frameCount++;
  if (frameCount <= 3 || frameCount % 60 === 0) {
    console.log('[main.js] animate frame', frameCount, 'dt:', dt, 'state:', gameState);
  }

  switch (gameState) {
    case EXPLORE: {
      const pos = animal.group.position;
      chunkManager.update(pos);
      fauna.update(pos, dt);
      itemManager.update(pos);
      updateDayNight(dt, pos);

      const targetWolfCount = 7;
      let wolfAttempts = 0;
      while (wolves.length < targetWolfCount && wolfAttempts < 100) {
        wolfAttempts++;
        spawnWolf();
      }

      for (const wolf of wolves) {
        const result = wolf.update(dt, pos);
        if (result === 'attacking') {
          gameState = COMBAT;
          const td = wolf.typeDef;
          combat.start({
            hp: td.hp, atk: td.atk, def: td.def,
            displayName: td.name, icon: td.icon,
            removeFrom: (s) => {
              wolf.removeFrom(s);
              const idx = wolves.indexOf(wolf);
              if (idx !== -1) wolves.splice(idx, 1);
            }
          }, animal.group, wolf.group, foxCurrentHP, getMaxHP(foxLevel), getATK(foxLevel), getDEF(foxLevel));
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
          }, animal.group, creature.group, foxCurrentHP, getMaxHP(foxLevel), getATK(foxLevel), getDEF(foxLevel));
          break;
        }
      }

      if (caveManager.entranceMarkers.length < 4 && Math.random() < 0.002) {
        caveManager.placeEntranceNear(pos);
      }

      foxCurrentHP = Math.min(getMaxHP(foxLevel), foxCurrentHP + REGEN_HP_PER_SEC * dt);

      const entrance = caveManager.getNearestEntrance(pos);
      if (entrance) {
        infoEl.textContent = 'Cave entrance — walk in to explore';
        infoEl.style.background = 'rgba(30,30,60,0.8)';
        if (pos.distanceTo(entrance.pos) < 1.5) {
          for (const w of wolves) w.removeFrom(scene);
          wolves.length = 0;
          caveManager.enterCave(animal.group);
          gameState = CAVE;
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
        const maxHP = getMaxHP(foxLevel);
        const nextXP = xpForLevel(foxLevel);
        infoEl.textContent = `Lv${foxLevel} ❤️${Math.ceil(foxCurrentHP)}/${maxHP} ⭐${foxXP}/${nextXP} · WASD · Shift sprint · A/D turn · F super` + items;
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
      combat.updateAnim(dt);
      combat.updateHUD(camera);
      sky.position.copy(camera.position);
      stars.position.copy(camera.position);
      break;
    }
    case GAME_OVER: break;
    case CAVE: {
      const cp = animal.group.position;
      const result = caveManager.update(cp, dt);
      if (result === 'exit') {
        for (const w of wolves) w.removeFrom(scene);
        wolves.length = 0;
        caveManager.exitCave(animal.group);
        gameState = EXPLORE;
        break;
      }

      const caveTarget = 5;
      while (wolves.length < caveTarget) {
        const a = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 12;
        const x = cp.x + Math.cos(a) * r;
        const z = cp.z + Math.sin(a) * r;
        const pos = new THREE.Vector3(x, 0.5, z);
        const typeId = pickCaveEnemyType();
        const enemy = new Wolf(pos, () => 0.5, typeId);
        scene.add(enemy.group);
        wolves.push(enemy);
      }

      for (const wolf of wolves) {
        const res = wolf.update(dt, cp);
        if (res === 'attacking') {
          gameState = COMBAT;
          const td = wolf.typeDef;
          combat.start({
            hp: td.hp, atk: td.atk, def: td.def,
            displayName: td.name, icon: td.icon,
            removeFrom: (s) => {
              wolf.removeFrom(s);
              const idx = wolves.indexOf(wolf);
              if (idx !== -1) wolves.splice(idx, 1);
            }
          }, animal.group, wolf.group, foxCurrentHP, getMaxHP(foxLevel), getATK(foxLevel), getDEF(foxLevel));
          break;
        }
      }

      camera.position.set(
        cp.x + 5,
        cp.y + 3,
        cp.z + 5
      );
      camera.lookAt(cp.x, cp.y + 0.5, cp.z);
      infoEl.textContent = 'Find the blue portal to escape!';
      infoEl.style.background = 'rgba(20,10,40,0.8)';
      break;
    }
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
