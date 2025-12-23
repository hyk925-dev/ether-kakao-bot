// systems/explore.js

const STORY_EVENTS = {
  10: {
    title: '첫 번째 문턱',
    text: '어둠 속에서 누군가의 시선이 느껴진다...',
    choices: ['앞으로', '뒤로']
  },
  20: {
    title: '두 번째 심연',
    text: '벽에 새겨진 경고문. "더 이상 가지 마라"',
    choices: ['무시', '돌아가기']
  },
  30: {
    title: '세 번째 계단',
    text: '공기가 무겁다. 숨쉬기가 힘들어진다.',
    choices: ['계속', '휴식']
  }
};

const RANDOM_EVENTS = [
  {
    id: 'treasure',
    weight: 30,
    title: '보물 상자',
    text: '빛나는 상자를 발견했다!',
    rewards: { gold: 100 }
  },
  {
    id: 'trap',
    weight: 25,
    title: '함정',
    text: '바닥이 무너진다!',
    penalty: { hp: 50 }
  },
  {
    id: 'fountain',
    weight: 20,
    title: '치유의 샘',
    text: '맑은 물이 흐른다.',
    heal: 100
  },
  {
    id: 'curse',
    weight: 15,
    title: '저주받은 제단',
    text: '불길한 기운이 감싼다...',
    curse: true
  },
  {
    id: 'merchant',
    weight: 10,
    title: '떠돌이 상인',
    text: '특별한 물건을 팔고 있다.',
    shop: true
  }
];

function checkStoryEvent(user) {
  const floor = user.floor;
  if (STORY_EVENTS[floor]) {
    return STORY_EVENTS[floor];
  }
  return null;
}

function checkRandomEvent() {
  return Math.random() < 0.05;
}

function selectRandomEvent() {
  const totalWeight = RANDOM_EVENTS.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const event of RANDOM_EVENTS) {
    roll -= event.weight;
    if (roll <= 0) {
      return event;
    }
  }
  
  return RANDOM_EVENTS[0];
}

module.exports = {
  STORY_EVENTS,
  RANDOM_EVENTS,
  checkStoryEvent,
  checkRandomEvent,
  selectRandomEvent
};
