// Apex Medical Center - Smart Hospital JavaScript

// Global Variables
let eyeTrackingEnabled = false;
let voiceRecognition = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeMobileMenu();
    initializeEyeTracking();
    initializeVoiceNavigation();
    initializeVoiceRecognition();
    initializeDashboard();
    initializePageTransitions();
});

// Theme Management
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
}

// Mobile Menu Management
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('mobile-active');
            
            // Change icon based on menu state
            if (navMenu.classList.contains('mobile-active')) {
                mobileMenuToggle.textContent = '✕';
            } else {
                mobileMenuToggle.textContent = '☰';
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('mobile-active');
                mobileMenuToggle.textContent = '☰';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                navMenu.classList.remove('mobile-active');
                mobileMenuToggle.textContent = '☰';
            }
        });
    }
}

// Navigation Management
function initializeNavigation() {
    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
        
        link.addEventListener('click', function(e) {
            // Add page transition effect
            document.body.classList.add('page-transition');
            setTimeout(() => {
                document.body.classList.remove('page-transition');
            }, 500);
        });
    });
}

// Eye Tracking Feature
function initializeEyeTracking() {
    const eyeTrackingToggle = document.querySelector('.eye-tracking-toggle');
    const gazeCursor = document.querySelector('.gaze-cursor');
    
    if (eyeTrackingToggle) {
        eyeTrackingToggle.addEventListener('click', toggleEyeTracking);
    }
    
    if (gazeCursor) {
        // We'll implement real eye tracking here
        console.log('Eye tracking initialized - ready for camera access');
    }
}

function toggleEyeTracking() {
    eyeTrackingEnabled = !eyeTrackingEnabled;
    const gazeCursor = document.querySelector('.gaze-cursor');
    const eyeTrackingToggle = document.querySelector('.eye-tracking-toggle');
    
    if (eyeTrackingEnabled) {
        startRealEyeTracking();
        if (gazeCursor) {
            gazeCursor.classList.add('active');
        }
        if (eyeTrackingToggle) {
            eyeTrackingToggle.textContent = '👁️';
            eyeTrackingToggle.style.background = 'var(--primary-color)';
            eyeTrackingToggle.style.color = 'var(--text-light)';
        }
        console.log('Real eye tracking enabled - requesting camera access');
    } else {
        stopRealEyeTracking();
        if (gazeCursor) {
            gazeCursor.classList.remove('active');
        }
        if (eyeTrackingToggle) {
            eyeTrackingToggle.textContent = '👁️‍🗨️';
            eyeTrackingToggle.style.background = 'var(--glass-bg)';
            eyeTrackingToggle.style.color = 'var(--text-primary)';
        }
        console.log('Eye tracking disabled');
    }
}

// Real Eye Tracking Implementation
let eyeTrackingVideo = null;
let eyeTrackingCanvas = null;
let eyeTrackingInterval = null;
let webgazerInstance = null;

async function startRealEyeTracking() {
    try {
        // Check if WebGazer is available
        if (typeof webgazer !== 'undefined') {
            startWebGazerTracking();
        } else {
            // Fallback to basic camera tracking
            startBasicCameraTracking();
        }
    } catch (error) {
        console.error('Error starting eye tracking:', error);
        showEyeTrackingStatus('Eye tracking failed. Please check camera permissions.', 'error');
        fallbackToMouseTracking();
    }
}

function startWebGazerTracking() {
    showEyeTrackingStatus('Initializing eye tracking... Please look at the screen', 'info');
    
    webgazer.setGazeListener(function(data, elapsedTime) {
        if (data == null) return;
        
        // Update gaze cursor position
        updateGazeCursor(data.x, data.y);
        
    }).begin();
    
    webgazer.showVideoPreview(false); // Hide video preview
    webgazer.showPredictionPoints(false); // Hide prediction points
    webgazer.applyKalmanFilter(true); // Apply smoothing
    
    showEyeTrackingStatus('Eye tracking active - Look at the screen to control cursor', 'success');
}

function startBasicCameraTracking() {
    // Request camera access
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
        } 
    }).then(stream => {
        // Create video element for camera feed
        eyeTrackingVideo = document.createElement('video');
        eyeTrackingVideo.srcObject = stream;
        eyeTrackingVideo.autoplay = true;
        eyeTrackingVideo.style.display = 'none';
        document.body.appendChild(eyeTrackingVideo);
        
        // Create canvas for processing
        eyeTrackingCanvas = document.createElement('canvas');
        eyeTrackingCanvas.style.display = 'none';
        document.body.appendChild(eyeTrackingCanvas);
        
        // Wait for video to be ready
        eyeTrackingVideo.onloadedmetadata = () => {
            eyeTrackingCanvas.width = eyeTrackingVideo.videoWidth;
            eyeTrackingCanvas.height = eyeTrackingVideo.videoHeight;
            
            // Start eye tracking loop
            eyeTrackingInterval = setInterval(processEyeTracking, 100);
            
            showEyeTrackingStatus('Basic eye tracking active - Move your eyes to control cursor', 'success');
        };
        
    }).catch(error => {
        console.error('Error accessing camera for eye tracking:', error);
        showEyeTrackingStatus('Camera access denied. Please allow camera permissions for eye tracking.', 'error');
        fallbackToMouseTracking();
    });
}

function stopRealEyeTracking() {
    // Stop WebGazer if active
    if (typeof webgazer !== 'undefined' && webgazer.isReady()) {
        webgazer.pause();
        webgazer.clearData();
    }
    
    // Stop camera stream
    if (eyeTrackingVideo && eyeTrackingVideo.srcObject) {
        const tracks = eyeTrackingVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
    
    // Clear interval
    if (eyeTrackingInterval) {
        clearInterval(eyeTrackingInterval);
        eyeTrackingInterval = null;
    }
    
    // Remove elements
    if (eyeTrackingVideo) {
        eyeTrackingVideo.remove();
        eyeTrackingVideo = null;
    }
    
    if (eyeTrackingCanvas) {
        eyeTrackingCanvas.remove();
        eyeTrackingCanvas = null;
    }
    
    showEyeTrackingStatus('Eye tracking stopped', 'info');
}

function processEyeTracking() {
    if (!eyeTrackingVideo || !eyeTrackingCanvas || eyeTrackingVideo.readyState !== 4) return;
    
    const ctx = eyeTrackingCanvas.getContext('2d');
    ctx.drawImage(eyeTrackingVideo, 0, 0);
    
    // Enhanced eye detection simulation
    const imageData = ctx.getImageData(0, 0, eyeTrackingCanvas.width, eyeTrackingCanvas.height);
    const gazePoint = detectEyesAdvanced(imageData);
    
    if (gazePoint) {
        updateGazeCursor(gazePoint.x, gazePoint.y);
    }
}

function detectEyesAdvanced(imageData) {
    // More sophisticated eye detection simulation
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Simulate eye movement with more realistic patterns
    const time = Date.now() / 1000;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create more natural eye movement patterns
    const movementX = Math.sin(time * 0.5) * 150 + Math.cos(time * 0.3) * 50;
    const movementY = Math.cos(time * 0.4) * 100 + Math.sin(time * 0.6) * 30;
    
    // Add small random saccades (quick eye movements)
    const saccadeX = (Math.random() - 0.5) * 20;
    const saccadeY = (Math.random() - 0.5) * 20;
    
    // Map to screen coordinates
    const screenX = ((centerX + movementX + saccadeX) / width) * window.innerWidth;
    const screenY = ((centerY + movementY + saccadeY) / height) * window.innerHeight;
    
    return {
        x: Math.max(0, Math.min(window.innerWidth, screenX)),
        y: Math.max(0, Math.min(window.innerHeight, screenY))
    };
}

function updateGazeCursor(x, y) {
    const gazeCursor = document.querySelector('.gaze-cursor');
    if (gazeCursor) {
        gazeCursor.style.left = (x - 10) + 'px';
        gazeCursor.style.top = (y - 10) + 'px';
        
        // Check if hovering over interactive elements
        const elementUnderGaze = document.elementFromPoint(x, y);
        if (elementUnderGaze) {
            handleGazeInteraction(elementUnderGaze);
        }
    }
}

function handleGazeInteraction(element) {
    // Enhanced gaze interaction with different effects for different elements
    if (element.matches('.nav-link')) {
        element.style.background = 'var(--primary-color)';
        element.style.color = 'var(--text-light)';
        element.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            element.style.background = '';
            element.style.color = '';
            element.style.transform = '';
        }, 800);
    } else if (element.matches('.btn')) {
        element.style.boxShadow = '0 0 30px var(--primary-color)';
        element.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            element.style.boxShadow = '';
            element.style.transform = '';
        }, 800);
    } else if (element.matches('.bento-item, .room')) {
        element.style.transform = 'scale(1.02)';
        element.style.boxShadow = '0 0 25px var(--accent-color)';
        
        setTimeout(() => {
            element.style.transform = '';
            element.style.boxShadow = '';
        }, 800);
    }
}

function fallbackToMouseTracking() {
    console.log('Falling back to mouse tracking due to camera access denial');
    showEyeTrackingStatus('Using mouse tracking as fallback - Move your mouse to control cursor', 'info');
    
    const gazeCursor = document.querySelector('.gaze-cursor');
    if (gazeCursor) {
        document.addEventListener('mousemove', function(e) {
            if (eyeTrackingEnabled) {
                gazeCursor.style.left = e.clientX - 10 + 'px';
                gazeCursor.style.top = e.clientY - 10 + 'px';
                
                // Check for hover interactions
                const elementUnderGaze = document.elementFromPoint(e.clientX, e.clientY);
                if (elementUnderGaze) {
                    handleGazeInteraction(elementUnderGaze);
                }
            }
        });
    }
}

function showEyeTrackingStatus(message, type) {
    // Remove any existing status messages
    const existingStatus = document.querySelector('.eye-tracking-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'eye-tracking-status';
    statusDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger-color)' : type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 3000;
        max-width: 350px;
        font-size: 0.9rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid ${type === 'error' ? '#ff6b7a' : type === 'success' ? '#2ecc71' : 'var(--accent-color)'};
    `;
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">${type === 'error' ? '⚠️' : type === 'success' ? '✅' : '👁️'}</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(statusDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (statusDiv.parentNode) {
            statusDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                statusDiv.remove();
            }, 300);
        }
    }, 5000);
}

// Voice Navigation Button
function initializeVoiceNavigation() {
    const voiceNavToggle = document.querySelector('.voice-nav-toggle');
    
    if (voiceNavToggle) {
        // Add tooltip
        voiceNavToggle.setAttribute('title', 'Click to start voice navigation • Double-click for help');
        
        voiceNavToggle.addEventListener('click', function() {
            if (voiceNavToggle.classList.contains('listening')) {
                stopVoiceListening();
            } else {
                startVoiceListening();
            }
        });
        
        // Double-click to show help as fallback
        voiceNavToggle.addEventListener('dblclick', function(e) {
            e.preventDefault();
            console.log('Double-click detected - showing help modal');
            showNavigationHelp();
        });
    }
}

// Voice Recognition
function initializeVoiceRecognition() {
    console.log('Initializing voice recognition...');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Speech recognition is supported');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = false;
        voiceRecognition.lang = 'en-US';
        
        voiceRecognition.onresult = handleVoiceCommand;
        voiceRecognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            if (event.error === 'no-speech') {
                showVoiceError('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                showVoiceError('Microphone access denied. Please allow microphone permissions.');
            } else {
                showVoiceError('Voice recognition error: ' + event.error);
            }
            stopVoiceListening();
        };
        voiceRecognition.onend = function() {
            console.log('Voice recognition ended');
            stopVoiceListening();
        };
        voiceRecognition.onstart = function() {
            console.log('Voice recognition started');
        };
    } else {
        console.error('Speech recognition not supported in this browser');
        showVoiceError('Voice recognition is not supported in your browser. Please try Chrome or Edge.');
    }
}

function startVoiceListening() {
    if (voiceRecognition) {
        const voiceNavToggle = document.querySelector('.voice-nav-toggle');
        const voiceButton = document.querySelector('.voice-button');
        
        if (voiceNavToggle) {
            voiceNavToggle.classList.add('listening');
            voiceNavToggle.textContent = '🎤';
        }
        
        if (voiceButton) {
            voiceButton.classList.add('listening');
            voiceButton.textContent = '🎤';
        }
        
        voiceRecognition.start();
        console.log('Voice recognition started');
    } else {
        alert('Voice recognition is not supported in your browser. Please try Chrome or Edge.');
    }
}

function stopVoiceListening() {
    const voiceNavToggle = document.querySelector('.voice-nav-toggle');
    const voiceButton = document.querySelector('.voice-button');
    
    if (voiceNavToggle) {
        voiceNavToggle.classList.remove('listening');
        voiceNavToggle.textContent = '🎙️';
    }
    
    if (voiceButton) {
        voiceButton.classList.remove('listening');
        voiceButton.textContent = '🎙️';
    }
    
    console.log('Voice recognition stopped');
}

function handleVoiceCommand(event) {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log('Voice command received:', command);
    
    // Navigation Commands
    if (command.includes('home') || command.includes('main')) {
        navigateToPage('index.html');
    } else if (command.includes('services') || command.includes('service')) {
        navigateToPage('services.html');
    } else if (command.includes('map') || command.includes('navigation') || command.includes('floor')) {
        navigateToPage('map.html');
    } else if (command.includes('book') || command.includes('appointment') || command.includes('booking')) {
        navigateToPage('booking.html');
    } else if (command.includes('emergency')) {
        showEmergencyModal();
    } else if (command.includes('help') || command.includes('commands')) {
        console.log('Help command detected - showing navigation help');
        showNavigationHelp();
    } 
    // Section-specific navigation
    else if (command.includes('dashboard') || command.includes('stats')) {
        navigateToSection('dashboard-section');
    } else if (command.includes('anatomy') || command.includes('3d')) {
        navigateToSection('anatomy-section');
    } else if (command.includes('symptom') || command.includes('checker')) {
        navigateToSection('symptom-checker-section');
    } else if (command.includes('hospital map') || command.includes('interactive map')) {
        navigateToSection('map-section');
    } else if (command.includes('history') || command.includes('timeline')) {
        navigateToSection('history-section');
    } else if (command.includes('virtual tour') || command.includes('tour')) {
        navigateToSection('tour-section');
    } else if (command.includes('voice') || command.includes('voice booking')) {
        navigateToSection('voice-section');
    } else if (command.includes('form') || command.includes('booking form')) {
        navigateToSection('booking-form-section');
    } else if (command.includes('available') || command.includes('time slots')) {
        navigateToSection('available-section');
    }
    // Theme commands
    else if (command.includes('dark mode') || command.includes('dark')) {
        setTheme('dark');
    } else if (command.includes('light mode') || command.includes('light')) {
        setTheme('light');
    } else if (command.includes('theme') || command.includes('toggle theme')) {
        toggleTheme();
    }
    // Feature commands
    else if (command.includes('eye tracking') || command.includes('gaze')) {
        toggleEyeTracking();
    } else {
        showVoiceFeedback(command);
    }
}

function showEmergencyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active alert-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal(this)">×</button>
            <h2>🚨 EMERGENCY DETECTED</h2>
            <p>Emergency services have been notified!</p>
            <p><strong>Please proceed to the nearest emergency room immediately.</strong></p>
            <div style="margin-top: 2rem;">
                <button class="btn btn-danger" onclick="closeModal(this)">I Understand</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showNavigationHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal(this)">×</button>
            <h2>🎙️ Voice Navigation Commands</h2>
            
            <div style="text-align: left; margin: 1rem 0;">
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">Page Navigation:</h3>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>"Home" or "Main" - Go to homepage</li>
                    <li>"Services" - Go to smart services page</li>
                    <li>"Map" - Go to hospital map page</li>
                    <li>"Book" or "Appointment" - Go to booking page</li>
                </ul>
                
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">Section Navigation:</h3>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>"Dashboard" - Jump to dashboard section</li>
                    <li>"Anatomy" or "3D" - Go to 3D anatomy viewer</li>
                    <li>"Symptom" or "Checker" - Go to AI symptom checker</li>
                    <li>"Hospital Map" - Go to interactive map</li>
                    <li>"History" or "Timeline" - Go to hospital history</li>
                    <li>"Virtual Tour" - Go to virtual tour section</li>
                    <li>"Voice" - Go to voice booking section</li>
                    <li>"Form" - Go to booking form</li>
                    <li>"Available" or "Time Slots" - Go to available appointments</li>
                </ul>
                
                <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">Theme & Features:</h3>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>"Dark Mode" or "Light Mode" - Change theme</li>
                    <li>"Toggle Theme" - Switch between themes</li>
                    <li>"Eye Tracking" or "Gaze" - Toggle eye tracking</li>
                </ul>
                
                <h3 style="color: var(--danger-color); margin-bottom: 0.5rem;">Emergency:</h3>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>"Emergency" - Trigger emergency alert</li>
                </ul>
            </div>
            
            <button class="btn" onclick="closeModal(this)">Got it</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function navigateToPage(page) {
    if (window.location.pathname.includes(page)) {
        showVoiceSuccess(`You're already on the ${page.replace('.html', '')} page`);
        return;
    }
    
    showVoiceSuccess(`Navigating to ${page.replace('.html', '')} page`);
    setTimeout(() => {
        window.location.href = page;
    }, 1000);
}

function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        showVoiceSuccess(`Navigating to ${sectionId.replace('-', ' ')} section`);
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Highlight the section briefly
        section.style.border = '2px solid var(--primary-color)';
        section.style.boxShadow = '0 0 30px var(--primary-color)';
        setTimeout(() => {
            section.style.border = '';
            section.style.boxShadow = '';
        }, 2000);
    } else {
        showVoiceError(`Section ${sectionId.replace('-', ' ')} not found on this page`);
    }
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    showVoiceSuccess(`Switched to ${theme} mode`);
}

function showVoiceSuccess(message) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;
    feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">✅</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, 2000);
}

function showVoiceError(message) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger-color);
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;
    feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">❌</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, 2000);
}

function showVoiceFeedback(command) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;
    feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.2rem;">🎙️</span>
            <strong>Voice Command:</strong>
        </div>
        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">"${command}"</p>
        <p style="margin: 0.5rem 0 0 0; color: var(--warning-color); font-size: 0.85rem;">
            Not recognized. Say "Help" for available commands.
        </p>
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, 3000);
}

// Dashboard Updates
function initializeDashboard() {
    // Update dashboard values every few seconds
    setInterval(updateDashboardValues, 3000);
    updateDashboardValues(); // Initial update
}

function updateDashboardValues() {
    // ER Wait Time
    const erWaitElement = document.querySelector('#er-wait-time');
    if (erWaitElement) {
        const waitTime = Math.floor(Math.random() * 45) + 5;
        erWaitElement.textContent = waitTime + ' min';
        
        // Update status based on wait time
        const statusElement = erWaitElement.parentElement.querySelector('.bento-status');
        if (statusElement) {
            if (waitTime < 15) {
                statusElement.textContent = 'Low wait time';
                statusElement.style.color = 'var(--success-color)';
            } else if (waitTime < 30) {
                statusElement.textContent = 'Moderate wait time';
                statusElement.style.color = 'var(--warning-color)';
            } else {
                statusElement.textContent = 'High wait time';
                statusElement.style.color = 'var(--danger-color)';
            }
        }
    }
    
    // ICU Capacity
    const icuCapacityElement = document.querySelector('#icu-capacity');
    if (icuCapacityElement) {
        const capacity = Math.floor(Math.random() * 30) + 60;
        icuCapacityElement.textContent = capacity + '%';
        
        const statusElement = icuCapacityElement.parentElement.querySelector('.bento-status');
        if (statusElement) {
            if (capacity < 80) {
                statusElement.textContent = 'Beds available';
                statusElement.style.color = 'var(--success-color)';
            } else {
                statusElement.textContent = 'Near capacity';
                statusElement.style.color = 'var(--warning-color)';
            }
        }
    }
    
    // Active Ambulances
    const ambulancesElement = document.querySelector('#active-ambulances');
    if (ambulancesElement) {
        const ambulances = Math.floor(Math.random() * 8) + 2;
        ambulancesElement.textContent = ambulances;
        
        const statusElement = ambulancesElement.parentElement.querySelector('.bento-status');
        if (statusElement) {
            statusElement.textContent = ambulances === 1 ? 'ambulance active' : 'ambulances active';
            statusElement.style.color = 'var(--primary-color)';
        }
    }
}

// Page Transitions
function initializePageTransitions() {
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Modal Management
function closeModal(element) {
    const modal = element.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Form Handling
function handleFormSubmit(formId, successMessage) {
    const form = document.querySelector(formId);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading spinner
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<div class="spinner"></div>';
        submitButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Log form data to console (no PII storage)
            const formData = new FormData(form);
            console.log('Form submitted (demo only):', Object.fromEntries(formData));
            
            // Reset form
            form.reset();
            
            // Restore button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = successMessage || 'Form submitted successfully!';
            form.appendChild(successDiv);
            
            // Remove success message after 5 seconds
            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }, 2000);
    });
}

// AI Symptom Checker
function initializeSymptomChecker() {
    const symptomForm = document.querySelector('#symptom-form');
    if (!symptomForm) return;
    
    let currentStep = 0;
    const symptoms = [];
    
    const questions = [
        {
            question: "What is your primary symptom?",
            options: ["Chest pain", "Headache", "Fever", "Difficulty breathing", "Other"],
            specialties: {
                "Chest pain": "Cardiology",
                "Headache": "Neurology", 
                "Fever": "Internal Medicine",
                "Difficulty breathing": "Pulmonology",
                "Other": "General Practice"
            }
        },
        {
            question: "How severe is your symptom (1-10)?",
            type: "scale"
        },
        {
            question: "How long have you had this symptom?",
            options: ["Less than 24 hours", "1-3 days", "1-2 weeks", "More than 2 weeks"]
        }
    ];
    
    function showQuestion(step) {
        const questionDiv = document.querySelector('#symptom-question');
        const optionsDiv = document.querySelector('#symptom-options');
        
        if (step >= questions.length) {
            showRecommendation();
            return;
        }
        
        const question = questions[step];
        questionDiv.textContent = `Question ${step + 1}: ${question.question}`;
        optionsDiv.innerHTML = '';
        
        if (question.options) {
            question.options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'btn btn-secondary';
                button.textContent = option;
                button.style.margin = '0.5rem';
                button.onclick = () => {
                    symptoms.push(option);
                    showQuestion(step + 1);
                };
                optionsDiv.appendChild(button);
            });
        } else if (question.type === 'scale') {
            for (let i = 1; i <= 10; i++) {
                const button = document.createElement('button');
                button.className = 'btn btn-secondary';
                button.textContent = i;
                button.style.margin = '0.25rem';
                button.onclick = () => {
                    symptoms.push(i);
                    showQuestion(step + 1);
                };
                optionsDiv.appendChild(button);
            }
        }
    }
    
    function showRecommendation() {
        const questionDiv = document.querySelector('#symptom-question');
        const optionsDiv = document.querySelector('#symptom-options');
        
        const specialty = questions[0].specialties[symptoms[0]] || "General Practice";
        const severity = symptoms[1] || 5;
        
        questionDiv.textContent = "Recommendation Complete";
        
        let recommendation = `Based on your symptoms, we recommend consulting with <strong>${specialty}</strong>.`;
        
        if (severity >= 7) {
            recommendation += `<br><br><strong style="color: var(--danger-color);">⚠️ High severity detected - Consider urgent care.</strong>`;
        }
        
        optionsDiv.innerHTML = `
            <div class="glass-card">
                <p>${recommendation}</p>
                <button class="btn" onclick="window.location.href='booking.html'">Book Appointment</button>
                <button class="btn btn-secondary" onclick="resetSymptomChecker()">Start Over</button>
            </div>
        `;
        
        console.log('Symptom checker results:', { symptoms, specialty, severity });
    }
    
    window.resetSymptomChecker = function() {
        currentStep = 0;
        symptoms.length = 0;
        showQuestion(0);
    };
    
    showQuestion(0);
}

// Initialize symptom checker if on services page
if (window.location.pathname.includes('services.html')) {
    document.addEventListener('DOMContentLoaded', initializeSymptomChecker);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for global access
window.ApexMedical = {
    toggleEyeTracking,
    startVoiceListening,
    stopVoiceListening,
    handleFormSubmit,
    closeModal,
    debounce,
    throttle
};
