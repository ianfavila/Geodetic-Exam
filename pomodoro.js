// DOM Elements
const timerDisplay = document.getElementById('timer');
const timerMode = document.getElementById('timerMode');
const timerMessage = document.getElementById('timerMessage');
const progressBar = document.getElementById('progressBar');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const fullscreenToggle = document.getElementById('fullscreenToggle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const settingsForm = document.getElementById('settingsForm');
const focusTimeInput = document.getElementById('focusTime');
const breakTimeInput = document.getElementById('breakTime');
const breakMusicSelect = document.getElementById('breakMusic');
const proctorCheckbox = document.getElementById('proctorCheck');
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notificationTitle');
const notificationMessage = document.getElementById('notificationMessage');
const notificationIcon = document.getElementById('notificationIcon');
const volumeToggle = document.getElementById('volumeToggle');
const proctorContainer = document.getElementById('proctorContainer');
const proctorVideo = document.getElementById('proctorVideo');
const proctorMessage = document.getElementById('proctorMessage');

// Timer State
let timer = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let totalTime = 25 * 60;
let isRunning = false;
let isFocusMode = true;
let soundEnabled = true;
let breakMusic = null;

// Proctor Check State
let proctorEnabled = false;
let proctorStream = null;
let faceDetectionInterval = null;
let warningLevel = 0;
let absentTime = 0;
let lastAbsentTimestamp = null;
let warningTimeout = null;
let warningSound = null;

// Warning Sounds
const warningSounds = [
    'warning1.mp3',
    'warning2.mp3',
    'warning3.mp3',
    'buzzer.mp3'
];

// Create audio objects
let focusCompleteSound = null;
let breakCompleteSound = null;
const breakSounds = [];
const resumeSounds = [];

// Track which sound to play next
let currentBreakSoundIndex = 0;
let currentResumeSoundIndex = 0;

// Function to initialize all audio objects
function initializeAudio() {
    try {
        console.log('Initializing audio objects...');
        
        // Initialize completion sounds
        focusCompleteSound = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c8a44407d7.mp3?filename=success-1-6297.mp3');
        breakCompleteSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_942421d825.mp3?filename=cool-notification-2-21095.mp3');
        
        // Set volume for completion sounds
        focusCompleteSound.volume = 0.5;
        breakCompleteSound.volume = 0.5;
        
        // Initialize break sounds
        for (let i = 0; i < 5; i++) {
            const soundFile = i === 0 ? 'break.mp3' : `break${i}.mp3`;
            const sound = new Audio(soundFile);
            sound.volume = 0.5;
            breakSounds.push(sound);
        }
        
        // Initialize resume sounds
        for (let i = 0; i < 5; i++) {
            const soundFile = i === 0 ? 'resume.mp3' : `resume${i}.mp3`;
            const sound = new Audio(soundFile);
            sound.volume = 0.5;
            resumeSounds.push(sound);
        }
        
        console.log('Audio initialization complete');
        console.log(`Created ${breakSounds.length} break sounds and ${resumeSounds.length} resume sounds`);
        
        // Preload all sound files
        preloadAudio();
    } catch (err) {
        console.error('Error initializing audio:', err);
    }
}

// Function to get the next break sound
function getNextBreakSound() {
    try {
        if (breakSounds.length === 0) {
            console.error('No break sounds available');
            return null;
        }
        
        const sound = breakSounds[currentBreakSoundIndex];
        currentBreakSoundIndex = (currentBreakSoundIndex + 1) % breakSounds.length;
        console.log(`Selected break sound ${currentBreakSoundIndex}`);
        return sound;
    } catch (err) {
        console.error('Error getting next break sound:', err);
        return null;
    }
}

// Function to get the next resume sound
function getNextResumeSound() {
    try {
        if (resumeSounds.length === 0) {
            console.error('No resume sounds available');
            return null;
        }
        
        const sound = resumeSounds[currentResumeSoundIndex];
        currentResumeSoundIndex = (currentResumeSoundIndex + 1) % resumeSounds.length;
        console.log(`Selected resume sound ${currentResumeSoundIndex}`);
        return sound;
    } catch (err) {
        console.error('Error getting next resume sound:', err);
        return null;
    }
}

// Function to shuffle the sound indices (can be called to randomize)
function shuffleSounds() {
    try {
        currentBreakSoundIndex = Math.floor(Math.random() * breakSounds.length);
        currentResumeSoundIndex = Math.floor(Math.random() * resumeSounds.length);
        console.log(`Shuffled sound indices: break=${currentBreakSoundIndex}, resume=${currentResumeSoundIndex}`);
    } catch (err) {
        console.error('Error shuffling sound indices:', err);
    }
}

// Initialize settings from storage or defaults
function initializeSettings() {
    try {
        console.log('Initializing settings...');
        // Get settings from localStorage or use defaults
        const savedFocusTime = localStorage.getItem('focusTime') || 25;
        const savedBreakTime = localStorage.getItem('breakTime') || 5;
        const savedBreakMusic = localStorage.getItem('breakMusic') || 'happybreak.mp3';
        const savedSoundEnabled = localStorage.getItem('soundEnabled') === null 
            ? true 
            : localStorage.getItem('soundEnabled') === 'true';
        const savedProctorEnabled = localStorage.getItem('proctorEnabled') === 'true';
        
        console.log(`Loaded settings - Focus: ${savedFocusTime}, Break: ${savedBreakTime}, Music: ${savedBreakMusic}, Sound: ${savedSoundEnabled}, Proctor: ${savedProctorEnabled}`);
        
        // Set input values
        focusTimeInput.value = savedFocusTime;
        breakTimeInput.value = savedBreakTime;
        
        // Set break music if option exists
        if (breakMusicSelect.querySelector(`option[value="${savedBreakMusic}"]`)) {
            breakMusicSelect.value = savedBreakMusic;
        }
        
        soundEnabled = savedSoundEnabled;
        
        // Set proctor checkbox
        if (proctorCheckbox) {
            proctorCheckbox.checked = savedProctorEnabled;
            proctorEnabled = savedProctorEnabled;
            
            // Initialize proctor if enabled
            if (proctorEnabled && isFocusMode) {
                initializeProctor();
            }
        }
        
        // Update sound icon
        volumeToggle.innerHTML = soundEnabled 
            ? '<i class="fas fa-volume-up"></i>' 
            : '<i class="fas fa-volume-mute"></i>';
        
        // Set initial timer value
        timeLeft = parseInt(savedFocusTime) * 60;
        totalTime = timeLeft;
        
        // Update display
        updateDisplay();
        console.log('Settings initialization complete');
    } catch (err) {
        console.error('Error initializing settings:', err);
        // Set default values if error occurs
        focusTimeInput.value = 25;
        breakTimeInput.value = 5;
        timeLeft = 25 * 60;
        totalTime = timeLeft;
        updateDisplay();
    }
}

// Save settings to localStorage
function saveSettingsToStorage() {
    try {
        localStorage.setItem('focusTime', focusTimeInput.value);
        localStorage.setItem('breakTime', breakTimeInput.value);
        localStorage.setItem('breakMusic', breakMusicSelect.value);
        localStorage.setItem('soundEnabled', soundEnabled);
        
        if (proctorCheckbox) {
            localStorage.setItem('proctorEnabled', proctorCheckbox.checked);
        }
        
        console.log('Settings saved to storage');
    } catch (err) {
        console.error('Error saving settings to storage:', err);
    }
}

// Preload audio files for better performance
function preloadAudio() {
    try {
        console.log('Preloading audio files...');
        
        // Preload completion sounds
        if (focusCompleteSound) focusCompleteSound.load();
        if (breakCompleteSound) breakCompleteSound.load();
        
        // Preload all break sounds
        breakSounds.forEach((sound, index) => {
            if (sound) {
                sound.load();
                console.log(`Loaded break sound ${index}`);
            }
        });
        
        // Preload all resume sounds
        resumeSounds.forEach((sound, index) => {
            if (sound) {
                sound.load();
                console.log(`Loaded resume sound ${index}`);
            }
        });
        
        // Preload background music
        try {
            const happyMusic = new Audio('happybreak.mp3');
            const meditateMusic = new Audio('meditate.mp3');
            
            happyMusic.load();
            meditateMusic.load();
            console.log('Preloaded background music');
        } catch (err) {
            console.error('Error preloading background music:', err);
        }
        
        // Preload warning sounds
        try {
            warningSounds.forEach((soundFile, index) => {
                const sound = new Audio(soundFile);
                sound.load();
                console.log(`Loaded warning sound ${index}: ${soundFile}`);
            });
        } catch (err) {
            console.error('Error preloading warning sounds:', err);
        }
        
        console.log('Audio preloading complete');
    } catch (err) {
        console.error('Error preloading audio:', err);
    }
}

// Function to start break music
function startBreakMusic() {
    try {
        console.log('Starting break music...');
        // First, stop any playing music
        stopBreakMusic();
        
        // Check if sound is enabled and we're in break mode
        if (soundEnabled && !isFocusMode) {
            const musicChoice = breakMusicSelect.value;
            
            // Only play if not set to "none"
            if (musicChoice !== 'none') {
                console.log(`Playing music: ${musicChoice}`);
                breakMusic = new Audio(musicChoice);
                breakMusic.volume = 0.3; // Lower volume for background music
                breakMusic.loop = true;
                
                // Play music with error handling
                const playPromise = breakMusic.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.error('Error playing break music:', err);
                    });
                }
            } else {
                console.log('Music choice is "none", not playing any music');
            }
        } else {
            if (!soundEnabled) {
                console.log('Sound is disabled, not playing break music');
            }
            if (isFocusMode) {
                console.log('Not in break mode, not playing break music');
            }
        }
    } catch (err) {
        console.error('Error in startBreakMusic function:', err);
    }
}

// Function to stop break music
function stopBreakMusic() {
    try {
        if (breakMusic) {
            console.log('Stopping break music');
            breakMusic.pause();
            breakMusic.currentTime = 0;
            breakMusic = null;
        }
    } catch (err) {
        console.error('Error stopping break music:', err);
    }
}

// Function to play a warning sound based on warning level
function playWarningSound(level) {
    try {
        if (!soundEnabled) return;
        
        // Stop any currently playing warning sound
        if (warningSound) {
            warningSound.pause();
            warningSound.currentTime = 0;
        }
        
        // Get the appropriate warning sound based on level (0-3)
        const soundIndex = Math.min(level, warningSounds.length - 1);
        const soundFile = warningSounds[soundIndex];
        
        console.log(`Playing warning sound level ${level}: ${soundFile}`);
        
        warningSound = new Audio(soundFile);
        warningSound.volume = 0.7;
        
        const playPromise = warningSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.error(`Error playing warning sound ${soundFile}:`, err);
            });
        }
    } catch (err) {
        console.error('Error playing warning sound:', err);
    }
}

// Update timer display
function updateDisplay() {
    try {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = ((totalTime - timeLeft) / totalTime) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update document title
        document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Pomodoro`;
    } catch (err) {
        console.error('Error updating display:', err);
    }
}

// Timer countdown function
function countdown() {
    try {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            // Timer completed
            clearInterval(timer);
            isRunning = false;
            
            if (isFocusMode) {
                // Completed focus time, switch to break
                showNotification(
                    'Focus Time Complete!', 
                    'Oops, Future Engineer! Break first!',
                    'fa-check-circle',
                    'break'
                );
                
                // Play break sound
                if (soundEnabled) {
                    try {
                        console.log('Playing break completion sounds');
                        const breakSound = getNextBreakSound();
                        if (breakSound) {
                            const playPromise = breakSound.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(err => console.error('Error playing break sound:', err));
                            }
                            
                            // Play completion sound after the break sound
                            setTimeout(() => {
                                if (focusCompleteSound) {
                                    focusCompleteSound.play().catch(err => console.error('Error playing complete sound:', err));
                                }
                            }, 500);
                        }
                    } catch (err) {
                        console.error('Error in break sound playback:', err);
                    }
                }
                
                switchToBreakMode();
            } else {
                // Completed break time, switch to focus
                showNotification(
                    'Break Time Complete!', 
                    'Ready to get back to your review?',
                    'fa-brain'
                );
                
                // Play resume sound
                if (soundEnabled) {
                    try {
                        console.log('Playing resume completion sounds');
                        const resumeSound = getNextResumeSound();
                        if (resumeSound) {
                            const playPromise = resumeSound.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(err => console.error('Error playing resume sound:', err));
                            }
                            
                            // Play completion sound after the resume sound
                            setTimeout(() => {
                                if (breakCompleteSound) {
                                    breakCompleteSound.play().catch(err => console.error('Error playing complete sound:', err));
                                }
                            }, 500);
                        }
                    } catch (err) {
                        console.error('Error in resume sound playback:', err);
                    }
                }
                
                switchToFocusMode();
            }
            
            // Auto-start the next timer
            startTimer();
        }
    } catch (err) {
        console.error('Error in countdown function:', err);
        clearInterval(timer);
        isRunning = false;
    }
}

// Start timer function
function startTimer() {
    try {
        if (!isRunning) {
            console.log(`Starting timer in ${isFocusMode ? 'focus' : 'break'} mode`);
            isRunning = true;
            timer = setInterval(countdown, 1000);
            
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            timerMessage.textContent = isFocusMode ? 
                "You're making great progress! Stay focused." : 
                "Take a moment to relax and recharge.";
            
            // If starting a break, make sure music is playing
            if (!isFocusMode) {
                startBreakMusic();
                
                // If in break mode, stop proctor check
                stopProctorCheck();
            } else if (proctorEnabled) {
                // If in focus mode and proctor is enabled, start it
                initializeProctor();
            }
        }
    } catch (err) {
        console.error('Error starting timer:', err);
    }
}

// Pause timer function
function pauseTimer() {
    try {
        if (isRunning) {
            console.log('Pausing timer');
            clearInterval(timer);
            isRunning = false;
            
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            
            timerMessage.textContent = "Timer paused. Resume when you're ready.";
            
            // Pause music if in break mode
            if (!isFocusMode && breakMusic) {
                breakMusic.pause();
            }
            
            // Pause proctor check in focus mode
            if (isFocusMode && proctorEnabled) {
                pauseProctorCheck();
            }
        }
    } catch (err) {
        console.error('Error pausing timer:', err);
    }
}

// Reset timer function
function resetTimer() {
    try {
        console.log('Resetting timer');
        clearInterval(timer);
        isRunning = false;
        
        // Reset to current mode settings
        if (isFocusMode) {
            timeLeft = parseInt(focusTimeInput.value) * 60;
        } else {
            timeLeft = parseInt(breakTimeInput.value) * 60;
        }
        totalTime = timeLeft;
        
        updateDisplay();
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        timerMessage.textContent = isFocusMode ? 
            "Ready to start your review session?" : 
            "Ready for a break?";
            
        // If in break mode and reset, stop music and restart it when timer starts again
        if (!isFocusMode) {
            stopBreakMusic();
        }
        
        // Reset proctor check in focus mode
        if (isFocusMode && proctorEnabled) {
            resetProctorCheck();
        }
    } catch (err) {
        console.error('Error resetting timer:', err);
    }
}

// Skip to next timer mode
function skipTimer() {
    try {
        console.log('Skipping to next timer mode');
        const wasRunning = isRunning;
        
        if (isRunning) {
            clearInterval(timer);
            isRunning = false;
        }
        
        if (isFocusMode) {
            switchToBreakMode();
        } else {
            switchToFocusMode();
        }
        
        resetTimer();
        
        // Automatically start the timer if it was running before
        if (wasRunning) {
            startTimer();
        }
    } catch (err) {
        console.error('Error skipping timer:', err);
    }
}

// Switch to focus mode
function switchToFocusMode() {
    try {
        console.log('Switching to focus mode');
        isFocusMode = true;
        timeLeft = parseInt(focusTimeInput.value) * 60;
        totalTime = timeLeft;
        
        timerMode.textContent = "Focus Time";
        timerMode.classList.remove('break');
        progressBar.classList.remove('break');
        startBtn.classList.add('start');
        startBtn.classList.remove('break');
        
        timerMessage.textContent = "Ready to start your review session?";
        
        updateDisplay();
        
        // Stop any playing break music
        stopBreakMusic();
        
        // If proctor is enabled, initialize it
        if (proctorEnabled && isRunning) {
            initializeProctor();
        }
        
        // If this was triggered by skipping (not by timer ending), play sound
        if (isRunning && soundEnabled) {
            try {
                console.log('Playing resume sound on skip');
                const resumeSound = getNextResumeSound();
                if (resumeSound) {
                    const playPromise = resumeSound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => console.error('Error playing resume sound:', err));
                    }
                }
            } catch (err) {
                console.error('Error in resume sound playback:', err);
            }
        }
    } catch (err) {
        console.error('Error switching to focus mode:', err);
    }
}

// Switch to break mode
function switchToBreakMode() {
    try {
        console.log('Switching to break mode');
        isFocusMode = false;
        timeLeft = parseInt(breakTimeInput.value) * 60;
        totalTime = timeLeft;
        
        timerMode.textContent = "Break Time";
        timerMode.classList.add('break');
        progressBar.classList.add('break');
        startBtn.classList.remove('start');
        startBtn.classList.add('break');
        
        timerMessage.textContent = "Time to take a short break!";
        
        updateDisplay();
        
        // Start break music
        startBreakMusic();
        
        // Stop proctor check during breaks
        stopProctorCheck();
        
        // If this was triggered by skipping (not by timer ending), play sound
        if (isRunning && soundEnabled) {
            try {
                console.log('Playing break sound on skip');
                const breakSound = getNextBreakSound();
                if (breakSound) {
                    const playPromise = breakSound.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => console.error('Error playing break sound:', err));
                    }
                }
            } catch (err) {
                console.error('Error in break sound playback:', err);
            }
        }
    } catch (err) {
        console.error('Error switching to break mode:', err);
    }
}

// Toggle fullscreen mode
function toggleFullscreen() {
    try {
        document.body.classList.toggle('fullscreen');
        
        if (document.body.classList.contains('fullscreen')) {
            fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i>';
            
            // Browser fullscreen API
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('Error attempting to enable fullscreen:', err);
                });
            }
        } else {
            fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i>';
            
            // Exit browser fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    } catch (err) {
        console.error('Error toggling fullscreen:', err);
    }
}

// Show notification
function showNotification(title, message, icon, type = '') {
    try {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notificationIcon.innerHTML = `<i class="fas ${icon}"></i>`;
        
        if (type === 'break') {
            notificationIcon.classList.add('break');
        } else {
            notificationIcon.classList.remove('break');
        }
        
        notification.classList.add('show');
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    } catch (err) {
        console.error('Error showing notification:', err);
    }
}

// Toggle sound
function toggleSound() {
    try {
        soundEnabled = !soundEnabled;
        
        if (soundEnabled) {
            volumeToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            
            // If in break mode, restart the break music
            if (!isFocusMode) {
                startBreakMusic();
            }
        } else {
            volumeToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            
            // Stop any playing break music
            stopBreakMusic();
            
            // Stop any playing warning sound
            if (warningSound) {
                warningSound.pause();
                warningSound.currentTime = 0;
                warningSound = null;
            }
        }
        
        // Save sound preference
        saveSettingsToStorage();
    } catch (err) {
        console.error('Error toggling sound:', err);
    }
}

// Show settings modal
function showSettings() {
    try {
        settingsModal.style.display = 'block';
    } catch (err) {
        console.error('Error showing settings:', err);
    }
}

// Hide settings modal
function hideSettings() {
    try {
        settingsModal.style.display = 'none';
    } catch (err) {
        console.error('Error hiding settings:', err);
    }
}

// Save settings
function saveSettings(e) {
    try {
        e.preventDefault();
        
        // Ensure values are within range
        if (focusTimeInput.value < 1) focusTimeInput.value = 1;
        if (focusTimeInput.value > 120) focusTimeInput.value = 120;
        
        if (breakTimeInput.value < 1) breakTimeInput.value = 1;
        if (breakTimeInput.value > 30) breakTimeInput.value = 30;
        
        // Update proctor setting
        const newProctorEnabled = proctorCheckbox.checked;
        
        // If proctor setting changed
        if (proctorEnabled !== newProctorEnabled) {
            proctorEnabled = newProctorEnabled;
            
            // Start or stop proctor based on new setting
            if (proctorEnabled && isFocusMode && isRunning) {
                initializeProctor();
            } else if (!proctorEnabled) {
                stopProctorCheck();
            }
        }
        
        // Update current timer if needed
        if (isFocusMode) {
            timeLeft = parseInt(focusTimeInput.value) * 60;
            totalTime = timeLeft;
        } else {
            timeLeft = parseInt(breakTimeInput.value) * 60;
            totalTime = timeLeft;
            
            // If currently in break mode, restart the music with the new selection
            stopBreakMusic();
            startBreakMusic();
        }
        
        updateDisplay();
        hideSettings();
        
        // Save settings to storage
        saveSettingsToStorage();
        
        // Briefly show a notification
        showNotification(
            'Settings Saved', 
            'Your timer settings have been updated.',
            'fa-check'
        );
    } catch (err) {
        console.error('Error saving settings:', err);
    }
}

// Initialize Proctor Check
function initializeProctor() {
    try {
        // If proctor is not enabled or we're not in focus mode, do nothing
        if (!proctorEnabled || !isFocusMode || !isRunning) {
            console.log('Skipping proctor initialization - not enabled, not in focus mode, or timer not running');
            return;
        }
        
        console.log('Initializing proctor check...');
        
        // Stop any existing proctor check
        stopProctorCheck();
        
        // Reset warning state
        resetProctorWarnings();
        
        // Check for camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Camera not supported in this browser');
            showNotification(
                'Camera Not Supported', 
                'Proctor check requires camera access.',
                'fa-exclamation-triangle'
            );
            return;
        }
        
        // Request camera access
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                console.log('Camera access granted');
                proctorStream = stream;
                
                // Set up video element
                proctorVideo.srcObject = stream;
                proctorContainer.classList.add('active');
                
                // Start monitoring presence
                startPresenceDetection();
            })
            .catch(err => {
                console.error('Error accessing camera:', err);
                showNotification(
                    'Camera Access Denied', 
                    'Please enable camera access for proctor check.',
                    'fa-exclamation-triangle'
                );
            });
    } catch (err) {
        console.error('Error initializing proctor:', err);
    }
}

// Start presence detection
function startPresenceDetection() {
    try {
        // If face detection is already running, stop it first
        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
        }
        
        console.log('Starting presence detection');
        
        // Use a simple interval to simulate presence detection
        // In a real app, this would use face detection API or machine learning
        faceDetectionInterval = setInterval(() => {
            // Simulate random presence detection (90% chance of being present)
            // In a real implementation, you would use actual face detection here
            const isPresent = Math.random() > 0.1;
            
            if (isPresent) {
                // User is present
                userPresent();
            } else {
                // User is not present
                userAbsent();
            }
        }, 2000); // Check every 2 seconds
    } catch (err) {
        console.error('Error starting presence detection:', err);
    }
}

// Handle user present
function userPresent() {
    try {
        // Reset the absent time counter if user was previously absent
        if (lastAbsentTimestamp !== null) {
            console.log('User detected - reset warning system');
            resetProctorWarnings();
            
            // Remove warning UI
            proctorContainer.classList.remove('warning');
            proctorMessage.classList.remove('active');
            
            // Stop any warning sound
            if (warningSound) {
                warningSound.pause();
                warningSound.currentTime = 0;warningSound.currentTime = 0;
                warningSound = null;
            }
            
            // Clear any scheduled warnings
            if (warningTimeout) {
                clearTimeout(warningTimeout);
                warningTimeout = null;
            }
        }
    } catch (err) {
        console.error('Error in userPresent function:', err);
    }
}

// Handle user absent
function userAbsent() {
    try {
        // If this is the first time we detect absence, record the timestamp
        if (lastAbsentTimestamp === null) {
            console.log('User absence detected - starting warning system');
            lastAbsentTimestamp = Date.now();
            
            // Show warning UI
            proctorContainer.classList.add('warning');
            proctorMessage.classList.add('active');
        }
        
        // Calculate how long the user has been absent
        const currentTime = Date.now();
        const absentSeconds = Math.floor((currentTime - lastAbsentTimestamp) / 1000);
        
        console.log(`User has been absent for ${absentSeconds} seconds, warning level: ${warningLevel}`);
        
        // Check if we need to escalate the warning level
        // Every 30 seconds, escalate the warning level
        if (absentSeconds >= 30 && absentSeconds < 60 && warningLevel === 0) {
            escalateWarning(1); // First warning
        } else if (absentSeconds >= 60 && absentSeconds < 90 && warningLevel === 1) {
            escalateWarning(2); // Second warning
        } else if (absentSeconds >= 90 && warningLevel === 2) {
            escalateWarning(3); // Final warning/buzzer
        }
    } catch (err) {
        console.error('Error in userAbsent function:', err);
    }
}

// Escalate warning level
function escalateWarning(level) {
    try {
        console.log(`Escalating warning to level ${level}`);
        warningLevel = level;
        
        // Clear any previous timeout
        if (warningTimeout) {
            clearTimeout(warningTimeout);
        }
        
        // Play warning sound for the current level
        playWarningSound(level);
        
        // Update warning message
        switch (level) {
            case 1:
                proctorMessage.textContent = "You're not visible! First warning.";
                break;
            case 2:
                proctorMessage.textContent = "You're not visible! Second warning.";
                break;
            case 3:
                proctorMessage.textContent = "You're not visible! Final warning!";
                break;
        }
        
        // Show notification
        showNotification(
            `Absence Warning ${level}/3`, 
            "Please return to your study session!",
            'fa-exclamation-triangle',
            'break'
        );
        
        // For the last level, repeat the warning sound every 30 seconds
        if (level === 3) {
            warningTimeout = setTimeout(() => {
                playWarningSound(3);
                warningTimeout = null;
            }, 30000);
        }
    } catch (err) {
        console.error('Error escalating warning:', err);
    }
}

// Reset proctor warnings
function resetProctorWarnings() {
    try {
        console.log('Resetting proctor warnings');
        warningLevel = 0;
        lastAbsentTimestamp = null;
        absentTime = 0;
        
        // Clear any scheduled warnings
        if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
        }
        
        // Stop any warning sound
        if (warningSound) {
            warningSound.pause();
            warningSound.currentTime = 0;
            warningSound = null;
        }
    } catch (err) {
        console.error('Error resetting proctor warnings:', err);
    }
}

// Stop proctor check
function stopProctorCheck() {
    try {
        console.log('Stopping proctor check');
        
        // Stop presence detection
        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = null;
        }
        
        // Stop camera stream
        if (proctorStream) {
            proctorStream.getTracks().forEach(track => track.stop());
            proctorStream = null;
        }
        
        // Hide video container
        proctorContainer.classList.remove('active');
        proctorContainer.classList.remove('warning');
        proctorMessage.classList.remove('active');
        
        // Reset warnings
        resetProctorWarnings();
        
        // Clear video source
        if (proctorVideo) {
            proctorVideo.srcObject = null;
        }
    } catch (err) {
        console.error('Error stopping proctor check:', err);
    }
}

// Pause proctor check
function pauseProctorCheck() {
    try {
        console.log('Pausing proctor check');
        
        // Pause face detection interval
        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = null;
        }
        
        // Don't stop the camera stream, just pause the detection
        
        // Reset any active warnings
        if (lastAbsentTimestamp !== null) {
            resetProctorWarnings();
            proctorContainer.classList.remove('warning');
            proctorMessage.classList.remove('active');
        }
    } catch (err) {
        console.error('Error pausing proctor check:', err);
    }
}

// Set up all event listeners
function setupEventListeners() {
    try {
        console.log('Setting up event listeners');
        
        // Timer controls
        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);
        skipBtn.addEventListener('click', skipTimer);
        
        // UI controls
        fullscreenToggle.addEventListener('click', toggleFullscreen);
        volumeToggle.addEventListener('click', toggleSound);
        settingsBtn.addEventListener('click', showSettings);
        closeSettings.addEventListener('click', hideSettings);
        
        // Settings form
        settingsForm.addEventListener('submit', function(e) {
            saveSettings(e);
        });
        
        // Close settings modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                hideSettings();
            }
        });
        
        // Handle ESC key for exiting fullscreen and closing modals
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (document.body.classList.contains('fullscreen')) {
                    toggleFullscreen();
                }
                if (settingsModal.style.display === 'block') {
                    hideSettings();
                }
            }
        });
        
        console.log('Event listeners set up successfully');
    } catch (err) {
        console.error('Error setting up event listeners:', err);
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('DOM loaded, initializing timer...');
        
        // First, initialize audio
        initializeAudio();
        
        // Then initialize settings
        initializeSettings();
        
        // Shuffle sounds for variety
        shuffleSounds();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Timer initialization complete');
        
        // Show initialization notification
        showNotification(
            'Pomodoro Timer Ready', 
            'Let\'s boost your productivity with proctor monitoring!',
            'fa-check-circle'
        );
    } catch (err) {
        console.error('Error during initialization:', err);
    }
});
// Simple function to play MP3 files
function playWarningSound(level) {
    // Don't play sounds if sound is disabled
    if (!soundEnabled) return;
    
    // Define the file paths to your sounds - make sure these match your file names exactly
    let soundFile;
    
    switch(level) {
        case 1:
            soundFile = "warning1.mp3"; // First warning
            break;
        case 2:
            soundFile = "warning2.mp3"; // Second warning
            break;
        case 3:
            soundFile = "warning3.mp3"; // Third warning
            break;
        case 4:
            soundFile = "buzzer.mp3"; // Buzzer for repeated warnings
            break;
        default:
            console.error("Invalid warning level:", level);
            return;
    }
    
    console.log(`Attempting to play sound file: ${soundFile}`);
    
    try {
        // Create a new Audio object each time
        const audio = new Audio(soundFile);
        
        // Set volume
        audio.volume = 0.7;
        
        // Force preload
        audio.preload = "auto";
        
        // Play the sound with error handling
        audio.play().catch(error => {
            console.error(`Failed to play ${soundFile}:`, error);
            console.log("Check that the file exists and the path is correct");
        });
    } catch (err) {
        console.error(`Error playing sound ${soundFile}:`, err);
    }
}

// Update the userAbsent function to handle warnings correctly
function userAbsent() {
    try {
        // If this is the first time we detect absence, record the timestamp
        if (lastAbsentTimestamp === null) {
            console.log('User absence detected - starting warning system');
            lastAbsentTimestamp = Date.now();
            
            // Show warning UI
            proctorContainer.classList.add('warning');
            proctorMessage.classList.add('active');
            proctorMessage.textContent = "You're not visible!";
        }
        
        // Calculate how long the user has been absent
        const currentTime = Date.now();
        const absentSeconds = Math.floor((currentTime - lastAbsentTimestamp) / 1000);
        
        console.log(`User has been absent for ${absentSeconds} seconds, warning level: ${warningLevel}`);
        
        // Check if we need to escalate the warning level
        if (absentSeconds >= 30 && absentSeconds < 60 && warningLevel < 1) {
            // First warning at 30 seconds
            escalateWarning(1);
        } else if (absentSeconds >= 60 && absentSeconds < 90 && warningLevel < 2) {
            // Second warning at 60 seconds
            escalateWarning(2);
        } else if (absentSeconds >= 90 && warningLevel < 3) {
            // Third warning at 90 seconds
            escalateWarning(3);
        } else if (absentSeconds >= 120 && (absentSeconds - 90) % 30 === 0) {
            // Buzzer every 30 seconds after 120 seconds
            console.log("Playing buzzer for continued absence");
            playWarningSound(4);
            
            // Show notification for continued absence
            showNotification(
                'Prolonged Absence!', 
                'Please return immediately!',
                'fa-exclamation-triangle',
                'break'
            );
        }
    } catch (err) {
        console.error('Error in userAbsent function:', err);
    }
}

// Simplify the escalateWarning function
function escalateWarning(level) {
    try {
        console.log(`Escalating warning to level ${level}`);
        warningLevel = level;
        
        // Play warning sound for the current level
        playWarningSound(level);
        
        // Update warning message
        switch (level) {
            case 1:
                proctorMessage.textContent = "You're not visible! First warning.";
                break;
            case 2:
                proctorMessage.textContent = "You're not visible! Second warning.";
                break;
            case 3:
                proctorMessage.textContent = "You're not visible! Final warning!";
                break;
        }
        
        // Show notification
        showNotification(
            `Absence Warning ${level}/3`, 
            "Please return to your study session!",
            'fa-exclamation-triangle',
            'break'
        );
    } catch (err) {
        console.error('Error escalating warning:', err);
    }
}