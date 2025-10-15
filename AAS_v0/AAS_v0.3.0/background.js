// background.js  – Manifest V3 service-worker

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // contentScript sends {type:"CHECK_AI", links:[…]}
    if (msg?.type !== "CHECK_AI" || !Array.isArray(msg.links)) return;
  
    fetch("http://127.0.0.1:8000/check_ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: msg.links }),
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: e.toString() }));
  
    // “비동기 응답”을 알리기 위해 true 반환
    return true;
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })