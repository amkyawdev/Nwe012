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

        // Show loading state
        elements.generateBtn.classList.add('loading');
        elements.generateBtn.disabled = true;

        try {
            // Use Web Speech API for TTS (no API key needed)
            await speakText(text, state.selectedVoice);
            
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
            
        } catch (error) {
            console.error('TTS Error:', error);
            showToast('အမှားဖြစ်ပွားသည်: ' + error.message, 'error');
        } finally {
            elements.generateBtn.classList.remove('loading');
            elements.generateBtn.disabled = false;
        }
    });
}

// ===== Web Speech API TTS =====
function speakText(text, voice) {
    return new Promise((resolve, reject) => {
        // Check if speech synthesis is supported
        if (!('speechSynthesis' in window)) {
            reject(new Error('Browser does not support speech synthesis'));
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language to Burmese/Myanmar
        utterance.lang = 'my-MM';
        
        // Adjust rate based on voice selection
        utterance.rate = 0.9;
        utterance.pitch = voice === 'thiha' ? 0.8 : 1.2;
        
        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices();
        
        // Look for Myanmar voices first, then fallback to any Burmese-supporting voice
        let selectedVoice = voices.find(v => v.lang.includes('my')) ||
                           voices.find(v => v.lang.includes('MM')) ||
                           voices.find(v => v.lang.includes('Burmese')) ||
                           voices[0]; // Fallback to first available voice
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Handle events
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
            if (event.error !== 'canceled') {
                reject(new Error(event.error || 'Speech synthesis failed'));
            } else {
                resolve(); // Consider cancel as success
            }
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
    });
}

// Preload voices
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

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
function setupUsageTracking() {
    elements.resetUsage.addEventListener('click', () => {
        state.usageUsed = 0;
        state.ttsCount = 0;
        state.srtCount = 0;
        
        saveState();
        updateUsageDisplay();
        
        showToast('Reset ပြီးပါပြီ', 'success');
    });

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
        srtCount: state.srtCount
    }));
}

function loadState() {
    const saved = localStorage.getItem('amkyaw_tts_state');
    if (saved) {
        const data = JSON.parse(saved);
        state.usageUsed = data.usageUsed || 0;
        state.ttsCount = data.ttsCount || 0;
        state.srtCount = data.srtCount || 0;
        updateUsageDisplay();
    }
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
