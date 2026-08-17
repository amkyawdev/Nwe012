// ===== App State =====
const state = {
    currentPage: 'home',
    currentMode: 'tts',
    selectedVoice: 'thiha',
    charCount: 0,
    usageUsed: 0,
    usageLimit: 5000,
    ttsCount: 0,
    srtCount: 0,
    apiKey: localStorage.getItem('amkyaw_tts_api_key') || ''
};

// ===== DOM Elements =====
const elements = {
    navbar: document.querySelector('.navbar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.getElementById('navLinks'),
    pages: document.querySelectorAll('.page'),
    navLinksItems: document.querySelectorAll('.nav-link'),
    textInput: document.getElementById('textInput'),
    charCount: document.getElementById('charCount'),
    modeTabs: document.querySelectorAll('.mode-tab'),
    voiceOptions: document.querySelectorAll('.voice-option'),
    generateBtn: document.getElementById('generateBtn'),
    apiKeyInput: document.getElementById('apiKey'),
    toggleVisibility: document.getElementById('toggleVisibility'),
    saveApiKey: document.getElementById('saveApiKey'),
    usageUsed: document.getElementById('usageUsed'),
    usageRemaining: document.getElementById('usageRemaining'),
    usageCircle: document.getElementById('usageCircle'),
    ttsCount: document.getElementById('ttsCount'),
    srtCount: document.getElementById('srtCount'),
    resetUsage: document.getElementById('resetUsage'),
    toast: document.getElementById('toast')
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Handle hash-based routing
    handleRouting();
    window.addEventListener('hashchange', handleRouting);

    // Mobile menu
    setupMobileMenu();

    // Navbar scroll effect
    setupNavbarScroll();

    // Mode tabs
    setupModeTabs();

    // Voice selection
    setupVoiceSelection();

    // Text input
    setupTextInput();

    // Generate button
    setupGenerateButton();

    // API key
    setupApiKey();

    // Usage tracking
    setupUsageTracking();

    // Load saved state
    loadState();
}

// ===== Routing =====
function handleRouting() {
    const hash = window.location.hash.slice(1) || 'home';
    const pageName = hash.split('?')[0];
    
    navigateToPage(pageName);
}

function navigateToPage(pageName) {
    // Update state
    state.currentPage = pageName;

    // Update nav links
    elements.navLinksItems.forEach(link => {
        const linkPage = link.dataset.page;
        link.classList.toggle('active', linkPage === pageName);
    });

    // Update pages
    elements.pages.forEach(page => {
        const isActive = page.id === pageName;
        page.classList.toggle('active', isActive);
        
        if (isActive) {
            // Trigger animations
            page.querySelectorAll('.animate-item, .animate-card').forEach((el, i) => {
                el.style.animationDelay = `${i * 0.1}s`;
            });
        }
    });

    // Close mobile menu
    elements.navLinks.classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL
    history.replaceState(null, '', `#${pageName}`);
}

// ===== Mobile Menu =====
function setupMobileMenu() {
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.navLinks.classList.toggle('open');
        elements.mobileMenuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.navLinks.classList.remove('open');
            elements.mobileMenuBtn.classList.remove('active');
        });
    });
}

// ===== Navbar Scroll =====
function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
    });
}

// ===== Mode Tabs =====
function setupModeTabs() {
    elements.modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            state.currentMode = mode;

            // Update active tab
            elements.modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update placeholder
            if (mode === 'srt') {
                elements.textInput.placeholder = `1
00:00:01,000 --> 00:00:04,000
မြန်မာစာ စာသား...

2
00:00:05,000 --> 00:00:08,000
နောက်ထပ် စာသား...`;
            } else {
                elements.textInput.placeholder = 'ဖတ်ပြစေလိုသည့် စာသားကို ဤနေရာတွင် ရေးထည့်ပါ...';
            }
        });
    });
}

// ===== Voice Selection =====
function setupVoiceSelection() {
    elements.voiceOptions.forEach(option => {
        option.addEventListener('click', () => {
            const voice = option.dataset.voice;
            state.selectedVoice = voice;

            // Update active voice
            elements.voiceOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// ===== Text Input =====
function setupTextInput() {
    elements.textInput.addEventListener('input', (e) => {
        const text = e.target.value;
        state.charCount = text.length;
        
        // Update counter
        elements.charCount.textContent = text.length.toLocaleString();
        
        // Visual feedback when near limit
        if (text.length > state.usageLimit * 0.9) {
            elements.charCount.style.color = 'var(--error)';
        } else if (text.length > state.usageLimit * 0.7) {
            elements.charCount.style.color = 'var(--warning)';
        } else {
            elements.charCount.style.color = 'var(--text-muted)';
        }
    });
}

// ===== API Configuration =====
const API_BASE = ''; // Empty for same-origin, or set to your API URL

// ===== Generate Button =====
function setupGenerateButton() {
    elements.generateBtn.addEventListener('click', async () => {
        const text = elements.textInput.value.trim();
        
        if (!text) {
            showToast('စာသား ထည့်သွင်းပါ', 'warning');
            return;
        }

        if (text.length > state.usageLimit - state.usageUsed) {
            showToast('စာလုံးအရေအတွက် ကျော်လွန်ပါပြီ', 'error');
            return;
        }

        // Get API key from storage
        const apiKey = localStorage.getItem('amkyaw_tts_api_key');
        if (!apiKey) {
            showToast('API Key ထည့်သွင်းပါ', 'warning');
            navigateToPage('api');
            return;
        }

        // Calculate estimated time (min 5s, max 15s, ~1s per 10 chars)
        const estimatedSeconds = Math.min(15, Math.max(5, Math.ceil(text.length / 10)))
        
        // Show loading overlay
        showLoadingOverlay(estimatedSeconds);

        try {
            // Call API with API key
            const response = await fetch(`${API_BASE}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    voice: state.selectedVoice,
                    apiKey: apiKey
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'API request failed');
            }

            if (data.success && data.audio) {
                // Hide loading overlay
                hideLoadingOverlay();
                
                // Show audio player with mimeType
                showAudioPlayer(data.audio, data.format, text, data.mimeType);
                
                // Update usage
                state.usageUsed += text.length;
                if (state.currentMode === 'tts') {
                    state.ttsCount++;
                } else {
                    state.srtCount++;
                }
                
                saveState();
                updateUsageDisplay();
                
                showToast('အသံဖန်တီးပြီးပါပြီ! 🎉', 'success');
                
                // Clear input
                elements.textInput.value = '';
                state.charCount = 0;
                elements.charCount.textContent = '0';
                elements.charCount.style.color = 'var(--text-muted)';
            } else {
                throw new Error(data.message || 'Invalid response from server');
            }
            
        } catch (error) {
            console.error('TTS Error:', error);
            hideLoadingOverlay();
            showToast('အမှားဖြစ်ပွားသည်: ' + error.message, 'error');
        }
    });
}

// ===== Loading Overlay =====
let loadingInterval = null;

function showLoadingOverlay(estimatedSeconds) {
    // Remove existing overlay
    hideLoadingOverlay();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-animation">
                <div class="script-container">
                    <span class="script-char">A</span>
                    <span class="script-char">I</span>
                    <span class="script-char">-</span>
                    <span class="script-char">G</span>
                    <span class="script-char">e</span>
                    <span class="script-char">n</span>
                    <span class="script-char">e</span>
                    <span class="script-char">r</span>
                    <span class="script-char">a</span>
                    <span class="script-char">t</span>
                    <span class="script-char">i</span>
                    <span class="script-char">n</span>
                    <span class="script-char">g</span>
                    <span class="script-char">.</span>
                    <span class="script-cursor">|</span>
                </div>
            </div>
            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-info">
                    <span class="progress-percent" id="progressPercent">0%</span>
                    <span class="progress-time" id="progressTime">~${estimatedSeconds}s</span>
                </div>
            </div>
            <p class="loading-text">အသံဖန်တီးနေသည်...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animate script typing
    animateScript();
    
    // Progress animation (simulated based on time)
    let progress = 0;
    const duration = estimatedSeconds * 1000;
    const interval = 100;
    const increment = (100 / (duration / interval));
    
    loadingInterval = setInterval(() => {
        progress += increment;
        if (progress > 95) progress = 95; // Max 95% until complete
        
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
    }, interval);
}

function animateScript() {
    const chars = document.querySelectorAll('.script-char');
    const cursor = document.querySelector('.script-cursor');
    let charIndex = 0;
    let show = true;
    
    // Initially hide all chars
    chars.forEach(char => char.style.opacity = '0');
    
    // Cursor blink
    const cursorInterval = setInterval(() => {
        if (cursor) {
            cursor.style.opacity = show ? '1' : '0';
            show = !show;
        }
    }, 500);
    
    // Type characters
    const typeInterval = setInterval(() => {
        if (charIndex < chars.length) {
            chars[charIndex].style.opacity = '1';
            chars[charIndex].style.transform = 'translateY(0)';
            charIndex++;
        } else {
            clearInterval(typeInterval);
            clearInterval(cursorInterval);
        }
    }, 100);
}

function hideLoadingOverlay() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 300);
    }
}

// ===== Audio Player =====
let currentAudioData = null;

function showAudioPlayer(audioData, format, text, mimeType) {
    // Remove existing player
    const existingPlayer = document.querySelector('.audio-player');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Determine display format
    let displayFormat = format || 'WAV';
    let downloadExt = format || 'wav';
    
    // Handle PCM format - display as WAV
    if (mimeType && mimeType.includes('L16')) {
        displayFormat = 'WAV';
        downloadExt = 'wav';
    }

    // Create audio player element
    const playerDiv = document.createElement('div');
    playerDiv.className = 'audio-player';
    playerDiv.innerHTML = `
        <div class="audio-player-content">
            <div class="audio-header">
                <span class="audio-title">
                    <i data-lucide="music"></i>
                    Generated Audio
                </span>
                <button class="audio-close" onclick="closeAudioPlayer()">×</button>
            </div>
            <div class="audio-info">
                <span class="audio-badge">${displayFormat}</span>
                <span class="audio-chars">${text.length} characters</span>
            </div>
            
            <div class="audio-visualizer" id="audioVisualizer">
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
                <div class="wave-bar"></div>
            </div>
            
            <div class="audio-controls">
                <button class="audio-btn play-btn" id="playBtn" onclick="togglePlay()">
                    <i data-lucide="play"></i>
                </button>
                <div class="audio-progress-container">
                    <input type="range" class="audio-progress" id="audioProgress" value="0" min="0" max="100">
                    <div class="time-display">
                        <span id="currentTime">0:00</span>
                        <span id="duration">0:00</span>
                    </div>
                </div>
                <div class="volume-control">
                    <i data-lucide="volume-2" id="volumeIcon"></i>
                    <input type="range" class="volume-slider" id="volumeSlider" value="100" min="0" max="100">
                </div>
            </div>
            
            <audio id="generatedAudio" preload="metadata">
                <source src="${audioData}" type="${mimeType || 'audio/wav'}">
                Your browser does not support audio playback.
            </audio>
            
            <div class="audio-actions">
                <button class="btn btn-primary btn-download" onclick="downloadAudio('${audioData}', '${downloadExt}', '${mimeType}')">
                    <i data-lucide="download"></i>
                    Download ${displayFormat}
                </button>
            </div>
        </div>
    `;

    // Insert after the studio card
    const studioCard = document.querySelector('.studio-card');
    if (studioCard) {
        studioCard.parentNode.insertBefore(playerDiv, studioCard.nextSibling);
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Setup audio controls
    setupAudioControls();

    // Store for download
    currentAudioData = { audioData, format: downloadExt, mimeType };
}

function setupAudioControls() {
    const audio = document.getElementById('generatedAudio');
    const playBtn = document.getElementById('playBtn');
    const progress = document.getElementById('audioProgress');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const volumeSlider = document.getElementById('volumeSlider');
    const visualizer = document.getElementById('audioVisualizer');
    
    if (!audio || !playBtn) return;

    // Update duration when metadata loads
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Update progress bar
    audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.value = percent || 0;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        
        // Animate visualizer
        animateVisualizer(visualizer, audio.paused);
    });

    // Play/Pause button
    playBtn.addEventListener('click', togglePlay);

    // Progress bar click
    progress.addEventListener('input', (e) => {
        const percent = e.target.value;
        audio.currentTime = (percent / 100) * audio.duration;
    });

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
        updateVolumeIcon(e.target.value);
    });

    // When audio ends
    audio.addEventListener('ended', () => {
        playBtn.innerHTML = '<i data-lucide="play"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        stopVisualizerAnimation(visualizer);
    });

    // Error handling
    audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        showToast('Audio playback error. Please try downloading instead.', 'error');
    });
}

function togglePlay() {
    const audio = document.getElementById('generatedAudio');
    const playBtn = document.getElementById('playBtn');
    const visualizer = document.getElementById('audioVisualizer');
    
    if (!audio) return;

    if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i data-lucide="pause"></i>';
        animateVisualizer(visualizer, false);
    } else {
        audio.pause();
        playBtn.innerHTML = '<i data-lucide="play"></i>';
        stopVisualizerAnimation(visualizer);
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateVolumeIcon(value) {
    const icon = document.getElementById('volumeIcon');
    if (!icon) return;
    
    if (value == 0) {
        icon.setAttribute('data-lucide', 'volume-x');
    } else if (value < 50) {
        icon.setAttribute('data-lucide', 'volume-1');
    } else {
        icon.setAttribute('data-lucide', 'volume-2');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function animateVisualizer(visualizer, isPaused) {
    if (!visualizer || isPaused) {
        stopVisualizerAnimation(visualizer);
        return;
    }
    
    const bars = visualizer.querySelectorAll('.wave-bar');
    bars.forEach((bar, i) => {
        bar.style.animation = `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`;
        bar.style.animationDelay = `${i * 0.1}s`;
    });
}

function stopVisualizerAnimation(visualizer) {
    if (!visualizer) return;
    const bars = visualizer.querySelectorAll('.wave-bar');
    bars.forEach(bar => {
        bar.style.animation = 'none';
        bar.style.height = '20%';
    });
}

function closeAudioPlayer() {
    const player = document.querySelector('.audio-player');
    if (player) {
        player.remove();
    }
    currentAudioData = null;
}

function downloadAudio(audioData, format, mimeType) {
    if (!audioData) return;

    // Use correct MIME type for download
    let downloadMimeType = mimeType || 'audio/wav';
    let downloadExt = format || 'wav';
    
    // Handle PCM format - save as WAV
    if (mimeType && mimeType.includes('L16')) {
        downloadMimeType = 'audio/wav';
        downloadExt = 'wav';
    } else if (mimeType && mimeType.includes('mp3')) {
        downloadMimeType = 'audio/mpeg';
        downloadExt = 'mp3';
    } else if (mimeType && mimeType.includes('webm')) {
        downloadMimeType = 'audio/webm';
        downloadExt = 'webm';
    }

    // Convert base64 to blob
    const byteCharacters = atob(audioData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: downloadMimeType });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `myanmar-tts-${Date.now()}.${downloadExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Download started! 📥', 'success');
}

// Make functions global
window.closeAudioPlayer = closeAudioPlayer;
window.downloadAudio = downloadAudio;

// ===== API Key =====
function setupApiKey() {
    // Load saved API key
    if (state.apiKey) {
        elements.apiKeyInput.value = state.apiKey;
    }

    // Toggle visibility
    elements.toggleVisibility.addEventListener('click', () => {
        const type = elements.apiKeyInput.type === 'password' ? 'text' : 'password';
        elements.apiKeyInput.type = type;
        
        const eyeOpen = elements.toggleVisibility.querySelector('.eye-open');
        const eyeClosed = elements.toggleVisibility.querySelector('.eye-closed');
        
        eyeOpen.classList.toggle('hidden');
        eyeClosed.classList.toggle('hidden');
    });

    // Save API key
    elements.saveApiKey.addEventListener('click', () => {
        const key = elements.apiKeyInput.value.trim();
        
        if (!key) {
            showToast('API Key ထည့်သွင်းပါ', 'warning');
            return;
        }

        state.apiKey = key;
        localStorage.setItem('amkyaw_tts_api_key', key);
        
        showToast('API Key သိမ်းဆည်းပါပြီ', 'success');
    });
}

// ===== Usage Tracking =====
// ===== Auto Reset Check =====
function checkAutoReset() {
    const savedData = localStorage.getItem('amkyaw_tts_state');
    if (savedData) {
        const data = JSON.parse(savedData);
        const lastResetTime = data.lastResetTime || 0;
        const now = Date.now();
        const hoursPassed = (now - lastResetTime) / (1000 * 60 * 60);
        
        // Auto reset after 24 hours
        if (hoursPassed >= 24) {
            state.usageUsed = 0;
            state.ttsCount = 0;
            state.srtCount = 0;
            saveState();
            showToast('Usage အလိုအလျှောက် Reset ပြီးပါပြီ (24 နာရီ)', 'info');
        } else {
            state.usageUsed = data.usageUsed || 0;
            state.ttsCount = data.ttsCount || 0;
            state.srtCount = data.srtCount || 0;
        }
    }
}

function setupUsageTracking() {
    // Check for auto reset on load
    checkAutoReset();
    
    // Check auto reset periodically (every hour)
    setInterval(checkAutoReset, 60 * 60 * 1000);
    
    // Hide manual reset button (auto reset only)
    if (elements.resetUsage) {
        elements.resetUsage.style.display = 'none';
    }

    updateUsageDisplay();
}

function updateUsageDisplay() {
    const remaining = state.usageLimit - state.usageUsed;
    
    elements.usageUsed.textContent = state.usageUsed.toLocaleString();
    elements.usageRemaining.textContent = remaining.toLocaleString();
    elements.ttsCount.textContent = state.ttsCount;
    elements.srtCount.textContent = state.srtCount;
    
    // Update circular progress
    const percentage = (state.usageUsed / state.usageLimit) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;
    
    elements.usageCircle.style.strokeDashoffset = offset;
    
    // Update home page usage bar
    const usageFill = document.querySelector('.usage-fill');
    if (usageFill) {
        usageFill.style.width = `${percentage}%`;
    }
}

// ===== State Management =====
function saveState() {
    localStorage.setItem('amkyaw_tts_state', JSON.stringify({
        usageUsed: state.usageUsed,
        ttsCount: state.ttsCount,
        srtCount: state.srtCount,
        lastResetTime: Date.now()
    }));
}

function loadState() {
    checkAutoReset();
    updateUsageDisplay();
}

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
    const toast = elements.toast;
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon svg');
    
    toastMessage.textContent = message;
    
    // Update icon color based on type
    const colors = {
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)'
    };
    
    toastIcon.style.color = colors[type] || colors.success;
    toast.style.borderColor = colors[type] || colors.success;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Add SVG Gradient Definition =====
document.addEventListener('DOMContentLoaded', () => {
    // Add gradient to usage circle
    const svg = document.querySelector('.usage-circle svg');
    if (svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'gradient';
        gradient.innerHTML = `
            <stop offset="0%" stop-color="#FF6B35"/>
            <stop offset="100%" stop-color="#FF8C5A"/>
        `;
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    }
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'studio') {
            elements.generateBtn.click();
        }
    }
    
    // Escape to close mobile menu
    if (e.key === 'Escape') {
        elements.navLinks.classList.remove('open');
        elements.mobileMenuBtn.classList.remove('active');
    }
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements that should animate on scroll
document.querySelectorAll('.feature-card, .animate-card').forEach(el => {
    observer.observe(el);
});
