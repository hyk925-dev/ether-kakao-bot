// ============================================
// Social Handler v4.0
// 소셜 기능 (랭킹, 결투, 선물)
// ============================================

const { JOBS, JOB_IMAGES } = require('../../data');
const { DUEL_CONFIG, KAKAO_CHANNEL_URL } = require('../../data/config');
const { calcPower, calcStats } = require('../../utils/calc');
const { reply } = require('../../utils/response');
const { simulateDuel } = require('../../systems/battle');

module.exports = async function socialHandler(ctx) {
  const { userId, msg, u, res, saveUser, getUserByName, getTopUsers } = ctx;
  
  // ========================================
  // 랭킹
  // ========================================
  if (msg === '랭킹') {
    const ranks = await getTopUsers('floor', 10);
    let text = '🏆 층수 랭킹\n━━━━━━━━━━━━━━━\n';
    
    ranks.forEach(r => {
      const job = JOBS[r.job];
      text += `${r.rank}. ${job?.icon || ''}${r.name} Lv.${r.lv || r.level || 1} (${r.floor || 1}층)\n`;
    });
    
    if (ranks.length === 0) {
      text = '아직 모험가가 없습니다.';
    }
    
    return res.json(reply(text, u ? ['마을', '전투력랭킹'] : ['시작', '전투력랭킹']));
  }
  
  // ========================================
  // 전투력 랭킹
  // ========================================
  if (msg === '전투력랭킹') {
    const { getAllTownUsers } = require('../../utils/db');
    let players = await getAllTownUsers();
    
    players = players.map(p => ({ ...p, power: calcPower(p) }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 10);
    
    let text = '⚔️ 전투력 랭킹\n━━━━━━━━━━━━━━━\n';
    
    players.forEach((p, i) => {
      text += `${i + 1}. ${JOBS[p.job]?.icon || ''}${p.name} - ${p.power}\n`;
    });
    
    if (players.length === 0) {
      text = '아직 모험가가 없습니다.';
    }
    
    return res.json(reply(text, u ? ['마을', '랭킹'] : ['시작', '랭킹']));
  }
  
  // ========================================
  // @검색
  // ========================================
  if (msg.startsWith('@검색 ')) {
    const targetName = msg.replace('@검색 ', '').trim();
    const target = await getUserByName(targetName);
    
    if (!target) {
      return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['랭킹', '마을']));
    }
    
    const tc = calcStats(target);
    const tPower = calcPower(target);
    const tJob = JOBS[target.job];
    
    let text = `👤 ${target.name}\n━━━━━━━━━━━━━━━\n`;
    text += `${tJob?.icon || ''} ${tJob?.name || '무직'} Lv.${target.lv || target.level || 1}\n`;
    text += `⚔️ 전투력: ${tPower}\n`;
    text += `🏔️ 최고 ${target.maxFloor || 1}층\n`;
    text += `공격: ${tc.atk} | 방어: ${tc.def}\n`;
    text += `📊 결투: ${target.duelWins || 0}승 ${target.duelLosses || 0}패`;
    
    const buttons = u && target.name !== u.name 
      ? [`@결투 ${target.name}`, '랭킹', '마을']
      : ['랭킹', '마을'];
    
    return res.json(reply(text, buttons));
  }
  
  // ========================================
  // @결투
  // ========================================
  if (msg.startsWith('@결투 ')) {
    if (!u) {
      return res.json(reply('먼저 게임을 시작해주세요.', ['시작']));
    }
    
    if (u.phase !== 'town') {
      return res.json(reply('마을에서만 결투 가능합니다.', ['마을']));
    }
    
    const targetName = msg.replace('@결투 ', '').trim();
    
    if (targetName === u.name) {
      return res.json(reply('자신과는 결투할 수 없습니다.', ['마을']));
    }
    
    const target = await getUserByName(targetName);
    
    if (!target) {
      return res.json(reply(`"${targetName}" 플레이어를 찾을 수 없습니다.`, ['랭킹', '마을']));
    }
    
    if ((u.gold || 0) < DUEL_CONFIG.cost) {
      return res.json(reply(`골드 부족! (${DUEL_CONFIG.cost}G 필요)`, ['마을']));
    }
    
    u.gold -= DUEL_CONFIG.cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + DUEL_CONFIG.cost;
    
    const result = simulateDuel(u, target);
    const isWinner = result.winner.name === u.name;
    
    if (isWinner) {
      u.gold += DUEL_CONFIG.winnerGold;
      u.totalGoldEarned = (u.totalGoldEarned || 0) + DUEL_CONFIG.winnerGold;
      u.exp = (u.exp || 0) + DUEL_CONFIG.winnerExp;
      u.duelWins = (u.duelWins || 0) + 1;
    } else {
      u.duelLosses = (u.duelLosses || 0) + 1;
    }
    
    await saveUser(userId, u);
    
    let text = `⚔️ ${u.name} vs ${target.name}\n━━━━━━━━━━━━━━━\n`;
    text += `${result.log.join('\n')}\n\n`;
    text += `🏆 ${result.winner.name} 승리!\n`;
    text += isWinner 
      ? `+${DUEL_CONFIG.winnerGold}G +${DUEL_CONFIG.winnerExp}EXP`
      : `-${DUEL_CONFIG.cost}G`;
    
    return res.json(reply(text, ['마을', '랭킹']));
  }
  
  // ========================================
  // @선물
  // ========================================
  if (msg.startsWith('@선물 ')) {
    if (!u) {
      return res.json(reply('먼저 게임을 시작해주세요.', ['시작']));
    }
    
    if (u.phase !== 'town') {
      return res.json(reply('마을에서만 선물 가능합니다.', ['마을']));
    }
    
    const parts = msg.replace('@선물 ', '').trim().split(' ');
    
    if (parts.length < 2) {
      return res.json(reply('사용법: @선물 [이름] [금액]', ['마을']));
    }
    
    const amount = parseInt(parts.pop());
    const targetName = parts.join(' ');
    
    if (isNaN(amount) || amount <= 0 || amount > 50000) {
      return res.json(reply('1~50000G 범위로 입력해주세요.', ['마을']));
    }
    
    if ((u.gold || 0) < amount) {
      return res.json(reply('골드가 부족합니다!', ['마을']));
    }
    
    if (targetName === u.name) {
      return res.json(reply('자신에게는 선물할 수 없습니다.', ['마을']));
    }
    
    const target = await getUserByName(targetName);
    
    if (!target) {
      return res.json(reply('플레이어를 찾을 수 없습니다.', ['마을']));
    }
    
    const fee = Math.floor(amount * 0.05);
    u.gold -= amount;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + amount;
    target.gold = (target.gold || 0) + (amount - fee);
    target.totalGoldEarned = (target.totalGoldEarned || 0) + (amount - fee);
    
    await saveUser(userId, u);
    
    // target 저장 (userId가 아닌 target의 docId 필요)
    // 간단히 처리 - 실제로는 target의 userId를 알아야 함
    const { db } = require('../../utils/db');
    const targetQuery = await db.collection('users').where('name', '==', targetName).limit(1).get();
    if (!targetQuery.empty) {
      const targetDoc = targetQuery.docs[0];
      await targetDoc.ref.update({ 
        gold: target.gold,
        totalGoldEarned: target.totalGoldEarned || 0
      });
    }
    
    return res.json(reply(
      `🎁 ${targetName}에게 ${amount - fee}G 선물!\n(수수료 ${fee}G)\n\n보유: ${u.gold}G`,
      ['마을']
    ));
  }
  
  // ========================================
  // @자랑
  // ========================================
  if (msg === '@자랑') {
    if (!u) {
      return res.json(reply('먼저 게임을 시작해주세요.', ['시작']));
    }
    
    const job = JOBS[u.job];
    const power = calcPower(u);
    const equipped = u.equipment || {};
    
    let text = `【 ${u.name} 】\n`;
    text += `${job?.icon || ''} ${job?.name || '무직'} Lv.${u.lv || u.level || 1}\n`;
    text += `⚔️ 전투력: ${power}\n`;
    text += `🏔️ 최고 ${u.maxFloor || 1}층\n\n`;
    
    const slots = ['weapon', 'armor', 'accessory', 'relic'];
    let hasEquip = false;
    
    slots.forEach(slot => {
      const item = equipped[slot];
      if (item) {
        hasEquip = true;
        const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';
        text += `${item.gradeColor || '⚪'} ${item.name}${enhance}\n`;
      }
    });
    
    if (!hasEquip) {
      text += '(장착한 장비 없음)';
    }
    
    return res.json(reply(text, ['마을']));
  }
  
  // ========================================
  // @초대
  // ========================================
  if (msg === '@초대') {
    return res.json(reply(
      `🏔️ 에테르의 탑에 초대합니다!\n\n` +
      `친구를 초대하고 함께 탑을 올라보세요!\n\n` +
      `${KAKAO_CHANNEL_URL || 'pf.kakao.com/_BqpQn/chat'}`,
      ['마을']
    ));
  }
  
  // ========================================
  // @에테르
  // ========================================
  if (msg === '@에테르') {
    const { getEtherMenu } = require('../../utils/text');
    return res.json(reply(getEtherMenu(), ['마을', '도움말']));
  }
  
  // ========================================
  // @도움말
  // ========================================
  if (msg === '@도움말' || msg === '도움말') {
    const { getHelpText } = require('../../utils/text');
    return res.json(reply(getHelpText(), ['마을', '@에테르']));
  }
  
  // ========================================
  // @가이드
  // ========================================
  if (msg === '@가이드') {
    const { getGuideText } = require('../../utils/text');
    const guideText = getGuideText(u);
    return res.json(reply(guideText, ['마을']));
  }
  
  // ========================================
  // @공지
  // ========================================
  if (msg === '@공지') {
    const { NOTICE } = require('../../data');
    
    if (u) {
      u.lastSeenNotice = NOTICE.version;
      await saveUser(userId, u);
    }
    
    return res.json(reply(
      `📢 ${NOTICE.version}\n━━━━━━━━━━━━━━━\n${NOTICE.content}`,
      u ? ['마을'] : ['시작']
    ));
  }
  
  return null; // 매칭 안 되면 다음 핸들러로
};
