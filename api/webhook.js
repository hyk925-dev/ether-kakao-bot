const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const config = JSON.parse(process.env.FIREBASE_CONFIG);
  initializeApp({
    credential: cert(config),
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

function quickReplies(text, replies) {
  return {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies: replies.map(r => ({ label: r, action: 'message', messageText: r })),
    },
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.json({ message: 'Ether Bot OK' });

  try {
    const userId = req.body?.userRequest?.user?.id;
    const utterance = req.body?.userRequest?.utterance?.trim() || '';
    if (!userId) return res.json(quickReplies('오류 발생', ['시작']));

    let user = await getUser(userId);

    if (!user) {
      if (utterance === '시작') {
        await saveUser(userId, { phase: 'naming' });
        return res.json(quickReplies('🌫️ 회색 안개 속에서 눈을 떴다...\n\n당신의 이름은?', []));
      }
      return res.json(quickReplies('🏔️ 에테르의 탑\n\n게임을 시작하세요.', ['시작']));
    }

    if (user.phase === 'naming') {
      if (utterance.length < 1 || utterance.length > 8) return res.json(quickReplies('1~8자로 입력해주세요.', []));
      await saveUser(userId, { phase: 'job_select', name: utterance });
      return res.json(quickReplies(`${utterance}... 기억해두마.\n\n직업을 선택하라:`, ['방랑자', '사냥꾼', '주술사', '철혈병']));
    }

    if (user.phase === 'job_select') {
      const jobEntry = Object.entries(JOBS).find(([k, v]) => v.name === utterance);
      if (!jobEntry) return res.json(quickReplies('직업을 선택해주세요.', ['방랑자', '사냥꾼', '주술사', '철혈병']));
      const [jobId, job] = jobEntry;
      const stats = { str: 5, dex: 5, int: 5, wil: 5, vit: 5, luk: 5 };
      Object.keys(job.base).forEach(k => { stats[k] += job.base[k]; });
      const c = calcStats({ stats });
      await saveUser(userId, { phase: 'town', name: user.name, job: jobId, level: 1, exp: 0, gold: 100, floor: 1, stats, hp: c.maxHp, maxHp: c.maxHp });
      return res.json(quickReplies(`${job.icon} ${job.name} 각성!\n\n❤️ HP: ${c.maxHp}\n💰 100G\n🏔️ 1층`, ['전투', '상태', '휴식']));
    }

    if (user.phase === 'town') {
      const c = calcStats(user);
      if (utterance === '전투') {
        const m = spawnMonster(user.floor);
        await saveUser(userId, { phase: 'battle', monster: m });
        return res.json(quickReplies(`⚔️ ${m.name} 출현!\n\n👹 적: ${m.hp}/${m.maxHp}\n❤️ 나: ${user.hp}/${user.maxHp}`, ['공격', '방어', '도망']));
      }
      if (utterance === '상태') {
        const job = JOBS[user.job];
        return res.json(quickReplies(`📊 ${user.name} Lv.${user.level}\n${job.icon} ${job.name}\n\n❤️ ${user.hp}/${user.maxHp}\n⚔️ 공격: ${c.atk}\n🛡️ 방어: ${c.def}\n💰 ${user.gold}G\n🏔️ ${user.floor}층`, ['전투', '휴식']));
      }
      if (utterance === '휴식') {
        const cost = 30 + user.floor * 5;
        if (user.gold < cost) return res.json(quickReplies(`골드 부족 (${cost}G 필요)`, ['전투', '상태']));
        const heal = Math.floor(user.maxHp * 0.4);
        await saveUser(userId, { hp: Math.min(user.maxHp, user.hp + heal), gold: user.gold - cost });
        return res.json(quickReplies(`💤 휴식!\n-${cost}G, HP+${heal}`, ['전투', '상태', '휴식']));
      }
      return res.json(quickReplies(`🏔️ ${user.floor}층\n❤️ ${user.hp}/${user.maxHp}`, ['전투', '상태', '휴식']));
    }

    if (user.phase === 'battle') {
      const m = user.monster, c = calcStats(user);
      let log = '', newMHp = m.hp, newHp = user.hp;

      if (utterance === '공격') {
        const crit = Math.random() * 100 < c.critRate;
        let dmg = Math.max(1, c.atk - m.def * 0.4);
        if (crit) dmg *= 2;
        newMHp -= Math.floor(dmg);
        log += crit ? `💥크리티컬! ${Math.floor(dmg)}!` : `⚔️ ${Math.floor(dmg)} 데미지!`;
      } else if (utterance === '방어') {
        log += '🛡️ 방어!';
      } else if (utterance === '도망') {
        if (Math.random() < 0.5) { await saveUser(userId, { phase: 'town', monster: null }); return res.json(quickReplies('🏃 도망 성공!', ['전투', '상태', '휴식'])); }
        log += '도망 실패!';
      } else {
        return res.json(quickReplies('행동 선택:', ['공격', '방어', '도망']));
      }

      if (newMHp <= 0) {
        let newExp = user.exp + m.exp, newLv = user.level, newFloor = user.floor;
        if (newExp >= 50 + user.level * 30) { newExp = 0; newLv++; log += `\n🎉 레벨업! Lv.${newLv}`; }
        if (Math.random() < 0.6) newFloor++;
        await saveUser(userId, { phase: 'town', monster: null, exp: newExp, gold: user.gold + m.gold, level: newLv, floor: newFloor });
        return res.json(quickReplies(`${log}\n\n🎉 승리!\n+${m.exp}EXP +${m.gold}G${newFloor > user.floor ? `\n🏔️ ${newFloor}층!` : ''}`, ['전투', '상태', '휴식']));
      }

      const eDmg = utterance === '방어' ? Math.floor(m.atk * 0.5) : m.atk;
      newHp -= Math.max(1, eDmg - c.def * 0.3);
      log += `\n👹 ${Math.floor(Math.max(1, eDmg - c.def * 0.3))} 피해!`;

      if (newHp <= 0) {
        await saveUser(userId, { phase: 'town', monster: null, hp: Math.floor(user.maxHp * 0.5), gold: Math.max(0, user.gold - 10) });
        return res.json(quickReplies(`${log}\n\n💀 패배...\n-10G`, ['전투', '상태', '휴식']));
      }

      m.hp = newMHp;
      await saveUser(userId, { hp: newHp, monster: m });
      return res.json(quickReplies(`${log}\n\n👹 ${m.hp}/${m.maxHp}\n❤️ ${newHp}/${user.maxHp}`, ['공격', '방어', '도망']));
    }

    return res.json(quickReplies('🏔️ 에테르의 탑', ['전투', '상태', '휴식']));
  } catch (e) {
    console.error(e);
    return res.json(quickReplies('오류 발생. 다시 시도해주세요.', ['시작']));
  }
};
