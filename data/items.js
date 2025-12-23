// ============================================
// 장비 시스템
// ============================================
const ITEM_GRADES = {
  1: { name: '일반', prefix: '낡은', mult: 1.0, color: '⚪' },
  2: { name: '고급', prefix: '단단한', mult: 2.0, color: '🟢' },
  3: { name: '희귀', prefix: '정교한', mult: 3.5, color: '🔵' },
  4: { name: '영웅', prefix: '마력의', mult: 6.0, color: '🟣' },
  5: { name: '전설', prefix: '전설의', mult: 10.0, color: '🟡' }
};

const ITEM_TYPES = {
  weapon: { name: '무기', types: ['검', '도끼', '창', '단검', '대검'], mainStat: 'atk', base: 6 },
  armor: { name: '방어구', types: ['갑옷', '로브', '가죽옷'], mainStat: 'def', base: 4 },
  accessory: { name: '장신구', types: ['반지', '목걸이', '귀걸이'], mainStat: 'evasion', base: 3 },
  relic: { name: '유물', types: ['오브', '문장', '토템'], mainStat: 'all', base: 2 }
};

const ITEM_PROCS = [
  { id: 'bleed', name: '출혈', slot: 'weapon', desc: '3턴 DoT' },
  { id: 'lifesteal', name: '흡혈', slot: 'weapon', desc: '피해 8% 회복' },
  { id: 'critical', name: '필살', slot: 'weapon', desc: '크리+8%' },
  { id: 'barrier', name: '장막', slot: 'armor', desc: '30% 보호막' },
  { id: 'thorns', name: '가시', slot: 'armor', desc: '피해 30% 반사' },
  { id: 'vitality', name: '활력', slot: 'armor', desc: 'HP+15%' },
  { id: 'lucky', name: '행운', slot: 'accessory', desc: '골드+20%' },
  { id: 'insight', name: '통찰', slot: 'accessory', desc: '해석+5%' }
];

const RELIC_SPECIALS = {
  3: { name: '재생', desc: '턴당 HP 4%' },
  4: { name: '흡수', desc: '공격시 8% 회복' },
  5: { name: '불멸', desc: '1회 부활 60%' }
};

// ============================================
// 유물 시스템 v3.2 (15종)
// ============================================
const RELICS = {
  // ⚪ 일반 (1층~)
  common: {
    crackedRing: { name: '금 간 반지', icon: '💍', grade: 1, effect: { maxHpFlat: 15 }, desc: 'HP +15' },
    wornAmulet: { name: '닳은 부적', icon: '📿', grade: 1, effect: { defFlat: 3 }, desc: '방어 +3' },
    fadedBadge: { name: '빛바랜 휘장', icon: '🎖️', grade: 1, effect: { atkFlat: 5 }, desc: '공격 +5' }
  },
  // 🟢 고급 (11층~)
  uncommon: {
    huntersMark: { name: '사냥꾼의 표식', icon: '🎯', grade: 2, effect: { critRate: 5 }, desc: '크리 +5%', synergy: ['hunter'] },
    ironHeart: { name: '강철 심장', icon: '🫀', grade: 2, effect: { maxHpPercent: 8 }, desc: 'HP +8%', synergy: ['ironblood', 'wanderer'] },
    focusGem: { name: '집중의 보석', icon: '💎', grade: 2, effect: { interpretBonus: 8 }, desc: '해석 +8%', synergy: ['scribe', 'shaman'] }
  },
  // 🔵 희귀 (21층~)
  rare: {
    regeneration: { name: '재생의 고리', icon: '♻️', grade: 3, effect: { regenPercent: 4 }, desc: '턴당 HP 4%' },
    berserkerBand: { name: '광전사의 팔찌', icon: '🔥', grade: 3, effect: { atkBonusWhenLowHp: 0.25, threshold: 0.4 }, desc: 'HP 40% 이하 공격 +25%', synergy: ['wanderer'] },
    shadowCloak: { name: '그림자 망토', icon: '🌑', grade: 3, effect: { evasion: 12 }, desc: '회피 +12%', synergy: ['hunter'] },
    madnessShackle: { name: '광기의 족쇄', icon: '⛓️', grade: 3, effect: { madnessGainReduce: 0.30, skillPowerBonus: 10 }, desc: '광기 획득 -30%, 스킬 위력 +10%', synergy: ['heretic'] }
  },
  // 🟣 영웅 (41층~)
  epic: {
    vampiricFang: { name: '흡혈의 송곳니', icon: '🧛', grade: 4, effect: { lifesteal: 0.10 }, desc: '흡혈 10%' },
    thunderHeart: { name: '번개의 심장', icon: '⚡', grade: 4, effect: { critDamageBonus: 25, onCrit: { bonusDamageFlat: 20 } }, desc: '크리 데미지 +25%, 크리 시 고정 피해 +20' },
    voidEye: { name: '공허의 눈', icon: '👁️', grade: 4, effect: { interpretBonus: 15, onInterpret: { defIgnore: 0.15 } }, desc: '해석 +15%, 해석 성공 시 방무 +15%', synergy: ['scribe'] },
    unyieldingWill: { name: '불굴의 의지', icon: '💪', grade: 4, effect: { dmgReduce: 0.12, ccResist: 0.30 }, desc: '피해 -12%, 상태이상 저항 +30%', synergy: ['ironblood'] }
  },
  // 🟡 전설 (61층~)
  legendary: {
    immortalFlame: { name: '불멸의 화염', icon: '🔥✨', grade: 5, effect: { reviveOnce: true, reviveHpPercent: 0.60, atkBuffAfterRevive: 0.30, duration: 3 }, desc: '1회 부활 (60%), 부활 후 3턴 공격 +30%' },
    soulDevourer: { name: '영혼 포식자', icon: '👻', grade: 5, effect: { lifesteal: 0.15, onKill: { healPercent: 0.20 } }, desc: '흡혈 15%, 처치 시 HP 20%' },
    chaosEmbrace: { name: '혼돈의 포옹', icon: '🌀✨', grade: 5, effect: { madnessConvert: true, madnessBonusMultiplier: 1.5 }, desc: '광기 자해 무효, 보너스 1.5배', synergy: ['heretic'] },
    absoluteZero: { name: '절대영도', icon: '❄️✨', grade: 5, effect: { onHit: { freezeChance: 0.15, duration: 1 }, critDamageBonus: 20 }, desc: '공격 시 15% 빙결, 크리 데미지 +20%' },
    omniscientTome: { name: '전지의 서', icon: '📖✨', grade: 5, effect: { interpretAlwaysSuccess: true, cooldownReduce: 1 }, desc: '해석 항상 성공, 쿨타임 -1턴', synergy: ['scribe'] }
  }
};

// ============================================
// 물약 시스템 v3.1
// ============================================
const POTIONS = {
  basic: { name: '하급 물약', heal: 0.25, price: 30, desc: 'HP 25% 회복' },
  medium: { name: '중급 물약', heal: 0.50, price: 100, floorUnlock: 11, desc: 'HP 50% 회복' },
  high: { name: '고급 물약', heal: 1.0, price: 300, floorUnlock: 31, desc: 'HP 100% 회복' },
  perBattle: 2,        // 전투당 최대 2회
  cooldown: 2          // 사용 후 2턴 쿨타임
};

// ============================================
// 저주 시스템 v3.1 (5종)
// ============================================
const CURSES = {
  ashBreath: { 
    id: 'ashBreath', name: '재의 숨', icon: '🌫️', 
    effect: { maxHpReduce: 0.12 }, desc: 'HP -12%' 
  },
  rustedNerve: { 
    id: 'rustedNerve', name: '녹슨 신경', icon: '⚙️', 
    effect: { atkReduce: 0.10 }, desc: '공격 -10%' 
  },
  fogEye: { 
    id: 'fogEye', name: '안개 눈', icon: '🌑', 
    effect: { interpretReduce: 0.15 }, desc: '해석 -15%' 
  },
  hollowHeart: { 
    id: 'hollowHeart', name: '공허한 심장', icon: '💔', 
    effect: { healReduce: 0.30 }, desc: '회복 -30%' 
  },
  chainOfFate: { 
    id: 'chainOfFate', name: '운명의 사슬', icon: '⛓️', 
    effect: { evasionReduce: 0.50 }, desc: '회피 -50%' 
  }
};

const CURSE_CONFIG = {
  maxCurses: 3,
  chance: { normal: 0.03, elite: 0.08, boss: 0.15 },
  removal: {
    npcCost: (count) => 100 * count,
    restChance: 0.20,
    itemPrice: 150
  }
};

// ============================================
// 강화 시스템 v3.1
// ============================================
const ENHANCE_RATES = { 1: 95, 2: 90, 3: 80, 4: 70, 5: 55, 6: 40, 7: 30, 8: 20, 9: 15 };
const DESTROY_RATES = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 5, 8: 12, 9: 20, 10: 30 };
const ENHANCE_COST = (lv) => Math.floor(80 + lv * 50 + Math.pow(lv, 2) * 15);

// v3.1: 강화 보너스 (무기 기준)
const ENHANCE_BONUS_TABLE = {
  weapon: [0, 3, 6, 10, 15, 21, 28, 36, 45, 55, 70],  // +0~+10 (%)
  armor: [0, 2, 4, 7, 11, 16, 22, 29, 37, 46, 60]
};

const ENHANCE_BONUS = (slot, level) => {
  const table = ENHANCE_BONUS_TABLE[slot] || ENHANCE_BONUS_TABLE.weapon;
  return (table[level] || 0) / 100;
};

// 강화 보호석
const PROTECTION_STONE = { name: '강화 보호석', price: 500, floorUnlock: 41 };

// 진정제 (광기 감소 아이템)
const SEDATIVE = { name: '진정제', effect: -30, price: 80, floorUnlock: 6 };

module.exports = {
  ITEM_GRADES,
  ITEM_TYPES,
  ITEM_PROCS,
  RELIC_SPECIALS,
  RELICS,
  POTIONS,
  CURSES,
  CURSE_CONFIG,
  ENHANCE_RATES,
  DESTROY_RATES,
  ENHANCE_COST,
  ENHANCE_BONUS,
  ENHANCE_BONUS_TABLE,
  PROTECTION_STONE,
  SEDATIVE
};
