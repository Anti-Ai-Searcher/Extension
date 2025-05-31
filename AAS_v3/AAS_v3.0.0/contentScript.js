// == Anti-AI-Searcher : contentScript (final with error handling) ==
(function () {
  if (window.__aasInjected) return;
  window.__aasInjected = true;

  /* 1. CSS */
  const st = document.createElement("style");
  st.textContent = `
    .aas-tabbar{display:flex;width:100%;border:1px solid #dadce0;border-radius:4px;
      overflow:hidden;margin:12px 0;font-family:Arial,Helvetica,sans-serif}
    .aas-tab{flex:1;padding:8px 0;background:#f1f3f4;color:#555;text-align:center;
      font-size:14px;font-weight:500;cursor:pointer;border-right:1px solid #dadce0}
    .aas-tab:last-child{border-right:none}.aas-tab.active{background:#fff;color:#1a73e8;font-weight:600}
    .aas-loading{margin:8px 0;font-size:14px;color:#555;font-family:Arial,Helvetica,sans-serif}
    body.aas-show-human .aas-card.aas-ai{display:none!important}
    body.aas-show-ai    .aas-card.aas-human{display:none!important}
    .ai-badge{position:absolute;right:8px;bottom:8px;padding:2px 6px;border-radius:4px;
      font-size:12px;font-weight:600;z-index:50}
  `;
  document.head.appendChild(st);

  /* 2. 탭 & 로딩 */
  const bar = document.createElement("div");
  bar.className = "aas-tabbar";

  const tT = Object.assign(document.createElement("div"), {className:"aas-tab active",textContent:"전체"})
  const tH = Object.assign(document.createElement("div"), {className:"aas-tab",textContent:"Human Links"});
  const tA = Object.assign(document.createElement("div"), {className:"aas-tab",textContent:"AI Links"});
  bar.append(tT,tH,tA);

  const loading = Object.assign(document.createElement("div"),{className:"aas-loading",textContent:"검색 결과를 분석 중입니다..."});
  loading.style.display="none";

  const search = document.getElementById("search");
  const parent = search?.parentElement||document.body;
  parent.insertBefore(loading, search);
  parent.insertBefore(bar, search);
  function activateTab(tab) {
    tT.classList.remove("active");
    tH.classList.remove("active");
    tA.classList.remove("active");
    tab.classList.add("active");
    document.body.classList.remove("aas-show-human", "aas-show-ai");
    if (tab === tT) {
      document.body.classList.add("aas-show-human");
      document.body.classList.add("aas-show-ai");
    } else if (tab === tH) {
      document.body.classList.add("aas-show-human");
    } else if (tab === tA) {
      document.body.classList.add("aas-show-ai");
    }
  }
  
  document.body.classList.add("aas-show-human");
  tT.onclick=()=>{activateTab(tT);};
  tH.onclick=()=>{activateTab(tH);};
  tA.onclick=()=>{activateTab(tA);};

  /* 3. 색상 함수 */
  function styleProb(prob, el){
    if(prob<=20){el.style.background="green";el.style.color="#000";}
    else if(prob<=40){el.style.background="#85cc00";el.style.color="#000";}
    else if(prob<=60){el.style.background="yellow";el.style.color="#000";}
    else if(prob<=80){el.style.background="orange";el.style.color="#000";}
    else{el.style.background="red";el.style.color="#fff";}
  }
  function styleError(el){
    el.style.background="#888";el.style.color="#fff";
  }

  /* 4. 카드 수집 */
  function collect(){
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

  /* 5. BG 메시지 */
  const bg=(links)=>new Promise(res=>{
    chrome.runtime.sendMessage({type:"CHECK_AI",links},r=>res(r));
  });

  /* 6. annotate */
  let busy=false;
  async function annotate(){
    if(busy) return;
    const batch=collect(); if(!batch.length) return;
    busy=true; loading.style.display="block";

    const uniq=[...new Set(batch.map(i=>i.url))];
    const rep=await bg(uniq).catch(e=>({ok:false,error:e}));
    if(!(rep?.ok&&rep.data?.results)){console.error("[AAS] bg fail",rep);busy=false;loading.style.display="none";return;}

    const probMap={}, errMap={};
    rep.data.results.forEach(r=>{
      if(typeof r.ai_probability==="number")
        probMap[r.url]=(r.ai_probability*100).toFixed(2);
      else
        errMap[r.url]=r.ai_probability;   // "크롤링 실패" 등
    });

    const errCards=[];
    batch.forEach(({card,url})=>{
      let badge=document.createElement("span");
      badge.className="ai-badge";
      card.style.position ||= "relative";
      card.style.paddingBottom="26px";

      if(url in probMap){
        const pct=probMap[url];
        badge.textContent=`AI 확률 : ${pct}%`;
        styleProb(Number(pct),badge);
        card.classList.add(Number(pct)>=60?"aas-ai":"aas-human");
      }else{
        const msg=errMap[url]||"오류";
        badge.textContent=msg;
        styleError(badge);
        card.classList.add("aas-error");
        errCards.push(card);
      }
      card.appendChild(badge);
    });

    loading.style.display="none";
    busy=false;
  }

  /* 8. 초기 + Mutation */
  setTimeout(annotate,800);
  new MutationObserver(()=>annotate()).observe(search||document.body,{childList:true,subtree:true});
})();