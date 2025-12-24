// ============================================
// ETHER ONLINE v4.0 Webhook
// ============================================

/**
 * v4.0 주요 변경점:
 * - 전투 시스템을 v4.0 패턴 기반으로 교체
 * - handlers 폴더로 기능 분리
 * - 라우팅 순서 최적화
 */

const express = require('express');
const app = express();
app.use(express.json());

// Utils imports
const { getUser, saveUser, deleteUser, getUserByName, getTopUsers } = require('../utils/db');
const { calcStats } = require('../utils/calc');
const { reply } = require('../utils/response');
const { getEtherMenu } = require('../utils/text');

// Handler imports
const {
  authHandler,
  townHandler,
  battleHandler,
  equipmentHandler,
  shopHandler,
  exploreHandler,
  socialHandler,
  adminHandler,
  isAdmin
} = require('./handlers');

// Railway 헬스체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: 'v4.0.0',
    timestamp: new Date().toISOString(),
    combat: 'pattern-based'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'ETHER ONLINE v4.0.0 API',
    status: 'running',
    combat: 'pattern-based',
    handlers: 8
  });
});

// ============================================
// 명령어 동의어 매핑
// ============================================

const SYNONYMS = {
  // 기본
  '홈': '마을',
  '귀환': '마을',
  '스탯': '상태',
  '정보': '상태',

  // 전투 (아이콘 버튼 대응)
  '💨 회피': '회피',
  '🛡️ 방어': '방어',
  '⚔️ 역습': '역습',
  '피하기': '회피',
  '막기': '방어',
  '가드': '방어',
  '반격': '역습',
  '카운터': '역습',

  // 상점
  '물약': '하급물약',

  // 기타
  '도움말': '@에테르',
  '도움': '@에테르',
  '?': '@에테르'
};

// ============================================
// Main Webhook
// ============================================

app.post('/api/webhook', async (req, res) => {
  try {
    // ========================================
    // 0. 기본 데이터 추출
    // ========================================
    const userId = req.body.userRequest?.user?.id;
    const rawMsg = req.body.userRequest?.utterance?.trim() || '';

    // 동의어 변환
    const msg = SYNONYMS[rawMsg] || rawMsg;

    if (!userId) {
      return res.json(reply('오류 발생', ['시작']));
    }
    
    // ========================================
    // 유저 정보 로드
    // ========================================
    let u = await getUser(userId);
    const c = u ? calcStats(u) : null;
    
    // 컨텍스트 생성
    const ctx = {
      userId,
      msg,
      u,
      c,
      res,
      saveUser,
      deleteUser,
      getUserByName,
      getTopUsers,
      calcStats,
      isAdmin: isAdmin(userId)
    };
    
    // ========================================
    // 1. 공통 명령어 (로그인 불필요)
    // ========================================
    
    // @에테르 - 전체 명령어 안내
    if (msg === '@에테르' || msg === '에테르') {
      return res.json(reply(getEtherMenu(), u ? ['마을'] : ['시작']));
    }
    
    // ========================================
    // 2. 운영자 명령어 (최우선)
    // ========================================
    
    if (msg.startsWith('@')) {
      // 운영자 전용 명령어 (@베타보상, @레벨설정, @공지 등)
      const result = await adminHandler(ctx);
      if (result !== null) return result;
      
      // 소셜 명령어 (@결투, @검색, @선물, @자랑)
      const socialCommands = ['@결투', '@검색', '@선물', '@자랑'];
      if (socialCommands.some(cmd => msg.startsWith(cmd))) {
        return await socialHandler(ctx);
      }
    }
    
    // 랭킹 (로그인 불필요)
    if (msg === '랭킹' || msg === '전투력랭킹') {
      return await socialHandler(ctx);
    }
    
    // ========================================
    // 3. 비로그인 / 캐릭터 생성 단계
    // ========================================
    // user가 없거나 생성 단계면 authHandler로
    
    if (!u || u.phase === 'naming' || u.phase === 'job') {
      return await authHandler(ctx);
    }

    // ========================================
    // 3-1. 상태 리셋 (전투 중 막혔을 때)
    // ========================================

    if (msg === '리셋' || msg === '초기화' || msg === '@리셋') {
      // 전투 상태 초기화
      u.phase = 'town';
      u.currentBattle = null;
      u.battleState = null;
      u.currentEnemy = null;
      u.inBattle = false;

      await saveUser(userId, u);

      return res.json(reply(
        "🔄 상태가 초기화되었습니다.\n마을로 이동합니다.",
        ['전투', '상점', '장비', '상태']
      ));
    }

    if (msg === '탈출' || msg === '강제마을') {
      u.phase = 'town';
      u.currentBattle = null;
      u.battleState = null;

      await saveUser(userId, u);

      return res.json(reply(
        "🏠 마을로 강제 이동했습니다.",
        ['전투', '상점', '장비', '상태']
      ));
    }

    // ========================================
    // 4. 전투 중 (phase: battle)
    // ========================================
    
    if (u.phase === 'battle') {
      return await battleHandler(ctx);
    }
    
    // ========================================
    // 5. 탐사 이벤트 중 (phase: event_*)
    // ========================================
    
    if (u.phase && u.phase.startsWith('event_')) {
      return await exploreHandler(ctx);
    }
    
    // ========================================
    // 6. 마을 (phase: town)
    // ========================================
    
    if (u.phase === 'town') {
      
      // ----------------------------------------
      // 6-1. 마을 명령어 (townHandler)
      // ----------------------------------------
      const townCommands = ['마을', '상태', '휴식', '층이동', '정화', '더보기', '스탯투자', '스탯', '저주해제'];
      const townPatterns = [
        /^\d+층$/,                              // 15층
        /^\d+층으로$/,                          // 2층으로
        /^\d+층\s?파밍$/,                       // 1층 파밍, 1층파밍
        /^(힘|민첩|지능|의지|체력|운)\+/        // 힘+5, 민첩+전부
      ];
      
      if (townCommands.includes(msg) || townPatterns.some(p => p.test(msg))) {
        return await townHandler(ctx);
      }
      
      // ----------------------------------------
      // 6-2. 전투 (battleHandler)
      // ----------------------------------------
      if (msg === '전투' || msg === '광기전투') {
        return await battleHandler(ctx);
      }

      // ----------------------------------------
      // 6-2-1. 보스 도전 (battleHandler)
      // ----------------------------------------
      if (msg === '보스 도전' || msg === '🔥 보스 도전' || msg === '보스도전' || msg === '보스') {
        return await battleHandler(ctx);
      }
      
      // ----------------------------------------
      // 6-3. 장비 (equipmentHandler)
      // ----------------------------------------
      const equipCommands = ['장비', '목록', '강화', '판매', '이전', '다음'];
      const equipPatterns = [
        /^\d+번$/,                    // 1번, 2번
        /^장착/,                      // 장착
        /^판매\d+$/,                  // 판매1
        /^인벤\d+$/,                  // 인벤1
        /^상세/,                      // 상세
        /^강화weapon$/,               // 강화weapon
        /^강화armor$/,                // 강화armor
        /^강화accessory$/,            // 강화accessory
        /^강화relic$/                 // 강화relic
      ];
      
      if (equipCommands.includes(msg) || equipPatterns.some(p => p.test(msg))) {
        return await equipmentHandler(ctx);
      }
      
      // ----------------------------------------
      // 6-4. 상점 (shopHandler)
      // ----------------------------------------
      const shopCommands = ['상점', '물약구매'];
      const shopPatterns = [
        /^(하급|중급|고급|진정제)/,
        /^물약\+\d+$/,
        /^중급물약\+\d+$/,
        /^고급물약\+\d+$/
      ];
      
      if (shopCommands.includes(msg) || shopPatterns.some(p => p.test(msg))) {
        return await shopHandler(ctx);
      }
      
      // ----------------------------------------
      // 6-5. 탐사 (exploreHandler)
      // ----------------------------------------
      const exploreCommands = ['탐사', '안전탐사', '위험탐사', '금기탐사', '모닥불'];
      if (exploreCommands.includes(msg)) {
        return await exploreHandler(ctx);
      }
      
      // ----------------------------------------
      // 6-6. 통계
      // ----------------------------------------
      if (msg === '통계' || msg === '@통계') {
        const { getStatsText } = require('../utils/stats');
        const statsText = getStatsText(u);
        return res.json(reply(statsText, ['마을']));
      }
      
      // ----------------------------------------
      // 6-7. 초기화
      // ----------------------------------------
      if (msg === '초기화' || msg === '초기화확인') {
        return await authHandler(ctx);
      }
    }
    
    // ========================================
    // 7. 매칭 안 됨 - Fallback 응답
    // ========================================
    
    return res.json(reply(
      '명령어를 확인해주세요.\n\n💡 v4.0 전투 시스템:\n전투 중 "회피", "방어", "역습" 선택\n\n@에테르 입력시 전체 명령어 안내',
      u ? ['마을', '@에테르'] : ['시작', '@에테르']
    ));
    
  } catch (err) {
    // 상세 에러 로깅
    const errorTime = new Date().toISOString();
    const userInput = req.body.userRequest?.utterance || 'unknown';
    const userId = req.body.userRequest?.user?.id || 'unknown';

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[${errorTime}] Webhook Error`);
    console.error(`User: ${userId.substring(0, 8)}...`);
    console.error(`Input: "${userInput}"`);
    console.error(`Error: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 에러 시 saveUser 안 함 → 유저 상태 유지 → 재시도 가능
    // 카카오 응답 직접 반환 (reply 함수 의존 제거)
    return res.json({
      version: '2.0',
      template: {
        outputs: [{
          simpleText: {
            text: '⚠️ 오류가 발생했습니다.\n다시 시도해주세요.\n\n문제가 계속되면 "마을" 입력'
          }
        }],
        quickReplies: [
          { label: '마을', action: 'message', messageText: '마을' },
          { label: '다시시도', action: 'message', messageText: userInput }
        ]
      }
    });
  }
});

// ============================================
// Railway 배포를 위한 포트 바인딩
// ============================================

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Railway는 0.0.0.0 바인딩 필수

const server = app.listen(PORT, HOST, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ETHER ONLINE v4.0.0`);
  console.log(`Running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health: http://${HOST}:${PORT}/health`);
  console.log(`Combat: Pattern-based v4.0`);
  console.log(`Handlers: 8 modules`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
