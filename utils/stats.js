// ============================================
// 통계 추적 함수 v4.0
// ============================================

/**
 * v4.0 전투 통계 추적
 * - 해석 성공/실패 기록
 * - 패턴별 통계
 * - 몬스터별 통계
 * - 직업별 통계
 */

// ============================================
// 전투 통계 초기화
// ============================================

/**
 * 플레이어 통계 구조 초기화
 * v4.0 수정: 각 하위 필드 개별 체크 (기존 유저 호환)
 * @param {Object} player - 플레이어
 */
function initPlayerStats(player) {
  // 1. stats 객체 자체가 없으면 생성
  if (!player.stats) {
    player.stats = {};
  }

  // 2. 기본 숫자 필드 개별 체크
  if (typeof player.stats.totalBattles !== 'number') {
    player.stats.totalBattles = 0;
  }
  if (typeof player.stats.totalWins !== 'number') {
    player.stats.totalWins = 0;
  }
  if (typeof player.stats.totalDeaths !== 'number') {
    player.stats.totalDeaths = 0;
  }
  if (typeof player.stats.totalDamageDealt !== 'number') {
    player.stats.totalDamageDealt = 0;
  }
  if (typeof player.stats.totalDamageTaken !== 'number') {
    player.stats.totalDamageTaken = 0;
  }
  if (typeof player.stats.totalHealing !== 'number') {
    player.stats.totalHealing = 0;
  }

  // 3. 해석 통계 객체 체크
  if (!player.stats.interpretStats) {
    player.stats.interpretStats = {};
  }
  if (typeof player.stats.interpretStats.perfect !== 'number') {
    player.stats.interpretStats.perfect = 0;
  }
  if (typeof player.stats.interpretStats.partial !== 'number') {
    player.stats.interpretStats.partial = 0;
  }
  if (typeof player.stats.interpretStats.fail !== 'number') {
    player.stats.interpretStats.fail = 0;
  }
  if (typeof player.stats.interpretStats.total !== 'number') {
    player.stats.interpretStats.total = 0;
  }
  if (typeof player.stats.interpretStats.currentStreak !== 'number') {
    player.stats.interpretStats.currentStreak = 0;
  }
  if (typeof player.stats.interpretStats.bestStreak !== 'number') {
    player.stats.interpretStats.bestStreak = 0;
  }

  // 4. 패턴별 통계 객체 체크
  if (!player.stats.patternStats) {
    player.stats.patternStats = {};
  }

  // 5. 몬스터별 통계 객체 체크
  if (!player.stats.monsterStats) {
    player.stats.monsterStats = {};
  }

  // 6. 보스 통계 객체 체크
  if (!player.stats.bossStats) {
    player.stats.bossStats = {};
  }
  if (typeof player.stats.bossStats.kills !== 'number') {
    player.stats.bossStats.kills = 0;
  }
  if (typeof player.stats.bossStats.deaths !== 'number') {
    player.stats.bossStats.deaths = 0;
  }
  if (player.stats.bossStats.bestTime === undefined) {
    player.stats.bossStats.bestTime = null;
  }

  // 7. 직업 통계 객체 체크
  if (!player.stats.jobStats) {
    player.stats.jobStats = {};
  }
}

// ============================================
// 전투 기록
// ============================================

/**
 * 전투 시작 기록
 * @param {Object} player - 플레이어
 * @param {Object} monster - 몬스터
 */
function recordBattleStart(player, monster) {
  initPlayerStats(player);
  
  player.stats.totalBattles++;
  
  // 몬스터별 통계 초기화
  const monsterId = monster.id || monster.name;
  if (!player.stats.monsterStats[monsterId]) {
    player.stats.monsterStats[monsterId] = {
      encounters: 0,
      wins: 0,
      deaths: 0,
      totalTurns: 0,
      fastestKill: null
    };
  }
  
  player.stats.monsterStats[monsterId].encounters++;
  
  // 전투 시작 시간 기록
  player.currentBattle = {
    startTime: Date.now(),
    turns: 0,
    damageDealt: 0,
    damageTaken: 0,
    healing: 0,
    monsterId
  };
}

/**
 * 전투 승리 기록
 * @param {Object} player - 플레이어
 * @param {Object} monster - 몬스터
 */
function recordBattleWin(player, monster) {
  initPlayerStats(player);
  
  player.stats.totalWins++;
  
  const monsterId = monster.id || monster.name;
  const monsterStat = player.stats.monsterStats[monsterId];
  
  if (monsterStat) {
    monsterStat.wins++;
    monsterStat.totalTurns += player.currentBattle?.turns || 0;
    
    // 최단 킬 타임 업데이트
    const killTime = player.currentBattle?.turns || 0;
    if (!monsterStat.fastestKill || killTime < monsterStat.fastestKill) {
      monsterStat.fastestKill = killTime;
    }
  }
  
  // 보스 킬 기록
  if (monster.isBoss) {
    player.stats.bossStats.kills++;
    
    const battleTime = player.currentBattle?.turns || 0;
    if (!player.stats.bossStats.bestTime || battleTime < player.stats.bossStats.bestTime) {
      player.stats.bossStats.bestTime = battleTime;
    }
  }
  
  // 전투 데이터 누적
  if (player.currentBattle) {
    player.stats.totalDamageDealt += player.currentBattle.damageDealt;
    player.stats.totalDamageTaken += player.currentBattle.damageTaken;
    player.stats.totalHealing += player.currentBattle.healing;
  }
  
  // 전투 종료
  player.currentBattle = null;
}

/**
 * 전투 패배 기록
 * @param {Object} player - 플레이어
 * @param {Object} monster - 몬스터
 */
function recordBattleDeath(player, monster) {
  initPlayerStats(player);
  
  player.stats.totalDeaths++;
  
  const monsterId = monster.id || monster.name;
  const monsterStat = player.stats.monsterStats[monsterId];
  
  if (monsterStat) {
    monsterStat.deaths++;
  }
  
  // 보스 사망 기록
  if (monster.isBoss) {
    player.stats.bossStats.deaths++;
  }
  
  // 해석 연속 성공 초기화
  player.stats.interpretStats.currentStreak = 0;
  
  // 전투 종료
  player.currentBattle = null;
}

// ============================================
// 해석 통계
// ============================================

/**
 * 해석 결과 기록
 * @param {Object} player - 플레이어
 * @param {string} result - 해석 결과 ('perfect'|'partial'|'fail')
 * @param {Object} pattern - 패턴
 */
function recordInterpret(player, result, pattern) {
  initPlayerStats(player);
  
  const interpretStats = player.stats.interpretStats;
  interpretStats.total++;
  
  if (result === 'perfect') {
    interpretStats.perfect++;
    interpretStats.currentStreak++;
    
    // 최고 연속 성공 갱신
    if (interpretStats.currentStreak > interpretStats.bestStreak) {
      interpretStats.bestStreak = interpretStats.currentStreak;
    }
  } else if (result === 'partial') {
    interpretStats.partial++;
    interpretStats.currentStreak = 0;
  } else if (result === 'fail') {
    interpretStats.fail++;
    interpretStats.currentStreak = 0;
  }
  
  // 패턴별 통계
  if (pattern) {
    const patternId = pattern.id;
    if (!player.stats.patternStats[patternId]) {
      player.stats.patternStats[patternId] = {
        encounters: 0,
        perfect: 0,
        partial: 0,
        fail: 0
      };
    }
    
    const patternStat = player.stats.patternStats[patternId];
    patternStat.encounters++;
    patternStat[result]++;
  }
}

/**
 * 해석 성공률 계산
 * @param {Object} player - 플레이어
 * @returns {Object} { perfect: %, partial: %, fail: % }
 */
function getInterpretSuccessRate(player) {
  initPlayerStats(player);
  
  const interpretStats = player.stats.interpretStats;
  const total = interpretStats.total || 1;
  
  return {
    perfect: Math.floor((interpretStats.perfect / total) * 100),
    partial: Math.floor((interpretStats.partial / total) * 100),
    fail: Math.floor((interpretStats.fail / total) * 100),
    total: interpretStats.total
  };
}

// ============================================
// 턴 기록
// ============================================

/**
 * 턴 증가
 * @param {Object} player - 플레이어
 */
function incrementTurn(player) {
  if (player.currentBattle) {
    player.currentBattle.turns++;
  }
}

/**
 * 피해량 기록
 * @param {Object} player - 플레이어
 * @param {number} damage - 피해량
 * @param {string} type - 'dealt' | 'taken'
 */
function recordDamage(player, damage, type) {
  if (player.currentBattle) {
    if (type === 'dealt') {
      player.currentBattle.damageDealt += damage;
    } else if (type === 'taken') {
      player.currentBattle.damageTaken += damage;
    }
  }
}

/**
 * 회복량 기록
 * @param {Object} player - 플레이어
 * @param {number} amount - 회복량
 */
function recordHealing(player, amount) {
  if (player.currentBattle) {
    player.currentBattle.healing += amount;
  }
}

// ============================================
// 통계 조회
// ============================================

/**
 * 몬스터별 통계 조회
 * @param {Object} player - 플레이어
 * @param {string} monsterId - 몬스터 ID
 * @returns {Object} 몬스터 통계
 */
function getMonsterStats(player, monsterId) {
  initPlayerStats(player);
  
  return player.stats.monsterStats[monsterId] || {
    encounters: 0,
    wins: 0,
    deaths: 0,
    totalTurns: 0,
    fastestKill: null
  };
}

/**
 * 패턴별 통계 조회
 * @param {Object} player - 플레이어
 * @param {string} patternId - 패턴 ID
 * @returns {Object} 패턴 통계
 */
function getPatternStats(player, patternId) {
  initPlayerStats(player);
  
  return player.stats.patternStats[patternId] || {
    encounters: 0,
    perfect: 0,
    partial: 0,
    fail: 0
  };
}

/**
 * 전체 통계 요약
 * @param {Object} player - 플레이어
 * @returns {Object} 통계 요약
 */
function getStatsSummary(player) {
  initPlayerStats(player);
  
  const s = player.stats;
  const winRate = s.totalBattles > 0 
    ? Math.floor((s.totalWins / s.totalBattles) * 100)
    : 0;
  
  const avgDamagePerBattle = s.totalBattles > 0
    ? Math.floor(s.totalDamageDealt / s.totalBattles)
    : 0;
  
  return {
    totalBattles: s.totalBattles,
    totalWins: s.totalWins,
    totalDeaths: s.totalDeaths,
    winRate,
    avgDamagePerBattle,
    totalDamageDealt: s.totalDamageDealt,
    totalDamageTaken: s.totalDamageTaken,
    totalHealing: s.totalHealing,
    interpretStats: s.interpretStats,
    bossKills: s.bossStats.kills,
    bossDeaths: s.bossStats.deaths,
    bossBestTime: s.bossStats.bestTime
  };
}

/**
 * 통계 텍스트 생성
 * @param {Object} player - 플레이어
 * @returns {string} 통계 텍스트
 */
function getStatsText(player) {
  const summary = getStatsSummary(player);
  const interpretRate = getInterpretSuccessRate(player);
  
  let text = '📊 전투 통계\n';
  text += '━━━━━━━━━━━━━━━\n';
  text += `전투: ${summary.totalBattles}회 (승:${summary.totalWins} 패:${summary.totalDeaths})\n`;
  text += `승률: ${summary.winRate}%\n`;
  text += `평균 피해: ${summary.avgDamagePerBattle.toLocaleString()}\n\n`;
  
  text += `【 해석 통계 】\n`;
  text += `✅ 완벽: ${interpretRate.perfect}% (${summary.interpretStats.perfect}회)\n`;
  text += `⚠️ 부분: ${interpretRate.partial}% (${summary.interpretStats.partial}회)\n`;
  text += `❌ 실패: ${interpretRate.fail}% (${summary.interpretStats.fail}회)\n`;
  text += `🔥 최고 연속: ${summary.interpretStats.bestStreak}회\n\n`;
  
  if (summary.bossKills > 0) {
    text += `【 보스 】\n`;
    text += `처치: ${summary.bossKills}회\n`;
    if (summary.bossBestTime) {
      text += `최단 시간: ${summary.bossBestTime}턴\n`;
    }
  }
  
  return text;
}

/**
 * 몬스터 통계 텍스트
 * @param {Object} player - 플레이어
 * @param {string} monsterId - 몬스터 ID
 * @param {string} monsterName - 몬스터 이름
 * @returns {string} 통계 텍스트
 */
function getMonsterStatsText(player, monsterId, monsterName) {
  const stats = getMonsterStats(player, monsterId);
  
  if (stats.encounters === 0) {
    return `${monsterName}: 미조우`;
  }
  
  const winRate = stats.encounters > 0
    ? Math.floor((stats.wins / stats.encounters) * 100)
    : 0;
  
  const avgTurns = stats.wins > 0
    ? Math.floor(stats.totalTurns / stats.wins)
    : 0;
  
  let text = `📋 ${monsterName}\n`;
  text += `━━━━━━━━━━━━━━━\n`;
  text += `조우: ${stats.encounters}회\n`;
  text += `승리: ${stats.wins}회 (${winRate}%)\n`;
  text += `사망: ${stats.deaths}회\n`;
  
  if (stats.wins > 0) {
    text += `평균 턴: ${avgTurns}턴\n`;
  }
  
  if (stats.fastestKill) {
    text += `최단 킬: ${stats.fastestKill}턴\n`;
  }
  
  return text;
}

// ============================================
// 직업별 통계
// ============================================

/**
 * 직업별 통계 기록
 * @param {Object} player - 플레이어
 * @param {string} action - 액션 타입
 */
function recordJobAction(player, action) {
  initPlayerStats(player);
  
  const jobId = player.job;
  if (!player.stats.jobStats[jobId]) {
    player.stats.jobStats[jobId] = {
      skillUsed: 0,
      passiveTriggered: 0,
      totalDamage: 0
    };
  }
  
  const jobStat = player.stats.jobStats[jobId];
  
  if (action === 'skill') {
    jobStat.skillUsed++;
  } else if (action === 'passive') {
    jobStat.passiveTriggered++;
  }
}

// ============================================
// 이해도 경험치 텍스트
// ============================================

/**
 * 이해도 레벨 텍스트
 * @param {number} level - 이해도 레벨 (0~4)
 * @returns {string} 레벨 이름
 */
function getUnderstandingLevelText(level) {
  const levels = [
    '생소함',    // 0
    '관찰 중',   // 1
    '이해함',    // 2
    '숙련됨',    // 3
    '완벽 파악'  // 4
  ];
  
  return levels[level] || '알 수 없음';
}

/**
 * 이해도 진행도 바
 * @param {number} exp - 현재 경험치
 * @param {number} level - 현재 레벨
 * @returns {string} 진행도 바
 */
function getUnderstandingProgressBar(exp, level) {
  if (level >= 4) {
    return '[██████████] MAX';
  }
  
  const progress = Math.floor((exp / 100) * 10);
  const filled = '█'.repeat(progress);
  const empty = '░'.repeat(10 - progress);
  
  return `[${filled}${empty}] ${exp}/100`;
}

// ============================================
// Export
// ============================================

module.exports = {
  // 초기화
  initPlayerStats,
  
  // 전투 기록
  recordBattleStart,
  recordBattleWin,
  recordBattleDeath,
  
  // 해석 통계
  recordInterpret,
  getInterpretSuccessRate,
  
  // 턴/피해 기록
  incrementTurn,
  recordDamage,
  recordHealing,
  
  // 통계 조회
  getMonsterStats,
  getPatternStats,
  getStatsSummary,
  getStatsText,
  getMonsterStatsText,
  
  // 직업 통계
  recordJobAction,
  
  // 이해도
  getUnderstandingLevelText,
  getUnderstandingProgressBar
};
