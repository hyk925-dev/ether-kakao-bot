// ============================================
// 이미지 URL (Firebase Storage) v3.0
// ============================================
const IMG_BASE = 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether';

// 몬스터 이미지 (기존 매핑 유지)
const MONSTER_IMAGES = {
  '들쥐': `${IMG_BASE}/monsters/rat.png`,
  '슬라임': `${IMG_BASE}/monsters/slime.png`,
  '박쥐': `${IMG_BASE}/monsters/bat.png`,
  '고블린': `${IMG_BASE}/monsters/goblin.png`,
  '독거미': `${IMG_BASE}/monsters/spider.png`,
  '늑대': `${IMG_BASE}/monsters/wolf.png`,
  '해골병사': `${IMG_BASE}/monsters/skeleton.png`,
  // ... (나머지 생략, 기존 유지)
};

// 보스 이미지
const BOSS_IMAGES = {
  '광폭 늑대왕': `${IMG_BASE}/bosses/wolf_king.png`,
  '해골 군주': `${IMG_BASE}/bosses/skeleton_lord.png`,
  '악마 공작': `${IMG_BASE}/bosses/demon_duke.png`,
  '폭풍의 정령왕': `${IMG_BASE}/bosses/storm_king.png`,
  '흑룡': `${IMG_BASE}/bosses/black_dragon.png`,
  '심연의 군주': `${IMG_BASE}/bosses/abyss_lord.png`,
  '타락한 천사장': `${IMG_BASE}/bosses/fallen_archangel.png`,
  '시간의 수호자': `${IMG_BASE}/bosses/time_guardian.png`,
  '혼돈의 화신': `${IMG_BASE}/bosses/chaos_incarnate.png`,
  '종말의 심판자': `${IMG_BASE}/bosses/final_judge.png`,
  '심연의 그림자': `${IMG_BASE}/bosses/abyss_lord.png`,
};

// 직업 이미지
const JOB_IMAGES = {
  'wanderer': `${IMG_BASE}/jobs/wanderer.png`,
  'hunter': `${IMG_BASE}/jobs/hunter.png`,
  'heretic': `${IMG_BASE}/jobs/heretic.png`,
  'shaman': `${IMG_BASE}/jobs/shaman.png`,
  'ironblood': `${IMG_BASE}/jobs/ironblood.png`,
  'scribe': `${IMG_BASE}/jobs/chronicler.png`,
};

// 이벤트 이미지
const EVENT_IMAGES = {
  'gambler': `${IMG_BASE}/events/gambler.png`,
  'ghost': `${IMG_BASE}/events/ghost.png`,
  'statue': `${IMG_BASE}/events/statue.png`,
  'altar': `${IMG_BASE}/events/altar.png`,
  'map': `${IMG_BASE}/events/map.png`,
  'rift': `${IMG_BASE}/events/rift.png`,
};

function getMonsterImage(name) {
  const cleanName = name.replace(/⭐/g, '').replace(/🌑/g, '').replace(/일반|강화|희귀|정예|영웅/g, '').trim();
  return BOSS_IMAGES[cleanName] || MONSTER_IMAGES[cleanName] || null;
}

function getItemImage(slot, grade) {
  return null; // 아이템 이미지 미구현
}

module.exports = {
  IMG_BASE,
  MONSTER_IMAGES,
  BOSS_IMAGES,
  JOB_IMAGES,
  EVENT_IMAGES,
  getMonsterImage,
  getItemImage
};
