// ============================================
// Town Handler v4.0
// 마을 메뉴 (휴식, 층이동, 스탯투자, 상태)
// ============================================

const { NOTICE } = require('../../data');
const { JOBS, JOB_IMAGES } = require('../../data');
const { STAT_NAMES, STAT_KOREAN, MADNESS_SYSTEM, CURSE_CONFIG } = require('../../data/config');
const { CURSES } = require('../../data/items');
const { getReqExp, calcStats } = require('../../utils/calc');
const { reply, replyWithImage } = require('../../utils/response');
const { getTownText, createHPBar } = require('../../utils/text');

// ============================================
// Main Handler
// ============================================

module.exports = async function townHandler(ctx) {
  const { userId, msg, u, c, res, saveUser } = ctx;
  
  // ========================================
  // 마을
  // ========================================
  if (msg === '마을') {
    const floor = u.floor || 1;
    const goalFloor = Math.ceil(floor / 10) * 10; // 목표층 (10, 20, 30...)

    // 레벨업 체크 (먼저 처리)
    let levelUpMsg = '';
    let totalLevels = 0;

    while ((u.exp || 0) >= getReqExp(u.lv || 1)) {
      const req = getReqExp(u.lv || 1);
      u.lv = (u.lv || 1) + 1;
      u.level = u.lv;
      u.exp = (u.exp || 0) - req;
      u.statPoints = (u.statPoints || 0) + 3;
      totalLevels++;
    }

    if (totalLevels > 0) {
      const nc = calcStats(u);
      u.hp = nc.maxHp;
      u.maxHp = nc.maxHp;
      u.focus = u.maxFocus || 100;
      levelUpMsg = `\n\n🌟✨ 레벨 업! Lv.${u.lv} (+${totalLevels * 3}점)`;

      // maxLevel 갱신
      if (u.lv > (u.maxLevel || 1)) {
        u.maxLevel = u.lv;
      }

      await saveUser(userId, u);
    }

    // 스탯 계산 (레벨업 후)
    const nc = calcStats(u);
    const hpBar = createHPBar(u.hp || 0, nc.maxHp || 1, 10);

    // 새 마을 형식
    let townText = `━━━━━━━━━━━━━━━━\n`;
    townText += `🏘️ 마을\n`;
    townText += `━━━━━━━━━━━━━━━━\n`;
    townText += `👤 ${u.name} Lv.${u.lv || 1}\n`;
    townText += `❤️ [${hpBar}] ${u.hp || 0}/${nc.maxHp}\n`;
    townText += `💰 ${(u.gold || 0).toLocaleString()}G | 🌀 광기 ${u.madness || 0}\n\n`;
    townText += `🏔️ 현재: ${floor}층\n`;
    townText += `🎯 목표: ${goalFloor}층 보스 처치`;

    // 공지 알림
    if (u.lastSeenNotice !== NOTICE.version) {
      townText += `\n\n📢 ${NOTICE.version} 업데이트! (@공지)`;
    }

    // 스탯 포인트 알림
    if ((u.statPoints || 0) > 0) {
      townText += `\n\n⭐ 미배분 스탯 ${u.statPoints}점!`;
    }

    townText += levelUpMsg;

    // 첫 방문 튜토리얼
    if (!u.tutorialDone) {
      townText += `\n\n💡 첫 모험 가이드:\n`;
      townText += `• [전투] - 몬스터와 싸워 경험치/골드\n`;
      townText += `• [장비] - 획득한 장비 장착\n`;
      townText += `• [상점] - 물약 구매\n`;
      townText += `• [더보기] - 탐사, 휴식 등`;

      u.tutorialDone = true;
      await saveUser(userId, u);
    }

    const jobImg = JOB_IMAGES[u.job];
    if (jobImg) {
      return res.json(replyWithImage(jobImg, townText, ['전투', '장비', '상점', '더보기']));
    }
    return res.json(reply(townText, ['전투', '장비', '상점', '더보기']));
  }
  
  // ========================================
  // 휴식
  // ========================================
  if (msg === '휴식') {
    u.hp = c.maxHp;
    u.focus = u.maxFocus || 100;
    u.skillCd = 0;
    
    // 광기 감소
    let madnessDecay = 0;
    if (u.job === 'heretic') {
      madnessDecay = MADNESS_SYSTEM?.decay?.rest || 20;
      u.madness = Math.max(0, (u.madness || 0) - madnessDecay);
    }
    
    // 저주 해제 확률
    let curseRemoved = false;
    if ((u.curses || []).length > 0 && Math.random() < (CURSE_CONFIG?.removal?.restChance || 0.1)) {
      const removed = u.curses.shift();
      const curseData = CURSES[removed.id];
      curseRemoved = curseData ? curseData.name : '저주';
    }
    
    await saveUser(userId, u);
    
    let restText = `🏠 마을에서 편히 쉬었다.\n\n`;
    restText += `❤️ HP 완전 회복: ${u.hp}/${c.maxHp}\n`;
    restText += `⚡ 집중력 회복: ${u.focus}/${u.maxFocus || 100}`;
    if (madnessDecay > 0) restText += `\n🌀 광기 -${madnessDecay}`;
    if (curseRemoved) restText += `\n✨ ${curseRemoved} 해제됨!`;
    
    return res.json(reply(restText, ['전투', '탐사', '상점', '마을']));
  }
  
  // ========================================
  // 더보기
  // ========================================
  if (msg === '더보기') {
    return res.json(reply(
      '📋 더보기\n━━━━━━━━━━━━━━━\n' +
      '🏔️ 탐사 / 층이동 / 모닥불\n' +
      '🏆 랭킹 / 전투력랭킹\n' +
      '👥 @결투 / @검색 / @선물\n' +
      '📢 @자랑 / @초대\n' +
      '📚 @도움말 / @가이드\n' +
      '⚙️ 초기화',
      ['탐사', '층이동', '모닥불', '랭킹', '@도움말', '마을']
    ));
  }
  
  // ========================================
  // 층이동
  // ========================================
  if (msg === '층이동') {
    const floors = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(f => f <= (u.maxFloor || 1));
    return res.json(reply(
      `🏔️ 에테르의 탑\n` +
      `현재: ${u.floor || 1}층 / 최고: ${u.maxFloor || 1}층 / 정상: 100층\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `이동 가능: ${floors.join(', ')}층`,
      floors.map(f => `${f}층`).concat(['마을'])
    ));
  }
  
  const floorMatch = msg.match(/^(\d+)층$/);
  if (floorMatch) {
    const targetFloor = parseInt(floorMatch[1]);
    
    if (targetFloor > (u.maxFloor || 1)) {
      return res.json(reply('아직 도달하지 못한 층입니다.', ['층이동', '마을']));
    }
    
    u.floor = targetFloor;
    const decayAmount = MADNESS_SYSTEM?.decay?.perFloor || 5;
    u.madness = Math.max(0, (u.madness || 0) - decayAmount);
    await saveUser(userId, u);
    
    return res.json(reply(
      `🏔️ ${targetFloor}층으로 이동!\n🌀 광기 -${decayAmount}`,
      ['전투', '탐사', '마을']
    ));
  }
  
  // ========================================
  // 상태
  // ========================================
  if (msg === '상태') {
    const job = JOBS[u.job];
    const { calcPower } = require('../../utils/calc');
    const power = calcPower(u);
    const req = getReqExp(u.lv || 1);
    const jobImg = JOB_IMAGES[u.job];
    
    let text = `📊 ${u.name}\n━━━━━━━━━━━━━━━\n`;
    text += `${job?.icon || ''} ${job?.name || '무직'} Lv.${u.lv || 1}\n`;
    text += `⚔️ 전투력: ${power}\n`;
    text += `📈 EXP: ${u.exp || 0}/${req}\n\n`;
    text += `❤️ HP: ${u.hp}/${c.maxHp}\n`;
    text += `⚡ 집중: ${u.focus || 0}\n`;
    text += `🌀 광기: ${u.madness || 0}\n\n`;
    text += `【 스탯 】\n`;
    text += `힘:${u.stats.str} 민:${u.stats.dex} 지:${u.stats.int}\n`;
    text += `의:${u.stats.wil} 체:${u.stats.vit} 운:${u.stats.luk}\n`;
    text += `\n【 전투 】\n`;
    text += `공격: ${c.atk} | 방어: ${c.def}\n`;
    text += `회피: ${c.evasion}% | 크리: ${c.critRate}%\n`;
    text += `크리뎀: ${c.critDmg}% | 해석: ${c.interpret}%`;
    
    if ((u.curses || []).length > 0) {
      text += `\n\n【 저주 】\n`;
      u.curses.forEach(curse => {
        const curseData = CURSES[curse.id];
        if (curseData) text += `${curseData.icon} ${curseData.name}\n`;
      });
    }
    
    if ((u.statPoints || 0) > 0) {
      text += `\n\n⭐ 미배분: ${u.statPoints}점`;
    }
    
    const buttons = (u.statPoints || 0) > 0 
      ? ['스탯투자', '저주해제', '장비', '마을']
      : ['저주해제', '장비', '마을'];
    
    if (jobImg) {
      return res.json(replyWithImage(jobImg, text, buttons));
    }
    return res.json(reply(text, buttons));
  }
  
  // ========================================
  // 스탯투자
  // ========================================
  if (msg === '스탯투자' || msg === '스탯') {
    if ((u.statPoints || 0) <= 0) {
      return res.json(reply('스탯 포인트가 없습니다.', ['상태', '마을']));
    }
    
    return res.json(reply(
      `⭐ 스탯 투자 (${u.statPoints}점)\n` +
      `━━━━━━━━━━━━━━━\n` +
      `힘:${u.stats.str} 민첩:${u.stats.dex} 지능:${u.stats.int}\n` +
      `의지:${u.stats.wil} 체력:${u.stats.vit} 운:${u.stats.luk}\n\n` +
      `💡 입력 예시:\n` +
      `힘+5, 체력+10, 민첩+전부`,
      ['마을']
    ));
  }
  
  const statPattern = /^(힘|민첩|지능|의지|체력|운|행운)\+(\d+|전부)$/;
  const statMatch = msg.match(statPattern);
  if (statMatch) {
    const koreanName = statMatch[1];
    const statName = STAT_NAMES[koreanName];
    
    if (!statName) {
      return res.json(reply('알 수 없는 스탯입니다.', ['상태', '마을']));
    }
    
    if ((u.statPoints || 0) <= 0) {
      return res.json(reply('스탯 포인트가 부족합니다!', ['상태', '마을']));
    }
    
    let amount = statMatch[2] === '전부' 
      ? u.statPoints 
      : Math.min(parseInt(statMatch[2]), u.statPoints);
    
    u.stats[statName] = (u.stats[statName] || 0) + amount;
    u.statPoints -= amount;
    
    const newC = calcStats(u);
    u.maxHp = newC.maxHp;
    
    await saveUser(userId, u);
    
    const buttons = u.statPoints > 0 
      ? ['힘+5', '민첩+5', '체력+5', '마을']
      : ['상태', '마을'];
    
    return res.json(reply(
      `✅ ${STAT_KOREAN[statName]} +${amount}\n남은 포인트: ${u.statPoints}`,
      buttons
    ));
  }
  
  // ========================================
  // 저주해제
  // ========================================
  if (msg === '저주해제' || msg === '정화') {
    if ((u.curses || []).length === 0) {
      return res.json(reply('저주가 없습니다.', ['상태', '마을']));
    }
    
    const cost = CURSE_CONFIG.removal.npcCost(u.curses.length);
    
    if ((u.gold || 0) < cost) {
      return res.json(reply(`골드 부족! (${cost}G 필요)`, ['상태', '마을']));
    }
    
    u.gold -= cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + cost;
    const removed = u.curses.shift();
    const curseData = CURSES[removed.id];
    await saveUser(userId, u);
    
    const buttons = u.curses.length > 0 
      ? ['저주해제', '상태', '마을']
      : ['상태', '마을'];
    
    return res.json(reply(
      `✨ 정화 완료!\n${curseData.icon} ${curseData.name} 해제\n-${cost}G`,
      buttons
    ));
  }
  
  return res.json(reply('알 수 없는 명령어', ['마을']));
};
