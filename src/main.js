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

import { ItemManager, ITEM_DEFS, CRAFTING_RECIPES } from './items.js';
console.log('[main.js] ItemManager imported');

import { BuildingManager } from './building.js';
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

const EXPLORE = 0, COMBAT = 1, GAME_OVER = 2;
let gameState = EXPLORE;
let gameMode = 'survival'; // 'survival' | 'creative'

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

const sunMesh = createSunMesh(scene);
const moonMesh = createMoonMesh(scene);

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
const SAVE_KEY = 'crittertrek_save';

console.log('[main.js] Step: chunk manager');
const saved = loadGame();
const worldSeed = saved ? saved.worldSeed : Math.floor(Math.random() * 100000);
const chunkManager = new ChunkManager(scene, worldSeed);
scene.fog = new THREE.FogExp2(0x9dc4b0, 0.002);
const normalFog = scene.fog;
const underwaterFog = new THREE.FogExp2(0x1a6a9a, 0.008);

console.log('[main.js] Step: fauna / items');
const fauna = new FaunaManager(scene, chunkManager.getHeight, chunkManager.getBiomeInfo);
const itemManager = new ItemManager(scene, chunkManager.getHeight, chunkManager.getBiomeInfo);
const buildingManager = new BuildingManager(scene);
const BUILD_SAVE_KEY = 'crittertrek_build';

console.log('[main.js] Step: animal creation and spawn');
const animal = new Animal();
if (saved) {
  animal.group.position.set(saved.position.x, saved.position.y, saved.position.z);
  foxLevel = saved.foxLevel;
  foxXP = saved.foxXP;
  foxCurrentHP = saved.foxCurrentHP;
  itemManager.inventory = { ...saved.inventory };
  if (saved.dayTime != null) dayTime = saved.dayTime;
  const buildData = loadBuildData();
  if (buildData) buildingManager.loadSaveData(buildData);
} else {
  const spawn = findSpawn(chunkManager.getHeight);
  animal.group.position.set(spawn.x, spawn.y, spawn.z);
}
scene.add(animal.group);

console.log('[main.js] Step: controls');
const controls = new Controls(camera, animal, renderer.domElement, chunkManager.getHeight);

console.log('[main.js] Step: camera init');
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const wolves = [];

console.log('[main.js] Step: combat');
const combat = new Combat(
  (creature, defeated) => {
    gameState = EXPLORE;
    combatCooldown = 60;
    const xpGain = Math.max(2, Math.floor(creature.hp * XP_PER_ENEMY_HP));
    foxCurrentHP = combat.foxHP;
    addXP(xpGain);
    saveGame();
    creature.removeFrom(scene);
    if (defeated) {
      const faces = creature.hp <= 4 ? '☺' : creature.hp <= 10 ? '☺☺' : creature.hp <= 18 ? '☺☺☺' : '☺☺☺☺';
      infoEl.textContent = `Victory! ${faces}`;
      infoEl.style.background = 'rgba(50,200,80,0.8)';
      setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1500);
    }
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

const biomeMenu = document.getElementById('biome-menu');
const biomeMenuButtons = biomeMenu.querySelectorAll('[data-biome]');
for (const btn of biomeMenuButtons) {
  btn.addEventListener('click', () => {
    teleportToBiome(btn.dataset.biome);
    biomeMenu.style.display = 'none';
  });
}
document.getElementById('biome-menu-close').addEventListener('click', () => {
  biomeMenu.style.display = 'none';
});

const craftingMenu = document.getElementById('crafting-menu');
const craftingRecipesEl = document.getElementById('crafting-menu-recipes');
document.getElementById('crafting-menu-close').addEventListener('click', () => {
  craftingMenu.style.display = 'none';
});

const modeSurvivalBtn = document.getElementById('btn-mode-survival');
const modeCreativeBtn = document.getElementById('btn-mode-creative');

function setMode(mode) {
  gameMode = mode;
  modeSurvivalBtn.classList.toggle('active', mode === 'survival');
  modeCreativeBtn.classList.toggle('active', mode === 'creative');
  const palette = document.getElementById('build-palette');
  palette.style.display = mode === 'creative' ? 'flex' : 'none';
  if (mode === 'creative') rebuildBuildPalette();
}

modeSurvivalBtn.addEventListener('click', () => setMode('survival'));
modeCreativeBtn.addEventListener('click', () => setMode('creative'));

function rebuildCraftingList() {
  craftingRecipesEl.innerHTML = '';
  for (const recipe of CRAFTING_RECIPES) {
    const btn = document.createElement('button');
    btn.className = 'craft-recipe';
    const has = itemManager.canCraft(recipe);
    btn.className = 'craft-recipe ' + (has ? 'ready' : 'locked');
    const needs = Object.entries(recipe.input).map(([t, q]) => `${q} ${ITEM_DEFS[t].icon}`).join(' + ');
    const out = ITEM_DEFS[recipe.output];
    btn.innerHTML = `<span>${out.icon} ${recipe.label}</span><span class="craft-needs">${needs}</span>`;
    if (has) {
      btn.addEventListener('click', () => {
        if (itemManager.craft(recipe)) rebuildCraftingList();
      });
    }
    craftingRecipesEl.appendChild(btn);
  }
}

function rebuildBuildPalette() {
  const container = document.getElementById('build-palette-items');
  container.innerHTML = '';
  const counts = itemManager.getCounts();
  const allTypes = Object.keys(ITEM_DEFS);
  let firstWithStock = null;
  for (const type of allTypes) {
    const hasIt = gameMode === 'creative' || (counts[type] || 0) > 0;
    if (!hasIt) continue;
    if (!firstWithStock) firstWithStock = type;
    const info = ITEM_DEFS[type];
    const btn = document.createElement('button');
    btn.className = 'build-slot' + (buildingManager.selectedType === type ? ' selected' : '');
    const label = gameMode === 'creative' ? info.icon : `${info.icon} ${counts[type] || 0}`;
    btn.innerHTML = label;
    btn.title = info.name;
    btn.addEventListener('click', () => {
      buildingManager.selectedType = type;
      rebuildBuildPalette();
    });
    container.appendChild(btn);
  }
  if (!buildingManager.selectedType && firstWithStock) {
    buildingManager.selectedType = firstWithStock;
  }
  const selected = buildingManager.selectedType;
  document.getElementById('build-palette-hint').innerHTML = selected
    ? `${ITEM_DEFS[selected].icon} ${ITEM_DEFS[selected].name} selected · <b>E</b> place · <b>Q</b> pickup · Sword rotate · Pickaxe remove · Trident move`
    : gameMode === 'creative'
      ? 'Creative mode — select an item above and press <b>E</b> to place it!'
      : 'No items to build with — collect materials in Survival mode first!';
}

// Use Clock despite deprecation warning - Timer needs extra update() calls
const drinkBtn = document.getElementById('btn-drink');
drinkBtn.addEventListener('click', () => { controls.drinkPressed = true; });
const diveBtn = document.getElementById('btn-dive');
diveBtn.addEventListener('click', () => { controls.divePressed = true; });

const chestOverlay = document.getElementById('chest-overlay');
const chestItemsEl = document.getElementById('chest-items');
const chestTitle = document.getElementById('chest-title');
const btnChestCollect = document.getElementById('btn-chest-collect');
const btnChestClose = document.getElementById('btn-chest-close');
const btnChestOpen = document.getElementById('btn-chest-open');
let activeChestHouse = null;
const btnBuyHouse = document.getElementById('btn-buy-house');

function openChestUI(house) {
  if (!house.lootSpawned) house.openChest();
  activeChestHouse = house;
  chestTitle.textContent = house.isMansion ? '💎 Mansion Chest' : '📦 Chest';
  chestItemsEl.innerHTML = '';
  const items = house.chestLoot || [];
  if (items.length === 0) {
    chestItemsEl.innerHTML = '<div style="color:#888;padding:12px;">Chest is empty</div>';
    btnChestCollect.style.display = 'none';
  } else {
    btnChestCollect.style.display = 'inline-block';
    for (const it of items) {
      const def = ITEM_DEFS[it.type];
      const row = document.createElement('div');
      row.className = 'chest-item-row';
      row.innerHTML = `<span class="chest-item-icon">${def ? def.icon : '❓'}</span><span class="chest-item-name">${def ? def.name : it.type}</span><span class="chest-item-count">×${it.count}</span>`;
      chestItemsEl.appendChild(row);
    }
  }
  chestOverlay.style.display = 'flex';
}

btnChestCollect.addEventListener('click', () => {
  if (activeChestHouse) {
    const items = activeChestHouse.collectChestLoot(itemManager);
    infoEl.textContent = `📦 Collected ${items.length} items from chest!`;
    infoEl.style.background = 'rgba(180,140,60,0.8)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
    chestOverlay.style.display = 'none';
    activeChestHouse = null;
    btnChestOpen.style.display = 'none';
    if (gameMode === 'creative') rebuildBuildPalette();
  }
});

btnChestClose.addEventListener('click', () => {
  chestOverlay.style.display = 'none';
  activeChestHouse = null;
});

btnChestOpen.addEventListener('click', () => {
  if (currentHouse && currentHouse.isNearChest(animal.group.position) && currentHouse.lootContainer.visible) {
    openChestUI(currentHouse);
  }
});

btnBuyHouse.addEventListener('click', () => {
  if (currentHouse && !currentHouse.owned && currentHouse.canAfford(itemManager.getCounts())) {
    currentHouse.buy(itemManager);
    infoEl.textContent = '🏠 House purchased! You now get passive resources!';
    infoEl.style.background = 'rgba(80,180,80,0.8)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 3000);
    btnBuyHouse.style.display = 'none';
    if (gameMode === 'creative') rebuildBuildPalette();
  } else if (currentHouse && !currentHouse.owned) {
    const price = currentHouse.getPrice();
    const costStr = price.map(p => `❌ ${p.count}x ${ITEM_DEFS[p.type].name}`).join(' ');
    infoEl.textContent = `Not enough resources! Need ${costStr}`;
    infoEl.style.background = 'rgba(200,80,80,0.8)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 3000);
  }
});

const clock = new THREE.Clock();
const infoEl = document.getElementById('info');

let dayTime = Math.PI * 0.6;
let dayFactor = 1;
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
let combatCooldown = 0;
let drinkCooldown = 0;

let currentHouse = null;
let isPresident = false;

function checkPresident() {
  const cnt = itemManager.getCounts();
  for (const [type, qty] of Object.entries(cnt)) {
    if (qty >= 100) {
      if (!isPresident) {
        isPresident = true;
        infoEl.textContent = `🏛️ YOU ARE PRESIDENT! 100 ${ITEM_DEFS[type].icon} collected! +5 Levels!`;
        infoEl.style.background = 'rgba(200,180,50,0.9)';
        setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 4000);
        for (let i = 0; i < 5; i++) {
          if (foxXP >= xpForLevel(foxLevel)) {
            foxXP -= xpForLevel(foxLevel);
            foxLevel++;
            foxCurrentHP = Math.min(foxCurrentHP + 5, getMaxHP(foxLevel));
          }
        }
        saveGame();
      }
      return true;
    }
  }
  return false;
}

function getMaxHP(level) { return Math.floor(BASE_HP + (level - 1) * HP_PER_LEVEL); }
function getATK(level) { return BASE_ATK + (level - 1) * ATK_PER_LEVEL; }
function getDEF(level) { return BASE_DEF + (level - 1) * DEF_PER_LEVEL; }
function xpForLevel(level) { return Math.floor(LEVEL_XP_BASE * Math.pow(level, LEVEL_XP_SCALE)); }

function saveGame() {
  try {
    const data = {
      version: 1,
      worldSeed,
      position: { x: animal.group.position.x, y: animal.group.position.y, z: animal.group.position.z },
      foxLevel,
      foxXP,
      foxCurrentHP,
      inventory: itemManager.getCounts(),
      dayTime,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.version === 1 ? data : null;
  } catch (e) {
    console.warn('Load failed:', e);
    return null;
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

function saveBuildData() {
  try {
    localStorage.setItem(BUILD_SAVE_KEY, JSON.stringify(buildingManager.getSaveData()));
  } catch (e) {
    console.warn('Build save failed:', e);
  }
}

function loadBuildData() {
  try {
    const raw = localStorage.getItem(BUILD_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

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
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape' && chestOverlay.style.display === 'flex') {
    chestOverlay.style.display = 'none';
    return;
  }
  if (e.code === 'KeyR' && gameState === EXPLORE) {
    biomeMenu.style.display = biomeMenu.style.display === 'none' ? 'flex' : 'none';
  }
  if (e.code === 'KeyM' && gameState === EXPLORE) {
    setMode(gameMode === 'survival' ? 'creative' : 'survival');
  }
  if (e.code === 'KeyC' && gameState === EXPLORE) {
    if (craftingMenu.style.display === 'none') {
      rebuildCraftingList();
      craftingMenu.style.display = 'flex';
    } else {
      craftingMenu.style.display = 'none';
    }
  }
  if (e.code === 'KeyE' && gameState === EXPLORE) {
    if (currentHouse && currentHouse.lootContainer && currentHouse.lootContainer.visible && currentHouse.isNearChest(animal.group.position)) {
      openChestUI(currentHouse);
      return;
    }
    if (gameMode === 'creative' && buildingManager.selectedType) {
    const toolItems = ['animalsword', 'animalpickaxe', 'animaltrident'];
    if (toolItems.includes(buildingManager.selectedType)) {
      const result = buildingManager.interactWith(animal.group.position, buildingManager.selectedType);
      if (result === 'rotated') {
        infoEl.textContent = '🗡️ Sword rotated object!';
        infoEl.style.background = 'rgba(100,180,255,0.7)';
        setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1000);
      } else if (typeof result === 'string' && result !== 'moved') {
        itemManager.inventory[result] = (itemManager.inventory[result] || 0) + 1;
        saveBuildData();
        rebuildBuildPalette();
        infoEl.textContent = `⛏️ Pickaxe removed ${ITEM_DEFS[result].icon}!`;
        infoEl.style.background = 'rgba(255,180,50,0.7)';
        setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1000);
      } else if (result === 'moved') {
        infoEl.textContent = '🔱 Trident moved object!';
        infoEl.style.background = 'rgba(100,180,255,0.7)';
        setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1000);
      }
    } else {
      const pos = animal.group.position;
      const y = chunkManager.getHeight(pos.x, pos.z);
      if (buildingManager.place(buildingManager.selectedType, y, animal.group)) {
        saveBuildData();
        rebuildBuildPalette();
      }
    }
    }
  }
  if (e.code === 'KeyQ' && gameState === EXPLORE && gameMode === 'creative') {
    const picked = buildingManager.pickupAt(animal.group.position);
    if (picked) {
      itemManager.inventory[picked] = (itemManager.inventory[picked] || 0) + 1;
      saveBuildData();
      rebuildBuildPalette();
    }
  }
  if (e.code === 'KeyG' && gameState === EXPLORE && gameMode === 'creative') {
    const spawned = fauna.spawnAnimalAt(animal.group.position);
    if (spawned) {
      infoEl.textContent = '🐾 Spawned an animal!';
      infoEl.style.background = 'rgba(100,200,100,0.7)';
      setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1000);
    }
  }
});
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

function createSunMesh(scene) {
  const geo = new THREE.SphereGeometry(2.5, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xFFDD77 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
}

function createMoonMesh(scene) {
  const geo = new THREE.SphereGeometry(1.8, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xCCCCDD });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
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
  dayFactor = Math.max(0, Math.min(1, heightFactor));

  const moonHeightFactor = (moonY + 20) / 78;
  const moonFactor = Math.max(0, Math.min(1, moonHeightFactor));

  const sunWorldX = foxPos.x + sunX;
  const sunWorldZ = foxPos.z + sunZ;
  sunLight.position.set(sunWorldX, sunY, sunWorldZ);
  sunLight.target.position.copy(foxPos);
  sunLight.target.updateMatrixWorld();
  sunLight.shadow.camera.updateProjectionMatrix();

  sunLight.intensity = Math.max(0, (dayFactor - 0.05) * 1.6);

  const sunHue = dayFactor < 0.3 ? 0.08 - dayFactor * 0.1 : 0.05;
  const sunSat = dayFactor < 0.2 ? 0.9 : 0.3 + dayFactor * 0.4;
  const sunLum = 0.15 + dayFactor * 0.55;
  sunLight.color.setHSL(Math.max(0, sunHue), sunSat, sunLum);

  sunMesh.position.set(sunWorldX, sunY, sunWorldZ);
  sunMesh.material.opacity = Math.max(0, Math.min(1, (dayFactor - 0.05) * 2));
  sunMesh.material.transparent = true;

  const moonWorldX = foxPos.x + moonX;
  const moonWorldZ = foxPos.z + moonZ;
  moonLight.position.set(moonWorldX, moonY, moonWorldZ);
  moonLight.target.position.copy(foxPos);
  moonLight.target.updateMatrixWorld();
  moonLight.intensity = Math.max(0, (moonFactor - 0.15) * 2.0) * (1 - dayFactor);

  moonMesh.position.set(moonWorldX, moonY, moonWorldZ);
  moonMesh.material.opacity = Math.max(0, Math.min(1, (moonFactor - 0.1) * 2));
  moonMesh.material.transparent = true;

  ambientLight.intensity = 0.50 + dayFactor * 0.20 + moonLight.intensity * 0.30;
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
  const dist = 15 + Math.random() * 30;
  const pos = animal.group.position.clone();
  pos.x += Math.cos(angle) * dist;
  pos.z += Math.sin(angle) * dist;
  pos.y = chunkManager.getHeight(pos.x, pos.z);
  if (pos.y < 0.3) return;
  const typeId = pickEnemyType(chunkManager.getBiomeInfo, pos.x, pos.z);
  const wolf = new Wolf(pos, chunkManager.getHeight, typeId);
  scene.add(wolf.group);
  wolves.push(wolf);
}

function getBiomeName(bio, y) {
  if (y < 0.3) return 'ocean';
  if (bio.mountain > 0.5) return 'mountain';
  return bio.biomeRegion || 'plains';
}

function computeStrengths(bio) {
  const { continent, temp, moist, magic, land, mountain } = bio;
  const s = (t, lo, hi) => {
    t = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  };
  return {
    desert: s(temp, 0.15, 0.45) * (1 - s(moist, -0.2, 0.1)) * (1 - mountain * 0.4),
    forest: s(temp, 0, 0.3) * s(moist, 0.2, 0.5) * (1 - mountain * 0.3),
    tundra: (1 - s(temp, -0.35, 0)) * (1 - mountain),
    swamp: s(-moist, 0, 0.3) * (1 - mountain) * land,
    crystal: s(magic, 0.45, 0.7) * land,
    canyon: s(temp, -0.1, 0.2) * s(-moist, -0.3, 0.05) * (1 - s(continent, 0.3, 0.5)) * (1 - mountain) * land,
    badlands: s(temp, 0.08, 0.35) * (1 - s(moist, -0.3, 0.05)) * mountain * 1.2,
  };
}

function teleportToBiome(biomeName) {
  const pos = animal.group.position;
  let teleported = false;

  const doTeleport = (x, y, z, label) => {
    infoEl.textContent = label;
    infoEl.style.background = 'rgba(50,150,255,0.7)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
    animal.group.position.set(x, y, z);
    chunkManager.lastCX = null;
    chunkManager.lastCZ = null;
    teleported = true;
  };

  // Phase 1: search for existing location
  if (biomeName === 'ocean') {
    for (let attempt = 0; attempt < 5000; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 30000;
      const x = pos.x + Math.cos(angle) * dist;
      const z = pos.z + Math.sin(angle) * dist;
      const y = chunkManager.getHeight(x, z);
      if (y < 0 && y > -10) {
        doTeleport(x, 0, z, 'Teleported to Ocean');
        break;
      }
    }
    if (!teleported) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 2000;
      const x = pos.x + Math.cos(angle) * dist;
      const z = pos.z + Math.sin(angle) * dist;
      doTeleport(x, 0, z, 'Teleported to Ocean');
    }
    return true;
  }

  const rounds = [
    { maxDist: 500, attempts: 2000 },
    { maxDist: 3000, attempts: 3000 },
    { maxDist: 20000, attempts: 5000 },
    { maxDist: 100000, attempts: 10000 },
  ];

  for (const round of rounds) {
    if (teleported) break;
    for (let attempt = 0; attempt < round.attempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * round.maxDist;
      const x = pos.x + Math.cos(angle) * dist;
      const z = pos.z + Math.sin(angle) * dist;
      const bio = chunkManager.getBiomeInfo(x, z);
      const y = chunkManager.getHeight(x, z);
      if (y <= 0.3) continue;

      if (biomeName === 'mountain') {
        if (bio.mountain > 0.5) {
          doTeleport(x, y, z, `Teleported to ${biomeName}`);
          break;
        }
      } else {
        if (bio.biomeRegion === biomeName) {
          const strengths = computeStrengths(bio);
          if ((strengths[biomeName] || 0) >= 0.2) {
            doTeleport(x, y, z, `Teleported to ${biomeName}`);
            break;
          }
        }
      }
    }
  }

  if (!teleported) {
    // Phase 2: ring scan (wider coverage)
    for (let ring = 1; ring <= 80; ring++) {
      if (teleported) break;
      const dist = ring * 500;
      const step = Math.max(300, dist * 0.15);
      const count = Math.max(8, Math.round((2 * Math.PI * dist) / step));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.1;
        const x = pos.x + Math.cos(angle) * dist;
        const z = pos.z + Math.sin(angle) * dist;
        const bio = chunkManager.getBiomeInfo(x, z);
        const y = chunkManager.getHeight(x, z);
        if (y <= 0.3) continue;

        if (biomeName === 'mountain') {
          if (bio.mountain > 0.5) {
            doTeleport(x, y, z, `Teleported to ${biomeName}`);
            break;
          }
        } else {
          if (bio.biomeRegion === biomeName) {
            const strengths = computeStrengths(bio);
            if ((strengths[biomeName] || 0) >= 0.2) {
              doTeleport(x, y, z, `Teleported to ${biomeName}`);
              break;
            }
          }
        }
      }
    }
  }

  if (!teleported) {
    // Phase 3: create a biome pocket — force terrain to generate as the target biome
    const angle = Math.random() * Math.PI * 2;
    const dist = 500 + Math.random() * 2000;
    const px = pos.x + Math.cos(angle) * dist;
    const pz = pos.z + Math.sin(angle) * dist;

    chunkManager.setNoiseOverride(px, pz, biomeName, 1000);
    chunkManager.chunkCache.clear();

    let py = chunkManager.getHeight(px, pz);
    if (py <= 0.3) py = 1;
    doTeleport(px, py, pz, `Generated ${biomeName} biome`);
  }

  // Phase 4: postflight check — if still not in the right biome, force it at current position
  const finalBio = chunkManager.getBiomeInfo(animal.group.position.x, animal.group.position.z);
  if (getBiomeName(finalBio, animal.group.position.y) !== biomeName) {
    const cx = animal.group.position.x;
    const cz = animal.group.position.z;
    chunkManager.setNoiseOverride(cx, cz, biomeName, 1000);
    chunkManager.chunkCache.clear();
    const cy = Math.max(chunkManager.getHeight(cx, cz), 1);
    animal.group.position.y = cy;
    infoEl.textContent = `Forced ${biomeName} biome`;
    infoEl.style.background = 'rgba(50,150,255,0.7)';
    setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
  }

  return true;
}

let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  frameCount++;
  if (frameCount <= 3 || frameCount % 60 === 0) {
    console.log('[main.js] animate frame', frameCount, 'dt:', dt, 'state:', gameState);
  }

  try {
  chunkManager.animateWaves(clock.elapsedTime);
  switch (gameState) {
    case EXPLORE: {
      const pos = animal.group.position;
      chunkManager.update(pos);
      fauna.update(pos, dt);
      itemManager.update(pos);
      updateDayNight(dt, pos);

      for (let i = wolves.length - 1; i >= 0; i--) {
        if (wolves[i].group.position.distanceTo(pos) > 80) {
          wolves[i].removeFrom(scene);
          wolves.splice(i, 1);
        }
      }

      if (combatCooldown > 0) {
        combatCooldown = Math.max(0, combatCooldown - dt);
      }

      const targetWolfCount = 5;
      let wolfAttempts = 0;
      while (wolves.length < targetWolfCount && wolfAttempts < 200) {
        wolfAttempts++;
        spawnWolf();
      }

      if (combatCooldown <= 0 && dayFactor > 0.3) {
      const scaleLvl = 1 + (foxLevel - 1) * 0.15;

      function applyWaterBonus(hp) {
        if (controls.speedBoost > 0) {
          controls.speedBoost = 0;
          infoEl.textContent = '💧 Water power surges! −7 HP to enemy!';
          infoEl.style.background = 'rgba(50,100,200,0.7)';
          setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
          return Math.max(1, hp - 7);
        }
        return hp;
      }

      for (const wolf of wolves) {
        const result = wolf.update(dt, pos, dayFactor > 0.3);
        if (result === 'attacking') {
          gameState = COMBAT;
          biomeMenu.style.display = 'none';
          craftingMenu.style.display = 'none';
          const td = wolf.typeDef;
          combat.start({
            hp: applyWaterBonus(Math.floor(td.hp * scaleLvl)), atk: Math.floor(td.atk * scaleLvl), def: Math.floor(td.def * scaleLvl),
            displayName: td.name, icon: td.icon, scale: td.scale,
            removeFrom: (s) => {
              wolf.removeFrom(s);
              const idx = wolves.indexOf(wolf);
              if (idx !== -1) wolves.splice(idx, 1);
            }
            }, animal.group, wolf.group, foxCurrentHP, getMaxHP(foxLevel), getATK(foxLevel), getDEF(foxLevel), gameMode === 'creative', isPresident);
          break;
        }
      }

      for (const faunaAnimal of fauna.animals) {
        if (faunaAnimal.group.position.distanceTo(pos) < 0.8) {
          gameState = COMBAT;
          biomeMenu.style.display = 'none';
          craftingMenu.style.display = 'none';
          const creature = faunaAnimal;
          combat.start({
            hp: applyWaterBonus(Math.floor(creature.hp * scaleLvl)), atk: Math.floor(creature.atk * scaleLvl), def: Math.floor(creature.def * scaleLvl),
            displayName: creature.displayName, icon: creature.icon,
            removeFrom: (s) => {
              creature.removeFrom(s);
              fauna.animals = fauna.animals.filter(a => a !== creature);
            }
            }, animal.group, creature.group, foxCurrentHP, getMaxHP(foxLevel), getATK(foxLevel), getDEF(foxLevel), gameMode === 'creative', isPresident);
          break;
        }
      }
      }

      foxCurrentHP = Math.min(getMaxHP(foxLevel), foxCurrentHP + REGEN_HP_PER_SEC * dt);

      buildingManager.update(animal.group.position);
      if (frameCount % 300 === 0 && buildingManager.objects.length > 0) saveBuildData();

      // ── House updates (guardians, passive resources) ──
      for (const house of chunkManager.houses) {
        house.update(dt, pos, itemManager);
      }

      // ── House detection / interior view / chest / buy ──
      let nearbyHouse = null;
      for (const house of chunkManager.houses) {
        if (house.isPlayerInside(pos)) {
          nearbyHouse = house;
          break;
        }
      }

      if (nearbyHouse !== currentHouse) {
        if (currentHouse) currentHouse.setInteriorView(false);
        if (nearbyHouse) {
          nearbyHouse.setInteriorView(true);
          if (!nearbyHouse.entered) {
            nearbyHouse.activateGuardian(scene);
          }
        }
        currentHouse = nearbyHouse;
      }

      if (currentHouse && currentHouse.lootContainer && currentHouse.lootContainer.visible) {
        btnChestOpen.style.display = currentHouse.isNearChest(pos) ? 'block' : 'none';
      } else {
        btnChestOpen.style.display = 'none';
      }

      if (currentHouse && !currentHouse.owned) {
        const price = currentHouse.getPrice();
        const costStr = price.map(p => `${p.count} ${ITEM_DEFS[p.type].icon}`).join(' ');
        btnBuyHouse.textContent = `🏠 Buy (${costStr})`;
        btnBuyHouse.style.display = 'block';
        btnBuyHouse.style.opacity = currentHouse.canAfford(itemManager.getCounts()) ? '1' : '0.4';
      } else {
        btnBuyHouse.style.display = 'none';
      }

      checkPresident();

      if (drinkCooldown > 0) drinkCooldown -= dt;
      if (controls.divePressed) {
        controls.divePressed = false;
        if (controls.isSwimming) {
          controls.isDiving = !controls.isDiving;
        }
      }
      if (controls.drinkPressed) {
        controls.drinkPressed = false;
        if (drinkCooldown <= 0 && controls.isSwimming) {
          const heal = 5 + Math.floor(Math.random() * 6);
          foxCurrentHP = Math.min(getMaxHP(foxLevel), foxCurrentHP + heal);
          combat.nextAtkMult = 1.5;
          controls.speedBoost = 8;
          drinkCooldown = 10;
          infoEl.textContent = `💧 Drank water! +${heal} HP · ⚡ Speed boost! · Next attack empowered!`;
          infoEl.style.background = 'rgba(50,100,200,0.7)';
          setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 2000);
        } else if (drinkCooldown > 0) {
          infoEl.textContent = `⏳ Not thirsty yet (${Math.ceil(drinkCooldown)}s)`;
          infoEl.style.background = 'rgba(100,100,100,0.7)';
          setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1000);
        } else {
          infoEl.textContent = '🌊 Must be in water to drink!';
          infoEl.style.background = 'rgba(200,150,50,0.7)';
          setTimeout(() => infoEl.style.background = 'rgba(0,0,0,0.5)', 1500);
        }
      }

      controls.update(dt);

      if (controls.isDiving) {
        scene.fog = underwaterFog;
        renderer.setClearColor(0x0a2a4a);
        chunkManager.setWaterOpacity(0);
      } else {
        scene.fog = normalFog;
        renderer.setClearColor(0x1a1a2e);
        chunkManager.setWaterOpacity(0.55);
      }

      drinkBtn.style.display = gameState === EXPLORE && controls.isSwimming && drinkCooldown <= 0 && !controls.isDiving ? 'block' : 'none';
      diveBtn.style.display = gameState === EXPLORE && controls.isSwimming ? 'block' : 'none';
      const modeBtns = document.getElementById('mode-buttons');
      if (modeBtns) modeBtns.style.display = gameState === EXPLORE ? 'flex' : 'none';
      diveBtn.textContent = controls.isDiving ? '⬆ Surface (Q)' : '🌊 Dive (Q)';
      diveBtn.className = controls.isDiving ? 'diving' : '';

      sky.position.copy(camera.position);
      stars.position.copy(camera.position);

      if (controls.superMode) {
        infoEl.textContent = 'SUPER MODE — WASD to fly · Space/Shift up/down · F to toggle';
        infoEl.style.background = 'rgba(200,50,50,0.7)';
      } else if (gameMode === 'creative') {
        const cnt = itemManager.getCounts();
        let totalCollected = 0;
        let items = '';
        if (cnt.stick) { items += ` 🪵${cnt.stick}`; totalCollected += cnt.stick; }
        if (cnt.rock) { items += ` 🪨${cnt.rock}`; totalCollected += cnt.rock; }
        if (cnt.sharpstick) { items += ` 🗡️${cnt.sharpstick}`; totalCollected += cnt.sharpstick; }
        if (cnt.cactusneedle) { items += ` 🌵${cnt.cactusneedle}`; totalCollected += cnt.cactusneedle; }
        if (cnt.berry) { items += ` 🫐${cnt.berry}`; totalCollected += cnt.berry; }
        if (cnt.bone) { items += ` 🦴${cnt.bone}`; totalCollected += cnt.bone; }
        if (cnt.feather) { items += ` 🪶${cnt.feather}`; totalCollected += cnt.feather; }
        if (cnt.seaweed) { items += ` 🌱${cnt.seaweed}`; totalCollected += cnt.seaweed; }
        if (cnt.jellyfisharm) { items += ` 🪼${cnt.jellyfisharm}`; totalCollected += cnt.jellyfisharm; }
        if (cnt.starfisharm) { items += ` ⭐${cnt.starfisharm}`; totalCollected += cnt.starfisharm; }
        if (cnt.animalsword) { items += ` ⚔️${cnt.animalsword}`; totalCollected += cnt.animalsword; }
        if (cnt.animalpickaxe) { items += ` ⛏️${cnt.animalpickaxe}`; totalCollected += cnt.animalpickaxe; }
        if (cnt.animaltrident) { items += ` 🔱${cnt.animaltrident}`; totalCollected += cnt.animaltrident; }
        if (cnt.mushroom) { items += ` 🍄${cnt.mushroom}`; totalCollected += cnt.mushroom; }
        if (cnt.herb) { items += ` 🌿${cnt.herb}`; totalCollected += cnt.herb; }
        const placedCount = buildingManager.objects.length;
        const buildInfo = placedCount > 0 ? ` 🏗️${placedCount} built` : '';
        const collectInfo = totalCollected > 0 ? ` 📦${totalCollected} collected` : '';
        infoEl.textContent = `🎨 CREATIVE${buildInfo}${collectInfo} · WASD move · E place · Q pickup` + items;
        infoEl.style.background = 'rgba(30,60,120,0.6)';
      } else {
        const cnt = itemManager.getCounts();
        let items = '';
        if (controls.speedBoost > 0) items += ` ⚡${Math.ceil(controls.speedBoost)}s`;
        if (cnt.stick) items += ` 🪵${cnt.stick}`;
        if (cnt.rock) items += ` 🪨${cnt.rock}`;
        if (cnt.sharpstick) items += ` 🗡️${cnt.sharpstick}`;
        if (cnt.cactusneedle) items += ` 🌵${cnt.cactusneedle}`;
        if (cnt.berry) items += ` 🫐${cnt.berry}`;
        if (cnt.bone) items += ` 🦴${cnt.bone}`;
        if (cnt.feather) items += ` 🪶${cnt.feather}`;
        if (cnt.seaweed) items += ` 🌱${cnt.seaweed}`;
        if (cnt.jellyfisharm) items += ` 🪼${cnt.jellyfisharm}`;
        if (cnt.starfisharm) items += ` ⭐${cnt.starfisharm}`;
        if (cnt.animalsword) items += ` ⚔️${cnt.animalsword}`;
        if (cnt.animalpickaxe) items += ` ⛏️${cnt.animalpickaxe}`;
        if (cnt.animaltrident) items += ` 🔱${cnt.animaltrident}`;
        if (cnt.mushroom) items += ` 🍄${cnt.mushroom}`;
        if (cnt.herb) items += ` 🌿${cnt.herb}`;
        const maxHP = getMaxHP(foxLevel);
        const nextXP = xpForLevel(foxLevel);
        const bioInfo = chunkManager.getBiomeInfo(pos.x, pos.z);
        const biomeName = getBiomeName(bioInfo, pos.y);
        const location = currentHouse ? (currentHouse.legendary ? '🏛️ Legendary Estate' : currentHouse.owned ? '🏠 Home' : '🏚️ House') : (bioInfo.cityFactor > 0.1 ? `🏙️ ${biomeName.charAt(0).toUpperCase() + biomeName.slice(1)} City` : biomeName);
        const presBadge = isPresident ? ' 🏛️PRESIDENT' : '';
        infoEl.textContent = `⚔️${presBadge} ${location} · Lv${foxLevel} ❤️${Math.ceil(foxCurrentHP)}/${maxHP} ⭐${foxXP}/${nextXP}${controls.keys.sprint ? ' ⚡SPRINT' : ''}` + items;
        infoEl.style.background = isPresident ? 'rgba(100,80,20,0.7)' : 'rgba(0,0,0,0.5)';
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
  }

  renderer.render(scene, camera);
  } catch (e) {
    console.error('[animate] Uncaught error:', e);
  }
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
