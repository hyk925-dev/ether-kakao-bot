// ============================================
// 직업 시스템 v4.0 (18개 패시브)
// ============================================

/**
 * v4.0 직업 시스템
 * - 6개 직업
 * - 각 직업당 3개 패시브 (총 18개)
 * - 패시브는 특정 시점에 발동
 * - 스킬은 전투 중 수동 사용
 */

// ============================================
// 직업 데이터
// ============================================
const JOBS = {
  // ============================================
  // 방랑자 (Wanderer) - 역경 극복형
  // ============================================
  wanderer: {
    id: 'wanderer',
    name: '방랑자',
    icon: '⚔️',
    role: '브루저',
    desc: 'HP가 낮을수록 강해진다. 위기에서 역전하는 전사.',
    playstyle: {
      coreStats: ['힘', '체력'],
      bestChoice: '역습',
      weakness: '회피',
      tip: 'HP 30% 이하에서 스킬 사용 시 최대 데미지'
    },

    base: { str: 4, dex: 2, int: 1, wil: 2, vit: 4, luk: 1 },
    growth: { str: 3, dex: 1, int: 0, wil: 1, vit: 2, luk: 0 },
    
    // 패시브 3개
    passives: [
      {
        id: 'wanderer_1',
        name: '역경의 길',
        desc: '해석 실패 시, 적의 선공권 무효화',
        trigger: 'onInterpretFail',
        effect: {
          negateEnemyPriority: true
        },
        explanation: '실패해도 적보다 먼저 공격 가능'
      },
      {
        id: 'wanderer_2',
        name: '맷집',
        desc: 'HP 30% 이하일 때 받는 피해 -20%',
        trigger: 'onLowHp',
        effect: {
          dmgReduction: 0.2,
          hpThreshold: 0.3
        },
        explanation: '위기 상황에서 더 단단해짐'
      },
      {
        id: 'wanderer_3',
        name: '반격 본능',
        desc: '피해를 받을 때 20% 확률로 즉시 반격 (공격력의 50%)',
        trigger: 'onDamaged',
        effect: {
          counterChance: 0.2,
          counterDmgMult: 0.5
        },
        explanation: '맞으면서 때린다'
      }
    ],
    
    // 스킬
    skill: {
      id: 'wanderer_skill',
      name: '결단의 일격',
      desc: '잃은 HP 1%당 추가 피해 +1%. 기본 배율 1.5배.',
      cost: 0,
      cooldown: 3,
      type: 'damage_and_buff',
      effect: {
        baseDmgMult: 1.5,
        bonusDmgPerLostHp: 0.01
      },
      explanation: 'HP가 낮을수록 강력함'
    }
  },
  
  // ============================================
  // 사냥꾼 (Hunter) - 속도와 정확도
  // ============================================
  hunter: {
    id: 'hunter',
    name: '사냥꾼',
    icon: '🏹',
    role: '어쌔신',
    desc: '회피로 기회를 만든다. 크리티컬 한방에 승부.',
    playstyle: {
      coreStats: ['민첩', '운'],
      bestChoice: '회피',
      weakness: '방어',
      tip: '회피 성공 후 크리티컬 확정, 스택 쌓아서 폭딜'
    },

    base: { str: 2, dex: 5, int: 1, wil: 1, vit: 1, luk: 4 },
    growth: { str: 1, dex: 3, int: 0, wil: 0, vit: 1, luk: 2 },
    
    passives: [
      {
        id: 'hunter_1',
        name: '속사',
        desc: '내 속도가 적보다 빠르면 항상 선공',
        trigger: 'onTurnStart',
        effect: {
          priorityIfFaster: true
        },
        explanation: '속도 우위 시 우선권 획득'
      },
      {
        id: 'hunter_2',
        name: '급소 포착',
        desc: '완벽 해석 시, 다음 공격 크리티컬 확률 +30%',
        trigger: 'onPerfectInterpret',
        effect: {
          critRateBonus: 30,
          duration: 1
        },
        explanation: '약점을 파악하면 치명타 증가'
      },
      {
        id: 'hunter_3',
        name: '표적 고정',
        desc: '동일 대상 공격 시 피해 +5% (최대 +25%, 스택형)',
        trigger: 'onAttack',
        effect: {
          stackDmgBonus: 0.05,
          maxStacks: 5
        },
        explanation: '같은 적을 계속 때리면 피해 증가'
      }
    ],
    
    skill: {
      id: 'hunter_skill',
      name: '약점 저격',
      desc: '크리티컬 확정. 크리 데미지 +50%. 기본 배율 1.3배.',
      cost: 0,
      cooldown: 4,
      type: 'conditional_damage',
      effect: {
        baseDmgMult: 1.3,
        guaranteedCrit: true,
        critDmgBonus: 50
      },
      explanation: '확정 크리티컬 일격'
    }
  },
  
  // ============================================
  // 이단자 (Heretic) - 광기와 힘
  // ============================================
  heretic: {
    id: 'heretic',
    name: '이단자',
    icon: '🌀',
    role: '리스크 딜러',
    desc: '광기를 먹고 자란다. 리스크가 클수록 강력하다.',
    playstyle: {
      coreStats: ['지능', '의지'],
      bestChoice: '역습',
      weakness: '방어',
      tip: '광기 50+ 유지하며 드랍률/스킬 보너스 챙기기'
    },

    base: { str: 1, dex: 2, int: 4, wil: 2, vit: 1, luk: 4 },
    growth: { str: 0, dex: 1, int: 3, wil: 1, vit: 0, luk: 2 },
    
    passives: [
      {
        id: 'heretic_1',
        name: '광기 친화',
        desc: '광기 10당 스킬 위력 +8%, 드랍률 +3%',
        trigger: 'always',
        effect: {
          perMadness10: {
            skillPowerBonus: 8,
            dropRateBonus: 3
          }
        },
        explanation: '광기가 높을수록 보상도 크다'
      },
      {
        id: 'heretic_2',
        name: '뒤틀린 해석',
        desc: '해석 실패 시, 33% 확률로 크리티컬 발동 + 자신에게 피해 20%',
        trigger: 'onInterpretFail',
        effect: {
          critChance: 0.33,
          selfDamagePercent: 0.2
        },
        explanation: '실패해도 강력한 일격, 대신 자해'
      },
      {
        id: 'heretic_3',
        name: '폭주',
        desc: 'HP 20% 이하일 때 공격력 +40%, 광기 획득 2배',
        trigger: 'onLowHp',
        effect: {
          atkBonus: 0.4,
          madnessGainMult: 2.0,
          hpThreshold: 0.2
        },
        explanation: '죽기 직전이 가장 위험함'
      }
    ],
    
    skill: {
      id: 'heretic_skill',
      name: '금기 주문',
      desc: '강력한 마법 공격. 광기 +20. 광기 50 이상이면 피해 2배.',
      cost: 0,
      cooldown: 2,
      type: 'damage_with_cost',
      effect: {
        baseDmgMult: 1.8,
        madnessGain: 20,
        madnessThreshold: {
          value: 50,
          dmgMult: 2.0
        }
      },
      explanation: '광기가 높으면 더 강력함'
    }
  },
  
  // ============================================
  // 주술사 (Shaman) - 드레인과 저주
  // ============================================
  shaman: {
    id: 'shaman',
    name: '주술사',
    icon: '👁',
    role: '드레인 서포터',
    desc: '스킬로 적을 녹인다. 해석 성공 시 흡혈로 버틴다.',
    playstyle: {
      coreStats: ['지능', '의지'],
      bestChoice: '역습',
      weakness: '회피',
      tip: '해석 성공 → 흡혈 → 스킬로 마무리'
    },

    base: { str: 1, dex: 1, int: 5, wil: 4, vit: 2, luk: 1 },
    growth: { str: 0, dex: 0, int: 3, wil: 2, vit: 1, luk: 1 },
    
    passives: [
      {
        id: 'shaman_1',
        name: '흡혈',
        desc: '모든 공격에 피해량의 8% 흡혈',
        trigger: 'onAttack',
        effect: {
          lifesteal: 0.08
        },
        explanation: '공격할 때마다 HP 회복'
      },
      {
        id: 'shaman_2',
        name: '해석 흡수',
        desc: '완벽 해석 시, 적 최대HP의 5% 흡수',
        trigger: 'onPerfectInterpret',
        effect: {
          drainEnemyMaxHpPercent: 0.05
        },
        explanation: '완벽 해석으로 HP 회복'
      },
      {
        id: 'shaman_3',
        name: '저주 전이',
        desc: '저주 3개 보유 시, 공격 시 30% 확률로 저주 1개 전이',
        trigger: 'onCursed',
        effect: {
          curseTransferChance: 0.3,
          curseCountThreshold: 3
        },
        explanation: '저주를 적에게 넘길 수 있음'
      }
    ],
    
    skill: {
      id: 'shaman_skill',
      name: '혼의 갈고리',
      desc: '피해 + 피해량의 50% 흡혈. 적 공격력 20% 감소(3턴).',
      cost: 0,
      cooldown: 4,
      type: 'damage_and_heal',
      effect: {
        baseDmgMult: 1.2,
        lifestealPercent: 0.5,
        debuff: {
          stat: 'atk',
          value: 0.2,
          duration: 3
        }
      },
      explanation: '흡혈 + 디버프 동시'
    }
  },
  
  // ============================================
  // 철혈병 (Ironblood) - 탱커
  // ============================================
  ironblood: {
    id: 'ironblood',
    name: '철혈병',
    icon: '🛡️',
    role: '탱커',
    desc: '방어로 반격한다. 맞으면서 이긴다.',
    playstyle: {
      coreStats: ['체력', '의지'],
      bestChoice: '방어',
      weakness: '역습',
      tip: '방어 정답 시 100% 반격, 체력 비례 피해'
    },

    base: { str: 3, dex: 1, int: 0, wil: 4, vit: 5, luk: 1 },
    growth: { str: 2, dex: 0, int: 0, wil: 2, vit: 3, luk: 0 },
    
    passives: [
      {
        id: 'ironblood_1',
        name: '도발',
        desc: '전투 시작 시, 적의 공격 대상이 항상 자신이 됨 (의미적)',
        trigger: 'onTurnStart',
        effect: {
          taunt: true
        },
        explanation: '적의 주의를 끈다'
      },
      {
        id: 'ironblood_2',
        name: '철벽',
        desc: '해석 실패 시 받는 피해 20%→10%로 경감',
        trigger: 'onInterpretFail',
        effect: {
          failPenaltyReduction: 0.5
        },
        explanation: '실패해도 덜 아픔'
      },
      {
        id: 'ironblood_3',
        name: '불굴',
        desc: '치명상 시 1회 HP 1로 생존 (전투당 1회)',
        trigger: 'onFatal',
        effect: {
          surviveOnce: true,
          surviveHp: 1
        },
        explanation: '한 번은 버틴다'
      }
    ],
    
    skill: {
      id: 'ironblood_skill',
      name: '철의 포효',
      desc: '3턴간 받는 피해 -50%. 공격받을 때 고정 피해 반격.',
      cost: 0,
      cooldown: 5,
      type: 'self_buff',
      effect: {
        duration: 3,
        dmgReduction: 0.5,
        thorns: {
          type: 'fixed',
          value: 'def * 0.5'
        }
      },
      explanation: '강력한 방어 버프'
    }
  },
  
  // ============================================
  // 기록자 (Scribe) - 컨트롤러
  // ============================================
  scribe: {
    id: 'scribe',
    name: '기록자',
    icon: '📖',
    role: '컨트롤러',
    desc: '패턴을 빠르게 파악한다. 이해도 특화 전략가.',
    playstyle: {
      coreStats: ['의지', '지능'],
      bestChoice: '상황별',
      weakness: '초반 (이해도 낮을 때)',
      tip: '같은 몬스터 반복 사냥 → 이해도 MAX → 자동 완벽 해석'
    },

    base: { str: 0, dex: 2, int: 6, wil: 3, vit: 1, luk: 2 },
    growth: { str: 0, dex: 1, int: 4, wil: 2, vit: 0, luk: 0 },
    
    passives: [
      {
        id: 'scribe_1',
        name: '기록',
        desc: '전투 중 몬스터 패턴 1회 해석마다 이해도 +100 (최대 400)',
        trigger: 'always',
        effect: {
          understandingGainBonus: 100
        },
        explanation: '이해도를 빠르게 올린다'
      },
      {
        id: 'scribe_2',
        name: '통찰',
        desc: '모든 해석 판정 시 이해도 레벨 +1 적용',
        trigger: 'always',
        effect: {
          understandingLevelBonus: 1
        },
        explanation: '해석이 더 쉬워짐'
      },
      {
        id: 'scribe_3',
        name: '완벽한 해석',
        desc: '완벽 해석 시, 다음 턴 스킬 쿨타임 -1',
        trigger: 'onPerfectInterpret',
        effect: {
          cooldownReduction: 1
        },
        explanation: '완벽 해석으로 스킬 더 자주 사용'
      }
    ],
    
    skill: {
      id: 'scribe_skill',
      name: '문장 왜곡',
      desc: '적의 다음 행동 봉인 (1턴). 이해도 레벨 3+ 시 2턴.',
      cost: 0,
      cooldown: 4,
      type: 'buff_interpret_bonus',
      effect: {
        sealDuration: 1,
        bonusDuration: {
          condition: 'understandingLevel >= 3',
          value: 1
        }
      },
      explanation: '적의 행동을 막는다'
    }
  }
};

// ============================================
// 패시브 발동 시점 정리
// ============================================
const PASSIVE_TRIGGERS = {
  onTurnStart: ['ironblood_1', 'hunter_1'],
  onInterpretFail: ['wanderer_1', 'heretic_2', 'ironblood_2'],
  onPerfectInterpret: ['hunter_2', 'shaman_2', 'scribe_3'],
  onAttack: ['hunter_3', 'shaman_1'],
  onDamaged: ['wanderer_3'],
  onLowHp: ['wanderer_2', 'heretic_3'],
  onCursed: ['shaman_3'],
  onFatal: ['ironblood_3'],
  always: ['heretic_1', 'scribe_1', 'scribe_2']
};

// ============================================
// 스킬 타입 정리
// ============================================
const SKILL_TYPES = {
  damage_and_buff: ['wanderer_skill'],
  conditional_damage: ['hunter_skill'],
  damage_with_cost: ['heretic_skill'],
  damage_and_heal: ['shaman_skill'],
  self_buff: ['ironblood_skill'],
  buff_interpret_bonus: ['scribe_skill']
};

module.exports = {
  JOBS,
  PASSIVE_TRIGGERS,
  SKILL_TYPES
};
