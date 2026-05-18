import * as THREE from 'three';
import { ChunkManager } from './world.js';
import { Animal } from './animal.js';
import { Controls } from './controls.js';
import { Wolf } from './wolf.js';
import { Combat } from './combat.js';
import './style.css';

const EXPLORE = 0;
const COMBAT = 1;
const GAME_OVER = 2;

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

const ambientLight = new THREE.AmbientLight(0x303050, 0.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x5a8d54, 0.6);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xFFD58E, 1.4);
sunLight.position.set(50, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -25;
sunLight.shadow.camera.right = 25;
sunLight.shadow.camera.top = 25;
sunLight.shadow.camera.bottom = -25;
sunLight.shadow.bias = -0.001;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x6B8EC5, 0.35);
fillLight.position.set(-40, 20, -40);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xFFEECC, 0.4);
rimLight.position.set(-30, 10, 50);
scene.add(rimLight);

const chunkManager = new ChunkManager(scene);
scene.fog = new THREE.FogExp2(0x88B8D8, 0.0025);

const animal = new Animal();
animal.group.position.set(0, chunkManager.getHeight(0, 0), 0);
scene.add(animal.group);

const controls = new Controls(camera, animal, renderer.domElement, chunkManager.getHeight);

camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const wolves = [];

const combat = new Combat(
  (wolf) => {
    gameState = EXPLORE;
    const idx = wolves.indexOf(wolf);
    if (idx !== -1) {
      wolf.removeFrom(scene);
      wolves.splice(idx, 1);
    }
  },
  () => {
    document.getElementById('game-over-overlay').style.display = 'flex';
    gameState = GAME_OVER;
  }
);

const clock = new THREE.Clock();

const infoEl = document.getElementById('info');

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
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  const sky = new THREE.Mesh(geo, mat);
  scene.add(sky);
  return sky;
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

      sunLight.position.set(pos.x + 50, 60, pos.z + 30);
      sunLight.target.position.copy(pos);
      sunLight.target.updateMatrixWorld();
      sunLight.shadow.camera.left = -25;
      sunLight.shadow.camera.right = 25;
      sunLight.shadow.camera.top = 25;
      sunLight.shadow.camera.bottom = -25;
      sunLight.shadow.camera.updateProjectionMatrix();

      const targetWolfCount = 4;
      while (wolves.length < targetWolfCount) {
        spawnWolf();
      }

      for (const wolf of wolves) {
        const result = wolf.update(dt, pos);
        if (result === 'attacking') {
          gameState = COMBAT;
          combat.start(wolf);
          break;
        }
      }
      controls.update(dt);

      sky.position.copy(camera.position);

      if (controls.superMode) {
        infoEl.textContent = 'SUPER MODE — WASD to fly · Space/Shift up/down · F to toggle';
        infoEl.style.background = 'rgba(200,50,50,0.7)';
      } else {
        infoEl.textContent = 'WASD to move · A/D to turn · Click & drag to orbit · F for super mode';
        infoEl.style.background = 'rgba(0,0,0,0.5)';
      }
      break;
    }
    case COMBAT:
      break;
    case GAME_OVER:
      break;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
