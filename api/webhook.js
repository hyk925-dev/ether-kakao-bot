const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ============================================
// 대장장이 대사 시스템
// ============================================
const BLACKSMITH_LINES = {
  success: [
    "허허, 이 정도 실력이면 뭐...",
    "오, 제법인데? 운이 좋군.",
    "흠, 나쁘지 않아. 계속 해볼 텐가?",
    "이 정도면 쓸만하겠어.",
    "좋았어! 빛이 나는군!"
  ],
  fail: [
    "쯧, 운명의 장난인가...",
    "이런... 다음엔 될 거야.",
    "에휴, 재료가 아까워.",
    "운이 없군. 다시 해볼 텐가?",
    "망했어... 아, 장비 말고 강화가."
  ],
  destroy: [
    "이런... 미안하군...",
    "아아... 눈 뜨고 못 보겠네.",
    "...다음엔 더 조심하지.",
    "장비가... 가루가 됐어...",
    "미안... 내 실력이 부족했나..."
  ],
  maintain: [
    "쓸데없이 튼튼하기만 하군.",
    "강화는 실패했지만 장비는 멀쩡해.",
    "운이 나쁘진 않았어. 장비는 살았으니.",
    "휴, 다행히 부서지진 않았네.",
    "괜찮아, 아직 기회는 있어."
  ],
  greet: [
    "어서 와. 뭘 강화할 건가?",
    "오, 손님이군. 장비 좀 보자.",
    "강화? 좋지, 뭘 가져왔나?",
    "내 모루가 기다리고 있었다네."
  ],
  maxEnhance: [
    "이미 완벽해! 더 이상은 무리야.",
    "이 이상은 신의 영역이지...",
    "+10이면 충분하지 않나?",
    "욕심도 많군. 이게 최고야."
  ]
};

const getRandomLine = (type) => {
  const lines = BLACKSMITH_LINES[type];
  return lines[Math.floor(Math.random() * lines.length)];
};

// ============================================
// 전투 대사 시스템
// ============================================
const BATTLE_LINES = {
  bossAppear: [
    "강한 기운이 느껴진다...",
    "조심해! 보스다!",
    "이 층의 주인이 나타났다!"
  ],
  victory: [
    "승리다!",
    "해냈어!",
    "적을 쓰러뜨렸다!"
  ],
  levelUp: [
    "몸에 힘이 솟는다!",
    "더 강해진 느낌이야!",
    "새로운 경지에 도달했다!"
  ],
  death: [
    "이런... 여기서 쓰러지다니...",
    "아직... 갈 길이 먼데...",
    "다음엔... 반드시..."
  ],
  itemDrop: [
    "뭔가 떨어졌다!",
    "전리품을 발견했다!",
    "빛나는 무언가가 보인다!"
  ]
};

const getBattleLine = (type) => {
  const lines = BATTLE_LINES[type];
  return lines[Math.floor(Math.random() * lines.length)];
};

// ============================================
// 직업 시스템 (6개 + 패시브 + 스킬)
// ============================================
const JOBS = {
  wanderer: { 
    name: '방랑자', icon: '⚔️', 
    desc: 'HP 40% 이하 공격력 +25%',
    base: { str: 3, dex: 2, int: 2, wil: 2, vit: 3, luk: 2 },
    skill: { name: '결단의 일격', cost: 25, cd: 3, desc: '1.8배, 적 HP<30%시 추가 1.5배' }
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
    skill: { name: '철의 포효', cost: 30, cd: 4, desc: '3턴 피해-40%, 가시 30%' }
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
  { name: '해골병사', type: 'undead', hp: 55, atk: 12, def: 5, exp: 25, minFloor: 6 },
  { name: '불의정령', type: 'spirit', hp: 50, atk: 32, def: 4, exp: 50, minFloor: 11 },
  { name: '임프', type: 'demon', hp: 65, atk: 28, def: 8, exp: 55, minFloor: 14 },
  { name: '비룡', type: 'dragon', hp: 180, atk: 60, def: 25, exp: 200, minFloor: 30 }
];

const BOSSES = {
  5: { name: '광폭 늑대왕', type: 'beast', hp: 280, atk: 45, def: 12, exp: 200, gold: 150 },
  10: { name: '해골 군주', type: 'undead', hp: 500, atk: 55, def: 18, exp: 450, gold: 300 },
  20: { name: '악마 공작', type: 'demon', hp: 700, atk: 80, def: 25, exp: 900, gold: 600 },
  50: { name: '흑룡', type: 'dragon', hp: 2500, atk: 150, def: 50, exp: 4000, gold: 2500 }
};

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
  accessory: { name: '장신구', types: ['반지', '목걸이', '귀걸이'], mainStat: 'evasion', base: 3 }
};

const ITEM_PROCS = [
  { id: 'bleed', name: '출혈', slot: 'weapon', desc: '3턴 5% DoT' },
  { id: 'lifesteal', name: '흡혈', slot: 'weapon', desc: '피해 8% 회복' },
  { id: 'critical', name: '필살', slot: 'weapon', desc: '크리티컬 +8%' },
  { id: 'barrier', name: '장막', slot: 'armor', desc: '30% 확률 보호막' },
  { id: 'thorns', name: '가시', slot: 'armor', desc: '피해 30% 반사' },
  { id: 'vitality', name: '활력', slot: 'armor', desc: 'HP +15%' },
  { id: 'lucky', name: '행운', slot: 'accessory', desc: '골드 +20%' },
  { id: 'insight', name: '통찰', slot: 'accessory', desc: '해석 +5%' }
];

// ============================================
// 강화 시스템
// ============================================
const ENHANCE_RATES = {
  1: 95, 2: 90, 3: 80, 4: 70, 5: 55,
  6: 40, 7: 30, 8: 20, 9: 12, 10: 7
};
const DESTROY_RATES = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 10,
  6: 15, 7: 25, 8: 35, 9: 45, 10: 50
};
const ENHANCE_COST = (lv) => Math.floor(80 + lv * 50 + Math.pow(lv, 2) * 15);
const ENHANCE_BONUS = 0.15; // 강화 1당 15% 스탯 증가

// ============================================
// 유틸리티 함수
// ============================================
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const getReqExp = (lv) => Math.floor(50 + lv * 30 + Math.pow(lv, 1.5) * 10);

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
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getTopUsers(field, limit = 10) {
  const snapshot = await db.collection('users')
    .where('phase', '==', 'town')
    .orderBy(field, 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc, i) => ({ rank: i + 1, ...doc.data() }));
}

// ============================================
// 스탯 계산
// ============================================
function calcStats(p) {
  const s = p.stats;
  const job = JOBS[p.job];
  
  let atk = 10 + s.str * 2.5 + s.dex * 0.5;
  let def = 5 + s.wil * 1.3 + s.vit * 1.6;
  let maxHp = 100 + s.vit * 16 + s.wil * 7 + s.str * 3;
  let evasion = 5 + s.dex * 0.8 + s.luk * 0.3;
  let critRate = 5 + s.dex * 0.6 + s.luk * 0.4;
  let interpret = 10 + s.int * 2.5 + s.wil * 0.5;
  
  if (job?.id === 'scribe') interpret += 12;
  
  ['weapon', 'armor', 'accessory'].forEach(slot => {
    const item = p.equipment?.[slot];
    if (!item) return;
    const enhMult = 1 + (item.enhance || 0) * ENHANCE_BONUS;
    atk += Math.floor((item.stats?.atk || 0) * enhMult);
    def += Math.floor((item.stats?.def || 0) * enhMult);
    maxHp += Math.floor((item.stats?.maxHp || 0) * enhMult);
    evasion += Math.floor((item.stats?.evasion || 0) * enhMult);
    critRate += Math.floor((item.stats?.critRate || 0) * enhMult);
    interpret += Math.floor((item.stats?.interpret || 0) * enhMult);
    
    // Proc 보너스
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
  return Math.floor(c.atk * 2 + c.def * 1.5 + c.maxHp * 0.1 + c.critRate * 3 + c.interpret * 2 + p.lv * 10);
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

function spawnMonster(floor) {
  if (BOSSES[floor]) {
    const boss = BOSSES[floor];
    const t = MONSTER_TYPES[boss.type];
    return {
      name: `⭐${boss.name}⭐`,
      type: boss.type, typeName: t.name,
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
function generateItem(monsterGrade, floor, madnessOpen = false) {
  const baseChance = 0.35 + (madnessOpen ? 0.20 : 0);
  if (Math.random() > baseChance) return null;
  
  let grade = 1;
  const roll = Math.random() * 100;
  if (roll < 2) grade = 5;
  else if (roll < 8) grade = 4;
  else if (roll < 20) grade = 3;
  else if (roll < 45) grade = 2;
  grade = clamp(grade, 1, monsterGrade + 1);
  if (madnessOpen && Math.random() < 0.4) grade = Math.min(5, grade + 1);
  
  const gd = ITEM_GRADES[grade];
  const slots = Object.keys(ITEM_TYPES);
  const slotKey = slots[Math.floor(Math.random() * slots.length)];
  const slot = ITEM_TYPES[slotKey];
  const itemType = slot.types[Math.floor(Math.random() * slot.types.length)];
  
  const mainVal = Math.floor(slot.base * gd.mult);
  let stats = { atk: 0, def: 0, maxHp: 0, evasion: 0, critRate: 0, interpret: 0 };
  
  if (slot.mainStat === 'evasion') stats.evasion = mainVal;
  else stats[slot.mainStat] = mainVal;
  
  if (grade >= 2 && Math.random() < 0.6) stats.critRate += Math.floor(grade * 1.2);
  if (grade >= 3 && Math.random() < 0.5) stats.interpret += Math.floor(grade * 1.5);
  if (grade >= 4 && Math.random() < 0.4) stats.maxHp += Math.floor(grade * 12);
  
  let proc = null;
  const procs = ITEM_PROCS.filter(p => p.slot === slotKey);
  if (procs.length && Math.random() < 0.06 + grade * 0.06) {
    proc = procs[Math.floor(Math.random() * procs.length)];
  }
  
  return {
    id: Date.now() + Math.random(),
    name: `${gd.prefix} ${itemType}${proc ? ` [${proc.name}]` : ''}`,
    slot: slotKey, slotName: slot.name,
    grade, gradeName: gd.name, gradeColor: gd.color,
    stats, proc, enhance: 0
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
  return st.join(' ') || '효과 없음';
}

function getItemDisplay(item) {
  const enh = item.enhance > 0 ? `+${item.enhance} ` : '';
  const color = item.gradeColor || '';
  return `${color}${enh}${item.name}`;
}

// ============================================
// 적 행동 결정
// ============================================
function getEnemyAction(enemy) {
  const r = Math.random() * 100;
  if (enemy.isBoss) {
    if (r < 15) return { type: 'special', mult: 2.5, text: '⚠️ 필살기 준비!', hint: '회피/방어 필수!' };
    if (r < 45) return { type: 'heavy', mult: 1.8, text: '⚠️ 강공격 준비', hint: '해석하면 크리 확정' };
    if (r < 75) return { type: 'attack', mult: 1.2, text: '공격 준비', hint: '일반 공격' };
    return { type: 'buff', mult: 2.0, text: '힘을 모으는 중...', hint: '다음 공격 강화' };
  }
  if (r < 50) return { type: 'attack', mult: 1.0, text: '공격 준비', hint: '일반 공격' };
  if (r < 80) return { type: 'heavy', mult: 1.6, text: '⚠️ 강공격!', hint: '해석/회피 추천' };
  return { type: 'heal', mult: 0.15, text: '회복 중...', hint: '지금 공격!' };
}

// ============================================
// PvP 결투 시뮬레이션
// ============================================
function simulateDuel(p1, p2) {
  const s1 = calcStats(p1);
  const s2 = calcStats(p2);
  
  let hp1 = s1.maxHp, hp2 = s2.maxHp;
  let log = [];
  let turn = 0;
  
  while (hp1 > 0 && hp2 > 0 && turn < 20) {
    turn++;
    
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
  
  return {
    winner,
    hp1: Math.max(0, hp1),
    hp2: Math.max(0, hp2),
    turns: turn,
    log: log.slice(-6)
  };
}

// ============================================
// 응답 포맷 (확장)
// ============================================
function reply(text, buttons = []) {
  const response = {
    version: '2.0',
    template: { outputs: [{ simpleText: { text } }] }
  };
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.map(b => ({
      label: b, action: 'message', messageText: b
    }));
  }
  return response;
}

// 다중 출력 (텍스트 + 텍스트)
function replyMulti(texts, buttons = []) {
  const response = {
    version: '2.0',
    template: { 
      outputs: texts.map(t => ({ simpleText: { text: t } }))
    }
  };
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.map(b => ({
      label: b, action: 'message', messageText: b
    }));
  }
  return response;
}

// BasicCard (이미지 + 버튼)
function replyCard(title, description, buttons = [], quickReplies = [], imageUrl = null) {
  const card = {
    title,
    description
  };
  
  if (imageUrl) {
    card.thumbnail = { imageUrl };
  }
  
  if (buttons.length > 0) {
    card.buttons = buttons.map(b => ({
      label: b.label,
      action: 'message',
      messageText: b.text || b.label
    }));
  }
  
  const response = {
    version: '2.0',
    template: { 
      outputs: [{ basicCard: card }]
    }
  };
  
  if (quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({
      label: b, action: 'message', messageText: b
    }));
  }
  
  return response;
}

// 텍스트 + 카드 조합
function replyTextAndCard(text, title, description, cardButtons = [], quickReplies = []) {
  const response = {
    version: '2.0',
    template: { 
      outputs: [
        { simpleText: { text } },
        { 
          basicCard: {
            title,
            description,
            buttons: cardButtons.map(b => ({
              label: b.label,
              action: 'message',
              messageText: b.text || b.label
            }))
          }
        }
      ]
    }
  };
  
  if (quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({
      label: b, action: 'message', messageText: b
    }));
  }
  
  return response;
}

// ============================================
// 메인 핸들러
// ============================================
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.json({ message: 'ETHER v2.3 OK' });

  try {
    const userId = req.body?.userRequest?.user?.id;
    const msg = req.body?.userRequest?.utterance?.trim() || '';
    if (!userId) return res.json(reply('오류 발생', ['시작']));

    let u = await getUser(userId);

    // ==================== 소셜 커맨드 ====================
    
    if (msg === '@랭킹' || msg === '랭킹') {
      const floorRank = await getTopUsers('floor', 10);
      let text = '🏆 에테르의 탑 랭킹\n\n';
      text += '━━ 🏔️ 층수 TOP 10 ━━\n';
      floorRank.forEach(u => {
        const job = JOBS[u.job];
        text += `${u.rank}. ${job?.icon || ''}${u.name} Lv.${u.lv} (${u.floor}층)\n`;
      });
      return res.json(reply(text, u ? ['전투', '상태', '@자랑'] : ['시작']));
    }
    
    if (msg === '@전투력' || msg === '전투력랭킹') {
      const snapshot = await db.collection('users').where('phase', '==', 'town').get();
      const users = snapshot.docs.map(doc => ({ ...doc.data() }));
      users.forEach(u => u.power = calcPower(u));
      users.sort((a, b) => b.power - a.power);
      
      let text = '🏆 전투력 랭킹\n\n';
      users.slice(0, 10).forEach((u, i) => {
        const job = JOBS[u.job];
        text += `${i + 1}. ${job?.icon || ''}${u.name} - ${u.power}⚔️\n`;
      });
      return res.json(reply(text, u ? ['전투', '상태', '@자랑'] : ['시작']));
    }

    // ==================== 도움말 시스템 ====================
    if (msg === '도움말' || msg === '?') {
      return res.json(reply(
        `📚 에테르의 탑 도움말\n\n어떤 도움이 필요하신가요?`,
        ['전투도움말', '장비도움말', '직업도움말', '스탯도움말', '명령어목록', '돌아가기']
      ));
    }
    
    if (msg === '전투도움말') {
      return res.json(reply(
        `⚔️ 전투 시스템\n\n` +
        `📢 전조(힌트)를 읽고 행동 선택!\n\n` +
        `🗡️ 공격 - 기본 데미지\n` +
        `💨 회피 - 피해 무효 (성공시)\n` +
        `👁 해석 - 성공시 크리 확정!\n` +
        `🛡️ 방어 - 피해 50% 감소\n` +
        `✨ 스킬 - 직업 고유 능력\n` +
        `🧪 물약 - HP 회복`,
        ['도움말', '돌아가기']
      ));
    }
    
    if (msg === '장비도움말') {
      return res.json(reply(
        `🎒 장비 시스템\n\n` +
        `⭐ 등급: 일반→고급→희귀→영웅→전설\n\n` +
        `🔨 강화 (+10까지)\n` +
        `• 강화당 스탯 +15%\n` +
        `• +5부터 파괴 확률 있음!\n` +
        `• +7이상 파괴 확률 25%+\n\n` +
        `💎 특수효과 (Proc)\n` +
        `무기: 출혈, 흡혈, 필살\n` +
        `방어구: 장막, 가시, 활력\n` +
        `장신구: 행운, 통찰`,
        ['도움말', '돌아가기']
      ));
    }
    
    if (msg === '직업도움말') {
      let text = `📜 직업 안내\n\n`;
      Object.entries(JOBS).forEach(([id, j]) => {
        text += `${j.icon} ${j.name}\n└ ${j.desc}\n└ 스킬: ${j.skill.name}\n\n`;
      });
      return res.json(reply(text, ['도움말', '돌아가기']));
    }
    
    if (msg === '스탯도움말') {
      return res.json(reply(
        `📊 스탯 설명\n\n` +
        `💪 STR - 공격력, HP\n` +
        `🏃 DEX - 회피, 크리티컬\n` +
        `📖 INT - 해석력\n` +
        `🧠 WIL - 방어, 해석, HP\n` +
        `❤️ VIT - HP, 방어\n` +
        `🍀 LUK - 크리, 회피\n\n` +
        `🌀 광기 - 드랍률 영향\n` +
        `⚡ Focus - 스킬 자원`,
        ['도움말', '돌아가기']
      ));
    }
    
    if (msg === '명령어목록') {
      return res.json(reply(
        `📋 명령어 목록\n\n` +
        `기본: 전투, 상태, 장비, 상점, 휴식\n` +
        `장비: 장착1~5, 판매1~5, 강화\n` +
        `소셜: 랭킹, @자랑, @결투\n` +
        `기타: 저장, 초기화, 도움말`,
        ['도움말', '돌아가기']
      ));
    }

    // ==================== 신규 유저 ====================
    if (!u) {
      if (msg === '시작') {
        await saveUser(userId, { phase: 'naming' });
        return res.json(reply('🌫️ 회색 안개 속에서 눈을 떴다...\n\n당신의 이름은?'));
      }
      return res.json(reply('🏔️ 에테르의 탑\n\n[시작]을 눌러 게임을 시작하세요.', ['시작', '랭킹', '도움말']));
    }

    // ==================== @자랑 ====================
    if (msg === '@자랑' || msg === '자랑') {
      const c = calcStats(u);
      const job = JOBS[u.job];
      const power = calcPower(u);
      
      let text = `📜 ${u.name}의 모험 기록\n`;
      text += `━━━━━━━━━━━━━━━\n`;
      text += `${job?.icon || ''} ${job?.name || '무직'} Lv.${u.lv}\n`;
      text += `🏔️ ${u.maxFloor}층 도달 | ⚔️ ${power}\n\n`;
      text += `❤️${c.maxHp} ⚔️${c.atk} 🛡️${c.def}\n`;
      text += `💨${c.evasion}% 💥${c.critRate}% 👁${c.interpret}%\n\n`;
      
      ['weapon', 'armor', 'accessory'].forEach(slot => {
        const item = u.equipment?.[slot];
        if (item) text += `${getItemDisplay(item)}\n`;
      });
      
      return res.json(reply(text, ['전투', '랭킹', '@결투']));
    }
    
    // ==================== @결투 ====================
    if (msg.startsWith('@결투 ') || msg.startsWith('결투 ')) {
      const targetName = msg.replace('@결투 ', '').replace('결투 ', '').trim();
      
      if (!targetName) return res.json(reply('결투할 상대의 이름을 입력하세요.\n예: @결투 홍길동', ['돌아가기']));
      if (targetName === u.name) return res.json(reply('자기 자신과는 결투할 수 없습니다!', ['돌아가기']));
      
      const target = await getUserByName(targetName);
      if (!target) return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['돌아가기']));
      
      const duelCost = 50;
      if (u.gold < duelCost) return res.json(reply(`골드 부족 (${duelCost}G 필요)`, ['돌아가기']));
      
      u.gold -= duelCost;
      const result = simulateDuel(u, target);
      const isWinner = result.winner.name === u.name;
      
      const reward = Math.floor(50 + target.lv * 10);
      if (isWinner) {
        u.gold += reward;
        u.duelWins = (u.duelWins || 0) + 1;
      } else {
        u.duelLosses = (u.duelLosses || 0) + 1;
      }
      
      await saveUser(userId, u);
      
      let text = `⚔️ ${u.name} vs ${target.name}\n━━━━━━━━━━━━━━━\n`;
      result.log.forEach(l => text += `${l}\n`);
      text += `━━━━━━━━━━━━━━━\n`;
      text += isWinner ? `🎉 승리! +${reward}G` : `💀 패배...`;
      text += `\n전적: ${u.duelWins || 0}승 ${u.duelLosses || 0}패`;
      
      return res.json(reply(text, ['전투', '상태', '@결투', '랭킹']));
    }
    
    if (msg === '@결투') {
      return res.json(reply('결투할 상대의 이름을 입력하세요.\n예: @결투 홍길동\n\n비용: 50G', ['돌아가기']));
    }

    // ==================== 이름 입력 ====================
    if (u.phase === 'naming') {
      if (msg.length < 1 || msg.length > 8) {
        return res.json(reply('이름은 1~8자로 입력해주세요.'));
      }
      
      const existing = await getUserByName(msg);
      if (existing) {
        return res.json(reply('이미 사용 중인 이름입니다.'));
      }
      
      await saveUser(userId, { ...u, phase: 'job', name: msg });
      
      let jobList = '직업을 선택하세요:\n\n';
      Object.entries(JOBS).forEach(([id, j]) => {
        jobList += `${j.icon} ${j.name}\n└ ${j.desc}\n\n`;
      });
      
      return res.json(reply(`${msg}... 기억해두마.\n\n${jobList}`, 
        Object.values(JOBS).map(j => j.name)));
    }

    // ==================== 직업 선택 ====================
    if (u.phase === 'job') {
      const jobEntry = Object.entries(JOBS).find(([k, v]) => v.name === msg);
      if (!jobEntry) {
        return res.json(reply('직업을 선택해주세요.', Object.values(JOBS).map(j => j.name)));
      }
      
      const [jobId, job] = jobEntry;
      const stats = { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
      Object.keys(job.base).forEach(k => stats[k] += job.base[k]);
      
      const c = calcStats({ stats, job: jobId, equipment: {} });
      
      await saveUser(userId, {
        phase: 'town', name: u.name, job: jobId,
        lv: 1, exp: 0, gold: 200, floor: 1, maxFloor: 1,
        stats, hp: c.maxHp, maxHp: c.maxHp,
        focus: 60, maxFocus: 100, madness: 0,
        equipment: { weapon: null, armor: null, accessory: null },
        inventory: [], skillCd: 0, potions: 3, hiPotions: 1,
        duelWins: 0, duelLosses: 0,
        createdAt: new Date().toISOString()
      });
      
      return res.json(replyMulti([
        `${job.icon} ${job.name} 각성!`,
        `❤️ HP: ${c.maxHp}\n⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}\n👁 해석: ${c.interpret}%\n\n✨ 스킬: ${job.skill.name}\n└ ${job.skill.desc}\n\n💰 200G | 🧪 물약 3개\n\n[전투]로 탑을 오르세요!`
      ], ['전투', '상태', '장비', '상점', '도움말']));
    }

    // ==================== 초기화 확인 ====================
    if (u.phase === 'confirm_reset') {
      if (msg === '초기화확인') {
        const oldName = u.name;
        await deleteUser(userId);
        return res.json(reply(`💀 ${oldName}의 기록이 삭제되었습니다.`, ['시작']));
      }
      if (msg === '취소') {
        await saveUser(userId, { ...u, phase: 'town' });
        return res.json(reply('초기화가 취소되었습니다.', ['전투', '상태', '장비', '상점', '휴식']));
      }
      return res.json(reply(
        `⚠️ 정말 초기화하시겠습니까?\n\n모든 진행 상황이 삭제됩니다!`,
        ['초기화확인', '취소']
      ));
    }

    // ==================== 마을 ====================
    if (u.phase === 'town') {
      const c = calcStats(u);
      const job = JOBS[u.job];
      const isBoss = BOSSES[u.floor] !== undefined;
      
      // 초기화
      if (msg === '초기화') {
        await saveUser(userId, { ...u, phase: 'confirm_reset' });
        return res.json(reply(
          `⚠️ 캐릭터 초기화\n\n${u.name} Lv.${u.lv}\n🏔️ ${u.maxFloor}층 | 💰 ${u.gold}G\n\n정말 삭제하시겠습니까?`,
          ['초기화확인', '취소']
        ));
      }
      
      // 저장
      if (msg === '저장') {
        const power = calcPower(u);
        return res.json(reply(
          `💾 자동 저장 중!\n\n${job.icon} ${u.name} Lv.${u.lv}\n⚔️ ${power} | 🏔️ ${u.maxFloor}층\n💰 ${u.gold}G`,
          ['전투', '상태', '장비', '상점', '휴식']
        ));
      }
      
      // 전투 시작
      if (msg === '전투' || msg === '광기전투') {
        const madnessOpen = msg === '광기전투';
        const monster = spawnMonster(u.floor);
        const action = getEnemyAction(monster);
        
        await saveUser(userId, {
          ...u, phase: 'battle', monster, nextAction: action,
          battleTurn: 1, madnessOpen, interpretBonus: 0,
          isDefending: false, critBoost: 0, bleedTurns: 0,
          shamanDR: 0, ironDRTurns: 0
        });
        
        if (monster.isBoss) {
          // 보스는 카드형으로
          return res.json(replyTextAndCard(
            `⭐ BOSS ⭐\n${getBattleLine('bossAppear')}`,
            monster.name,
            `[${monster.typeName}] 등급: ${GRADES[monster.grade].name}\n\n👹 HP: ${monster.hp}\n📢 ${action.text}`,
            [],
            ['공격', '회피', '해석', '방어', '스킬', '물약']
          ));
        }
        
        let battleText = madnessOpen ? '🌀 광기 개방!\n\n' : '';
        battleText += `${monster.name} 출현!\n`;
        battleText += `[${monster.typeName}] ${GRADES[monster.grade].name}\n\n`;
        battleText += `👹 ${monster.hp}/${monster.maxHp}\n`;
        battleText += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n\n`;
        battleText += `📢 ${action.text}\n└ ${action.hint}`;
        
        if (madnessOpen) {
          u.madness = clamp((u.madness || 0) + (monster.isBoss ? 20 : 14), 0, 100);
        }
        
        return res.json(reply(battleText, ['공격', '회피', '해석', '방어', '스킬', '물약']));
      }
      
      // 상태
      if (msg === '상태') {
        const req = getReqExp(u.lv);
        const power = calcPower(u);
        return res.json(reply(
          `📊 ${u.name} Lv.${u.lv}\n${job.icon} ${job.name}\n\n` +
          `⚔️ 전투력: ${power}\n` +
          `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}/${u.maxFocus}\n` +
          `🌀 광기: ${u.madness || 0}/100\n\n` +
          `⚔️${c.atk} 🛡️${c.def} 💨${c.evasion}%\n` +
          `💥${c.critRate}% 👁${c.interpret}%\n\n` +
          `📈 ${u.exp}/${req} | 💰 ${u.gold}G\n` +
          `🏔️ ${u.floor}층${isBoss ? ' ⭐보스' : ''} | 🧪 ${u.potions || 0}개`,
          ['전투', '장비', '상점', '휴식', '@자랑']
        ));
      }
      
      // 장비
      if (msg === '장비') {
        let text = `🎒 장착 장비\n\n`;
        ['weapon', 'armor', 'accessory'].forEach(slot => {
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
            text += `${i + 1}. ${getItemDisplay(item)}\n`;
          });
          if (inv.length > 5) text += `...외 ${inv.length - 5}개`;
        }
        
        const buttons = ['돌아가기'];
        if (inv.length > 0) buttons.unshift('장착1', '판매1');
        const hasEquip = Object.values(u.equipment || {}).some(e => e !== null);
        if (hasEquip) buttons.push('강화');
        
        return res.json(reply(text, buttons));
      }
      
      // 장착
      if (msg.startsWith('장착')) {
        const idx = parseInt(msg.replace('장착', '')) - 1;
        const inv = u.inventory || [];
        if (idx < 0 || idx >= inv.length) {
          return res.json(reply('잘못된 번호입니다.', ['장비', '돌아가기']));
        }
        
        const item = inv[idx];
        const oldItem = u.equipment[item.slot];
        
        u.equipment[item.slot] = item;
        u.inventory = inv.filter((_, i) => i !== idx);
        if (oldItem) u.inventory.push(oldItem);
        
        await saveUser(userId, u);
        return res.json(reply(`✅ ${getItemDisplay(item)} 장착!\n${getItemStatText(item)}`, ['장비', '돌아가기']));
      }
      
      // 판매
      if (msg.startsWith('판매')) {
        const idx = parseInt(msg.replace('판매', '')) - 1;
        const inv = u.inventory || [];
        if (idx < 0 || idx >= inv.length) {
          return res.json(reply('잘못된 번호입니다.', ['장비', '돌아가기']));
        }
        
        const item = inv[idx];
        const price = Math.floor((item.grade * 20 + 15) * (1 + (item.enhance || 0) * 0.5));
        u.inventory = inv.filter((_, i) => i !== idx);
        u.gold += price;
        
        await saveUser(userId, u);
        return res.json(reply(`💰 ${getItemDisplay(item)} 판매!\n+${price}G`, ['장비', '돌아가기']));
      }
      
      // ========== 강화 시스템 (카드형 UI) ==========
      if (msg === '강화') {
        const hasEquip = Object.values(u.equipment || {}).filter(e => e !== null);
        if (hasEquip.length === 0) {
          return res.json(reply('강화할 장비가 없습니다.', ['장비', '돌아가기']));
        }
        
        let desc = '';
        const cardButtons = [];
        
        ['weapon', 'armor', 'accessory'].forEach((slot, i) => {
          const item = u.equipment?.[slot];
          if (item) {
            const enh = item.enhance || 0;
            const cost = ENHANCE_COST(enh);
            const rate = ENHANCE_RATES[enh + 1] || 5;
            const destroy = DESTROY_RATES[enh + 1] || 0;
            desc += `${i + 1}. ${getItemDisplay(item)}\n`;
            desc += `   +${enh}→+${enh + 1} (${rate}%`;
            if (destroy > 0) desc += ` 💀${destroy}%`;
            desc += `) ${cost}G\n`;
            cardButtons.push({ label: `강화${i + 1}`, text: `강화${i + 1}` });
          }
        });
        
        cardButtons.push({ label: '그만두기', text: '돌아가기' });
        
        return res.json(replyTextAndCard(
          `🔨 대장장이: "${getRandomLine('greet')}"`,
          '⚒️ 강화',
          `${desc}\n💰 보유: ${u.gold}G`,
          cardButtons,
          ['전투', '상태', '장비', '상점']
        ));
      }
      
      if (msg.startsWith('강화')) {
        const idx = parseInt(msg.replace('강화', '')) - 1;
        const slots = ['weapon', 'armor', 'accessory'];
        
        if (idx < 0 || idx >= slots.length) {
          return res.json(reply('잘못된 번호입니다.', ['강화', '돌아가기']));
        }
        
        const slot = slots[idx];
        const item = u.equipment?.[slot];
        
        if (!item) {
          return res.json(reply('해당 슬롯에 장비가 없습니다.', ['강화', '돌아가기']));
        }
        
        const enh = item.enhance || 0;
        if (enh >= 10) {
          return res.json(replyTextAndCard(
            `🔨 대장장이: "${getRandomLine('maxEnhance')}"`,
            `${getItemDisplay(item)}`,
            `이미 최대 강화입니다! (+10)\n\n${getItemStatText(item)}`,
            [{ label: '돌아가기', text: '강화' }],
            ['전투', '상태', '장비', '상점']
          ));
        }
        
        const cost = ENHANCE_COST(enh);
        const rate = ENHANCE_RATES[enh + 1] || 5;
        const destroyRate = DESTROY_RATES[enh + 1] || 0;
        
        if (u.gold < cost) {
          return res.json(reply(`골드가 부족합니다. (${cost}G 필요)\n보유: ${u.gold}G`, ['강화', '돌아가기']));
        }
        
        u.gold -= cost;
        const success = Math.random() * 100 < rate;
        
        if (success) {
          item.enhance = enh + 1;
          await saveUser(userId, u);
          
          return res.json(replyTextAndCard(
            `🔨 대장장이: "${getRandomLine('success')}"`,
            `✨ +${enh} → +${enh + 1} 성공!`,
            `${getItemDisplay(item)}\n${getItemStatText(item)}\n\n-${cost}G | 💰 ${u.gold}G`,
            [
              { label: '계속 강화', text: '강화' },
              { label: '그만두기', text: '돌아가기' }
            ],
            ['전투', '상태', '장비', '상점']
          ));
        } else {
          const destroyed = Math.random() * 100 < destroyRate;
          
          if (destroyed) {
            const itemName = item.name;
            u.equipment[slot] = null;
            await saveUser(userId, u);
            
            return res.json(replyTextAndCard(
              `🔨 대장장이: "${getRandomLine('destroy')}"`,
              `💥 강화 실패 - 파괴!`,
              `${itemName}이(가) 사라졌습니다...\n\n-${cost}G | 💰 ${u.gold}G`,
              [{ label: '돌아가기', text: '장비' }],
              ['전투', '상태', '장비', '상점']
            ));
          } else {
            await saveUser(userId, u);
            
            return res.json(replyTextAndCard(
              `🔨 대장장이: "${getRandomLine('maintain')}"`,
              `❌ 강화 실패 - 유지`,
              `${getItemDisplay(item)}\n장비는 파괴되지 않았습니다.\n\n-${cost}G | 💰 ${u.gold}G`,
              [
                { label: '계속 강화', text: '강화' },
                { label: '그만두기', text: '돌아가기' }
              ],
              ['전투', '상태', '장비', '상점']
            ));
          }
        }
      }
      
      // 상점
      if (msg === '상점') {
        const potionCost = 50 + u.floor * 3;
        return res.json(reply(
          `🏪 상점\n\n` +
          `🧪 물약 (${potionCost}G) - HP 40%\n` +
          `💊 고급물약 (${potionCost * 3}G) - HP 100%\n\n` +
          `💰 ${u.gold}G`,
          ['물약구매', '고급물약구매', '돌아가기']
        ));
      }
      
      if (msg === '물약구매') {
        const cost = 50 + u.floor * 3;
        if (u.gold < cost) return res.json(reply('골드가 부족합니다.', ['상점', '돌아가기']));
        u.gold -= cost;
        u.potions = (u.potions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`🧪 물약 구매! (-${cost}G)\n보유: ${u.potions}개`, ['상점', '돌아가기']));
      }
      
      if (msg === '고급물약구매') {
        const cost = (50 + u.floor * 3) * 3;
        if (u.gold < cost) return res.json(reply('골드가 부족합니다.', ['상점', '돌아가기']));
        u.gold -= cost;
        u.hiPotions = (u.hiPotions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`💊 고급물약 구매! (-${cost}G)\n보유: ${u.hiPotions}개`, ['상점', '돌아가기']));
      }
      
      // 휴식
      if (msg === '휴식') {
        const cost = 40 + u.floor * 6;
        if (u.gold < cost) return res.json(reply(`골드 부족 (${cost}G 필요)`, ['전투', '상태']));
        
        if (Math.random() < 0.12) {
          u.gold -= Math.floor(cost / 2);
          u.madness = clamp((u.madness || 0) + 10, 0, 100);
          const monster = spawnMonster(u.floor);
          const action = getEnemyAction(monster);
          
          await saveUser(userId, {
            ...u, phase: 'battle', monster, nextAction: action,
            battleTurn: 1, madnessOpen: false, interpretBonus: 0,
            isDefending: false, critBoost: 0, bleedTurns: 0,
            shamanDR: 0, ironDRTurns: 0
          });
          
          return res.json(reply(
            `💀 휴식 중 습격!\n\n${monster.name} 출현!\n📢 ${action.text}`,
            ['공격', '회피', '해석', '방어', '스킬', '물약']
          ));
        }
        
        u.gold -= cost;
        const heal = Math.floor(c.maxHp * 0.4);
        u.hp = Math.min(c.maxHp, u.hp + heal);
        u.focus = Math.min(u.maxFocus, u.focus + 35);
        if (u.madness > 0) u.madness = Math.max(0, u.madness - 15);
        u.skillCd = 0;
        
        await saveUser(userId, u);
        return res.json(reply(
          `💤 휴식 완료!\n-${cost}G\n❤️ +${heal} HP | ⚡ +35 Focus` +
          (u.madness > 0 ? `\n🌀 -15 광기` : ''),
          ['전투', '상태', '장비', '상점', '휴식']
        ));
      }
      
      if (msg === '돌아가기') {
        return res.json(reply(
          `🏔️ ${u.floor}층${isBoss ? ' ⭐보스⭐' : ''}\n\n` +
          `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}/${u.maxFocus}\n` +
          `🌀 ${u.madness || 0} | 💰 ${u.gold}G`,
          ['전투', '광기전투', '상태', '장비', '상점', '휴식']
        ));
      }
      
      // 기본 마을
      return res.json(reply(
        `🏔️ ${u.floor}층${isBoss ? ' ⭐보스' : ''}\n\n` +
        `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n` +
        `🌀 ${u.madness || 0} | 💰 ${u.gold}G`,
        ['전투', '광기전투', '상태', '장비', '상점', '휴식', '도움말']
      ));
    }

    // ==================== 전투 ====================
    if (u.phase === 'battle') {
      const m = u.monster;
      const c = calcStats(u);
      const job = JOBS[u.job];
      const eAction = u.nextAction;
      let log = '';
      
      // 플레이어 행동
      if (msg === '공격') {
        let dmg = Math.floor(c.atk - m.def * 0.4);
        const isCrit = Math.random() * 100 < (c.critRate + (u.critBoost || 0) + (u.interpretBonus || 0));
        if (isCrit) dmg = Math.floor(dmg * 2);
        m.hp -= Math.max(1, dmg);
        log += isCrit ? `💥 크리티컬! ${dmg}\n` : `⚔️ ${dmg} 데미지\n`;
        
        const weapon = u.equipment?.weapon;
        if (weapon?.proc?.id === 'bleed' && !m.bleedTurns) {
          m.bleedTurns = 3;
          log += `🩸 출혈!\n`;
        }
        if (weapon?.proc?.id === 'lifesteal') {
          const steal = Math.floor(dmg * 0.08);
          u.hp = Math.min(c.maxHp, u.hp + steal);
          log += `🧛 +${steal} HP\n`;
        }
        
        u.critBoost = 0;
        u.interpretBonus = 0;
      }
      
      else if (msg === '회피') {
        const evadeChance = clamp(c.evasion + 15, 10, 85);
        if (Math.random() * 100 < evadeChance) {
          eAction.type = 'dodged';
          log += `💨 회피 성공!\n`;
          if (u.job === 'hunter') u.critBoost = 35;
        } else {
          log += `❌ 회피 실패!\n`;
        }
      }
      
      else if (msg === '해석') {
        const interpChance = c.interpret + (u.interpretBonus || 0);
        if (Math.random() * 100 < interpChance) {
          u.interpretBonus = 100;
          log += `👁 해석 성공! 크리 확정!\n`;
          if (u.job === 'shaman') {
            u.shamanDR = 0.25;
            log += `🔮 피해 -25%\n`;
          }
        } else {
          log += `❌ 해석 실패\n`;
        }
      }
      
      else if (msg === '방어') {
        u.isDefending = true;
        log += `🛡️ 방어 태세\n`;
        if (u.job === 'ironblood' && Math.random() < 0.5) {
          const counter = Math.floor(c.atk * 0.6);
          m.hp -= counter;
          log += `⚔️ 반격 ${counter}!\n`;
        }
      }
      
      else if (msg === '스킬') {
        if (!job) return res.json(reply('직업이 없습니다.', ['공격', '회피', '해석', '방어']));
        if (u.focus < job.skill.cost) return res.json(reply(`Focus 부족! (${job.skill.cost} 필요)`, ['공격', '회피', '해석', '방어']));
        if (u.skillCd > 0) return res.json(reply(`쿨타임 ${u.skillCd}턴!`, ['공격', '회피', '해석', '방어']));
        
        u.focus -= job.skill.cost;
        u.skillCd = job.skill.cd;
        
        if (u.job === 'wanderer') {
          let dmg = Math.floor(c.atk * 1.8 - m.def * 0.4);
          if (m.hp < m.maxHp * 0.3) dmg = Math.floor(dmg * 1.5);
          m.hp -= Math.max(1, dmg);
          log += `✨ 결단의 일격! ${dmg}\n`;
        }
        else if (u.job === 'hunter') {
          u.interpretBonus = 70;
          let dmg = Math.floor(c.atk * 1.6 - m.def * 0.4);
          m.hp -= Math.max(1, dmg);
          log += `✨ 약점 저격! ${dmg}\n`;
        }
        else if (u.job === 'heretic') {
          u.madness = clamp((u.madness || 0) + 18, 0, 100);
          log += `✨ 금기 주문! 드랍↑\n`;
        }
        else if (u.job === 'shaman') {
          let dmg = Math.floor(c.atk * 1.4 - m.def * 0.4);
          m.hp -= Math.max(1, dmg);
          const steal = Math.floor(dmg * 0.2);
          u.hp = Math.min(c.maxHp, u.hp + steal);
          log += `✨ 혼의 갈고리! ${dmg} +${steal}HP\n`;
        }
        else if (u.job === 'ironblood') {
          u.ironDRTurns = 3;
          log += `✨ 철의 포효! 3턴 피해↓\n`;
        }
        else if (u.job === 'scribe') {
          if (Math.random() < 0.6) {
            eAction.type = 'jammed';
            log += `✨ 문장 왜곡! 적 무효!\n`;
          } else {
            log += `✨ 왜곡 실패...\n`;
          }
        }
      }
      
      else if (msg === '물약') {
        if ((u.potions || 0) <= 0 && (u.hiPotions || 0) <= 0) {
          return res.json(reply('물약이 없습니다!', ['공격', '회피', '해석', '방어', '스킬']));
        }
        if ((u.hiPotions || 0) > 0 && u.hp < c.maxHp * 0.5) {
          u.hiPotions--;
          u.hp = c.maxHp;
          log += `💊 HP 전회복!\n`;
        } else if ((u.potions || 0) > 0) {
          u.potions--;
          const heal = Math.floor(c.maxHp * 0.4);
          u.hp = Math.min(c.maxHp, u.hp + heal);
          log += `🧪 +${heal} HP\n`;
        }
      }
      
      else if (msg === '도망') {
        if (m.isBoss) return res.json(reply('보스에게서 도망칠 수 없습니다!', ['공격', '회피', '해석', '방어', '스킬', '물약']));
        const fleeChance = clamp(40 + c.evasion * 0.8 - m.grade * 5, 10, 75);
        if (Math.random() * 100 < fleeChance) {
          const goldLoss = Math.floor(u.gold * 0.05);
          u.gold = Math.max(0, u.gold - goldLoss);
          await saveUser(userId, { ...u, phase: 'town', monster: null });
          return res.json(reply(`🏃 도망 성공! -${goldLoss}G`, ['전투', '상태', '장비', '상점', '휴식']));
        } else {
          log += `🏃 도망 실패!\n`;
        }
      }
      
      else {
        return res.json(reply('행동을 선택하세요.', ['공격', '회피', '해석', '방어', '스킬', '물약', '도망']));
      }
      
      // 몬스터 처치
      if (m.hp <= 0) {
        m.hp = 0;
        const expGain = m.exp;
        const goldMult = u.equipment?.accessory?.proc?.id === 'lucky' ? 1.2 : 1.0;
        const goldGain = Math.floor(m.gold * goldMult);
        
        u.exp += expGain;
        u.gold += goldGain;
        u.madness = clamp((u.madness || 0) + (m.isBoss ? 12 : (u.madnessOpen ? 7 : 3)), 0, 100);
        
        log += `\n🎉 ${getBattleLine('victory')}\n`;
        log += `+${expGain} EXP +${goldGain}G\n`;
        
        // 레벨업 체크
        const req = getReqExp(u.lv);
        if (u.exp >= req) {
          u.exp -= req;
          u.lv++;
          const newStats = calcStats({ ...u, stats: u.stats });
          u.maxHp = newStats.maxHp;
          u.hp = u.maxHp;
          u.maxFocus = Math.min(160, u.maxFocus + 6);
          u.focus = u.maxFocus;
          log += `\n⭐ LEVEL UP! Lv.${u.lv}\n${getBattleLine('levelUp')}\n`;
        }
        
        // 층수 상승
        if (m.isBoss || Math.random() < 0.7) {
          u.floor++;
          if (u.floor > u.maxFloor) u.maxFloor = u.floor;
          log += `🏔️ ${u.floor}층 도달!\n`;
        }
        
        // 아이템 드랍
        const drops = m.isBoss ? 3 : 1;
        let gotItems = [];
        for (let i = 0; i < drops; i++) {
          const item = generateItem(m.grade, u.floor, u.madnessOpen);
          if (item) {
            u.inventory = [...(u.inventory || []), item];
            gotItems.push(item);
          }
        }
        
        await saveUser(userId, { ...u, phase: 'town', monster: null });
        
        // 아이템 획득시 카드형 출력
        if (gotItems.length > 0) {
          let itemDesc = '';
          gotItems.forEach(item => {
            itemDesc += `${getItemDisplay(item)}\n${getItemStatText(item)}\n\n`;
          });
          
          return res.json(replyTextAndCard(
            log,
            `📦 ${getBattleLine('itemDrop')}`,
            itemDesc,
            [{ label: '확인', text: '돌아가기' }],
            ['전투', '상태', '장비', '상점', '휴식']
          ));
        }
        
        return res.json(reply(log, ['전투', '상태', '장비', '상점', '휴식']));
      }
      
      // 적 턴
      if (eAction.type !== 'dodged' && eAction.type !== 'jammed') {
        let eDmg = Math.floor(m.atk * (eAction.mult || 1));
        
        if (u.isDefending) eDmg = Math.floor(eDmg * 0.5);
        if (u.shamanDR > 0) {
          eDmg = Math.floor(eDmg * (1 - u.shamanDR));
          u.shamanDR = 0;
        }
        if (u.ironDRTurns > 0) {
          eDmg = Math.floor(eDmg * 0.6);
          u.ironDRTurns--;
          const reflect = Math.floor(eDmg * 0.3);
          m.hp -= reflect;
          log += `🌵 반사 ${reflect}\n`;
        }
        
        eDmg = Math.max(1, eDmg - c.def * 0.35);
        
        const armor = u.equipment?.armor;
        if (armor?.proc?.id === 'barrier' && Math.random() < 0.3) {
          const block = Math.floor(c.maxHp * 0.15);
          eDmg = Math.max(0, eDmg - block);
          log += `🛡️ 장막 -${block}\n`;
        }
        if (armor?.proc?.id === 'thorns' && eDmg > 0) {
          const reflect = Math.floor(eDmg * 0.3);
          m.hp -= reflect;
          log += `🌵 가시 ${reflect}\n`;
        }
        
        u.hp -= Math.floor(eDmg);
        
        if (eAction.type === 'special') log += `💥 필살기! ${Math.floor(eDmg)}\n`;
        else if (eAction.type === 'heavy') log += `⚠️ 강공격 ${Math.floor(eDmg)}\n`;
        else if (eAction.type === 'heal') {
          const heal = Math.floor(m.maxHp * eAction.mult);
          m.hp = Math.min(m.maxHp, m.hp + heal);
          log += `💚 적 회복 +${heal}\n`;
        } else if (eAction.type !== 'buff') {
          log += `👹 ${Math.floor(eDmg)} 피해\n`;
        }
      }
      
      u.isDefending = false;
      u.focus = Math.min(u.maxFocus, (u.focus || 0) + 10);
      if (u.skillCd > 0) u.skillCd--;
      
      // 플레이어 사망
      if (u.hp <= 0) {
        u.hp = 0;
        const goldLoss = Math.floor(u.gold * 0.12);
        u.gold = Math.max(0, u.gold - goldLoss);
        u.hp = Math.floor(c.maxHp * 0.5);
        u.madness = clamp((u.madness || 0) + (u.madnessOpen ? 16 : 8), 0, 100);
        
        if (u.floor > 1 && !BOSSES[u.floor]) {
          u.floor = Math.max(1, u.floor - 1);
        }
        
        await saveUser(userId, { ...u, phase: 'town', monster: null });
        return res.json(reply(
          `${log}\n💀 ${getBattleLine('death')}\n\n-${goldLoss}G | 🏔️ ${u.floor}층`,
          ['전투', '상태', '장비', '상점', '휴식']
        ));
      }
      
      // 다음 턴
      u.battleTurn++;
      const nextAction = getEnemyAction(m);
      u.nextAction = nextAction;
      u.monster = m;
      
      await saveUser(userId, u);
      
      const buttons = ['공격', '회피', '해석', '방어'];
      if (job && u.focus >= job.skill.cost && u.skillCd <= 0) buttons.push('스킬');
      if ((u.potions || 0) > 0 || (u.hiPotions || 0) > 0) buttons.push('물약');
      if (!m.isBoss) buttons.push('도망');
      
      return res.json(reply(
        `${log}\n━━ Turn ${u.battleTurn} ━━\n` +
        `👹 ${m.name}: ${m.hp}/${m.maxHp}\n` +
        `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n` +
        (u.skillCd > 0 ? `🔄 CD: ${u.skillCd}\n` : '') +
        `\n📢 ${nextAction.text}\n└ ${nextAction.hint}`,
        buttons
      ));
    }

    return res.json(reply('🏔️ 에테르의 탑', ['시작', '랭킹', '도움말']));
    
  } catch (e) {
    console.error(e);
    return res.json(reply('오류 발생. 다시 시도해주세요.', ['시작']));
  }
};
