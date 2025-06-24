// js/utils/helpers.js - Utility Functions

// DOM Helper Functions
const DOM = {
    // Get element by ID
    get: (id) => document.getElementById(id),
    
    // Create element with optional attributes and content
    create: (tag, attrs = {}, content = '') => {
        const element = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        if (content) element.textContent = content;
        return element;
    },
    
    // Show/hide elements
    show: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.style.display = 'block';
    },
    
    hide: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.style.display = 'none';
    },
    
    // Toggle element visibility
    toggle: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    // Clear element content
    clear: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.innerHTML = '';
    },
    
    // Add class
    addClass: (element, className) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.classList.add(className);
    },
    
    // Remove class
    removeClass: (element, className) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.classList.remove(className);
    },
    
    // Toggle class
    toggleClass: (element, className) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.classList.toggle(className);
    },
    
    // Set element content (HTML)
    setContent: (element, content) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.innerHTML = content;
    },
    
    // Set element text content (safer than innerHTML)
    setText: (element, text) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.textContent = text;
    },
    
    // Get element value
    getValue: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        return element ? element.value : '';
    },
    
    // Set element value
    setValue: (element, value) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.value = value;
    },
    
    // Get element text content
    getText: (element) => {
        if (typeof element === 'string') element = DOM.get(element);
        return element ? element.textContent : '';
    },
    
    // Set element attributes
    setAttr: (element, attr, value) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.setAttribute(attr, value);
    },
    
    // Get element attributes
    getAttr: (element, attr) => {
        if (typeof element === 'string') element = DOM.get(element);
        return element ? element.getAttribute(attr) : null;
    },
    
    // Check if element has class
    hasClass: (element, className) => {
        if (typeof element === 'string') element = DOM.get(element);
        return element ? element.classList.contains(className) : false;
    },
    
    // Set element styles
    setStyle: (element, styles) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element && typeof styles === 'object') {
            Object.entries(styles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        }
    },
    
    // Animate element
    animate: (element, keyframes, options = {}) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            const defaultOptions = { duration: 300, easing: 'ease' };
            return element.animate(keyframes, { ...defaultOptions, ...options });
        }
    },
    
    // Pulse animation for feedback
    pulse: (element, duration = 300) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            element.style.animation = `pulse ${duration}ms`;
            setTimeout(() => {
                element.style.animation = '';
            }, duration);
        }
    },
    
    // Fade in element
    fadeIn: (element, duration = 300) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            let opacity = 0;
            const increment = 1 / (duration / 16);
            
            const fade = () => {
                opacity += increment;
                element.style.opacity = opacity;
                
                if (opacity < 1) {
                    requestAnimationFrame(fade);
                }
            };
            
            requestAnimationFrame(fade);
        }
    },
    
    // Fade out element
    fadeOut: (element, duration = 300) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            let opacity = 1;
            const decrement = 1 / (duration / 16);
            
            const fade = () => {
                opacity -= decrement;
                element.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(fade);
                } else {
                    element.style.display = 'none';
                }
            };
            
            requestAnimationFrame(fade);
        }
    }
};

// Screen Management
const ScreenManager = {
    currentScreen: null,
    
    // Show a specific screen
    show: (screenId) => {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = DOM.get(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            ScreenManager.currentScreen = screenId;
        }
    },
    
    // Get current screen
    getCurrent: () => ScreenManager.currentScreen,
    
    // Navigate back (if previous screen is known)
    back: (fallbackScreen = 'welcome-screen') => {
        // For now, just go to fallback
        ScreenManager.show(fallbackScreen);
    }
};

// Toast Notifications
const Toast = {
    // Show toast message
    show: (message, type = 'success', duration = 3000) => {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = DOM.create('div', { className: 'toast-container' });
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = DOM.create('div', {
            className: `toast ${type}`
        });
        
        // Add icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle toast-icon"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle toast-icon"></i>';
        }
        
        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
        
        console.log(`🍞 Toast: ${type} - ${message}`);
    },
    
    // Show success toast
    success: (message, duration = 3000) => {
        Toast.show(message, 'success', duration);
    },
    
    // Show error toast
    error: (message, duration = 3000) => {
        Toast.show(message, 'error', duration);
    },
    
    // Show warning toast
    warning: (message, duration = 3000) => {
        Toast.show(message, 'warning', duration);
    },
    
    // Show info toast
    info: (message, duration = 3000) => {
        Toast.show(message, 'info', duration);
    }
};

// Local Storage Helper
const Storage = {
    // Get item from localStorage
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    // Set item in localStorage
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },
    
    // Remove item from localStorage
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    // Clear all localStorage
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Form Validation Helpers
const Validation = {
    // Validate password strength
    passwordStrength: (password) => {
        if (!password) return { score: 0, text: '', color: '' };
        
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        const levels = [
            { score: 0, text: '', color: '' },
            { score: 1, text: 'Very Weak', color: 'strength-weak' },
            { score: 2, text: 'Weak', color: 'strength-weak' },
            { score: 3, text: 'Medium', color: 'strength-medium' },
            { score: 4, text: 'Good', color: 'strength-good' },
            { score: 5, text: 'Strong', color: 'strength-strong' }
        ];
        
        return levels[Math.min(score, 5)];
    },
    
    // Validate mnemonic phrase
    mnemonic: (phrase) => {
        if (!phrase) return { valid: false, error: 'Mnemonic phrase is required' };
        
        const words = phrase.trim().split(/\s+/);
        
        if (words.length !== 12) {
            return { valid: false, error: 'Mnemonic must contain exactly 12 words' };
        }
        
        for (const word of words) {
            if (window.CTC_WORD_LIST && !window.CTC_WORD_LIST.includes(word.toLowerCase())) {
                return { valid: false, error: `Invalid word: ${word}` };
            }
        }
        
        return { valid: true };
    },
    
    // Validate email address
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate CTC address
    address: (address) => {
        if (!address) return false;
        return address.startsWith('CTC') && address.length === 24;
    },
    
    // Validate amount
    amount: (amount, maxAmount = null) => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            return { valid: false, error: 'Betrag muss größer als 0 sein' };
        }
        
        if (maxAmount && num > maxAmount) {
            return { valid: false, error: 'Betrag übersteigt verfügbares Guthaben' };
        }
        
        return { valid: true };
    }
};

// Formatting Helpers
const Format = {
    // Format CTC amount
    ctc: (amount, decimals = 4) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '0.0000 CTC';
        return num.toFixed(decimals) + ' CTC';
    },
    
    // Format USD amount
    usd: (amount, decimals = 2) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '$0.00';
        return '$' + num.toFixed(decimals);
    },
    
    // Format address (truncate middle)
    address: (address, startChars = 6, endChars = 4) => {
        if (!address || address.length <= startChars + endChars) return address;
        return address.substring(0, startChars) + '...' + address.substring(address.length - endChars);
    },
    
    // Format date
    date: (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(date).toLocaleDateString('de-DE', { ...defaultOptions, ...options });
    },
    
    // Format time ago
    timeAgo: (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'gerade eben';
        if (diffMins < 60) return `vor ${diffMins}m`;
        if (diffHours < 24) return `vor ${diffHours}h`;
        if (diffDays < 7) return `vor ${diffDays}d`;
        
        return Format.date(date, { month: 'short', day: 'numeric' });
    }
};

// Utility Functions
const Utils = {
    // Copy text to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },
    
    // Generate random ID
    generateId: (length = 8) => {
        return Math.random().toString(36).substring(2, 2 + length);
    },
    
    // Sleep/delay function
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: (func, limit) => {
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
    },
    
    // Deep clone object
    clone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Check if device is mobile
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

// Animation helpers
const Animation = {
    // Smooth scroll to element
    scrollTo: (element, offset = 0) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            const y = element.offsetTop + offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    },
    
    // Highlight element temporarily
    highlight: (element, duration = 1000) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            element.style.transition = 'all 0.3s ease';
            element.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.6)';
            
            setTimeout(() => {
                element.style.boxShadow = '';
            }, duration);
        }
    }
};

// Export all helpers to global scope
window.DOM = DOM;
window.ScreenManager = ScreenManager;
window.Toast = Toast;
window.Storage = Storage;
window.Validation = Validation;
window.Format = Format;
window.Utils = Utils;
window.Animation = Animation;

console.log('🛠️ Helper functions loaded successfully');
