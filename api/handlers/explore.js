// ============================================
// Explore Handler v4.0
// 탐사 시스템
// ============================================

const { EXPLORE_CONFIG } = require('../../data/config');
const { reply } = require('../../utils/response');
const { getExploreText } = require('../../utils/text');
const { spawnMonster, selectPattern, getTelegraph, getChoices, getBattleUnderstandingLevel } = require('../../systems/battle');
const { generateItem, getItemDisplay } = require('../../systems/items');
const { recordBattleStart } = require('../../utils/stats');

const getTodayKey = () => new Date().toISOString().split('T')[0];

module.exports = async function exploreHandler(ctx) {
  const { userId, msg, u, c, res, saveUser } = ctx;
  
  // ========================================
  // 탐사 메뉴
  // ========================================
  if (msg === '탐사') {
    const safe = EXPLORE_CONFIG.safe;
    const danger = EXPLORE_CONFIG.danger;
    const forbidden = EXPLORE_CONFIG.forbidden;

    let text = `━━━━━━━━━━━━━━━━\n`;
    text += `🧭 탐사\n`;
    text += `━━━━━━━━━━━━━━━━\n`;
    text += `💰 소지금: ${(u.gold || 0).toLocaleString()}G\n\n`;
    text += `【 탐사 종류 】\n`;
    text += `🟢 안전탐사 — ${safe.cost}G\n`;
    text += `   낮은 위험, 기본 보상\n\n`;
    text += `🟡 위험탐사 — ${danger.cost}G\n`;
    text += `   중간 위험, 좋은 보상\n\n`;
    text += `🔴 금기탐사 — ${forbidden.cost}G\n`;
    text += `   높은 위험, 희귀 보상\n`;
    text += `   ⚠️ 광기 +20\n\n`;
    text += `💡 탐사 시 랜덤 이벤트 발생`;

    return res.json(reply(text, ['안전탐사', '위험탐사', '금기탐사', '마을']));
  }
  
  // ========================================
  // 모닥불
  // ========================================
  if (msg === '모닥불') {
    // 15% 확률로 습격
    if (Math.random() < 0.15) {
      const monster = spawnMonster(u.floor);
      
      // 전투 통계 기록
      recordBattleStart(u, monster);
      
      // 이해도 레벨 확인
      const understandingLevel = getBattleUnderstandingLevel(u, monster);
      
      // 패턴 선택
      const pattern = selectPattern(monster);
      const telegraph = getTelegraph(pattern, understandingLevel);
      const choices = getChoices(pattern, understandingLevel);
      
      u.phase = 'battle';
      u.monster = monster;
      u.currentPattern = pattern;
      u.understandingLevel = understandingLevel;
      u.battleTurn = 1;
      u.madnessOpen = false;
      u.interpretStreak = 0;
      u.hunterStacks = 0;
      u.usedSurvival = false;
      u.potionsUsedInBattle = 0;
      
      await saveUser(userId, u);
      
      const validChoices = choices.filter(c => c !== '???');
      const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
      
      return res.json(reply(
        `🔥 모닥불을 피웠는데...\n` +
        `⚠️ **습격!**\n\n` +
        `${monster.name} 출현!\n` +
        `👹 ${monster.hp}/${monster.hp}\n` +
        `❤️ ${u.hp}/${c.maxHp}\n\n` +
        `📖 전조\n${telegraph}`,
        buttons
      ));
    }
    
    // 안전하게 휴식
    const hpRecover = Math.floor(c.maxHp * 0.5);
    const focusRecover = 30;
    
    u.hp = Math.min(c.maxHp, (u.hp || 0) + hpRecover);
    u.focus = Math.min(u.maxFocus || 100, (u.focus || 0) + focusRecover);
    
    await saveUser(userId, u);
    
    return res.json(reply(
      `🔥 모닥불 옆에서 잠시 쉬었다.\n\n` +
      `❤️ HP +${hpRecover} → ${u.hp}/${c.maxHp}\n` +
      `⚡ 집중력 +${focusRecover} → ${u.focus}/${u.maxFocus || 100}\n\n` +
      `💡 마을로 돌아가면 완전 회복`,
      ['전투', '마을']
    ));
  }
  
  // ========================================
  // 안전/위험/금기 탐사
  // ========================================
  const exploreTypes = {
    '안전탐사': 'safe',
    '위험탐사': 'danger',
    '금기탐사': 'forbidden'
  };
  
  const tierKey = exploreTypes[msg];
  
  if (tierKey) {
    const config = EXPLORE_CONFIG[tierKey];
    const today = getTodayKey();
    
    u.explores = u.explores || {};
    u.explores[today] = u.explores[today] || { safe: 0, danger: 0, forbidden: 0 };
    
    if ((u.explores[today][tierKey] || 0) >= config.maxDaily) {
      return res.json(reply('오늘의 탐사 횟수를 모두 사용했습니다!', ['탐사', '마을']));
    }
    
    if ((u.gold || 0) < config.cost) {
      return res.json(reply(`골드 부족! (${config.cost}G 필요)`, ['탐사', '마을']));
    }
    
    u.gold -= config.cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + config.cost;
    u.explores[today][tierKey]++;
    
    const roll = Math.random() * 100;
    
    // 지도로 보물 확정
    if (u.treasureNext) {
      u.treasureNext = false;
      const item = generateItem(3, u.floor || 1);
      if (item) u.inventory = [...(u.inventory || []), item];
      u.gold += 100;
      await saveUser(userId, u);
      
      return res.json(reply(
        `📦 보물 발견! +100G\n${item ? getItemDisplay(item) : ''}`,
        ['탐사', '마을']
      ));
    }
    
    // 전투 발생
    if (roll < config.battleRate) {
      const monster = spawnMonster(u.floor);
      
      // 전투 통계 기록
      recordBattleStart(u, monster);
      
      // 이해도 레벨 확인
      const understandingLevel = getBattleUnderstandingLevel(u, monster);
      
      // 패턴 선택
      const pattern = selectPattern(monster);
      const telegraph = getTelegraph(pattern, understandingLevel);
      const choices = getChoices(pattern, understandingLevel);
      
      u.phase = 'battle';
      u.monster = monster;
      u.currentPattern = pattern;
      u.understandingLevel = understandingLevel;
      u.battleTurn = 1;
      u.madnessOpen = tierKey === 'forbidden';
      u.interpretStreak = 0;
      u.hunterStacks = 0;
      u.usedSurvival = false;
      u.potionsUsedInBattle = 0;
      
      await saveUser(userId, u);
      
      const validChoices = choices.filter(c => c !== '???');
      const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
      
      return res.json(reply(
        `⚔️ 전투 발생!\n\n${monster.name}\n📖 전조\n${telegraph}`,
        buttons
      ));
    }
    
    // 아이템 획득
    if (roll < config.battleRate + config.itemRate) {
      const guaranteeRare = tierKey === 'forbidden' && Math.random() < 0.3;
      const item = generateItem(u.floor || 1, guaranteeRare ? 'rare' : null);
      
      if (item) {
        u.inventory = [...(u.inventory || []), item];
        await saveUser(userId, u);
        
        return res.json(reply(
          `📦 발견!\n${getItemDisplay(item)}`,
          ['탐사', '마을']
        ));
      }
    }
    
    // 골드 획득
    if (roll < config.battleRate + config.itemRate + config.goldRate) {
      const goldAmount = Math.floor(50 + (u.floor || 1) * 10 + Math.random() * 50);
      u.gold += goldAmount;
      u.totalGoldEarned = (u.totalGoldEarned || 0) + goldAmount;
      await saveUser(userId, u);
      
      return res.json(reply(
        `💰 ${goldAmount}G 획득!`,
        ['탐사', '마을']
      ));
    }
    
    // 아무 일도 없음
    await saveUser(userId, u);
    return res.json(reply('조용하다...', ['탐사', '마을']));
  }
  
  // ========================================
  // 이벤트 처리 (event_ phase)
  // ========================================
  if (u.phase && u.phase.startsWith('event_')) {
    // 간단히 종료 처리
    u.phase = 'town';
    await saveUser(userId, u);
    return res.json(reply('이벤트가 종료되었습니다.', ['탐사', '마을']));
  }
  
  return res.json(reply('알 수 없는 탐사 명령어', ['탐사', '마을']));
};
