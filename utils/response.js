// ============================================
// 응답 포맷 함수 v4.0
// 카카오 i 오픈빌더 응답 형식
// ============================================

/**
 * 기본 텍스트 응답
 */
function reply(text, buttons = []) {
  const response = {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }]
    }
  };
  
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.slice(0, 10).map(b => ({
      label: b,
      action: 'message',
      messageText: b
    }));
  }
  
  return response;
}

/**
 * 이미지 + 텍스트 응답
 */
function replyWithImage(imageUrl, text, buttons = []) {
  const response = {
    version: '2.0',
    template: {
      outputs: [
        { simpleImage: { imageUrl: imageUrl, altText: '이미지' } },
        { simpleText: { text: text } }
      ]
    }
  };
  
  if (buttons.length > 0) {
    response.template.quickReplies = buttons.slice(0, 10).map(b => ({
      label: b,
      action: 'message',
      messageText: b
    }));
  }
  
  return response;
}

/**
 * 베이직 카드 응답
 * @param {object|string} options - { title, description, imageUrl, buttons } 또는 title 문자열
 * @param {string} desc - description (options가 문자열일 때)
 * @param {array} cardButtons - 버튼 배열 (options가 문자열일 때)
 * @param {array} quickReplies - 퀵리플라이 배열
 */
function replyCard(options, desc, cardButtons = [], quickReplies = []) {
  let title, description, imageUrl, buttons;

  // 객체 형태로 받은 경우
  if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
    title = options.title;
    description = options.description;
    imageUrl = options.imageUrl;
    buttons = options.buttons || [];
  } else {
    // 기존 방식 호환
    title = options;
    description = desc;
    buttons = cardButtons;
  }

  const card = {
    title: title || '',
    description: description || ''
  };

  // 이미지 (있으면)
  if (imageUrl) {
    card.thumbnail = { imageUrl };
  }

  // 버튼
  if (buttons.length > 0) {
    card.buttons = buttons.slice(0, 3).map(b => {
      // 문자열이면 label과 messageText 동일
      if (typeof b === 'string') {
        return { label: b, action: 'message', messageText: b };
      }
      // 객체면 그대로 사용
      return { label: b.label, action: 'message', messageText: b.text || b.label };
    });
  }

  const response = {
    version: '2.0',
    template: {
      outputs: [{ basicCard: card }]
    }
  };

  if (quickReplies && quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({
      label: b,
      action: 'message',
      messageText: b
    }));
  }

  return response;
}

/**
 * 텍스트 + 베이직 카드 응답
 */
function replyTextAndCard(text, title, desc, cardButtons = [], quickReplies = []) {
  const response = {
    version: '2.0',
    template: {
      outputs: [
        { simpleText: { text } },
        {
          basicCard: {
            title,
            description: desc,
            buttons: cardButtons.map(b => ({
              label: b.label,
              action: 'message',
              messageText: b.text || b.label
            }))
          }
        }
      ]
    }
  };
  
  if (quickReplies.length > 0) {
    response.template.quickReplies = quickReplies.map(b => ({
      label: b,
      action: 'message',
      messageText: b
    }));
  }
  
  return response;
}

/**
 * 공유 카드 응답
 */
function replyShareCard(imageUrl, title, description, shareText, buttons = []) {
  return {
    version: '2.0',
    template: {
      outputs: [{
        basicCard: {
          thumbnail: { imageUrl: imageUrl },
          title: title,
          description: description,
          buttons: [{
            action: 'share',
            label: '친구에게 공유',
            messageText: shareText
          }]
        }
      }],
      quickReplies: buttons.slice(0, 10).map(b => ({
        label: b,
        action: 'message',
        messageText: b
      }))
    }
  };
}

/**
 * 리스트 카드 응답 (인벤토리, 상점용)
 * @param {string|object} header - 헤더 문자열 또는 { title, imageUrl }
 * @param {array} items - [{ title, desc/description, image, action, messageText }]
 * @param {array} buttons - 버튼 문자열 배열 (최대 2개)
 */
function replyListCard(header, items, buttons = []) {
  // header가 문자열이면 객체로 변환
  const headerObj = typeof header === 'string' ? { title: header } : header;

  const response = {
    version: "2.0",
    template: {
      outputs: [{
        listCard: {
          header: {
            title: headerObj.title || '',
            imageUrl: headerObj.imageUrl || undefined
          },
          items: items.slice(0, 5).map((item) => {
            const listItem = {
              title: item.title || '',
              description: item.desc || item.description || ''
            };

            // imageUrl이 있을 때만 추가
            if (item.image) {
              listItem.imageUrl = item.image;
            }

            // action이 있을 때만 추가
            if (item.action && item.messageText) {
              listItem.action = {
                type: "message",
                messageText: item.messageText
              };
            }

            return listItem;
          }),
          buttons: buttons.slice(0, 2).map(b => ({
            label: b,
            action: "message",
            messageText: b
          }))
        }
      }]
    }
  };

  // header imageUrl 없으면 제거
  if (!headerObj.imageUrl) {
    delete response.template.outputs[0].listCard.header.imageUrl;
  }

  return response;
}

/**
 * 캐러셀 응답 (직업 선택, 장비 비교용)
 */
function replyCarousel(cards) {
  return {
    version: "2.0",
    template: {
      outputs: [{
        carousel: {
          type: "basicCard",
          items: cards.slice(0, 10).map(card => ({
            title: card.title || '',
            description: card.desc || '',
            thumbnail: card.image ? { imageUrl: card.image } : undefined,
            buttons: (card.buttons || []).slice(0, 3).map(b => ({
              label: b.label || b,
              action: "message",
              messageText: b.action || b.label || b
            }))
          }))
        }
      }]
    }
  };
}

/**
 * 아이템 카드 응답 (장비 상세용)
 */
function replyItemCard(title, grade, image, stats, buttons = []) {
  return {
    version: "2.0",
    template: {
      outputs: [{
        itemCard: {
          imageTitle: {
            title: title,
            description: grade
          },
          thumbnail: image ? {
            imageUrl: image,
            width: 800,
            height: 800
          } : undefined,
          itemList: stats.slice(0, 5).map(s => ({
            title: s.label,
            description: String(s.value)
          })),
          itemListAlignment: "right",
          buttons: buttons.slice(0, 3).map(b => ({
            label: b,
            action: "message",
            messageText: b
          }))
        }
      }]
    }
  };
}

// ============================================
// Export
// ============================================

module.exports = {
  reply,
  replyWithImage,
  replyCard,
  replyTextAndCard,
  replyShareCard,
  replyListCard,
  replyCarousel,
  replyItemCard
};
