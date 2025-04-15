(function () {
  // 이미 UI가 있으면 중복 생성 방지
  if (document.querySelector(".my-ext-container")) {
    return;
  }

  // 구글 검색 결과 영역
  const searchArea = document.getElementById("search");
  if (!searchArea) {
    console.log("[Extension] 구글 검색 영역(#search)을 찾지 못했습니다.");
    return;
  }

  // 확장 UI 컨테이너
  const extContainer = document.createElement("div");
  extContainer.className = "my-ext-container";

  // 헤더
  const header = document.createElement("div");
  header.className = "my-ext-header";

  const title = document.createElement("div");
  title.className = "my-ext-title";
  title.textContent = "Anti-AI-Searcher";

  header.appendChild(title);

  // 탭 버튼
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

  // 탭 컨텐츠 영역
  const contentArea = document.createElement("div");
  contentArea.className = "my-ext-content-area";

  const aiContent = document.createElement("div");
  aiContent.className = "my-ext-tab-content active";

  const humanContent = document.createElement("div");
  humanContent.className = "my-ext-tab-content";

  contentArea.appendChild(aiContent);
  contentArea.appendChild(humanContent);

  // UI 조립
  extContainer.appendChild(header);
  extContainer.appendChild(tabsWrapper);
  extContainer.appendChild(contentArea);

  // 구글 검색 영역 상단에 삽입
  searchArea.insertAdjacentElement("afterbegin", extContainer);

  // "분석 중" 안내
  aiContent.innerHTML = "<div>검색 결과를 분석 중입니다...</div>";
  humanContent.innerHTML = "<div>검색 결과를 분석 중입니다...</div>";

  // 1) 모든 링크 수집
  const allAnchorTags = Array.from(document.querySelectorAll("a"));
  let allLinks = allAnchorTags
    .map((a) => a.href)
    .filter((href) => href && !href.toLowerCase().includes("google"));

  // 2) 서버에 보낼 JSON
  const payload = { links: allLinks };

  // 서버 주소
  const SERVER_URL = "http://127.0.0.1:8000/check_ai";

  // 3) 서버 POST
  fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.results) {
        aiContent.innerHTML = "<div>결과 포맷이 올바르지 않습니다.</div>";
        console.error("결과 포맷이 이상함:", data);
        return;
      }

      // 안내 문구 제거
      aiContent.innerHTML = "";
      humanContent.innerHTML = "";

      data.results.forEach((item) => {
        const url = item.url;
        const aiProbRaw = item.ai_probability;

        // 크롤링 실패나 판별 실패 처리
        if (typeof aiProbRaw !== "number") {
          const failBox = document.createElement("div");
          failBox.className = "my-ext-link";
          failBox.textContent = `${url} | 오류: ${aiProbRaw}`;
          humanContent.appendChild(failBox);
          return;
        }

        // AI 확률(0~1) → 백분율
        const aiProbPercent = (aiProbRaw * 100).toFixed(2);
        const isAILink = aiProbRaw > 0.6; // 60% 기준

        // 전체 박스
        const linkBox = document.createElement("div");
        linkBox.className = "my-ext-link";

        // 왼쪽: 링크 부분
        const leftPart = document.createElement("div");
        leftPart.className = "link-left";

        const anchor = document.createElement("a");
        anchor.className = "my-link-anchor";
        anchor.href = url;
        anchor.target = "_blank";
        anchor.innerText = url;
        leftPart.appendChild(anchor);

        // 오른쪽: 확률 박스
        const rightPart = document.createElement("div");
        rightPart.className = "link-right";
        rightPart.textContent = `AI 확률: ${aiProbPercent}%`;

        // 확률별 배경/글자색 설정
        setProbabilityStyle(Number(aiProbPercent), rightPart);

        // 조립
        linkBox.appendChild(leftPart);
        linkBox.appendChild(rightPart);

        // 탭 분류
        if (isAILink) {
          aiContent.appendChild(linkBox);
        } else {
          humanContent.appendChild(linkBox);
        }
      });
    })
    .catch((err) => {
      console.error("[Extension] 서버 요청 실패:", err);
      aiContent.innerHTML = "<div>서버 요청 실패</div>";
      humanContent.innerHTML = "";
    });

  // 확률별 배경/글자색 설정 함수
  function setProbabilityStyle(prob, element) {
    // prob: 0~100

    if (prob <= 20) {
      element.style.backgroundColor = "green";
      element.style.color = "#000";
    } else if (prob <= 40) {
      element.style.backgroundColor = "#85cc00";
      element.style.color = "#000";
    } else if (prob <= 60) {
      element.style.backgroundColor = "yellow";
      element.style.color = "#000";
    } else if (prob <= 80) {
      element.style.backgroundColor = "orange";
      element.style.color = "#000";
    } else {
      element.style.backgroundColor = "red";
      element.style.color = "#fff";
    }
  }

  // 탭 버튼 이벤트
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
})();