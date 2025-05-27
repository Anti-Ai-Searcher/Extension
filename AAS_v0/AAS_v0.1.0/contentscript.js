(function() {
    // 이미 확장 UI가 주입되어 있으면 중복 생성 방지
    if (document.getElementById('extension-container')) {
      return;
    }
  
    // body의 margin-bottom 제거 (필요 시 조정)
    document.body.style.marginBottom = '0';
  
    // 1. 메인 컨테이너 생성
    const extensionContainer = document.createElement('div');
    extensionContainer.id = 'extension-container';
  
    // 2. 드래그 핸들(resizer)을 최상단에 배치 (UI 높이 조절용)
    const extensionResizer = document.createElement('div');
    extensionResizer.id = 'extension-resizer';
  
    // 3. 상단 영역 (여러 줄 텍스트를 포함하며 상하좌우 중앙 정렬)
    const extensionTop = document.createElement('div');
    extensionTop.id = 'extension-top';
    extensionTop.innerHTML = `
      <p class="top-line1">Anti-AI-Searcher(AAS)</p>
      <p class="top-line2">검색 결과를 AI로 분석하여 좌/우로 나누어 보여줍니다.</p>
    `;
  
    // 4. 하단 영역 (좌우 탭 영역)
    const extensionBottom = document.createElement('div');
    extensionBottom.id = 'extension-bottom';
  
    // 4-1. 좌측 탭 (AI로 판단된 링크)
    const extensionLeft = document.createElement('div');
    extensionLeft.id = 'extension-left';
    const leftHeader = document.createElement('div');
    leftHeader.className = 'extension-tab-header';
    const extLeftTitle = document.createElement('div');
    extLeftTitle.className = 'extension-tab-title';
    extLeftTitle.textContent = 'AI로 판단된 링크들 (예시)';
    const downloadBtnLeft = document.createElement('button');
    downloadBtnLeft.className = 'download-btn';
    downloadBtnLeft.textContent = '다운로드';
    leftHeader.appendChild(extLeftTitle);
    leftHeader.appendChild(downloadBtnLeft);
    extensionLeft.appendChild(leftHeader);
  
    // 4-2. 우측 탭 (사람이 작성한 글로 판단된 링크)
    const extensionRight = document.createElement('div');
    extensionRight.id = 'extension-right';
    const rightHeader = document.createElement('div');
    rightHeader.className = 'extension-tab-header';
    const extRightTitle = document.createElement('div');
    extRightTitle.className = 'extension-tab-title';
    extRightTitle.textContent = '사람이 작성한 글로 판단된 링크들 (예시)';
    const downloadBtnRight = document.createElement('button');
    downloadBtnRight.className = 'download-btn';
    downloadBtnRight.textContent = '다운로드';
    rightHeader.appendChild(extRightTitle);
    rightHeader.appendChild(downloadBtnRight);
    extensionRight.appendChild(rightHeader);
  
    // 4-3. 좌/우 탭을 하단 영역에 추가
    extensionBottom.appendChild(extensionLeft);
    extensionBottom.appendChild(extensionRight);
  
    // 5. 메인 컨테이너에 순서대로 추가: resizer, 상단 영역, 하단 영역
    extensionContainer.appendChild(extensionResizer);
    extensionContainer.appendChild(extensionTop);
    extensionContainer.appendChild(extensionBottom);
  
    // 6. 최종적으로 document.body에 추가
    document.body.appendChild(extensionContainer);
  
    // 7. 드래그로 UI 높이 조절 로직
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    extensionResizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      startY = e.clientY;
      startHeight = parseFloat(window.getComputedStyle(extensionContainer).getPropertyValue('height'));
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dy = e.clientY - startY;
      extensionContainer.style.height = `${startHeight - dy}px`;
    });
    document.addEventListener('mouseup', () => {
      isResizing = false;
    });
  
    // 8. 헬퍼 함수: 요소가 화면에 보이는지 확인
    function isVisible(el) {
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
  
 // 9. 문서(doc)에서 필요한 뉴스/블로그 등 관련 링크만 추출하는 함수
 function extractVisibleRelevantLinksFromDoc(doc) {
    let links = [];
    // 구글 검색 결과의 경우
    if (window.location.hostname.indexOf('google.com') > -1) {
      // 구글 검색 결과는 보통 div.yuRUbf 내부에 링크가 있음
      const googleResults = doc.querySelectorAll('div.yuRUbf a');
      googleResults.forEach(el => {
        if (el.href) {
          const text = el.textContent.toLowerCase();
          const href = el.href.toLowerCase();
          // 내부 google 링크는 제외
          if (href.indexOf('google.com') !== -1) return;
          // 뉴스, article, blog 키워드가 하나라도 포함되면 수집
          if (
            text.includes('news') ||
            text.includes('article') ||
            text.includes('blog') ||
            text.includes('tistory') ||
            text.includes('velog') ||
            href.includes('news') ||
            href.includes('article') ||
            href.includes('blog') ||
            href.includes('tistory') ||
            href.includes('velog')
          ) {
            links.push(el.href);
          }
        }
      });
    } else {
      // 네이버 등 다른 경우에는 기존처럼 모든 앵커 태그에서 추출 (텍스트 기준 필터 적용)
      const anchors = doc.querySelectorAll('a');
      anchors.forEach(el => {
        if (isVisible(el) && !el.querySelector('img') && el.href) {
          const text = el.textContent.toLowerCase();
          const href = el.href.toLowerCase();
          if (
            text.includes('news') ||
            text.includes('article') ||
            text.includes('blog') ||
            text.includes('tistory') ||
            text.includes('velog') ||
            href.includes('news') ||
            href.includes('article') ||
            href.includes('blog') ||
            href.includes('tistory') ||
            href.includes('velog')
          ) {
            links.push(el.href);
          }
        }
      });
    }
    return links;
  }
  
    // 10. 재귀적으로 다음 페이지까지 링크를 수집하는 함수 (구글: id="pnnext", 네이버: .btn_next)
    async function fetchAllPagesLinks(url, accumulatedLinks) {
      let doc;
      if (!url) {
        doc = document;
      } else {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const parser = new DOMParser();
          doc = parser.parseFromString(html, 'text/html');
        } catch (err) {
          console.error('Error fetching page:', url, err);
          return accumulatedLinks;
        }
      }
      const newLinks = extractVisibleRelevantLinksFromDoc(doc);
      accumulatedLinks = accumulatedLinks.concat(newLinks);
  
      // 다음 페이지 URL 확인 (구글: pnnext, 네이버: .btn_next)
      let nextPageUrl = null;
      if (window.location.hostname.indexOf('google.com') > -1) {
        const nextBtn = doc.getElementById('pnnext');
        if (nextBtn) {
          nextPageUrl = nextBtn.href;
        }
      } else if (window.location.hostname.indexOf('naver.com') > -1) {
        const nextBtn = doc.querySelector('.sc_page_inner .btn_next');
        if (nextBtn && nextBtn.href) {
          nextPageUrl = nextBtn.href;
        }
      }
      if (nextPageUrl) {
        return fetchAllPagesLinks(nextPageUrl, accumulatedLinks);
      } else {
        return accumulatedLinks;
      }
    }
  
    // 11. 모든 페이지의 링크를 집계하고 UI 및 storage 업데이트
    async function aggregateAllSearchResultLinks() {
      // 로딩 메시지 표시 (옵션)
      extensionTop.innerHTML = '<p class="top-line1">검색 결과를 모두 수집 중입니다...</p>';
      const allLinks = await fetchAllPagesLinks(null, []);
      // 상단 원래 텍스트 복원 (원하는 내용으로 수정 가능)
      extensionTop.innerHTML = `
        <p class="top-line1">Anti-AI-Searcher(AAS)</p>
        <p class="top-line2">검색 결과를 AI로 분석하여 좌/우로 나누어 보여줍니다.</p>
      `;
      // 전체 링크 JSON을 storage에 저장
      const allLinksJSON = JSON.stringify(allLinks, null, 2);
      chrome.storage.local.set({ searchLinks: allLinksJSON }, () => {
        console.log('전체 검색 결과 링크들을 JSON 형태로 저장했습니다.');
      });
      // 좌측, 우측 탭의 링크 표시 초기화 (헤더는 유지)
      while (extensionLeft.childNodes.length > 1) {
        extensionLeft.removeChild(extensionLeft.lastChild);
      }
      while (extensionRight.childNodes.length > 1) {
        extensionRight.removeChild(extensionRight.lastChild);
      }
      // 좌측과 우측 배열에 번갈아 분류하여 표시
      let leftLinks = [];
      let rightLinks = [];
      allLinks.forEach((link, idx) => {
        const linkEl = document.createElement('div');
        linkEl.className = 'extension-link';
        linkEl.textContent = link;
        if (idx % 2 === 0) {
          leftLinks.push(link);
          extensionLeft.appendChild(linkEl);
        } else {
          rightLinks.push(link);
          extensionRight.appendChild(linkEl);
        }
      });
      // 다운로드 버튼 이벤트 업데이트
      downloadBtnLeft.onclick = () => {
        const jsonStr = JSON.stringify(leftLinks, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AIMakeLinks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      downloadBtnRight.onclick = () => {
        const jsonStr = JSON.stringify(rightLinks, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'HumanMakeLinks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }
  
    // 12. 스크립트 로드시 모든 검색 결과(및 필요한 뉴스/블로그 링크) 집계 시작
    aggregateAllSearchResultLinks();
  
  })();  