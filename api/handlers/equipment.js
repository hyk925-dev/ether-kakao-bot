// ============================================
// Equipment Handler v4.0
// 장비 관리 (목록, 강화, 판매)
// ============================================

const { reply } = require('../../utils/response');
const { getItemDisplay, getItemStatText } = require('../../systems/items');
const { getEnhanceRate, getEnhanceCost, executeEnhance } = require('../../systems/enhance');

// ============================================
// 헬퍼 함수
// ============================================

function getSlotIcon(slot) {
  const icons = {
    weapon: '⚔️',
    armor: '🛡️',
    accessory: '💍',
    relic: '🔮'
  };
  return icons[slot] || '📦';
}

function getSlotName(slot) {
  const names = {
    weapon: '무기',
    armor: '방어구',
    accessory: '장신구',
    relic: '유물'
  };
  return names[slot] || '장비';
}

// ============================================
// Main Handler
// ============================================

module.exports = async function equipmentHandler(ctx) {
  const { userId, msg, u, c, res, saveUser } = ctx;
  
  // Phase 체크
  if (u.phase !== 'town') {
    return res.json(reply('마을에서만 장비를 관리할 수 있습니다.', ['마을']));
  }
  
  const inventory = u.inventory || [];
  
  // ========================================
  // 1단계: 장비 메인 메뉴
  // ========================================
  if (msg === '장비') {
    const text = `📦 장비 관리\n\n무엇을 하시겠습니까?`;
    return res.json(reply(text, ['목록', '강화', '판매', '마을']));
  }
  
  // ========================================
  // 2단계-A: 목록
  // ========================================
  if (msg === '목록') {
    let text = '📦 장비 목록\n━━━━━━━━━━━━━━━━━━\n';
    text += '【 장착 중 】\n';
    
    const slots = ['weapon', 'armor', 'accessory', 'relic'];
    const equipped = u.equipment || {};
    
    slots.forEach(slot => {
      const item = equipped[slot];
      if (item) {
        const icon = getSlotIcon(slot);
        const displayName = item.nickname || item.name;
        const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';
        text += `${icon} ${displayName}${enhance}\n`;
      } else {
        text += `${getSlotIcon(slot)} ${getSlotName(slot)}: (없음)\n`;
      }
    });
    
    text += '\n【 인벤토리 】\n';
    if (inventory.length === 0) {
      text += '비어있음\n';
    } else {
      inventory.slice(0, 10).forEach((item, i) => {
        const displayName = item.nickname || item.name;
        const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';
        text += `${i + 1}. ${item.gradeColor || '⚪'} ${displayName}${enhance}\n`;
      });
      
      if (inventory.length > 10) {
        text += `... 외 ${inventory.length - 10}개\n`;
      }
    }

    // 안내 텍스트 (인벤토리에 아이템이 있을 때만)
    if (inventory.length > 0) {
      text += '\n💡 "장착1", "판매1" 입력 가능\n';
      text += '💡 번호만 입력하면 상세 보기';
    }

    return res.json(reply(text, ['강화', '판매', '장비', '마을']));
  }
  
  // ========================================
  // 2단계-B: 강화
  // ========================================
  if (msg === '강화') {
    const equipped = u.equipment || {};
    let text = '🔨 강화할 장비 선택\n━━━━━━━━━━━━━━━━━━\n';
    
    const enhanceable = [];
    const slots = ['weapon', 'armor', 'accessory', 'relic'];
    
    slots.forEach(slot => {
      const item = equipped[slot];
      if (item && (item.enhance || 0) < 10) {
        const rate = getEnhanceRate(item.enhance || 0);
        const cost = getEnhanceCost(item.enhance || 0);
        const displayName = item.nickname || item.name;
        const current = item.enhance || 0;
        const next = current + 1;
        
        enhanceable.push({
          slot: slot,
          text: `${getSlotIcon(slot)} ${displayName} +${current} → +${next}`,
          rate: rate,
          cost: cost
        });
      }
    });
    
    if (enhanceable.length === 0) {
      return res.json(reply("강화 가능한 장비가 없습니다.\n(최대 +10까지 강화 가능)", ['목록', '마을']));
    }
    
    enhanceable.forEach(e => {
      text += `${e.text}\n성공률 ${e.rate}% | ${e.cost}G\n\n`;
    });
    
    const buttons = enhanceable.map(e => `강화${e.slot}`);
    buttons.push('목록', '마을');
    
    return res.json(reply(text, buttons.slice(0, 6)));
  }
  
  // ========================================
  // 슬롯별 강화 실행
  // ========================================
  const enhanceSlots = ['weapon', 'armor', 'accessory', 'relic'];
  for (const slot of enhanceSlots) {
    if (msg === `강화${slot}`) {
      const item = u.equipment?.[slot];
      if (!item) {
        return res.json(reply(`${getSlotName(slot)} 슬롯에 장비가 없습니다.`, ['강화', '마을']));
      }
      if ((item.enhance || 0) >= 10) {
        return res.json(reply(`이미 최대 강화 단계입니다. (+10)`, ['강화', '마을']));
      }
      
      // executeEnhance 함수 호출
      return executeEnhance(res, u, userId, slot, saveUser);
    }
  }
  
  // ========================================
  // 2단계-C: 판매
  // ========================================
  if (msg === '판매') {
    if (inventory.length === 0) {
      return res.json(reply("판매할 아이템이 없습니다.", ['목록', '마을']));
    }
    
    let text = '💰 판매할 아이템 선택\n━━━━━━━━━━━━━━━━━━\n';
    
    inventory.slice(0, 10).forEach((item, idx) => {
      const displayName = item.nickname || item.name;
      const price = Math.floor((item.value || 50) * 0.5);
      const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';
      text += `${idx + 1}. ${item.gradeColor || '⚪'} ${displayName}${enhance} (${price}G)\n`;
    });
    
    const buttons = inventory.slice(0, 5).map((_, idx) => `판매${idx + 1}`);
    buttons.push('목록', '마을');
    
    return res.json(reply(text, buttons.slice(0, 6)));
  }
  
  // ========================================
  // 판매N, N번판매 (동의어)
  // ========================================
  const sellMatch = msg.match(/^판매(\d+)$/) || msg.match(/^(\d+)번판매$/);
  if (sellMatch) {
    const idx = parseInt(sellMatch[1]) - 1;
    const item = inventory[idx];
    
    if (!item) {
      return res.json(reply("해당 아이템이 없습니다.", ['판매', '마을']));
    }
    
    const price = Math.floor((item.value || 50) * 0.5);
    const displayName = item.nickname || item.name;
    
    // 판매 처리
    u.gold = (u.gold || 0) + price;
    u.totalGoldEarned = (u.totalGoldEarned || 0) + price;
    u.inventory.splice(idx, 1);
    await saveUser(userId, u);
    
    const text = `${item.gradeColor || '⚪'} ${displayName}을(를) ${price}G에 판매했습니다.\n\n` +
      `보유 골드: ${u.gold}G`;
    
    return res.json(reply(text, ['판매', '목록', '마을']));
  }
  
  // ========================================
  // 장착 (인벤N, 장착N, N번장착 동의어)
  // ========================================
  const equipMatch = msg.match(/^인벤(\d+)$/) || msg.match(/^장착(\d+)$/) || msg.match(/^(\d+)번장착$/);
  if (equipMatch) {
    const idx = parseInt(equipMatch[1]) - 1;
    const item = inventory[idx];
    
    if (!item) {
      return res.json(reply('아이템을 찾을 수 없습니다.', ['목록', '마을']));
    }
    
    const slot = item.slot;
    const oldItem = u.equipment?.[slot];
    
    // 기존 장비는 인벤토리로
    if (oldItem) {
      u.inventory.push(oldItem);
    }
    
    // 새 장비 장착
    if (!u.equipment) u.equipment = {};
    u.equipment[slot] = item;
    u.inventory.splice(idx, 1);
    
    await saveUser(userId, u);
    
    const displayName = item.nickname || item.name;
    const text = `${item.gradeColor || '⚪'} ${displayName}을(를) 장착했습니다!`;
    
    return res.json(reply(text, ['목록', '장비', '마을']));
  }
  
  // ========================================
  // 아이템 상세 보기 (N번)
  // ========================================
  if (msg.match(/^\d+번$/)) {
    const idx = parseInt(msg.replace('번', '')) - 1;
    const item = inventory[idx];
    
    if (!item) {
      return res.json(reply("해당 아이템이 없습니다.", ['목록', '마을']));
    }
    
    const displayName = item.nickname || item.name;
    const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';
    const price = Math.floor((item.value || 50) * 0.5);
    
    let text = `${item.gradeColor || '⚪'} ${displayName}${enhance}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `등급: ${item.gradeName || '일반'}\n`;
    text += `${getItemStatText(item)}\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `판매가: ${price}G`;
    
    return res.json(reply(text, [`인벤${idx + 1}`, `판매${idx + 1}`, '목록']));
  }
  
  // ========================================
  // 기본 응답
  // ========================================
  return res.json(reply('알 수 없는 명령어입니다.', ['장비', '마을']));
};
