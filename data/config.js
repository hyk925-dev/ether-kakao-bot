// ============================================
// 게임 설정 v4.0
// ============================================

// 결투 설정
const DUEL_CONFIG = {
  cost: 50,
  winnerGold: 100,
  winnerExp: 50,
  rankPoints: 10,
};

// 탐사 설정
const EXPLORE_CONFIG = {
  safe: { cost: 30, maxDaily: 10, treasureRate: 20, battleRate: 25, curseRate: 0, eventRate: 5 },
  danger: { cost: 80, maxDaily: 5, treasureRate: 25, battleRate: 45, curseRate: 15, eventRate: 10 },
  forbidden: { cost: 150, maxDaily: 2, treasureRate: 30, battleRate: 40, curseRate: 15, eventRate: 15 }
};

// 카카오 채널
const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_BqpQn';

// 스탯 매핑
const STAT_NAMES = {
  '힘': 'str', '민첩': 'dex', '지능': 'int', 
  '의지': 'wil', '체력': 'vit', '운': 'luk', '행운': 'luk'
};

const STAT_KOREAN = {
  'str': '힘', 'dex': '민첩', 'int': '지능',
  'wil': '의지', 'vit': '체력', 'luk': '운'
};

// 경험치 시스템
const EXP_TABLE = {
  required: (level) => Math.floor(50 * Math.pow(level, 1.5)),
  recommendedLevel: (floor) => Math.ceil(floor * 0.5 + 1)
};

// 광기 시스템
const MADNESS_SYSTEM = {
  max: 100,
  gain: {
    forbiddenSpell: 20,
    kill: 5,
    overkill: 10,
    critKill: 8
  },
  decay: {
    perFloor: 5,
    rest: 20,
    interpretSuccess: 10
  },
  effects: {
    bonusPerTen: { skillPower: 8, dropBonus: 3 },
    penaltyThreshold: 80,
    selfDamagePercent: 5,
    overflowThreshold: 100,
    overflowDamage: 10
  }
};

// 골드 시스템
const GOLD_SYSTEM = {
  monsterGold: (floor, grade) => {
    const base = 5 + floor * 1.5;
    const mult = { normal: 1, enhanced: 1.8, rare: 3, elite: 5, heroic: 8 }[grade] || 1;
    return Math.floor(base * mult * (0.8 + Math.random() * 0.4));
  },
  bossGold: (floor) => {
    const base = 5 + floor * 1.5;
    return Math.floor(base * 25 * (0.9 + Math.random() * 0.2));
  },
  lukBonus: (luk) => 1 + luk * 0.003
};

// 드랍률 시스템
const DROP_RATES = {
  equipment: { common: 0.35, uncommon: 0.15, rare: 0.05, epic: 0.012, legendary: 0.003 },
  relic: { common: 0.08, uncommon: 0.04, rare: 0.015, epic: 0.005, legendary: 0.001 }
};

const DROP_MODIFIERS = {
  monsterGrade: { normal: 1.0, enhanced: 1.5, rare: 2.5, elite: 4.0, heroic: 6.0 },
  boss: { equipment: 8.0, relic: 15.0 },
  floorBonus: (floor) => ({
    rareBonus: Math.min(floor * 0.001, 0.03),
    epicBonus: Math.min(floor * 0.0003, 0.01),
    legendaryBonus: Math.min(floor * 0.0001, 0.005)
  }),
  lukBonus: (luk) => 1 + luk * 0.008,
  madnessBonus: (madness) => 1 + Math.floor(madness / 10) * 0.04,
  interpretBonus: 1.25
};

// 운영 시스템
const ADMIN_CONFIG = {
  operatorIds: [
    'ykyk925@nate.com',
    '4788a61df5328e806f6192ea583d17600957cd6146af22eed0221b16cb7bd4b6bc'
  ],
  commands: {
    betaReward: '@베타보상',
    myId: '@내아이디',
    help: '@도움말',
    guide: '@가이드',
    setLevel: '@레벨설정',
    resetExp: '@경험치초기화'
  }
};

// 선물 시스템
const GIFT_CONFIG = {
  gold: { min: 10, max: 50000, fee: 0.05 },
  limits: { dailyCount: 5, dailyGoldTotal: 100000, minLevel: 5, accountAge: 24 }
};

// 베타 보상
const BETA_REWARD = {
  gold: 5000,
  potions: 10,
  hiPotions: 5,
  statPoints: 5
};

// v4.0: 공지 시스템
const NOTICE = {
  version: 'v4.0',
  date: '2025.12.23',
  title: 'v4.0 대형 업데이트!',
  updates: [
    '🆕 이해도 시스템 - 몬스터와 싸울수록 이해도 상승',
    '🆕 전조/해석 시스템 - 몬스터의 행동을 예측',
    '🆕 회피/방어/역습 선택지 - 완벽한 해석 시 크리티컬!',
    '🆕 100층 선택지 - 전생, 계약, 봉인, 거부'
  ],
  upcoming: '보스 페이즈 시스템, 패턴 다양화',
  channelNotice: '📋 자세한 내용은 채널 공지 확인!'
};

module.exports = {
  DUEL_CONFIG,
  EXPLORE_CONFIG,
  KAKAO_CHANNEL_URL,
  STAT_NAMES,
  STAT_KOREAN,
  EXP_TABLE,
  MADNESS_SYSTEM,
  GOLD_SYSTEM,
  DROP_RATES,
  DROP_MODIFIERS,
  ADMIN_CONFIG,
  GIFT_CONFIG,
  BETA_REWARD,
  NOTICE
};
