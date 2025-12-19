const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ============================================
// 대장장이 & 전투 대사
// ============================================
const BLACKSMITH_LINES = {
  success: ["허허, 이 정도 실력이면 뭐...", "오, 제법인데? 운이 좋군.", "좋았어! 빛이 나는군!"],
  fail: ["쯧, 운명의 장난인가...", "에휴, 재료가 아까워.", "운이 없군. 다시 해볼 텐가?"],
  destroy: ["이런... 미안하군...", "장비가... 가루가 됐어...", "미안... 내 실력이 부족했나..."],
  maintain: ["쓸데없이 튼튼하기만 하군.", "휴, 다행히 부서지진 않았네."],
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

const getLine = (obj, type) => {
  const lines = obj[type];
  return lines[Math.floor(Math.random() * lines.length)];
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
  weapon: { name: '무기', types: ['검', '도끼', '창', '단검'], mainStat: 'atk', base: 6 },
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
// 유틸리티
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
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}
async function getTopUsers(field, limit = 10) {
  const snapshot = await db.collection('users').where('phase', '==', 'town').orderBy(field, 'desc').limit(limit).get();
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
// 응답 포맷
// ============================================
function reply(text, buttons = []) {
  const response = { version: '2.0', template: { outputs: [{ simpleText: { text } }] } };
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.map(b => ({ label: b, action: 'message', messageText: b }));
  }
  return response;
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

// ============================================
// 마을 화면 생성
// ============================================
function getTownText(u) {
  const c = calcStats(u);
  const job = JOBS[u.job];
  const isBoss = BOSSES[u.floor] !== undefined;
  const req = getReqExp(u.lv);
  
  let text = `🏠 마을\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `${job?.icon || ''} ${u.name} Lv.${u.lv}\n`;
  text += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}/${u.maxFocus}\n`;
  text += `🌀 광기: ${u.madness || 0} | 💰 ${u.gold}G\n`;
  text += `📈 EXP: ${u.exp}/${req}\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `🏔️ ${u.floor}층${isBoss ? ' ⭐보스⭐' : ''} (최고: ${u.maxFloor}층)\n`;
  
  if ((u.statPoints || 0) > 0) {
    text += `\n⭐ 미배분 스탯: ${u.statPoints}점`;
  }
  
  return text;
}

// ============================================
// 메인 핸들러
// ============================================
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.json({ message: 'ETHER v2.4 OK' });

  try {
    const userId = req.body?.userRequest?.user?.id;
    const msg = req.body?.userRequest?.utterance?.trim() || '';
    if (!userId) return res.json(reply('오류 발생', ['시작']));

    let u = await getUser(userId);

    // ========== 소셜 (로그인 불필요) ==========
    if (msg === '랭킹' || msg === '@랭킹') {
      const ranks = await getTopUsers('floor', 10);
      let text = '🏆 에테르의 탑 랭킹\n━━━━━━━━━━━━━━━\n';
      ranks.forEach(r => {
        const job = JOBS[r.job];
        text += `${r.rank}. ${job?.icon || ''}${r.name} Lv.${r.lv} (${r.floor}층)\n`;
      });
      return res.json(reply(text, u ? ['마을', '전투', '상태'] : ['시작']));
    }

    // ========== 신규 유저 ==========
    if (!u) {
      if (msg === '시작') {
        await saveUser(userId, { phase: 'naming' });
        return res.json(reply('🌫️ 회색 안개 속에서 눈을 떴다...\n\n당신의 이름은?'));
      }
      return res.json(reply('🏔️ 에테르의 탑\n\n100층 정상에 오르면 소원이 이루어진다.\n하지만 소원은... 대가를 요구한다.', ['시작', '랭킹']));
    }

    // ========== 이름 입력 ==========
    if (u.phase === 'naming') {
      if (msg.length < 1 || msg.length > 8) return res.json(reply('이름은 1~8자로 입력해주세요.'));
      const existing = await getUserByName(msg);
      if (existing) return res.json(reply('이미 사용 중인 이름입니다.'));
      
      await saveUser(userId, { ...u, phase: 'job', name: msg });
      
      let jobList = `${msg}... 기억해두마.\n\n직업을 선택하세요:\n\n`;
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
      
      const c = calcStats({ stats, job: jobId, equipment: {}, curses: [] });
      
      await saveUser(userId, {
        phase: 'town', name: u.name, job: jobId,
        lv: 1, exp: 0, gold: 150, floor: 1, maxFloor: 1,
        stats, statPoints: 5, hp: c.maxHp, maxHp: c.maxHp,
        focus: 60, maxFocus: 100, madness: 0, curses: [],
        equipment: { weapon: null, armor: null, accessory: null, relic: null },
        inventory: [], skillCd: 0, potions: 2, hiPotions: 0,
        duelWins: 0, duelLosses: 0, createdAt: new Date().toISOString()
      });
      
      return res.json(reply(
        `${job.icon} ${job.name} 각성!\n\n` +
        `❤️ HP: ${c.maxHp}\n⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}\n👁 해석: ${c.interpret}%\n\n` +
        `✨ 스킬: ${job.skill.name}\n└ ${job.skill.desc}\n\n` +
        `💰 150G | 🧪 물약 2개 | ⭐ 스탯 5점`,
        ['마을']
      ));
    }

    // ========== 초기화 확인 ==========
    if (u.phase === 'confirm_reset') {
      if (msg === '초기화확인') {
        await deleteUser(userId);
        return res.json(reply('💀 모든 기록이 삭제되었습니다.', ['시작']));
      }
      if (msg === '취소' || msg === '마을') {
        await saveUser(userId, { ...u, phase: 'town' });
        return res.json(reply(getTownText(u), ['전투', '탐사', '상태', '장비', '상점', '휴식']));
      }
      return res.json(reply('⚠️ 정말 초기화하시겠습니까?\n모든 진행이 삭제됩니다!', ['초기화확인', '취소']));
    }

    // ========== 마을 ==========
    if (u.phase === 'town') {
      const c = calcStats(u);
      const job = JOBS[u.job];
      const isBoss = BOSSES[u.floor] !== undefined;

      // 마을 메인
      if (msg === '마을' || msg === '돌아가기') {
        return res.json(reply(getTownText(u), ['전투', '탐사', '층이동', '상태', '장비', '상점', '휴식']));
      }

      // 전투 시작
      if (msg === '전투' || msg === '광기전투') {
        const madnessOpen = msg === '광기전투';
        const monster = spawnMonster(u.floor);
        const action = getEnemyAction(monster);
        
        await saveUser(userId, {
          ...u, phase: 'battle', monster, nextAction: action,
          battleTurn: 1, madnessOpen, interpretBonus: 0,
          isDefending: false, critBoost: 0, shamanDR: 0, ironDRTurns: 0
        });
        
        let text = madnessOpen ? '🌀 광기 개방!\n\n' : '';
        text += monster.isBoss ? `⭐ BOSS ⭐\n${getLine(BATTLE_LINES, 'bossAppear')}\n\n` : '';
        text += `${monster.name} 출현!\n[${monster.typeName}] ${GRADES[monster.grade].name}\n\n`;
        text += `👹 ${monster.hp}/${monster.maxHp}\n`;
        text += `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n\n`;
        text += `📢 ${action.text}\n└ ${action.hint}`;
        
        return res.json(reply(text, ['공격', '회피', '해석', '방어', '스킬', '물약']));
      }

      // 탐사
      if (msg === '탐사') {
        return res.json(reply(
          '🧭 탐사\n\n어디를 탐사하시겠습니까?',
          ['안전탐사', '위험탐사', '금기탐사', '마을']
        ));
      }

      if (msg === '안전탐사' || msg === '위험탐사' || msg === '금기탐사') {
        const tier = msg === '안전탐사' ? 1 : (msg === '위험탐사' ? 2 : 3);
        const roll = Math.random();
        
        // 안전: 50% 조용, 25% 전투, 25% 보물
        // 위험: 18% 저주, 52% 전투, 30% 보물  
        // 금기: 12% 저주+광기, 63% 광기전투, 25% 보물
        
        if (tier === 1) {
          if (roll < 0.50) {
            return res.json(reply('조용하다... 아무 일도 없었다.', ['탐사', '마을']));
          } else if (roll < 0.75) {
            // 일반 전투
            const monster = spawnMonster(u.floor);
            const action = getEnemyAction(monster);
            await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen: false, interpretBonus: 0 });
            return res.json(reply(`적과 조우!\n\n${monster.name}\n📢 ${action.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
          }
        } else if (tier === 2) {
          if (roll < 0.18) {
            const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
            u.curses = [...(u.curses || []), curse];
            await saveUser(userId, u);
            return res.json(reply(`💀 저주가 스쳤다...\n\n${curse.name}: ${curse.desc}`, ['탐사', '마을']));
          } else if (roll < 0.70) {
            const monster = spawnMonster(u.floor);
            const action = getEnemyAction(monster);
            const madnessOpen = Math.random() < 0.4;
            await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen, interpretBonus: 0 });
            return res.json(reply(`${madnessOpen ? '🌀 광기가 스며든다!\n\n' : ''}적과 조우!\n\n${monster.name}\n📢 ${action.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
          }
        } else {
          if (roll < 0.12) {
            const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
            u.curses = [...(u.curses || []), curse];
            u.madness = clamp((u.madness || 0) + 15, 0, 100);
            await saveUser(userId, u);
            return res.json(reply(`💀 금기를 밟았다!\n\n${curse.name}: ${curse.desc}\n🌀 광기 +15`, ['탐사', '마을']));
          } else if (roll < 0.75) {
            const monster = spawnMonster(u.floor);
            const action = getEnemyAction(monster);
            await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen: true, interpretBonus: 0 });
            return res.json(reply(`🌀 광기 개방!\n\n${monster.name}\n📢 ${action.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
          }
        }
        
        // 보물 발견
        const bonusGold = [50, 120, 200][tier - 1];
        const bonusMad = [0, 8, 15][tier - 1];
        u.gold += bonusGold;
        u.madness = clamp((u.madness || 0) + bonusMad, 0, 100);
        
        const item = generateItem(clamp(2 + tier, 1, 5), u.floor, tier === 3);
        let text = `📦 보물 발견!\n\n+${bonusGold}G`;
        if (bonusMad > 0) text += ` | 🌀+${bonusMad}`;
        
        if (item) {
          u.inventory = [...(u.inventory || []), item];
          text += `\n\n${getItemDisplay(item)}\n${getItemStatText(item)}`;
        }
        
        await saveUser(userId, u);
        return res.json(reply(text, ['탐사', '장비', '마을']));
      }

      // 층이동
      if (msg === '층이동') {
        return res.json(reply(
          `🏔️ 층이동\n\n현재: ${u.floor}층\n최고 도달: ${u.maxFloor}층\n\n이동할 층 번호를 입력하세요.`,
          ['1층', '5층', '10층', '마을']
        ));
      }

      if (msg.endsWith('층') && !isNaN(parseInt(msg))) {
        const targetFloor = parseInt(msg);
        if (targetFloor < 1 || targetFloor > u.maxFloor) {
          return res.json(reply(`1~${u.maxFloor}층 사이로만 이동 가능합니다.`, ['층이동', '마을']));
        }
        u.floor = targetFloor;
        await saveUser(userId, u);
        return res.json(reply(`🏔️ ${targetFloor}층으로 이동!${BOSSES[targetFloor] ? '\n⭐ 보스가 기다리고 있다...' : ''}`, ['전투', '탐사', '마을']));
      }

      // 상태
      if (msg === '상태') {
        const req = getReqExp(u.lv);
        const power = calcPower(u);
        let text = `📊 ${u.name} 상태\n━━━━━━━━━━━━━━━\n`;
        text += `${job?.icon || ''} ${job?.name || '무직'} Lv.${u.lv}\n`;
        text += `⚔️ 전투력: ${power}\n\n`;
        text += `❤️ HP: ${u.hp}/${c.maxHp}\n`;
        text += `⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}\n`;
        text += `💨 회피: ${c.evasion}% | 💥 크리: ${c.critRate}%\n`;
        text += `👁 해석: ${c.interpret}%\n\n`;
        text += `━━ 스탯 ━━\n`;
        text += `힘:${u.stats.str} 민:${u.stats.dex} 지:${u.stats.int}\n`;
        text += `의:${u.stats.wil} 체:${u.stats.vit} 운:${u.stats.luk}\n`;
        
        if ((u.statPoints || 0) > 0) {
          text += `\n⭐ 미배분: ${u.statPoints}점`;
        }
        
        if ((u.curses || []).length > 0) {
          text += `\n\n💀 저주: ${u.curses.map(c => c.name).join(', ')}`;
        }
        
        const buttons = ['마을'];
        if ((u.statPoints || 0) > 0) buttons.unshift('스탯투자');
        return res.json(reply(text, buttons));
      }

      // 스탯 투자
      if (msg === '스탯투자') {
        if ((u.statPoints || 0) <= 0) {
          return res.json(reply('배분할 스탯 포인트가 없습니다.', ['상태', '마을']));
        }
        return res.json(reply(
          `⭐ 스탯 투자 (${u.statPoints}점)\n\n` +
          `현재 스탯:\n힘:${u.stats.str} 민:${u.stats.dex} 지:${u.stats.int}\n의:${u.stats.wil} 체:${u.stats.vit} 운:${u.stats.luk}\n\n` +
          `어느 스탯에 투자하시겠습니까?`,
          ['힘+1', '민첩+1', '지능+1', '의지+1', '체력+1', '행운+1', '상태']
        ));
      }

      const statMap = { '힘+1': 'str', '민첩+1': 'dex', '지능+1': 'int', '의지+1': 'wil', '체력+1': 'vit', '행운+1': 'luk' };
      if (statMap[msg]) {
        if ((u.statPoints || 0) <= 0) {
          return res.json(reply('포인트가 부족합니다.', ['상태', '마을']));
        }
        const stat = statMap[msg];
        u.stats[stat]++;
        u.statPoints--;
        const newC = calcStats(u);
        u.maxHp = newC.maxHp;
        await saveUser(userId, u);
        
        if (u.statPoints > 0) {
          return res.json(reply(`${stat.toUpperCase()} +1! (남은 포인트: ${u.statPoints})`, ['힘+1', '민첩+1', '지능+1', '의지+1', '체력+1', '행운+1', '상태']));
        }
        return res.json(reply(`${stat.toUpperCase()} +1!\n스탯 투자 완료!`, ['상태', '마을']));
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
            text += `${i + 1}. ${getItemDisplay(item)}\n`;
          });
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
        u.gold += price;
        
        await saveUser(userId, u);
        return res.json(reply(`💰 +${price}G`, ['장비', '마을']));
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
          `${desc}\n💰 보유: ${u.gold}G`,
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
        if (u.gold < cost) return res.json(reply(`골드 부족! (${cost}G 필요)`, ['강화', '마을']));
        
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
              `💥 파괴!`,
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
        const p1 = 30 + u.floor * 2;
        const p2 = 100 + u.floor * 4;
        return res.json(reply(
          `🏪 상점\n━━━━━━━━━━━━━━━\n` +
          `🧪 물약 (${p1}G) - HP 40%\n` +
          `💊 고급물약 (${p2}G) - HP 100%\n\n` +
          `보유: 🧪${u.potions || 0} 💊${u.hiPotions || 0}\n💰 ${u.gold}G`,
          ['물약구매', '고급물약구매', '마을']
        ));
      }

      if (msg === '물약구매') {
        const cost = 30 + u.floor * 2;
        if (u.gold < cost) return res.json(reply('골드 부족!', ['상점', '마을']));
        u.gold -= cost;
        u.potions = (u.potions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`🧪 구매! (보유: ${u.potions}개)`, ['상점', '마을']));
      }

      if (msg === '고급물약구매') {
        const cost = 100 + u.floor * 4;
        if (u.gold < cost) return res.json(reply('골드 부족!', ['상점', '마을']));
        u.gold -= cost;
        u.hiPotions = (u.hiPotions || 0) + 1;
        await saveUser(userId, u);
        return res.json(reply(`💊 구매! (보유: ${u.hiPotions}개)`, ['상점', '마을']));
      }

      // 휴식
      if (msg === '휴식') {
        const cost = 30 + u.floor * 5;
        if (u.gold < cost) return res.json(reply(`골드 부족! (${cost}G 필요)`, ['마을']));
        
        // 15% 습격
        if (Math.random() < 0.15) {
          u.gold -= Math.floor(cost / 2);
          u.madness = clamp((u.madness || 0) + 10, 0, 100);
          const monster = spawnMonster(u.floor);
          const action = getEnemyAction(monster);
          await saveUser(userId, { ...u, phase: 'battle', monster, nextAction: action, battleTurn: 1, madnessOpen: false, interpretBonus: 0 });
          return res.json(reply(`💀 휴식 중 습격!\n\n${monster.name}\n📢 ${action.text}`, ['공격', '회피', '해석', '방어', '스킬', '물약']));
        }
        
        u.gold -= cost;
        const heal = Math.floor(c.maxHp * 0.35);
        u.hp = Math.min(c.maxHp, u.hp + heal);
        u.focus = Math.min(u.maxFocus, (u.focus || 0) + 30);
        u.skillCd = 0;
        if (u.madness > 0) u.madness = Math.max(0, u.madness - 12);
        
        await saveUser(userId, u);
        return res.json(reply(`💤 휴식 완료!\n-${cost}G\n❤️+${heal} ⚡+30${u.madness > 0 ? ' 🌀-12' : ''}`, ['전투', '탐사', '마을']));
      }

      // 초기화
      if (msg === '초기화') {
        await saveUser(userId, { ...u, phase: 'confirm_reset' });
        return res.json(reply(`⚠️ 캐릭터 초기화\n\n${u.name} Lv.${u.lv}\n🏔️ ${u.maxFloor}층 | 💰 ${u.gold}G\n\n정말 삭제하시겠습니까?`, ['초기화확인', '취소']));
      }

      // 도움말
      if (msg === '도움말') {
        return res.json(reply(
          `📚 도움말\n\n` +
          `⚔️ 전투 - 적과 싸워 경험치/골드 획득\n` +
          `🧭 탐사 - 보물, 전투, 저주 랜덤\n` +
          `🏔️ 층이동 - 도달한 층으로 이동\n` +
          `💤 휴식 - HP/Focus 회복 (습격 주의)\n` +
          `🔨 강화 - 장비 강화 (+10까지)\n\n` +
          `전투 중:\n` +
          `공격/회피/해석/방어/스킬/물약`,
          ['마을']
        ));
      }

      // 기본
      return res.json(reply(getTownText(u), ['전투', '탐사', '층이동', '상태', '장비', '상점', '휴식']));
    }

    // ========== 전투 ==========
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
        if (weapon?.proc?.id === 'lifesteal') {
          const steal = Math.floor(dmg * 0.08);
          u.hp = Math.min(c.maxHp, u.hp + steal);
          log += `🧛 +${steal} HP\n`;
        }
        
        // 유물 흡수
        const relic = u.equipment?.relic;
        if (relic?.special?.name === '흡수') {
          const steal = Math.floor(dmg * 0.08);
          u.hp = Math.min(c.maxHp, u.hp + steal);
          log += `✨ +${steal} HP\n`;
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
        if ((u.focus || 0) < job.skill.cost) return res.json(reply(`Focus 부족! (${job.skill.cost} 필요)`, ['공격', '회피', '해석', '방어']));
        if ((u.skillCd || 0) > 0) return res.json(reply(`쿨타임 ${u.skillCd}턴!`, ['공격', '회피', '해석', '방어']));
        
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
          log += `✨ 금기 주문! 드랍↑ 광기+18\n`;
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
        if (Math.random() < 0.5) {
          u.gold = Math.max(0, u.gold - Math.floor(u.gold * 0.05));
          await saveUser(userId, { ...u, phase: 'town', monster: null });
          return res.json(reply('🏃 도망 성공!', ['마을']));
        }
        log += `🏃 도망 실패!\n`;
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
        
        log += `\n🎉 ${getLine(BATTLE_LINES, 'victory')}\n+${expGain} EXP +${goldGain}G\n`;
        
        // 레벨업
        const req = getReqExp(u.lv);
        if (u.exp >= req) {
          u.exp -= req;
          u.lv++;
          u.statPoints = (u.statPoints || 0) + 3;
          const newC = calcStats(u);
          u.maxHp = newC.maxHp;
          u.hp = u.maxHp;
          u.maxFocus = Math.min(160, (u.maxFocus || 100) + 6);
          u.focus = u.maxFocus;
          log += `\n⭐ LEVEL UP! Lv.${u.lv}\n${getLine(BATTLE_LINES, 'levelUp')}\n스탯+3 Focus+6\n`;
        }
        
        // 층수
        if (m.isBoss || Math.random() < 0.7) {
          u.floor++;
          if (u.floor > u.maxFloor) u.maxFloor = u.floor;
          log += `🏔️ ${u.floor}층 도달!\n`;
        }
        
        // 아이템
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
        
        // 마을 상태 추가
        const newC = calcStats(u);
        log += `\n━━━━━━━━━━━━━━━\n🏠 마을 귀환\n❤️ ${u.hp}/${newC.maxHp} | 💰 ${u.gold}G`;
        
        if (gotItems.length > 0) {
          let itemDesc = '';
          gotItems.forEach(item => {
            itemDesc += `${getItemDisplay(item)}\n${getItemStatText(item)}\n`;
          });
          return res.json(replyTextAndCard(
            log,
            `📦 ${getLine(BATTLE_LINES, 'itemDrop')}`,
            itemDesc,
            [{ label: '장비', text: '장비' }, { label: '마을', text: '마을' }],
            ['전투', '탐사', '상태', '휴식']
          ));
        }
        
        return res.json(reply(log, ['전투', '탐사', '장비', '마을']));
      }

      // 적 턴
      if (eAction.type !== 'dodged' && eAction.type !== 'jammed') {
        let eDmg = Math.floor(m.atk * (eAction.mult || 1));
        
        if (u.isDefending) eDmg = Math.floor(eDmg * 0.5);
        if ((u.shamanDR || 0) > 0) {
          eDmg = Math.floor(eDmg * (1 - u.shamanDR));
          u.shamanDR = 0;
        }
        if ((u.ironDRTurns || 0) > 0) {
          eDmg = Math.floor(eDmg * 0.6);
          u.ironDRTurns--;
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
        
        if (eAction.type === 'heal') {
          const heal = Math.floor(m.maxHp * eAction.mult);
          m.hp = Math.min(m.maxHp, m.hp + heal);
          log += `💚 적 회복 +${heal}\n`;
        } else {
          log += `👹 ${Math.floor(eDmg)} 피해\n`;
        }
      }
      
      // 유물 재생
      const relic = u.equipment?.relic;
      if (relic?.special?.name === '재생') {
        const heal = Math.floor(c.maxHp * 0.04);
        u.hp = Math.min(c.maxHp, u.hp + heal);
        log += `✨ +${heal} HP\n`;
      }
      
      u.isDefending = false;
      u.focus = Math.min(u.maxFocus || 100, (u.focus || 0) + 10);
      if ((u.skillCd || 0) > 0) u.skillCd--;

      // 사망
      if (u.hp <= 0) {
        // 불멸 유물
        if (relic?.special?.name === '불멸' && !u.revived && Math.random() < 0.6) {
          u.hp = Math.floor(c.maxHp * 0.6);
          u.revived = true;
          log += `\n★ 불멸 발동! 부활!\n`;
        } else {
          u.hp = 0;
          const goldLoss = Math.floor(u.gold * 0.12);
          u.gold = Math.max(0, u.gold - goldLoss);
          u.hp = Math.floor(c.maxHp * 0.5);
          u.madness = clamp((u.madness || 0) + (u.madnessOpen ? 16 : 8), 0, 100);
          if (u.floor > 1 && !BOSSES[u.floor]) u.floor = Math.max(1, u.floor - 1);
          
          await saveUser(userId, { ...u, phase: 'town', monster: null, revived: false });
          return res.json(reply(
            `${log}\n💀 ${getLine(BATTLE_LINES, 'death')}\n\n-${goldLoss}G | 🏔️ ${u.floor}층`,
            ['마을']
          ));
        }
      }

      // 다음 턴
      u.battleTurn = (u.battleTurn || 1) + 1;
      const nextAction = getEnemyAction(m);
      u.nextAction = nextAction;
      u.monster = m;
      
      await saveUser(userId, u);
      
      const buttons = ['공격', '회피', '해석', '방어'];
      if (job && (u.focus || 0) >= job.skill.cost && (u.skillCd || 0) <= 0) buttons.push('스킬');
      if ((u.potions || 0) > 0 || (u.hiPotions || 0) > 0) buttons.push('물약');
      if (!m.isBoss) buttons.push('도망');
      
      return res.json(reply(
        `${log}\n━━ Turn ${u.battleTurn} ━━\n` +
        `👹 ${m.name}: ${m.hp}/${m.maxHp}\n` +
        `❤️ ${u.hp}/${c.maxHp} | ⚡ ${u.focus}\n` +
        ((u.skillCd || 0) > 0 ? `🔄 CD: ${u.skillCd}\n` : '') +
        `\n📢 ${nextAction.text}\n└ ${nextAction.hint}`,
        buttons
      ));
    }

    return res.json(reply('🏔️ 에테르의 탑', ['시작', '랭킹']));
    
  } catch (e) {
    console.error(e);
    return res.json(reply('오류 발생. 다시 시도해주세요.', ['시작']));
  }
};
