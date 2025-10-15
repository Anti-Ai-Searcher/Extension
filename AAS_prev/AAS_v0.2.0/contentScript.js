(function () {
  // 이미 UI가 있으면 중단
  if (document.querySelector(".my-ext-container")) {
    return;
  }

  const searchArea = document.getElementById("search");
  if (!searchArea) {
    console.log("[Extension] 구글 검색 영역(#search)을 찾지 못했습니다.");
    return;
  }

  // 1) 최상단 컨테이너
  const extContainer = document.createElement("div");
  extContainer.className = "my-ext-container";

  // 2) 상단 헤더
  const header = document.createElement("div");
  header.className = "my-ext-header";

  const title = document.createElement("div");
  title.className = "my-ext-title";
  title.textContent = "Anti-AI-Searcher";

  // 전체 다운로드 버튼
  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.className = "my-ext-button";
  downloadAllBtn.textContent = "전체 링크 다운로드";

  header.appendChild(title);
  header.appendChild(downloadAllBtn);

  // 3) 좌/우 칼럼 래퍼
  const columnsWrapper = document.createElement("div");
  columnsWrapper.className = "my-ext-columns";

  // 좌측 칼럼
  const leftCol = document.createElement("div");
  leftCol.className = "my-ext-column";

  const leftColHeader = document.createElement("div");
  leftColHeader.className = "my-ext-col-header";

  const leftTitle = document.createElement("div");
  leftTitle.className = "my-ext-col-title";
  leftTitle.textContent = "AI Links";

  const downloadLeftBtn = document.createElement("button");
  downloadLeftBtn.className = "my-ext-button";
  downloadLeftBtn.textContent = "다운로드";

  leftColHeader.appendChild(leftTitle);
  leftColHeader.appendChild(downloadLeftBtn);
  leftCol.appendChild(leftColHeader);

  // 우측 칼럼
  const rightCol = document.createElement("div");
  rightCol.className = "my-ext-column";

  const rightColHeader = document.createElement("div");
  rightColHeader.className = "my-ext-col-header";

  const rightTitle = document.createElement("div");
  rightTitle.className = "my-ext-col-title";
  rightTitle.textContent = "Human Links";

  const downloadRightBtn = document.createElement("button");
  downloadRightBtn.className = "my-ext-button";
  downloadRightBtn.textContent = "다운로드";

  rightColHeader.appendChild(rightTitle);
  rightColHeader.appendChild(downloadRightBtn);
  rightCol.appendChild(rightColHeader);

  // 4) 래퍼에 좌/우 칼럼 삽입
  columnsWrapper.appendChild(leftCol);
  columnsWrapper.appendChild(rightCol);

  // 컨테이너에 헤더, 칼럼 래퍼 삽입
  extContainer.appendChild(header);
  extContainer.appendChild(columnsWrapper);

  // 5) 구글 검색 영역 최상단에 삽입
  searchArea.insertAdjacentElement("afterbegin", extContainer);

  // 6) 모든 a 태그를 수집 -> 필터 -> 짝수/홀수 분류
  const allAnchorTags = Array.from(document.querySelectorAll("a"));
  // 6-1) href 추출
  let allLinks = allAnchorTags.map((a) => a.href).filter((href) => href);

  // 6-2) "google" 단어가 들어간 url은 제외
  //      대소문자 구분 없이 처리: toLowerCase() 후 "google" 포함 검사
  allLinks = allLinks.filter((link) => !link.toLowerCase().includes("google"));

  // 7) 짝수 인덱스 -> AI, 홀수 인덱스 -> Human
  const aiLinks = [];
  const humanLinks = [];
  allLinks.forEach((link, idx) => {
    if (idx % 2 === 0) {
      aiLinks.push(link);
    } else {
      humanLinks.push(link);
    }
  });

  // 8) UI에 링크 표시 (하이퍼링크로 표시)
  function appendLinksToColumn(links, col) {
    links.forEach((l) => {
      // 링크 박스
      const linkBox = document.createElement("div");
      linkBox.className = "my-ext-link";

      // 실제 하이퍼링크 (누르면 이동)
      const anchor = document.createElement("a");
      anchor.href = l;
      anchor.target = "_blank"; // 새 탭에서 열기
      anchor.innerText = l; // 보여주는 텍스트
      anchor.className = "my-link-anchor"; // CSS 호버 스타일을 위해

      linkBox.appendChild(anchor);
      col.appendChild(linkBox);
    });
  }

  appendLinksToColumn(aiLinks, leftCol);
  appendLinksToColumn(humanLinks, rightCol);

  // 9) 다운로드 헬퍼
  function downloadJSON(filename, dataArr) {
    // dataArr에는 이미 google 제외된 링크가 들어 있음
    const dataStr = JSON.stringify(dataArr, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 10) 다운로드 버튼 이벤트
  downloadAllBtn.addEventListener("click", () => {
    downloadJSON("allLinks.json", allLinks);
  });
  downloadLeftBtn.addEventListener("click", () => {
    downloadJSON("aiLinks.json", aiLinks);
  });
  downloadRightBtn.addEventListener("click", () => {
    downloadJSON("humanLinks.json", humanLinks);
  });
})();
