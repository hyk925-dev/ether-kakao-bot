// ============================================
// Admin Handler v4.0
// 운영자 전용 명령어
// ============================================

const { reply } = require('../../utils/response');
const { getUserByName, getAllTownUsers } = require('../../utils/db');

// ============================================
// 운영자 ID 목록
// ============================================

const ADMIN_IDS = [
  "4788a61df5328e806f6192ea583d17600957cd6146af22eed0221b16cb7bd4b6bc" // 대표님
];

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * Timestamp를 밀리초로 변환
 */
function toMillis(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp?.toMillis) return timestamp.toMillis();
  if (timestamp?._seconds) return timestamp._seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  return new Date(timestamp).getTime();
}

/**
 * 시간 전 표시 (예: 5분 전, 2시간 전)
 */
function getTimeAgo(timestamp) {
  const now = Date.now();
  const then = toMillis(timestamp);
  const diff = now - then;
  
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

/**
 * 날짜 포맷 (YYYY.MM.DD)
 */
function formatDate(timestamp) {
  if (!timestamp) return '알 수 없음';
  const date = new Date(toMillis(timestamp));
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================
// @내아이디
// ============================================

async function handleMyId(userId, res) {
  return res.json(reply(`당신의 ID:\n${userId}`, ['마을']));
}

// ============================================
// @유저정보 [이름]
// ============================================

async function handleUserInfo(userName, res) {
  const user = await getUserByName(userName);
  
  if (!user) {
    return res.json(reply(`유저 "${userName}"을 찾을 수 없습니다.`, ['마을']));
  }
  
  // 플레이타임 계산
  const playtime = user.totalPlaytime || 0;
  const hours = Math.floor(playtime / 60);
  const mins = Math.floor(playtime % 60);
  
  // 마지막 접속
  const lastLogin = user.lastLogin ? getTimeAgo(user.lastLogin) : '알 수 없음';
  
  // 승률 계산
  const totalBattles = user.totalBattles || 0;
  const deaths = user.totalDeaths || 0;
  const winRate = totalBattles > 0 ? Math.floor(((totalBattles - deaths) / totalBattles) * 100) : 0;
  
  let text = `━━━━━━━━━━━━━━━━━━\n`;
  text += `【 ${user.name} 】\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `직업: ${user.job || '없음'}\n`;
  text += `레벨: ${user.lv || user.level || 1}\n`;
  text += `층수: ${user.floor || 1}층 (최고: ${user.maxFloor || 1}층)\n`;
  text += `골드: ${(user.gold || 0).toLocaleString()}G\n`;
  text += `\n【 전투 기록 】\n`;
  text += `총 전투: ${totalBattles}회\n`;
  text += `승률: ${winRate}%\n`;
  text += `처치: ${(user.totalKills || 0).toLocaleString()}마리\n`;
  text += `보스 처치: ${user.totalBossKills || 0}회\n`;
  text += `\n【 활동 】\n`;
  text += `플레이타임: ${hours}시간 ${mins}분\n`;
  text += `접속 횟수: ${user.loginCount || 0}회\n`;
  text += `연속 접속: ${user.loginStreak || 0}일\n`;
  text += `마지막 접속: ${lastLogin}\n`;
  text += `생성일: ${formatDate(user.createdAt)}`;
  
  return res.json(reply(text, ['@전체통계', '마을']));
}

// ============================================
// @전체통계
// ============================================

async function handleServerStats(res) {
  try {
    const allUsers = await getAllTownUsers();
    
    if (!allUsers || allUsers.length === 0) {
      return res.json(reply('등록된 유저가 없습니다.', ['마을']));
    }
    
    // 통계 계산
    const totalUsers = allUsers.length;
    const totalBattles = allUsers.reduce((sum, u) => sum + (u.totalBattles || 0), 0);
    const totalKills = allUsers.reduce((sum, u) => sum + (u.totalKills || 0), 0);
    const totalGold = allUsers.reduce((sum, u) => sum + (u.gold || 0), 0);
    const totalPlaytime = allUsers.reduce((sum, u) => sum + (u.totalPlaytime || 0), 0);
    
    const avgLevel = Math.floor(allUsers.reduce((sum, u) => sum + (u.lv || u.level || 1), 0) / totalUsers);
    const avgFloor = Math.floor(allUsers.reduce((sum, u) => sum + (u.floor || 1), 0) / totalUsers);
    const avgPlaytime = Math.floor(totalPlaytime / totalUsers);
    
    const maxFloor = Math.max(...allUsers.map(u => u.maxFloor || u.floor || 1));
    const maxLevel = Math.max(...allUsers.map(u => u.lv || u.level || 1));
    
    let text = `━━━━━━━━━━━━━━━━━━\n`;
    text += `【 서버 통계 】\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `총 유저: ${totalUsers}명\n`;
    text += `\n【 평균 】\n`;
    text += `레벨: ${avgLevel}\n`;
    text += `층수: ${avgFloor}층\n`;
    text += `플레이타임: ${Math.floor(avgPlaytime / 60)}시간 ${avgPlaytime % 60}분\n`;
    text += `\n【 최고 기록 】\n`;
    text += `최고층: ${maxFloor}층\n`;
    text += `최고레벨: ${maxLevel}\n`;
    text += `\n【 전체 합계 】\n`;
    text += `총 전투: ${totalBattles.toLocaleString()}회\n`;
    text += `총 처치: ${totalKills.toLocaleString()}마리\n`;
    text += `총 골드: ${totalGold.toLocaleString()}G\n`;
    text += `━━━━━━━━━━━━━━━━━━`;
    
    return res.json(reply(text, ['@접속현황', '@랭킹상세', '마을']));
  } catch (err) {
    console.error('전체통계 오류:', err);
    return res.json(reply('통계 조회 중 오류가 발생했습니다.', ['마을']));
  }
}

// ============================================
// @접속현황
// ============================================

async function handleOnlineStatus(res) {
  try {
    const allUsers = await getAllTownUsers();
    
    if (!allUsers || allUsers.length === 0) {
      return res.json(reply('등록된 유저가 없습니다.', ['마을']));
    }
    
    const now = Date.now();
    const online = allUsers.filter(u => {
      if (!u.lastLogin) return false;
      const diff = now - toMillis(u.lastLogin);
      return diff < 5 * 60 * 1000; // 5분 이내
    });
    
    const recent = allUsers.filter(u => {
      if (!u.lastLogin) return false;
      const diff = now - toMillis(u.lastLogin);
      return diff >= 5 * 60 * 1000 && diff < 60 * 60 * 1000; // 5분~1시간
    });
    
    const today = allUsers.filter(u => {
      if (!u.lastLogin) return false;
      const diff = now - toMillis(u.lastLogin);
      return diff >= 60 * 60 * 1000 && diff < 24 * 60 * 60 * 1000; // 1~24시간
    });
    
    let text = `━━━━━━━━━━━━━━━━━━\n`;
    text += `【 접속 현황 】\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `🟢 현재 접속: ${online.length}명\n`;
    text += `🟡 최근 활동: ${recent.length}명\n`;
    text += `⚪ 오늘 접속: ${today.length}명\n`;
    text += `\n【 접속 중인 유저 】\n`;
    
    if (online.length === 0) {
      text += '(없음)\n';
    } else {
      online.slice(0, 10).forEach(u => {
        const timeAgo = getTimeAgo(u.lastLogin);
        text += `• ${u.name} Lv.${u.lv || u.level || 1} (${timeAgo})\n`;
      });
    }
    
    text += `\n━━━━━━━━━━━━━━━━━━`;
    
    return res.json(reply(text, ['@전체통계', '@랭킹상세', '마을']));
  } catch (err) {
    console.error('접속현황 오류:', err);
    return res.json(reply('접속 현황 조회 중 오류가 발생했습니다.', ['마을']));
  }
}

// ============================================
// @랭킹상세
// ============================================

async function handleDetailedRanking(res) {
  try {
    const allUsers = await getAllTownUsers();
    
    if (!allUsers || allUsers.length === 0) {
      return res.json(reply('등록된 유저가 없습니다.', ['마을']));
    }
    
    // 층수 랭킹
    const floorRank = [...allUsers]
      .sort((a, b) => (b.maxFloor || b.floor || 1) - (a.maxFloor || a.floor || 1))
      .slice(0, 3);
    
    // 레벨 랭킹
    const levelRank = [...allUsers]
      .sort((a, b) => (b.lv || b.level || 1) - (a.lv || a.level || 1))
      .slice(0, 3);
    
    // 플레이타임 랭킹
    const timeRank = [...allUsers]
      .sort((a, b) => (b.totalPlaytime || 0) - (a.totalPlaytime || 0))
      .slice(0, 3);
    
    // 처치 랭킹
    const killRank = [...allUsers]
      .sort((a, b) => (b.totalKills || 0) - (a.totalKills || 0))
      .slice(0, 3);
    
    // 부자 랭킹
    const goldRank = [...allUsers]
      .sort((a, b) => (b.gold || 0) - (a.gold || 0))
      .slice(0, 3);
    
    let text = `━━━━━━━━━━━━━━━━━━\n`;
    text += `【 상세 랭킹 】\n`;
    text += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `◆ 층수 랭킹\n`;
    floorRank.forEach((u, i) => { 
      text += `${i + 1}. ${u.name} — ${u.maxFloor || u.floor || 1}층\n`; 
    });
    
    text += `\n◆ 레벨 랭킹\n`;
    levelRank.forEach((u, i) => { 
      text += `${i + 1}. ${u.name} — Lv.${u.lv || u.level || 1}\n`; 
    });
    
    text += `\n◆ 플레이타임 랭킹\n`;
    timeRank.forEach((u, i) => { 
      const h = Math.floor((u.totalPlaytime || 0) / 60);
      const m = Math.floor((u.totalPlaytime || 0) % 60);
      text += `${i + 1}. ${u.name} — ${h}시간 ${m}분\n`; 
    });
    
    text += `\n◆ 처치 랭킹\n`;
    killRank.forEach((u, i) => { 
      text += `${i + 1}. ${u.name} — ${(u.totalKills || 0).toLocaleString()}마리\n`; 
    });
    
    text += `\n◆ 부자 랭킹\n`;
    goldRank.forEach((u, i) => { 
      text += `${i + 1}. ${u.name} — ${(u.gold || 0).toLocaleString()}G\n`; 
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━`;
    
    return res.json(reply(text, ['@전체통계', '마을']));
  } catch (err) {
    console.error('랭킹상세 오류:', err);
    return res.json(reply('랭킹 조회 중 오류가 발생했습니다.', ['마을']));
  }
}

// ============================================
// 메인 핸들러
// ============================================

async function adminHandler(ctx) {
  const { userId, msg, res } = ctx;
  
  // 운영자 권한 체크
  if (!isAdmin(userId)) {
    return null; // 일반 유저는 통과
  }
  
  // @내아이디
  if (msg === '@내아이디') {
    return handleMyId(userId, res);
  }
  
  // @유저정보 [이름]
  if (msg.startsWith('@유저정보 ')) {
    const userName = msg.replace('@유저정보 ', '').trim();
    if (!userName) {
      return res.json(reply('사용법: @유저정보 [이름]', ['마을']));
    }
    return handleUserInfo(userName, res);
  }
  
  // @전체통계
  if (msg === '@전체통계') {
    return handleServerStats(res);
  }
  
  // @접속현황
  if (msg === '@접속현황') {
    return handleOnlineStatus(res);
  }
  
  // @랭킹상세
  if (msg === '@랭킹상세') {
    return handleDetailedRanking(res);
  }
  
  return null; // 매칭 안 되면 다음 핸들러로
}

// ============================================
// Export
// ============================================

module.exports = { adminHandler, isAdmin };
