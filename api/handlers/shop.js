// ============================================
// Shop Handler v4.1
// 상점 (물약 구매)
// ============================================

const { SEDATIVE } = require('../../data/items');
const { reply, replyListCard } = require('../../utils/response');

module.exports = async function shopHandler(ctx) {
  const { userId, msg, u, c, res, saveUser } = ctx;
  
  const floor = u.floor || 1;
  const basicPrice = 30 + floor * 2;
  const mediumPrice = 100 + floor * 4;
  const highPrice = 300 + floor * 6;
  
  // ========================================
  // 상점 메뉴 — listCard 적용
  // ========================================
  if (msg === '상점') {
    // 헤더
    const header = `🛒 상점 (💰 ${(u.gold || 0).toLocaleString()}G)`;

    // 아이템 목록
    const items = [
      {
        title: '🧪 하급 물약',
        description: `${basicPrice}G (보유: ${u.potions || 0})`,
        action: 'message',
        messageText: '물약+1'
      }
    ];

    // 11층+ 중급 물약
    if (floor >= 11) {
      items.push({
        title: '🧪 중급 물약',
        description: `${mediumPrice}G (보유: ${u.mediumPotions || 0})`,
        action: 'message',
        messageText: '중급물약+1'
      });
    }

    // 31층+ 고급 물약
    if (floor >= 31) {
      items.push({
        title: '🧪 고급 물약',
        description: `${highPrice}G (보유: ${u.hiPotions || 0})`,
        action: 'message',
        messageText: '고급물약+1'
      });
    }

    // 6층+ 진정제
    if (floor >= 6) {
      items.push({
        title: '💊 진정제',
        description: `${SEDATIVE.price}G (광기 -30, 보유: ${u.sedatives || 0})`,
        action: 'message',
        messageText: '진정제'
      });
    }

    // 버튼 (최대 2개)
    const buttons = ['물약+5', '마을'];

    return res.json(replyListCard(header, items, buttons));
  }
  
  // ========================================
  // 하급 물약 구매
  // ========================================
  if (msg === '하급' || msg === '하급물약' || msg === '물약구매') {
    const cost = basicPrice;
    
    if ((u.gold || 0) < cost) {
      return res.json(reply(`골드 부족! (${cost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + cost;
    u.potions = (u.potions || 0) + 1;
    await saveUser(userId, u);
    
    return res.json(reply(
      `🧪 하급 물약 구매! (${u.potions}개)\n-${cost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // 하급 물약 다중 구매
  const basicMultiMatch = msg.match(/^물약\+(\d+)$/);
  if (basicMultiMatch) {
    const amount = parseInt(basicMultiMatch[1]);
    const totalCost = basicPrice * amount;
    
    if ((u.gold || 0) < totalCost) {
      return res.json(reply(`골드 부족! (${totalCost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= totalCost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + totalCost;
    u.potions = (u.potions || 0) + amount;
    await saveUser(userId, u);
    
    return res.json(reply(
      `🧪 하급 물약 ${amount}개 구매! (보유: ${u.potions}개)\n-${totalCost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // ========================================
  // 중급 물약 구매
  // ========================================
  if (msg === '중급' || msg === '중급물약' || msg === '중급물약구매') {
    if (floor < 11) {
      return res.json(reply('11층부터 구매 가능합니다.', ['상점', '마을']));
    }
    
    const cost = mediumPrice;
    
    if ((u.gold || 0) < cost) {
      return res.json(reply(`골드 부족! (${cost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + cost;
    u.mediumPotions = (u.mediumPotions || 0) + 1;
    await saveUser(userId, u);
    
    return res.json(reply(
      `🧪 중급 물약 구매! (${u.mediumPotions}개)\n-${cost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // 중급 물약 다중 구매
  const mediumMultiMatch = msg.match(/^중급물약\+(\d+)$/);
  if (mediumMultiMatch) {
    if (floor < 11) {
      return res.json(reply('11층부터 구매 가능합니다.', ['상점', '마을']));
    }
    
    const amount = parseInt(mediumMultiMatch[1]);
    const totalCost = mediumPrice * amount;
    
    if ((u.gold || 0) < totalCost) {
      return res.json(reply(`골드 부족! (${totalCost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= totalCost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + totalCost;
    u.mediumPotions = (u.mediumPotions || 0) + amount;
    await saveUser(userId, u);
    
    return res.json(reply(
      `🧪 중급 물약 ${amount}개 구매! (보유: ${u.mediumPotions}개)\n-${totalCost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // ========================================
  // 고급 물약 구매
  // ========================================
  if (msg === '고급' || msg === '고급물약' || msg === '고급물약구매') {
    if (floor < 31) {
      return res.json(reply('31층부터 구매 가능합니다.', ['상점', '마을']));
    }
    
    const cost = highPrice;
    
    if ((u.gold || 0) < cost) {
      return res.json(reply(`골드 부족! (${cost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + cost;
    u.hiPotions = (u.hiPotions || 0) + 1;
    await saveUser(userId, u);
    
    return res.json(reply(
      `💊 고급 물약 구매! (${u.hiPotions}개)\n-${cost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // 고급 물약 다중 구매
  const highMultiMatch = msg.match(/^고급물약\+(\d+)$/);
  if (highMultiMatch) {
    if (floor < 31) {
      return res.json(reply('31층부터 구매 가능합니다.', ['상점', '마을']));
    }
    
    const amount = parseInt(highMultiMatch[1]);
    const totalCost = highPrice * amount;
    
    if ((u.gold || 0) < totalCost) {
      return res.json(reply(`골드 부족! (${totalCost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= totalCost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + totalCost;
    u.hiPotions = (u.hiPotions || 0) + amount;
    await saveUser(userId, u);
    
    return res.json(reply(
      `💊 고급 물약 ${amount}개 구매! (보유: ${u.hiPotions}개)\n-${totalCost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  // ========================================
  // 진정제 구매
  // ========================================
  if (msg === '진정제구매' || msg === '진정제') {
    if (floor < 6) {
      return res.json(reply('6층부터 구매 가능합니다.', ['상점', '마을']));
    }
    
    const cost = SEDATIVE.price;
    
    if ((u.gold || 0) < cost) {
      return res.json(reply(`골드 부족! (${cost}G 필요)`, ['상점', '마을']));
    }
    
    u.gold -= cost;
    u.totalGoldSpent = (u.totalGoldSpent || 0) + cost;
    u.madness = Math.max(0, (u.madness || 0) + SEDATIVE.effect);
    await saveUser(userId, u);
    
    return res.json(reply(
      `💊 진정제 복용!\n🌀 광기 ${SEDATIVE.effect}\n-${cost}G | 💰${u.gold}G`,
      ['상점', '마을']
    ));
  }
  
  return res.json(reply('알 수 없는 상점 명령어', ['상점', '마을']));
};
