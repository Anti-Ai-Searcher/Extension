// 저장된 값 불러오기
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['apiKey'], (result) => {
    document.getElementById('apiKeyInput').value = result.apiKey || '';
  });
});

// 저장 버튼 클릭 시 값 저장
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;
  chrome.storage.sync.set({ apiKey }, () => {
    alert('API Key saved!');
  });
});
