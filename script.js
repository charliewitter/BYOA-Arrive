// Meditation Timer Application
class MeditationTimer {
    constructor() {
        this.defaultDuration = 30 * 60; // 30 minutes in seconds
        this.currentDuration = this.defaultDuration;
        this.remainingTime = this.currentDuration;
        this.isRunning = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.startTime = null;
        this.sessions = JSON.parse(localStorage.getItem('meditationSessions')) || [];
        this.stats = JSON.parse(localStorage.getItem('meditationStats')) || {
            totalMinutes: 0,
            totalSessions: 0,
            streak: 0,
            lastSessionDate: null,
            allTimeSessions: []
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.loadSessions();
        this.updateStatsDisplay();
    }

    initializeElements() {
        // Timer elements
        this.timerDisplay = document.getElementById('timer');
        this.currentDurationSpan = document.getElementById('current-duration');
        this.progressBar = document.getElementById('progress-bar');
        
        // Control elements
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.decreaseBtn = document.getElementById('decrease-time');
        this.increaseBtn = document.getElementById('increase-time');
        this.intervalBellCheckbox = document.getElementById('interval-bell');
        
        // Intention elements
        this.intentionInput = document.getElementById('intention');
        this.intentionDisplay = document.getElementById('intention-display');
        
        // Audio elements
        this.startGong = document.getElementById('start-gong');
        this.endGong = document.getElementById('end-gong');
        this.intervalChime = document.getElementById('interval-chime');
        
        // Session log elements
        this.sessionLogContainer = document.getElementById('session-log-container');
        this.sessionLog = document.getElementById('session-log');
        this.clearLogBtn = document.getElementById('clear-log');
        this.viewAllStatsBtn = document.getElementById('view-all-stats');
        
        // Stats elements
        this.totalMinutesElement = document.getElementById('total-minutes');
        this.sessionsCountElement = document.getElementById('sessions-count');
        this.currentStreakElement = document.getElementById('current-streak');
        this.averageSessionElement = document.getElementById('average-session');
        
        // Body element for timer running class
        this.body = document.body;
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.decreaseBtn.addEventListener('click', () => this.adjustTime(-5));
        this.increaseBtn.addEventListener('click', () => this.adjustTime(5));
        this.clearLogBtn.addEventListener('click', () => this.clearSessions());
        this.viewAllStatsBtn.addEventListener('click', () => this.showDetailedStats());
        
        // Intention input handling
        this.intentionInput.addEventListener('input', () => this.updateIntentionDisplay());
        this.intentionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.intentionInput.blur();
            }
        });
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        this.timerDisplay.textContent = this.formatTime(this.remainingTime);
        this.currentDurationSpan.textContent = `${this.currentDuration / 60} minutes`;
        
        // Update progress bar
        const progress = ((this.currentDuration - this.remainingTime) / this.currentDuration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    updateIntentionDisplay() {
        const intention = this.intentionInput.value.trim();
        if (intention) {
            this.intentionDisplay.textContent = `"${intention}"`;
            this.intentionDisplay.classList.remove('hidden');
        } else {
            this.intentionDisplay.classList.add('hidden');
        }
    }

    adjustTime(minutes) {
        if (this.isRunning) return;
        
        const newDuration = this.currentDuration + (minutes * 60);
        if (newDuration >= 300 && newDuration <= 7200) { // 5 minutes to 2 hours
            this.currentDuration = newDuration;
            this.remainingTime = this.currentDuration;
            this.updateDisplay();
        }
    }

    async playSound(audioElement) {
        try {
            audioElement.currentTime = 0;
            await audioElement.play();
        } catch (error) {
            console.log('Could not play audio:', error);
        }
    }

    startTimer() {
        if (this.isPaused) {
            // Resume from pause
            this.isPaused = false;
        } else {
            // Fresh start
            this.remainingTime = this.currentDuration;
            this.startTime = Date.now();
            this.playSound(this.startGong);
        }
        
        this.isRunning = true;
        this.body.classList.add('timer-running');
        this.startBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
        this.decreaseBtn.disabled = true;
        this.increaseBtn.disabled = true;
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateDisplay();
            
            // Check for interval bell (halfway point)
            if (this.intervalBellCheckbox.checked && 
                this.remainingTime === Math.floor(this.currentDuration / 2)) {
                this.playSound(this.intervalChime);
            }
            
            // Timer finished
            if (this.remainingTime <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        this.body.classList.remove('timer-running');
        
        clearInterval(this.timerInterval);
        
        this.startBtn.textContent = 'Resume';
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.body.classList.remove('timer-running');
        
        clearInterval(this.timerInterval);
        
        this.remainingTime = this.currentDuration;
        this.updateDisplay();
        
        this.startBtn.textContent = 'Begin Meditation';
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
        this.decreaseBtn.disabled = false;
        this.increaseBtn.disabled = false;
    }

    completeTimer() {
        this.isRunning = false;
        this.body.classList.remove('timer-running');
        
        clearInterval(this.timerInterval);
        this.playSound(this.endGong);
        
        // Log the session
        this.logSession();
        
        // Reset UI
        this.remainingTime = this.currentDuration;
        this.updateDisplay();
        
        this.startBtn.textContent = 'Begin Meditation';
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
        this.decreaseBtn.disabled = false;
        this.increaseBtn.disabled = false;
        
        // Show completion message
        this.showCompletionMessage();
    }

    logSession() {
        const now = new Date();
        const sessionMinutes = this.currentDuration / 60;
        const today = now.toDateString();
        
        const session = {
            id: Date.now(),
            duration: this.currentDuration,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            intention: this.intentionInput.value.trim() || null,
            completed: true,
            timestamp: now.getTime()
        };
        
        // Update recent sessions for display
        this.sessions.unshift(session);
        if (this.sessions.length > 10) {
            this.sessions = this.sessions.slice(0, 10);
        }
        
        // Update all-time statistics
        this.stats.totalMinutes += sessionMinutes;
        this.stats.totalSessions += 1;
        this.stats.allTimeSessions.push(session);
        
        // Update streak
        this.updateStreak(today);
        
        // Save to localStorage
        localStorage.setItem('meditationSessions', JSON.stringify(this.sessions));
        localStorage.setItem('meditationStats', JSON.stringify(this.stats));
        
        this.loadSessions();
        this.updateStatsDisplay();
    }

    updateStreak(today) {
        const lastSessionDate = this.stats.lastSessionDate;
        
        if (!lastSessionDate) {
            // First session ever
            this.stats.streak = 1;
        } else {
            const lastDate = new Date(lastSessionDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                // Same day, keep streak
                // Don't increment streak for multiple sessions on same day
            } else if (diffDays === 1) {
                // Consecutive day, increment streak
                this.stats.streak += 1;
            } else {
                // Missed days, reset streak
                this.stats.streak = 1;
            }
        }
        
        this.stats.lastSessionDate = today;
    }

    updateStatsDisplay() {
        this.totalMinutesElement.textContent = Math.round(this.stats.totalMinutes);
        this.sessionsCountElement.textContent = this.stats.totalSessions;
        this.currentStreakElement.textContent = this.stats.streak;
        
        const avgMinutes = this.stats.totalSessions > 0 
            ? Math.round(this.stats.totalMinutes / this.stats.totalSessions)
            : 0;
        this.averageSessionElement.textContent = avgMinutes;
    }

    loadSessions() {
        this.sessionLog.innerHTML = '';
        
        if (this.sessions.length === 0) {
            this.sessionLogContainer.style.display = 'none';
            return;
        }
        
        this.sessionLogContainer.style.display = 'block';
        
        this.sessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'session-entry';
            
            const sessionInfo = document.createElement('div');
            const timeSpan = document.createElement('div');
            timeSpan.className = 'session-time';
            timeSpan.textContent = `${session.duration / 60} minutes`;
            
            const dateSpan = document.createElement('div');
            dateSpan.className = 'session-date';
            dateSpan.textContent = `${session.date} at ${session.time}`;
            
            sessionInfo.appendChild(timeSpan);
            sessionInfo.appendChild(dateSpan);
            
            if (session.intention) {
                const intentionSpan = document.createElement('div');
                intentionSpan.className = 'session-intention';
                intentionSpan.textContent = `"${session.intention}"`;
                sessionInfo.appendChild(intentionSpan);
            }
            
            sessionElement.appendChild(sessionInfo);
            this.sessionLog.appendChild(sessionElement);
        });
    }

    clearSessions() {
        if (confirm('Are you sure you want to clear all meditation data? This will reset your total minutes, sessions, and streak.')) {
            this.sessions = [];
            this.stats = {
                totalMinutes: 0,
                totalSessions: 0,
                streak: 0,
                lastSessionDate: null,
                allTimeSessions: []
            };
            localStorage.removeItem('meditationSessions');
            localStorage.removeItem('meditationStats');
            this.loadSessions();
            this.updateStatsDisplay();
        }
    }

    showDetailedStats() {
        const hours = Math.floor(this.stats.totalMinutes / 60);
        const minutes = Math.round(this.stats.totalMinutes % 60);
        const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        const longestStreak = this.calculateLongestStreak();
        const thisWeekMinutes = this.getThisWeekMinutes();
        const thisMonthMinutes = this.getThisMonthMinutes();
        
        alert(`🧘‍♀️ Your Meditation Journey

Total Time: ${timeString} (${Math.round(this.stats.totalMinutes)} minutes)
Total Sessions: ${this.stats.totalSessions}
Current Streak: ${this.stats.streak} days
Longest Streak: ${longestStreak} days

This Week: ${Math.round(thisWeekMinutes)} minutes
This Month: ${Math.round(thisMonthMinutes)} minutes
Average Session: ${Math.round(this.stats.totalMinutes / this.stats.totalSessions || 0)} minutes

Keep up the great work! 🙏`);
    }

    calculateLongestStreak() {
        if (this.stats.allTimeSessions.length === 0) return 0;
        
        const sessions = this.stats.allTimeSessions.sort((a, b) => a.timestamp - b.timestamp);
        let longestStreak = 1;
        let currentStreak = 1;
        let lastDate = new Date(sessions[0].timestamp).toDateString();
        
        for (let i = 1; i < sessions.length; i++) {
            const currentDate = new Date(sessions[i].timestamp).toDateString();
            const daysDiff = Math.floor((new Date(currentDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 0) {
                // Same day, don't increment
                continue;
            } else if (daysDiff === 1) {
                // Consecutive day
                currentStreak++;
            } else {
                // Gap in days
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
            lastDate = currentDate;
        }
        
        return Math.max(longestStreak, currentStreak);
    }

    getThisWeekMinutes() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return this.stats.allTimeSessions
            .filter(session => session.timestamp > oneWeekAgo)
            .reduce((total, session) => total + (session.duration / 60), 0);
    }

    getThisMonthMinutes() {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return this.stats.allTimeSessions
            .filter(session => session.timestamp > oneMonthAgo)
            .reduce((total, session) => total + (session.duration / 60), 0);
    }

    showCompletionMessage() {
        // Create a temporary completion message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(107, 115, 255, 0.95);
            color: white;
            padding: 24px 32px;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: 500;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(10px);
        `;
        message.textContent = '🙏 Meditation Complete - Well Done!';
        
        document.body.appendChild(message);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    }
}

// Create placeholder audio files if they don't exist
function createAudioPlaceholders() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create simple tones for placeholders
    function createTone(frequency, duration, volume = 0.3) {
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * volume * Math.exp(-t * 2);
        }
        
        return buffer;
    }
    
    // Replace audio elements with Web Audio API generated sounds
    function replaceAudioElement(elementId, frequency, duration) {
        const element = document.getElementById(elementId);
        element.play = async function() {
            const source = audioContext.createBufferSource();
            source.buffer = createTone(frequency, duration);
            source.connect(audioContext.destination);
            source.start();
        };
    }
    
    // Create placeholder sounds
    replaceAudioElement('start-gong', 200, 2); // Deep gong
    replaceAudioElement('end-gong', 150, 3); // Deeper end gong
    replaceAudioElement('interval-chime', 800, 1); // Higher chime
}

// Ripple Effect Class
class RippleEffect {
    constructor() {
        this.rippleContainer = document.querySelector('.ripple-container');
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => this.createRipple(e));
    }

    createRipple(e) {
        // Throttle ripple creation to avoid too many ripples
        if (this.lastRippleTime && Date.now() - this.lastRippleTime < 800) {
            return;
        }
        this.lastRippleTime = Date.now();

        // Create a ripple group container
        const rippleGroup = document.createElement('div');
        rippleGroup.style.position = 'absolute';
        rippleGroup.style.pointerEvents = 'none';
        
        // Create 2 sequential ripple circles (fewer but larger)
        for (let i = 0; i < 2; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            
            // Larger base sizes for more dramatic effect
            const baseSize = 120 + (i * 60); // Much larger circles (120px, 180px)
            ripple.style.width = `${baseSize}px`;
            ripple.style.height = `${baseSize}px`;
            
            // Position all circles at the same center point
            ripple.style.left = `${e.clientX - baseSize / 2}px`;
            ripple.style.top = `${e.clientY - baseSize / 2}px`;
            
            // Add ripple to group
            rippleGroup.appendChild(ripple);
        }
        
        // Add ripple group to container
        this.rippleContainer.appendChild(rippleGroup);
        
        // Remove entire ripple group after animation completes
        setTimeout(() => {
            if (rippleGroup.parentNode) {
                rippleGroup.parentNode.removeChild(rippleGroup);
            }
        }, 5000); // Longer animation time + buffer
        
        // Clean up old ripples to prevent memory leaks
        this.cleanupOldRipples();
    }

    cleanupOldRipples() {
        const ripples = this.rippleContainer.children;
        if (ripples.length > 10) {
            // Remove oldest ripples if we have too many
            for (let i = 0; i < ripples.length - 10; i++) {
                this.rippleContainer.removeChild(ripples[0]);
            }
        }
    }
}

// Scroll Reveal Effect Class
class ScrollReveal {
    constructor() {
        this.container = document.querySelector('.container');
        this.scrollHint = document.querySelector('.scroll-hint');
        this.init();
    }

    init() {
        // Check scroll position on page load
        this.checkScrollPosition();
        
        // Listen for scroll events
        window.addEventListener('scroll', () => this.checkScrollPosition());
        
        // Smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    checkScrollPosition() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const triggerPoint = windowHeight * 0.3; // Trigger at 30% of viewport height
        
        if (scrollPosition > triggerPoint) {
            this.revealContainer();
            this.hideScrollHint();
        } else {
            this.hideContainer();
            this.showScrollHint();
        }
    }

    revealContainer() {
        this.container.classList.add('revealed');
    }

    hideContainer() {
        this.container.classList.remove('revealed');
    }

    showScrollHint() {
        if (this.scrollHint) {
            this.scrollHint.style.opacity = '1';
        }
    }

    hideScrollHint() {
        if (this.scrollHint) {
            this.scrollHint.style.opacity = '0';
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Create audio placeholders
    createAudioPlaceholders();
    
    // Initialize the meditation timer
    new MeditationTimer();
    
    // Initialize ripple effect
    new RippleEffect();
    
    // Initialize scroll reveal
    new ScrollReveal();
});

// Handle page visibility changes (pause timer when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.meditationTimer && window.meditationTimer.isRunning) {
        // Optional: You could pause the timer when the tab becomes hidden
        // For meditation, we'll let it continue running
    }
});
