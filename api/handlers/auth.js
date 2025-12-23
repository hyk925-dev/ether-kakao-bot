// ============================================
// Auth Handler v4.0
// 캐릭터 생성/삭제
// ============================================

const { JOBS, JOB_IMAGES } = require('../../data');
const { calcStats } = require('../../utils/calc');
const { reply, replyWithImage, replyCarousel } = require('../../utils/response');

module.exports = async function authHandler(ctx) {
  const { userId, msg, u, res, saveUser, deleteUser } = ctx;
  
  // ========================================
  // 시작 (비로그인)
  // ========================================
  if (msg === '시작' && !u) {
    const newUser = {
      phase: 'naming',
      createdAt: new Date().toISOString()
    };
    await saveUser(userId, newUser);
    return res.json(reply('🏔️ 에테르의 탑에 오신 것을 환영합니다.\n\n캐릭터 이름을 입력하세요. (2~8자)', []));
  }
  
  // ========================================
  // 이름 입력
  // ========================================
  if (u?.phase === 'naming') {
    const name = msg.trim();
    
    if (name.length < 2 || name.length > 8) {
      return res.json(reply('이름은 2~8자로 입력해주세요.', []));
    }
    
    if (/[^가-힣a-zA-Z0-9]/.test(name)) {
      return res.json(reply('한글, 영문, 숫자만 사용 가능합니다.', []));
    }
    
    u.name = name;
    u.phase = 'job';
    await saveUser(userId, u);
    
    // 직업 선택 캐러셀
    const jobCards = Object.entries(JOBS).map(([key, job]) => ({
      title: `${job.icon} ${job.name}`,
      desc: `[${job.role}]\n${job.desc}`,
      image: JOB_IMAGES[key] || null,
      buttons: [{ label: job.name, action: job.name }]
    }));
    
    return res.json(replyCarousel(jobCards));
  }
  
  // ========================================
  // 직업 선택 (v4.0 수정)
  // ========================================
  if (u?.phase === 'job') {
    const jobEntry = Object.entries(JOBS).find(([key, job]) => job.name === msg);
    
    if (!jobEntry) {
      // 다시 캐러셀 표시
      const jobCards = Object.entries(JOBS).map(([key, job]) => ({
        title: `${job.icon} ${job.name}`,
        desc: `[${job.role}]\n${job.desc}`,
        image: JOB_IMAGES[key] || null,
        buttons: [{ label: job.name, action: job.name }]
      }));
      
      return res.json(replyCarousel(jobCards));
    }
    
    const [jobKey, job] = jobEntry;
    
    // 초기 캐릭터 생성 (v4.0)
    const initialStats = job.baseStats ? { ...job.baseStats } : {
      str: 10, dex: 10, int: 10, wil: 10, vit: 10, luk: 10
    };
    
    const newUser = {
      // 기본 정보
      name: u.name,
      job: jobKey,
      lv: 1,
      level: 1,
      exp: 0,
      gold: 150,
      floor: 1,
      maxFloor: 1,
      phase: 'town',
      
      // 스탯
      stats: initialStats,
      statPoints: 5,
      hp: 0,  // calcStats로 계산
      maxHp: 0,
      
      // 전투 리소스
      focus: 60,
      maxFocus: 100,
      madness: 0,
      
      // 장비/인벤
      curses: [],
      equipment: { weapon: null, armor: null, accessory: null, relic: null },
      inventory: [],
      
      // 스킬/물약
      skillCd: 0,
      potions: 3,
      mediumPotions: 0,
      hiPotions: 1,
      potionCooldown: 0,
      potionsUsedInBattle: 0,
      
      // 소셜
      duelWins: 0,
      duelLosses: 0,
      
      // 탐사
      explores: {},
      treasureNext: false,
      
      // 보스
      bossKills: {},
      
      // UI
      tutorialDone: false,
      lastSeenNotice: '',
      inventoryPage: 0,
      
      // v4.0 필드 추가
      battleUnderstanding: {},
      interpretStreak: 0,
      totalBattles: 0,
      totalDeaths: 0,
      totalKills: 0,
      totalBossKills: 0,
      totalPlaytime: 0,
      loginCount: 1,
      loginStreak: 1,
      lastLoginDate: new Date().toISOString().split('T')[0],
      maxLevel: 1,
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      hunterStacks: 0,
      usedSurvival: false,
      
      // 생성 일시
      createdAt: u.createdAt || new Date().toISOString()
    };
    
    // HP 계산
    const c = calcStats(newUser);
    newUser.hp = c.maxHp;
    newUser.maxHp = c.maxHp;
    
    await saveUser(userId, newUser);
    
    // v4.0: passives 배열 순회
    const passiveList = job.passives
      .map(p => `• ${p.name}: ${p.desc}`)
      .join('\n');
    
    const jobImg = JOB_IMAGES[jobKey];
    const text = `${job.icon} ${job.name} 각성!
━━━━━━━━━━━━━━━
【 패시브 】
${passiveList}

【 스킬 】${job.skill.name}
${job.skill.desc}

❤️ HP: ${c.maxHp}
⚔️ 공격: ${c.atk} | 🛡️ 방어: ${c.def}
💰 150G | 🧪3 | 💊1 | ⭐5점`;
    
    if (jobImg) {
      return res.json(replyWithImage(jobImg, text, ['마을']));
    }
    return res.json(reply(text, ['마을']));
  }
  
  // ========================================
  // 초기화
  // ========================================
  if (msg === '초기화' && u) {
    u.phase = 'confirm_reset';
    await saveUser(userId, u);
    return res.json(reply(
      `⚠️ 초기화\n${u.name} Lv.${u.lv || 1}\n\n정말 캐릭터를 삭제하시겠습니까?\n모든 데이터가 삭제됩니다.\n\n"초기화확인" 입력시 삭제됩니다.`,
      ['초기화확인', '마을']
    ));
  }
  
  if (msg === '초기화확인' && u?.phase === 'confirm_reset') {
    await deleteUser(userId);
    return res.json(reply('캐릭터가 삭제되었습니다.\n\n"시작"으로 새 게임을 시작하세요.', ['시작']));
  }
  
  // 기타
  if (u?.phase === 'confirm_reset') {
    u.phase = 'town';
    await saveUser(userId, u);
    return res.json(reply('초기화가 취소되었습니다.', ['마을']));
  }
  
  return res.json(reply('알 수 없는 오류', ['마을']));
};
