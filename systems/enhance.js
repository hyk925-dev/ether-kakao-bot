// systems/enhance.js

const { ENHANCE_RATES, ENHANCE_COSTS } = require('../data/items');

function getEnhanceRate(level) {
  const rates = [95, 90, 80, 70, 60, 50, 40, 30, 20, 10];
  return rates[level] || 10;
}

function getEnhanceCost(level) {
  const costs = [50, 80, 120, 180, 250, 350, 500, 700, 1000, 1500];
  return costs[level] || 1500;
}

function executeEnhance(user, slot, item) {
  const level = item.enhance || 0;
  if (level >= 10) {
    return { success: false, message: '최대 강화 단계입니다.' };
  }
  
  const rate = getEnhanceRate(level);
  const cost = getEnhanceCost(level);
  
  if (user.gold < cost) {
    return { success: false, message: `골드가 부족합니다. (필요: ${cost}G)` };
  }
  
  user.gold -= cost;
  const roll = Math.random() * 100;
  
  if (roll < rate) {
    item.enhance = level + 1;
    return { success: true, message: `강화 성공! +${item.enhance}` };
  } else {
    return { success: false, message: '강화 실패...' };
  }
}

module.exports = {
  getEnhanceRate,
  getEnhanceCost,
  executeEnhance
};
