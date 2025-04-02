(function () {
  // 이미 생성된 UI가 있다면 중단
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
  title.textContent = "Anti-AI-Searcher"; // 원하는 제목

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

  // 래퍼에 삽입
  columnsWrapper.appendChild(leftCol);
  columnsWrapper.appendChild(rightCol);

  // 컨테이너에 헤더, 칼럼 래퍼 삽입
  extContainer.appendChild(header);
  extContainer.appendChild(columnsWrapper);

  // 구글 검색 영역 최상단에 삽입
  searchArea.insertAdjacentElement("afterbegin", extContainer);

  // (예시) 모든 a 태그 -> 짝수/홀수 분류
  const allAnchorTags = Array.from(document.querySelectorAll("a"));
  const allLinks = allAnchorTags.map((a) => a.href).filter((href) => href);

  const aiLinks = [];
  const humanLinks = [];
  allLinks.forEach((link, idx) => {
    if (idx % 2 === 0) aiLinks.push(link);
    else humanLinks.push(link);
  });

  // 링크 표시 함수
  function appendLinksToColumn(links, col) {
    links.forEach((l) => {
      const linkEl = document.createElement("div");
      linkEl.className = "my-ext-link";
      linkEl.textContent = l;
      col.appendChild(linkEl);
    });
  }

  appendLinksToColumn(aiLinks, leftCol);
  appendLinksToColumn(humanLinks, rightCol);

  // 다운로드 헬퍼
  function downloadJSON(filename, dataObj) {
    const dataStr = JSON.stringify(dataObj, null, 2);
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

  // 이벤트
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
