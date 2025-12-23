// ============================================
// 아이템 시스템 v3.9 (장비 역사)
// ============================================
const { ITEM_GRADES, ITEM_TYPES, ITEM_PROCS, RELIC_SPECIALS, ENHANCE_BONUS } = require('../data/items');

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// v3.9: 아이템 생성 (history 추가)
function generateItem(monsterGrade, floor, madnessOpen = false, guaranteeRare = false) {
  const baseChance = guaranteeRare ? 1.0 : (0.35 + (madnessOpen ? 0.20 : 0));
  if (Math.random() > baseChance) return null;
  
  let grade = 1;
  const roll = Math.random() * 100;
  if (roll < 2) grade = 5;
  else if (roll < 8) grade = 4;
  else if (roll < 20) grade = 3;
  else if (roll < 45) grade = 2;
  
  if (guaranteeRare) grade = Math.max(grade, 3);
  grade = clamp(grade, 1, monsterGrade + 1);
  if (madnessOpen && Math.random() < 0.4) grade = Math.min(5, grade + 1);
  
  const gd = ITEM_GRADES[grade];
  const slots = Object.keys(ITEM_TYPES);
  const slotKey = slots[Math.floor(Math.random() * slots.length)];
  const slot = ITEM_TYPES[slotKey];
  const itemType = slot.types[Math.floor(Math.random() * slot.types.length)];
  
  const mainVal = Math.floor(slot.base * gd.mult);
  let stats = { atk: 0, def: 0, maxHp: 0, evasion: 0, critRate: 0, interpret: 0 };
  
  if (slot.mainStat === 'all') {
    stats.atk = mainVal;
    stats.def = mainVal;
    stats.maxHp = mainVal * 6;
  } else if (slot.mainStat === 'evasion') {
    stats.evasion = mainVal;
  } else {
    stats[slot.mainStat] = mainVal;
  }
  
  if (grade >= 2 && Math.random() < 0.6) stats.critRate += Math.floor(grade * 1.2);
  if (grade >= 3 && Math.random() < 0.5) stats.interpret += Math.floor(grade * 1.5);
  if (grade >= 4 && Math.random() < 0.4) stats.maxHp += Math.floor(grade * 12);
  
  let proc = null;
  if (slotKey !== 'relic') {
    const procs = ITEM_PROCS.filter(p => p.slot === slotKey);
    if (procs.length && Math.random() < 0.06 + grade * 0.06) {
      proc = procs[Math.floor(Math.random() * procs.length)];
    }
  }
  
  let special = null;
  if (slotKey === 'relic' && grade >= 3 && RELIC_SPECIALS[grade]) {
    special = RELIC_SPECIALS[grade];
  }
  
  return {
    id: Date.now() + Math.random(),
    name: `${gd.prefix} ${itemType}${proc ? ` [${proc.name}]` : ''}`,
    slot: slotKey, 
    slotName: slot.name,
    grade, 
    gradeName: gd.name, 
    gradeColor: gd.color,
    stats, 
    proc, 
    special, 
    enhance: 0,
    // v3.9: 장비 역사
    history: {
      obtainedFloor: floor,
      obtainedDate: new Date().toISOString().split('T')[0],
      killCount: 0,
      totalDamage: 0,
      totalHeal: 0
    }
  };
}

// 아이템 스탯 텍스트
function getItemStatText(item) {
  const st = [];
  const enhBonus = typeof ENHANCE_BONUS === 'function' 
    ? ENHANCE_BONUS(item.slot, item.enhance || 0)
    : (item.enhance || 0) * 0.15;
  const enhMult = 1 + enhBonus;
  
  if (item.stats.atk) st.push(`공+${Math.floor(item.stats.atk * enhMult)}`);
  if (item.stats.def) st.push(`방+${Math.floor(item.stats.def * enhMult)}`);
  if (item.stats.maxHp) st.push(`HP+${Math.floor(item.stats.maxHp * enhMult)}`);
  if (item.stats.evasion) st.push(`회피+${Math.floor(item.stats.evasion * enhMult)}`);
  if (item.stats.critRate) st.push(`크리+${Math.floor(item.stats.critRate * enhMult)}`);
  if (item.stats.interpret) st.push(`해석+${Math.floor(item.stats.interpret * enhMult)}`);
  if (item.proc) st.push(`[${item.proc.name}]`);
  if (item.special) st.push(`★${item.special.name}`);
  return st.join(' ') || '효과 없음';
}

// 아이템 표시명
function getItemDisplay(item) {
  const enh = item.enhance > 0 ? `+${item.enhance} ` : '';
  const displayName = item.nickname || item.name;
  return `${item.gradeColor || ''}${enh}${displayName}`;
}

module.exports = {
  generateItem,
  getItemStatText,
  getItemDisplay
};
