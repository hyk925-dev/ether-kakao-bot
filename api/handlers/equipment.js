// ============================================
// Equipment Handler v4.1
// 장비 관리 (목록, 강화, 판매)
// ============================================

const { reply, replyItemCard } = require('../../utils/response');
const { getItemDisplay, getItemStatText } = require('../../systems/items');
const { getEnhanceRate, getEnhanceCost, executeEnhance } = require('../../systems/enhance');

const { getSlotIcon, createRateBar } = require('../../utils/text');
// ============================================
// 헬퍼 함수
// ============================================

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
    let text = '📦 장비 관리\n━━━━━━━━━━━━━━━━━━\n\n';
    text += '【 장착 중 】\n';

    const slots = ['weapon', 'armor', 'accessory', 'relic'];
    const equipped = u.equipment || {};

    let totalAtk = 0, totalDef = 0, totalHp = 0;

    slots.forEach(slot => {
      const item = equipped[slot];
      const icon = getSlotIcon(slot);

      if (item) {
        const displayName = item.nickname || item.name;
        const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';

        // 주요 스탯 표시
        let statText = '';
        if (item.atk) { statText = `ATK +${item.atk}`; totalAtk += item.atk; }
        if (item.def) { statText = `DEF +${item.def}`; totalDef += item.def; }
        if (item.hp) { statText = `HP +${item.hp}`; totalHp += item.hp; }

        text += `${icon} ${displayName}${enhance}  ${statText}\n`;
      } else {
        text += `${icon} —\n`;
      }
    });

    // 총합 표시
    text += `\n━━━━━━━━━━━━━━━━━━\n`;
    const totals = [];
    if (totalAtk > 0) totals.push(`ATK +${totalAtk}`);
    if (totalDef > 0) totals.push(`DEF +${totalDef}`);
    if (totalHp > 0) totals.push(`HP +${totalHp}`);
    text += `📊 총합: ${totals.length > 0 ? totals.join(' | ') : '없음'}\n`;

    // 인벤토리
    text += `\n【 인벤토리 (${inventory.length}개) 】\n`;

    if (inventory.length === 0) {
      text += '비어있음\n';
    } else {
      inventory.slice(0, 8).forEach((item, i) => {
        const displayName = item.nickname || item.name;
        const enhance = item.enhance > 0 ? ` +${item.enhance}` : '';

        // 주요 스탯
        let statText = '';
        if (item.atk) statText = `ATK +${item.atk}`;
        else if (item.def) statText = `DEF +${item.def}`;
        else if (item.hp) statText = `HP +${item.hp}`;

        text += `${i + 1}. ${item.gradeColor || '⚪'} ${displayName}${enhance}  ${statText}\n`;
      });

      if (inventory.length > 8) {
        text += `... 외 ${inventory.length - 8}개\n`;
      }
    }

    if (inventory.length > 0) {
      text += `\n💡 번호 입력 → 상세 | "장착1" → 장착`;
    }

    return res.json(reply(text, ['강화', '판매', '장비', '마을']));
  }
  
  // ========================================
  // 2단계-B: 강화
  // ========================================
  if (msg === '강화') {
    const equipped = u.equipment || {};
    let text = '🔨 강화\n━━━━━━━━━━━━━━━━━━\n';
    text += `💰 보유: ${(u.gold || 0).toLocaleString()}G\n\n`;

    const enhanceable = [];
    const slots = ['weapon', 'armor', 'accessory', 'relic'];

    slots.forEach(slot => {
      const item = equipped[slot];
      if (item && (item.enhance || 0) < 10) {
        const current = item.enhance || 0;
        const next = current + 1;
        const rate = getEnhanceRate(current);
        const cost = getEnhanceCost(current);
        const displayName = item.nickname || item.name;

        // 성공률 바
        const rateBar = createRateBar(rate, 10);

        text += `${getSlotIcon(slot)} ${displayName} +${current} → +${next}\n`;
        text += `   [${rateBar}] ${rate}%\n`;
        text += `   비용: ${cost}G`;

        // 파괴 위험 표시 (+7부터)
        if (current >= 6) {
          text += ' ⚠️ 파괴 위험';
        }
        text += '\n\n';

        enhanceable.push(slot);
      }
    });

    if (enhanceable.length === 0) {
      return res.json(reply("강화 가능한 장비가 없습니다.\n(장착 중인 장비만 강화 가능, 최대 +10)", ['목록', '마을']));
    }

    text += '⚠️ +7부터 실패 시 파괴 위험!';

    // 버튼 생성
    const buttons = enhanceable.map(slot => {
      const slotName = { weapon: '무기', armor: '방어구', accessory: '악세', relic: '유물' }[slot];
      return `${slotName}강화`;
    });
    buttons.push('목록', '마을');

    return res.json(reply(text, buttons.slice(0, 6)));
  }

  
  // ========================================
  // 슬롯별 강화 실행
  // ========================================
  const slotMap = { '무기': 'weapon', '방어구': 'armor', '악세': 'accessory', '유물': 'relic' };
  const enhanceMatch = msg.match(/^(.+)강화$/);
  if (enhanceMatch) {
    const slotName = enhanceMatch[1];
    const slot = slotMap[slotName];

    if (slot) {
      const item = u.equipment?.[slot];
      if (!item) {
        return res.json(reply(`${slotName} 슬롯에 장비가 없습니다.`, ['강화', '마을']));
      }
      if ((item.enhance || 0) >= 10) {
        return res.json(reply(`이미 최대 강화 단계입니다. (+10)`, ['강화', '마을']));
      }

      // 강화 실행
      const result = executeEnhance(u, slot, item);
      const displayName = item.nickname || item.name;

      // 골드 차감됐으면 저장 (성공/실패 모두)
      if (result.goldSpent) {
        await saveUser(userId, u);
      }

      if (!result.success) {
        // 골드 부족은 저장 안 함
        if (result.message.includes('골드가 부족')) {
          return res.json(reply(`❌ ${result.message}`, ['강화', '마을']));
        }
        // 강화 실패 (골드 소모됨)
        return res.json(reply(
          `❌ 강화 실패...\n` +
          `${item.gradeColor || '⚪'} ${displayName} +${item.enhance || 0} 유지\n\n` +
          `💰 보유 골드: ${u.gold.toLocaleString()}G`,
          ['강화', '목록', '마을']
        ));
      }

      return res.json(reply(
        `✅ ${slotName} 강화 성공!\n` +
        `${item.gradeColor || '⚪'} ${displayName} → +${item.enhance}\n\n` +
        `💰 보유 골드: ${u.gold.toLocaleString()}G`,
        ['강화', '목록', '마을']
      ));
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
  // 아이템 상세 보기 (N번) — itemCard 적용
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

    // 타이틀, 등급
    const title = `${item.gradeColor || '⚪'} ${displayName}${enhance}`;
    const grade = `${item.gradeName || '일반'} ${item.slotName || '장비'}`;

    // 스탯 목록
    const stats = [];
    if (item.atk) stats.push({ label: '⚔️ 공격력', value: `+${item.atk}` });
    if (item.def) stats.push({ label: '🛡️ 방어력', value: `+${item.def}` });
    if (item.hp) stats.push({ label: '❤️ HP', value: `+${item.hp}` });
    if (item.critRate) stats.push({ label: '💥 치명타', value: `+${item.critRate}%` });
    if (item.evasion) stats.push({ label: '💨 회피', value: `+${item.evasion}%` });
    stats.push({ label: '💰 판매가', value: `${price}G` });

    // 이미지 (있으면)
    const image = item.image || null;

    // 버튼
    const buttons = [`장착${idx + 1}`, `판매${idx + 1}`, '목록'];

    return res.json(replyItemCard(title, grade, image, stats, buttons));
  }
  
  // ========================================
  // 기본 응답
  // ========================================
  return res.json(reply('알 수 없는 명령어입니다.', ['장비', '마을']));
};
