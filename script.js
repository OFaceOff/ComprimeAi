lucide.createIcons();

const htmlElement = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(isDark) {
    if (isDark) {
        htmlElement.classList.add('dark');
        themeIcon.setAttribute('data-lucide', 'sun');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.classList.remove('dark');
        themeIcon.setAttribute('data-lucide', 'moon');
        localStorage.setItem('theme', 'light');
    }
    lucide.createIcons();
}

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

themeToggleBtn.addEventListener('click', () => {
    setTheme(!htmlElement.classList.contains('dark'));
});

let originalFile = null;
let originalImageObj = new Image();
let compressedBlobUrl = null;
let originalBytes = 0;
let compressedBytes = 0;

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const workspace = document.getElementById('workspace');

const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');

const sizeSlider = document.getElementById('size-slider');
const sizeInput = document.getElementById('size-input');
const sizeUnit = document.getElementById('size-unit');
const sliderMaxLabel = document.getElementById('slider-max-label');
const paddingInfo = document.getElementById('padding-info');

const originalSizeEl = document.getElementById('original-size');
const compressedSizeEl = document.getElementById('compressed-size');
const reductionPercentEl = document.getElementById('reduction-percent');

const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

let toastTimeout;
let compressTimeout;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt.files.length > 0) handleFile(dt.files[0]);
}, false);

fileInput.addEventListener('change', function () {
    if (this.files.length > 0) handleFile(this.files[0]);
});

function debouncedCompress() {
    clearTimeout(compressTimeout);
    compressTimeout = setTimeout(() => {
        let val = parseFloat(sizeInput.value) || 0;
        let targetBytes = sizeUnit.value === 'MB' ? Math.floor(val * 1024 * 1024) : Math.floor(val * 1024);
        if (targetBytes < 10240) targetBytes = 10240;
        compressToTarget(targetBytes);
    }, 200);
}

sizeUnit.addEventListener('change', function () {
    let currentKb = parseInt(sizeSlider.value);
    if (this.value === 'MB') {
        sizeInput.value = (currentKb / 1024).toFixed(2);
    } else {
        sizeInput.value = currentKb;
    }
});

sizeSlider.addEventListener('input', function () {
    if (sizeUnit.value === 'MB') {
        sizeInput.value = (this.value / 1024).toFixed(2);
    } else {
        sizeInput.value = this.value;
    }
    debouncedCompress();
});

sizeInput.addEventListener('input', function () {
    let val = parseFloat(this.value);
    if (isNaN(val)) return;

    let valKb = sizeUnit.value === 'MB' ? val * 1024 : val;
    let maxKb = Math.floor(originalBytes / 1024);

    if (valKb > maxKb) {
        valKb = maxKb;
        this.value = sizeUnit.value === 'MB' ? (maxKb / 1024).toFixed(2) : maxKb;
    }
    sizeSlider.value = valKb;
    debouncedCompress();
});

sizeInput.addEventListener('blur', function () {
    let val = parseFloat(this.value);
    let valKb = sizeUnit.value === 'MB' ? val * 1024 : val;
    let minKb = 10;

    if (isNaN(val) || valKb < minKb) {
        valKb = minKb;
        this.value = sizeUnit.value === 'MB' ? (minKb / 1024).toFixed(2) : minKb;
        sizeSlider.value = valKb;
        debouncedCompress();
    }
});

downloadBtn.addEventListener('click', () => {
    if (!compressedBlobUrl) return;
    const link = document.createElement('a');

    const nameParts = originalFile.name.split('.');
    nameParts.pop();
    const newName = nameParts.join('.') + '_comprimida.jpg';

    link.download = newName;
    link.href = compressedBlobUrl;
    link.click();
});

resetBtn.addEventListener('click', () => {
    originalFile = null;
    if (compressedBlobUrl) {
        URL.revokeObjectURL(compressedBlobUrl);
        compressedBlobUrl = null;
    }
    fileInput.value = '';

    workspace.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    paddingInfo.classList.add('hidden');
});

function handleFile(file) {
    if (!file.type.match('image.*')) {
        showToast('Por favor, selecione apenas arquivos de imagem (JPG, PNG ou WEBP).');
        return;
    }

    originalFile = file;
    originalBytes = file.size;
    originalSizeEl.textContent = formatBytes(originalBytes);

    let maxKb = Math.floor(originalBytes / 1024);
    sizeSlider.max = maxKb;
    sliderMaxLabel.textContent = formatBytes(originalBytes);

    let defaultKb = Math.floor(maxKb * 0.8);
    if (defaultKb > 2048) defaultKb = 2048;
    if (maxKb < defaultKb) defaultKb = maxKb;

    sizeSlider.value = defaultKb;
    sizeInput.value = sizeUnit.value === 'MB' ? (defaultKb / 1024).toFixed(2) : defaultKb;

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImageObj.src = e.target.result;
        originalImageObj.onload = () => {
            originalPreview.src = originalImageObj.src;
            uploadArea.classList.add('hidden');
            workspace.classList.remove('hidden');

            if (window.innerWidth < 1024) {
                setTimeout(() => workspace.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }

            compressToTarget(defaultKb * 1024);
        };
    };
    reader.readAsDataURL(file);
}

function compressToTarget(targetBytes) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = originalImageObj.width;
    canvas.height = originalImageObj.height;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageObj, 0, 0, canvas.width, canvas.height);

    let minQ = 0.0;
    let maxQ = 1.0;
    let bestData = canvas.toDataURL('image/jpeg', 1.0);
    let bestDiff = Infinity;
    let maxDataSize = calculateBase64Size(bestData);

    if (targetBytes < maxDataSize) {
        for (let i = 0; i < 8; i++) {
            let q = (minQ + maxQ) / 2;
            let data = canvas.toDataURL('image/jpeg', q);
            let size = calculateBase64Size(data);
            let diff = Math.abs(size - targetBytes);

            if (diff < bestDiff) {
                bestDiff = diff;
                bestData = data;
            }

            if (size > targetBytes) {
                maxQ = q;
            } else {
                minQ = q;
            }
        }
    }

    let finalBlob;

    if (targetBytes > maxDataSize && targetBytes <= originalBytes) {
        finalBlob = base64ToPaddedBlob(bestData, targetBytes);
        paddingInfo.classList.remove('hidden');
    } else {
        finalBlob = base64ToBlob(bestData);
        paddingInfo.classList.add('hidden');
    }

    compressedBytes = finalBlob.size;

    if (compressedBlobUrl) {
        URL.revokeObjectURL(compressedBlobUrl);
    }
    compressedBlobUrl = URL.createObjectURL(finalBlob);

    compressedPreview.src = compressedBlobUrl;
    compressedSizeEl.textContent = formatBytes(compressedBytes);

    if (originalBytes > 0) {
        const reduction = ((originalBytes - compressedBytes) / originalBytes) * 100;
        if (reduction > 0.1) {
            reductionPercentEl.textContent = `Reduzido em ${reduction.toFixed(1)}%`;
            reductionPercentEl.className = "text-xs font-bold text-green-600 dark:text-green-400 text-right";
        } else if (reduction < -0.1) {
            reductionPercentEl.textContent = `Aumentou ${Math.abs(reduction).toFixed(1)}%`;
            reductionPercentEl.className = "text-xs font-bold text-red-500 text-right";
        } else {
            reductionPercentEl.textContent = `Mesmo tamanho`;
            reductionPercentEl.className = "text-xs font-bold text-gray-500 text-right";
        }
    }
}

function calculateBase64Size(dataUrl) {
    const base64str = dataUrl.split(',')[1];
    const padding = (base64str.match(/=/g) || []).length;
    return Math.floor((base64str.length * 3 / 4) - padding);
}

function base64ToPaddedBlob(dataUrl, targetBytes) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);

    let targetLen = Math.max(bstr.length, targetBytes);
    const u8arr = new Uint8Array(targetLen);

    for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
}

function base64ToBlob(dataUrl) {
    return base64ToPaddedBlob(dataUrl, 0);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showComingSoon(type) {
    const alertBox = document.getElementById('coming-soon-alert');
    const typeSpan = document.getElementById('coming-soon-type');
    typeSpan.textContent = type;
    alertBox.classList.remove('hidden');
}

function closeComingSoon() {
    const alertBox = document.getElementById('coming-soon-alert');
    alertBox.classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');

    toastMsg.textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 4000);
}

function openAboutModal() {
    const modal = document.getElementById('about-modal');
    const content = document.getElementById('about-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    const content = document.getElementById('about-modal-content');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}