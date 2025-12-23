// ============================================
// 계산 함수 v3.9 (전우 시스템)
// ============================================
const { JOBS } = require('../data/jobs');
const { ENHANCE_BONUS } = require('../data/items');
const { EXP_TABLE, MADNESS_SYSTEM } = require('../data/config');

// 유틸리티
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const getReqExp = (lv) => EXP_TABLE.required(lv);
const getTodayKey = () => new Date().toISOString().split('T')[0];

// v3.9: 전우 시스템
function getBondLevel(killCount) {
  if (killCount >= 1000) return { title: '전설', bonus: 10 };
  if (killCount >= 500) return { title: '전우', bonus: 7 };
  if (killCount >= 300) return { title: '신뢰', bonus: 5 };
  if (killCount >= 100) return { title: '익숙함', bonus: 3 };
  if (killCount >= 50) return { title: '낯익음', bonus: 2 };
  return { title: '', bonus: 0 };
}

// 스탯 계산 (v3.9 전우 보너스)
function calcStats(p) {
  const s = p.stats || { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
  const job = JOBS[p.job];
  
  // 기본 전투 스탯
  let atk = 10 + s.str * 3 + s.dex * 0.5;
  let def = 5 + s.vit * 2 + s.wil * 0.8;
  let maxHp = 80 + s.vit * 20 + s.str * 2;
  
  // 확률 스탯 (%)
  let evasion = Math.min(5 + s.dex * 1.2 + s.luk * 0.5, 60);
  let critRate = Math.min(5 + s.dex * 0.8 + s.luk * 0.6, 80);
  let critDmg = 150 + s.luk * 3;
  
  // 해석/스킬
  let interpret = Math.min(10 + s.int * 3 + s.wil * 0.5, 95);
  let skillPower = 100 + s.int * 2;
  
  // 유틸
  let dropBonus = s.luk * 0.5;
  
  // 직업 패시브 보너스
  if (job?.passive?.effect?.interpretBonus) {
    interpret = Math.min(interpret * (1 + job.passive.effect.interpretBonus), 95);
  }
  
  // 저주 5종 적용
  const curses = p.curses || [];
  curses.forEach(c => {
    if (c.id === 'ashBreath') maxHp = Math.floor(maxHp * 0.88);
    if (c.id === 'rustedNerve') atk = Math.floor(atk * 0.90);
    if (c.id === 'fogEye') interpret = Math.floor(interpret * 0.85);
    if (c.id === 'chainOfFate') evasion = Math.floor(evasion * 0.50);
  });
  
  // 광기 보너스 (이단자)
  if (p.job === 'heretic' && p.madness) {
    const madnessLevel = Math.floor(p.madness / 10);
    skillPower += madnessLevel * MADNESS_SYSTEM.effects.bonusPerTen.skillPower;
    dropBonus += madnessLevel * MADNESS_SYSTEM.effects.bonusPerTen.dropBonus;
  }
  
  // 장비 적용
  ['weapon', 'armor', 'accessory', 'relic'].forEach(slot => {
    const item = p.equipment?.[slot];
    if (!item) return;
    const enhBonus = typeof ENHANCE_BONUS === 'function' 
      ? ENHANCE_BONUS(slot, item.enhance || 0)
      : (item.enhance || 0) * 0.15;
    const enhMult = 1 + enhBonus;
    
    atk += Math.floor((item.stats?.atk || 0) * enhMult);
    def += Math.floor((item.stats?.def || 0) * enhMult);
    maxHp += Math.floor((item.stats?.maxHp || 0) * enhMult);
    evasion += Math.floor((item.stats?.evasion || 0) * enhMult);
    critRate += Math.floor((item.stats?.critRate || 0) * enhMult);
    interpret += Math.floor((item.stats?.interpret || 0) * enhMult);
    
    if (item.proc?.id === 'critical') critRate += 8;
    if (item.proc?.id === 'vitality') maxHp = Math.floor(maxHp * 1.15);
    if (item.proc?.id === 'insight') interpret += 5;
  });
  
  // v3.9: 무기 전우 보너스
  if (p.equipment?.weapon?.history) {
    const bond = getBondLevel(p.equipment.weapon.history.killCount || 0);
    if (bond.bonus > 0) {
      atk = Math.floor(atk * (1 + bond.bonus / 100));
    }
  }
  
  // 방랑자 패시브 (HP 50% 이하)
  if (p.job === 'wanderer' && p.hp < maxHp * 0.5) {
    atk = Math.floor(atk * 1.3);
  }
  
  return {
    atk: Math.floor(Math.max(1, atk)),
    def: Math.floor(Math.max(0, def)),
    maxHp: Math.floor(Math.max(20, maxHp)),
    evasion: clamp(Math.floor(evasion), 0, 60),
    critRate: clamp(Math.floor(critRate), 0, 80),
    critDmg: Math.floor(critDmg),
    interpret: clamp(Math.floor(interpret), 0, 95),
    skillPower: Math.floor(skillPower),
    dropBonus: Math.floor(dropBonus)
  };
}

function calcPower(p) {
  const c = calcStats(p);
  return Math.floor(c.atk * 2 + c.def * 1.5 + c.maxHp * 0.1 + c.critRate * 3 + c.interpret * 2 + (p.lv || 1) * 10);
}

// 레벨업 체크
function checkLevelUp(player) {
  let leveledUp = false;
  let totalLevels = 0;
  
  while (true) {
    const req = getReqExp(player.lv || 1);
    if ((player.exp || 0) >= req) {
      player.lv = (player.lv || 1) + 1;
      player.exp -= req;
      player.statPoints = (player.statPoints || 0) + 3;
      totalLevels++;
      leveledUp = true;
    } else {
      break;
    }
  }
  
  if (leveledUp) {
    const c = calcStats(player);
    player.hp = c.maxHp;
    player.maxHp = c.maxHp;
    player.focus = player.maxFocus || 100;
  }
  
  return { leveledUp, totalLevels };
}

module.exports = {
  clamp,
  getReqExp,
  getTodayKey,
  calcStats,
  calcPower,
  checkLevelUp,
  getBondLevel
};
