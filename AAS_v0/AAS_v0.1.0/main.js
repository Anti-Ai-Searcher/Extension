// main.js

document.addEventListener('DOMContentLoaded', () => {
    const savedLinksEl = document.getElementById('savedLinks');
    const downloadBtn = document.getElementById('downloadJsonBtn');
  
    // 1) chrome.storage.local에서 searchLinks 불러와 표시
    chrome.storage.local.get(['searchLinks'], (result) => {
      if (result.searchLinks) {
        savedLinksEl.textContent = result.searchLinks;  // JSON 문자열
      } else {
        savedLinksEl.textContent = "저장된 링크가 없습니다.";
      }
    });
  
    // 2) "다운로드" 버튼 클릭 시 JSON 파일로 내려받기
    downloadBtn.addEventListener('click', () => {
      chrome.storage.local.get(['searchLinks'], (result) => {
        if (result.searchLinks) {
          const jsonStr = result.searchLinks;
  
          // Blob 생성
          const blob = new Blob([jsonStr], { type: 'application/json' });
          // 임시 URL 생성
          const url = URL.createObjectURL(blob);
  
          // 가짜 링크를 만들어 클릭 -> 다운로드
          const a = document.createElement('a');
          a.href = url;
          a.download = 'searchLinks.json';
          document.body.appendChild(a);
          a.click();
  
          // 정리
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          alert("저장된 검색결과가 없습니다.");
        }
      });
    });
  });
  