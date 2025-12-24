// ============================================
// 전투 시스템 v4.1 (데미지 공식 + 직업 시너지 + 광기)
// ============================================

const { MONSTERS, MONSTER_TYPES, GRADES } = require('../data/monsters');
const { BOSSES } = require('../data/bosses');
const { JOBS } = require('../data/jobs');
const { MADNESS_SYSTEM } = require('../data/config');

// ============================================
// 몬스터 생성
// ============================================

function spawnMonster(floor, isHidden = false) {
  if (isHidden) {
    const { HIDDEN_BOSS } = require('../data/monsters');
    const h = HIDDEN_BOSS;
    const t = MONSTER_TYPES[h.type];
    const floorMult = 1 + Math.floor(floor / 10) * 0.2;
    
    return {
      id: 'hidden_boss',
      name: `🌑 ${h.name}`,
      type: h.type,
      typeName: t.name,
      hp: Math.floor(h.baseHp * floorMult),
      maxHp: Math.floor(h.baseHp * floorMult),
      atk: Math.floor(h.baseAtk * floorMult),
      def: Math.floor(h.baseDef * floorMult),
      spd: h.spd,
      evasion: t.evasion + 10,
      exp: Math.floor(h.baseExp * floorMult),
      gold: Math.floor(h.baseGold * floorMult),
      patterns: h.patterns,
      grade: 4,
      isBoss: true,
      isHidden: true
    };
  }
  
  if (BOSSES[floor]) {
    const boss = BOSSES[floor];
    const t = MONSTER_TYPES[boss.type];
    const currentPhase = boss.phases[0];
    
    return {
      id: `boss_${floor}`,
      name: `⭐${boss.name}⭐`,
      type: boss.type,
      typeName: t.name,
      hp: boss.baseHp,
      maxHp: boss.baseHp,
      atk: boss.baseAtk,
      def: boss.baseDef,
      spd: boss.spd,
      evasion: t.evasion + 8,
      exp: boss.baseExp,
      gold: boss.baseGold,
      patterns: currentPhase.patterns,
      phases: boss.phases,
      currentPhase: 1,
      grade: 5,
      isBoss: true,
      isHidden: false,
      firstKillReward: boss.firstKillReward
    };
  }
  
  const pool = MONSTERS.filter(m => m.minFloor <= floor && m.maxFloor >= floor);
  if (pool.length === 0) {
    const highestFloor = Math.max(...MONSTERS.map(m => m.maxFloor));
    const fallbackPool = MONSTERS.filter(m => m.maxFloor === highestFloor);
    const base = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    return createMonsterFromBase(base, floor);
  }
  
  const base = pool[Math.floor(Math.random() * pool.length)];
  return createMonsterFromBase(base, floor);
}

function createMonsterFromBase(base, floor) {
  const grade = determineGrade(floor);
  const g = GRADES[grade];
  const t = MONSTER_TYPES[base.type];
  const floorMult = 1 + Math.floor(floor / 8) * 0.18;
  
  return {
    id: base.id,
    name: grade > 1 ? `${g.name} ${base.name}` : base.name,
    type: base.type,
    typeName: t.name,
    hp: Math.floor(base.baseHp * t.hpMult * g.mult * floorMult),
    maxHp: Math.floor(base.baseHp * t.hpMult * g.mult * floorMult),
    atk: Math.floor(base.baseAtk * t.atkMult * g.mult * floorMult),
    def: Math.floor(base.baseDef * t.defMult * g.mult * floorMult),
    spd: base.spd,
    evasion: t.evasion,
    exp: Math.floor(base.baseExp * g.expMult * floorMult),
    gold: Math.floor(base.baseExp * 0.7 * g.expMult * floorMult),
    patterns: base.patterns,
    grade,
    isBoss: false,
    isHidden: false
  };
}

function determineGrade(floor) {
  const roll = Math.random() * 100;
  const bonus = Math.floor(floor / 8) * 2.5;
  if (roll < 0.5 + bonus * 0.1) return 5;
  if (roll < 3 + bonus * 0.3) return 4;
  if (roll < 10 + bonus) return 3;
  if (roll < 30 + bonus) return 2;
  return 1;
}

// ============================================
// 보스 페이즈
// ============================================

function checkBossPhase(monster) {
  if (!monster.isBoss || !monster.phases) return false;
  
  const hpPercent = monster.hp / monster.maxHp;
  
  for (let i = monster.phases.length - 1; i >= 0; i--) {
    const phase = monster.phases[i];
    if (hpPercent >= phase.hpRange[0] && hpPercent <= phase.hpRange[1]) {
      if (monster.currentPhase !== phase.phase) {
        monster.currentPhase = phase.phase;
        monster.patterns = phase.patterns;
        return phase;
      }
      return false;
    }
  }
  
  return false;
}

// ============================================
// 패턴 시스템
// ============================================

function selectPattern(monster) {
  const patterns = monster.patterns || [];
  if (patterns.length === 0) {
    return {
      id: 'basic_attack',
      name: '공격',
      correct: '방어',
      dmgMult: 1.0,
      telegraph: {
        0: '적이 공격한다',
        1: '적이 공격한다',
        2: '적이 공격한다',
        3: '적이 공격한다',
        4: '적이 공격한다'
      }
    };
  }
  
  const totalWeight = patterns.reduce((sum, p) => sum + (p.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  
  for (const pattern of patterns) {
    roll -= (pattern.weight || 1);
    if (roll <= 0) {
      return pattern;
    }
  }
  
  return patterns[0];
}

function getTelegraph(pattern, understandingLevel) {
  const level = Math.max(0, Math.min(4, understandingLevel));
  return pattern.telegraph?.[level] || pattern.telegraph?.[0] || '적이 움직인다';
}

function getChoices(pattern, understandingLevel) {
  const allChoices = ['회피', '방어', '역습'];
  
  if (understandingLevel === 0) {
    return shuffle([...allChoices]);
  }
  
  if (understandingLevel === 1) {
    return shuffle([...allChoices]);
  }
  
  if (understandingLevel === 2) {
    const correct = pattern.correct;
    const others = allChoices.filter(c => c !== correct);
    const randomOther = others[Math.floor(Math.random() * others.length)];
    return shuffle([correct, randomOther, '???']);
  }
  
  if (understandingLevel === 3) {
    return [pattern.correct, '???', '???'];
  }
  
  return [pattern.correct, '???', '???'];
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================
// 해석 판정 (v4.1)
// ============================================

function judgeInterpret(playerChoice, pattern, understandingLevel) {
  const correct = pattern.correct;

  // 이해도 4 이상 = 자동 완벽
  if (understandingLevel >= 4) {
    return {
      result: 'perfect',
      damageMultiplier: 2.0,
      damageTakenMultiplier: 0,
      priority: 'player',
      message: '✨ 완벽 해석! 피해 2배, 피격 0'
    };
  }

  // 정답
  if (playerChoice === correct) {
    return {
      result: 'perfect',
      damageMultiplier: 2.0,
      damageTakenMultiplier: 0,
      priority: 'player',
      message: '✨ 완벽 해석! 피해 2배, 피격 0'
    };
  }

  // 부분 정답 체크
  const partialPairs = [
    { pattern: '회피', choice: '방어' },
    { pattern: '방어', choice: '역습' },
    { pattern: '역습', choice: '회피' }
  ];

  const isPartial = partialPairs.some(
    pair => pair.pattern === correct && pair.choice === playerChoice
  );

  if (isPartial) {
    return {
      result: 'partial',
      damageMultiplier: 1.0,
      damageTakenMultiplier: 1.0,
      priority: 'speed',
      message: '⚠️ 부분 해석. 피해 그대로'
    };
  }

  // 실패
  return {
    result: 'fail',
    damageMultiplier: 0.5,
    damageTakenMultiplier: 1.5,
    priority: 'enemy',
    message: '❌ 해석 실패! 피해 0.5배, 피격 1.5배'
  };
}

function updateInterpretStreak(player, result) {
  if (result === 'perfect') {
    player.interpretStreak = (player.interpretStreak || 0) + 1;
  } else {
    player.interpretStreak = 0;
  }
  return player.interpretStreak;
}

function getStreakBonus(streak) {
  if (streak >= 5) return { atkBonus: 0.25, defBonus: 0.15 };
  if (streak >= 3) return { atkBonus: 0.15, defBonus: 0.10 };
  return {};
}

// ============================================
// 패시브 적용
// ============================================

function applyAllPassives(player, monster, interpretResult, context) {
  const job = JOBS[player.job];
  if (!job || !job.passives) return;
  
  job.passives.forEach(passive => {
    // 방랑자 - 결사 (HP < 40% 공격 +25%)
    if (passive.id === 'wanderer_1') {
      const hpPercent = player.hp / player.maxHp;
      if (hpPercent < 0.4) {
        context.atkBonus = (context.atkBonus || 0) + 0.25;
      }
    }
    
    // 사냥꾼 - 속사 (속도 빠르면 선공)
    if (passive.id === 'hunter_1') {
      if (player.spd > monster.spd) {
        context.playerPriority = true;
      }
    }
    
    // 사냥꾼 - 급소 포착 (완벽 해석 시 크리 +30%)
    if (passive.id === 'hunter_2') {
      if (interpretResult.result === 'perfect') {
        context.critRateBonus = (context.critRateBonus || 0) + 30;
      }
    }
    
    // 사냥꾼 - 표적 고정 (동일 대상 공격 시 +5% 중첩)
    if (passive.id === 'hunter_3') {
      const stacks = player.hunterStacks || 0;
      if (stacks > 0) {
        context.atkBonus = (context.atkBonus || 0) + (stacks * 0.05);
      }
      player.hunterStacks = Math.min(5, stacks + 1);
    }
    
    // 이단자 - 광기 드랍 (광기 50+ 드랍 +60%)
    if (passive.id === 'heretic_1') {
      if ((player.madness || 0) >= 50) {
        context.dropBonus = 0.6;
      }
    }
    
    // 주술사 - 해석 성공 시 피해 -25%
    if (passive.id === 'shaman_2') {
      if (interpretResult.result === 'perfect' || interpretResult.result === 'partial') {
        context.damageTakenReduction = 0.25;
      }
    }
    
    // 철혈병 - 방어 시 반격 50%
    if (passive.id === 'ironblood_2') {
      if (interpretResult.result === 'fail') {
        context.counterChance = 0.5;
      }
    }
    
    // 기록자 - 해석 +12%
    if (passive.id === 'scribe_3') {
      context.interpretBonus = 0.12;
    }
  });
}

function applyOnAttackPassives(player, monster, damage) {
  const job = JOBS[player.job];
  const effects = {};
  
  if (!job || !job.passives) return effects;
  
  job.passives.forEach(passive => {
    // 방랑자 - 흡혈 (공격의 15%)
    if (passive.id === 'wanderer_2') {
      effects.lifesteal = damage * 0.15;
    }
    
    // 주술사 - 생명 갈고리 (공격의 20% 흡혈)
    if (passive.id === 'shaman_3') {
      effects.lifesteal = (effects.lifesteal || 0) + damage * 0.2;
    }
  });
  
  return effects;
}

function applyOnDamagedPassives(player, monster, damage) {
  const job = JOBS[player.job];
  const effects = {};
  
  if (!job || !job.passives) return effects;
  
  job.passives.forEach(passive => {
    // 철혈병 - 방어 시 반격
    if (passive.id === 'ironblood_2') {
      if (Math.random() < 0.5) {
        effects.counter = true;
        effects.counterDamage = Math.floor(damage * 0.5);
      }
    }
    
    // 이단자 - 불굴 (HP 0 되면 1로 생존, 1회)
    if (passive.id === 'heretic_3') {
      if (player.hp <= 0 && !player.usedSurvival) {
        player.hp = 1;
        player.usedSurvival = true;
        effects.survival = true;
      }
    }
  });
  
  return effects;
}

function checkSurvival(player) {
  const job = JOBS[player.job];
  if (!job || !job.passives) return false;
  
  const survivalPassive = job.passives.find(p => p.id === 'heretic_3');
  if (survivalPassive && player.hp <= 0 && !player.usedSurvival) {
    player.hp = 1;
    player.usedSurvival = true;
    return true;
  }
  
  return false;
}

// ============================================
// 직업-선택지 시너지 (v4.1)
// ============================================

function applyJobChoiceBonus(player, choice, interpretResult, context) {
  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);

  // 완벽 해석이 아니면 시너지 없음
  if (interpretResult.result !== 'perfect') return;

  switch (player.job) {
    case 'ironblood':
      // 철혈병 + 방어 = 확정 반격
      if (choice === '방어') {
        context.guaranteedCounter = true;
        context.counterDamage = c.def + (player.stats.vit * 2);
      }
      break;

    case 'hunter':
      // 사냥꾼 + 회피 = 크리 확정 + DEX 보너스 + 스택 2배
      if (choice === '회피') {
        context.forceCrit = true;
        context.bonusDamage = (context.bonusDamage || 0) + (player.stats.dex * 3);
        player.hunterStacks = Math.min(5, (player.hunterStacks || 0) + 2);
      }
      break;

    case 'shaman':
      // 주술사 + 역습 = 방무 30% + 흡혈 10% 추가
      if (choice === '역습') {
        context.defIgnore = (context.defIgnore || 0) + 0.3;
        context.lifestealBonus = 0.1;
      }
      break;

    case 'wanderer':
      // 방랑자 = HP 30% 이하시 추가 공격 보너스
      const hpPercent = player.hp / c.maxHp;
      if (hpPercent <= 0.3) {
        context.atkBonus = (context.atkBonus || 0) + 1.5;
      }
      break;

    case 'scribe':
      // 기록자 = 이해도 보너스
      context.understandingBonus = 50;
      break;

    case 'heretic':
      // 이단자 = 광기 보너스는 별도 처리
      break;
  }
}

// ============================================
// 전투 계산
// ============================================

function checkPriority(player, monster, interpretResult, context) {
  if (context.negateEnemyPriority && interpretResult.priority === 'enemy') {
    return 'player';
  }
  
  if (context.playerPriority) {
    return 'player';
  }
  
  if (interpretResult.priority === 'player') {
    return 'player';
  }
  
  if (interpretResult.priority === 'enemy') {
    return 'enemy';
  }
  
  return player.spd > monster.spd ? 'player' : 'enemy';
}

function calculatePlayerDamage(player, monster, interpretResult, context) {
  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);
  
  let baseDamage = c.atk;
  
  if (context.atkBonus) {
    baseDamage *= (1 + context.atkBonus);
  }
  
  baseDamage *= (interpretResult.damageMultiplier || 1.0);
  
  const effectiveDef = monster.def * (1 - (context.defIgnore || 0));
  baseDamage = Math.max(1, baseDamage - effectiveDef * 0.3);
  
  const critChance = c.critRate + (context.critRateBonus || 0);
  const isCrit = context.forceCrit || Math.random() * 100 < critChance;
  if (isCrit) {
    baseDamage *= (c.critDmg / 100);
  }
  
  if (context.hunterStacks) {
    baseDamage *= (1 + context.hunterStacks * 0.05);
  }
  
  return Math.floor(baseDamage);
}

function calculateEnemyDamage(monster, player, pattern, interpretResult, context) {
  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);

  // 기본 피해
  let baseDamage = monster.atk * (pattern.dmgMult || 1.0);

  // 방어력 감소 (최대 50%까지만)
  const reduction = Math.min(0.5, c.def / (c.def + 100));
  baseDamage *= (1 - reduction);

  // 최소 보장 피해 (최대 HP의 5%)
  const minDamage = Math.floor(c.maxHp * 0.05);
  baseDamage = Math.max(minDamage, baseDamage);

  // 해석 결과별 피격 배율 적용
  if (interpretResult.damageTakenMultiplier !== undefined) {
    baseDamage *= interpretResult.damageTakenMultiplier;
  }

  // 패턴별 오답 페널티
  if (interpretResult.result === 'fail') {
    const wrongPenalty = pattern.wrongPenalty || 1.0;
    baseDamage *= wrongPenalty;
  }

  // WIL 기반 실패 피해 감소
  if (interpretResult.result === 'fail' && c.failDamageReduction) {
    baseDamage *= (1 - c.failDamageReduction / 100);
  }

  // 기존 피해 감소 (주술사 등)
  if (context.damageTakenReduction) {
    baseDamage *= (1 - context.damageTakenReduction);
  }

  // 고층 추가 피해 (30층+)
  if (player.floor >= 30) {
    baseDamage += Math.floor(c.maxHp * 0.03);
  }

  return Math.floor(baseDamage);
}

// ============================================
// 버프/쿨다운
// ============================================

function processBuffs(entity) {
  if (!entity.buffs) return;
  
  for (let i = entity.buffs.length - 1; i >= 0; i--) {
    const buff = entity.buffs[i];
    buff.duration--;
    
    if (buff.duration <= 0) {
      entity.buffs.splice(i, 1);
    }
  }
}

function processCooldowns(player) {
  if (player.skillCd > 0) {
    player.skillCd--;
  }
  
  if (player.potionCooldown > 0) {
    player.potionCooldown--;
  }
}

// ============================================
// 이해도 시스템
// ============================================

function addBattleUnderstanding(player, monster, result) {
  if (!player.battleUnderstanding) {
    player.battleUnderstanding = {};
  }
  
  const monsterId = monster.id || monster.name;
  
  if (!player.battleUnderstanding[monsterId]) {
    player.battleUnderstanding[monsterId] = {
      exp: 0,
      level: 0
    };
  }
  
  const understanding = player.battleUnderstanding[monsterId];
  
  const job = JOBS[player.job];
  let baseGain = 10;
  if (job && job.passives) {
    const recordPassive = job.passives.find(p => p.id === 'scribe_1');
    if (recordPassive) {
      baseGain = 20;
    }
  }
  
  understanding.exp += baseGain;
  
  while (understanding.exp >= 100 && understanding.level < 4) {
    understanding.exp -= 100;
    understanding.level++;
  }
}

function getBattleUnderstandingLevel(player, monster) {
  if (!player.battleUnderstanding) return 0;
  
  const monsterId = monster.id || monster.name;
  const understanding = player.battleUnderstanding[monsterId];
  
  if (!understanding) return 0;
  
  let level = understanding.level || 0;
  
  const job = JOBS[player.job];
  if (job && job.passives) {
    const insightPassive = job.passives.find(p => p.id === 'scribe_2');
    if (insightPassive) {
      level = Math.min(level + 1, 4);
    }
  }
  
  return level;
}

// ============================================
// 광기 시스템 (v4.1)
// ============================================

/**
 * 광기 증가량 계산
 */
function calculateMadnessGain(player, monster, damageDealt, isCrit, isKill) {
  if (!isKill) return 0;

  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);
  const config = MADNESS_SYSTEM.gain;
  let gain = 0;

  // 기본 처치 +5
  gain += config.kill;

  // 오버킬 (적 maxHp 2배 이상) +10
  if (damageDealt >= monster.maxHp * 2) {
    gain += config.overkill;
  }

  // 크리티컬 처치 +8
  if (isCrit) {
    gain += config.critKill;
  }

  // 이단자 폭주 (HP 20% 이하) 2배
  if (player.job === 'heretic') {
    const hpPercent = player.hp / c.maxHp;
    if (hpPercent <= 0.2) {
      gain *= 2;
    }
  }

  // 다른 직업 50% 속도
  if (player.job !== 'heretic') {
    gain = Math.floor(gain * 0.5);
  }

  // WIL 저항
  const resist = c.madnessResist || 0;
  gain = Math.floor(gain * (1 - resist / 100));

  return Math.max(0, gain);
}

/**
 * 광기 적용 + 오버플로우 처리
 */
function applyMadnessGain(player, gain) {
  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);
  const oldMadness = player.madness || 0;
  let newMadness = oldMadness + gain;

  const result = {
    oldMadness,
    gain,
    newMadness: 0,
    overflow: false,
    overflowDamage: 0
  };

  // 100 오버플로우
  if (newMadness >= 100) {
    result.overflow = true;
    result.overflowDamage = Math.floor(c.maxHp * 0.1);  // 10%
    player.hp -= result.overflowDamage;
    newMadness = 80;  // 리셋
  }

  player.madness = Math.min(100, newMadness);
  result.newMadness = player.madness;

  return result;
}

/**
 * 광기 페널티 (턴 시작 시)
 */
function applyMadnessPenalty(player) {
  const { calcStats } = require('../utils/calc');
  const c = calcStats(player);
  const madness = player.madness || 0;
  const result = { selfDamage: 0, message: null };

  // 80+ 자해 (턴마다 5%)
  if (madness >= 80) {
    const selfDamage = Math.floor(c.maxHp * 0.05);
    player.hp -= selfDamage;
    result.selfDamage = selfDamage;
    result.message = `🌀 광기가 육체를 갉아먹는다... -${selfDamage} HP`;
  }

  return result;
}

/**
 * 해석 성공 시 광기 감소
 */
function applyInterpretMadnessDecay(player, interpretResult) {
  if (interpretResult.result === 'perfect') {
    const decay = MADNESS_SYSTEM.decay.interpretSuccess || 10;
    const oldMadness = player.madness || 0;
    player.madness = Math.max(0, oldMadness - decay);
    return decay;
  }
  return 0;
}

// ============================================
// 결투 시뮬레이션
// ============================================

function simulateDuel(player1, player2) {
  const { calcStats } = require('../utils/calc');
  
  const c1 = calcStats(player1);
  const c2 = calcStats(player2);
  
  let hp1 = c1.maxHp;
  let hp2 = c2.maxHp;
  
  const log = [];
  let turn = 1;
  
  while (hp1 > 0 && hp2 > 0 && turn <= 20) {
    const priority = c1.spd >= c2.spd ? 1 : 2;
    
    if (priority === 1) {
      const dmg = Math.max(1, Math.floor((c1.atk - c2.def * 0.4) * (Math.random() * 0.3 + 0.85)));
      hp2 -= dmg;
      log.push(`${player1.name}: ${dmg} 피해`);
      
      if (hp2 <= 0) break;
      
      const dmg2 = Math.max(1, Math.floor((c2.atk - c1.def * 0.4) * (Math.random() * 0.3 + 0.85)));
      hp1 -= dmg2;
      log.push(`${player2.name}: ${dmg2} 피해`);
    } else {
      const dmg = Math.max(1, Math.floor((c2.atk - c1.def * 0.4) * (Math.random() * 0.3 + 0.85)));
      hp1 -= dmg;
      log.push(`${player2.name}: ${dmg} 피해`);
      
      if (hp1 <= 0) break;
      
      const dmg2 = Math.max(1, Math.floor((c1.atk - c2.def * 0.4) * (Math.random() * 0.3 + 0.85)));
      hp2 -= dmg2;
      log.push(`${player1.name}: ${dmg2} 피해`);
    }
    
    turn++;
  }
  
  const winner = hp1 > hp2 ? player1 : player2;
  
  return { winner, log: log.slice(0, 5) };
}

// ============================================
// Export
// ============================================

module.exports = {
  spawnMonster,
  determineGrade,
  checkBossPhase,
  selectPattern,
  getTelegraph,
  getChoices,
  judgeInterpret,
  updateInterpretStreak,
  getStreakBonus,
  applyAllPassives,
  applyOnAttackPassives,
  applyOnDamagedPassives,
  checkSurvival,
  applyJobChoiceBonus,
  checkPriority,
  calculatePlayerDamage,
  calculateEnemyDamage,
  processBuffs,
  processCooldowns,
  addBattleUnderstanding,
  getBattleUnderstandingLevel,
  calculateMadnessGain,
  applyMadnessGain,
  applyMadnessPenalty,
  applyInterpretMadnessDecay,
  simulateDuel
};
