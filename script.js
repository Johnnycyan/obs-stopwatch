// script.js
let startTime;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let saveTimerDataInterval = 0;

// Countdown / Timer mode state
let timerMode = 'stopwatch'; // 'stopwatch' or 'timer'
let countdownDuration = 0;   // ms
let allowNegative = false;
let playAlert = false;
let alertSoundUrl = '';
let alertPlayed = false;
let fontWeight = '400';
let textColor = '#ffffff';
let staticGlowEnabled = false;
let staticGlowOpacity = 3;
let staticGlowColor = '#ffffff';

const stopwatch = document.getElementById('stopwatch');
const stopwatchGlow = document.getElementById('stopwatch-glow');
const startStopButton = document.getElementById('startStop');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const resetButton = document.getElementById('reset');
const settingsBtn = document.getElementById('settingsBtn');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const googleFontsImportInput = document.getElementById('googleFontsImport');
const fontNameInput = document.getElementById('fontName');
const fontWeightInput = document.getElementById('fontWeight');
const fontWeightValue = document.getElementById('fontWeightValue');
const setTimeLabel = document.getElementById('setTimeLabel');
const obsWsEnabledCheckbox = document.getElementById('obsWsEnabled');
const obsWsHostInput = document.getElementById('obsWsHost');
const obsWsPortInput = document.getElementById('obsWsPort');
const obsWsPasswordInput = document.getElementById('obsWsPassword');
const obsWsRealmInput = document.getElementById('obsWsRealm');
const obsWsStatus = document.getElementById('obsWsStatus');
const obsWsConnectButton = document.getElementById('obsWsConnect');
const animGradientCheckbox = document.getElementById('animGradient');
const gradientColor1Input = document.getElementById('gradientColor1');
const gradientColor2Input = document.getElementById('gradientColor2');
const gradientSpeedInput = document.getElementById('gradientSpeed');
const gradientGlowInput = document.getElementById('gradientGlow');

// Countdown settings elements
const countdownHoursInput = document.getElementById('countdownHours');
const countdownMinutesInput = document.getElementById('countdownMinutes');
const countdownSecondsInput = document.getElementById('countdownSeconds');
const allowNegativeCheckbox = document.getElementById('allowNegative');
const playAlertCheckbox = document.getElementById('playAlert');
const alertSoundUrlInput = document.getElementById('alertSoundUrl');
const countdownSettings = document.getElementById('countdownSettings');
const alertUrlRow = document.getElementById('alertUrlRow');
const timerModeRadios = document.querySelectorAll('input[name="timerMode"]');

// Modal elements
const settingsModal = document.getElementById('settings-modal');
const settingsBackdrop = document.getElementById('settings-backdrop');
const saveSettingsButton = document.getElementById('saveSettingsBtn');
const cancelSettingsButton = document.getElementById('cancelSettingsBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

const exportModal = document.getElementById('export-modal');
const exportBackdrop = document.getElementById('export-backdrop');
const exportTextarea = document.getElementById('exportTextarea');
const copyExportBtn = document.getElementById('copyExportBtn');
const closeExportBtn = document.getElementById('closeExportBtn');

const importModal = document.getElementById('import-modal');
const importBackdrop = document.getElementById('import-backdrop');
const importTextarea = document.getElementById('importTextarea');
const submitImportBtn = document.getElementById('submitImportBtn');
const closeImportBtn = document.getElementById('closeImportBtn');

// Custom Alert
const alertModal = document.getElementById('alert-modal');
const alertMessage = document.getElementById('alertMessage');
const closeAlertBtn = document.getElementById('closeAlertBtn');

function customAlert(message) {
    alertMessage.textContent = message;
    alertModal.style.display = 'block';
}

closeAlertBtn.addEventListener('click', function () {
    alertModal.style.display = 'none';
});

// Reset confirmation
const resetModal = document.getElementById('reset-modal');
const resetConfirm = document.getElementById('reset-confirm');
const resetConfirmBackdrop = document.getElementById('reset-confirm-backdrop');
const resetYes = document.getElementById('resetYes');
const resetNo = document.getElementById('resetNo');

// Text color / static glow
const textColorInput = document.getElementById('textColor');
const textColorPreview = document.getElementById('textColorPreview');
const staticGlowCheckbox = document.getElementById('staticGlow');
const staticGlowOpacityInput = document.getElementById('staticGlowOpacity');
const staticGlowSettings = document.getElementById('staticGlowSettings');
const staticGlowColorInput = document.getElementById('staticGlowColor');
const staticGlowColorPreview = document.getElementById('staticGlowColorPreview');
const gradientColor1Preview = document.getElementById('gradientColor1Preview');
const gradientColor2Preview = document.getElementById('gradientColor2Preview');

// Audio
const alertAudio = document.getElementById('alertAudio');

let obsSocket = null;
let obsHandshakeTimer = null;
let obsConnected = false;
let obsLastClose = null;
let sha256FallbackReady = false;
let gradientAnimationId = null;

const OBS_EVENT_SUBSCRIPTIONS_GENERAL = 0x00000001;

// ─── Format Time ───
function formatTime(time) {
    if (time === undefined || time === null || Number.isNaN(time)) {
        time = 0;
    }
    const negative = time < 0;
    const abs = Math.abs(time);
    const hours = Math.floor(abs / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((abs % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((abs % 60000) / 1000).toString().padStart(2, '0');
    return `${negative ? '-' : ''}${hours}:${minutes}:${seconds}`;
}

// ─── Timer Core ───
function startTimer() {
    if (isRunning) return;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 10);
    isRunning = true;
    updatePlayPauseIcon();
    saveTimerDataInterval = setInterval(saveTimerDataOngoing, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    if (startTime !== undefined) {
        elapsedTime += Date.now() - startTime;
    }
    startTime = undefined;
    isRunning = false;
    updatePlayPauseIcon();
    setTimeInputs();
    clearInterval(saveTimerDataInterval);
    saveTimerData();
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    alertPlayed = false;
    if (timerMode === 'timer') {
        const formatted = formatTime(countdownDuration);
        stopwatch.textContent = formatted;
        stopwatchGlow.textContent = formatted;
    } else {
        stopwatch.textContent = '00:00:00';
        stopwatchGlow.textContent = '00:00:00';
    }
    setTimeInputs();
    saveTimerData();
}

function updateTimer() {
    const currentTime = Date.now();
    const timeElapsed = currentTime - startTime + elapsedTime;

    if (timerMode === 'timer') {
        let remaining = countdownDuration - timeElapsed;
        // Clamp to 0 if negative not allowed
        if (remaining <= 0 && !allowNegative) {
            remaining = 0;
            const formatted = formatTime(0);
            stopwatch.textContent = formatted;
            stopwatchGlow.textContent = formatted;
            // Play alert at zero
            if (playAlert && !alertPlayed) {
                alertPlayed = true;
                playAlertSound();
            }
            stopTimer();
            return;
        }
        // Play alert when crossing zero (allow negative case)
        if (remaining <= 0 && playAlert && !alertPlayed) {
            alertPlayed = true;
            playAlertSound();
        }
        const formatted = formatTime(remaining);
        stopwatch.textContent = formatted;
        stopwatchGlow.textContent = formatted;
    } else {
        const formatted = formatTime(timeElapsed);
        stopwatch.textContent = formatted;
        stopwatchGlow.textContent = formatted;
    }
}

function playAlertSound() {
    try {
        const url = alertSoundUrl || 'alert.mp3';
        alertAudio.src = url;
        alertAudio.currentTime = 0;
        alertAudio.play().catch(() => { /* ignore autoplay block */ });
    } catch (e) { /* ignore */ }
}

function updatePlayPauseIcon() {
    if (isRunning) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = '';
    } else {
        playIcon.style.display = '';
        pauseIcon.style.display = 'none';
    }
}

// ─── Time Inputs ───
function setTimeInputs() {
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    hoursInput.value = hours.toString().padStart(2, '0');
    minutesInput.value = minutes.toString().padStart(2, '0');
    secondsInput.value = seconds.toString().padStart(2, '0');
}

function getTimeValue(input) {
    return input.value ? parseInt(input.value) : 0;
}

function updateElapsedTime() {
    const hours = getTimeValue(hoursInput);
    const minutes = getTimeValue(minutesInput);
    const seconds = getTimeValue(secondsInput);
    elapsedTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
    const display = timerMode === 'timer' ? countdownDuration - elapsedTime : elapsedTime;
    const formatted = formatTime(timerMode === 'timer' ? display : elapsedTime);
    stopwatch.textContent = formatted;
    stopwatchGlow.textContent = formatted;
}

// ─── Font Helpers ───
function extractGoogleFontName(input) {
    const url = input.value;
    const regex = /https?:\/\/fonts\.googleapis\.com\/css2\?family=([^&:]+)/;
    const match = url.match(regex);
    if (match) {
        return match[1].replace(/\+/g, ' ');
    }
    return '';
}

function extractGoogleFontUrl(input) {
    const rawValue = input.value;
    const regex = /https?:\/\/fonts\.googleapis\.com\/css2\?[^'"\)\s]+/;
    const match = rawValue.match(regex);
    if (match) {
        return match[0];
    }
    return '';
}

// ─── Hover Overlay Buttons ───
startStopButton.addEventListener('click', function () {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
    saveTimerData();
});

resetButton.addEventListener('click', function () {
    resetModal.style.display = 'block';
});

document.getElementById('resetTimeBtn').addEventListener('click', function () {
    hoursInput.value = '00';
    minutesInput.value = '00';
    secondsInput.value = '00';
});

resetYes.addEventListener('click', function () {
    resetModal.style.display = 'none';
    resetTimer();
});

resetNo.addEventListener('click', function () {
    resetModal.style.display = 'none';
});

// ─── Settings Modal ───
settingsBtn.addEventListener('click', openSettings);
cancelSettingsButton.addEventListener('click', closeSettings);
settingsBackdrop.addEventListener('click', closeSettings);
saveSettingsButton.addEventListener('click', saveSettingsFromModal);

function openSettings() {
    // Populate modal fields from current state
    populateSettingsModal();
    settingsModal.style.display = 'block';
}

function closeSettings() {
    // Reset all sections to collapsed so no stale max-height on reopen
    document.querySelectorAll('.settings-section.expanded').forEach(section => {
        section.classList.remove('expanded');
        const body = section.querySelector('.section-body');
        if (body) {
            body.style.maxHeight = '0px';
            body.style.marginBottom = '0px';
        }
    });
    settingsModal.style.display = 'none';
}

function populateSettingsModal() {
    // Timer mode
    timerModeRadios.forEach(r => {
        r.checked = (r.value === timerMode);
    });
    updateCountdownVisibility();
    updateSetTimeLabel();

    // Countdown duration
    const cdH = Math.floor(countdownDuration / 3600000);
    const cdM = Math.floor((countdownDuration % 3600000) / 60000);
    const cdS = Math.floor((countdownDuration % 60000) / 1000);
    countdownHoursInput.value = cdH.toString().padStart(2, '0');
    countdownMinutesInput.value = cdM.toString().padStart(2, '0');
    countdownSecondsInput.value = cdS.toString().padStart(2, '0');

    allowNegativeCheckbox.checked = allowNegative;
    playAlertCheckbox.checked = playAlert;
    alertSoundUrlInput.value = alertSoundUrl;
    updateAlertUrlVisibility();

    // Set time
    setTimeInputs();

    // Text
    const fontLink = document.getElementById('fontLink');
    // googleFontsImportInput / fontNameInput already have values from state
    fontWeightInput.value = fontWeight;
    fontWeightValue.textContent = fontWeight;
    textColorInput.value = textColor;
    textColorPreview.style.background = textColor;
    staticGlowCheckbox.checked = staticGlowEnabled;
    staticGlowOpacityInput.value = staticGlowOpacity;
    staticGlowValue.textContent = staticGlowOpacity;
    toggleSubSetting(staticGlowSettings, staticGlowEnabled);
    staticGlowColorInput.value = staticGlowColor;
    staticGlowColorPreview.style.background = staticGlowColor;

    // Gradient — disable text color/glow if gradient is on
    updateTextInputsDisabledState();
    gradientColor1Preview.style.background = gradientColor1Input.value;
    gradientColor2Preview.style.background = gradientColor2Input.value;

    // OBS
    // Already has values from state
}

function saveSettingsFromModal() {
    // Read timer mode
    timerModeRadios.forEach(r => {
        if (r.checked) timerMode = r.value;
    });

    // Read countdown duration
    const cdH = getTimeValue(countdownHoursInput);
    const cdM = getTimeValue(countdownMinutesInput);
    const cdS = getTimeValue(countdownSecondsInput);
    countdownDuration = (cdH * 3600 + cdM * 60 + cdS) * 1000;

    allowNegative = allowNegativeCheckbox.checked;
    playAlert = playAlertCheckbox.checked;
    alertSoundUrl = alertSoundUrlInput.value.trim();

    // Set time
    updateElapsedTime();

    // Clamp: if in timer mode and negative not allowed, don't let elapsed exceed countdown
    if (timerMode === 'timer' && !allowNegative) {
        if (elapsedTime > countdownDuration) {
            elapsedTime = countdownDuration;
            setTimeInputs();
        }
    }

    // Font
    const extractedUrl = extractGoogleFontUrl(googleFontsImportInput);
    if (extractedUrl && extractedUrl !== googleFontsImportInput.value) {
        googleFontsImportInput.value = extractedUrl;
    }
    const fontLink = document.getElementById('fontLink');
    fontLink.href = googleFontsImportInput.value;
    if (googleFontsImportInput.value) {
        const autoName = extractGoogleFontName(googleFontsImportInput);
        if (autoName && !fontNameInput.value) {
            fontNameInput.value = autoName;
        }
    }
    document.body.style.fontFamily = fontNameInput.value || 'Arial, sans-serif';
    fontWeight = fontWeightInput.value;
    document.body.style.fontWeight = fontWeight;
    textColor = textColorInput.value;
    staticGlowEnabled = staticGlowCheckbox.checked;
    staticGlowOpacity = parseInt(staticGlowOpacityInput.value) || 3;
    staticGlowColor = staticGlowColorInput.value;

    // Gradient
    if (animGradientCheckbox.checked) {
        startGradientAnimation();
    } else {
        stopGradientAnimation();
        applyTextAppearance();
    }

    // OBS
    if (obsWsEnabledCheckbox.checked && !obsConnected) {
        connectObs();
    } else if (!obsWsEnabledCheckbox.checked && obsConnected) {
        disconnectObs('Disabled');
    }

    alertPlayed = false;

    saveTimerData();
    closeSettings();

    // Refresh display
    if (!isRunning) {
        if (timerMode === 'timer') {
            const display = countdownDuration - elapsedTime;
            const formatted = formatTime(display);
            stopwatch.textContent = formatted;
            stopwatchGlow.textContent = formatted;
        } else {
            const formatted = formatTime(elapsedTime);
            stopwatch.textContent = formatted;
            stopwatchGlow.textContent = formatted;
        }
    }
}

// ─── Collapsible Sections ───
document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function () {
        const section = this.closest('.settings-section');
        const body = section.querySelector('.section-body');

        if (section.classList.contains('expanded')) {
            // Collapse: set max-height to current scrollHeight first, then to 0
            body.style.maxHeight = body.scrollHeight + 'px';
            body.style.marginBottom = '14px';
            // Force reflow so the browser registers the current max-height
            body.offsetHeight;
            body.style.maxHeight = '0px';
            body.style.marginBottom = '0px';
            section.classList.remove('expanded');
        } else {
            // Expand: set max-height to scrollHeight
            section.classList.add('expanded');
            body.style.maxHeight = body.scrollHeight + 'px';
            body.style.marginBottom = '14px';
            // After transition, keep max-height at final scrollHeight
            const onEnd = (e) => {
                if (e.propertyName !== 'max-height') return;
                if (section.classList.contains('expanded')) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                    body.style.marginBottom = '14px';
                }
                body.removeEventListener('transitionend', onEnd);
            };
            body.addEventListener('transitionend', onEnd);
        }
    });
});

// ─── Timer Mode Radio Toggle ───
timerModeRadios.forEach(r => {
    r.addEventListener('change', function () {
        updateCountdownVisibility();
        updateSetTimeLabel();
    });
});

function updateSetTimeLabel() {
    const selected = document.querySelector('input[name="timerMode"]:checked');
    setTimeLabel.textContent = (selected && selected.value === 'timer') ? 'Set Time Elapsed' : 'Set Time';
}

function updateCountdownVisibility() {
    const selected = document.querySelector('input[name="timerMode"]:checked');
    const show = selected && selected.value === 'timer';
    toggleSubSetting(countdownSettings, show);
}

playAlertCheckbox.addEventListener('change', updateAlertUrlVisibility);

function updateAlertUrlVisibility() {
    toggleSubSetting(alertUrlRow, playAlertCheckbox.checked);
}

// Toggle a sub-setting's visibility and recalculate the parent section-body
function toggleSubSetting(el, show) {
    const displayType = el.classList.contains('setting-row') ? 'flex' : 'block';
    const body = el.closest('.section-body');
    const section = body ? body.closest('.settings-section') : null;
    const isExpanded = section && section.classList.contains('expanded');

    if (show) {
        el.style.display = displayType;
        // If section is open, grow to fit
        if (body && isExpanded) {
            body.style.maxHeight = body.scrollHeight + 'px';
        }
    } else {
        if (body && isExpanded) {
            // Measure before hiding
            const childHeight = el.offsetHeight;
            const style = getComputedStyle(el);
            const margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
            const currentHeight = body.scrollHeight;
            // Lock, hide, animate
            body.style.maxHeight = currentHeight + 'px';
            body.offsetHeight;
            setTimeout(() => { el.style.display = 'none'; }, 350);
            body.style.maxHeight = (currentHeight - childHeight - margin) + 'px';
        } else {
            // Section not expanded — just set display for when it opens later
            el.style.display = 'none';
        }
    }
}

// ─── Font Weight Slider ───
fontWeightInput.addEventListener('input', function () {
    fontWeightValue.textContent = this.value;
});

// ─── Text Color Preview ───
textColorInput.addEventListener('input', function () {
    const val = this.value.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
        textColorPreview.style.background = val;
    }
});

// ─── Static Glow Toggle / Slider ───
staticGlowCheckbox.addEventListener('change', function () {
    toggleSubSetting(staticGlowSettings, this.checked);
});

staticGlowOpacityInput.addEventListener('input', function () {
    staticGlowValue.textContent = this.value;
});

// ─── Disable text color/glow when animated gradient is on ───
animGradientCheckbox.addEventListener('change', updateTextInputsDisabledState);

function updateTextInputsDisabledState() {
    const gradientOn = animGradientCheckbox.checked;
    textColorInput.disabled = gradientOn;
    staticGlowCheckbox.disabled = gradientOn;
    staticGlowOpacityInput.disabled = gradientOn;
    staticGlowColorInput.disabled = gradientOn;
}

// ─── Color Preview Listeners ───
function addColorPreviewListener(input, preview) {
    input.addEventListener('input', function () {
        const val = this.value.trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
            preview.style.background = val;
        }
    });
}
addColorPreviewListener(staticGlowColorInput, staticGlowColorPreview);
addColorPreviewListener(gradientColor1Input, gradientColor1Preview);
addColorPreviewListener(gradientColor2Input, gradientColor2Preview);

// ─── Google Fonts live update in modal ───
googleFontsImportInput.addEventListener('input', function () {
    const extractedUrl = extractGoogleFontUrl(googleFontsImportInput);
    if (extractedUrl && extractedUrl !== googleFontsImportInput.value) {
        googleFontsImportInput.value = extractedUrl;
    }
    const name = extractGoogleFontName(googleFontsImportInput);
    if (name) {
        fontNameInput.value = name;
    }
});

// ─── Export / Import ───
exportBtn.addEventListener('click', function () {
    const data = buildSaveData();
    const jsonStr = JSON.stringify(data, null, 2);
    exportTextarea.value = jsonStr;
    exportModal.style.display = 'block';
});

closeExportBtn.addEventListener('click', function () {
    exportModal.style.display = 'none';
});

exportBackdrop.addEventListener('click', function () {
    exportModal.style.display = 'none';
});

copyExportBtn.addEventListener('click', function () {
    exportTextarea.select();
    exportTextarea.setSelectionRange(0, 99999);
});

importBtn.addEventListener('click', function () {
    importTextarea.value = '';
    importModal.style.display = 'block';
});

closeImportBtn.addEventListener('click', function () {
    importModal.style.display = 'none';
});

importBackdrop.addEventListener('click', function () {
    importModal.style.display = 'none';
});

submitImportBtn.addEventListener('click', function () {
    const text = importTextarea.value.trim();
    if (!text) {
        customAlert('Please paste settings JSON first.');
        return;
    }
    try {
        const data = JSON.parse(text);
        if (data.obs_stopwatch_settings !== true) {
            customAlert('Data does not contain valid obs-stopwatch settings.');
            return;
        }
        applyLoadedData(data);
        saveTimerData();
        populateSettingsModal();
        importModal.style.display = 'none';
        customAlert('Settings imported successfully!');
    } catch (err) {
        customAlert('Input data is not valid JSON.');
    }
});

// ─── OBS Connect Button ───
obsWsConnectButton.addEventListener('click', function () {
    if (!obsWsEnabledCheckbox.checked) {
        obsWsEnabledCheckbox.checked = true;
    }
    connectObs();
});

// ─── Animated Gradient ───
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

function startGradientAnimation() {
    if (gradientAnimationId) {
        cancelAnimationFrame(gradientAnimationId);
    }

    const color1 = hexToRgb(gradientColor1Input.value);
    const color2 = hexToRgb(gradientColor2Input.value);
    const duration = (parseInt(gradientSpeedInput.value) || 10) * 1000;
    const glowOpacity = (parseInt(gradientGlowInput.value) || 2) / 10;
    const animStartTime = Date.now();

    function lerp(a, b, t) {
        return Math.round(a + (b - a) * t);
    }

    function getColor(start, end, t) {
        return {
            r: lerp(start.r, end.r, t),
            g: lerp(start.g, end.g, t),
            b: lerp(start.b, end.b, t)
        };
    }

    function animate() {
        if (!animGradientCheckbox.checked) {
            return;
        }

        const elapsed = (Date.now() - animStartTime) % duration;
        const progress = elapsed / duration;
        const t = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

        const c1 = getColor(color1, color2, t);
        const c2 = getColor(color2, color1, t);

        const gradient = `linear-gradient(215deg, rgb(${c1.r},${c1.g},${c1.b}), rgb(${c2.r},${c2.g},${c2.b}))`;

        const glowColor1 = `rgba(${c1.r},${c1.g},${c1.b},${glowOpacity})`;
        const glowColor2 = `rgba(${c2.r},${c2.g},${c2.b},${glowOpacity})`;
        const midColor = getColor(c1, c2, 0.5);
        const glowColorMid = `rgba(${midColor.r},${midColor.g},${midColor.b},${glowOpacity * 0.7})`;

        stopwatch.style.background = gradient;
        stopwatch.style.webkitBackgroundClip = 'text';
        stopwatch.style.webkitTextFillColor = 'transparent';
        stopwatch.style.backgroundClip = 'text';
        stopwatch.style.textShadow = 'none';

        if (glowOpacity > 0) {
            stopwatchGlow.style.color = 'transparent';
            stopwatchGlow.style.textShadow = `
                20px -10px 40px ${glowColor1},
                10px -5px 25px ${glowColor1},
                -20px 10px 40px ${glowColor2},
                -10px 5px 25px ${glowColor2},
                30px 0px 60px ${glowColor1},
                -30px 0px 60px ${glowColor2},
                0 0 50px ${glowColorMid},
                0 0 100px ${glowColorMid}
            `;
        } else {
            stopwatchGlow.style.textShadow = 'none';
        }

        gradientAnimationId = requestAnimationFrame(animate);
    }

    animate();
}

function stopGradientAnimation() {
    if (gradientAnimationId) {
        cancelAnimationFrame(gradientAnimationId);
        gradientAnimationId = null;
    }
    stopwatch.style.background = '';
    stopwatch.style.webkitBackgroundClip = '';
    stopwatch.style.webkitTextFillColor = '';
    stopwatch.style.backgroundClip = '';
    stopwatch.style.textShadow = '';
    stopwatchGlow.style.textShadow = '';
    stopwatchGlow.style.color = '';
}

// ─── OBS WebSocket ───
function setObsStatus(text, color) {
    obsWsStatus.textContent = text;
    obsWsStatus.style.backgroundColor = color;
}

function clearObsTimers() {
    if (obsHandshakeTimer) {
        clearTimeout(obsHandshakeTimer);
        obsHandshakeTimer = null;
    }
}

function disconnectObs(reasonText = 'Disconnected') {
    obsConnected = false;
    obsLastClose = reasonText;
    clearObsTimers();
    if (obsSocket) {
        obsSocket.onopen = null;
        obsSocket.onclose = null;
        obsSocket.onerror = null;
        obsSocket.onmessage = null;
        obsSocket.close();
        obsSocket = null;
    }
    setObsStatus(reasonText, '#3a3a3a');
}

function handleCustomEvent(eventData) {
    if (!eventData) return;
    const realm = (obsWsRealmInput.value || 'obs-stopwatch').trim();
    if ((eventData.source || eventData.realm || '').toLowerCase() !== realm.toLowerCase()) {
        return;
    }
    const action = (eventData.action || '').toLowerCase();
    switch (action) {
        case 'start':
            startTimer();
            break;
        case 'stop':
            stopTimer();
            break;
        case 'reset':
            resetTimer();
            break;
        case 'toggle':
            isRunning ? stopTimer() : startTimer();
            break;
        case 'set_elapsed': {
            var ms = Number(eventData.milliseconds || eventData.ms || 0);
            const s = Number(eventData.seconds || eventData.s || 0);
            const m = Number(eventData.minutes || eventData.m || 0);
            const h = Number(eventData.hours || eventData.h || 0);
            ms += s * 1000 + m * 60 * 1000 + h * 60 * 60 * 1000;

            if (!Number.isNaN(ms) && ms >= 0) {
                elapsedTime = ms;
                // Clamp if negative not allowed in timer mode
                if (timerMode === 'timer' && !allowNegative && elapsedTime > countdownDuration) {
                    elapsedTime = countdownDuration;
                }
                const formatted = formatTime(timerMode === 'timer' ? countdownDuration - elapsedTime : elapsedTime);
                stopwatch.textContent = formatted;
                stopwatchGlow.textContent = formatted;
                setTimeInputs();
                saveTimerData();
            }
            break;
        }
        case 'set_countdown': {
            timerMode = 'timer';
            var ms = Number(eventData.milliseconds || eventData.ms || 0);
            const s = Number(eventData.seconds || eventData.s || 0);
            const m = Number(eventData.minutes || eventData.m || 0);
            const h = Number(eventData.hours || eventData.h || 0);
            ms += s * 1000 + m * 60 * 1000 + h * 60 * 60 * 1000;

            if (!Number.isNaN(ms) && ms >= 0) {
                countdownDuration = ms;
                // Clamp elapsed if negative not allowed
                if (!allowNegative && elapsedTime > countdownDuration) {
                    elapsedTime = countdownDuration;
                }
                if (timerMode === 'timer' && !isRunning) {
                    const display = countdownDuration - elapsedTime;
                    stopwatch.textContent = formatTime(display);
                    stopwatchGlow.textContent = formatTime(display);
                }
                saveTimerData();
            }
            break;
        }
        // Stopwatch-specific commands
        case 'stopwatch_start':
            timerMode = 'stopwatch';
            startTimer();
            saveTimerData();
            break;
        case 'stopwatch_stop':
            timerMode = 'stopwatch';
            stopTimer();
            saveTimerData();
            break;
        case 'stopwatch_toggle':
            timerMode = 'stopwatch';
            isRunning ? stopTimer() : startTimer();
            saveTimerData();
            break;
        // Countdown-specific commands
        case 'countdown_start':
            timerMode = 'timer';
            alertPlayed = false;
            startTimer();
            saveTimerData();
            break;
        case 'countdown_stop':
            timerMode = 'timer';
            stopTimer();
            saveTimerData();
            break;
        case 'countdown_toggle':
            timerMode = 'timer';
            alertPlayed = false;
            isRunning ? stopTimer() : startTimer();
            saveTimerData();
            break;
        // Macros
        case 'countdown_now': {
            timerMode = 'timer';
            var ms = Number(eventData.milliseconds || eventData.ms || 0);
            const s = Number(eventData.seconds || eventData.s || 0);
            const m = Number(eventData.minutes || eventData.m || 0);
            const h = Number(eventData.hours || eventData.h || 0);
            ms += s * 1000 + m * 60 * 1000 + h * 60 * 60 * 1000;

            if (!Number.isNaN(ms) && ms >= 0) {
                alertPlayed = false;
                stopTimer();
                countdownDuration = ms;
                elapsedTime = 0;
                const formatted = formatTime(countdownDuration - elapsedTime);
                stopwatch.textContent = formatted;
                stopwatchGlow.textContent = formatted;
                setTimeInputs();
                // Clamp elapsed if negative not allowed
                if (!allowNegative && elapsedTime > countdownDuration) {
                    elapsedTime = countdownDuration;
                }
                if (timerMode === 'timer' && !isRunning) {
                    const display = countdownDuration - elapsedTime;
                    stopwatch.textContent = formatTime(display);
                    stopwatchGlow.textContent = formatTime(display);
                }
                startTimer();
                saveTimerData();
            }
            break;
        }
        default:
            break;
    }
}

// ─── SHA-256 (for OBS auth) ───
async function sha256Base64(input) {
    function bytesToBase64(bytes) {
        const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let base64 = '';
        const len = bytes.length;
        const rem = len % 3;
        const mainLen = len - rem;

        for (let i = 0; i < mainLen; i += 3) {
            const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
            base64 += lookup[(chunk >> 18) & 0x3f];
            base64 += lookup[(chunk >> 12) & 0x3f];
            base64 += lookup[(chunk >> 6) & 0x3f];
            base64 += lookup[chunk & 0x3f];
        }

        if (rem === 1) {
            const chunk = bytes[mainLen];
            base64 += lookup[(chunk >> 2) & 0x3f];
            base64 += lookup[(chunk << 4) & 0x3f];
            base64 += '==';
        } else if (rem === 2) {
            const chunk = (bytes[mainLen] << 8) | bytes[mainLen + 1];
            base64 += lookup[(chunk >> 10) & 0x3f];
            base64 += lookup[(chunk >> 4) & 0x3f];
            base64 += lookup[(chunk << 2) & 0x3f];
            base64 += '=';
        }

        return base64;
    }

    function stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 128) {
                bytes.push(c);
            } else if (c < 2048) {
                bytes.push((c >> 6) | 192);
                bytes.push((c & 63) | 128);
            } else if (c < 55296 || c >= 57344) {
                bytes.push((c >> 12) | 224);
                bytes.push(((c >> 6) & 63) | 128);
                bytes.push((c & 63) | 128);
            } else {
                i++;
                c = 65536 + (((c & 1023) << 10) | (str.charCodeAt(i) & 1023));
                bytes.push((c >> 18) | 240);
                bytes.push(((c >> 12) & 63) | 128);
                bytes.push(((c >> 6) & 63) | 128);
                bytes.push((c & 63) | 128);
            }
        }
        return bytes;
    }

    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    function ch(x, y, z) { return (x & y) ^ (~x & z); }
    function maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
    function sigma0(x) { return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22); }
    function sigma1(x) { return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25); }
    function gamma0(x) { return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3); }
    function gamma1(x) { return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10); }

    const bytes = stringToBytes(input);
    const m = bytes.slice();
    const l = bytes.length * 8;

    m.push(0x80);
    while ((m.length % 64) !== 56) m.push(0);

    m.push(0, 0, 0, 0);
    m.push((l >>> 24) & 0xff);
    m.push((l >>> 16) & 0xff);
    m.push((l >>> 8) & 0xff);
    m.push(l & 0xff);

    let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
    let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

    for (let i = 0; i < m.length; i += 64) {
        const W = [];

        for (let t = 0; t < 16; t++) {
            W[t] = (m[i + t * 4] << 24) | (m[i + t * 4 + 1] << 16) |
                (m[i + t * 4 + 2] << 8) | m[i + t * 4 + 3];
        }

        for (let t = 16; t < 64; t++) {
            W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
        }

        let a = H0, b = H1, c = H2, d = H3;
        let e = H4, f = H5, g = H6, h = H7;

        for (let t = 0; t < 64; t++) {
            const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
            const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
            h = g; g = f; f = e;
            e = (d + T1) >>> 0;
            d = c; c = b; b = a;
            a = (T1 + T2) >>> 0;
        }

        H0 = (H0 + a) >>> 0;
        H1 = (H1 + b) >>> 0;
        H2 = (H2 + c) >>> 0;
        H3 = (H3 + d) >>> 0;
        H4 = (H4 + e) >>> 0;
        H5 = (H5 + f) >>> 0;
        H6 = (H6 + g) >>> 0;
        H7 = (H7 + h) >>> 0;
    }

    const hash = [
        (H0 >>> 24) & 0xff, (H0 >>> 16) & 0xff, (H0 >>> 8) & 0xff, H0 & 0xff,
        (H1 >>> 24) & 0xff, (H1 >>> 16) & 0xff, (H1 >>> 8) & 0xff, H1 & 0xff,
        (H2 >>> 24) & 0xff, (H2 >>> 16) & 0xff, (H2 >>> 8) & 0xff, H2 & 0xff,
        (H3 >>> 24) & 0xff, (H3 >>> 16) & 0xff, (H3 >>> 8) & 0xff, H3 & 0xff,
        (H4 >>> 24) & 0xff, (H4 >>> 16) & 0xff, (H4 >>> 8) & 0xff, H4 & 0xff,
        (H5 >>> 24) & 0xff, (H5 >>> 16) & 0xff, (H5 >>> 8) & 0xff, H5 & 0xff,
        (H6 >>> 24) & 0xff, (H6 >>> 16) & 0xff, (H6 >>> 8) & 0xff, H6 & 0xff,
        (H7 >>> 24) & 0xff, (H7 >>> 16) & 0xff, (H7 >>> 8) & 0xff, H7 & 0xff
    ];

    return bytesToBase64(hash);
}

async function computeObsAuth(password, authentication) {
    if (!authentication || !authentication.challenge) {
        return null;
    }
    const { challenge, salt } = authentication;
    const secret = await sha256Base64(`${password}${salt}`);
    return sha256Base64(`${secret}${challenge}`);
}

function scheduleObsHandshakeTimeout() {
    clearObsTimers();
    obsHandshakeTimer = setTimeout(() => {
        disconnectObs('Handshake timeout');
    }, 10000);
}

async function handleObsMessage(event) {
    let payload;
    try {
        payload = JSON.parse(event.data);
    } catch (err) {
        return;
    }

    if (payload.op === 0) {
        if (payload.d.authentication && payload.d.authentication.challenge && !obsWsPasswordInput.value) {
            setObsStatus('Password required', '#c62828');
            disconnectObs('Password required');
            return;
        }
        const rpcVersion = payload.d.rpcVersion || 1;
        const identify = {
            op: 1,
            d: {
                rpcVersion: rpcVersion,
                eventSubscriptions: OBS_EVENT_SUBSCRIPTIONS_GENERAL
            }
        };

        if (payload.d.authentication && obsWsPasswordInput.value) {
            try {
                const pw = obsWsPasswordInput.value.trim();
                identify.d.authentication = await computeObsAuth(pw, payload.d.authentication);
            } catch (err) {
                setObsStatus(`Auth error: ${err.message}`, '#c62828');
                return;
            }
        }

        obsSocket.send(JSON.stringify(identify));
        setObsStatus('Sent identify', '#f9a825');
        scheduleObsHandshakeTimeout();
        return;
    }

    if (payload.op === 2) {
        clearObsTimers();
        obsConnected = true;
        setObsStatus('Connected', '#2e7d32');
        saveTimerData();
        return;
    }

    if (payload.op === 5 && payload.d && payload.d.eventType === 'CustomEvent') {
        handleCustomEvent(payload.d.eventData);
    }
}

function connectObs() {
    disconnectObs();
    const host = (obsWsHostInput.value || 'localhost').trim();
    const port = (obsWsPortInput.value || '4455').trim();
    const hasScheme = host.startsWith('ws://') || host.startsWith('wss://');
    const url = hasScheme ? `${host}` : `ws://${host}:${port}`;
    try {
        obsSocket = new WebSocket(url);
    } catch (err) {
        setObsStatus('Connection error', '#c62828');
        return;
    }
    setObsStatus('Connecting...', '#f9a825');
    obsSocket.onopen = () => setObsStatus('Waiting for hello', '#f9a825');
    obsSocket.onerror = (evt) => {
        const code = evt && evt.code ? ` (${evt.code})` : '';
        setObsStatus(`Error${code}`, '#c62828');
    };
    obsSocket.onclose = (evt) => {
        let reason = 'Disconnected';
        if (evt && evt.code) {
            const code = evt.code;
            if (code === 4000) reason = 'Identification required';
            else if (code === 4001) reason = 'Auth required';
            else if (code === 4002) reason = 'Auth failed';
            else if (code === 4003) reason = 'Version mismatch';
            else if (code === 4009) reason = 'Not identified in time';
            else if (code === 4010) reason = 'Unsupported RPC version';
            else if (code === 4011) reason = 'Session invalid';
            else if (code === 4012) reason = 'Unsupported authentication';
            else if (code === 4013) reason = 'Connection replaced';
            else if (code === 4014) reason = 'Unsupported platform';
            else reason = `Closed (${code})`;
        }
        disconnectObs(reason);
    };
    obsSocket.onmessage = (evt) => {
        handleObsMessage(evt);
    };
}

// ─── Save / Load ───
function buildSaveData() {
    return {
        obs_stopwatch_settings: true,
        elapsedTime: elapsedTime,
        googleFontsImport: googleFontsImportInput.value,
        fontName: document.body.style.fontFamily,
        fontWeight: fontWeight,
        isRunning: isRunning,
        timerMode: timerMode,
        countdownDuration: countdownDuration,
        allowNegative: allowNegative,
        playAlert: playAlert,
        alertSoundUrl: alertSoundUrl,
        textColor: textColor,
        staticGlow: {
            enabled: staticGlowEnabled,
            opacity: staticGlowOpacity,
            color: staticGlowColor
        },
        obsWs: {
            enabled: obsWsEnabledCheckbox.checked,
            host: obsWsHostInput.value,
            port: obsWsPortInput.value,
            realm: obsWsRealmInput.value,
            password: obsWsPasswordInput.value
        },
        animGradient: {
            enabled: animGradientCheckbox.checked,
            color1: gradientColor1Input.value,
            color2: gradientColor2Input.value,
            speed: gradientSpeedInput.value,
            glow: gradientGlowInput.value
        }
    };
}

function saveTimerData() {
    localStorage.setItem('timerData', JSON.stringify(buildSaveData()));
}

function saveTimerDataOngoing() {
    const data = buildSaveData();
    data.elapsedTime = Date.now() - startTime + elapsedTime;
    localStorage.setItem('timerData', JSON.stringify(data));
}

function applyLoadedData(data) {
    if (!data) return;

    elapsedTime = Number(data.elapsedTime) || 0;
    googleFontsImportInput.value = data.googleFontsImport || '';
    document.body.style.fontFamily = data.fontName || 'Arial, sans-serif';
    fontWeight = data.fontWeight || '400';
    document.body.style.fontWeight = fontWeight;
    fontWeightInput.value = fontWeight;
    fontWeightValue.textContent = fontWeight;

    timerMode = data.timerMode || 'stopwatch';
    countdownDuration = Number(data.countdownDuration) || 0;
    allowNegative = Boolean(data.allowNegative);
    playAlert = Boolean(data.playAlert);
    alertSoundUrl = data.alertSoundUrl || '';
    alertPlayed = false;

    textColor = data.textColor || '#ffffff';
    if (data.staticGlow) {
        staticGlowEnabled = Boolean(data.staticGlow.enabled);
        staticGlowOpacity = data.staticGlow.opacity !== undefined ? data.staticGlow.opacity : 3;
        staticGlowColor = data.staticGlow.color || '#ffffff';
    } else {
        staticGlowEnabled = false;
        staticGlowOpacity = 3;
        staticGlowColor = '#ffffff';
    }
    textColorInput.value = textColor;
    textColorPreview.style.background = textColor;
    staticGlowCheckbox.checked = staticGlowEnabled;
    staticGlowOpacityInput.value = staticGlowOpacity;
    staticGlowValue.textContent = staticGlowOpacity;
    staticGlowColorInput.value = staticGlowColor;
    staticGlowColorPreview.style.background = staticGlowColor;
    toggleSubSetting(staticGlowSettings, staticGlowEnabled);

    isRunning = data.isRunning;

    if (data.obsWs) {
        obsWsEnabledCheckbox.checked = Boolean(data.obsWs.enabled);
        obsWsHostInput.value = data.obsWs.host || 'localhost';
        obsWsPortInput.value = data.obsWs.port || '4455';
        obsWsRealmInput.value = data.obsWs.realm || 'obs-stopwatch';
        obsWsPasswordInput.value = data.obsWs.password || '';
    }
    if (data.animGradient) {
        animGradientCheckbox.checked = Boolean(data.animGradient.enabled);
        gradientColor1Input.value = data.animGradient.color1 || '#00BFFF';
        gradientColor2Input.value = data.animGradient.color2 || '#FF6EC7';
        gradientSpeedInput.value = data.animGradient.speed || '10';
        gradientGlowInput.value = data.animGradient.glow || '2';
    }
    if (data.animGradient && data.animGradient.enabled) {
        startGradientAnimation();
    } else {
        stopGradientAnimation();
        applyTextAppearance();
    }
    const fontLink = document.getElementById('fontLink');
    fontLink.href = extractGoogleFontUrl(googleFontsImportInput);
    fontNameInput.value = (document.body.style.fontFamily || '').replace(/["']/g, '');

    setTimeInputs();

    if (isRunning) {
        isRunning = false;
        startTimer();
    }

    if (data.obsWs && data.obsWs.enabled) {
        connectObs();
    } else {
        setObsStatus('Disconnected', '#3a3a3a');
    }

    // Update display
    if (!isRunning) {
        if (timerMode === 'timer') {
            const display = countdownDuration - elapsedTime;
            stopwatch.textContent = formatTime(display);
            stopwatchGlow.textContent = formatTime(display);
        } else {
            stopwatch.textContent = formatTime(elapsedTime);
            stopwatchGlow.textContent = formatTime(elapsedTime);
        }
    }
}

function loadTimerData() {
    const raw = localStorage.getItem('timerData');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            applyLoadedData(data);
        } catch (e) {
            setObsStatus('Disconnected', '#3a3a3a');
        }
    } else {
        setObsStatus('Disconnected', '#3a3a3a');
    }

    // Ensure display is set
    if (!isRunning) {
        if (timerMode === 'timer') {
            const display = countdownDuration - elapsedTime;
            stopwatch.textContent = formatTime(display);
            stopwatchGlow.textContent = formatTime(display);
        } else {
            const formatted = formatTime(elapsedTime);
            stopwatch.textContent = formatted;
            stopwatchGlow.textContent = formatted;
        }
    }

    updatePlayPauseIcon();
}

// ─── Text Appearance (color + static glow, overridden by animated gradient) ───
function applyTextAppearance() {
    stopwatch.style.color = textColor;
    stopwatch.style.background = '';
    stopwatch.style.webkitBackgroundClip = '';
    stopwatch.style.webkitTextFillColor = '';
    stopwatch.style.backgroundClip = '';
    stopwatch.style.textShadow = '';
    stopwatchGlow.style.color = 'transparent';

    if (staticGlowEnabled) {
        const op = staticGlowOpacity / 10;
        // Parse the glow color to get RGB values
        var color = hexToRgb(staticGlowColor);
        const glowCol = `rgba(${color.r},${color.g},${color.b},${op})`;
        stopwatchGlow.style.textShadow = `
            0 0 20px ${glowCol},
            0 0 40px ${glowCol},
            0 0 80px ${glowCol}
        `;
    } else {
        stopwatchGlow.style.textShadow = 'none';
    }
}

// ─── Init ───
loadTimerData();