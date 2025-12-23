// ============================================
// 데이터베이스 함수 v4.0
// ============================================

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase 초기화
if (!getApps().length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT 환경 변수 없음');
    process.exit(1);
  }
  
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase 초기화 완료');
  } catch (err) {
    console.error('❌ Firebase 초기화 실패:', err.message);
    process.exit(1);
  }
}

const db = getFirestore();

// ============================================
// 유저 CRUD
// ============================================

/**
 * 유저 데이터 가져오기
 */
async function getUser(id) {
  const doc = await db.collection('users').doc(id).get();
  if (!doc.exists) return null;
  
  const data = doc.data();
  
  // v4.0: battleUnderstanding 필드 초기화
  if (!data.battleUnderstanding) {
    data.battleUnderstanding = {};
  }
  
  // v4.0: interpretStreak 초기화
  if (data.interpretStreak === undefined) {
    data.interpretStreak = 0;
  }
  
  return data;
}

/**
 * 유저 데이터 저장
 */
async function saveUser(id, data) {
  // v4.0: battleUnderstanding 유효성 검사
  if (data.battleUnderstanding) {
    const limited = {};
    for (const [key, value] of Object.entries(data.battleUnderstanding)) {
      if (value && typeof value === 'object') {
        limited[key] = {
          exp: Math.min(value.exp || 0, 1000),
          level: Math.min(value.level || 0, 4)
        };
      }
    }
    data.battleUnderstanding = limited;
    
    // 크기 제한 (최대 100개 몬스터)
    const keys = Object.keys(limited);
    if (keys.length > 100) {
      const keep = keys.slice(-100);
      data.battleUnderstanding = Object.fromEntries(
        keep.map(k => [k, limited[k]])
      );
    }
  }
  
  // lastLogin 업데이트
  data.lastLogin = Date.now();
  
  await db.collection('users').doc(id).set(data, { merge: true });
}

/**
 * 유저 삭제
 */
async function deleteUser(id) {
  await db.collection('users').doc(id).delete();
}

/**
 * 이름으로 유저 검색
 */
async function getUserByName(name) {
  const snapshot = await db.collection('users').where('name', '==', name).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { docId: doc.id, ...doc.data() };
}

/**
 * 이메일로 유저 검색
 */
async function getUserByEmail(email) {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { docId: doc.id, ...doc.data() };
}

/**
 * 상위 유저 조회
 */
async function getTopUsers(field, limit = 10) {
  const snapshot = await db.collection('users').where('phase', '==', 'town').get();
  const users = snapshot.docs.map(doc => ({ ...doc.data() }));
  
  // 필드에 따라 정렬
  if (field === 'floor') {
    users.sort((a, b) => (b.maxFloor || b.floor || 1) - (a.maxFloor || a.floor || 1));
  } else {
    users.sort((a, b) => (b[field] || 0) - (a[field] || 0));
  }
  
  return users.slice(0, limit).map((u, i) => ({ rank: i + 1, ...u }));
}

/**
 * 모든 마을 유저 조회
 */
async function getAllTownUsers() {
  const snapshot = await db.collection('users').where('phase', '==', 'town').get();
  return snapshot.docs.map(doc => ({ ...doc.data() }));
}

/**
 * 모든 유저 조회 (관리자용)
 */
async function getAllUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
}

// ============================================
// v4.0: 전투 이해도 저장
// ============================================

/**
 * 전투 이해도 저장 (별도 함수)
 */
async function saveBattleUnderstanding(userId, monsterId, exp, level) {
  const userRef = db.collection('users').doc(userId);
  
  await userRef.update({
    [`battleUnderstanding.${monsterId}.exp`]: Math.min(exp, 1000),
    [`battleUnderstanding.${monsterId}.level`]: Math.min(level, 4)
  });
}

/**
 * 일괄 업데이트 (성능 최적화)
 */
async function batchUpdate(userId, updates) {
  const userRef = db.collection('users').doc(userId);
  await userRef.update(updates);
}

// ============================================
// v4.0: 통계 저장
// ============================================

/**
 * 전투 통계 저장
 */
async function saveStats(userId, stats) {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ stats });
}

// ============================================
// Export
// ============================================

module.exports = {
  db,
  getUser,
  saveUser,
  deleteUser,
  getUserByName,
  getUserByEmail,
  getTopUsers,
  getAllTownUsers,
  getAllUsers,
  saveBattleUnderstanding,
  saveStats,
  batchUpdate
};
