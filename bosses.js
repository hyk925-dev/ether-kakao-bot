// bosses.js
// 층별 보스 데이터

const bosses = {
  1: {
    id: 'boss_1',
    name: '덩치 큰 슬라임',
    emoji: '👑🟢',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_1_slime_king.png',
    hp: 80,
    atk: 8,
    def: 2,
    exp: 50,
    gold: 40,
    patterns: ['기본공격', '기본공격', '강공격'],
    description: '평범한 슬라임보다 훨씬 크다.'
  },
  2: {
    id: 'boss_2',
    name: '고블린 두목',
    emoji: '👑👺',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_2_goblin_chief.png',
    hp: 120,
    atk: 12,
    def: 4,
    exp: 80,
    gold: 60,
    patterns: ['기본공격', '빠른공격', '빠른공격', '강공격'],
    description: '고블린 무리의 우두머리.'
  },
  3: {
    id: 'boss_3',
    name: '거대 박쥐',
    emoji: '👑🦇',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_3_giant_bat.png',
    hp: 100,
    atk: 14,
    def: 3,
    exp: 110,
    gold: 80,
    evasion: 20,
    patterns: ['기본공격', '회피기동', '급습', '기본공격'],
    description: '동굴 깊은 곳의 지배자.'
  },
  4: {
    id: 'boss_4',
    name: '오크 전사',
    emoji: '👑👹',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_4_orc_warrior.png',
    hp: 200,
    atk: 15,
    def: 6,
    exp: 150,
    gold: 100,
    patterns: ['기본공격', '기본공격', '방어자세', '강공격'],
    description: '전투에 단련된 오크.'
  },
  5: {
    id: 'boss_5',
    name: '해골 기사',
    emoji: '👑💀',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_5_skeleton_knight.png',
    hp: 180,
    atk: 18,
    def: 12,
    exp: 200,
    gold: 150,
    patterns: ['기본공격', '방어자세', '강공격', '방어자세', '처형검'],
    description: '죽어서도 검을 놓지 않는 기사.',
    isMidBoss: true,
    drops: [
      { item: '해골 기사의 투구', chance: 30, stats: { def: 3 } }
    ]
  },
  6: {
    id: 'boss_6',
    name: '늑대인간',
    emoji: '👑🐺',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_6_werewolf.png',
    hp: 220,
    atk: 22,
    def: 8,
    exp: 250,
    gold: 180,
    patterns: ['기본공격', '연속할퀴기', '포효', '연속할퀴기'],
    description: '보름달 아래 깨어난 야수.'
  },
  7: {
    id: 'boss_7',
    name: '트롤',
    emoji: '👑🧌',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_7_troll.png',
    hp: 300,
    atk: 20,
    def: 10,
    exp: 300,
    gold: 200,
    patterns: ['기본공격', '기본공격', '재생', '강공격'],
    regen: 15,
    description: '상처가 금세 아무는 괴물.'
  },
  8: {
    id: 'boss_8',
    name: '다크 메이지',
    emoji: '👑🧙‍♂️',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_8_dark_mage.png',
    hp: 200,
    atk: 28,
    def: 5,
    exp: 350,
    gold: 250,
    patterns: ['암흑구', '기본공격', '마력충전', '암흑폭발'],
    description: '금지된 마법을 연구한 마법사.'
  },
  9: {
    id: 'boss_9',
    name: '미노타우로스',
    emoji: '👑🐂',
    image: 'https://storage.googleapis.com/ether-rpg.firebasestorage.app/ether/bosses/boss_9_minotaur.png',
    hp: 350,
    atk: 30,
    def: 12,
    exp: 400,
    gold: 300,
    patterns: ['기본공격', '발굴르기', '돌진준비', '돌진'],
    description: '미궁의 수호자.'
  }
  // 10층 단위 보스는 data/bosses.js에서 관리
};

const bossPatterns = {
  '기본공격': {
    name: '기본공격',
    multiplier: 1.0,
    telegraph: '공격 준비를 한다.',
    action: '공격했다!'
  },
  '강공격': {
    name: '강공격',
    multiplier: 1.5,
    telegraph: '힘을 모은다...',
    action: '강하게 내려쳤다!'
  },
  '방어자세': {
    name: '방어자세',
    multiplier: 0,
    defenseBonus: 0.5,
    telegraph: '방어 태세를 취한다.',
    action: '방어 중...'
  },
  '빠른공격': {
    name: '빠른공격',
    multiplier: 0.8,
    telegraph: '빠르게 움직인다.',
    action: '재빠르게 공격했다!'
  },
  '처형검': {
    name: '처형검',
    multiplier: 2.0,
    telegraph: '검을 높이 든다!',
    action: '처형의 일격!',
    recommendedAction: 'defend'
  },
  '연속할퀴기': {
    name: '연속할퀴기',
    multiplier: 0.6,
    hits: 3,
    telegraph: '발톱을 세운다!',
    action: '연속으로 할퀴었다!',
    recommendedAction: 'defend'
  },
  '재생': {
    name: '재생',
    multiplier: 0,
    heal: true,
    telegraph: '상처가 아물기 시작한다...',
    action: '체력을 회복했다!',
    recommendedAction: 'attack'
  },
  '포효': {
    name: '포효',
    multiplier: 0,
    buff: { atk: 1.5, duration: 1 },
    telegraph: '크게 숨을 들이쉰다...',
    action: '포효했다! 공격력 상승!',
    recommendedAction: 'prepare'
  },
  '회피기동': {
    name: '회피기동',
    multiplier: 0,
    evasionBonus: 50,
    telegraph: '날개를 퍼덕인다.',
    action: '회피 태세!',
    recommendedAction: 'wait'
  },
  '급습': {
    name: '급습',
    multiplier: 1.8,
    telegraph: '급강하한다!',
    action: '급습 공격!',
    recommendedAction: 'defend'
  },
  '돌진준비': {
    name: '돌진준비',
    multiplier: 0,
    telegraph: '뒷걸음질 친다...',
    action: '돌진을 준비한다!',
    nextPatternForced: '돌진',
    recommendedAction: 'prepare'
  },
  '돌진': {
    name: '돌진',
    multiplier: 2.5,
    unavoidable: true,
    telegraph: '돌진한다!!',
    action: '거대한 돌진!',
    recommendedAction: 'defend'
  },
  '암흑구': {
    name: '암흑구',
    multiplier: 1.2,
    isMagic: true,
    telegraph: '어둠을 모은다...',
    action: '암흑구 발사!',
    recommendedAction: 'attack'
  },
  '마력충전': {
    name: '마력충전',
    multiplier: 0,
    buff: { magicPower: 2.0, duration: 1 },
    telegraph: '마력이 응집된다...',
    action: '마력 충전!',
    recommendedAction: 'attack'
  },
  '암흑폭발': {
    name: '암흑폭발',
    multiplier: 2.0,
    isMagic: true,
    telegraph: '어둠이 폭발한다!',
    action: '암흑 폭발!!',
    recommendedAction: 'defend'
  },
  '검술연무': {
    name: '검술연무',
    multiplier: 0.8,
    hits: 2,
    telegraph: '검을 휘두른다.',
    action: '연속 베기!',
    recommendedAction: 'defend'
  },
  '처형선고': {
    name: '처형선고',
    multiplier: 0,
    debuff: { doom: 3 },
    telegraph: '처형을 선고한다...',
    action: '3턴 후 처형!',
    recommendedAction: 'attack'
  },
  '전력질주': {
    name: '전력질주',
    multiplier: 1.8,
    telegraph: '전력으로 달려온다!',
    action: '전력 질주 공격!',
    recommendedAction: 'defend'
  },
  '발굴르기': {
    name: '발굴르기',
    multiplier: 0,
    debuff: { stun: 1 },
    telegraph: '땅을 세게 구른다!',
    action: '발굴르기! 스턴!',
    recommendedAction: 'defend'
  }
};

// 10층 단위 보스층 여부 확인
function isRegionBossFloor(floor) {
  return floor % 10 === 0 && floor > 0;
}

// 1~9층 보스 반환 (10층 단위는 data/bosses.js에서 처리)
function getBoss(floor) {
  // 10층 단위는 별도 처리 필요
  if (isRegionBossFloor(floor)) {
    return null;
  }
  return bosses[floor] || null;
}

function getBossPattern(patternName) {
  return bossPatterns[patternName] || bossPatterns['기본공격'];
}

function getNextBossPattern(boss, currentPatternIndex) {
  const nextIndex = (currentPatternIndex + 1) % boss.patterns.length;
  return {
    pattern: getBossPattern(boss.patterns[nextIndex]),
    index: nextIndex
  };
}

module.exports = {
  bosses,
  bossPatterns,
  isRegionBossFloor,
  getBoss,
  getBossPattern,
  getNextBossPattern
};
