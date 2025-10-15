// DOM 요소들
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const fileName = document.getElementById('fileName');
const fileSubmitButton = document.getElementById('fileSubmitButton');
const textSubmitButton = document.getElementById('textSubmitButton');
const dropZone = document.getElementById('dropZone');
const charCount = document.getElementById('charCount');

// 탭 전환 기능
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');
    
    tabs.forEach(t => {
      const content = document.getElementById(t.getAttribute('data-tab') + 'Tab');
      
      if (t === tab) {
        // 클릭된 탭/콘텐츠
        t.classList.add('active');
        t.classList.remove('inactive');
        content.classList.add('active');
        content.classList.remove('inactive');
      } else {
        // 클릭되지 않은 탭/콘텐츠
        t.classList.remove('active');
        t.classList.add('inactive');
        content.classList.remove('active');
        content.classList.add('inactive');
      }
    });
  });
});

// 파일 선택 시
fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
    fileName.textContent = this.files[0].name;
    fileName.style.display = 'block';
    fileSubmitButton.disabled = false;
    } else {
    fileName.style.display = 'none';
    fileSubmitButton.disabled = true;
    }
});

// 텍스트 입력 시
textInput.addEventListener('input', function() {
    const length = this.value.length;
    const minLength = 200;
    
    if (length >= minLength) {
    charCount.textContent = `${length} / ${minLength}자`;
    charCount.classList.remove('invalid');
    charCount.classList.add('valid');
    textSubmitButton.disabled = false;
    } else {
    charCount.textContent = `${length} / ${minLength}자 (최소 ${minLength}자 필요)`;
    charCount.classList.remove('valid');
    charCount.classList.add('invalid');
    textSubmitButton.disabled = true;
    }
});

// 드래그 앤 드롭 기능
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('drag-over');
}

function unhighlight() {
    dropZone.classList.remove('drag-over');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
    fileInput.files = files;
    fileName.textContent = files[0].name;
    fileName.style.display = 'block';
    fileSubmitButton.disabled = false;
    }
}

// 제출 버튼 클릭 시
fileSubmitButton.addEventListener('click', function () {
  if (fileInput.files.length === 0) return;

  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append('upload', file);  // 백엔드에서 'upload'라는 필드로 받는다고 가정

  fetch('http://localhost:8000/check_file', {
    method: 'POST',
    body: formData,
  })
    .then(response => {
      if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
      return response.json();  // 서버가 JSON 응답할 경우
    })
    .then(data => {
      document.getElementById('result').textContent = data.result;
    })
    .catch(error => {
      console.error('에러 발생:', error);
      document.getElementById('result').textContent = `에러 발생: ${error.message}`;
    });
});


textSubmitButton.addEventListener('click', function () {
  const text = textInput.value;
  if (text.length >= 200) {
    fetch('http://localhost:8000/check_str', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text }),
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById('result').textContent = data.result;
      })
      .catch(error => {
        console.error('에러 발생:', error);
      });
  }
});