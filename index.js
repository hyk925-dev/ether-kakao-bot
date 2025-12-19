const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

const JOBS = {
  wanderer: { name: '방랑자', icon: '⚔️', base: { str: 3, dex: 2, int: 2, wil: 2, vit: 3, luk: 2 } },
  hunter: { name: '사냥꾼', icon: '🏹', base: { str: 2, dex: 5, int: 1, wil: 1, vit: 1, luk: 4 } },
  shaman: { name: '주술사', icon: '👁', base: { str: 1, dex: 1, int: 5, wil: 4, vit: 2, luk: 1 } },
  ironblood: { name: '철혈병', icon: '🛡️', base: { str: 3, dex: 1, int: 0, wil: 4, vit: 5, luk: 1 } },
};

const MONSTERS = [
  { name: '들쥐', hp: 25, atk: 8, def: 2, exp: 12, gold: 8 },
  { name: '늑대', hp: 40, atk: 14, def: 4, exp: 20, gold: 15 },
  { name: '해골병사', hp: 60, atk: 16, def: 8, exp: 35, gold: 25 },
];

async function getUser(id) {
  const doc = await db.collection('users').doc(id).get();
  return doc.exists ? doc.data() : null;
}

async function saveUser(id, data) {
  await db.collection('users').doc(id).set(data, { merge: true });
}

function calcStats(p) {
  const s = p.stats;
  return {
    atk: Math.floor(10 + s.str * 2.5),
    def: Math.floor(5 + s.wil * 1.3 + s.vit * 1.6),
    maxHp: Math.floor(100 + s.vit * 16 + s.wil * 7),
    critRate: Math.floor(5 + s.dex * 0.6 + s.luk * 0.4),
  };
}

function spawnMonster(floor) {
  const base = MONSTERS[Math.min(floor - 1, MONSTERS.length - 1)];
  const mult = 1 + floor * 0.1;
  return { ...base, hp: Math.floor(base.hp * mult), maxHp: Math.floor(base.hp * mult), atk: Math.floor(base.atk * mult) };
}

function reply(text, buttons) {
  return {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies: buttons.map(b => ({ label: b, action: 'message', messageText: b })),
    },
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.json({ message: 'Ether Bot OK' });

  try {
    const userId = req.body?.userRequest?.user?.id;
    const msg = req.body?.userRequest?.utterance?.trim() || '';
    if (!userId) return res.json(reply('오류 발생', ['시작']));

    let u = await getUser(userId);

    if (!u) {
      if (msg === '시작') {
        await saveUser(userId, { phase: 'naming' });
        return res.json(reply('🌫️ 회색 안개 속에서 눈을 떴다...\n\n당신의 이름은?', []));
      }
      return res.json(reply('🏔️ 에테르의 탑\n\n[시작]을 눌러주세요.', ['시작']));
    }

    if (u.phase === 'naming') {
      if (msg.length < 1 || msg.length > 8) return res.json(reply('1~8자로 입력해주세요.', []));
      await saveUser(userId, { ...u, phase: 'job', name: msg });
      return res.json(reply(`${msg}... 기억해두마.\n\n직업을 선택하라:`, ['방랑자', '사냥꾼', '주술사', '철혈병']));
    }

    if (u.phase === 'job') {
      const job = Object.entries(JOBS).find(([k, v]) => v.name === msg);
      if (!job) return res.json(reply('직업을 선택해주세요.', ['방랑자', '사냥꾼', '주술사', '철혈병']));
      const [id, j] = job;
      const stats = { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
      Object.keys(j.base).forEach(k => stats[k] += j.base[k]);
      const c = calcStats({ stats });
      await saveUser(userId, { phase: 'town', name: u.name, job: id, lv: 1, exp: 0, gold: 100, floor: 1, stats, hp: c.maxHp, maxHp: c.maxHp });
      return res.json(reply(`${j.icon} ${j.name} 각성!\n\n❤️ HP: ${c.maxHp}\n💰 100G\n🏔️ 1층`, ['전투', '상태', '휴식']));
    }

    if (u.phase === 'town') {
      const c = calcStats(u);
      if (msg === '전투') {
        const m = spawnMonster(u.floor);
        await saveUser(userId, { ...u, phase: 'battle', monster: m });
        return res.json(reply(`⚔️ ${m.name} 출현!\n\n👹 ${m.hp}/${m.maxHp}\n❤️ ${u.hp}/${u.maxHp}`, ['공격', '방어', '도망']));
      }
      if (msg === '상태') {
        const j = JOBS[u.job];
        return res.json(reply(`📊 ${u.name} Lv.${u.lv}\n${j.icon} ${j.name}\n\n❤️ ${u.hp}/${u.maxHp}\n⚔️ ${c.atk} 🛡️ ${c.def}\n💰 ${u.gold}G\n🏔️ ${u.floor}층`, ['전투', '휴식']));
      }
      if (msg === '휴식') {
        const cost = 30 + u.floor * 5;
        if (u.gold < cost) return res.json(reply(`골드 부족 (${cost}G 필요)`, ['전투', '상태']));
        const heal = Math.floor(u.maxHp * 0.4);
        await saveUser(userId, { ...u, hp: Math.min(u.maxHp, u.hp + heal), gold: u.gold - cost });
        return res.json(reply(`💤 휴식!\n-${cost}G, +${heal}HP`, ['전투', '상태', '휴식']));
      }
      return res.json(reply(`🏔️ ${u.floor}층`, ['전투', '상태', '휴식']));
    }

    if (u.phase === 'battle') {
      const m = u.monster, c = calcStats(u);
      let log = '', mHp = m.hp, hp = u.hp;

      if (msg === '공격') {
        const crit = Math.random() * 100 < c.critRate;
        let dmg = Math.max(1, c.atk - m.def * 0.4);
        if (crit) dmg *= 2;
        mHp -= Math.floor(dmg);
        log = crit ? `💥 크리티컬! ${Math.floor(dmg)}!` : `⚔️ ${Math.floor(dmg)} 데미지!`;
      } else if (msg === '방어') {
        log = '🛡️ 방어 태세!';
      } else if (msg === '도망') {
        if (Math.random() < 0.5) {
          await saveUser(userId, { ...u, phase: 'town', monster: null });
          return res.json(reply('🏃 도망 성공!', ['전투', '상태', '휴식']));
        }
        log = '도망 실패!';
      } else {
        return res.json(reply('행동 선택:', ['공격', '방어', '도망']));
      }

      if (mHp <= 0) {
        let exp = u.exp + m.exp, lv = u.lv, floor = u.floor;
        if (exp >= 50 + u.lv * 30) { exp = 0; lv++; log += `\n🎉 레벨업! Lv.${lv}`; }
        if (Math.random() < 0.6) floor++;
        await saveUser(userId, { ...u, phase: 'town', monster: null, exp, gold: u.gold + m.gold, lv, floor });
        return res.json(reply(`${log}\n\n🎉 승리!\n+${m.exp}EXP +${m.gold}G`, ['전투', '상태', '휴식']));
      }

      const eDmg = msg === '방어' ? Math.floor(m.atk * 0.5) : m.atk;
      hp -= Math.max(1, eDmg - c.def * 0.3);
      log += `\n👹 ${Math.floor(Math.max(1, eDmg - c.def * 0.3))} 피해!`;

      if (hp <= 0) {
        await saveUser(userId, { ...u, phase: 'town', monster: null, hp: Math.floor(u.maxHp * 0.5), gold: Math.max(0, u.gold - 10) });
        return res.json(reply(`${log}\n\n💀 패배...\n-10G`, ['전투', '상태', '휴식']));
      }

      m.hp = mHp;
      await saveUser(userId, { ...u, hp, monster: m });
      return res.json(reply(`${log}\n\n👹 ${mHp}/${m.maxHp}\n❤️ ${hp}/${u.maxHp}`, ['공격', '방어', '도망']));
    }

    return res.json(reply('🏔️ 에테르의 탑', ['시작']));
  } catch (e) {
    console.error(e);
    return res.json(reply('오류 발생. 다시 시도해주세요.', ['시작']));
  }
};
