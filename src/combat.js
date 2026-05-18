import { WOLF_HP, WOLF_ATK, WOLF_DEF } from './wolf.js';

const FOX_HP = 20;
const FOX_ATK = 5;
const FOX_DEF = 2;

export class Combat {
  constructor(onCombatEnd, onGameOver) {
    this.onCombatEnd = onCombatEnd;
    this.onGameOver = onGameOver;
    this.foxHP = FOX_HP;
    this.wolfHP = WOLF_HP;
    this.foxATK = FOX_ATK;
    this.foxDEF = FOX_DEF;
    this.wolfATK = WOLF_ATK;
    this.wolfDEF = WOLF_DEF;
    this.isActive = false;
    this.isFoxTurn = true;
    this.wolf = null;
    this.#setupUI();
  }

  #setupUI() {
    this.overlay = document.getElementById('combat-overlay');
    this.foxHPEl = document.getElementById('fox-hp');
    this.wolfHPEl = document.getElementById('wolf-hp');
    this.logEl = document.getElementById('combat-log');
    this.btnAttack = document.getElementById('btn-attack');
    this.btnFlee = document.getElementById('btn-flee');

    this.btnAttack.addEventListener('click', () => this.#playerAttack());
    this.btnFlee.addEventListener('click', () => this.#playerFlee());
  }

  start(wolf) {
    this.wolf = wolf;
    this.foxHP = FOX_HP;
    this.wolfHP = WOLF_HP;
    this.isActive = true;
    this.isFoxTurn = true;
    this.logEl.innerHTML = '';
    this.overlay.style.display = 'flex';
    this.#updateUI();
    this.#addLog('A wolf attacks!');
    this.btnAttack.disabled = false;
    this.btnFlee.disabled = false;
  }

  #end() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    this.onCombatEnd(this.wolf);
  }

  #playerAttack() {
    if (!this.isFoxTurn || !this.isActive) return;
    this.isFoxTurn = false;
    this.btnAttack.disabled = true;
    this.btnFlee.disabled = true;

    const dmg = Math.max(1, this.foxATK - this.wolfDEF);
    this.wolfHP -= dmg;
    this.#addLog(`Fox attacks for ${dmg} damage!`);
    this.#updateUI();

    if (this.wolfHP <= 0) {
      this.#addLog('Wolf defeated!');
      setTimeout(() => this.#end(), 1200);
    } else {
      setTimeout(() => this.#wolfTurn(), 600);
    }
  }

  #playerFlee() {
    if (!this.isFoxTurn || !this.isActive) return;
    this.isFoxTurn = false;
    this.btnAttack.disabled = true;
    this.btnFlee.disabled = true;

    if (Math.random() < 0.4) {
      this.#addLog('Fox fled successfully!');
      setTimeout(() => this.#end(), 600);
    } else {
      this.#addLog('Failed to flee!');
      setTimeout(() => this.#wolfTurn(), 600);
    }
  }

  #wolfTurn() {
    if (!this.isActive) return;
    const dmg = Math.max(1, this.wolfATK - this.foxDEF);
    this.foxHP -= dmg;
    this.#addLog(`Wolf attacks for ${dmg} damage!`);
    this.#updateUI();

    if (this.foxHP <= 0) {
      this.#addLog('The fox has been defeated...');
      this.isActive = false;
      setTimeout(() => this.onGameOver(), 1500);
    } else {
      this.isFoxTurn = true;
      this.btnAttack.disabled = false;
      this.btnFlee.disabled = false;
    }
  }

  #updateUI() {
    this.foxHPEl.textContent = this.foxHP;
    this.wolfHPEl.textContent = this.wolfHP;
  }

  #addLog(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}
