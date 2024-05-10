// script.js
let startTime;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

const stopwatch = document.getElementById('stopwatch');
const startStopButton = document.getElementById('startStop');
const resetButton = document.getElementById('reset');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const googleFontsImportInput = document.getElementById('googleFontsImport');
const fontNameInput = document.getElementById('fontName');
const glowCheckbox = document.getElementById('glow');
const glowStrengthSlider = document.getElementById('glowStrength');

function formatTime(time) {
    const hours = Math.floor(time / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((time % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((time % 60000) / 1000).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 10);
    isRunning = true;
    disableSettings();
}

function stopTimer() {
    clearInterval(timerInterval);
    elapsedTime += Date.now() - startTime;
    isRunning = false;
    enableSettings();
    setTimeInputs();
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    stopwatch.textContent = '00:00:00';
    setTimeInputs();
    saveTimerData();
}

function updateTimer() {
    const currentTime = Date.now();
    const timeElapsed = currentTime - startTime + elapsedTime;
    stopwatch.textContent = formatTime(timeElapsed);
}

function setTimeInputs() {
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    hoursInput.value = hours.toString().padStart(2, '0');
    minutesInput.value = minutes.toString().padStart(2, '0');
    secondsInput.value = seconds.toString().padStart(2, '0');
}

function setFontNameInput() {
    const fontFamily = document.body.style.fontFamily;
    fontNameInput.value = fontFamily.replace(/["']/g, '');
}

function updateGlowStrength() {
    const glowOpacity = glowStrengthSlider.value / 5;
    document.documentElement.style.setProperty('--glow-opacity', glowOpacity);
}

startStopButton.addEventListener('click', function() {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
    saveTimerData();
});

resetButton.addEventListener('click', resetTimer);

function getTimeValue(input) {
    return input.value ? parseInt(input.value) : 0;
}

function updateElapsedTime() {
    const hours = getTimeValue(hoursInput);
    const minutes = getTimeValue(minutesInput);
    const seconds = getTimeValue(secondsInput);
    elapsedTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
    stopwatch.textContent = formatTime(elapsedTime);
    saveTimerData();
}

hoursInput.addEventListener('input', updateElapsedTime);
minutesInput.addEventListener('input', updateElapsedTime);
secondsInput.addEventListener('input', updateElapsedTime);

googleFontsImportInput.addEventListener('input', function() {
    const fontLink = document.getElementById('fontLink');
    fontLink.href = googleFontsImportInput.value;
    saveTimerData();
});

fontNameInput.addEventListener('input', function() {
    document.body.style.fontFamily = fontNameInput.value;
    saveTimerData();
});

glowCheckbox.addEventListener('change', function() {
    if (glowCheckbox.checked) {
        stopwatch.classList.add('glow');
        glowStrengthSlider.disabled = false;
    } else {
        stopwatch.classList.remove('glow');
        glowStrengthSlider.disabled = true;
    }
    saveTimerData();
});

glowStrengthSlider.addEventListener('input', function() {
    updateGlowStrength();
    saveTimerData();
});

function disableSettings() {
    hoursInput.disabled = true;
    minutesInput.disabled = true;
    secondsInput.disabled = true;
    googleFontsImportInput.disabled = true;
    fontNameInput.disabled = true;
    glowCheckbox.disabled = true;
    glowStrengthSlider.disabled = true;
}

function enableSettings() {
    hoursInput.disabled = false;
    minutesInput.disabled = false;
    secondsInput.disabled = false;
    googleFontsImportInput.disabled = false;
    fontNameInput.disabled = false;
    glowCheckbox.disabled = false;
    if (glowCheckbox.checked) {
        glowStrengthSlider.disabled = false;
    }
}

function saveTimerData() {
    const data = {
        elapsedTime: elapsedTime,
        googleFontsImport: googleFontsImportInput.value,
        fontName: document.body.style.fontFamily,
        glow: glowCheckbox.checked,
        glowStrength: glowStrengthSlider.value,
        isRunning: isRunning
    };
    localStorage.setItem('timerData', JSON.stringify(data));
}

function loadTimerData() {
    const data = JSON.parse(localStorage.getItem('timerData'));
    if (data) {
        elapsedTime = data.elapsedTime;
        googleFontsImportInput.value = data.googleFontsImport;
        document.body.style.fontFamily = data.fontName;
        glowCheckbox.checked = data.glow;
        glowStrengthSlider.value = data.glowStrength;
        isRunning = data.isRunning;
        if (data.glow) {
            stopwatch.classList.add('glow');
        }
        const fontLink = document.getElementById('fontLink');
        fontLink.href = data.googleFontsImport;
        setTimeInputs();
        setFontNameInput();
        updateGlowStrength();
        if (isRunning) {
            startTimer();
        } else {
            enableSettings();
        }
    } else {
        enableSettings();
    }
    stopwatch.textContent = formatTime(elapsedTime);
}

loadTimerData();
