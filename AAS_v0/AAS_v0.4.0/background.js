// background.js  – Manifest V3 service-worker
// Adds proxy upload for Google Images (side panel) via /check_file

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 1) Text/link judging (existing)
  if (msg?.type === "CHECK_AI" && Array.isArray(msg.links)) {
    fetch("http://127.0.0.1:8000/check_ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: msg.links }),
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((e) => sendResponse({ ok: false, error: e.toString() }));
    return true; // async reply
  }

  // 2) Image judging for Google Images side panel
  //    contentScript sends {type:"CHECK_IMAGE", src: "https://.../image.jpg"}
  if (msg?.type === "CHECK_IMAGE" && typeof msg.src === "string") {
    (async () => {
      try {
        // Fetch the image with extension privileges (host_permissions)
        const res = await fetch(msg.src, { credentials: "omit" });
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        const blob = await res.blob();

        const fd = new FormData();
        // Pass a filename hint; server uses field name 'upload'
        fd.append("upload", blob, "google_image.jpg");

        const api = await fetch("http://127.0.0.1:8000/check_file", {
          method: "POST",
          body: fd,
        });
        const json = await api.json();
        sendResponse({ ok: true, data: json });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true; // async
  }
});

chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });