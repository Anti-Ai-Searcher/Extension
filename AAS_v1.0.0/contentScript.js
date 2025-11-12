// == Anti-AI-Searcher : contentScript ==
// writer: @pchyuk
// version: 4.0.0

(function () {
  // 중복 삽입 방지 플래그가 이미 있으면 즉시 종료
  if (window.__aasInjected) return;
  // 중복 삽입 방지 플래그 설정
  window.__aasInjected = true;

  /* 0. 설정값 불러오기 영역 */
  const defaultSettings = {
    aiJudge: 60, // 기본 AI 확률 임계치(%). 이 값 이상이면 'AI Links'로 분류
  };
  function loadSettings() {
    // 크롬 스토리지를 쓸 수 있으면 동기화 스토리지에서 설정값 로드
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(defaultSettings, (settings) => {
          resolve(settings); // 설정값 반환
        });
      });
    } else {
      // 브라우저 환경(테스트 등)에서 로컬 스토리지 사용
      const saved = localStorage.getItem('extensionSettings');
      const settings = saved ? JSON.parse(saved) : defaultSettings;
      return Promise.resolve(settings); // 설정값 반환
    }
  }

  /* 1. 공용 스타일(CSS) 주입 – 웹/이미지 모두 사용 */
  const st = document.createElement("style");                          // <style> 엘리먼트 생성
  st.textContent = `
    .aas-tabbar{display:flex;width:100%;border:1px solid #dadce0;border-radius:4px;
      overflow:hidden;margin:12px 0;font-family:Arial,Helvetica,sans-serif}
    .aas-tab{flex:1;padding:8px 0;background:#f1f3f4;color:#555;text-align:center;
      font-size:14px;font-weight:500;cursor:pointer;border-right:1px solid #dadce0}
    .aas-tab:last-child{border-right:none}.aas-tab.active{background:#fff;color:#1a73e8;font-weight:600}
    .aas-loading{margin:8px 0;font-size:14px;color:#555;font-family:Arial,Helvetica,sans-serif}
    body.aas-screen-ai .aas-card.aas-ai{display:none!important}
    body.aas-screen-human .aas-card.aas-human{display:none!important}
    .ai-badge{position:absolute;right:8px;bottom:8px;padding:2px 6px;border-radius:4px;
      font-size:12px;font-weight:600;z-index:50}
    /* ---- 이미지 사이드패널 배지 ---- */
    .aas-img-badge{display:inline-block;margin-top:8px;margin-left:8px;padding:4px 8px;border-radius:6px;
      font-size:12px;font-weight:700;vertical-align:middle}
  `;                                                                     // 확장 전용 스타일 정의
  document.head.appendChild(st);                                        // 문서 <head>에 스타일 삽입

  /* [보조] 현재 화면이 '이미지 탭'인지 판별 */
  function isImageTab(){
    try{
      const sp = new URL(location.href).searchParams;                   // 주소창 쿼리 파라미터 파싱
      if (sp.get('tbm') === 'isch') return true;                        // tbm=isch 이면 이미지 탭
    }catch(e){}
    if (document.querySelector('#islrg')) return true;                  // 이미지 그리드 루트가 있으면 이미지 탭으로 간주
    return false;                                                       // 그 외는 일반 웹 검색 탭
  }

  /* 2. 상단 탭바 + 로딩 표시(웹 검색 전용 UI) */
  const ENABLE_WEBBAR = !isImageTab();                                  // 이미지 탭에서는 탭바를 숨김
  const bar = document.createElement("div");                             // 탭바 컨테이너 생성
  bar.className = "aas-tabbar";                                          // 탭바 스타일 클래스 지정

  // 탭 3종 생성(전체/휴먼/AI)
  const tT = Object.assign(document.createElement("div"), {className:"aas-tab active",textContent:"Total Links"}) // 전체 탭(기본 on)
  const tH = Object.assign(document.createElement("div"), {className:"aas-tab",textContent:"Human Links"});       // 휴먼 탭
  const tA = Object.assign(document.createElement("div"), {className:"aas-tab",textContent:"AI Links"});           // AI 탭
  bar.append(tT,tH,tA);                                                   // 탭바에 3개 탭 추가

  // '분석 중' 안내 영역 생성(웹 검색 결과 분석 시 표시)
  const loading = Object.assign(document.createElement("div"),{className:"aas-loading",textContent:"검색 결과를 분석 중입니다..."});
  loading.style.display="none";                                          // 초기에는 숨김

  const search = document.getElementById("search");                      // 구글 검색 결과 루트
  const parent = search?.parentElement||document.body;                   // 삽입 기준 부모 노드
  if (search && ENABLE_WEBBAR) {                                         // 이미지 탭이 아니면 탭바/로딩 영역 삽입
    parent.insertBefore(loading, search);                                // 로딩 텍스트를 검색 영역 위에 삽입
    parent.insertBefore(bar, search);                                    // 탭바를 검색 영역 위에 삽입
  }

  // 탭 전환 시 보이기/숨기기 상태를 바디 클래스 토글로 제어
  function activateTab(tab) {
    tT.classList.remove("active");                                       // 전체 탭 active 해제
    tH.classList.remove("active");                                       // 휴먼 탭 active 해제
    tA.classList.remove("active");                                       // AI 탭 active 해제
    tab.classList.add("active");                                         // 클릭된 탭을 active 처리

    document.body.classList.remove("aas-screen-human", "aas-screen-ai"); // 기존 필터링 클래스 제거
    if (tab === tH) {                                                    // 휴먼 탭 클릭 시
      document.body.classList.add("aas-screen-ai");                      // 'AI 카드 숨김' 모드
    } else if (tab === tA) {                                             // AI 탭 클릭 시
      document.body.classList.add("aas-screen-human");                   // '휴먼 카드 숨김' 모드
    }
  }
  // 탭 클릭 이벤트 바인딩(각 탭을 클릭하면 activateTab 호출)
  tT.onclick=()=>{activateTab(tT);};
  tH.onclick=()=>{activateTab(tH);};
  tA.onclick=()=>{activateTab(tA);};

  /* 3. 색상 유틸 – 퍼센트값에 따라 배지의 배경/글자색 지정 */
  function styleProb(prob, el){
    if(prob<=20){el.style.background="green";el.style.color="#000";}     // 0~20%: 초록(휴먼 쪽)
    else if(prob<=40){el.style.background="#85cc00";el.style.color="#000";} // 21~40%: 연녹색
    else if(prob<=60){el.style.background="yellow";el.style.color="#000";}  // 41~60%: 노란색(중간)
    else if(prob<=80){el.style.background="orange";el.style.color="#000";}  // 61~80%: 주황
    else{el.style.background="red";el.style.color="#fff";}               // 81~100%: 빨강(AI 쪽)
  }
  function styleError(el){ el.style.background="#888";el.style.color="#fff"; } // 에러/중립 색상

  /* 4. 구글 웹 검색 카드 수집 – 중복 처리 방지 및 유효 링크만 추출 */
  function collect(){
    return Array.from(document.querySelectorAll("#search .g, #search .MjjYud")) // 결과 카드 후보 선택
      .filter(c=>!c.classList.contains("aas-card"))                    // 이미 처리한 카드는 제외
      .map(card=>{
        const a=card.querySelector("a[href]");                         // 카드 내 첫 번째 링크
        if(!a) return null;                                            // 링크 없으면 스킵
        const url=a.href;                                              // 링크 URL 추출
        if(!url||url.includes("google")) return null;                  // 구글 내부 링크는 제외
        card.classList.add("aas-card");                                // 처리 플래그 클래스 부여
        return{card,url};                                              // 카드와 URL을 반환
      }).filter(Boolean);                                              // null 제거
  }

  /* 5. 백그라운드와의 메시지 송수신 헬퍼 */
  const bgCheckLinks=(links)=>new Promise(res=>{
    chrome.runtime.sendMessage({type:"CHECK_AI",links},r=>res(r));      // 텍스트/링크 분석 요청
  });
  const bgCheckImage=(src)=>new Promise(res=>{
    chrome.runtime.sendMessage({type:"CHECK_IMAGE",src},r=>res(r));     // 이미지 업로드+분석 요청
  });

  /* 6. 웹 검색 카드 주석(배지) 달기 */
  let busy=false;                                                       // 동시 분석 방지 플래그
  async function annotate(){
    if(!search) return;                                                 // 웹 검색 페이지가 아니면 중단
    if(isImageTab()) return;                                            // 이미지 탭이면 수행 안 함
    if(busy) return;                                                    // 이미 작업 중이면 중단
    const batch=collect(); if(!batch.length) return;                    // 새로 수집된 카드가 없으면 중단
    busy=true; loading.style.display="block";                           // 로딩 표시 켜기

    const settingsPromise = loadSettings();                             // 설정값 로드(비동기)
    const uniq=[...new Set(batch.map(i=>i.url))];                       // 중복 URL 제거
    const rep=await bgCheckLinks(uniq).catch(e=>({ok:false,error:e}));  // 백그라운드에 분석 요청
    if(!(rep?.ok&&rep.data?.results)){                                  // 실패 시 처리
      console.error("[AAS] bg fail",rep);
      busy=false; loading.style.display="none";
      return;
    }

    const probMap={}, errMap={};                                        // 확률/에러 맵
    rep.data.results.forEach(r=>{                                       // 서버 응답 순회
      if(typeof r.ai_probability==="number")
        probMap[r.url]=(r.ai_probability*100).toFixed(2);               // 0~1 → 퍼센트 문자열
      else
        errMap[r.url]=r.ai_probability;                                 // 오류 메시지 저장
    });

    const errCards=[];                                                  // 오류 카드 목록
    batch.forEach(({card,url})=>{                                       // 각 카드에 배지 부착
      let badge=document.createElement("span");                         // 배지 엘리먼트 생성
      badge.className="ai-badge";                                       // 배지 스타일 클래스
      card.style.position ||= "relative";                               // 배지 포지셔닝 대비
      card.style.paddingBottom="26px";                                  // 배지 공간 확보(하단)
      settingsPromise.then(s => {                                       // 설정값 로드 후 처리
        window.__aasSettings = s;                                       // 디버그용 전역 저장
        const aiJudge = s.aiJudge ?? defaultSettings.aiJudge;           // 임계치 결정
        if(url in probMap){                                             // 정상 확률을 받은 경우
          const pct=probMap[url];                                       // 퍼센트 문자열
          badge.textContent=`AI 확률 : ${pct}%`;                        // 배지 텍스트
          styleProb(Number(pct),badge);                                 // 색상 스타일 적용
          card.classList.add(Number(pct)>=aiJudge?"aas-ai":"aas-human");// 필터링 클래스 부여
        }else{                                                          // 오류 메시지인 경우
          const msg=errMap[url]||"오류";                                // 메시지 결정
          badge.textContent=msg;                                        // 배지 텍스트
          styleError(badge);                                            // 에러 색 적용
          card.classList.add("aas-error");                              // 오류 카드 표시
          errCards.push(card);                                          // 목록에 추가
        }
        card.appendChild(badge);                                        // 카드에 배지 부착
      });
    });

    loading.style.display="none";                                       // 로딩 숨김
    busy=false;                                                         // 작업 상태 해제
  }

  /* 7. 이미지 탭(오른쪽 사이드패널) 지원 */
  // 사이드패널 컨테이너를 찾아 반환
  function getSidePanelRoot() {
    return document.querySelector("#Sva75c") || document.querySelector("#rhs"); // 우선순위대로 탐색
  }

  // 큰 해상도의 미리보기 이미지를 우선 선택(가장 넓은 면적 기준)
  function pickBestImageSrc(root) {
    if (!root) return null;                                             // 루트 없으면 중단
    const imgs = Array.from(root.querySelectorAll("img.n3VNCb, img[src^='http']")); // 후보 이미지 수집
    let best = null, bestArea = 0;                                      // 최적 src 및 면적 초기화
    imgs.forEach(img => {
      const w = img.naturalWidth || img.width || 0;                     // 가로 크기
      const h = img.naturalHeight || img.height || 0;                   // 세로 크기
      const area = w*h;                                                 // 면적 계산
      if (img.src && /^https?:\/\//.test(img.src) && area > bestArea && w >= 128 && h >= 128) {
        best = img.src;                                                 // 더 큰 이미지를 채택
        bestArea = area;                                                // 최대 면적 갱신
      }
    });
    return best;                                                        // 최종 src 반환
  }

  // 파란 '방문/Visit' 버튼 엘리먼트를 찾기
  function findVisitButton(root) {
    if (!root) return null;                                             // 루트 없으면 중단
    const candidates = Array.from(root.querySelectorAll("a,button"));   // 앵커/버튼 후보 수집
    return candidates.find(el => {
      const t = (el.textContent||"").trim();                            // 텍스트 라벨 추출
      return t === "Visit" || t === "방문";                              // 라벨 매칭
    }) || null;                                                          // 없으면 null
  }

  let lastAnalyzedSrc = null;                                           // 직전 분석한 이미지 src
  async function analyzeSideImage() {
    const root = getSidePanelRoot();                                    // 사이드패널 루트 조회
    if (!root) return;                                                  // 없으면 종료

    const src = pickBestImageSrc(root);                                 // 최적 이미지 src 선정
    if (!src || src === lastAnalyzedSrc) return;                        // 중복 분석 방지
    lastAnalyzedSrc = src;                                              // 최근 src 갱신

    // 분석 전 '방문' 버튼 아래에 자리잡을 배지(플레이스홀더) 준비
    const visitBtn = findVisitButton(root);                             // 방문 버튼 찾기
    let badge = root.querySelector(".aas-img-badge");                   // 기존 배지 재사용 시도
    if (!badge) {                                                       // 없으면 새로 생성
      badge = document.createElement("span");                           // <span> 생성
      badge.className = "aas-img-badge";                                // 스타일 클래스 부여
      if (visitBtn && visitBtn.parentElement) {                         // 버튼 부모가 있으면
        visitBtn.parentElement.appendChild(badge);                      // 버튼 옆에 붙임(좌우 배치)
      } else {
        root.appendChild(badge);                                        // 폴백: 루트에 붙임
      }
    }
    badge.textContent = "AI 판별 중..." ;                               // 로딩 텍스트 표시
    styleError(badge);                                                  // 중립(회색) 스타일 적용

    // 백그라운드에 이미지 업로드 요청(/check_file 호출)
    const rep = await bgCheckImage(src).catch(e=>({ok:false,error:e})); // 실패 시 객체 반환
    if(!(rep?.ok)) {                                                    // 통신/업로드 실패 처리
      badge.textContent = "이미지 분석 실패";                           // 실패 메시지 표시
      styleError(badge);                                                // 에러 색상
      return;                                                           // 종료
    }

    // 서버 응답값 읽기: 문자열("0.9322") 또는 숫자(0..1) 모두 지원 → 두 자리 퍼센트
    const raw = (rep.data && (rep.data.result ?? rep.data.ai_prob));    // result 우선, 없으면 ai_prob
    let prob;
    if (typeof raw === "string") prob = parseFloat(raw);                // 문자열이면 실수 변환
    else if (typeof raw === "number") prob = raw;                       // 숫자면 그대로
    else prob = 0;                                                      // 기타는 0 처리
    if (isNaN(prob)) prob = 0;                                          // NaN 방지
    const pctNum = Number((prob * 100).toFixed(2));                     // 0~1 → xx.xx% 로 변환
    badge.textContent = `AI 확률 : ${pctNum}%`;                         // 배지 텍스트 갱신
    styleProb(pctNum, badge);                                           // 확률에 맞는 색상 적용
  }

  // 사이드패널 DOM 변경을 감지하여 이미지 교체 시 재분석
  const panelObserver = new MutationObserver(() => analyzeSideImage()); // 변경 시 analyze 호출
  const attachPanelObserver = () => {
    const root = getSidePanelRoot();                                    // 루트 재탐색
    if (root) panelObserver.observe(root, { childList: true, subtree: true, attributes: true }); // 관찰 시작
  };
  attachPanelObserver();                                                // 초기 1회 부착
  // 페이지 내 탭 전환 등으로 DOM이 바뀔 때 옵저버를 재부착
  new MutationObserver(() => attachPanelObserver()).observe(document.body, { childList:true, subtree:true });

  // SPA 내에서 검색↔이미지 탭 전환 시 탭바 표시/숨김 토글(이미지 탭에선 숨김)
  setInterval(() => {
    if (!bar) return;                                                   // 탭바 객체 없으면 중단
    const shouldShow = !isImageTab();                                   // 이미지 탭이면 false
    if (bar.style.display === "" && !shouldShow) {                      // 현재 보이는 상태 → 숨김
      bar.style.display = "none";                                       // 탭바 숨김
      loading.style.display = "none";                                   // 로딩도 숨김
    } else if (bar.style.display === "none" && shouldShow) {            // 현재 숨김 상태 → 보이기
      bar.style.display = "";                                           // 탭바 표시
    }
  }, 800);                                                              // 0.8초 간격 체크(가벼운 폴링)

  /* 8. 초기화 + 변화 감시(웹 검색용) */
  if (search && ENABLE_WEBBAR) {                                        // 이미지 탭이 아닐 때만
    setTimeout(annotate,800);                                           // 최초 1회 분석(약간 지연)
    new MutationObserver(()=>annotate())                                // 검색 결과 DOM 변화 감지
      .observe(search||document.body,{childList:true,subtree:true});    // 변화 시 재분석
  }
})();