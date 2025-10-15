(function () {
    if (document.querySelector(".my-ext-container")) {
    return;
  }

  const searchArea = document.getElementById("search");
  if (!searchArea) {
    console.log("[Extension] 구글 검색 영역(#search)을 찾지 못했습니다.");
    return;
  }

  const extContainer = document.createElement("div");
  extContainer.className = "my-ext-container";

  const header = document.createElement("div");
  header.className = "my-ext-header";

  const title = document.createElement("div");
  title.className = "my-ext-title";
  title.textContent = "Anti-AI-Searcher";

  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.className = "my-ext-button";
  downloadAllBtn.textContent = "전체 링크 다운로드";

  header.appendChild(title);
  header.appendChild(downloadAllBtn);

  const tabsWrapper = document.createElement("div");
  tabsWrapper.className = "my-ext-tabs";

  const aiTabBtn = document.createElement("button");
  aiTabBtn.className = "my-ext-tab-button active";
  aiTabBtn.textContent = "AI Links";

  const humanTabBtn = document.createElement("button");
  humanTabBtn.className = "my-ext-tab-button";
  humanTabBtn.textContent = "Human Links";

  tabsWrapper.appendChild(aiTabBtn);
  tabsWrapper.appendChild(humanTabBtn);

  const contentArea = document.createElement("div");
  contentArea.className = "my-ext-content-area";

  const aiContent = document.createElement("div");
  aiContent.className = "my-ext-tab-content active";

  const humanContent = document.createElement("div");
  humanContent.className = "my-ext-tab-content";

  contentArea.appendChild(aiContent);
  contentArea.appendChild(humanContent);

  extContainer.appendChild(header);
  extContainer.appendChild(tabsWrapper);
  extContainer.appendChild(contentArea);

  searchArea.insertAdjacentElement("afterbegin", extContainer);

  const allAnchorTags = Array.from(document.querySelectorAll("a"));
  let allLinks = allAnchorTags.map((a) => a.href).filter((href) => href);
  allLinks = allLinks.filter((link) => !link.toLowerCase().includes("google"));

  const aiLinks = [];
  const humanLinks = [];
  allLinks.forEach((link, idx) => {
    if (idx % 2 === 0) aiLinks.push(link);
    else humanLinks.push(link);
  });

  function appendLinksToContent(links, container) {
    links.forEach((l) => {
      const linkBox = document.createElement("div");
      linkBox.className = "my-ext-link";

      const anchor = document.createElement("a");
      anchor.href = l;
      anchor.target = "_blank";
      anchor.innerText = l;
      anchor.className = "my-link-anchor";

      linkBox.appendChild(anchor);
      container.appendChild(linkBox);
    });
  }

  appendLinksToContent(aiLinks, aiContent);
  appendLinksToContent(humanLinks, humanContent);

  aiTabBtn.addEventListener("click", () => {
    aiContent.classList.add("active");
    humanContent.classList.remove("active");
    aiTabBtn.classList.add("active");
    humanTabBtn.classList.remove("active");
  });

  humanTabBtn.addEventListener("click", () => {
    humanContent.classList.add("active");
    aiContent.classList.remove("active");
    humanTabBtn.classList.add("active");
    aiTabBtn.classList.remove("active");
  });

  function downloadJSON(filename, dataArr) {
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

  downloadAllBtn.addEventListener("click", () => {
    downloadJSON("allLinks.json", allLinks);
  });
})();