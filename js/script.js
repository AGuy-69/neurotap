/**
 * NEURO-FOCUS SART ENGINE
 * Pure Vanilla JavaScript implementation
 */

// --- STATE MANAGEMENT ---
const state = {
    view: 'home',
    theme: 'dark',
    soundEnabled: true,
    test: {
        trialsTotal: 30, // Default to 30 for demo (normally ~225)
        currentTrial: 0,
        targetNumber: 3,
        history: [], // Stores { isTarget, reacted, rt }
        isActive: false,
        stimulusTimer: null,
        trialTimer: null,
        startTime: null,
        hasReacted: false
    }
};

// --- ROUTING / NAVIGATION ---
function navigate(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    state.view = viewId;
    
    // Reset test state if leaving test
    if(viewId !== 'test-engine') {
        clearTimeout(state.test.stimulusTimer);
        clearTimeout(state.test.trialTimer);
        state.test.isActive = false;
    }
}

// --- AUDIO CONTEXT (No external files needed) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(frequency = 400, duration = 0.1) {
    if (!state.soundEnabled || audioCtx.state === 'suspended') return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- TOGGLES ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.className = `${state.theme}-theme`;
});

const soundToggle = document.getElementById('sound-toggle');

const soundOnSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     fill="none"
     viewBox="0 0 24 24"
     stroke-width="1.5"
     stroke="currentColor"
     style="height: 25px; width:auto; color:var(--text-primary);">

  <path stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
</svg>
`;

const soundOffSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     fill="none"
     viewBox="0 0 24 24"
     stroke-width="1.5"
     stroke="currentColor"
     style="height: 25px; width:auto; color:var(--text-primary);">

  <path stroke-linecap="round"
        stroke-linejoin="round"
        d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
</svg>
`;

soundToggle.addEventListener('click', () => {

    state.soundEnabled = !state.soundEnabled;

    soundToggle.innerHTML = state.soundEnabled
        ? soundOnSVG
        : soundOffSVG;

    if (state.soundEnabled && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
});


// --- SART TEST LOGIC ---
const stimEl = document.getElementById('stimulus');
const progFill = document.getElementById('progress-fill');

const handleTestInput = (e) => {
    // Only register Spacebar or Touch
    if ((e.type === 'keydown' && e.code === 'Space') || e.type === 'touchstart') {
        
        // ADDED SAFEGUARD: || !state.test.currentRecord
        // Ignore if test isn't running, user already reacted, or trial hasn't fully started
        if (!state.test.isActive || state.test.hasReacted || !state.test.currentRecord) return;
        
        state.test.hasReacted = true;
        const rt = performance.now() - state.test.startTime;
        
        // Update the current trial's record directly in the state
        state.test.currentRecord.reacted = true;
        state.test.currentRecord.rt = rt;
        
        // Play the appropriate beep
        playBeep(state.test.currentRecord.isTarget ? 300 : 800, 0.05); 
    }
};

// Attach listeners ONCE globally, outside of the loop
document.addEventListener('keydown', handleTestInput);
document.addEventListener('touchstart', handleTestInput);


function startTest() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    navigate('test-engine');
    state.test.currentTrial = 0;
    state.test.history = [];
    state.test.isActive = true;
    progFill.style.width = '0%';
    
    // 3 Second countdown
    let count = 3;
    stimEl.innerText = count;
    const countInt = setInterval(() => {
        count--;
        if (count > 0) {
            stimEl.innerText = count;
            playBeep(600, 0.1);
        } else {
            clearInterval(countInt);
            stimEl.innerText = '+';
            setTimeout(nextTrial, 1000);
        }
    }, 1000);
}


function nextTrial() {
    if (!state.test.isActive) return;
    if (state.test.currentTrial >= state.test.trialsTotal) {
        endTest();
        return;
    }

    state.test.hasReacted = false;
    state.test.currentTrial++;
    
    // Update progress
    progFill.style.width = `${(state.test.currentTrial / state.test.trialsTotal) * 100}%`;

    // Determine stimulus
    const isTargetTrial = Math.random() < 0.11; // Using your 0.9 demo value
    let num;
    if (isTargetTrial) {
        num = state.test.targetNumber;
    } else {
        do { num = Math.floor(Math.random() * 9) + 1; } while (num === state.test.targetNumber);
    }

    // 2. Track the current record in the global state so the event listener can access it
    state.test.currentRecord = {
        isTarget: isTargetTrial,
        number: num,
        reacted: false,
        rt: null
    };

    // Show stimulus
    stimEl.innerText = num;
    stimEl.style.opacity = '1';
    stimEl.style.transform = 'scale(1)';
    state.test.startTime = performance.now();

    // Mask stimulus after 250ms
    state.test.stimulusTimer = setTimeout(() => {
        stimEl.innerText = '+'; // Crosshair mask
        stimEl.style.opacity = '0.5';
        stimEl.style.transform = 'scale(0.8)';
    }, 250);

    // End trial after 1150ms (Total cycle time)
    state.test.trialTimer = setTimeout(() => {
        // Push the completed record into history
        state.test.history.push(state.test.currentRecord);
        nextTrial();
    }, 1150);
}

function endTest() {
    state.test.isActive = false;
    processResults();
    navigate('results');
}

// --- RESULTS PROCESSING & AI TEXT ---
function processResults() {
    const history = state.test.history;
    let commissionErrors = 0; // Pressed on target (3)
    let omissionErrors = 0;   // Missed a non-target
    let totalRt = 0;
    let rtCount = 0;
    const rts = [];

    history.forEach(t => {
        if (t.isTarget && t.reacted) commissionErrors++;
        if (!t.isTarget && !t.reacted) omissionErrors++;
        if (!t.isTarget && t.reacted) {
            totalRt += t.rt;
            rtCount++;
            rts.push(t.rt);
        }
    });

    const totalErrors = commissionErrors + omissionErrors;
    const accuracy = Math.max(0, ((state.test.trialsTotal - totalErrors) / state.test.trialsTotal) * 100);
    const avgRt = rtCount > 0 ? (totalRt / rtCount).toFixed(0) : 0;

    // Update DOM
    document.getElementById('res-acc').innerText = `${accuracy.toFixed(1)}%`;
    document.getElementById('res-rt').innerText = `${avgRt}ms`;
    document.getElementById('res-ce').innerText = commissionErrors;
    document.getElementById('res-oe').innerText = omissionErrors;

    // AI Insight Generator
    let insight = "Analysis: ";
    if (accuracy > 95) insight += "Exceptional sustained attention. High vigilance with excellent inhibitory control.";
    else if (commissionErrors > omissionErrors) insight += "You exhibited signs of motor impulsivity. You maintained speed but struggled to inhibit habitual responses during target trials.";
    else if (omissionErrors > commissionErrors) insight += "Evidence of attention lapses or mind-wandering. Your response times indicate fading vigilance.";
    else insight += "Standard performance. Normal cognitive variance detected in attention networks.";
    
    document.getElementById('ai-insight').innerText = insight;

    drawChart(rts);
    saveData(accuracy, avgRt);
}
// --- PURE JS CANVAS CHART ---
function drawChart(dataPoints) {
    const canvas = document.getElementById('results-chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(dataPoints.length === 0) return;

    // Increased padding to 50 to make room for the "ms" labels on the left
    const padding = 50; 
    const maxVal = Math.max(...dataPoints, 600);
    const minVal = Math.min(...dataPoints, 200);
    
    // Draw Axes
    ctx.strokeStyle = '#8a94a6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // --- ADDED: Y-Axis Numbering (ms) ---
    ctx.fillStyle = '#8a94a6';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Draw 5 reference points on the Y-axis
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
        const val = minVal + (maxVal - minVal) * (i / ySteps);
        const y = canvas.height - padding - (i / ySteps) * (canvas.height - padding * 2);
        
        // Draw the text (e.g., "400 ms")
        ctx.fillText(`${Math.round(val)} ms`, padding - 10, y);
    }

    // --- ADDED: X-Axis Numbering ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xStep = (canvas.width - padding * 2) / Math.max(1, (dataPoints.length - 1));

    // Draw Line Graph
    // (Assuming 'state' is defined in your broader scope as in your original code)
    ctx.strokeStyle = (typeof state !== 'undefined' && state.theme === 'dark') ? '#00d2ff' : '#3a7bd5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dataPoints.forEach((val, i) => {
        const x = padding + (i * xStep);
        const y = canvas.height - padding - ((val - minVal) / (maxVal - minVal) * (canvas.height - padding * 2));
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        // Draw the run number on the X-axis (1, 2, 3...)
        ctx.fillStyle = '#8a94a6';
        ctx.fillText(i + 1, x, canvas.height - padding + 10);
    });
    ctx.stroke();

    // Draw Points on top of the line
    dataPoints.forEach((val, i) => {
        const x = padding + (i * xStep);
        const y = canvas.height - padding - ((val - minVal) / (maxVal - minVal) * (canvas.height - padding * 2));
        
        // The white square dots
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 3, y - 3, 6, 6);

        /* 
         * OPTIONAL: If you want the exact 'ms' value floating right next to 
         * each point instead of just on the Y-Axis, uncomment the lines below:
         */
        // ctx.fillStyle = '#8a94a6';
        // ctx.fillText(`${val}ms`, x, y - 15);
    });
}

// --- LOCAL & FIREBASE STORAGE ---
function saveData(acc, rt) {
    const record = { 
        date: new Date().toISOString(), 
        accuracy: acc, 
        avgRt: rt 
    };

    // 1. Keep Local Storage (Useful for offline fallback or local history)
    const history = JSON.parse(localStorage.getItem('sart_history') || '[]');
    history.push(record);
    localStorage.setItem('sart_history', JSON.stringify(history));

    // 2. Push to Firebase Realtime Database
    // This creates a unique ID for every new test result
    const resultsRef = db.ref('sart_results');
    
    resultsRef.push(record)
        .then(() => {
            console.log("Results successfully synced to Firebase.");
        })
        .catch((error) => {
            console.error("Firebase sync failed:", error);
        });
}

// --- BACKGROUND PARTICLES ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
    }));
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(0, 210, 255, 0.5)' : 'rgba(58, 123, 213, 0.5)';
    
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', initParticles);
initParticles();
animateParticles();