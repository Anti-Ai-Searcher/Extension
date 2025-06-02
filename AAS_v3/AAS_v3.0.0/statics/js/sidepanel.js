const fileOption = document.getElementById('fileOption');
const textOption = document.getElementById('textOption');
const fileCard = document.getElementById('fileCard');
const textCard = document.getElementById('textCard');
const fileInput = document.getElementById('fileInput');
const textInput = document.getElementById('textInput');
const fileName = document.getElementById('fileName');
const submitButton = document.getElementById('submitButton');
const dropZone = document.getElementById('dropZone');
const textError = document.getElementById('textError');

// 파일 옵션 선택 시
fileOption.addEventListener('change', function() {
    if (this.checked) {
    activateFileInput();
    }
});

// 텍스트 옵션 선택 시
textOption.addEventListener('change', function() {
    if (this.checked) {
    activateTextInput();
    }
});

// 파일 입력 활성화 함수
function activateFileInput() {
    fileCard.classList.add('active');
    fileCard.classList.remove('disabled');
    textCard.classList.add('disabled');
    textCard.classList.remove('active');
    fileInput.disabled = false;
    textInput.disabled = true;
    textInput.value = '';
    textError.style.display = 'none';
    updateSubmitButton();
}

// 텍스트 입력 활성화 함수
function activateTextInput() {
    textCard.classList.add('active');
    textCard.classList.remove('disabled');
    fileCard.classList.add('disabled');
    fileCard.classList.remove('active');
    textInput.disabled = false;
    fileInput.value = '';
    fileName.textContent = '';
    updateSubmitButton();
}

// 파일 선택 시
fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
    fileName.textContent = this.files[0].name;
    } else {
    fileName.textContent = '';
    }
    updateSubmitButton();
});

// 텍스트 입력 시
textInput.addEventListener('input', function() {
    updateSubmitButton();
});

// 제출 버튼 활성화/비활성화 업데이트
function updateSubmitButton() {
    let isValid = false;

    if (fileOption.checked && fileInput.files.length > 0) {
    isValid = true;
    } else if (textOption.checked) {
    const len = textInput.value.trim().length;
    if (len >= 200) {
        isValid = true;
        textError.style.display = 'none';
    } else {
        textError.style.display = len > 0 ? 'block' : 'none';
        isValid = false;
    }
    } else {
    textError.style.display = 'none';
    }

    submitButton.disabled = !isValid;
}

// 제출 버튼 클릭 시
submitButton.addEventListener('click', function() {
    if (submitButton.disabled) return; // 보호

    if (fileOption.checked && fileInput.files.length > 0) {
    console.log('파일 전송:', fileInput.files[0]);
    // 파일 전송 로직
    } else if (textOption.checked && textInput.value.trim().length >= 200) {
    console.log('텍스트 전송:', textInput.value);
    // 텍스트 전송 로직
    }
});

// 드래그 앤 드롭 기능 구현
// 드래그 이벤트 방지 (기본 동작 차단)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 드래그 효과 하이라이트
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

// 파일 드롭 처리
dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
    // 파일 입력 옵션으로 자동 전환
    fileOption.checked = true;
    activateFileInput();
    
    // 파일 입력에 드롭된 파일 설정
    fileInput.files = files;
    
    // 파일 이름 표시
    fileName.textContent = files[0].name;
    
    // 제출 버튼 상태 업데이트
    updateSubmitButton();
    }
}

// 초기 상태 설정
fileCard.classList.add('active');
updateSubmitButton();