import * as THREE from 'three';

const ATTACKS = {
  fast:   { key: 'fast',   name: 'Fast',    minDmg: 1, maxDmg: 4,  hitChance: 0.9, eWeight: 0.25 },
  medium: { key: 'medium', name: 'Medium',  minDmg: 3, maxDmg: 8,  hitChance: 0.7, eWeight: 0.50 },
  slow:   { key: 'slow',   name: 'Slow',    minDmg: 6, maxDmg: 14, hitChance: 0.5, eWeight: 0.25 },
};

const FOX_MAX_HP = 20;
const FOX_ATK = 5;
const FOX_DEF = 2;
const DEF_HIT_MULT = 0.5;
const DEF_DMG_MULT = 0.4;

const VEC = new THREE.Vector3();

export class Combat {
  constructor(onCombatEnd, onGameOver, itemManager) {
    this.onCombatEnd = onCombatEnd;
    this.onGameOver = onGameOver;
    this.itemManager = itemManager;
    this.isActive = false;
    this.creature = null;
    this.foxGroup = null;
    this.enemyGroup = null;
    this.foxHP = FOX_MAX_HP;
    this.foxATK = FOX_ATK;
    this.foxDEF = FOX_DEF;
    this.enemyHP = 0;
    this.enemyATK = 0;
    this.enemyDEF = 0;
    this.enemyMaxHP = 0;
    this.isPlayerDefending = false;
    this.isEnemyDefending = false;
    this.anim = null;
    this.#grab();
  }

  #grab() {
    this.flashEl = document.getElementById('combat-flash');

    this.hud = document.getElementById('combat-hud');
    this.foxHud = document.getElementById('fox-hud');
    this.enemyHud = document.getElementById('enemy-hud');
    this.foxHPEl = document.getElementById('fox-hp');
    this.foxFill = document.getElementById('fox-hp-fill');
    this.enemyHPEl = document.getElementById('enemy-hp');
    this.enemyMaxEl = document.getElementById('enemy-max-hp');
    this.enemyFill = document.getElementById('enemy-hp-fill');
    this.enemyNameEl = document.getElementById('enemy-name');
    this.enemyIconEl = document.getElementById('enemy-icon');

    this.ui = document.getElementById('combat-ui');
    this.logEl = document.getElementById('combat-log');
    this.mainActions = document.getElementById('combat-main-actions');
    this.attackTypes = document.getElementById('combat-attack-types');
    this.itemTypes = document.getElementById('combat-item-types');
    this.itemStickCount = document.getElementById('item-stick-count');
    this.itemRockCount = document.getElementById('item-rock-count');

    document.getElementById('btn-attack').addEventListener('click', () => this.#showAttackTypes());
    document.getElementById('btn-defend').addEventListener('click', () => this.#doDefend());
    document.getElementById('btn-flee').addEventListener('click', () => this.#doFlee());
    document.getElementById('btn-item').addEventListener('click', () => this.#showItemTypes());
    document.getElementById('btn-attack-fast').addEventListener('click', () => this.#doAttack('fast'));
    document.getElementById('btn-attack-medium').addEventListener('click', () => this.#doAttack('medium'));
    document.getElementById('btn-attack-slow').addEventListener('click', () => this.#doAttack('slow'));
    document.getElementById('btn-attack-back').addEventListener('click', () => this.#showMainActions());
    document.getElementById('btn-item-stick').addEventListener('click', () => this.#useItem('stick'));
    document.getElementById('btn-item-rock').addEventListener('click', () => this.#useItem('rock'));
    document.getElementById('btn-item-back').addEventListener('click', () => this.#showMainActions());
  }

  start(creature, foxGroup, enemyGroup) {
    this.creature = creature;
    this.foxGroup = foxGroup;
    this.enemyGroup = enemyGroup;
    this.foxHP = FOX_MAX_HP;
    this.enemyHP = creature.hp;
    this.enemyMaxHP = creature.hp;
    this.enemyATK = creature.atk;
    this.enemyDEF = creature.def;
    this.isActive = true;
    this.isPlayerDefending = false;
    this.isEnemyDefending = false;

    this.logEl.innerHTML = '';
    this.hud.style.display = 'block';
    this.ui.style.display = 'flex';

    this.enemyNameEl.textContent = creature.displayName;
    this.enemyIconEl.textContent = creature.icon;
    this.enemyMaxEl.textContent = creature.hp;

    this.#showMainActions();
    this.#updateHP();
    this.#addLog(`${creature.displayName} attacks!`);

    this.flashEl.classList.add('active');
    setTimeout(() => this.flashEl.classList.remove('active'), 150);

    this.#faceEachOther();
  }

  getEnemyPosition() {
    return this.enemyGroup ? this.enemyGroup.position : VEC;
  }

  updateHUD(camera) {
    if (!this.isActive) return;
    this.#projectToHUD(this.foxGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)), this.foxHud, camera);
    this.#projectToHUD(this.enemyGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)), this.enemyHud, camera);
  }

  #projectToHUD(worldPos, hudEl, camera) {
    worldPos.project(camera);
    const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;
    hudEl.style.left = x + 'px';
    hudEl.style.top = y + 'px';
  }

  #startAnim(attacker, speed) {
    const g = attacker === 'fox' ? this.foxGroup : this.enemyGroup;
    const target = attacker === 'fox' ? this.enemyGroup : this.foxGroup;
    const dir = new THREE.Vector3().subVectors(target.position, g.position);
    dir.y = 0;
    dir.normalize();
    const dist = g.position.distanceTo(target.position) * 0.35;
    const dur = speed === 'fast' ? 0.2 : speed === 'medium' ? 0.3 : 0.45;
    this.anim = {
      group: g,
      start: g.position.clone(),
      peak: g.position.clone().add(dir.multiplyScalar(dist)),
      dur,
      t: 0,
    };
  }

  updateAnim(dt) {
    if (!this.anim) return;
    this.anim.t += dt;
    const p = Math.min(1, this.anim.t / this.anim.dur);
    if (p < 0.5) {
      const f = p * 2;
      this.anim.group.position.lerpVectors(this.anim.start, this.anim.peak, f);
    } else {
      const f = (p - 0.5) * 2;
      this.anim.group.position.lerpVectors(this.anim.peak, this.anim.start, f);
    }
    if (p >= 1) {
      this.anim.group.position.copy(this.anim.start);
      this.anim = null;
    }
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

  #showMainActions() {
    this.mainActions.style.display = 'flex';
    this.attackTypes.style.display = 'none';
    this.itemTypes.style.display = 'none';
  }

  #showAttackTypes() {
    this.mainActions.style.display = 'none';
    this.attackTypes.style.display = 'flex';
    this.itemTypes.style.display = 'none';
    this.#enableGroup(this.attackTypes);
  }

  #showItemTypes() {
    const counts = this.itemManager.getCounts();
    this.itemStickCount.textContent = counts.stick;
    this.itemRockCount.textContent = counts.rock;
    this.mainActions.style.display = 'none';
    this.attackTypes.style.display = 'none';
    this.itemTypes.style.display = 'flex';
    this.#enableGroup(this.itemTypes);
  }

  #disableAll() {
    const all = document.querySelectorAll('#combat-ui button');
    all.forEach(b => b.disabled = true);
  }

  #enableGroup(parent) {
    parent.querySelectorAll('button').forEach(b => { b.disabled = false; });
  }

  #enableMain() {
    this.#showMainActions();
    this.#enableGroup(this.mainActions);
  }

  #doDefend() {
    this.#disableAll();
    this.isPlayerDefending = true;
    this.#addLog('Fox defends!');
    setTimeout(() => this.#enemyTurn(), 400);
  }

  #doFlee() {
    this.#disableAll();
    if (Math.random() < 0.4) {
      this.#addLog('Fox fled successfully!');
      setTimeout(() => this.#end(), 600);
    } else {
      this.#addLog('Failed to flee!');
      this.isPlayerDefending = false;
      setTimeout(() => this.#enemyTurn(), 600);
    }
  }

  #doAttack(speed) {
    this.#disableAll();
    this.isPlayerDefending = false;
    const atk = ATTACKS[speed];
    const hitMult = this.isEnemyDefending ? DEF_HIT_MULT : 1;
    const dmgMult = this.isEnemyDefending ? DEF_DMG_MULT : 1;
    const wasDefending = this.isEnemyDefending;
    this.isEnemyDefending = false;

    this.#startAnim('fox', speed);

    if (Math.random() < atk.hitChance * hitMult) {
      const raw = atk.minDmg + Math.random() * (atk.maxDmg - atk.minDmg);
      const dmg = Math.max(1, Math.floor(raw * dmgMult - this.enemyDEF));
      this.enemyHP -= dmg;
      let msg = `Fox uses ${atk.name} for ${dmg} damage!`;
      if (wasDefending) msg += ' (enemy blocked some)';
      this.#addLog(msg);
      this.#updateHP();
      if (this.enemyHP <= 0) {
        this.#addLog(`${this.creature.displayName} defeated!`);
        setTimeout(() => this.#end(), 1200);
        return;
      }
    } else {
      this.#addLog(`Fox's ${atk.name} missed!`);
    }
    setTimeout(() => this.#enemyTurn(), 600);
  }

  #enemyTurn() {
    if (!this.isActive) return;
    const hpRatio = this.enemyHP / this.enemyMaxHP;
    const defChance = hpRatio < 0.3 ? 0.5 : 0.35;

    if (Math.random() < defChance) {
      this.isEnemyDefending = true;
      this.#addLog(`${this.creature.displayName} defends!`);
      this.#playerTurn();
      return;
    }
    this.isEnemyDefending = false;
    const atk = this.#pickEnemyAttack();
    this.#startAnim('enemy', atk.key);
    const hitMult = this.isPlayerDefending ? DEF_HIT_MULT : 1;
    const dmgMult = this.isPlayerDefending ? DEF_DMG_MULT : 1;
    const wasDefending = this.isPlayerDefending;
    this.isPlayerDefending = false;

    if (Math.random() < atk.hitChance * hitMult) {
      const raw = atk.minDmg + Math.random() * (atk.maxDmg - atk.minDmg);
      const dmg = Math.max(1, Math.floor(raw * dmgMult - this.foxDEF));
      this.foxHP -= dmg;
      let msg = `${this.creature.displayName} uses ${atk.name} for ${dmg} damage!`;
      if (wasDefending) msg += ' (fox blocked some)';
      this.#addLog(msg);
      this.#updateHP();
      if (this.foxHP <= 0) {
        this.#addLog('The fox has been defeated...');
        this.isActive = false;
        setTimeout(() => this.onGameOver(), 1500);
        return;
      }
    } else {
      this.#addLog(`${this.creature.displayName}'s ${atk.name} missed!`);
    }
    this.#playerTurn();
  }

  #pickEnemyAttack() {
    const r = Math.random();
    let cum = 0;
    for (const [key, cfg] of Object.entries(ATTACKS)) {
      cum += cfg.eWeight;
      if (r < cum) return cfg;
    }
    return ATTACKS.medium;
  }

  #playerTurn() {
    if (!this.isActive) return;
    this.#enableMain();
  }

  #useItem(type) {
    const item = this.itemManager.useItem(type);
    if (!item) return;
    this.#disableAll();
    this.isPlayerDefending = false;
    this.isEnemyDefending = false;

    this.#startAnim('fox', 'fast');

    const raw = item.minDmg + Math.random() * (item.maxDmg - item.minDmg);
    const dmg = Math.max(1, Math.floor(raw - this.enemyDEF));
    this.enemyHP -= dmg;
    this.#addLog(`Fox uses ${item.name} for ${dmg} damage!`);
    this.#updateHP();
    if (this.enemyHP <= 0) {
      this.#addLog(`${this.creature.displayName} defeated!`);
      setTimeout(() => this.#end(), 1200);
      return;
    }
    setTimeout(() => this.#enemyTurn(), 600);
  }

  #end() {
    this.isActive = false;
    this.hud.style.display = 'none';
    this.ui.style.display = 'none';
    this.onCombatEnd(this.creature);
  }

  #updateHP() {
    this.foxHPEl.textContent = this.foxHP;
    this.foxFill.style.width = Math.max(0, (this.foxHP / FOX_MAX_HP) * 100) + '%';
    this.enemyHPEl.textContent = this.enemyHP;
    this.enemyFill.style.width = Math.max(0, (this.enemyHP / this.enemyMaxHP) * 100) + '%';
  }

  #addLog(msg) {
    const div = document.createElement('div');
    div.textContent = msg;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}
