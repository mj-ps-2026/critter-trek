import * as THREE from 'three';

const ATTACK_TYPES = {
  fast:   { name: 'Fast',    minDmg: 1, maxDmg: 4,  hitChance: 0.9, enemyWeight: 0.25 },
  medium: { name: 'Medium',  minDmg: 3, maxDmg: 8,  hitChance: 0.7, enemyWeight: 0.50 },
  slow:   { name: 'Slow',    minDmg: 6, maxDmg: 14, hitChance: 0.5, enemyWeight: 0.25 },
};

const FOX_HP = 20;
const FOX_ATK = 5;
const FOX_DEF = 2;
const DEFEND_HIT_MULT = 0.5;
const DEFEND_DMG_MULT = 0.4;

export class Combat {
  constructor(onCombatEnd, onGameOver) {
    this.onCombatEnd = onCombatEnd;
    this.onGameOver = onGameOver;
    this.isActive = false;
    this.creature = null;
    this.foxGroup = null;
    this.enemyGroup = null;
    this.#setupUI();
  }

  start(creature, foxGroup, enemyGroup) {
    this.creature = creature;
    this.foxGroup = foxGroup;
    this.enemyGroup = enemyGroup;
    this.foxHP = FOX_HP;
    this.foxATK = FOX_ATK;
    this.foxDEF = FOX_DEF;
    this.enemyHP = creature.hp;
    this.enemyATK = creature.atk;
    this.enemyDEF = creature.def;
    this.isActive = true;
    this.isPlayerDefending = false;
    this.isEnemyDefending = false;
    this.logEl.innerHTML = '';
    this.overlay.style.display = 'flex';
    this.enemyNameEl.textContent = creature.displayName;
    this.enemyIconEl.textContent = creature.icon;
    this.#showMainActions();
    this.#updateHP();
    this.#addLog(`${creature.displayName} attacks!`);

    this.flashEl.classList.add('active');
    setTimeout(() => this.flashEl.classList.remove('active'), 150);

    this.#faceEachOther();
  }

  getEnemyPosition() {
    return this.enemyGroup ? this.enemyGroup.position : new THREE.Vector3();
  }

  #faceEachOther() {
    if (!this.foxGroup || !this.enemyGroup) return;
    const fwd = new THREE.Vector3().subVectors(this.enemyGroup.position, this.foxGroup.position);
    fwd.y = 0;
    if (fwd.length() > 0.01) {
      const a = Math.atan2(fwd.x, -fwd.z);
      this.foxGroup.rotation.y = a;
      this.enemyGroup.rotation.y = a + Math.PI;
    }
  }

  #setupUI() {
    this.overlay = document.getElementById('combat-overlay');
    this.flashEl = document.getElementById('combat-flash');
    this.foxHPEl = document.getElementById('fox-hp');
    this.enemyHPEl = document.getElementById('enemy-hp');
    this.enemyNameEl = document.getElementById('enemy-name');
    this.enemyIconEl = document.getElementById('enemy-icon');
    this.logEl = document.getElementById('combat-log');

    this.mainActions = document.getElementById('combat-main-actions');
    this.attackTypes = document.getElementById('combat-attack-types');

    document.getElementById('btn-attack').addEventListener('click', () => this.#showAttackTypes());
    document.getElementById('btn-defend').addEventListener('click', () => this.#doDefend());
    document.getElementById('btn-flee').addEventListener('click', () => this.#doFlee());
    document.getElementById('btn-attack-fast').addEventListener('click', () => this.#doAttack('fast'));
    document.getElementById('btn-attack-medium').addEventListener('click', () => this.#doAttack('medium'));
    document.getElementById('btn-attack-slow').addEventListener('click', () => this.#doAttack('slow'));
    document.getElementById('btn-attack-back').addEventListener('click', () => this.#showMainActions());
  }

  #showMainActions() {
    this.mainActions.style.display = 'flex';
    this.attackTypes.style.display = 'none';
  }

  #showAttackTypes() {
    this.mainActions.style.display = 'none';
    this.attackTypes.style.display = 'flex';
  }

  #lockButtons() {
    const all = document.querySelectorAll('#combat-main-actions button, #combat-attack-types button');
    all.forEach(b => b.disabled = true);
  }

  #unlockMainButtons() {
    document.querySelectorAll('#combat-main-actions button').forEach(b => b.disabled = false);
    document.getElementById('btn-item').disabled = true;
  }

  #doDefend() {
    this.#lockButtons();
    this.isPlayerDefending = true;
    this.#addLog('Fox defends!');
    this.#enemyTurn();
  }

  #doFlee() {
    this.#lockButtons();
    if (Math.random() < 0.4) {
      this.#addLog('Fox fled successfully!');
      setTimeout(() => this.#end(), 600);
    } else {
      this.#addLog('Failed to flee!');
      this.isPlayerDefending = false;
      this.#enemyTurn();
    }
  }

  #doAttack(speed) {
    this.#lockButtons();
    this.isPlayerDefending = false;
    const atk = ATTACK_TYPES[speed];
    const hitMult = this.isEnemyDefending ? DEFEND_HIT_MULT : 1;
    const dmgMult = this.isEnemyDefending ? DEFEND_DMG_MULT : 1;
    this.isEnemyDefending = false;

    if (Math.random() < atk.hitChance * hitMult) {
      const rawDmg = atk.minDmg + Math.random() * (atk.maxDmg - atk.minDmg);
      const dmg = Math.max(0, Math.floor(rawDmg * dmgMult - this.enemyDEF));
      const finalDmg = Math.max(1, dmg);
      this.enemyHP -= finalDmg;
      let msg = `Fox uses ${atk.name} attack for ${finalDmg} damage!`;
      if (this.isEnemyDefending) msg += ' (enemy defended)';
      this.#addLog(msg);
      this.#updateHP();

      if (this.enemyHP <= 0) {
        this.#addLog(`${this.creature.displayName} defeated!`);
        setTimeout(() => this.#end(), 1200);
        return;
      }
    } else {
      this.#addLog(`Fox's ${atk.name} attack missed!`);
    }

    setTimeout(() => this.#enemyTurn(), 600);
  }

  #enemyTurn() {
    if (!this.isActive) return;

    const maxHP = this.creature.hp;
    const hpRatio = this.enemyHP / maxHP;
    const defendChance = hpRatio < 0.3 ? 0.5 : 0.35;

    if (Math.random() < defendChance) {
      this.isEnemyDefending = true;
      this.#addLog(`${this.creature.displayName} defends!`);
      this.#playerTurn();
      return;
    }

    this.isEnemyDefending = false;
    const atk = this.#pickEnemyAttack();
    const hitMult = this.isPlayerDefending ? DEFEND_HIT_MULT : 1;
    const dmgMult = this.isPlayerDefending ? DEFEND_DMG_MULT : 1;
    this.isPlayerDefending = false;

    if (Math.random() < atk.hitChance * hitMult) {
      const rawDmg = atk.minDmg + Math.random() * (atk.maxDmg - atk.minDmg);
      const dmg = Math.max(0, Math.floor(rawDmg * dmgMult - this.foxDEF));
      const finalDmg = Math.max(1, dmg);
      this.foxHP -= finalDmg;
      let msg = `${this.creature.displayName} uses ${atk.name} for ${finalDmg} damage!`;
      if (this.isPlayerDefending) msg += ' (fox defended)';
      this.#addLog(msg);
      this.#updateHP();

      if (this.foxHP <= 0) {
        this.#addLog('The fox has been defeated...');
        this.isActive = false;
        setTimeout(() => this.onGameOver(), 1500);
        return;
      }
    } else {
      this.#addLog(`${this.creature.displayName}'s ${atk.name} attack missed!`);
    }

    this.#playerTurn();
  }

  #pickEnemyAttack() {
    const r = Math.random();
    let cum = 0;
    for (const [key, cfg] of Object.entries(ATTACK_TYPES)) {
      cum += cfg.enemyWeight;
      if (r < cum) return cfg;
    }
    return ATTACK_TYPES.medium;
  }

  #playerTurn() {
    if (!this.isActive) return;
    this.#showMainActions();
    this.#unlockMainButtons();
  }

  #end() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    this.onCombatEnd(this.creature);
  }

  #updateHP() {
    this.foxHPEl.textContent = this.foxHP;
    this.enemyHPEl.textContent = this.enemyHP;
  }

  #addLog(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}
