// ============================================
// 몬스터 시스템 v4.0 (패턴 기반 전투)
// ============================================

/**
 * v4.0 몬스터 시스템 설계
 * - 40종 몬스터, 10개 티어 (1~10층, 11~20층, ..., 91~100층)
 * - 각 몬스터는 고유 패턴 풀 (3~5개)
 * - 패턴: 돌진(회피), 강타(방어), 집중(역습) 등
 * - weight 기반 선택 (합 100)
 */

// ============================================
// 몬스터 타입 (v3 유지)
// ============================================
const MONSTER_TYPES = {
  beast: { name: '야수', hpMult: 1.0, atkMult: 1.4, defMult: 0.6, evasion: 12 },
  undead: { name: '언데드', hpMult: 1.5, atkMult: 0.9, defMult: 1.0, evasion: 5 },
  spirit: { name: '정령', hpMult: 0.6, atkMult: 1.2, defMult: 0.7, evasion: 30 },
  demon: { name: '마족', hpMult: 1.1, atkMult: 1.2, defMult: 1.1, evasion: 18 },
  dragon: { name: '용족', hpMult: 1.6, atkMult: 1.5, defMult: 1.4, evasion: 18 },
  construct: { name: '구조물', hpMult: 2.0, atkMult: 0.8, defMult: 1.5, evasion: 0 },
  aberration: { name: '이형', hpMult: 0.9, atkMult: 1.3, defMult: 0.8, evasion: 25 }
};

// ============================================
// 몬스터 등급
// ============================================
const GRADES = {
  1: { name: '일반', mult: 1.0, expMult: 1 },
  2: { name: '강화', mult: 1.6, expMult: 2 },
  3: { name: '희귀', mult: 2.4, expMult: 4 },
  4: { name: '정예', mult: 3.5, expMult: 7 },
  5: { name: '영웅', mult: 5.0, expMult: 12 }
};

// ============================================
// v4.0 패턴 정의 (범용)
// ============================================
const UNIVERSAL_PATTERNS = {
  // 회피 패턴
  돌진: {
    id: '돌진',
    name: '돌진',
    correct: '회피',
    dmgMult: 1.2,
    telegraph: {
      0: '적이 움직인다...',
      1: '적의 근육이 긴장한다',
      2: '적이 자세를 낮춘다! 빠른 움직임 예상',
      3: '적이 발을 디딘다! 직선 돌진 준비!',
      4: '⚠️ 돌진! 정확한 타이밍에 회피 필수!'
    },
    weight: 30
  },
  
  빠른_연타: {
    id: '빠른_연타',
    name: '빠른 연타',
    correct: '회피',
    dmgMult: 0.9,
    hitCount: 2,
    telegraph: {
      0: '적이 빠르게 움직인다',
      1: '적의 공격 속도가 빨라진다',
      2: '적이 두 번 공격할 준비를 한다',
      3: '적의 팔이 흐릿하게 보인다! 2회 연속 공격!',
      4: '⚠️ 빠른 연타! 회피로 두 번 모두 피해야!'
    },
    weight: 20
  },
  
  도약_내려찍기: {
    id: '도약_내려찍기',
    name: '도약 내려찍기',
    correct: '회피',
    dmgMult: 1.5,
    telegraph: {
      0: '적이 뛰어오른다',
      1: '적이 높이 점프한다',
      2: '적이 공중에서 내려찍기 준비!',
      3: '적이 무기를 머리 위로! 강력한 내려찍기!',
      4: '⚠️ 도약 내려찍기! 회피로 피해야!'
    },
    weight: 15
  },
  
  // 방어 패턴
  강타: {
    id: '강타',
    name: '강타',
    correct: '방어',
    dmgMult: 1.8,
    telegraph: {
      0: '적이 힘을 모은다',
      1: '적의 무기가 빛난다',
      2: '적이 큰 공격을 준비한다! 위력 상승',
      3: '적이 전력으로 휘두른다! 강력한 일격!',
      4: '⚠️ 강타! 방어로 피해 감소 필수!'
    },
    weight: 30
  },
  
  회전_베기: {
    id: '회전_베기',
    name: '회전 베기',
    correct: '방어',
    dmgMult: 1.4,
    defBreak: 0.3,
    telegraph: {
      0: '적이 몸을 비튼다',
      1: '적이 회전 공격을 준비한다',
      2: '적의 무기가 원을 그린다! 광역 공격',
      3: '적이 빠르게 회전한다! 방어 관통!',
      4: '⚠️ 회전 베기! 방어 30% 관통 주의!'
    },
    weight: 20
  },
  
  대지_강타: {
    id: '대지_강타',
    name: '대지 강타',
    correct: '방어',
    dmgMult: 2.0,
    telegraph: {
      0: '적이 땅을 내려친다',
      1: '적이 무기를 땅에 내리꽂는다',
      2: '땅이 흔들린다! 충격파 예상',
      3: '적이 대지를 강타한다! 큰 충격!',
      4: '⚠️ 대지 강타! 방어로 충격 완화!'
    },
    weight: 15
  },
  
  // 역습 패턴
  집중: {
    id: '집중',
    name: '집중',
    correct: '역습',
    dmgMult: 0.3,
    nextTurnBonus: 2.0,
    telegraph: {
      0: '적이 잠시 멈춘다',
      1: '적이 호흡을 가다듬는다',
      2: '적이 집중한다... 다음 공격 강화 예상',
      3: '적이 깊게 집중한다! 다음 턴 위력 2배!',
      4: '⚠️ 집중! 역습으로 지금 끊어야!'
    },
    weight: 25
  },
  
  기합: {
    id: '기합',
    name: '기합',
    correct: '역습',
    dmgMult: 0.2,
    buffAtk: 0.3,
    buffDuration: 3,
    telegraph: {
      0: '적이 소리를 지른다',
      1: '적이 기합을 넣는다',
      2: '적의 기세가 상승한다! 공격력 증가',
      3: '적이 큰 소리로 기합! 3턴간 공격력 +30%!',
      4: '⚠️ 기합! 역습으로 지금 막아야!'
    },
    weight: 20
  },
  
  방어_태세: {
    id: '방어_태세',
    name: '방어 태세',
    correct: '역습',
    dmgMult: 0.0,
    defBonus: 0.5,
    telegraph: {
      0: '적이 방어한다',
      1: '적이 방어 자세를 취한다',
      2: '적이 단단히 방어! 방어력 상승',
      3: '적이 완벽한 방어 태세! 방어력 +50%',
      4: '⚠️ 방어 태세! 역습으로 무너뜨려야!'
    },
    weight: 15
  },

  // ============================================
  // 추가 패턴 (v4.0 누락 수정)
  // ============================================

  // 광폭화 - 역습 패턴
  광폭화: {
    id: '광폭화',
    name: '광폭화',
    correct: '역습',
    dmgMult: 0.4,
    buffAtk: 0.5,
    buffDuration: 2,
    selfDamage: 0.1,
    telegraph: {
      0: '적이 흥분한다',
      1: '적의 눈이 붉어진다',
      2: '적이 분노한다! 공격력 상승',
      3: '적이 광폭화한다! 2턴간 공격력 +50%',
      4: '⚠️ 광폭화! 역습으로 막아야!'
    },
    weight: 40
  },

  // 암흑 베기 - 방어 패턴
  암흑_베기: {
    id: '암흑_베기',
    name: '암흑 베기',
    correct: '방어',
    dmgMult: 2.2,
    defBreak: 0.4,
    telegraph: {
      0: '검이 검게 물든다',
      1: '검에서 어둠이 흐른다',
      2: '검이 암흑으로 뒤덮인다! 강력한 베기',
      3: '암흑 에너지가 폭발한다! 방어 40% 관통!',
      4: '⚠️ 암흑 베기! 최대 방어 필요!'
    },
    weight: 25
  },

  // 독 브레스 - 방어 패턴
  독_브레스: {
    id: '독_브레스',
    name: '독 브레스',
    correct: '방어',
    dmgMult: 1.4,
    dot: { type: 'poison', duration: 4, dmgPerTurn: 0.1 },
    telegraph: {
      0: '독이 모인다',
      1: '독액이 뿜어져 나온다',
      2: '독 브레스! 4턴 중독',
      3: '맹독을 뿜어낸다!',
      4: '⚠️ 독 브레스! 방어! 4턴 중독 위험!'
    },
    weight: 30
  },

  // 어둠의 구체 - 방어 패턴
  어둠의_구체: {
    id: '어둠의_구체',
    name: '어둠의 구체',
    correct: '방어',
    dmgMult: 2.0,
    telegraph: {
      0: '어둠이 응축된다',
      1: '검은 구체가 생긴다',
      2: '어둠 구체가 커진다! 강력한 마법',
      3: '어둠의 구체 발사! 큰 피해!',
      4: '⚠️ 어둠의 구체! 방어로 막아야!'
    },
    weight: 35
  },

  // 심판의 빛 - 방어 패턴
  심판의_빛: {
    id: '심판의_빛',
    name: '심판의 빛',
    correct: '방어',
    dmgMult: 2.5,
    defBreak: 0.5,
    telegraph: {
      0: '신성한 빛이 모인다',
      1: '타락한 빛이 빛난다',
      2: '왜곡된 심판! 방어 50% 관통',
      3: '심판의 빛! 거대한 피해!',
      4: '⚠️ 심판의 빛! 최대 방어 필수! 50% 관통!'
    },
    weight: 35
  },

  // 촉수 휘감기 - 회피 패턴
  촉수_휘감기: {
    id: '촉수_휘감기',
    name: '촉수 휘감기',
    correct: '회피',
    dmgMult: 1.4,
    bindDuration: 2,
    telegraph: {
      0: '촉수가 뻗어나온다',
      1: '여러 촉수가 다가온다',
      2: '촉수가 휘감으려 한다! 구속 위험',
      3: '촉수 휘감기! 2턴간 행동 불가!',
      4: '⚠️ 촉수 휘감기! 회피 필수! 실패 시 2턴 구속!'
    },
    weight: 40
  },

  // 정신 침식 - 방어 패턴
  정신_침식: {
    id: '정신_침식',
    name: '정신 침식',
    correct: '방어',
    dmgMult: 1.6,
    madnessGain: 15,
    telegraph: {
      0: '이상한 목소리가 들린다',
      1: '정신이 혼미해진다',
      2: '심연이 속삭인다... 광기 상승',
      3: '정신 침식! 광기 +15!',
      4: '⚠️ 정신 침식! 방어로 버텨야! 광기 위험!'
    },
    weight: 30
  }
};

// ============================================
// v4.0 몬스터 데이터 (40종)
// ============================================
const MONSTERS = [
  // ============================================
  // Tier 1: 1~10층 (초보자용, 단순 패턴)
  // ============================================
  {
    id: 'rat',
    name: '들쥐',
    tier: 1,
    type: 'beast',
    minFloor: 1,
    maxFloor: 10,
    baseHp: 45,
    baseAtk: 15,
    baseDef: 2,
    baseExp: 10,
    spd: 8,
    patterns: [
      { ...UNIVERSAL_PATTERNS.돌진, weight: 50 },
      { ...UNIVERSAL_PATTERNS.강타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.집중, weight: 20 }
    ],
    desc: '빠른 움직임의 작은 설치류'
  },
  
  {
    id: 'slime',
    name: '슬라임',
    tier: 1,
    type: 'aberration',
    minFloor: 2,
    maxFloor: 10,
    baseHp: 55,
    baseAtk: 12,
    baseDef: 5,
    baseExp: 12,
    spd: 4,
    patterns: [
      { ...UNIVERSAL_PATTERNS.강타, weight: 40 },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 30 }
    ],
    desc: '느리지만 단단한 젤리 생물'
  },
  
  {
    id: 'bat',
    name: '박쥐',
    tier: 1,
    type: 'beast',
    minFloor: 3,
    maxFloor: 10,
    baseHp: 35,
    baseAtk: 18,
    baseDef: 2,
    baseExp: 14,
    spd: 12,
    patterns: [
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 50 },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 },
      { ...UNIVERSAL_PATTERNS.집중, weight: 20 }
    ],
    desc: '매우 빠른 비행 생물'
  },
  
  {
    id: 'goblin',
    name: '고블린',
    tier: 1,
    type: 'demon',
    minFloor: 4,
    maxFloor: 10,
    baseHp: 65,
    baseAtk: 16,
    baseDef: 4,
    baseExp: 16,
    spd: 7,
    patterns: [
      { ...UNIVERSAL_PATTERNS.돌진, weight: 35 },
      { ...UNIVERSAL_PATTERNS.강타, weight: 35 },
      { ...UNIVERSAL_PATTERNS.기합, weight: 30 }
    ],
    desc: '교활한 소형 마물'
  },
  
  // ============================================
  // Tier 2: 11~20층 (패턴 다양화)
  // ============================================
  {
    id: 'wolf',
    name: '늑대',
    tier: 2,
    type: 'beast',
    minFloor: 11,
    maxFloor: 20,
    baseHp: 85,
    baseAtk: 24,
    baseDef: 5,
    baseExp: 25,
    spd: 11,
    patterns: [
      { ...UNIVERSAL_PATTERNS.돌진, weight: 40 },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '무리 사냥꾼, 빠르고 날카롭다'
  },
  
  {
    id: 'skeleton',
    name: '해골병사',
    tier: 2,
    type: 'undead',
    minFloor: 11,
    maxFloor: 20,
    baseHp: 110,
    baseAtk: 20,
    baseDef: 8,
    baseExp: 28,
    spd: 6,
    patterns: [
      { ...UNIVERSAL_PATTERNS.강타, weight: 40 },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 30 },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 }
    ],
    desc: '검과 방패를 든 언데드 전사'
  },
  
  {
    id: 'orc',
    name: '오크',
    tier: 2,
    type: 'beast',
    minFloor: 13,
    maxFloor: 20,
    baseHp: 100,
    baseAtk: 26,
    baseDef: 7,
    baseExp: 30,
    spd: 5,
    patterns: [
      { ...UNIVERSAL_PATTERNS.강타, weight: 45 },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 25 },
      { ...UNIVERSAL_PATTERNS.기합, weight: 30 }
    ],
    desc: '힘이 강한 녹색 전사'
  },
  
  {
    id: 'ghost',
    name: '고스트',
    tier: 2,
    type: 'spirit',
    minFloor: 15,
    maxFloor: 20,
    baseHp: 60,
    baseAtk: 32,
    baseDef: 4,
    baseExp: 40,
    spd: 14,
    patterns: [
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 45 },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 },
      {
        id: '위상_이동',
        name: '위상 이동',
        correct: '회피',
        dmgMult: 1.0,
        evadeBonus: 30,
        telegraph: {
          0: '적이 흐릿해진다',
          1: '적이 반투명해진다',
          2: '적의 모습이 사라진다! 회피 어려움',
          3: '적이 위상을 옮긴다! 회피율 -30%',
          4: '⚠️ 위상 이동! 집중해서 회피!'
        },
        weight: 25
      }
    ],
    desc: '실체 없는 영혼'
  },
  
  // ============================================
  // Tier 3: 21~30층 (특수 패턴 등장)
  // ============================================
  {
    id: 'minotaur',
    name: '미노타우르스',
    tier: 3,
    type: 'beast',
    minFloor: 21,
    maxFloor: 30,
    baseHp: 200,
    baseAtk: 45,
    baseDef: 14,
    baseExp: 70,
    spd: 6,
    patterns: [
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 30 },
      {
        id: '광폭화',
        name: '광폭화',
        correct: '역습',
        dmgMult: 0.4,
        buffAtk: 0.5,
        buffDuration: 2,
        selfDamage: 0.1,
        telegraph: {
          0: '적이 흥분한다',
          1: '적의 눈이 붉어진다',
          2: '적이 분노한다! 공격력 상승',
          3: '적이 광폭화한다! 2턴간 공격력 +50%',
          4: '⚠️ 광폭화! 역습으로 막아야!'
        },
        weight: 40
      }
    ],
    desc: '황소 머리의 거대 전사'
  },
  
  {
    id: 'darkknight',
    name: '다크나이트',
    tier: 3,
    type: 'undead',
    minFloor: 24,
    maxFloor: 30,
    baseHp: 220,
    baseAtk: 48,
    baseDef: 18,
    baseExp: 80,
    spd: 7,
    patterns: [
      { ...UNIVERSAL_PATTERNS.강타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.회전_베기, weight: 25 },
      {
        id: '암흑_베기',
        name: '암흑 베기',
        correct: '방어',
        dmgMult: 2.2,
        defBreak: 0.4,
        telegraph: {
          0: '검이 검게 물든다',
          1: '검에서 어둠이 흐른다',
          2: '검이 암흑으로 뒤덮인다! 강력한 베기',
          3: '암흑 에너지가 폭발한다! 방어 40% 관통!',
          4: '⚠️ 암흑 베기! 최대 방어 필요!'
        },
        weight: 25
      },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 20 }
    ],
    desc: '타락한 기사, 검은 갑옷'
  },
  
  {
    id: 'fire_spirit',
    name: '불의정령',
    tier: 3,
    type: 'spirit',
    minFloor: 26,
    maxFloor: 30,
    baseHp: 120,
    baseAtk: 55,
    baseDef: 8,
    baseExp: 78,
    spd: 10,
    patterns: [
      {
        id: '화염_폭발',
        name: '화염 폭발',
        correct: '회피',
        dmgMult: 1.6,
        dot: { type: 'burn', duration: 3, dmgPerTurn: 0.15 },
        telegraph: {
          0: '열기가 느껴진다',
          1: '불꽃이 모인다',
          2: '화염이 집중된다! 폭발 예상',
          3: '불꽃이 폭발한다! 화상 위험!',
          4: '⚠️ 화염 폭발! 회피 실패 시 3턴 화상!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '살아있는 화염'
  },
  
  {
    id: 'water_spirit',
    name: '물의정령',
    tier: 3,
    type: 'spirit',
    minFloor: 28,
    maxFloor: 30,
    baseHp: 140,
    baseAtk: 48,
    baseDef: 12,
    baseExp: 76,
    spd: 9,
    patterns: [
      {
        id: '물_장벽',
        name: '물 장벽',
        correct: '역습',
        dmgMult: 0.1,
        defBonus: 0.8,
        healPercent: 0.15,
        telegraph: {
          0: '물이 모인다',
          1: '물 방벽이 생긴다',
          2: '두꺼운 물 장벽! 방어력 +80%',
          3: '물 장벽으로 HP 15% 회복!',
          4: '⚠️ 물 장벽! 역습으로 깨뜨려야!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.강타, weight: 35 },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 }
    ],
    desc: '흐르는 물의 화신'
  },
  
  // ============================================
  // Tier 4: 31~40층 (복잡한 패턴 조합)
  // ============================================
  {
    id: 'chimera',
    name: '키메라',
    tier: 4,
    type: 'beast',
    minFloor: 31,
    maxFloor: 40,
    baseHp: 280,
    baseAtk: 60,
    baseDef: 20,
    baseExp: 110,
    spd: 8,
    patterns: [
      { ...UNIVERSAL_PATTERNS.돌진, weight: 25 },
      { ...UNIVERSAL_PATTERNS.회전_베기, weight: 25 },
      {
        id: '삼중_공격',
        name: '삼중 공격',
        correct: '방어',
        dmgMult: 1.2,
        hitCount: 3,
        telegraph: {
          0: '세 머리가 움직인다',
          1: '사자, 염소, 뱀 머리가 준비한다',
          2: '세 머리가 동시 공격 준비!',
          3: '삼중 공격! 3회 연속 타격!',
          4: '⚠️ 삼중 공격! 방어로 모두 막아야!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.광폭화, weight: 20 }
    ],
    desc: '사자, 염소, 뱀이 합쳐진 괴물'
  },
  
  {
    id: 'lich',
    name: '리치',
    tier: 4,
    type: 'undead',
    minFloor: 35,
    maxFloor: 40,
    baseHp: 220,
    baseAtk: 70,
    baseDef: 15,
    baseExp: 120,
    spd: 5,
    patterns: [
      {
        id: '죽음의_손길',
        name: '죽음의 손길',
        correct: '회피',
        dmgMult: 1.8,
        curse: { type: 'rustedNerve', chance: 0.3 },
        telegraph: {
          0: '해골 손이 뻗는다',
          1: '차가운 기운이 느껴진다',
          2: '죽음의 손이 다가온다! 저주 위험',
          3: '죽음의 손길! 닿으면 저주!',
          4: '⚠️ 죽음의 손길! 회피 실패 시 30% 저주!'
        },
        weight: 35
      },
      {
        id: '어둠의_구체',
        name: '어둠의 구체',
        correct: '방어',
        dmgMult: 2.0,
        telegraph: {
          0: '어둠이 응축된다',
          1: '검은 구체가 생긴다',
          2: '어둠 구체가 커진다! 강력한 마법',
          3: '어둠의 구체 발사! 큰 피해!',
          4: '⚠️ 어둠의 구체! 방어로 막아야!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '불사의 사악한 마법사'
  },
  
  {
    id: 'deathknight',
    name: '데스나이트',
    tier: 4,
    type: 'undead',
    minFloor: 37,
    maxFloor: 40,
    baseHp: 300,
    baseAtk: 62,
    baseDef: 24,
    baseExp: 125,
    spd: 6,
    patterns: [
      { ...UNIVERSAL_PATTERNS.암흑_베기, weight: 30 },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 25 },
      {
        id: '죽음의_선고',
        name: '죽음의 선고',
        correct: '역습',
        dmgMult: 0.5,
        markDuration: 2,
        markDmgMult: 3.0,
        telegraph: {
          0: '적이 선고한다',
          1: '죽음의 기운이 담긴다',
          2: '적이 죽음을 선고한다! 2턴 후 대미지 3배',
          3: '죽음의 표식! 2턴 내 처치하지 못하면 큰 피해!',
          4: '⚠️ 죽음의 선고! 역습으로 끊거나 2턴 내 처치!'
        },
        weight: 25
      },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 20 }
    ],
    desc: '죽음을 관장하는 기사'
  },
  
  {
    id: 'worm',
    name: '거대지렁이',
    tier: 4,
    type: 'beast',
    minFloor: 39,
    maxFloor: 40,
    baseHp: 320,
    baseAtk: 55,
    baseDef: 12,
    baseExp: 105,
    spd: 4,
    patterns: [
      {
        id: '땅굴_잠수',
        name: '땅굴 잠수',
        correct: '회피',
        dmgMult: 1.4,
        evadeBonus: 40,
        telegraph: {
          0: '적이 땅으로 파고든다',
          1: '적이 땅속으로 사라진다',
          2: '땅이 흔들린다! 어디서 나올지 불명',
          3: '땅에서 튀어나온다! 회피 어려움',
          4: '⚠️ 땅굴 잠수! 예측 불가! 집중!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.강타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.회전_베기, weight: 30 }
    ],
    desc: '땅을 파고드는 거대 생물'
  },
  
  // ============================================
  // Tier 5: 41~50층 (고난이도 패턴)
  // ============================================
  {
    id: 'balrog',
    name: '발록',
    tier: 5,
    type: 'demon',
    minFloor: 41,
    maxFloor: 50,
    baseHp: 380,
    baseAtk: 80,
    baseDef: 28,
    baseExp: 180,
    spd: 7,
    patterns: [
      {
        id: '지옥불_채찍',
        name: '지옥불 채찍',
        correct: '회피',
        dmgMult: 1.8,
        dot: { type: 'burn', duration: 4, dmgPerTurn: 0.2 },
        telegraph: {
          0: '불타는 채찍을 휘두른다',
          1: '화염 채찍이 공중을 가른다',
          2: '지옥불 채찍이 날아온다! 화상 위험',
          3: '지옥불 채찍! 맞으면 4턴간 지속 화상!',
          4: '⚠️ 지옥불 채찍! 회피 실패 시 심각한 화상!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 25 },
      { ...UNIVERSAL_PATTERNS.광폭화, weight: 25 },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 15 }
    ],
    desc: '지옥의 불꽃 악마'
  },
  
  {
    id: 'hydra',
    name: '히드라',
    tier: 5,
    type: 'dragon',
    minFloor: 43,
    maxFloor: 50,
    baseHp: 450,
    baseAtk: 72,
    baseDef: 25,
    baseExp: 190,
    spd: 6,
    patterns: [
      {
        id: '다중_머리_공격',
        name: '다중 머리 공격',
        correct: '방어',
        dmgMult: 0.8,
        hitCount: 5,
        telegraph: {
          0: '여러 머리가 움직인다',
          1: '5개의 머리가 준비한다',
          2: '모든 머리가 동시 공격!',
          3: '5연속 물어뜯기!',
          4: '⚠️ 다중 머리 공격! 방어 필수!'
        },
        weight: 40
      },
      {
        id: '재생',
        name: '재생',
        correct: '역습',
        dmgMult: 0.0,
        healPercent: 0.25,
        telegraph: {
          0: '잘린 머리가 자란다',
          1: '상처가 아문다',
          2: '재생 능력 발동! HP 25% 회복',
          3: '완전 재생! HP 대량 회복!',
          4: '⚠️ 재생! 역습으로 중단시켜야!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.독_브레스, weight: 30 }
    ],
    desc: '다섯 머리 용, 재생 능력'
  },
  
  {
    id: 'behemoth',
    name: '베히모스',
    tier: 5,
    type: 'beast',
    minFloor: 45,
    maxFloor: 50,
    baseHp: 500,
    baseAtk: 68,
    baseDef: 32,
    baseExp: 200,
    spd: 4,
    patterns: [
      {
        id: '대지_울림',
        name: '대지 울림',
        correct: '회피',
        dmgMult: 1.5,
        stunChance: 0.4,
        telegraph: {
          0: '거대한 발이 땅을 딛는다',
          1: '땅이 심하게 흔들린다',
          2: '대지가 울린다! 기절 위험',
          3: '강력한 충격파! 40% 기절!',
          4: '⚠️ 대지 울림! 회피하지 않으면 기절!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 30 },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 20 },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 15 }
    ],
    desc: '거대한 짐승, 땅을 흔든다'
  },
  
  {
    id: 'vampire_lord',
    name: '뱀파이어로드',
    tier: 5,
    type: 'undead',
    minFloor: 47,
    maxFloor: 50,
    baseHp: 360,
    baseAtk: 85,
    baseDef: 26,
    baseExp: 210,
    spd: 10,
    patterns: [
      {
        id: '흡혈',
        name: '흡혈',
        correct: '회피',
        dmgMult: 1.6,
        lifesteal: 1.0,
        telegraph: {
          0: '송곳니가 빛난다',
          1: '흡혈 준비를 한다',
          2: '빠르게 달려든다! 흡혈 공격',
          3: '목을 물어뜯는다! HP 100% 흡수!',
          4: '⚠️ 흡혈! 회피 실패 시 적 완전 회복!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 },
      {
        id: '박쥐_변신',
        name: '박쥐 변신',
        correct: '역습',
        dmgMult: 0.0,
        evadeBonus: 50,
        duration: 2,
        telegraph: {
          0: '형체가 흐려진다',
          1: '박쥐들로 변한다',
          2: '박쥐 떼로 변신! 2턴간 회피율 +50%',
          3: '박쥐 형태! 공격 회피 매우 어려움!',
          4: '⚠️ 박쥐 변신! 역습으로 중단!'
        },
        weight: 30
      }
    ],
    desc: '불사의 흡혈귀 군주'
  },
  
  // ============================================
  // Tier 6: 51~60층 (극악 패턴)
  // ============================================
  {
    id: 'abyss_tentacle',
    name: '심연의촉수',
    tier: 6,
    type: 'aberration',
    minFloor: 51,
    maxFloor: 60,
    baseHp: 380,
    baseAtk: 92,
    baseDef: 22,
    baseExp: 260,
    spd: 8,
    patterns: [
      {
        id: '촉수_휘감기',
        name: '촉수 휘감기',
        correct: '회피',
        dmgMult: 1.4,
        bindDuration: 2,
        telegraph: {
          0: '촉수가 뻗어나온다',
          1: '여러 촉수가 다가온다',
          2: '촉수가 휘감으려 한다! 구속 위험',
          3: '촉수 휘감기! 2턴간 행동 불가!',
          4: '⚠️ 촉수 휘감기! 회피 필수! 실패 시 2턴 구속!'
        },
        weight: 40
      },
      {
        id: '정신_침식',
        name: '정신 침식',
        correct: '방어',
        dmgMult: 1.6,
        madnessGain: 15,
        telegraph: {
          0: '이상한 목소리가 들린다',
          1: '정신이 혼미해진다',
          2: '심연이 속삭인다... 광기 상승',
          3: '정신 침식! 광기 +15!',
          4: '⚠️ 정신 침식! 방어로 버텨야! 광기 위험!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.회전_베기, weight: 30 }
    ],
    desc: '심연에서 온 촉수 괴물'
  },
  
  {
    id: 'fallen_angel',
    name: '타락천사',
    tier: 6,
    type: 'spirit',
    minFloor: 53,
    maxFloor: 60,
    baseHp: 420,
    baseAtk: 98,
    baseDef: 28,
    baseExp: 280,
    spd: 11,
    patterns: [
      {
        id: '심판의_빛',
        name: '심판의 빛',
        correct: '방어',
        dmgMult: 2.5,
        defBreak: 0.5,
        telegraph: {
          0: '신성한 빛이 모인다',
          1: '타락한 빛이 빛난다',
          2: '왜곡된 심판! 방어 50% 관통',
          3: '심판의 빛! 거대한 피해!',
          4: '⚠️ 심판의 빛! 최대 방어 필수! 50% 관통!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 },
      {
        id: '타락의_날개',
        name: '타락의 날개',
        correct: '역습',
        dmgMult: 0.3,
        buffAtk: 0.4,
        buffSpd: 5,
        buffDuration: 3,
        telegraph: {
          0: '검은 날개가 펼쳐진다',
          1: '타락한 날개가 빛난다',
          2: '날개의 힘! 공격력+40%, 속도+5 (3턴)',
          3: '타락의 가호! 크게 강해진다!',
          4: '⚠️ 타락의 날개! 역습으로 저지!'
        },
        weight: 35
      }
    ],
    desc: '타락한 천사, 왜곡된 빛'
  },
  
  {
    id: 'dark_priest',
    name: '어둠사제',
    tier: 6,
    type: 'demon',
    minFloor: 55,
    maxFloor: 60,
    baseHp: 400,
    baseAtk: 105,
    baseDef: 24,
    baseExp: 290,
    spd: 7,
    patterns: [
      {
        id: '저주의_기도',
        name: '저주의 기도',
        correct: '역습',
        dmgMult: 0.4,
        curse: { type: 'random', count: 1, chance: 0.6 },
        telegraph: {
          0: '불길한 기도를 시작한다',
          1: '저주의 말을 읊는다',
          2: '저주가 완성된다! 60% 저주 부여',
          3: '저주의 기도! 저주 필중!',
          4: '⚠️ 저주의 기도! 역습으로 끊어야! 60% 저주!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.어둠의_구체, weight: 35 },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '사악한 신을 섬기는 사제'
  },
  
  {
    id: 'chaos_eye',
    name: '혼돈의눈',
    tier: 6,
    type: 'aberration',
    minFloor: 57,
    maxFloor: 60,
    baseHp: 360,
    baseAtk: 110,
    baseDef: 20,
    baseExp: 300,
    spd: 9,
    patterns: [
      {
        id: '혼돈의_시선',
        name: '혼돈의 시선',
        correct: '회피',
        dmgMult: 1.8,
        confuseDuration: 2,
        telegraph: {
          0: '거대한 눈이 깜빡인다',
          1: '눈동자가 이상하게 움직인다',
          2: '혼돈의 시선! 2턴간 혼란',
          3: '눈이 쏘아본다! 혼란 상태!',
          4: '⚠️ 혼돈의 시선! 회피! 실패 시 2턴 혼란!'
        },
        weight: 40
      },
      {
        id: '현실_왜곡',
        name: '현실 왜곡',
        correct: '방어',
        dmgMult: 2.0,
        defBreak: 0.6,
        telegraph: {
          0: '공간이 뒤틀린다',
          1: '현실이 일그러진다',
          2: '현실 왜곡! 방어 60% 무시',
          3: '모든 것이 뒤틀린다!',
          4: '⚠️ 현실 왜곡! 방어 60% 관통! 최대 방어!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '혼돈을 응시하는 거대한 눈'
  },
  
  // ============================================
  // Tier 7: 61~70층 (지옥 난이도)
  // ============================================
  {
    id: 'shadow_assassin',
    name: '그림자암살자',
    tier: 7,
    type: 'demon',
    minFloor: 61,
    maxFloor: 70,
    baseHp: 450,
    baseAtk: 115,
    baseDef: 25,
    baseExp: 380,
    spd: 13,
    patterns: [
      {
        id: '암살',
        name: '암살',
        correct: '회피',
        dmgMult: 3.0,
        critChance: 0.8,
        telegraph: {
          0: '그림자가 움직인다',
          1: '살기가 느껴진다',
          2: '치명적인 일격 준비! 80% 크리티컬',
          3: '암살! 즉사 위험!',
          4: '⚠️ 암살! 회피 실패 시 즉사급 피해!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 },
      {
        id: '은신',
        name: '은신',
        correct: '역습',
        dmgMult: 0.0,
        evadeBonus: 70,
        duration: 1,
        telegraph: {
          0: '모습이 흐려진다',
          1: '완전히 사라진다',
          2: '은신! 다음 턴 회피율 +70%',
          3: '완벽한 은신! 거의 보이지 않음!',
          4: '⚠️ 은신! 역습으로 찾아내야!'
        },
        weight: 30
      }
    ],
    desc: '어둠 속 완벽한 암살자'
  },
  
  {
    id: 'hellhound',
    name: '지옥사냥개',
    tier: 7,
    type: 'beast',
    minFloor: 63,
    maxFloor: 70,
    baseHp: 520,
    baseAtk: 110,
    baseDef: 28,
    baseExp: 400,
    spd: 12,
    patterns: [
      {
        id: '지옥불_숨결',
        name: '지옥불 숨결',
        correct: '방어',
        dmgMult: 1.8,
        dot: { type: 'burn', duration: 5, dmgPerTurn: 0.25 },
        telegraph: {
          0: '입에서 연기가 난다',
          1: '불을 머금는다',
          2: '지옥불을 뿜는다! 5턴 지속 화상',
          3: '지옥불 숨결! 심각한 화상!',
          4: '⚠️ 지옥불 숨결! 방어! 5턴간 강력한 화상!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.돌진, weight: 35 },
      { ...UNIVERSAL_PATTERNS.광폭화, weight: 30 }
    ],
    desc: '지옥의 사냥개, 불을 뿜는다'
  },
  
  {
    id: 'bone_dragon',
    name: '뼈용',
    tier: 7,
    type: 'dragon',
    minFloor: 65,
    maxFloor: 70,
    baseHp: 650,
    baseAtk: 105,
    baseDef: 38,
    baseExp: 440,
    spd: 7,
    patterns: [
      {
        id: '죽음의_브레스',
        name: '죽음의 브레스',
        correct: '방어',
        dmgMult: 2.2,
        curse: { type: 'random', count: 1, chance: 0.5 },
        telegraph: {
          0: '해골 입에서 기운이 모인다',
          1: '죽음의 기운을 토한다',
          2: '죽음의 브레스! 50% 저주',
          3: '죽음을 뿜어낸다!',
          4: '⚠️ 죽음의 브레스! 방어! 50% 저주 위험!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 30 },
      { ...UNIVERSAL_PATTERNS.방어_태세, weight: 30 }
    ],
    desc: '뼈로만 이루어진 용'
  },
  
  {
    id: 'cursed_doll',
    name: '저주인형',
    tier: 7,
    type: 'aberration',
    minFloor: 67,
    maxFloor: 70,
    baseHp: 420,
    baseAtk: 120,
    baseDef: 22,
    baseExp: 420,
    spd: 8,
    patterns: [
      {
        id: '저주_인형술',
        name: '저주 인형술',
        correct: '역습',
        dmgMult: 0.5,
        linkDamage: 0.5,
        linkDuration: 3,
        telegraph: {
          0: '인형이 꿰맨다',
          1: '실이 날아온다',
          2: '인형술! 3턴간 받는 피해의 50% 반사',
          3: '저주의 실! 피해가 공유된다!',
          4: '⚠️ 저주 인형술! 역습으로 끊어야! 피해 공유!'
        },
        weight: 40
      },
      {
        id: '핀_찌르기',
        name: '핀 찌르기',
        correct: '회피',
        dmgMult: 1.5,
        dot: { type: 'bleed', duration: 4, dmgPerTurn: 0.2 },
        telegraph: {
          0: '핀을 꺼낸다',
          1: '인형에 핀을 꽂는다',
          2: '핀 찌르기! 4턴 출혈',
          3: '저주받은 핀! 지속 출혈!',
          4: '⚠️ 핀 찌르기! 회피! 4턴 출혈 위험!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '저주받은 인형, 피해를 공유한다'
  },
  
  // ============================================
  // Tier 8: 71~80층 (종말 서곡)
  // ============================================
  {
    id: 'void_watcher',
    name: '공허감시자',
    tier: 8,
    type: 'aberration',
    minFloor: 71,
    maxFloor: 80,
    baseHp: 580,
    baseAtk: 130,
    baseDef: 32,
    baseExp: 520,
    spd: 9,
    patterns: [
      {
        id: '공허의_응시',
        name: '공허의 응시',
        correct: '방어',
        dmgMult: 2.4,
        madnessGain: 20,
        telegraph: {
          0: '공허가 응시한다',
          1: '무(無)를 바라본다',
          2: '공허의 응시! 광기 +20',
          3: '아무것도 없음이 다가온다!',
          4: '⚠️ 공허의 응시! 방어! 광기 +20!'
        },
        weight: 40
      },
      {
        id: '공간_찢기',
        name: '공간 찢기',
        correct: '회피',
        dmgMult: 2.0,
        defBreak: 0.8,
        telegraph: {
          0: '공간이 갈라진다',
          1: '균열이 생긴다',
          2: '공간 찢기! 방어 80% 무시',
          3: '공간 자체가 찢어진다!',
          4: '⚠️ 공간 찢기! 회피! 방어 무용!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '공허를 관찰하는 존재'
  },
  
  {
    id: 'ancient_golem',
    name: '고대골렘',
    tier: 8,
    type: 'construct',
    minFloor: 75,
    maxFloor: 80,
    baseHp: 750,
    baseAtk: 115,
    baseDef: 55,
    baseExp: 580,
    spd: 3,
    patterns: [
      {
        id: '고대의_주먹',
        name: '고대의 주먹',
        correct: '방어',
        dmgMult: 2.8,
        stunChance: 0.6,
        telegraph: {
          0: '거대한 주먹이 올라간다',
          1: '고대의 힘이 모인다',
          2: '고대의 주먹! 60% 기절',
          3: '천년의 주먹! 거대한 충격!',
          4: '⚠️ 고대의 주먹! 방어! 60% 기절 위험!'
        },
        weight: 40
      },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 30 },
      {
        id: '마나_충전',
        name: '마나 충전',
        correct: '역습',
        dmgMult: 0.0,
        healPercent: 0.3,
        defBonus: 1.0,
        telegraph: {
          0: '마나가 충전된다',
          1: '고대 문자가 빛난다',
          2: '마나 충전! HP 30%, 방어력 2배',
          3: '완전 충전! 거의 무적!',
          4: '⚠️ 마나 충전! 역습으로 중단!'
        },
        weight: 30
      }
    ],
    desc: '고대 문명의 마법 골렘'
  },
  
  {
    id: 'blood_lord',
    name: '피의군주',
    tier: 8,
    type: 'demon',
    minFloor: 79,
    maxFloor: 80,
    baseHp: 650,
    baseAtk: 135,
    baseDef: 38,
    baseExp: 630,
    spd: 10,
    patterns: [
      {
        id: '피의_폭발',
        name: '피의 폭발',
        correct: '회피',
        dmgMult: 2.2,
        lifesteal: 0.8,
        telegraph: {
          0: '피가 끓어오른다',
          1: '피가 응축된다',
          2: '피의 폭발! 80% 흡혈',
          3: '피가 폭발한다! 대량 회복!',
          4: '⚠️ 피의 폭발! 회피! 80% 흡혈!'
        },
        weight: 40
      },
      {
        id: '피의_갑옷',
        name: '피의 갑옷',
        correct: '역습',
        dmgMult: 0.0,
        defBonus: 0.8,
        reflectDamage: 0.5,
        duration: 2,
        telegraph: {
          0: '피가 응고된다',
          1: '피가 갑옷이 된다',
          2: '피의 갑옷! 방어력 +80%, 피해 50% 반사 (2턴)',
          3: '피의 갑옷! 거의 뚫을 수 없음!',
          4: '⚠️ 피의 갑옷! 역습으로 벗겨야! 피해 반사!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 }
    ],
    desc: '피를 지배하는 악마 군주'
  },
  
  // ============================================
  // Tier 9: 81~90층 (종말 전야)
  // ============================================
  {
    id: 'time_distorter',
    name: '시간왜곡자',
    tier: 9,
    type: 'aberration',
    minFloor: 83,
    maxFloor: 90,
    baseHp: 650,
    baseAtk: 150,
    baseDef: 35,
    baseExp: 750,
    spd: 11,
    patterns: [
      {
        id: '시간_정지',
        name: '시간 정지',
        correct: '역습',
        dmgMult: 0.0,
        skipPlayerTurn: 1,
        telegraph: {
          0: '시간이 느려진다',
          1: '시간이 멈춘다',
          2: '시간 정지! 다음 턴 행동 불가',
          3: '시간이 멈춘다! 1턴 스킵!',
          4: '⚠️ 시간 정지! 역습으로 끊어야! 1턴 상실!'
        },
        weight: 35
      },
      {
        id: '과거로_회귀',
        name: '과거로 회귀',
        correct: '방어',
        dmgMult: 1.5,
        healPercent: 0.4,
        telegraph: {
          0: '시간이 거꾸로 흐른다',
          1: '과거로 돌아간다',
          2: '과거로 회귀! HP 40% 회복',
          3: '시간을 되돌린다! 상처가 사라진다!',
          4: '⚠️ 과거로 회귀! 방어하며 버텨야!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.빠른_연타, weight: 30 }
    ],
    desc: '시간을 왜곡하는 존재'
  },
  
  {
    id: 'abyss_child',
    name: '심연의아이',
    tier: 9,
    type: 'aberration',
    minFloor: 87,
    maxFloor: 90,
    baseHp: 580,
    baseAtk: 165,
    baseDef: 28,
    baseExp: 850,
    spd: 12,
    patterns: [
      {
        id: '심연_낙하',
        name: '심연 낙하',
        correct: '회피',
        dmgMult: 2.6,
        madnessGain: 25,
        telegraph: {
          0: '심연으로 떨어진다',
          1: '무한한 어둠이 보인다',
          2: '심연 낙하! 광기 +25',
          3: '심연이 삼킨다!',
          4: '⚠️ 심연 낙하! 회피! 광기 +25!'
        },
        weight: 40
      },
      {
        id: '촉수_난무',
        name: '촉수 난무',
        correct: '방어',
        dmgMult: 1.2,
        hitCount: 6,
        telegraph: {
          0: '무수한 촉수가 자란다',
          1: '촉수가 난무한다',
          2: '촉수 난무! 6회 연속 공격',
          3: '끝없는 촉수!',
          4: '⚠️ 촉수 난무! 방어로 버텨야! 6회 공격!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '심연에서 태어난 괴물'
  },
  
  {
    id: 'doom_herald',
    name: '종말의전령',
    tier: 9,
    type: 'demon',
    minFloor: 89,
    maxFloor: 90,
    baseHp: 720,
    baseAtk: 155,
    baseDef: 42,
    baseExp: 900,
    spd: 10,
    patterns: [
      {
        id: '종말의_예언',
        name: '종말의 예언',
        correct: '역습',
        dmgMult: 0.6,
        doomMarkDuration: 3,
        doomMarkDmg: 9999,
        telegraph: {
          0: '종말을 예언한다',
          1: '파멸이 확정된다',
          2: '종말의 예언! 3턴 후 9999 피해',
          3: '예언이 완성된다! 3턴 내 처치하지 못하면 즉사!',
          4: '⚠️ 종말의 예언! 역습으로 끊거나 3턴 내 처치!'
        },
        weight: 40
      },
      {
        id: '심판',
        name: '심판',
        correct: '방어',
        dmgMult: 2.8,
        defBreak: 0.7,
        telegraph: {
          0: '심판이 내려진다',
          1: '죄가 판결된다',
          2: '심판! 방어 70% 관통',
          3: '최후의 심판!',
          4: '⚠️ 심판! 방어! 70% 관통!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.광폭화, weight: 30 }
    ],
    desc: '종말을 알리는 전령'
  },
  
  // ============================================
  // Tier 10: 91~99층 (진정한 종말)
  // ============================================
  {
    id: 'void_shadow',
    name: '허무의그림자',
    tier: 10,
    type: 'aberration',
    minFloor: 91,
    maxFloor: 99,
    baseHp: 700,
    baseAtk: 175,
    baseDef: 38,
    baseExp: 1000,
    spd: 13,
    patterns: [
      {
        id: '존재_소거',
        name: '존재 소거',
        correct: '회피',
        dmgMult: 3.0,
        eraseDuration: 2,
        telegraph: {
          0: '존재가 흐려진다',
          1: '무(無)가 다가온다',
          2: '존재 소거! 2턴간 모든 행동 불가',
          3: '존재 자체를 지운다!',
          4: '⚠️ 존재 소거! 회피! 실패 시 2턴 무력화!'
        },
        weight: 40
      },
      {
        id: '허무의_포옹',
        name: '허무의 포옹',
        correct: '방어',
        dmgMult: 2.5,
        madnessGain: 30,
        telegraph: {
          0: '허무가 감싼다',
          1: '아무것도 느껴지지 않는다',
          2: '허무의 포옹! 광기 +30',
          3: '모든 것이 사라진다!',
          4: '⚠️ 허무의 포옹! 방어! 광기 +30!'
        },
        weight: 30
      },
      { ...UNIVERSAL_PATTERNS.집중, weight: 30 }
    ],
    desc: '허무를 구현한 그림자'
  },
  
  {
    id: 'god_fragment',
    name: '신의조각',
    tier: 10,
    type: 'spirit',
    minFloor: 95,
    maxFloor: 99,
    baseHp: 850,
    baseAtk: 180,
    baseDef: 48,
    baseExp: 1200,
    spd: 11,
    patterns: [
      {
        id: '신성한_빛',
        name: '신성한 빛',
        correct: '방어',
        dmgMult: 3.0,
        defBreak: 0.9,
        telegraph: {
          0: '신성한 빛이 내린다',
          1: '절대적인 빛이 모인다',
          2: '신성한 빛! 방어 90% 관통',
          3: '신의 빛! 거의 막을 수 없음!',
          4: '⚠️ 신성한 빛! 최대 방어! 90% 관통!'
        },
        weight: 35
      },
      {
        id: '신의_축복',
        name: '신의 축복',
        correct: '역습',
        dmgMult: 0.0,
        healPercent: 0.5,
        buffAll: 0.5,
        duration: 3,
        telegraph: {
          0: '축복이 내린다',
          1: '신성한 가호가 깃든다',
          2: '신의 축복! HP 50%, 모든 능력치 +50% (3턴)',
          3: '완벽한 가호! 거의 무적!',
          4: '⚠️ 신의 축복! 역습으로 중단! 강화 위험!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.심판의_빛, weight: 30 }
    ],
    desc: '신의 파편, 절대적인 힘'
  },
  
  {
    id: 'eternal_gatekeeper',
    name: '영원의문지기',
    tier: 10,
    type: 'construct',
    minFloor: 99,
    maxFloor: 99,
    baseHp: 1000,
    baseAtk: 165,
    baseDef: 65,
    baseExp: 1400,
    spd: 8,
    patterns: [
      {
        id: '영원의_장벽',
        name: '영원의 장벽',
        correct: '역습',
        dmgMult: 0.0,
        shieldPercent: 0.5,
        shieldDuration: 2,
        telegraph: {
          0: '영원한 장벽이 생긴다',
          1: '절대 방어가 시작된다',
          2: '영원의 장벽! 2턴간 최대 HP 50% 보호막',
          3: '영원의 수호! 거의 뚫을 수 없음!',
          4: '⚠️ 영원의 장벽! 역습으로 깨뜨려야! 거대 보호막!'
        },
        weight: 35
      },
      {
        id: '문지기의_심판',
        name: '문지기의 심판',
        correct: '방어',
        dmgMult: 3.2,
        telegraph: {
          0: '심판이 시작된다',
          1: '자격이 판정된다',
          2: '문지기의 심판! 거대한 피해',
          3: '통과 자격 박탈! 엄청난 공격!',
          4: '⚠️ 문지기의 심판! 최대 방어! 거대 피해!'
        },
        weight: 35
      },
      { ...UNIVERSAL_PATTERNS.대지_강타, weight: 30 }
    ],
    desc: '영원의 문을 지키는 존재'
  }
];

// ============================================
// 히든 보스
// ============================================
const HIDDEN_BOSS = {
  id: 'abyss_shadow',
  name: '심연의 그림자',
  type: 'demon',
  baseHp: 500,
  baseAtk: 90,
  baseDef: 25,
  baseExp: 600,
  baseGold: 500,
  spd: 10,
  patterns: [
    {
      ...UNIVERSAL_PATTERNS.촉수_휘감기,
      weight: 35
    },
    {
      ...UNIVERSAL_PATTERNS.정신_침식,
      weight: 35
    },
    {
      id: '심연_폭발',
      name: '심연 폭발',
      correct: '방어',
      dmgMult: 2.0,
      madnessGain: 20,
      telegraph: {
        0: '심연이 요동친다',
        1: '어둠이 폭발한다',
        2: '심연 폭발! 광기 +20',
        3: '심연이 터진다!',
        4: '⚠️ 심연 폭발! 방어! 광기 +20!'
      },
      weight: 30
    }
  ],
  desc: '금기 탐사에서 출현하는 히든 보스'
};

module.exports = {
  MONSTER_TYPES,
  GRADES,
  UNIVERSAL_PATTERNS,
  MONSTERS,
  HIDDEN_BOSS
};
