const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ============================================
// 이미지 URL (Firebase Storage)
// ============================================
const IMG_BASE = 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether';

const MONSTER_IMAGES = {
  '들쥐': `${IMG_BASE}/monsters/shadow_rat.png`,
  '늑대': `${IMG_BASE}/monsters/berserk_wolf.png`,
  '독사': `${IMG_BASE}/monsters/poison_bat.png`,
  '고블린': `${IMG_BASE}/monsters/lesser_demon.png`,
  '해골병사': `${IMG_BASE}/monsters/skeleton_soldier.png`,
  '구울': `${IMG_BASE}/monsters/rotting_corpse.png`,
  '불의정령': `${IMG_BASE}/monsters/chaos_eye.png`,
  '물의정령': `${IMG_BASE}/monsters/stone_gargoyle.png`,
  '임프': `${IMG_BASE}/monsters/lesser_demon.png`,
  '서큐버스': `${IMG_BASE}/monsters/shadow_assassin.png`,
  '비룡': `${IMG_BASE}/monsters/abyss_tentacle.png`,
  '고대용': `${IMG_BASE}/monsters/berserk_golem.png`,
};

const BOSS_IMAGES = {
  '광폭 늑대왕': `${IMG_BASE}/bosses/wolf_king.png`,
  '해골 군주': `${IMG_BASE}/bosses/skeleton_lord.png`,
  '악마 공작': `${IMG_BASE}/bosses/demon_duke.png`,
  '폭풍의 정령왕': `${IMG_BASE}/bosses/storm_king.png`,
  '흑룡': `${IMG_BASE}/bosses/black_dragon.png`,
  '심연의 그림자': `${IMG_BASE}/bosses/abyss_lord.png`,
  '종말의 심판자': `${IMG_BASE}/bosses/abyss_lord.png`,
};

const JOB_IMAGES = {
  'wanderer': `${IMG_BASE}/jobs/wanderer.png`,
  'hunter': `${IMG_BASE}/jobs/hunter.png`,
  'heretic': `${IMG_BASE}/jobs/heretic.png`,
  'shaman': `${IMG_BASE}/jobs/shaman.png`,
  'ironblood': `${IMG_BASE}/jobs/ironblood.png`,
  'scribe': `${IMG_BASE}/jobs/scribe.png`,
};

const ITEM_IMAGES = {
  'weapon_1': `${IMG_BASE}/items/weapon_common.png`,
  'weapon_2': `${IMG_BASE}/items/weapon_uncommon.png`,
  'weapon_3': `${IMG_BASE}/items/weapon_rare.png`,
  'weapon_4': `${IMG_BASE}/items/weapon_epic.png`,
  'weapon_5': `${IMG_BASE}/items/weapon_legendary.png`,
  'armor_1': `${IMG_BASE}/items/armor_common.png`,
  'armor_2': `${IMG_BASE}/items/armor_uncommon.png`,
  'armor_3': `${IMG_BASE}/items/armor_rare.png`,
  'armor_4': `${IMG_BASE}/items/armor_epic.png`,
  'armor_5': `${IMG_BASE}/items/armor_legendary.png`,
  'accessory_1': `${IMG_BASE}/items/accessory_common.png`,
  'accessory_2': `${IMG_BASE}/items/accessory_uncommon.png`,
  'accessory_3': `${IMG_BASE}/items/accessory_rare.png`,
  'accessory_4': `${IMG_BASE}/items/accessory_epic.png`,
  'accessory_5': `${IMG_BASE}/items/accessory_legendary.png`,
  'relic_1': `${IMG_BASE}/items/relic_common.png`,
  'relic_2': `${IMG_BASE}/items/relic_uncommon.png`,
  'relic_3': `${IMG_BASE}/items/relic_rare.png`,
  'relic_4': `${IMG_BASE}/items/relic_epic.png`,
  'relic_5': `${IMG_BASE}/items/relic_legendary.png`,
};

const EVENT_IMAGES = {
  'gambler': `${IMG_BASE}/events/gambler.png`,
  'ghost': `${IMG_BASE}/events/ghost.png`,
  'statue': `${IMG_BASE}/events/statue.png`,
  'altar': `${IMG_BASE}/events/altar.png`,
  'map': `${IMG_BASE}/events/map.png`,
  'rift': `${IMG_BASE}/events/rift.png`,
};

function getMonsterImage(name) {
  const cleanName = name.replace(/⭐/g, '').replace(/🌑/g, '').replace(/일반|강화|희귀|정예|영웅/g, '').trim();
  return BOSS_IMAGES[cleanName] || MONSTER_IMAGES[cleanName] || null;
}

function getItemImage(slot, grade) {
  return ITEM_IMAGES[`${slot}_${grade}`] || null;
}

// ============================================
// 결투 설정
// ============================================
const DUEL_CONFIG = {
  cost: 50,
  winnerGold: 100,
  winnerExp: 50,
  rankPoints: 10,
};

const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_BqpQn';

// ============================================
// 대사 시스템
// ============================================
const BLACKSMITH_LINES = {
  success: ["허허, 이 정도 실력이면 뭐...", "오, 제법인데?", "좋았어! 빛이 나는군!"],
  fail: ["쯧, 운명의 장난인가...", "에휴, 재료가 아까워.", "다시 해볼 텐가?"],
  destroy: ["이런... 미안하군...", "장비가 가루가 됐어...", "내 실력이 부족했나..."],
  maintain: ["쓸데없이 튼튼하기만 하군.", "다행히 부서지진 않았네."],
  greet: ["어서 와. 뭘 강화할 건가?", "강화? 좋지, 뭘 가져왔나?"],
  maxEnhance: ["이미 완벽해! 더 이상은 무리야.", "+10이면 충분하지 않나?"]
};

const BATTLE_LINES = {
  bossAppear: ["강한 기운이 느껴진다...", "조심해! 보스다!"],
  victory: ["승리다!", "해냈어!"],
  levelUp: ["몸에 힘이 솟는다!", "더 강해진 느낌이야!"],
  death: ["이런... 여기서 쓰러지다니...", "다음엔... 반드시..."],
  itemDrop: ["뭔가 떨어졌다!", "전리품을 발견했다!"]
};

const EXPLORE_EVENTS = {
  gambler: { name: '🎰 도박꾼', desc: '모 아니면 도! 골드를 걸어볼까?' },
  ghost: { name: '👻 떠도는 영혼', desc: '힘을 나눠줄까... 아니면...' },
  statue: { name: '🗿 고대 석상', desc: '수수께끼를 맞추면 보상을 주지.' },
  altar: { name: '🩸 피의 제단', desc: 'HP를 바치면 보물을 주겠다.' },
  map: { name: '📜 낡은 지도', desc: '다음 탐사에서 보물이 확정된다!' },
  rift: { name: '🌑 심연의 균열', desc: '강력한 존재가 느껴진다...' }
};

const getLine = (obj, type) => {
  const lines = obj[type];
  return lines ? lines[Math.floor(Math.random() * lines.length)] : '';
};

// ============================================
// 직업 시스템
// ============================================
const JOBS = {
  wanderer: { 
    name: '방랑자', icon: '⚔️', 
    desc: 'HP 40% 이하 공격력 +25%',
    base: { str: 3, dex: 2, int: 2, wil: 2, vit: 3, luk: 2 },
    skill: { name: '결단의 일격', cost: 25, cd: 3, desc: '1.8배 데미지' }
  },
  hunter: { 
    name: '사냥꾼', icon: '🏹', 
    desc: '회피 성공 시 크리티컬 +35%',
    base: { str: 2, dex: 5, int: 1, wil: 1, vit: 1, luk: 4 },
    skill: { name: '약점 저격', cost: 30, cd: 4, desc: '크리+70%, 1.6배' }
  },
  heretic: { 
    name: '이단자', icon: '🌀', 
    desc: '광기 50+ 드랍률 +0.6',
    base: { str: 1, dex: 2, int: 4, wil: 2, vit: 1, luk: 4 },
    skill: { name: '금기 주문', cost: 20, cd: 3, desc: '드랍+1.0, 광기+18' }
  },
  shaman: { 
    name: '주술사', icon: '👁', 
    desc: '해석 성공 시 받는 피해 -25%',
    base: { str: 1, dex: 1, int: 5, wil: 4, vit: 2, luk: 1 },
    skill: { name: '혼의 갈고리', cost: 25, cd: 3, desc: '1.4배 + 흡혈 20%' }
  },
  ironblood: { 
    name: '철혈병', icon: '🛡️', 
    desc: '방어 시 50% 확률 반격',
    base: { str: 3, dex: 1, int: 0, wil: 4, vit: 5, luk: 1 },
    skill: { name: '철의 포효', cost: 30, cd: 4, desc: '3턴 피해-40%' }
  },
  scribe: { 
    name: '기록자', icon: '📖', 
    desc: '해석력 +12%',
    base: { str: 0, dex: 2, int: 6, wil: 3, vit: 1, luk: 2 },
    skill: { name: '문장 왜곡', cost: 20, cd: 2, desc: '60% 적 행동 무효' }
  }
};

// ============================================
// 몬스터 시스템
// ============================================
const MONSTER_TYPES = {
  beast: { name: '야수', hpMult: 1.0, atkMult: 1.4, defMult: 0.6, evasion: 12 },
  undead: { name: '언데드', hpMult: 1.5, atkMult: 0.9, defMult: 1.0, evasion: 5 },
  spirit: { name: '정령', hpMult: 0.6, atkMult: 1.2, defMult: 0.7, evasion: 30 },
  demon: { name: '마족', hpMult: 1.1, atkMult: 1.2, defMult: 1.1, evasion: 18 },
  dragon: { name: '용족', hpMult: 1.6, atkMult: 1.5, defMult: 1.4, evasion: 18 }
};

const GRADES = {
  1: { name: '일반', mult: 1.0, expMult: 1 },
  2: { name: '강화', mult: 1.6, expMult: 2 },
  3: { name: '희귀', mult: 2.4, expMult: 4 },
  4: { name: '정예', mult: 3.5, expMult: 7 },
  5: { name: '영웅', mult: 5.0, expMult: 12 }
};

const BASE_MONSTERS = [
  { name: '들쥐', type: 'beast', hp: 22, atk: 8, def: 2, exp: 10, minFloor: 1 },
  { name: '늑대', type: 'beast', hp: 38, atk: 14, def: 3, exp: 15, minFloor: 1 },
  { name: '독사', type: 'beast', hp: 28, atk: 12, def: 2, exp: 12, minFloor: 2 },
  { name: '고블린', type: 'beast', hp: 45, atk: 16, def: 4, exp: 18, minFloor: 3 },
  { name: '해골병사', type: 'undead', hp: 55, atk: 12, def: 5, exp: 25, minFloor: 6 },
  { name: '구울', type: 'undead', hp: 70, atk: 18, def: 6, exp: 35, minFloor: 8 },
  { name: '불의정령', type: 'spirit', hp: 50, atk: 32, def: 4, exp: 50, minFloor: 11 },
  { name: '물의정령', type: 'spirit', hp: 60, atk: 28, def: 8, exp: 55, minFloor: 13 },
  { name: '임프', type: 'demon', hp: 65, atk: 28, def: 8, exp: 55, minFloor: 14 },
  { name: '서큐버스', type: 'demon', hp: 80, atk: 35, def: 10, exp: 75, minFloor: 18 },
  { name: '비룡', type: 'dragon', hp: 180, atk: 60, def: 25, exp: 200, minFloor: 30 },
  { name: '고대용', type: 'dragon', hp: 300, atk: 80, def: 35, exp: 350, minFloor: 40 }
];

const BOSSES = {
  5: { name: '광폭 늑대왕', type: 'beast', hp: 280, atk: 45, def: 12, exp: 200, gold: 150 },
  10: { name: '해골 군주', type: 'undead', hp: 500, atk: 55, def: 18, exp: 450, gold: 300 },
  20: { name: '악마 공작', type: 'demon', hp: 700, atk: 80, def: 25, exp: 900, gold: 600 },
  30: { name: '폭풍의 정령왕', type: 'spirit', hp: 900, atk: 95, def: 30, exp: 1500, gold: 1000 },
  50: { name: '흑룡', type: 'dragon', hp: 2500, atk: 150, def: 50, exp: 4000, gold: 2500 },
  100: { name: '종말의 심판자', type: 'demon', hp: 20000, atk: 500, def: 250, exp: 15000, gold: 100000 }
};

const HIDDEN_BOSS = { name: '심연의 그림자', type: 'demon', hp: 400, atk: 70, def: 20, exp: 500, gold: 400 };

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
// 저주 시스템
// ============================================
const CURSES = [
  { id: 'ash', name: '재의 숨', desc: 'HP -10%' },
  { id: 'rust', name: '녹슨 신경', desc: '공격 -8%' },
  { id: 'fog', name: '안개 눈', desc: '해석 -10%' }
];

// ============================================
// 강화 시스템
// ============================================
const ENHANCE_RATES = { 1: 95, 2: 90, 3: 80, 4: 70, 5: 55, 6: 40, 7: 30, 8: 20, 9: 12, 10: 7 };
const DESTROY_RATES = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10, 6: 15, 7: 25, 8: 35, 9: 45, 10: 50 };
const ENHANCE_COST = (lv) => Math.floor(80 + lv * 50 + Math.pow(lv, 2) * 15);
const ENHANCE_BONUS = 0.15;

// ============================================
// 탐사 비용/횟수
// ============================================
const EXPLORE_CONFIG = {
  safe: { cost: 30, maxDaily: 10, treasureRate: 20, battleRate: 25, curseRate: 0, eventRate: 5 },
  danger: { cost: 80, maxDaily: 5, treasureRate: 25, battleRate: 45, curseRate: 15, eventRate: 10 },
  forbidden: { cost: 150, maxDaily: 2, treasureRate: 30, battleRate: 40, curseRate: 15, eventRate: 15 }
};

// ============================================
// 유틸리티
// ============================================
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const getReqExp = (lv) => Math.floor(50 + lv * 30 + Math.pow(lv, 1.5) * 10);
const getTodayKey = () => new Date().toISOString().split('T')[0];

// ============================================
// Part 2: DB 함수, 스탯 계산, 생성 함수
// ============================================

// DB 함수
async function getUser(id) {
  const doc = await db.collection('users').doc(id).get();
  return doc.exists ? doc.data() : null;
}

async function saveUser(id, data) {
  await db.collection('users').doc(id).set(data, { merge: true });
}

async function deleteUser(id) {
  await db.collection('users').doc(id).delete();
}

async function getUserByName(name) {
  const snapshot = await db.collection('users').where('name', '==', name).limit(1).get();
  if (snapshot.empty) return null;
  return { odocId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function getTopUsers(field, limit = 10) {
  const snapshot = await db.collection('users').where('phase', '==', 'town').orderBy(field, 'desc').limit(limit).get();
  return snapshot.docs.map((doc, i) => ({ rank: i + 1, odocId: doc.id, ...doc.data() }));
}

// ============================================
// 스탯 계산
// ============================================
function calcStats(p) {
  const s = p.stats || { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
  const job = JOBS[p.job];
  
  let atk = 10 + s.str * 2.5 + s.dex * 0.5;
  let def = 5 + s.wil * 1.3 + s.vit * 1.6;
  let maxHp = 100 + s.vit * 16 + s.wil * 7 + s.str * 3;
  let evasion = 5 + s.dex * 0.8 + s.luk * 0.3;
  let critRate = 5 + s.dex * 0.6 + s.luk * 0.4;
  let interpret = 10 + s.int * 2.5 + s.wil * 0.5;
  
  if (job?.id === 'scribe') interpret += 12;
  
  // 저주 적용
  const curses = p.curses || [];
  curses.forEach(c => {
    if (c.id === 'ash') maxHp = Math.floor(maxHp * 0.9);
    if (c.id === 'rust') atk = Math.floor(atk * 0.92);
    if (c.id === 'fog') interpret = Math.floor(interpret * 0.9);
  });
  
  // 장비 적용
  ['weapon', 'armor', 'accessory', 'relic'].forEach(slot => {
    const item = p.equipment?.[slot];
    if (!item) return;
    const enhMult = 1 + (item.enhance || 0) * ENHANCE_BONUS;
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
  
  if (p.job === 'wanderer' && p.hp < maxHp * 0.4) atk *= 1.25;
  
  return {
    atk: Math.floor(Math.max(1, atk)),
    def: Math.floor(Math.max(0, def)),
    maxHp: Math.floor(Math.max(20, maxHp)),
    evasion: clamp(Math.floor(evasion), 0, 80),
    critRate: clamp(Math.floor(critRate), 0, 95),
    interpret: clamp(Math.floor(interpret), 0, 98)
  };
}

function calcPower(p) {
  const c = calcStats(p);
  return Math.floor(c.atk * 2 + c.def * 1.5 + c.maxHp * 0.1 + c.critRate * 3 + c.interpret * 2 + (p.lv || 1) * 10);
}

// ============================================
// 몬스터 생성
// ============================================
function determineGrade(floor) {
  const roll = Math.random() * 100;
  const bonus = Math.floor(floor / 8) * 2.5;
  if (roll < 0.5 + bonus * 0.1) return 5;
  if (roll < 3 + bonus * 0.3) return 4;
  if (roll < 10 + bonus) return 3;
  if (roll < 30 + bonus) return 2;
  return 1;
}

function spawnMonster(floor, isHidden = false) {
  if (isHidden) {
    const h = HIDDEN_BOSS;
    const t = MONSTER_TYPES[h.type];
    const floorMult = 1 + Math.floor(floor / 10) * 0.2;
    return {
      name: `🌑 ${h.name}`, type: h.type, typeName: t.name,
      hp: Math.floor(h.hp * floorMult), maxHp: Math.floor(h.hp * floorMult),
      atk: Math.floor(h.atk * floorMult), def: Math.floor(h.def * floorMult),
      evasion: t.evasion + 10, exp: Math.floor(h.exp * floorMult), gold: Math.floor(h.gold * floorMult),
      grade: 4, isBoss: true, isHidden: true
    };
  }
  
  if (BOSSES[floor]) {
    const boss = BOSSES[floor];
    const t = MONSTER_TYPES[boss.type];
    return {
      name: `⭐${boss.name}⭐`, type: boss.type, typeName: t.name,
      hp: boss.hp, maxHp: boss.hp, atk: boss.atk, def: boss.def,
      evasion: t.evasion + 8, exp: boss.exp, gold: boss.gold,
      grade: 5, isBoss: true
    };
  }
  
  const pool = BASE_MONSTERS.filter(m => m.minFloor <= floor);
  const base = pool[Math.floor(Math.random() * pool.length)];
  const grade = determineGrade(floor);
  const g = GRADES[grade];
  const t = MONSTER_TYPES[base.type];
  const floorMult = 1 + Math.floor(floor / 8) * 0.18;
  
  return {
    name: grade > 1 ? `${g.name} ${base.name}` : base.name,
    type: base.type, typeName: t.name,
    hp: Math.floor(base.hp * t.hpMult * g.mult * floorMult),
    maxHp: Math.floor(base.hp * t.hpMult * g.mult * floorMult),
    atk: Math.floor(base.atk * t.atkMult * g.mult * floorMult),
    def: Math.floor(base.def * t.defMult * g.mult * floorMult),
    evasion: t.evasion,
    exp: Math.floor(base.exp * g.expMult * floorMult),
    gold: Math.floor(base.exp * 0.7 * g.expMult * floorMult),
    grade, isBoss: false
  };
}

// ============================================
// 장비 생성
// ============================================
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
    slot: slotKey, slotName: slot.name,
    grade, gradeName: gd.name, gradeColor: gd.color,
    stats, proc, special, enhance: 0
  };
}

function getItemStatText(item) {
  const st = [];
  const enhMult = 1 + (item.enhance || 0) * ENHANCE_BONUS;
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

function getItemDisplay(item) {
  const enh = item.enhance > 0 ? `+${item.enhance} ` : '';
  return `${item.gradeColor || ''}${enh}${item.name}`;
}

// ============================================
// 적 행동
// ============================================
function getEnemyAction(enemy) {
  const r = Math.random() * 100;
  if (enemy.isBoss) {
    if (r < 15) return { type: 'special', mult: 2.5, text: '⚠️ 필살기!', hint: '회피/방어 필수!' };
    if (r < 45) return { type: 'heavy', mult: 1.8, text: '⚠️ 강공격', hint: '해석하면 크리 확정' };
    if (r < 75) return { type: 'attack', mult: 1.2, text: '공격', hint: '일반 공격' };
    return { type: 'buff', mult: 2.0, text: '힘을 모으는 중...', hint: '지금 공격!' };
  }
  if (r < 50) return { type: 'attack', mult: 1.0, text: '공격', hint: '일반' };
  if (r < 80) return { type: 'heavy', mult: 1.6, text: '⚠️ 강공격!', hint: '해석/회피' };
  return { type: 'heal', mult: 0.15, text: '회복 중...', hint: '지금 공격!' };
}

// ============================================
// 결투 시뮬레이션
// ============================================
function simulateDuel(p1, p2) {
  const s1 = calcStats(p1);
  const s2 = calcStats(p2);
  
  let hp1 = s1.maxHp, hp2 = s2.maxHp;
  let log = [];
  let turn = 0;
  
  while (hp1 > 0 && hp2 > 0 && turn < 20) {
    turn++;
    
    // P1 공격
    let dmg1 = Math.max(1, s1.atk - s2.def * 0.4);
    const crit1 = Math.random() * 100 < s1.critRate;
    const dodge2 = Math.random() * 100 < s2.evasion;
    
    if (dodge2) {
      log.push(`${p2.name} 회피!`);
    } else {
      if (crit1) dmg1 *= 2;
      hp2 -= Math.floor(dmg1);
      log.push(`${p1.name} → ${p2.name}: ${Math.floor(dmg1)}${crit1 ? '💥' : ''}`);
    }
    
    if (hp2 <= 0) break;
    
    // P2 공격
    let dmg2 = Math.max(1, s2.atk - s1.def * 0.4);
    const crit2 = Math.random() * 100 < s2.critRate;
    const dodge1 = Math.random() * 100 < s1.evasion;
    
    if (dodge1) {
      log.push(`${p1.name} 회피!`);
    } else {
      if (crit2) dmg2 *= 2;
      hp1 -= Math.floor(dmg2);
      log.push(`${p2.name} → ${p1.name}: ${Math.floor(dmg2)}${crit2 ? '💥' : ''}`);
    }
  }
  
  const winner = hp1 > hp2 ? p1 : p2;
  return { winner, log: log.slice(-6), turns: turn, hp1, hp2 };
}

// ============================================
// Part 3: 응답 포맷, 마을/메뉴 텍스트
// ============================================

// 응답 포맷
function reply(text, buttons = []) {
  const response = { version: '2.0', template: { outputs: [{ simpleText: { text } }] } };
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.slice(0, 10).map(b => ({ label: b, action: 'message', messageText: b }));
  }
  return response;
}

function replyWithImage(imageUrl, text, buttons = []) {
  const response = {
    version: '2.0',
    template: {
      outputs: [
        { simpleImage: { imageUrl: imageUrl, altText: '이미지' } },
        { simpleText: { text: text } }
      ]
    }
  };
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.slice(0, 10).map(b => ({ label: b, action: 'message', messageText: b }));
  }
  return response;
}

function replyShareCard(imageUrl, title, description, shareText, buttons = []) {
  return {
    version: '2.0',
    template: {
      outputs: [{
        basicCard: {
          thumbnail: { imageUrl: imageUrl },
          title: title,
          description: description,
          buttons: [{
            action: 'share',
            label: '친구에게 공유',
            messageText: shareText
          }]
        }
      }],
      quickReplies: buttons.slice(0, 10).map(b => ({ label: b, action: 'message', messageText: b }))
    }
  };
}

function replyCard(title, desc, cardButtons = [], quickReplies = []) {
  const card = { title, description: desc };
  if (cardButtons.length > 0) {
    card.buttons = cardButtons.map(b => ({ label: b.label, action: 'message', messageText: b.text || b.label }));
  }
  const response = { version: '2.0', template: { outputs: [{ basicCard: card }] } };
  if (quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({ label: b, action: 'message', messageText: b }));
  }
  return response;
}

function replyTextAndCard(text, title, desc, cardButtons = [], quickReplies = []) {
  const response = {
    version: '2.0',
    template: {
      outputs: [
        { simpleText: { text } },
        { basicCard: { title, description: desc, buttons: cardButtons.map(b => ({ label: b.label, action: 'message', messageText: b.text || b.label })) } }
      ]
    }
  };
  if (quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({ label: b, action: 'message', messageText: b }));
  }
  return response;
}

// 마을 화면 텍스트
function getTownText(u) {
  const c = calcStats(u);
  const job = JOBS[u.job];
  const isBoss = BOSSES[u.floor] !== undefined;
  const req = getReqExp(u.lv || 1);
  
  let text = `🏠 마을\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `${job?.icon || '👤'} ${u.name} Lv.${u.lv || 1}\n`;
  text += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus || 0}/${u.maxFocus || 100}\n`;
  text += `🌀 광기: ${u.madness || 0} | 💰 ${u.gold || 0}G\n`;
  text += `📈 EXP: ${u.exp || 0}/${req}\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `🏔️ ${u.floor || 1}층${isBoss ? ' ⭐보스⭐' : ''} (최고: ${u.maxFloor || 1}층)\n`;
  
  if ((u.statPoints || 0) > 0) {
    text += `\n⭐ 미배분 스탯: ${u.statPoints}점`;
  }
  
  return text;
}

// @에테르 메뉴
function getEtherMenu() {
  return `🏔️ 에테르의 탑 v2.6
━━━━━━━━━━━━━━━
📌 명령어 안내

🎮 기본
• 시작 - 게임 시작
• 마을 - 마을로 이동
• 도움말 - 게임 설명

⚔️ 전투
• 전투 / 광기전투
• 탐사 (안전/위험/금기)
• 층이동 - 도달한 층으로

📊 정보
• 상태 - 내 스탯 보기
• 장비 - 장비/인벤토리
• 강화 - 장비 강화
• 스탯투자 (힘+5, 힘+전부)

👥 소셜
• 랭킹 / 전투력랭킹
• @결투 [이름] - PvP (보상!)
• @검색 [이름] - 프로필
• @선물 [이름] [금액]
• @자랑 - 내 장비 공유
• @초대 - 결투 초대장

🔗 친구 초대
pf.kakao.com/_BqpQn/chat`;
}

// 도움말
function getHelpText() {
  return `📚 도움말
━━━━━━━━━━━━━━━

⚔️ 전투
• 공격 - 기본 공격
• 회피 - 피해 회피 시도
• 해석 - 성공 시 크리 확정
• 방어 - 피해 50% 감소
• 스킬 - 직업 고유 기술
• 물약 - HP 회복

🧭 탐사 (비용/횟수 제한)
• 안전 - 저위험 (30G, 10회/일)
• 위험 - 중위험 (80G, 5회/일)
• 금기 - 고위험 (150G, 2회/일)

📊 스탯투자
• 힘+1, 힘+5, 힘+10, 힘+전부
• 민첩, 지능, 의지, 체력, 운 가능

🔨 강화
• +10까지 강화 가능
• +5부터 파괴 위험!

👥 소셜
• @결투 [이름] - 50G, 이기면 보상!
• @자랑 - 내 장비 공유
• @초대 - 결투 초대장`;
}

// 탐사 메뉴
function getExploreText(u) {
  const today = getTodayKey();
  const explores = u.explores || {};
  const todayExplores = explores[today] || { safe: 0, danger: 0, forbidden: 0 };
  
  return `🧭 탐사
━━━━━━━━━━━━━━━
어디를 탐사하시겠습니까?

🌿 안전탐사 (30G)
└ 남은 횟수: ${EXPLORE_CONFIG.safe.maxDaily - (todayExplores.safe || 0)}/${EXPLORE_CONFIG.safe.maxDaily}

⚠️ 위험탐사 (80G)
└ 남은 횟수: ${EXPLORE_CONFIG.danger.maxDaily - (todayExplores.danger || 0)}/${EXPLORE_CONFIG.danger.maxDaily}

💀 금기탐사 (150G)
└ 남은 횟수: ${EXPLORE_CONFIG.forbidden.maxDaily - (todayExplores.forbidden || 0)}/${EXPLORE_CONFIG.forbidden.maxDaily}

💰 보유: ${u.gold || 0}G`;
}

// ============================================
// Part 4: 메인 핸들러 - 신규유저, 소셜, @에테르
// ============================================

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.json({ message: 'ETHER v2.6 OK' });

  try {
    const userId = req.body?.userRequest?.user?.id;
    const msg = req.body?.userRequest?.utterance?.trim() || '';
    if (!userId) return res.json(reply('오류 발생', ['시작']));

    let u = await getUser(userId);

    // ========== @에테르 메뉴 ==========
    if (msg === '@에테르' || msg === '에테르' || msg === '명령어') {
      return res.json(reply(getEtherMenu(), u ? ['마을', '전투', '랭킹'] : ['시작', '랭킹']));
    }

    // ========== 랭킹 (로그인 불필요) ==========
    if (msg === '랭킹') {
      const ranks = await getTopUsers('floor', 10);
      let text = '🏆 층수 랭킹\n━━━━━━━━━━━━━━━\n';
      if (ranks.length === 0) {
        text += '아직 모험가가 없습니다.';
      } else {
        ranks.forEach(r => {
          const job = JOBS[r.job];
          text += `${r.rank}. ${job?.icon || ''}${r.name} Lv.${r.lv || 1} (${r.floor || 1}층)\n`;
        });
      }
      return res.json(reply(text, u ? ['마을', '전투력랭킹', '더보기'] : ['시작', '전투력랭킹']));
    }

    if (msg === '전투력랭킹') {
      const snapshot = await db.collection('users').where('phase', '==', 'town').get();
      let players = snapshot.docs.map(doc => ({ ...doc.data() }));
      players = players.map(p => ({ ...p, power: calcPower(p) })).sort((a, b) => b.power - a.power).slice(0, 10);
      
      let text = '⚔️ 전투력 랭킹\n━━━━━━━━━━━━━━━\n';
      if (players.length === 0) {
        text += '아직 모험가가 없습니다.';
      } else {
        players.forEach((p, i) => {
          const job = JOBS[p.job];
          text += `${i + 1}. ${job?.icon || ''}${p.name} - ${p.power}\n`;
        });
      }
      return res.json(reply(text, u ? ['마을', '랭킹', '더보기'] : ['시작', '랭킹']));
    }

    // ========== @검색 ==========
    if (msg.startsWith('@검색 ') || msg.startsWith('검색 ')) {
      const targetName = msg.replace('@검색 ', '').replace('검색 ', '').trim();
      if (!targetName) return res.json(reply('검색할 이름을 입력하세요.\n예: @검색 홍길동', ['마을']));
      
      const target = await getUserByName(targetName);
      if (!target) return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['랭킹', '마을']));
      
      const tc = calcStats(target);
      const tPower = calcPower(target);
      const tJob = JOBS[target.job];
      
      let text = `👤 ${target.name} 프로필\n━━━━━━━━━━━━━━━\n`;
      text += `${tJob?.icon || ''} ${tJob?.name || '무직'} Lv.${target.lv || 1}\n`;
      text += `⚔️ 전투력: ${tPower}\n`;
      text += `🏔️ 최고 ${target.maxFloor || 1}층\n\n`;
      text += `공격: ${tc.atk} | 방어: ${tc.def}\n`;
      text += `HP: ${tc.maxHp} | 회피: ${tc.evasion}%\n`;
      text += `📊 결투: ${target.duelWins || 0}승 ${target.duelLosses || 0}패`;
      
      const buttons = ['랭킹', '마을'];
      if (u && target.name !== u.name) buttons.unshift(`@결투 ${target.name}`);
      return res.json(reply(text, buttons));
    }

    // ========== 신규 유저 ==========
    if (!u) {
      if (msg === '시작') {
        await saveUser(userId, { phase: 'naming' });
        return res.json(reply('🌫️ 회색 안개 속에서 눈을 떴다...\n\n당신의 이름은?'));
      }
      return res.json(reply('🏔️ 에테르의 탑\n\n100층 정상에 오르면 소원이 이루어진다.\n하지만 소원은... 대가를 요구한다.\n\n@에테르 - 명령어 보기', ['시작', '랭킹', '@에테르']));
    }

    // ========== @결투 ==========
    if (msg.startsWith('@결투 ') || msg.startsWith('결투 ')) {
      if (u.phase !== 'town') return res.json(reply('마을에서만 결투할 수 있습니다.', ['마을']));
      
      const targetName = msg.replace('@결투 ', '').replace('결투 ', '').trim();
      if (!targetName) return res.json(reply('결투할 상대의 이름을 입력하세요.\n예: @결투 홍길동\n\n비용: 50G | 승리 보상: 100G + 50EXP', ['마을']));
      if (targetName === u.name) return res.json(reply('자기 자신과는 결투할 수 없습니다!', ['마을']));
      
      const target = await getUserByName(targetName);
      if (!target) return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['랭킹', '마을']));
      
      if ((u.gold || 0) < DUEL_CONFIG.cost) return res.json(reply(`골드 부족! (${DUEL_CONFIG.cost}G 필요)`, ['마을']));
      
      u.gold -= DUEL_CONFIG.cost;
      const result = simulateDuel(u, target);
      const isWinner = result.winner.name === u.name;
      
      let lvlUpMsg = '';
      if (isWinner) {
        u.gold += DUEL_CONFIG.winnerGold;
        u.exp = (u.exp || 0) + DUEL_CONFIG.winnerExp;
        u.duelWins = (u.duelWins || 0) + 1;
        u.duelPoints = (u.duelPoints || 0) + DUEL_CONFIG.rankPoints;
        
        const req = getReqExp(u.lv || 1);
        if ((u.exp || 0) >= req) {
          u.lv = (u.lv || 1) + 1;
          u.exp -= req;
          u.statPoints = (u.statPoints || 0) + 3;
          lvlUpMsg = `\n\n🎉 레벨 업! Lv.${u.lv} (+3 스탯)`;
        }
      } else {
        u.duelLosses = (u.duelLosses || 0) + 1;
      }
      
      await saveUser(userId, u);
      
      let text = `⚔️ 결투! ${u.name} vs ${target.name}\n━━━━━━━━━━━━━━━\n\n`;
      result.log.forEach(l => text += `${l}\n`);
      text += `\n━━━━━━━━━━━━━━━\n`;
      text += `🏆 ${result.winner.name} 승리! (${result.turns}턴)\n\n`;
      
      if (isWinner) {
        text += `💰 +${DUEL_CONFIG.winnerGold}G | ✨ +${DUEL_CONFIG.winnerExp}EXP${lvlUpMsg}`;
      } else {
        text += `💸 -${DUEL_CONFIG.cost}G`;
      }
      text += `\n\n📊 전적: ${u.duelWins || 0}승 ${u.duelLosses || 0}패`;
      
      return res.json(reply(text, ['마을', '랭킹', `@결투 ${target.name}`]));
    }

    if (msg === '@결투') {
      return res.json(reply('결투할 상대의 이름을 입력하세요.\n예: @결투 홍길동\n\n비용: 50G | 승리 보상: 100G + 50EXP', ['랭킹', '마을']));
    }

    // ========== @자랑 ==========
    if (msg === '@자랑' || msg === '자랑하기') {
      if (!u || u.phase !== 'town') return res.json(reply('마을에서만 자랑할 수 있습니다.', ['마을']));
      
      const equipped = u.equipment || {};
      let bestItem = null;
      
      for (const slot of ['weapon', 'armor', 'accessory', 'relic']) {
        if (equipped[slot]) {
          if (!bestItem || equipped[slot].grade > bestItem.grade) {
            bestItem = equipped[slot];
          }
        }
      }
      
      if (!bestItem) {
        return res.json(reply('❌ 장착된 장비가 없습니다.', ['마을', '장비']));
      }
      
      const itemImg = getItemImage(bestItem.slot, bestItem.grade);
      const shareText = `🎮 ETHER ONLINE\n\n${u.name}님이 ${bestItem.gradeColor}${bestItem.gradeName} 아이템을 획득!\n\n${getItemDisplay(bestItem)}\n${getItemStatText(bestItem)}\n\n나도 플레이하기 👉 ${KAKAO_CHANNEL_URL}`;
      
      if (itemImg) {
        return res.json(replyShareCard(itemImg, `${bestItem.gradeColor} ${bestItem.name}`, getItemStatText(bestItem), shareText, ['마을']));
      } else {
        return res.json(reply(`📢 자랑할 아이템:\n\n${getItemDisplay(bestItem)}\n${getItemStatText(bestItem)}`, ['마을']));
      }
    }

    // ========== @초대 ==========
    if (msg === '@초대' || msg === '결투초대') {
      if (!u || u.phase !== 'town') return res.json(reply('마을에서만 초대할 수 있습니다.', ['마을']));
      
      const power = calcPower(u);
      const jobImg = JOB_IMAGES[u.job];
      const shareText = `⚔️ ETHER ONLINE 결투 초대!\n\n${u.name} (Lv.${u.lv || 1})\n전투력: ${power}\n전적: ${u.duelWins || 0}승 ${u.duelLosses || 0}패\n\n나에게 도전하라! 👉 ${KAKAO_CHANNEL_URL}`;
      
      if (jobImg) {
        return res.json(replyShareCard(jobImg, `⚔️ ${u.name}의 도전장`, `Lv.${u.lv || 1} | 전투력 ${power}`, shareText, ['마을']));
      } else {
        return res.json(reply(`📢 결투 초대장:\n\n${shareText}`, ['마을']));
      }
    }

    // ========== @선물 ==========
    if (msg.startsWith('@선물 ') || msg.startsWith('선물 ')) {
      if (u.phase !== 'town') return res.json(reply('마을에서만 선물할 수 있습니다.', ['마을']));
      
      const parts = msg.replace('@선물 ', '').replace('선물 ', '').trim().split(' ');
      if (parts.length < 2) return res.json(reply('사용법: @선물 [이름] [금액]\n예: @선물 홍길동 100', ['마을']));
      
      const amount = parseInt(parts.pop());
      const targetName = parts.join(' ');
      
      if (!targetName || isNaN(amount) || amount <= 0) {
        return res.json(reply('사용법: @선물 [이름] [금액]\n예: @선물 홍길동 100', ['마을']));
      }
      if (targetName === u.name) return res.json(reply('자기 자신에게는 선물할 수 없습니다!', ['마을']));
      if ((u.gold || 0) < amount) return res.json(reply(`골드 부족! (보유: ${u.gold || 0}G)`, ['마을']));
      if (amount > 10000) return res.json(reply('한 번에 10,000G까지만 선물할 수 있습니다.', ['마을']));
      
      const target = await getUserByName(targetName);
      if (!target) return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['랭킹', '마을']));
      
      u.gold -= amount;
      await saveUser(userId, u);
      await db.collection('users').doc(target.odocId).update({ gold: (target.gold || 0) + amount });
      
      return res.json(reply(`🎁 ${targetName}에게 ${amount}G를 선물했습니다!\n\n💰 보유: ${u.gold}G`, ['마을']));
    }

    if (msg === '@선물') {
      return res.json(reply('사용법: @선물 [이름] [금액]\n예: @선물 홍길동 100\n\n최대 10,000G', ['마을']));
    }

    // ========== 이름 입력 ==========
    if (u.phase === 'naming') {
      if (msg.length < 1 || msg.length > 8) return res.json(reply('이름은 1~8자로 입력해주세요.'));
      if (msg.startsWith('@') || msg.startsWith('!')) return res.json(reply('이름에 특수문자를 사용할 수 없습니다.'));
      
      const existing = await getUserByName(msg);
      if (existing) return res.json(reply('이미 사용 중인 이름입니다.'));
      
      await saveUser(userId, { ...u, phase: 'job', name: msg });
      
      let jobList = `${msg}... 기억해두마.\n\n직업을 선택하세요:\n━━━━━━━━━━━━━━━\n`;
      Object.entries(JOBS).forEach(([id, j]) => {
        jobList += `${j.icon} ${j.name}\n└ ${j.desc}\n\n`;
      });
      return res.json(reply(jobList, Object.values(JOBS).map(j => j.name)));
    }

    // ========== 직업 선택 ==========
    if (u.phase === 'job') {
      const jobEntry = Object.entries(JOBS).find(([k, v]) => v.name === msg);
      if (!jobEntry) return res.json(reply('직업을 선택해주세요.', Object.values(JOBS).map(j => j.name)));
      
      const [jobId, job] = jobEntry;
      const stats = { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
      Object.keys(job.base).forEach(k => stats[k] += job.base[k]);
      
      const tempUser = { stats, job: jobId, equipment: {}, curses: [] };
      const c = calcStats(tempUser);
      
      await saveUser(userId, {
        phase: 'town', name: u.name, job: jobId,
        lv: 1, exp: 0, gold: 150, floor: 1, maxFloor: 1,
        stats, statPoints: 5, hp: c.maxHp, maxHp: c.maxHp,
        focus: 60, maxFocus: 100, madness: 0, curses: [],
        equipment: { weapon: null, armor: null, accessory: null, relic: null },
        inventory: [], skillCd: 0, potions: 3, hiPotions: 1,
        duelWins: 0, duelLosses: 0, duelPoints: 0,
        explores: {}, treasureNext: false,
        createdAt: new Date().toISOString()
      });
      
      const jobImg = JOB_IMAGES[jobId];
      const confirmText = `${job.icon} ${job.name} 각성!\n━━━━━━━━━━━━━━━\n` +
        `❤️ HP: ${c.maxHp}\n⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}\n👁 해석: ${c.interpret}%\n\n` +
        `✨ 스킬: ${job.skill.name}\n└ ${job.skill.desc}\n\n` +
        `💰 150G | 🧪 물약 3개 | 💊 고급 1개\n⭐ 스탯 포인트: 5점`;
      
      if (jobImg) {
        return res.json(replyWithImage(jobImg, confirmText, ['마을']));
      }
      return res.json(reply(confirmText, ['마을']));
    }

    // ========== 초기화 확인 ==========
    if (u.phase === 'confirm_reset') {
      if (msg === '초기화확인') {
        await deleteUser(userId);
        return res.json(reply('💀 모든 기록이 삭제되었습니다.', ['시작']));
      }
      await saveUser(userId, { ...u, phase: 'town' });
      return res.json(reply('초기화가 취소되었습니다.', ['마을']));
    }

    // ========== 마을 ==========
    if (u.phase === 'town') {
      const c = calcStats(u);
      const job = JOBS[u.job];
      const isBoss = BOSSES[u.floor] !== undefined;

      // 마을 메인
      if (msg === '마을' || msg === '돌아가기') {
        return res.json(reply(getTownText(u), ['전투', '탐사', '층이동', '상태', '장비', '상점', '휴식', '더보기']));
      }

      // 더보기 메뉴
      if (msg === '더보기') {
        return res.json(reply(
          `📋 더보기\n━━━━━━━━━━━━━━━\n` +
          `👥 소셜: 랭킹, @결투, @검색, @선물\n` +
          `📢 공유: @자랑, @초대\n` +
          `📚 정보: 도움말, @에테르\n` +
          `⚙️ 설정: 초기화`,
          ['랭킹', '전투력랭킹', '@자랑', '@초대', '도움말', '초기화', '마을']
        ));
      }

      // 도움말
      if (msg === '도움말') {
        return res.json(reply(getHelpText(), ['마을', '더보기']));
      }

      // 전투 시작
      if (msg === '전투' || msg === '광기전투') {
        const madnessOpen = msg === '광기전투';
        const monster = spawnMonster(u.floor);
        const action = getEnemyAction(monster);
        
        await saveUser(userId, {
          ...u, phase: 'battle', monster, nextAction: action,
          battleTurn: 1, madnessOpen, interpretBonus: 0,
          isDefending: false, critBoost: 0, shamanDR: 0, ironDRTurns: 0, revived: false
        });
        
        const monsterImg = getMonsterImage(monster.name);
        let text = madnessOpen ? '🌀 광기 개방!\n\n' : '';
        text += monster.isBoss ? `⭐ BOSS ⭐\n${getLine(BATTLE_LINES, 'bossAppear')}\n\n` : '';
        text += `${monster.name} 출현!\n[${monster.typeName}] ${GRADES[monster.grade]?.name || '일반'}\n\n`;
        text += `👹 ${monster.hp}/${monster.maxHp}\n`;
        text += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n\n`;
        text += `📢 ${action.text}\n└ ${action.hint}`;
        
        const battleButtons = ['공격', '회피', '해석', '방어', '스킬', '물약'];
        
        if (monsterImg) {
          return res.json(replyWithImage(monsterImg, text, battleButtons));
        }
        return res.json(reply(text, battleButtons));
      }

      // 탐사 메뉴
      if (msg === '탐사') {
        return res.json(reply(getExploreText(u), ['안전탐사', '위험탐사', '금기탐사', '마을']));
      }

      // 탐사 실행
      if (msg === '안전탐사' || msg === '위험탐사' || msg === '금기탐사') {
        const tierKey = msg === '안전탐사' ? 'safe' : (msg === '위험탐사' ? 'danger' : 'forbidden');
        const config = EXPLORE_CONFIG[tierKey];
        const today = getTodayKey();
        
        u.explores = u.explores || {};
        u.explores[today] = u.explores[today] || { safe: 0, danger: 0, forbidden: 0 };
        
        // 횟수 체크
        if ((u.explores[today][tierKey] || 0) >= config.maxDaily) {
          return res.json(reply(`오늘의 ${msg} 횟수를 모두 사용했습니다!`, ['탐사', '마을']));
        }
        
        // 비용 체크
        if ((u.gold || 0) < config.cost) {
          return res.json(reply(`골드 부족! (${config.cost}G 필요)`, ['탐사', '마을']));
        }
        
        u.gold -= config.cost;
        u.explores[today][tierKey]++;
        
        const roll = Math.random() * 100;
        let cumulative = 0;
        
        // 보물 확정 (낡은 지도 효과)
        if (u.treasureNext) {
          u.treasureNext = false;
          await saveUser(userId, u);
          return handleExploreTreasure(res, u, userId, tierKey);
        }
        
        // 이벤트
        cumulative += config.eventRate;
        if (roll < cumulative) {
          await saveUser(userId, u);
          return handleExploreEvent(res, u, userId, tierKey);
        }
        
        // 저주
        cumulative += config.curseRate;
        if (roll < cumulative) {
          const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
          u.curses = [...(u.curses || []), curse];
          await saveUser(userId, u);
          return res.json(reply(`💀 저주에 걸렸다...\n\n${curse.name}: ${curse.desc}\n\n-${config.cost}G`, ['탐사', '마을']));
        }
        
        // 전투
        cumulative += config.battleRate;
        if (roll < cumulative) {
          const madnessOpen = tierKey === 'forbidden' || (tierKey === 'danger' && Math.random() < 0.4);
          const monster = spawnMonster(u.floor);
          const action = getEnemyAction(monster);
          
          await saveUser(userId, {
            ...u, phase: 'battle', monster, nextAction: action,
            battleTurn: 1, madnessOpen, interpretBonus: 0
          });
          
          let text = `${madnessOpen ? '🌀 광기가 스며든다!\n\n' : ''}`;
          text += `탐사 중 적과 조우!\n\n${monster.name}\n📢 ${action.text}\n\n-${config.cost}G`;
          return res.json(reply(text, ['공격', '회피', '해석', '방어', '스킬', '물약']));
        }
        
        // 보물
        cumulative += config.treasureRate;
        if (roll < cumulative) {
          await saveUser(userId, u);
          return handleExploreTreasure(res, u, userId, tierKey);
        }
        
        // 아무것도 없음
        await saveUser(userId, u);
        return res.json(reply(`조용하다... 아무것도 발견하지 못했다.\n\n-${config.cost}G`, ['탐사', '마을']));
      }

      // 층이동
      if (msg === '층이동') {
        const bossFloors = Object.keys(BOSSES).map(Number).filter(f => f <= (u.maxFloor || 1));
        let text = `🏔️ 층이동\n━━━━━━━━━━━━━━━\n`;
        text += `현재: ${u.floor}층\n최고 도달: ${u.maxFloor}층\n\n`;
        text += `이동할 층 번호를 입력하세요.\n`;
        if (bossFloors.length > 0) {
          text += `\n⭐ 보스층: ${bossFloors.join(', ')}층`;
        }
        
        const quickFloors = ['1층', '마을'];
        if ((u.maxFloor || 1) >= 5) quickFloors.unshift('5층');
        if ((u.maxFloor || 1) >= 10) quickFloors.unshift('10층');
        if ((u.maxFloor || 1) >= 20) quickFloors.unshift('20층');
        
        return res.json(reply(text, quickFloors));
      }

      if (msg.endsWith('층') && !isNaN(parseInt(msg))) {
        const targetFloor = parseInt(msg);
        if (targetFloor < 1 || targetFloor > (u.maxFloor || 1)) {
          return res.json(reply(`1~${u.maxFloor}층 사이로만 이동 가능합니다.`, ['층이동', '마을']));
        }
        u.floor = targetFloor;
        await saveUser(userId, u);
        const isBoss = BOSSES[targetFloor] !== undefined;
        return res.json(reply(`🏔️ ${targetFloor}층으로 이동!${isBoss ? '\n⭐ 보스가 기다리고 있다...' : ''}`, ['전투', '탐사', '마을']));
      }

      // 상태
      if (msg === '상태') {
        const req = getReqExp(u.lv || 1);
        const power = calcPower(u);
        let text = `📊 ${u.name} 상태\n━━━━━━━━━━━━━━━\n`;
        text += `${job?.icon || ''} ${job?.name || '무직'} Lv.${u.lv || 1}\n`;
        text += `⚔️ 전투력: ${power}\n\n`;
        text += `❤️ HP: ${u.hp}/${c.maxHp}\n`;
        text += `⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}\n`;
        text += `💨 회피: ${c.evasion}% | 💥 크리: ${c.critRate}%\n`;
        text += `👁 해석: ${c.interpret}%\n\n`;
        text += `━━ 스탯 ━━\n`;
        text += `힘:${u.stats.str} 민:${u.stats.dex} 지:${u.stats.int}\n`;
        text += `의:${u.stats.wil} 체:${u.stats.vit} 운:${u.stats.luk}\n`;
        text += `\n📊 결투: ${u.duelWins || 0}승 ${u.duelLosses || 0}패`;
        
        if ((u.statPoints || 0) > 0) {
          text += `\n\n⭐ 미배분: ${u.statPoints}점`;
        }
        
        if ((u.curses || []).length > 0) {
          text += `\n\n💀 저주: ${u.curses.map(c => c.name).join(', ')}`;
        }
        
        const buttons = ['마을'];
        if ((u.statPoints || 0) > 0) buttons.unshift('스탯투자');
        return res.json(reply(text, buttons));
      }

      // 스탯 투자
      if (msg === '스탯투자' || msg === '스탯') {
        if ((u.statPoints || 0) <= 0) {
          return res.json(reply('배분할 스탯 포인트가 없습니다.', ['상태', '마을']));
        }
        return res.json(reply(
          `⭐ 스탯 투자 (${u.statPoints}점)\n━━━━━━━━━━━━━━━\n` +
          `현재 스탯:\n힘:${u.stats.str} 민:${u.stats.dex} 지:${u.stats.int}\n의:${u.stats.wil} 체:${u.stats.vit} 운:${u.stats.luk}\n\n` +
          `💡 명령어: 힘+1, 힘+5, 힘+10, 힘+전부`,
          ['힘+1', '힘+5', '힘+전부', '민첩+5', '체력+5', '상태', '마을']
        ));
      }

      // 스탯+N 또는 스탯+전부 패턴 (개선)
      const STAT_NAMES = {
        '힘': 'str', '민첩': 'dex', '지능': 'int', 
        '의지': 'wil', '체력': 'vit', '운': 'luk', '행운': 'luk'
      };
      const STAT_KOREAN = {
        'str': '힘', 'dex': '민첩', 'int': '지능',
        'wil': '의지', 'vit': '체력', 'luk': '운'
      };
      
      const statPattern = /^(힘|민첩|지능|의지|체력|운|행운)\+(\d+|전부)$/;
      const statMatch = msg.match(statPattern);
      
      if (statMatch) {
        const statName = STAT_NAMES[statMatch[1]];
        const amountStr = statMatch[2];
        
        if ((u.statPoints || 0) <= 0) {
          return res.json(reply('포인트 부족!', ['상태', '마을']));
        }
        
        let amount;
        if (amountStr === '전부') {
          amount = u.statPoints;
        } else {
          amount = parseInt(amountStr);
        }
        
        if (amount > u.statPoints) {
          amount = u.statPoints;
        }
        
        if (amount <= 0) {
          return res.json(reply('1 이상의 숫자를 입력하세요.', ['스탯투자', '마을']));
        }
        
        u.stats[statName] += amount;
        u.statPoints -= amount;
        const newC = calcStats(u);
        u.maxHp = newC.maxHp;
        
        await saveUser(userId, u);
        
        const koreanName = STAT_KOREAN[statName];
        const text = `✅ ${koreanName}에 ${amount} 포인트 투자!\n\n` +
          `${koreanName}: ${u.stats[statName] - amount} → ${u.stats[statName]}\n` +
          `남은 포인트: ${u.statPoints}`;
        
        if (u.statPoints > 0) {
          return res.json(reply(text, ['힘+5', '민첩+5', '체력+5', '스탯투자', '상태', '마을']));
        }
        return res.json(reply(text + '\n\n스탯 투자 완료!', ['상태', '마을']));
      }

      // 기존 단일 스탯 패턴 (하위 호환)
      const statMap = { '힘+1': 'str', '민첩+1': 'dex', '지능+1': 'int', '의지+1': 'wil', '체력+1': 'vit', '행운+1': 'luk' };
      if (statMap[msg]) {
        if ((u.statPoints || 0) <= 0) return res.json(reply('포인트 부족!', ['상태', '마을']));
        u.stats[statMap[msg]]++;
        u.statPoints--;
        const newC = calcStats(u);
        u.maxHp = newC.maxHp;
        await saveUser(userId, u);
        
        if (u.statPoints > 0) {
          return res.json(reply(`✅ ${statMap[msg].toUpperCase()} +1! (남은: ${u.statPoints})`, ['힘+1', '민첩+1', '지능+1', '의지+1', '체력+1', '행운+1', '상태']));
        }
        return res.json(reply(`✅ ${statMap[msg].toUpperCase()} +1!\n스탯 투자 완료!`, ['상태', '마을']));
      }

      // 장비
      if (msg === '장비') {
        let text = '🎒 장비\n━━━━━━━━━━━━━━━\n';
        ['weapon', 'armor', 'accessory', 'relic'].forEach(slot => {
          const item = u.equipment?.[slot];
          const slotName = ITEM_TYPES[slot].name;
          if (item) {
            text += `${slotName}: ${getItemDisplay(item)}\n└ ${getItemStatText(item)}\n`;
          } else {
            text += `${slotName}: (없음)\n`;
          }
        });
        
        const inv = u.inventory || [];
        if (inv.length > 0) {
          text += `\n📦 인벤토리 (${inv.length})\n`;
          inv.slice(0, 5).forEach((item, i) => {
            text += `${i + 1}. ${getItemDisplay(item)} [${item.slotName}]\n`;
          });
          if (inv.length > 5) text += `...외 ${inv.length - 5}개\n`;
        }
        
        const buttons = ['마을'];
        if (inv.length > 0) buttons.unshift('장착1', '판매1');
        const hasEquip = Object.values(u.equipment || {}).some(e => e !== null);
        if (hasEquip) buttons.unshift('강화');
        return res.json(reply(text, buttons));
      }

      // 장착
      if (msg.startsWith('장착')) {
        const idx = parseInt(msg.replace('장착', '')) - 1;
        const inv = u.inventory || [];
        if (idx < 0 || idx >= inv.length) return res.json(reply('잘못된 번호입니다.', ['장비', '마을']));
        
        const item = inv[idx];
        const oldItem = u.equipment[item.slot];
        u.equipment[item.slot] = item;
        u.inventory = inv.filter((_, i) => i !== idx);
        if (oldItem) u.inventory.push(oldItem);
        
        await saveUser(userId, u);
        return res.json(reply(`✅ ${getItemDisplay(item)} 장착!`, ['장비', '마을']));
      }

      // 판매
      if (msg.startsWith('판매')) {
        const idx = parseInt(msg.replace('판매', '')) - 1;
        const inv = u.inventory || [];
        if (idx < 0 || idx >= inv.length) return res.json(reply('잘못된 번호입니다.', ['장비', '마을']));
        
        const item = inv[idx];
        const price = Math.floor((item.grade * 20 + 15) * (1 + (item.enhance || 0) * 0.5));
        u.inventory = inv.filter((_, i) => i !== idx);
        u.gold = (u.gold || 0) + price;
        
        await saveUser(userId, u);
        return res.json(reply(`💰 +${price}G (${item.name})`, ['장비', '마을']));
      }

      // 강화
      if (msg === '강화') {
        const equipped = ['weapon', 'armor', 'accessory', 'relic'].filter(s => u.equipment?.[s]);
        if (equipped.length === 0) return res.json(reply('강화할 장비가 없습니다.', ['장비', '마을']));
        
        let desc = '';
        const cardButtons = [];
        
        equipped.forEach((slot, i) => {
          const item = u.equipment[slot];
          const enh = item.enhance || 0;
          if (enh >= 10) {
            desc += `${i + 1}. ${getItemDisplay(item)} (MAX)\n`;
          } else {
            const cost = ENHANCE_COST(enh);
            const rate = ENHANCE_RATES[enh + 1];
            const destroy = DESTROY_RATES[enh + 1];
            desc += `${i + 1}. ${getItemDisplay(item)}\n`;
            desc += `   +${enh}→+${enh + 1} (${rate}%`;
            if (destroy > 0) desc += ` 💀${destroy}%`;
            desc += `) ${cost}G\n`;
            cardButtons.push({ label: `강화${i + 1}`, text: `강화${slot}` });
          }
        });
        
        cardButtons.push({ label: '돌아가기', text: '마을' });
        
        return res.json(replyTextAndCard(
          `🔨 대장장이: "${getLine(BLACKSMITH_LINES, 'greet')}"`,
          '⚒️ 강화',
          `${desc}\n💰 보유: ${u.gold || 0}G`,
          cardButtons,
          ['장비', '상점', '마을']
        ));
      }

      // 강화 실행
      const enhanceSlots = ['weapon', 'armor', 'accessory', 'relic'];
      const enhanceMatch = enhanceSlots.find(s => msg === `강화${s}`);
      if (enhanceMatch) {
        const item = u.equipment?.[enhanceMatch];
        if (!item) return res.json(reply('장비가 없습니다.', ['강화', '마을']));
        
        const enh = item.enhance || 0;
        if (enh >= 10) return res.json(reply(`🔨 "${getLine(BLACKSMITH_LINES, 'maxEnhance')}"`, ['강화', '마을']));
        
        const cost = ENHANCE_COST(enh);
        if ((u.gold || 0) < cost) return res.json(reply(`골드 부족! (${cost}G 필요)`, ['강화', '마을']));
        
        u.gold -= cost;
        const rate = ENHANCE_RATES[enh + 1];
        const destroyRate = DESTROY_RATES[enh + 1];
        const success = Math.random() * 100 < rate;
        
        if (success) {
          item.enhance = enh + 1;
          await saveUser(userId, u);
          return res.json(replyTextAndCard(
            `🔨 "${getLine(BLACKSMITH_LINES, 'success')}"`,
            `✨ +${enh} → +${enh + 1} 성공!`,
            `${getItemDisplay(item)}\n${getItemStatText(item)}\n\n-${cost}G | 💰 ${u.gold}G`,
            [{ label: '계속 강화', text: '강화' }, { label: '돌아가기', text: '마을' }],
            []
          ));
        } else {
          const destroyed = Math.random() * 100 < destroyRate;
          if (destroyed) {
            u.equipment[enhanceMatch] = null;
            await saveUser(userId, u);
            return res.json(replyTextAndCard(
              `🔨 "${getLine(BLACKSMITH_LINES, 'destroy')}"`,
              `💥 파괴됨!`,
              `장비가 사라졌습니다...\n\n-${cost}G | 💰 ${u.gold}G`,
              [{ label: '돌아가기', text: '장비' }],
              []
            ));
          }
          await saveUser(userId, u);
          return res.json(replyTextAndCard(
            `🔨 "${getLine(BLACKSMITH_LINES, 'maintain')}"`,
            `❌ 실패 (유지)`,
            `${getItemDisplay(item)}\n\n-${cost}G | 💰 ${u.gold}G`,
            [{ label: '계속 강화', text: '강화' }, { label: '돌아가기', text: '마을' }],
            []
          ));
        }
      }

      // 상점
      if (msg === '상점') {
        const p1 = 30 + (u.floor || 1) * 2;
        const p2 = 100 + (u.floor || 1) * 4;
        return res.json(reply(
          `🏪 상점\n━━━━━━━━━━━━━━━\n` +
          `🧪 물약 (${p1}G) - HP 40%\n` +
          `💊 고급물약 (${p2}G) - HP 100%\n\n` +
          `보유: 🧪${u.potions || 0} 💊${u.hiPotions || 0}\n💰 ${u.gold || 0}G`,
          ['물약구매', '고급물약구매', '마을']
        ));
      }

      if (msg === '물약구매') {
        const cost = 30 + (u.floor || 1) * 2;
        if ((u.gold || 0) < cost) return res.json(reply('골드 부족!', ['상점', '마을']));
        u.gold -= cost;
        u.potions = (u.potions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`🧪 구매! (보유: ${u.potions}개)\n💰 ${u.gold}G`, ['상점', '마을']));
      }

      if (msg === '고급물약구매') {
        const cost = 100 + (u.floor || 1) * 4;
        if ((u.gold || 0) < cost) return res.json(reply('골드 부족!', ['상점', '마을']));
        u.gold -= cost;
        u.hiPotions = (u.hiPotions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`💊 구매! (보유: ${u.hiPotions}개)\n💰 ${u.gold}G`, ['상점', '마을']));
      }

      // 휴식
      if (msg === '휴식') {
        const cost = 30 + (u.floor || 1) * 5;
        if ((u.gold || 0) < cost) return res.json(reply(`골드 부족! (${cost}G 필요)`, ['마을']));
        
        // 15% 습격
        if (Math.random() < 0.15) {
          u.gold -= Math.floor(cost / 2);
          u.madness = clamp((u.madness || 0) + 10, 0, 100);
          const monster = spawnMonster(u.floor || 1);
          const action = getEnemyAction(monster);
          await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen: false, interpretBonus: 0 });
          return res.json(reply(`💀 휴식 중 습격!\n\n${monster.name}\n📢 ${action.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
        }
        
        u.gold -= cost;
        const heal = Math.floor(c.maxHp * 0.35);
        u.hp = Math.min(c.maxHp, (u.hp || 0) + heal);
        u.focus = Math.min(u.maxFocus || 100, (u.focus || 0) + 30);
        u.skillCd = 0;
        if ((u.madness || 0) > 0) u.madness = Math.max(0, u.madness - 12);
        
        await saveUser(userId, u);
        return res.json(reply(`💤 휴식 완료!\n-${cost}G\n❤️+${heal} ⚡+30${(u.madness || 0) > 0 ? ' 🌀-12' : ''}`, ['전투', '탐사', '마을']));
      }

      // 초기화
      if (msg === '초기화') {
        await saveUser(userId, { ...u, phase: 'confirm_reset' });
        return res.json(reply(`⚠️ 캐릭터 초기화\n\n${u.name} Lv.${u.lv || 1}\n🏔️ ${u.maxFloor || 1}층 | 💰 ${u.gold || 0}G\n\n정말 삭제하시겠습니까?`, ['초기화확인', '마을']));
      }

      // 기본
      return res.json(reply(getTownText(u), ['전투', '탐사', '층이동', '상태', '장비', '상점', '휴식', '더보기']));
    }

// ============================================
// Part 6: 탐사 이벤트 & 전투 시스템
// ============================================

// 탐사 보물 핸들러
async function handleExploreTreasure(res, u, userId, tierKey) {
  const bonusGold = { safe: 50, danger: 120, forbidden: 200 }[tierKey];
  const bonusMad = { safe: 0, danger: 8, forbidden: 15 }[tierKey];
  const minGrade = { safe: 1, danger: 2, forbidden: 3 }[tierKey];
  
  u.gold = (u.gold || 0) + bonusGold;
  u.madness = clamp((u.madness || 0) + bonusMad, 0, 100);
  
  const item = generateItem(clamp(minGrade + 1, 1, 5), u.floor || 1, tierKey === 'forbidden');
  let text = `📦 보물 발견!\n━━━━━━━━━━━━━━━\n+${bonusGold}G`;
  if (bonusMad > 0) text += ` | 🌀+${bonusMad}`;
  
  if (item) {
    u.inventory = [...(u.inventory || []), item];
    text += `\n\n${getItemDisplay(item)}\n${getItemStatText(item)}`;
  }
  
  await saveUser(userId, u);
  return res.json(reply(text, ['탐사', '장비', '마을']));
}

// 탐사 이벤트 핸들러
async function handleExploreEvent(res, u, userId, tierKey) {
  const events = tierKey === 'safe' 
    ? ['gambler', 'map'] 
    : tierKey === 'danger'
    ? ['gambler', 'ghost', 'map']
    : ['gambler', 'ghost', 'statue', 'altar', 'map', 'rift'];
  
  const eventKey = events[Math.floor(Math.random() * events.length)];
  const event = EXPLORE_EVENTS[eventKey];
  const eventImg = EVENT_IMAGES[eventKey];
  
  switch (eventKey) {
    case 'gambler': {
      await saveUser(userId, { ...u, phase: 'event_gambler' });
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n"${event.desc}"\n\n현재 골드: ${u.gold || 0}G\n\n도박하시겠습니까?`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['도박한다', '거절한다']));
      return res.json(reply(text, ['도박한다', '거절한다']));
    }
    case 'ghost': {
      await saveUser(userId, { ...u, phase: 'event_ghost' });
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n"${event.desc}"\n\n(50% 스탯+1 / 50% 저주)`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['받는다', '거절한다']));
      return res.json(reply(text, ['받는다', '거절한다']));
    }
    case 'statue': {
      const riddles = [
        { q: '밤에 태어나 낮에 죽는 것은?', a: '별' },
        { q: '가면 갈수록 멀어지는 것은?', a: '과거' },
        { q: '앞으로만 갈 수 있는 것은?', a: '시간' }
      ];
      const riddle = riddles[Math.floor(Math.random() * riddles.length)];
      await saveUser(userId, { ...u, phase: 'event_statue', riddleAnswer: riddle.a });
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n"수수께끼를 맞추면 보물을 주지."\n\n${riddle.q}`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['포기']));
      return res.json(reply(text, ['포기']));
    }
    case 'altar': {
      await saveUser(userId, { ...u, phase: 'event_altar' });
      const c = calcStats(u);
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n"${event.desc}"\n\nHP 절반을 바치면 희귀+ 아이템!\n현재 HP: ${u.hp || c.maxHp}`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['바친다', '거절한다']));
      return res.json(reply(text, ['바친다', '거절한다']));
    }
    case 'map': {
      u.treasureNext = true;
      await saveUser(userId, u);
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n${event.desc}\n\n다음 탐사에서 보물이 확정됩니다!`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['탐사', '마을']));
      return res.json(reply(text, ['탐사', '마을']));
    }
    case 'rift': {
      const monster = spawnMonster(u.floor, true);
      const action = getEnemyAction(monster);
      await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen: true, interpretBonus: 0 });
      const text = `${event.name}\n━━━━━━━━━━━━━━━\n${event.desc}\n\n🌑 ${monster.name} 출현!\n📢 ${action.text}`;
      if (eventImg) return res.json(replyWithImage(eventImg, text, ['공격', '회피', '해석', '방어', '스킬', '물약']));
      return res.json(reply(text, ['공격', '회피', '해석', '방어', '스킬', '물약']));
    }
  }
  
  return res.json(reply('이상한 기운이 느껴졌지만 사라졌다...', ['탐사', '마을']));
}

// ============================================
// Part 7: 이벤트 phase 처리 + 전투 로직
// ============================================

    // ========== 이벤트: 도박꾼 ==========
    if (u.phase === 'event_gambler') {
      if (msg === '도박한다') {
        const win = Math.random() < 0.5;
        if (win) {
          const bonus = u.gold || 0;
          u.gold = (u.gold || 0) * 2;
          u.phase = 'town';
          await saveUser(userId, u);
          return res.json(reply(`🎰 대박!\n\n+${bonus}G → 💰 ${u.gold}G`, ['탐사', '마을']));
        } else {
          const lost = u.gold || 0;
          u.gold = 0;
          u.phase = 'town';
          await saveUser(userId, u);
          return res.json(reply(`🎰 "하하하! 운이 없군!"\n\n-${lost}G 💰 0G`, ['탐사', '마을']));
        }
      }
      u.phase = 'town';
      await saveUser(userId, u);
      return res.json(reply('도박꾼이 사라졌다...', ['탐사', '마을']));
    }

    // ========== 이벤트: 영혼 ==========
    if (u.phase === 'event_ghost') {
      if (msg === '받는다') {
        const success = Math.random() < 0.5;
        if (success) {
          const stats = ['str', 'dex', 'int', 'wil', 'vit', 'luk'];
          const stat = stats[Math.floor(Math.random() * stats.length)];
          u.stats[stat]++;
          u.phase = 'town';
          await saveUser(userId, u);
          return res.json(reply(`👻 "힘을 나눠주지..."\n\n${stat.toUpperCase()} +1!`, ['상태', '마을']));
        } else {
          const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
          u.curses = [...(u.curses || []), curse];
          u.phase = 'town';
          await saveUser(userId, u);
          return res.json(reply(`👻 "...대가가 필요해."\n\n💀 ${curse.name}: ${curse.desc}`, ['상태', '마을']));
        }
      }
      u.phase = 'town';
      await saveUser(userId, u);
      return res.json(reply('영혼이 사라졌다...', ['탐사', '마을']));
    }

    // ========== 이벤트: 석상 ==========
    if (u.phase === 'event_statue') {
      if (msg === '포기') {
        u.phase = 'town';
        u.riddleAnswer = null;
        await saveUser(userId, u);
        return res.json(reply('석상이 침묵한다...', ['탐사', '마을']));
      }
      if (msg === u.riddleAnswer) {
        const item = generateItem(4, u.floor || 1, false, true);
        u.inventory = [...(u.inventory || []), item];
        u.phase = 'town';
        u.riddleAnswer = null;
        await saveUser(userId, u);
        return res.json(reply(`🗿 "정답이다."\n\n${getItemDisplay(item)}\n${getItemStatText(item)}`, ['장비', '마을']));
      }
      return res.json(reply('🗿 "틀렸다..."', ['포기']));
    }

    // ========== 이벤트: 제단 ==========
    if (u.phase === 'event_altar') {
      if (msg === '바친다') {
        const c = calcStats(u);
        u.hp = Math.floor((u.hp || c.maxHp) / 2);
        const item = generateItem(4, u.floor || 1, false, true);
        u.inventory = [...(u.inventory || []), item];
        u.phase = 'town';
        await saveUser(userId, u);
        return res.json(reply(`🩸 피가 스며든다...\n\nHP ${u.hp} 남음\n\n${getItemDisplay(item)}\n${getItemStatText(item)}`, ['장비', '마을']));
      }
      u.phase = 'town';
      await saveUser(userId, u);
      return res.json(reply('제단을 떠났다.', ['탐사', '마을']));
    }

    // ========== 전투 ==========
    if (u.phase === 'battle') {
      const c = calcStats(u);
      const m = u.monster;
      const act = u.nextAction;
      const job = JOBS[u.job];

      // 도망
      if (msg === '도망') {
        u.phase = 'town';
        u.madness = clamp((u.madness || 0) + 5, 0, 100);
        await saveUser(userId, u);
        return res.json(reply('도망쳤다...\n🌀 광기+5', ['마을']));
      }

      // 물약
      if (msg === '물약') {
        if ((u.potions || 0) <= 0) return res.json(reply('물약이 없습니다!', ['공격', '회피', '해석', '방어', '스킬']));
        u.potions--;
        const heal = Math.floor(c.maxHp * 0.4);
        u.hp = Math.min(c.maxHp, (u.hp || 0) + heal);
        await saveUser(userId, u);
        return res.json(reply(`🧪 HP +${heal} (${u.hp}/${c.maxHp})\n\n📢 ${act.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
      }

      if (msg === '고급물약') {
        if ((u.hiPotions || 0) <= 0) return res.json(reply('고급물약이 없습니다!', ['공격', '회피', '해석', '방어', '스킬']));
        u.hiPotions--;
        u.hp = c.maxHp;
        await saveUser(userId, u);
        return res.json(reply(`💊 HP 전회복! (${u.hp}/${c.maxHp})\n\n📢 ${act.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
      }

      let playerDmg = 0, enemyDmg = 0, log = [];
      let critHit = false, dodged = false, interpreted = false;

      // 공격
      if (msg === '공격') {
        playerDmg = Math.max(1, c.atk - m.def * 0.3);
        const critChance = c.critRate + (u.critBoost || 0);
        if (Math.random() * 100 < critChance) { playerDmg *= 2; critHit = true; }
        playerDmg = Math.floor(playerDmg);
        m.hp -= playerDmg;
        log.push(`⚔️ ${playerDmg}${critHit ? '💥크리!' : ''}`);
        u.critBoost = 0;
      }

      // 회피
      if (msg === '회피') {
        const dodgeChance = c.evasion + (act.type === 'heavy' ? 15 : 0);
        if (Math.random() * 100 < dodgeChance) {
          dodged = true;
          log.push('💨 회피 성공!');
          if (u.job === 'hunter') u.critBoost = (u.critBoost || 0) + 35;
        } else {
          log.push('회피 실패...');
        }
      }

      // 해석
      if (msg === '해석') {
        const interpChance = c.interpret + (u.interpretBonus || 0);
        if (Math.random() * 100 < interpChance) {
          interpreted = true;
          u.critBoost = 100;
          log.push('👁 해석 성공! 다음 크리 확정');
          if (u.job === 'shaman') u.shamanDR = 25;
        } else {
          log.push('해석 실패...');
        }
      }

      // 방어
      if (msg === '방어') {
        u.isDefending = true;
        log.push('🛡️ 방어 태세!');
        if (u.job === 'ironblood' && Math.random() < 0.5) {
          const counter = Math.floor(c.atk * 0.5);
          m.hp -= counter;
          log.push(`반격! ${counter}`);
        }
      }

      // 스킬
      if (msg === '스킬') {
        if ((u.skillCd || 0) > 0) return res.json(reply(`스킬 쿨타임: ${u.skillCd}턴`, ['공격', '회피', '해석', '방어', '물약']));
        if ((u.focus || 0) < job.skill.cost) return res.json(reply(`집중력 부족! (${job.skill.cost} 필요)`, ['공격', '회피', '해석', '방어', '물약']));
        
        u.focus -= job.skill.cost;
        u.skillCd = job.skill.cd;
        
        switch (u.job) {
          case 'wanderer':
            playerDmg = Math.floor(c.atk * 1.8);
            m.hp -= playerDmg;
            log.push(`⚔️ 결단의 일격! ${playerDmg}`);
            break;
          case 'hunter':
            playerDmg = Math.floor(c.atk * 1.6);
            if (Math.random() < 0.7 + c.critRate / 100) { playerDmg *= 2; critHit = true; }
            m.hp -= playerDmg;
            log.push(`🏹 약점 저격! ${playerDmg}${critHit ? '💥' : ''}`);
            break;
          case 'heretic':
            u.madness = clamp((u.madness || 0) + 18, 0, 100);
            u.interpretBonus = (u.interpretBonus || 0) + 30;
            log.push('🌀 금기 주문! 드랍↑ 광기+18');
            break;
          case 'shaman':
            playerDmg = Math.floor(c.atk * 1.4);
            const lifesteal = Math.floor(playerDmg * 0.2);
            m.hp -= playerDmg;
            u.hp = Math.min(c.maxHp, (u.hp || 0) + lifesteal);
            log.push(`👁 혼의 갈고리! ${playerDmg} +❤️${lifesteal}`);
            break;
          case 'ironblood':
            u.ironDRTurns = 3;
            log.push('🛡️ 철의 포효! 3턴 피해-40%');
            break;
          case 'scribe':
            if (Math.random() < 0.6) {
              log.push('📖 문장 왜곡! 적 행동 무효!');
              u.nextAction = { type: 'nullified', mult: 0, text: '(무효됨)', hint: '' };
            } else {
              log.push('📖 문장 왜곡 실패...');
            }
            break;
        }
      }

      // 유물 재생
      const relic = u.equipment?.relic;
      if (relic?.special?.name === '재생') {
        const regen = Math.floor(c.maxHp * 0.04);
        u.hp = Math.min(c.maxHp, (u.hp || 0) + regen);
        log.push(`★재생 +${regen}`);
      }

// ============================================
// Part 8: 전투 결과 처리 + 핸들러 종료
// ============================================

      // 적 처치
      if (m.hp <= 0) {
        u.phase = 'town';
        u.exp = (u.exp || 0) + m.exp;
        u.gold = (u.gold || 0) + m.gold;
        
        let dropBonus = (u.madnessOpen && (u.madness || 0) >= 50) ? 0.6 : 0;
        if (u.job === 'heretic' && (u.madness || 0) >= 50) dropBonus += 0.6;
        
        const item = generateItem(m.grade, u.floor || 1, u.madnessOpen);
        let victoryText = `🎉 ${getLine(BATTLE_LINES, 'victory')}\n━━━━━━━━━━━━━━━\n`;
        victoryText += `${log.join('\n')}\n\n`;
        victoryText += `+${m.exp} EXP | +${m.gold}G\n`;
        
        if (item) {
          u.inventory = [...(u.inventory || []), item];
          victoryText += `\n${getLine(BATTLE_LINES, 'itemDrop')}\n${getItemDisplay(item)}`;
        }
        
        // 레벨업
        const req = getReqExp(u.lv || 1);
        if ((u.exp || 0) >= req) {
          u.lv = (u.lv || 1) + 1;
          u.exp -= req;
          u.statPoints = (u.statPoints || 0) + 3;
          const newC = calcStats(u);
          u.hp = newC.maxHp;
          u.maxHp = newC.maxHp;
          u.focus = u.maxFocus || 100;
          victoryText += `\n\n⭐ LEVEL UP! Lv.${u.lv}\n${getLine(BATTLE_LINES, 'levelUp')}\n+3 스탯 포인트!`;
        }
        
        // 보스 처치 → 층 상승
        if (m.isBoss && !m.isHidden) {
          u.floor = (u.floor || 1) + 1;
          if (u.floor > (u.maxFloor || 1)) u.maxFloor = u.floor;
          victoryText += `\n\n🏔️ ${u.floor}층 도달!`;
        } else if (!m.isBoss) {
          // 일반 몬스터도 층 상승 (보스층 제외)
          if (!BOSSES[u.floor]) {
            u.floor = (u.floor || 1) + 1;
            if (u.floor > (u.maxFloor || 1)) u.maxFloor = u.floor;
          }
        }
        
        u.skillCd = Math.max(0, (u.skillCd || 0) - 1);
        u.ironDRTurns = 0;
        u.shamanDR = 0;
        u.critBoost = 0;
        u.interpretBonus = 0;
        u.madnessOpen = false;
        
        await saveUser(userId, u);
        return res.json(reply(victoryText, ['전투', '탐사', '장비', '마을']));
      }

      // 적 턴
      if (!dodged && act.type !== 'nullified') {
        if (act.type === 'heal') {
          const heal = Math.floor(m.maxHp * act.mult);
          m.hp = Math.min(m.maxHp, m.hp + heal);
          log.push(`👹 회복 +${heal}`);
        } else if (act.type === 'buff') {
          log.push('👹 힘을 모았다! 다음 공격 강화');
        } else {
          enemyDmg = Math.floor(m.atk * act.mult);
          
          // 방어 감소
          if (u.isDefending) enemyDmg = Math.floor(enemyDmg * 0.5);
          if ((u.ironDRTurns || 0) > 0) enemyDmg = Math.floor(enemyDmg * 0.6);
          if ((u.shamanDR || 0) > 0) enemyDmg = Math.floor(enemyDmg * 0.75);
          
          // 회피 체크 (정령 타입)
          if (Math.random() * 100 < c.evasion * 0.3) {
            log.push('💨 부분 회피!');
            enemyDmg = Math.floor(enemyDmg * 0.5);
          }
          
          u.hp = (u.hp || c.maxHp) - enemyDmg;
          log.push(`👹 ${act.text} -${enemyDmg}`);
          
          // 가시 반사
          if (u.equipment?.armor?.proc?.id === 'thorns') {
            const reflect = Math.floor(enemyDmg * 0.3);
            m.hp -= reflect;
            log.push(`🌹 가시 반사 ${reflect}`);
          }
        }
      }
      
      u.isDefending = false;
      u.shamanDR = 0;
      if ((u.ironDRTurns || 0) > 0) u.ironDRTurns--;
      if ((u.skillCd || 0) > 0) u.skillCd--;

      // 플레이어 사망
      if ((u.hp || 0) <= 0) {
        // 불멸 체크
        if (relic?.special?.name === '불멸' && !u.revived && Math.random() < 0.6) {
          u.hp = Math.floor(c.maxHp * 0.3);
          u.revived = true;
          log.push('★불멸! 부활!');
        } else {
          u.phase = 'town';
          u.hp = Math.floor(c.maxHp * 0.3);
          const lostGold = Math.floor((u.gold || 0) * 0.1);
          u.gold = (u.gold || 0) - lostGold;
          u.madness = clamp((u.madness || 0) + 15, 0, 100);
          
          await saveUser(userId, u);
          return res.json(reply(
            `💀 ${getLine(BATTLE_LINES, 'death')}\n━━━━━━━━━━━━━━━\n` +
            `${log.join('\n')}\n\n-${lostGold}G | 🌀+15`,
            ['마을']
          ));
        }
      }

      // 다음 턴
      const nextAction = getEnemyAction(m);
      u.monster = m;
      u.nextAction = nextAction;
      u.battleTurn = (u.battleTurn || 1) + 1;
      
      await saveUser(userId, u);
      
      let battleText = `━━ ${u.battleTurn}턴 ━━\n`;
      battleText += `${log.join('\n')}\n\n`;
      battleText += `👹 ${m.name}: ${m.hp}/${m.maxHp}\n`;
      battleText += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n\n`;
      battleText += `📢 ${nextAction.text}\n└ ${nextAction.hint}`;
      
      if ((u.skillCd || 0) > 0) battleText += `\n\n⏳ 스킬 쿨: ${u.skillCd}턴`;
      
      return res.json(reply(battleText, ['공격', '회피', '해석', '방어', '스킬', '물약']));
    }

    // ========== 기본 응답 ==========
    return res.json(reply('알 수 없는 명령어입니다.\n\n@에테르 - 명령어 보기', ['마을', '@에테르']));

  } catch (err) {
    console.error('Error:', err);
    return res.json(reply('오류가 발생했습니다.', ['마을', '시작']));
  }
};

