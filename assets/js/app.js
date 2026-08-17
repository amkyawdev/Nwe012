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

        // Show loading state
        elements.generateBtn.classList.add('loading');
        elements.generateBtn.disabled = true;

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
                // Show audio player
                showAudioPlayer(data.audio, data.format, text);
                
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
            showToast('အမှားဖြစ်ပွားသည်: ' + error.message, 'error');
        } finally {
            elements.generateBtn.classList.remove('loading');
            elements.generateBtn.disabled = false;
        }
    });
}

// ===== Audio Player =====
let currentAudioData = null;

function showAudioPlayer(audioData, format, text) {
    // Remove existing player
    const existingPlayer = document.querySelector('.audio-player');
    if (existingPlayer) {
        existingPlayer.remove();
    }

    // Create audio player element
    const playerDiv = document.createElement('div');
    playerDiv.className = 'audio-player';
    playerDiv.innerHTML = `
        <div class="audio-player-content">
            <div class="audio-header">
                <span class="audio-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                    Generated Audio
                </span>
                <button class="audio-close" onclick="closeAudioPlayer()">×</button>
            </div>
            <div class="audio-info">
                <span class="audio-badge">${format.toUpperCase()}</span>
                <span class="audio-chars">${text.length} characters</span>
            </div>
            <audio controls id="generatedAudio">
                <source src="${audioData}" type="audio/${format}">
                Your browser does not support audio playback.
            </audio>
            <div class="audio-actions">
                <button class="btn btn-primary btn-download" onclick="downloadAudio('${audioData}', '${format}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" x2="12" y1="15" y2="3"/>
                    </svg>
                    Download ${format.toUpperCase()}
                </button>
            </div>
        </div>
    `;

    // Insert after the studio card
    const studioCard = document.querySelector('.studio-card');
    if (studioCard) {
        studioCard.parentNode.insertBefore(playerDiv, studioCard.nextSibling);
    }

    // Auto play
    const audio = document.getElementById('generatedAudio');
    audio.play().catch(err => console.log('Auto-play blocked:', err));

    // Store for download
    currentAudioData = { audioData, format, text };
}

function closeAudioPlayer() {
    const player = document.querySelector('.audio-player');
    if (player) {
        player.remove();
    }
    currentAudioData = null;
}

function downloadAudio(audioData, format) {
    if (!audioData) return;

    // Convert base64 to blob
    const byteCharacters = atob(audioData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `audio/${format}` });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `myanmar-tts-${Date.now()}.${format}`;
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
