// == Anti-AI-Searcher : contentScript with Tabs & Loading ==
(function () {
  if (window.__aasInjected) return;
  window.__aasInjected = true;

  /* ───────── CSS 삽입 ───────── */
  const style = document.createElement("style");
  style.textContent = `
    .aas-tabbar{display:flex;width:100%;border:1px solid #dadce0;border-radius:4px;
      overflow:hidden;margin:12px 0;font-family:Arial,Helvetica,sans-serif}
    .aas-tab{flex:1;padding:8px 0;background:#f1f3f4;color:#555;text-align:center;
      font-size:14px;font-weight:500;cursor:pointer;border-right:1px solid #dadce0}
    .aas-tab:last-child{border-right:none}
    .aas-tab.active{background:#fff;color:#1a73e8;font-weight:600}
    /* 로딩 멘트 */
    .aas-loading{margin:8px 0;font-size:14px;color:#555;font-family:Arial,Helvetica,sans-serif}
    /* 카드 show/hide */
    body.aas-show-human .aas-card.aas-ai{display:none!important}
    body.aas-show-ai    .aas-card.aas-human{display:none!important}
    /* 뱃지 */
    .ai-badge{position:absolute;right:8px;bottom:8px;padding:2px 6px;border-radius:4px;
      font-size:12px;font-weight:600;z-index:50}
  `;
  document.head.appendChild(style);

  /* ───────── 탭 UI + 로딩 엘리먼트 ───────── */
  const tabBar   = document.createElement("div");
  tabBar.className = "aas-tabbar";
  const tabHuman = Object.assign(document.createElement("div"), { className:"aas-tab active", textContent:"Human Links" });
  const tabAI    = Object.assign(document.createElement("div"), { className:"aas-tab",        textContent:"AI Links"   });
  tabBar.append(tabHuman, tabAI);

  const loadMsg  = Object.assign(document.createElement("div"), { className:"aas-loading", textContent:"검색 결과를 분석 중입니다..." });
  loadMsg.style.display = "none";

  /* 삽입 위치 : 검색 결과 컨테이너(#search) 바로 위 */
  const searchCont = document.getElementById("search");
  (searchCont?.parentElement || document.body).insertBefore(loadMsg, searchCont);
  (searchCont?.parentElement || document.body).insertBefore(tabBar, searchCont);

  /* 탭 동작 */
  document.body.classList.add("aas-show-human");
  tabHuman.onclick = () => {
    tabHuman.classList.add("active"); tabAI.classList.remove("active");
    document.body.classList.add("aas-show-human"); document.body.classList.remove("aas-show-ai");
  };
  tabAI.onclick = () => {
    tabAI.classList.add("active"); tabHuman.classList.remove("active");
    document.body.classList.add("aas-show-ai"); document.body.classList.remove("aas-show-human");
  };

  /* ───────── 확률별 뱃지 색 ───────── */
  function setBadgeStyle(prob, el){
    if(prob<=20){el.style.background="green"; el.style.color="#000";}
    else if(prob<=40){el.style.background="#85cc00"; el.style.color="#000";}
    else if(prob<=60){el.style.background="yellow"; el.style.color="#000";}
    else if(prob<=80){el.style.background="orange"; el.style.color="#000";}
    else{el.style.background="red"; el.style.color="#fff";}
  }

  /* ───────── 결과 카드 수집 ───────── */
  function collectCards(){
    return Array.from(document.querySelectorAll("#search .g, #search .MjjYud"))
      .filter(c=>!c.classList.contains("aas-card"))
      .map(card=>{
        const a=card.querySelector("a[href]");
        if(!a) return null;
        const url=a.href;
        if(!url||url.includes("google")) return null;
        card.classList.add("aas-card");
        return{card,url};
      }).filter(Boolean);
  }

  /* background 메시지 */
  function askBg(links){
    return new Promise(res=>{
      chrome.runtime.sendMessage({type:"CHECK_AI",links},r=>res(r));
    });
  }

  /* ───────── 메인 annotate ───────── */
  let inFlight = false;
  async function annotate(){
    if(inFlight) return;
    const info=collectCards();
    if(!info.length) return;

    inFlight = true;
    loadMsg.style.display = "block";        // ── 로딩 멘트 ON

    const unique=[...new Set(info.map(i=>i.url))];
    const reply=await askBg(unique).catch(e=>({ok:false,error:e}));
    if(reply?.ok && reply.data?.results){
      const map={};
      reply.data.results.forEach(r=>{
        if(typeof r.ai_probability==="number")
          map[r.url]=(r.ai_probability*100).toFixed(2);
      });

      info.forEach(({card,url})=>{
        const pct=map[url]; if(!pct) return;
        card.style.position ||= "relative";
        card.style.paddingBottom="26px";
        card.classList.add(Number(pct)>=60?"aas-ai":"aas-human");

        const badge=document.createElement("span");
        badge.className="ai-badge";
        badge.textContent=`AI 확률 : ${pct}%`;
        setBadgeStyle(Number(pct),badge);
        card.appendChild(badge);
      });
    } else {
      console.error("[AAS] background 오류",reply?.error);
    }

    loadMsg.style.display = "none";         // ── 로딩 멘트 OFF
    inFlight = false;
  }

  /* 최초 + 변화 감시 */
  setTimeout(annotate, 800);
  const mo=new MutationObserver(()=>annotate());
  mo.observe(searchCont||document.body,{childList:true,subtree:true});
})();