// background.js (service_worker)

// content script -> background.js 로 메시지 받기 예시
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'classifyLink') {
      const link = request.link;
  
      // 예시: AI API 서버 호출 -> 결과 받기
      // fetch('https://my-ai-server.com/classify', { ... })
      //   .then(res => res.json())
      //   .then(data => {
      //       sendResponse({ isAI: data.isAI });
      //   })
      //   .catch(err => {
      //       console.error(err);
      //       sendResponse({ error: err });
      //   });
  
      // 일단 임의로 분류값을 돌려주는 예시
      const isAI = Math.random() < 0.5;
      sendResponse({ isAI });
      return true; // 비동기 응답을 사용할 경우 true
    }
  });
  