const defaultSettings = {
        aiJudge: 60,
    };

// Load settings from Chrome storage
function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(defaultSettings, (settings) => {
            applySettings(settings);
        });
    } else {
        // Fallback for testing without Chrome extension
        const saved = localStorage.getItem('extensionSettings');
        const settings = saved ? JSON.parse(saved) : defaultSettings;
        applySettings(settings);
    }
}

// Apply settings to UI
function applySettings(settings) {
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else if (element.type === 'number') {
                element.value = settings[key];
            }
        }
    });
}

// Get current settings from UI
function getCurrentSettings() {
    const settings = {};
    
    // Get number values
    ['aiJudge'].forEach(id => {
        const element = document.getElementById(id);
        settings[id] = parseInt(element.value) || defaultSettings[id];
    });

    return settings;
}

// Save settings
function saveSettings() {
    const settings = getCurrentSettings();
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(settings, () => {
            showToast('Settings saved successfully!');
        });
    } else {
        // Fallback for testing
        localStorage.setItem('extensionSettings', JSON.stringify(settings));
        showToast('Settings saved successfully!');
    }
}

// Reset to defaults
function resetSettings() {
    applySettings(defaultSettings);
    showToast('Settings reset to defaults!');
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
});

// 문서의 모든 HTML 요소가 로드된 후 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', function() {
    // Chrome Extension API를 사용해 manifest.json 파일의 정보를 객체 형태로 가져옵니다.
    const manifest = chrome.runtime.getManifest();
    
    // manifest 객체에서 'version' 키의 값을 가져옵니다.
    const version = manifest.version;
    
    // HTML에서 id가 'version-display'인 요소를 찾습니다.
    const versionElement = document.getElementById('version-display');
    
    // 찾은 요소의 텍스트 내용을 'AAS v[버전]' 형식으로 설정합니다.
    if (versionElement) {
        versionElement.textContent = `AAS v${version}`;
    }
});