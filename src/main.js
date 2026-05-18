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
scene.background = new THREE.Color(0x7EC8E3);
scene.fog = new THREE.Fog(0x7EC8E3, 60, 160);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.prepend(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.6);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xFFEECC, 1.2);
sunLight.position.set(50, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8888FF, 0.3);
fillLight.position.set(-30, 30, -30);
scene.add(fillLight);

const chunkManager = new ChunkManager(scene);

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
