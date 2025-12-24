// ============================================
// Battle Handler v4.0
// 전투 시스템 (패턴 기반)
// ============================================

const { JOBS } = require('../../data');
const { BOSSES: REGION_BOSSES } = require('../../data/bosses');
const { getBoss, getBossPattern, isRegionBossFloor } = require('../../bosses');
const { getMonsterImage } = require('../../data/images');
const { generateItem, getItemDisplay } = require('../../systems/items');
const { reply, replyWithImage, replyCard } = require('../../utils/response');
const { calcStats, getReqExp } = require('../../utils/calc');
const { createHPBar, getPatternIcon } = require('../../utils/text');
const {
  spawnMonster,
  checkBossPhase,
  selectPattern,
  getTelegraph,
  getChoices,
  judgeInterpret,
  updateInterpretStreak,
  getStreakBonus,
  applyAllPassives,
  applyOnAttackPassives,
  applyOnDamagedPassives,
  checkSurvival,
  checkPriority,
  calculatePlayerDamage,
  calculateEnemyDamage,
  processBuffs,
  processCooldowns,
  addBattleUnderstanding,
  getBattleUnderstandingLevel
} = require('../../systems/battle');
const {
  recordBattleStart,
  recordBattleWin,
  recordBattleDeath,
  recordInterpret,
  incrementTurn,
  recordDamage,
  recordHealing,
  getUnderstandingLevelText
} = require('../../utils/stats');

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 층별 보스 출현 필요 처치 수
 * @param {number} floor - 현재 층
 * @returns {number} 필요 처치 수
 */
function getRequiredKills(floor) {
  if (floor <= 10) return 5;
  if (floor <= 30) return 7;
  return 10;
}

/**
 * 층 진행도 바
 * @param {number} current - 현재 처치 수
 * @param {number} max - 필요 처치 수
 * @returns {string} 진행도 바
 */
function getProgressBar(current, max) {
  const filled = Math.floor((current / max) * 5);
  const empty = 5 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 몬스터 HP 구간별 반응 텍스트
 */
function getMonsterReaction(enemy) {
  const hpPercent = enemy.hp / enemy.maxHp;
  if (hpPercent > 0.74) return '';
  if (hpPercent > 0.49) return `${enemy.name}가 경계한다`;
  if (hpPercent > 0.24) return `${enemy.name}가 비틀거린다!`;
  return `${enemy.name}가 몸을 떨고 있다...`;
}

/**
 * 선택지 버튼에 아이콘 추가
 */
function getChoiceWithIcon(choice) {
  const icons = {
    '회피': '💨 회피',
    '방어': '🛡️ 방어',
    '역습': '⚔️ 역습'
  };
  return icons[choice] || choice;
}

/**
 * 버튼 배열에 아이콘 적용
 */
function applyButtonIcons(buttons) {
  return buttons.map(btn => {
    if (btn === '회피' || btn === '방어' || btn === '역습') {
      return getChoiceWithIcon(btn);
    }
    return btn;
  });
}

/**
 * 패배 메시지 생성
 */
function getDefeatMessage(goldLoss = 0, isBoss = false, floor = 1) {
  let text = `━━━━━━━━━━━━━━━━\n`;
  text += `💀 패배...\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;
  text += `어둠 속으로 의식이 사라진다...\n\n`;

  if (isBoss) {
    // 보스 패배 - 골드 손실 없음, 재도전 가능
    text += `📍 ${floor}층 보스 도전 가능\n`;
    text += `💡 마을에서 회복 후 재도전하세요.`;
  } else {
    // 일반 몬스터 패배
    if (goldLoss > 0) {
      text += `💸 -${goldLoss}G (약탈당함)\n`;
    }
    text += `📍 마을로 귀환`;
  }

  return text;
}

/**
 * 전투 시작 UI 생성 (v4.1 개선)
 */
function getBattleStartUI(user, enemy, telegraph, choices, understandingLevel, pattern) {
  const c = calcStats(user);

  // 이해도 퍼센트 계산
  const understanding = user.battleUnderstanding?.[enemy.id || enemy.name];
  const understandingExp = understanding?.exp || 0;

  // HP 바 생성
  const playerHpBar = createHPBar(user.hp, c.maxHp, 10);
  const enemyHpBar = createHPBar(enemy.hp, enemy.maxHp, 8);
  const enemyHpPercent = Math.floor((enemy.hp / enemy.maxHp) * 100);

  // 패턴 아이콘
  const patternIcon = pattern ? getPatternIcon(pattern.type) : '⚡';

  let text = `┌─────────────────┐\n`;
  text += `│ 👹 ${enemy.name}\n`;
  text += `│ HP [${enemyHpBar}] ${enemyHpPercent}%\n`;
  text += `│ 📖 이해도: ${understandingExp}%\n`;
  text += `└─────────────────┘\n`;

  // 몬스터 설명 (있으면 표시)
  if (enemy.desc) {
    text += `"${enemy.desc}"\n\n`;
  }

  text += `⚔️ 나 [${playerHpBar}] ${user.hp}/${c.maxHp}\n`;

  // 광기 표시
  if ((user.madness || 0) > 0) {
    text += `🌀 광기: ${user.madness}`;
    if (user.madness >= 80) text += ' ⚠️위험!';
    else if (user.madness >= 50) text += ' 🔥';
    text += '\n';
  }

  text += `\n━━━ ${patternIcon} 전조 ━━━\n`;
  text += `"${telegraph}"\n`;

  // ??? 제외하고 버튼 생성
  const validChoices = choices.filter(c => c !== '???');
  const rawButtons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
  const buttons = applyButtonIcons(rawButtons);

  return { text, buttons };
}

/**
 * 승리 처리
 */
async function handleVictory(user, enemy, res, combatLog, saveUser, userId) {
  const c = calcStats(user);
  
  // 전투 통계 기록
  recordBattleWin(user, enemy);
  user.totalKills = (user.totalKills || 0) + 1;
  
  // 경험치/골드
  const baseExp = enemy.exp || 10;
  const baseGold = enemy.gold || 8;
  const expGain = Math.floor(baseExp * (1 + (user.soulMark?.expBonus || 0)));
  const goldGain = baseGold;
  
  user.exp += expGain;
  user.gold += goldGain;
  user.totalGoldEarned = (user.totalGoldEarned || 0) + goldGain;
  
  // 레벨업 체크
  let totalLevels = 0;
  let reqExp = getReqExp(user.lv);
  while (user.exp >= reqExp) {
    user.exp -= reqExp;
    user.lv += 1;
    user.level = user.lv;
    user.statPoints = (user.statPoints || 0) + 5;
    totalLevels++;
    reqExp = getReqExp(user.lv);
    
    // maxLevel 갱신
    if (user.lv > (user.maxLevel || 1)) {
      user.maxLevel = user.lv;
    }
  }
  
  // HP 회복
  user.hp = Math.min(c.maxHp, user.hp + Math.floor(c.maxHp * 0.2));
  
  // 일반 몬스터 처치 카운트 (보스 제외)
  if (!enemy.isBoss) {
    user.floorKills = (user.floorKills || 0) + 1;

    // 보스 출현 조건 체크
    const required = getRequiredKills(user.floor || 1);
    if (user.floorKills >= required && !user.bossAvailable) {
      user.bossAvailable = true;
    }
  }

  // 아이템 드랍
  let drop = null;
  let guaranteeRare = false;

  // 보스 승리 처리
  if (enemy.isBoss) {
    const bossId = enemy.id || enemy.name;
    if (!user.bossKills || !user.bossKills[bossId]) {
      guaranteeRare = true;
    }

    if (!user.bossKills) user.bossKills = {};
    user.bossKills[bossId] = true;
    user.totalBossKills = (user.totalBossKills || 0) + 1;

    // 층 클리어 처리
    const currentFloor = user.floor || 1;
    user.bossAvailable = false;
    user.floorKills = 0;
    user.maxFloor = Math.max(user.maxFloor || currentFloor, currentFloor + 1);
  }
  
  // 아이템 생성
  if (Math.random() < 0.3 || guaranteeRare) {
    drop = generateItem(user.floor, guaranteeRare ? 'rare' : null);
    if (drop) {
      user.inventory.push(drop);
    }
  }
  
  // 이해도 표시
  const monsterId = enemy.id || enemy.name;
  const understanding = user.battleUnderstanding?.[monsterId];
  const understandingExp = understanding?.exp || 0;

  // 결과 텍스트 (v4.1 새 형식)
  let text = '━━━━━━━━━━━━━━━━━━\n';
  text += '       🎉 승리!\n';
  text += '━━━━━━━━━━━━━━━━━━\n\n';

  text += `${enemy.icon || '👹'} ${enemy.name} 처치!\n\n`;

  text += '┌─────────────────┐\n';
  text += `│ 💰 +${goldGain}G\n`;
  text += `│ ✨ +${expGain} EXP\n`;
  text += `│ 📖 이해도 ${understandingExp}/100\n`;
  text += '└─────────────────┘\n';

  // 광기 변화 (있으면)
  const madnessGain = user.lastMadnessGain || 0;
  if (madnessGain > 0) {
    text += `\n🌀 광기 +${madnessGain}`;
    if ((user.madness || 0) >= 80) {
      text += ' ⚠️';
    }
  }

  // 드랍 아이템
  if (drop) {
    text += `\n\n💎 ${drop.gradeColor || '⚪'} ${drop.name} 획득!`;
    if (guaranteeRare) {
      text += ` ⭐ 보스 첫 킬!`;
    }
  }

  // 레벨업
  if (totalLevels > 0) {
    text += `\n\n🌟 LEVEL UP! Lv.${user.lv}`;
    text += `\n   스탯 포인트 +${totalLevels * 5}`;
  }

  // 결과 분기 (보스 vs 일반 몬스터)
  let buttons = ['전투', '마을'];

  if (enemy.isBoss) {
    // 보스 승리 메시지
    const clearedFloor = user.floor || 1;
    const nextFloor = clearedFloor + 1;

    text += `\n━━━━━━━━━━━━━━━━━━\n`;
    text += `🏆 ${clearedFloor}층 클리어!\n`;
    text += `🔓 ${nextFloor}층 해금됨`;
    text += `\n━━━━━━━━━━━━━━━━━━`;

    buttons = [`${nextFloor}층으로`, `${clearedFloor}층 파밍`, '마을'];
  } else {
    // 일반 몬스터 - 층 진행도 표시
    const floor = user.floor || 1;
    const floorKills = user.floorKills || 0;
    const required = getRequiredKills(floor);

    text += `\n━━━━━━━━━━━━━━━━━━\n`;

    if (user.bossAvailable) {
      // 보스 출현
      text += `⚠️ ${floor}층 보스 출현!\n`;
      text += `🔥 보스에게 도전할 수 있습니다!`;
      buttons = ['🔥 보스 도전', '전투', '마을'];
    } else {
      // 보스 미출현
      const progressBar = getProgressBar(floorKills, required);
      const remaining = required - floorKills;
      text += `📍 ${floor}층 진행: ${progressBar} ${floorKills}/${required}\n`;
      text += `💡 ${remaining}마리 더 처치하면 보스 출현!`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━`;
  }

  // 상태 초기화
  user.phase = 'town';
  user.monster = null;
  user.currentPattern = null;
  user.battleTurn = 1;
  user.interpretStreak = 0;
  user.hunterStacks = 0;
  user.usedSurvival = false;
  user.potionsUsedInBattle = 0;

  await saveUser(userId, user);

  // 드랍 아이템이 있고 이미지가 있으면 basicCard 사용
  if (drop && drop.image) {
    const cardDesc = `${enemy.icon || '👹'} ${enemy.name} 처치!\n\n` +
      `💰 +${goldGain}G | ✨ +${expGain} EXP\n` +
      `📖 이해도 ${understandingExp}/100\n\n` +
      `💎 ${drop.gradeColor || '⚪'} ${drop.name} 획득!` +
      (totalLevels > 0 ? `\n\n🌟 LEVEL UP! Lv.${user.lv}` : '');

    return res.json(replyCard({
      title: '🎉 승리!',
      description: cardDesc,
      imageUrl: drop.image,
      buttons: buttons
    }));
  }

  return res.json(reply(text, buttons));
}

/**
 * 전투 턴 진행 (핵심 로직)
 */
async function processBattleTurn(user, enemy, interpretResult, context, res, saveUser, userId) {
  const c = calcStats(user);
  const turnNum = user.battleTurn || 1;

  // 턴 데이터 추적
  let totalDamageDealt = 0;
  let totalDamageReceived = 0;
  let effectsText = [];

  // 턴 헤더
  let text = `━━━ TURN ${turnNum} ━━━\n\n`;
  text += `🎯 나의 행동: ${context.interpretResult?.choice || '알 수 없음'}\n\n`;
  text += `${interpretResult.message}\n`;

  // 패시브 효과 로그
  const effectsLog = [];
  if (context.forceCrit) effectsLog.push("크리 확정");
  if (context.negateEnemyPriority) effectsLog.push("적 선공 무효");
  if (context.playerPriority) effectsLog.push("선공 확보");
  if (context.selfDamagePercent) effectsLog.push(`자해 ${Math.floor(context.selfDamagePercent * 100)}%`);

  if (effectsLog.length > 0) {
    text += `✨ ${effectsLog.join(", ")}\n`;
  }
  text += '\n';
  
  // 선제권 판정
  const priority = checkPriority(user, enemy, interpretResult, context);
  
  // 턴 진행
  if (priority === "player") {
    // 플레이어 먼저
    const playerDamage = calculatePlayerDamage(user, enemy, interpretResult, context);
    enemy.hp -= playerDamage;
    totalDamageDealt += playerDamage;
    recordDamage(user, playerDamage, 'dealt');
    text += `⚔️ ${playerDamage} → 💀 ${enemy.name}\n`;

    // 공격 패시브
    const attackPassives = applyOnAttackPassives(user, enemy, playerDamage);
    if (attackPassives.lifesteal) {
      user.hp = Math.min(c.maxHp, user.hp + Math.floor(attackPassives.lifesteal));
      recordHealing(user, Math.floor(attackPassives.lifesteal));
      effectsText.push(`💜 흡혈 +${Math.floor(attackPassives.lifesteal)}`);
    }
    if (attackPassives.stackBonus) {
      user.hunterStacks = (user.hunterStacks || 0) + 1;
      effectsText.push(`🎯 사냥 ${user.hunterStacks}중첩`);
    }

    // 자해
    if (context.selfDamagePercent) {
      const selfDmg = Math.floor(c.maxHp * context.selfDamagePercent);
      user.hp -= selfDmg;
      totalDamageReceived += selfDmg;
      effectsText.push(`💔 자해 -${selfDmg}`);
    }

    // 적 처치
    if (enemy.hp <= 0) {
      incrementTurn(user);
      return handleVictory(user, enemy, res, text, saveUser, userId);
    }

    // 적 반격
    const enemyDamage = calculateEnemyDamage(enemy, user, user.currentPattern, interpretResult, context);
    user.hp -= enemyDamage;
    totalDamageReceived += enemyDamage;
    recordDamage(user, enemyDamage, 'taken');
    text += `💔 -${enemyDamage} HP\n`;

    // 피격 패시브
    const damagedPassives = applyOnDamagedPassives(user, enemy, enemyDamage);
    if (damagedPassives.counter) {
      enemy.hp -= damagedPassives.counterDamage;
      totalDamageDealt += damagedPassives.counterDamage;
      effectsText.push(`⚔️ 반격! ${damagedPassives.counterDamage}`);
    }
  } else {
    // 적 먼저
    const enemyDamage = calculateEnemyDamage(enemy, user, user.currentPattern, interpretResult, context);
    user.hp -= enemyDamage;
    totalDamageReceived += enemyDamage;
    recordDamage(user, enemyDamage, 'taken');
    text += `💔 -${enemyDamage} HP (선제 피격)\n`;

    // 피격 패시브
    const damagedPassives = applyOnDamagedPassives(user, enemy, enemyDamage);
    if (damagedPassives.counter) {
      enemy.hp -= damagedPassives.counterDamage;
      totalDamageDealt += damagedPassives.counterDamage;
      effectsText.push(`⚔️ 반격! ${damagedPassives.counterDamage}`);
    }

    // 사망 체크
    if (user.hp <= 0) {
      // 불굴 체크
      if (checkSurvival(user)) {
        user.hp = 1;
        effectsText.push(`🛡️ 불굴! HP 1로 생존`);
      } else {
        incrementTurn(user);
        // 보스 패배 시 골드 손실 없음, 일반 몬스터만 10% 약탈
        const goldLoss = enemy.isBoss ? 0 : Math.floor(user.gold * 0.1);
        user.gold -= goldLoss;
        user.phase = 'town';
        user.hp = Math.floor(c.maxHp * 0.3);
        user.monster = null;
        user.interpretStreak = 0;
        user.hunterStacks = 0;
        user.usedSurvival = false;
        user.potionsUsedInBattle = 0;
        recordBattleDeath(user, enemy);
        await saveUser(userId, user);
        return res.json(reply(getDefeatMessage(goldLoss, enemy.isBoss, user.floor || 1), ['마을']));
      }
    }

    // 플레이어 반격
    const playerDamage = calculatePlayerDamage(user, enemy, interpretResult, context);
    enemy.hp -= playerDamage;
    totalDamageDealt += playerDamage;
    recordDamage(user, playerDamage, 'dealt');
    text += `⚔️ ${playerDamage} → 💀 ${enemy.name}\n`;

    // 공격 패시브
    const attackPassives = applyOnAttackPassives(user, enemy, playerDamage);
    if (attackPassives.lifesteal) {
      user.hp = Math.min(c.maxHp, user.hp + Math.floor(attackPassives.lifesteal));
      recordHealing(user, Math.floor(attackPassives.lifesteal));
      effectsText.push(`💜 흡혈 +${Math.floor(attackPassives.lifesteal)}`);
    }
    if (attackPassives.stackBonus) {
      user.hunterStacks = (user.hunterStacks || 0) + 1;
      effectsText.push(`🎯 사냥 ${user.hunterStacks}중첩`);
    }

    // 자해
    if (context.selfDamagePercent) {
      const selfDmg = Math.floor(c.maxHp * context.selfDamagePercent);
      user.hp -= selfDmg;
      totalDamageReceived += selfDmg;
      effectsText.push(`💔 자해 -${selfDmg}`);
    }
  }
  
  // 전투 결과 체크
  if (enemy.hp <= 0) {
    incrementTurn(user);
    return handleVictory(user, enemy, res, text, saveUser, userId);
  }
  if (user.hp <= 0) {
    if (!checkSurvival(user)) {
      incrementTurn(user);
      // 보스 패배 시 골드 손실 없음, 일반 몬스터만 10% 약탈
      const goldLoss = enemy.isBoss ? 0 : Math.floor(user.gold * 0.1);
      user.gold -= goldLoss;
      user.phase = 'town';
      user.hp = Math.floor(c.maxHp * 0.3);
      user.monster = null;
      user.interpretStreak = 0;
      user.hunterStacks = 0;
      user.usedSurvival = false;
      user.potionsUsedInBattle = 0;
      recordBattleDeath(user, enemy);
      await saveUser(userId, user);
      return res.json(reply(getDefeatMessage(goldLoss, enemy.isBoss, user.floor || 1), ['마을']));
    }
  }

  // 보스 페이즈 체크
  const phaseChange = checkBossPhase(enemy);
  if (phaseChange) {
    text += `\n🔥 페이즈 ${phaseChange.phase}!\n`;
    if (phaseChange.phaseStartAbility) {
      text += `⚠️ ${phaseChange.phaseStartAbility.name}\n`;
    }
  }
  
  // 버프/쿨타임 처리
  processBuffs(user);
  processBuffs(enemy);
  processCooldowns(user);
  
  // 이해도 증가
  addBattleUnderstanding(user, enemy, interpretResult.result);
  const newUnderstandingLevel = getBattleUnderstandingLevel(user, enemy);
  
  if (newUnderstandingLevel > user.understandingLevel) {
    text += `\n💡 이해도 증가! ${getUnderstandingLevelText(newUnderstandingLevel)}\n`;
    user.understandingLevel = newUnderstandingLevel;
  }
  
  // 효과 텍스트 출력
  if (effectsText.length > 0) {
    text += effectsText.join('\n') + '\n';
  }

  // HP 상태 표시 (HP 바 포함)
  const playerHpBar = createHPBar(Math.max(0, user.hp), c.maxHp, 5);
  const enemyHpBar = createHPBar(Math.max(0, enemy.hp), enemy.maxHp, 5);

  text += `\n👤 나: [${playerHpBar}] ${Math.max(0, user.hp)}/${c.maxHp}\n`;
  text += `👾 ${enemy.name}: [${enemyHpBar}] ${Math.max(0, enemy.hp)}/${enemy.maxHp}\n`;

  // 몬스터 HP 구간별 반응
  const monsterReaction = getMonsterReaction(enemy);
  if (monsterReaction) {
    text += `\n${monsterReaction}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━\n`;

  // 다음 패턴 준비
  const nextPattern = selectPattern(enemy);
  const nextTelegraph = getTelegraph(nextPattern, user.understandingLevel);
  const nextChoices = getChoices(nextPattern, user.understandingLevel);
  const nextPatternIcon = getPatternIcon(nextPattern.type);

  user.currentPattern = nextPattern;
  user.battleTurn = (user.battleTurn || 1) + 1;

  text += `${nextPatternIcon} 다음 전조\n"${nextTelegraph}"`;

  // 광기 표시 (전투 중)
  if ((user.madness || 0) > 0) {
    text += `\n🌀 광기: ${user.madness}`;
    if (user.madness >= 80) text += ' ⚠️';
  }

  // 연속 성공 표시
  const streak = user.interpretStreak || 0;
  if (streak >= 3) {
    const streakBonus = getStreakBonus(streak);
    text += `\n🔥 ${streak}연속! 공격 +${streakBonus}%`;
  }

  await saveUser(userId, user);

  const validChoices = nextChoices.filter(c => c !== '???');
  const rawButtons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
  const buttons = applyButtonIcons(rawButtons);

  return res.json(reply(text, buttons));
}

// ============================================
// Main Handler
// ============================================

module.exports = async function battleHandler(ctx) {
  const { userId, msg, u, c, res, saveUser } = ctx;
  
  // ========================================
  // 전투 시작 (마을에서)
  // ========================================
  if (u.phase === 'town' && (msg === '전투' || msg === '광기전투')) {
    const madnessOpen = msg === '광기전투';
    const monster = spawnMonster(u.floor);
    
    // 전투 통계 기록 시작
    recordBattleStart(u, monster);
    
    // 이해도 레벨 확인
    const understandingLevel = getBattleUnderstandingLevel(u, monster);
    
    // 패턴 선택
    const pattern = selectPattern(monster);
    
    // 텔레그래프 생성
    const telegraph = getTelegraph(pattern, understandingLevel);
    const choices = getChoices(pattern, understandingLevel);
    
    // 전투 상태 저장
    u.phase = 'battle';
    u.monster = monster;
    u.currentPattern = pattern;
    u.understandingLevel = understandingLevel;
    u.battleTurn = 1;
    u.madnessOpen = madnessOpen;
    u.interpretStreak = 0;
    u.hunterStacks = 0;
    u.usedSurvival = false;
    u.potionsUsedInBattle = 0;
    
    await saveUser(userId, u);

    // 화면 출력
    const ui = getBattleStartUI(u, monster, telegraph, choices, understandingLevel, pattern);
    const monsterImg = getMonsterImage(monster.name);
    
    if (monsterImg) {
      return res.json(replyWithImage(monsterImg, ui.text, ui.buttons));
    }
    return res.json(reply(ui.text, ui.buttons));
  }

  // ========================================
  // 보스 도전 (마을에서)
  // ========================================
  if (u.phase === 'town' && (msg === '보스 도전' || msg === '🔥 보스 도전' || msg === '보스도전' || msg === '보스')) {
    // 보스 출현 조건 체크
    if (!u.bossAvailable) {
      return res.json(reply('아직 보스가 출현하지 않았습니다.\n몬스터를 더 처치해주세요.', ['전투', '마을']));
    }

    const currentFloor = u.floor || 1;

    // 10층 단위 대보스 vs 일반 보스 분기
    if (isRegionBossFloor(currentFloor)) {
      // ========================================
      // 대보스 (10층 단위) - data/bosses.js
      // ========================================
      const regionBoss = REGION_BOSSES[currentFloor];
      if (!regionBoss) {
        return res.json(reply('이 층에는 대보스가 없습니다.', ['전투', '마을']));
      }

      // 대보스 객체 생성
      const bossMonster = {
        id: regionBoss.id,
        name: regionBoss.name,
        hp: regionBoss.baseHp,
        maxHp: regionBoss.baseHp,
        atk: regionBoss.baseAtk,
        def: regionBoss.baseDef,
        exp: regionBoss.baseExp,
        gold: regionBoss.baseGold,
        spd: regionBoss.spd,
        desc: regionBoss.desc,
        type: regionBoss.type,
        phases: regionBoss.phases,
        currentPhase: 1,
        isBoss: true,
        isRegionBoss: true,
        firstKillReward: regionBoss.firstKillReward
      };

      // 첫 페이즈 패턴 설정
      const phase1 = regionBoss.phases[0];
      bossMonster.patterns = phase1.patterns;

      // 전투 통계 기록 시작
      recordBattleStart(u, bossMonster);

      // 이해도 레벨 확인
      const understandingLevel = getBattleUnderstandingLevel(u, bossMonster);

      // 패턴 선택
      const pattern = selectPattern(bossMonster);

      // 텔레그래프 생성
      const telegraph = getTelegraph(pattern, understandingLevel);
      const choices = getChoices(pattern, understandingLevel);

      // 전투 상태 저장
      u.phase = 'battle';
      u.monster = bossMonster;
      u.currentPattern = pattern;
      u.understandingLevel = understandingLevel;
      u.battleTurn = 1;
      u.interpretStreak = 0;
      u.hunterStacks = 0;
      u.usedSurvival = false;
      u.potionsUsedInBattle = 0;

      await saveUser(userId, u);

      // 대보스 전투 시작 메시지
      let text = `━━━━━━━━━━━━━━━━━━\n`;
      text += `🔥🔥 ${currentFloor}층 대보스 🔥🔥\n`;
      text += `👹 ${regionBoss.name}\n`;
      text += `"${regionBoss.desc}"\n\n`;
      text += `HP: ${regionBoss.baseHp} | ATK: ${regionBoss.baseAtk}\n`;
      text += `페이즈: 1/${regionBoss.phases.length}\n`;
      text += `━━━━━━━━━━━━━━━━━━\n\n`;
      text += `⚔️ 대보스전 시작!\n\n`;
      text += `📖 전조\n"${telegraph}"`;

      const validChoices = choices.filter(c => c !== '???');
      const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);

      return res.json(reply(text, buttons));

    } else {
      // ========================================
      // 일반 보스 (1~9층) - bosses.js
      // ========================================
      const boss = getBoss(currentFloor);
      if (!boss) {
        return res.json(reply('이 층에는 보스가 없습니다.', ['전투', '마을']));
      }

      // 패턴 문자열 배열을 객체 배열로 변환 (v4.0 호환)
      const convertedPatterns = (boss.patterns || []).map(patternName => {
        const patternData = getBossPattern(patternName);

        // correct 속성 설정 (없으면 패턴 특성에 따라 기본값)
        let correct = patternData.correct;
        if (!correct) {
          if (patternData.multiplier >= 1.5) correct = '방어';      // 강공격 → 방어
          else if (patternData.multiplier === 0) correct = '역습';  // 버프/재생 → 역습
          else correct = '회피';                                     // 일반 → 회피
        }

        // telegraph 문자열을 객체로 변환
        let telegraph = patternData.telegraph;
        if (typeof telegraph === 'string') {
          telegraph = {
            0: telegraph,
            1: telegraph,
            2: telegraph,
            3: telegraph,
            4: `⚠️ ${telegraph}`
          };
        }

        return {
          ...patternData,
          id: patternName,
          correct,
          telegraph,
          weight: 1
        };
      });

      // 보스 객체 생성 (isBoss 플래그 추가)
      const bossMonster = {
        ...boss,
        hp: boss.hp,
        maxHp: boss.hp,
        patterns: convertedPatterns,
        isBoss: true
      };

      // 전투 통계 기록 시작
      recordBattleStart(u, bossMonster);

      // 이해도 레벨 확인
      const understandingLevel = getBattleUnderstandingLevel(u, bossMonster);

      // 패턴 선택
      const pattern = selectPattern(bossMonster);

      // 텔레그래프 생성
      const telegraph = getTelegraph(pattern, understandingLevel);
      const choices = getChoices(pattern, understandingLevel);

      // 전투 상태 저장
      u.phase = 'battle';
      u.monster = bossMonster;
      u.currentPattern = pattern;
      u.understandingLevel = understandingLevel;
      u.battleTurn = 1;
      u.interpretStreak = 0;
      u.hunterStacks = 0;
      u.usedSurvival = false;
      u.potionsUsedInBattle = 0;

      await saveUser(userId, u);

      // 보스 전투 시작 메시지
      let text = `━━━━━━━━━━━━━━━━━━\n`;
      text += `🔥 ${boss.emoji} ${boss.name}\n`;
      text += `${boss.description}\n\n`;
      text += `HP: ${boss.hp}\n`;
      text += `━━━━━━━━━━━━━━━━━━\n\n`;
      text += `⚔️ 보스전 시작!\n\n`;
      text += `📖 전조\n"${telegraph}"`;

      const validChoices = choices.filter(c => c !== '???');
      const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);

      // 보스 이미지가 있으면 함께 표시
      if (boss.image) {
        return res.json(replyWithImage(boss.image, text, buttons));
      }
      return res.json(reply(text, buttons));
    }
  }

  // ========================================
  // 전투 중
  // ========================================
  if (u.phase !== 'battle') {
    return res.json(reply('전투 중이 아닙니다.', ['마을']));
  }
  
  const m = u.monster;
  const pattern = u.currentPattern;
  const understandingLevel = u.understandingLevel || 0;
  const job = JOBS[u.job];
  
  // ========================================
  // 도망
  // ========================================
  if (msg === '도망') {
    u.phase = 'town';
    u.monster = null;
    u.interpretStreak = 0;
    u.hunterStacks = 0;
    u.usedSurvival = false;
    u.potionsUsedInBattle = 0;
    recordBattleDeath(u, m);
    await saveUser(userId, u);
    return res.json(reply('도망쳤다!', ['마을']));
  }
  
  // ========================================
  // 물약
  // ========================================
  if (msg === '물약') {
    if ((u.potions || 0) <= 0) {
      const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
      return res.json(reply('물약이 없습니다!', [...choices, '스킬', '물약', '도망'].slice(0, 6)));
    }
    
    if ((u.potionsUsedInBattle || 0) >= 1) {
      const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
      return res.json(reply('이번 전투에서 이미 물약을 사용했습니다!', [...choices, '스킬', '물약', '도망'].slice(0, 6)));
    }
    
    u.potions -= 1;
    u.potionsUsedInBattle = (u.potionsUsedInBattle || 0) + 1;
    const healAmount = Math.floor(c.maxHp * 0.3);
    u.hp = Math.min(c.maxHp, u.hp + healAmount);
    recordHealing(u, healAmount);
    
    await saveUser(userId, u);
    
    const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
    return res.json(reply(
      `💚 물약 사용! HP +${healAmount}\n현재 HP: ${u.hp}/${c.maxHp}`,
      [...choices, '스킬', '물약', '도망'].slice(0, 6)
    ));
  }
  
  // ========================================
  // 스킬
  // ========================================
  if (msg === '스킬') {
    if ((u.skillCd || 0) > 0) {
      const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
      return res.json(reply(
        `스킬 쿨타임: ${u.skillCd}턴 남음`,
        [...choices, '스킬', '물약', '도망'].slice(0, 6)
      ));
    }
    
    // 스킬 사용
    let skillText = `⚡ ${job.skill.name}!\n${job.skill.desc}\n\n`;
    
    // 스킬 효과 적용 (간단 버전)
    const skillDamage = Math.floor(c.atk * 2);
    m.hp -= skillDamage;
    recordDamage(u, skillDamage, 'dealt');
    skillText += `⚔️ ${skillDamage} 피해\n`;
    
    u.skillCd = job.skill.cooldown || 3;
    
    // 적 처치
    if (m.hp <= 0) {
      incrementTurn(u);
      return handleVictory(u, m, res, skillText, saveUser, userId);
    }
    
    // 적 반격
    const enemyDamage = Math.floor((m.atk || 10) - c.def * 0.4);
    const actualEnemyDamage = Math.max(1, enemyDamage);
    u.hp -= actualEnemyDamage;
    recordDamage(u, actualEnemyDamage, 'taken');
    skillText += `👹 -${actualEnemyDamage} HP\n`;
    
    // 사망 체크
    if (u.hp <= 0) {
      if (!checkSurvival(u)) {
        incrementTurn(u);
        // 보스 패배 시 골드 손실 없음, 일반 몬스터만 10% 약탈
        const goldLoss = m.isBoss ? 0 : Math.floor(u.gold * 0.1);
        u.gold -= goldLoss;
        u.phase = 'town';
        u.hp = Math.floor(c.maxHp * 0.3);
        u.monster = null;
        u.interpretStreak = 0;
        u.hunterStacks = 0;
        u.usedSurvival = false;
        u.potionsUsedInBattle = 0;
        recordBattleDeath(u, m);
        await saveUser(userId, u);
        return res.json(reply(getDefeatMessage(goldLoss, m.isBoss, u.floor || 1), ['마을']));
      } else {
        u.hp = 1;
        skillText += `🛡️ 불굴! HP 1로 생존\n`;
      }
    }

    // 다음 패턴
    const nextPattern = selectPattern(m);
    const nextTelegraph = getTelegraph(nextPattern, understandingLevel);
    const nextChoices = getChoices(nextPattern, understandingLevel);
    
    u.currentPattern = nextPattern;
    u.battleTurn = (u.battleTurn || 1) + 1;
    
    skillText += `\n━━━━━━━━━━━━━━━━━━\n📖 다음 전조\n${nextTelegraph}`;
    
    await saveUser(userId, u);
    
    const validChoices = nextChoices.filter(c => c !== '???');
    const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
    
    return res.json(reply(skillText, buttons));
  }
  
  // ========================================
  // ??? 선택
  // ========================================
  if (msg === '???') {
    const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
    return res.json(reply(
      "아직 알 수 없는 선택지입니다.\n이해도를 높이면 공개됩니다.",
      [...choices, "스킬", "물약", "도망"].slice(0, 6)
    ));
  }
  
  // ========================================
  // 해석 선택 (회피/방어/역습)
  // ========================================
  const validChoices = ['회피', '방어', '역습'];
  if (!validChoices.includes(msg)) {
    const choices = getChoices(pattern, understandingLevel).filter(c => c !== "???");
    return res.json(reply(
      '회피, 방어, 역습 중 하나를 선택하세요',
      [...choices, '스킬', '물약', '도망'].slice(0, 6)
    ));
  }
  
  // ========================================
  // 해석 판정
  // ========================================
  const interpretResult = judgeInterpret(msg, pattern, understandingLevel);
  
  // 해석 통계 기록
  recordInterpret(u, interpretResult.result, pattern);
  
  // 해석 연속 성공 업데이트
  const streak = updateInterpretStreak(u, interpretResult.result);
  const streakBonus = getStreakBonus(streak);
  
  // ========================================
  // 패시브 적용
  // ========================================
  const context = {
    interpretResult: { ...interpretResult, choice: msg },
    streakBonus,
    hunterStacks: u.hunterStacks || 0
  };

  applyAllPassives(u, m, interpretResult, context);
  
  // ========================================
  // 전투 턴 진행
  // ========================================
  return processBattleTurn(u, m, interpretResult, context, res, saveUser, userId);
};
