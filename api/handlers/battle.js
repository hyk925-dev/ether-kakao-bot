// ============================================
// Battle Handler v4.0
// 전투 시스템 (패턴 기반)
// ============================================

const { JOBS } = require('../../data');
const { BOSSES } = require('../../data/bosses');
const { getMonsterImage } = require('../../data/images');
const { generateItem, getItemDisplay } = require('../../systems/items');
const { reply, replyWithImage } = require('../../utils/response');
const { calcStats, getReqExp } = require('../../utils/calc');
const { createHPBar } = require('../../utils/text');
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
 * 패배 메시지 생성
 */
function getDefeatMessage(goldLoss = 0) {
  let text = `━━━━━━━━━━━━━━━━\n`;
  text += `💀 패배...\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;
  text += `어둠 속으로 의식이 사라진다...\n\n`;
  if (goldLoss > 0) {
    text += `💸 -${goldLoss}G (약탈당함)\n`;
  }
  text += `📍 마을로 귀환`;
  return text;
}

/**
 * 전투 시작 UI 생성 (v4.0 완성판)
 */
function getBattleStartUI(user, enemy, telegraph, choices, understandingLevel) {
  const c = calcStats(user);

  // 이해도 퍼센트 계산
  const understanding = user.battleUnderstanding?.[enemy.id || enemy.name];
  const understandingExp = understanding?.exp || 0;

  // HP 바 생성
  const playerHpBar = createHPBar(user.hp, c.maxHp, 5);

  let text = `━━━━━━━━━━━━━━━━\n`;
  text += `⚔️ 전투 발생!\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  text += `👾 ${enemy.name} 출현!\n`;
  text += `💀 HP: ${enemy.hp} | 📖 이해도: ${understandingExp}%\n`;

  // 몬스터 설명 (있으면 표시)
  if (enemy.desc) {
    text += `\n"${enemy.desc}"\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━\n`;
  text += `👤 나: [${playerHpBar}] ${user.hp}/${c.maxHp}\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  text += `📖 전조\n"${telegraph}"`;

  // ??? 제외하고 버튼 생성
  const validChoices = choices.filter(c => c !== '???');
  const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);

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

  // 보스 첫 킬 확인
  if (enemy.isBoss) {
    const bossId = enemy.id || enemy.name;
    if (!user.bossKills || !user.bossKills[bossId]) {
      guaranteeRare = true;
    }
    
    if (!user.bossKills) user.bossKills = {};
    user.bossKills[bossId] = true;
    user.totalBossKills = (user.totalBossKills || 0) + 1;
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

  // 결과 텍스트 (새 형식)
  let text = `━━━━━━━━━━━━━━━━\n`;
  text += `🎉 승리!\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  text += `💀 ${enemy.name} 처치!\n\n`;

  text += `💰 ${goldGain}G | 📈 ${expGain} EXP\n`;
  if (totalLevels > 0) {
    text += `⭐ 레벨업! Lv.${user.lv} (+${totalLevels * 5} 스탯포인트)\n`;
  }
  text += `📖 ${enemy.name} 이해도: ${understandingExp}/100\n\n`;

  // 드랍 아이템
  if (drop) {
    text += `🎁 드랍: ${getItemDisplay(drop)}\n`;
    if (guaranteeRare) {
      text += `⭐ 보스 첫 킬 보상!\n`;
    }
  } else {
    text += `🎁 드랍: 없음\n`;
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
  
  return res.json(reply(text, ['전투', '마을']));
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
        // 골드 손실 (10% 약탈)
        const goldLoss = Math.floor(user.gold * 0.1);
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
        return res.json(reply(getDefeatMessage(goldLoss), ['마을']));
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
      // 골드 손실 (10% 약탈)
      const goldLoss = Math.floor(user.gold * 0.1);
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
      return res.json(reply(getDefeatMessage(goldLoss), ['마을']));
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

  user.currentPattern = nextPattern;
  user.battleTurn = (user.battleTurn || 1) + 1;

  text += `📖 다음 전조\n${nextTelegraph}`;

  // 연속 성공 표시
  const streak = user.interpretStreak || 0;
  if (streak >= 3) {
    const streakBonus = getStreakBonus(streak);
    text += `\n🔥 ${streak}연속! 공격 +${streakBonus}%`;
  }
  
  await saveUser(userId, user);
  
  const validChoices = nextChoices.filter(c => c !== '???');
  const buttons = [...validChoices, '스킬', '물약', '도망'].slice(0, 6);
  
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
    const ui = getBattleStartUI(u, monster, telegraph, choices, understandingLevel);
    const monsterImg = getMonsterImage(monster.name);
    
    if (monsterImg) {
      return res.json(replyWithImage(monsterImg, ui.text, ui.buttons));
    }
    return res.json(reply(ui.text, ui.buttons));
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
        // 골드 손실 (10% 약탈)
        const goldLoss = Math.floor(u.gold * 0.1);
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
        return res.json(reply(getDefeatMessage(goldLoss), ['마을']));
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
