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
    
    // Set element content
    setContent: (element, content) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) element.innerHTML = content;
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
        const toast = DOM.create('div', {
            className: `toast ${type === 'error' ? 'error' : ''}`
        }, message);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    },
    
    // Show success toast
    success: (message, duration = 3000) => {
        Toast.show(message, 'success', duration);
    },
    
    // Show error toast
    error: (message, duration = 3000) => {
        Toast.show(message, 'error', duration);
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
            if (!window.CTC_WORD_LIST.includes(word.toLowerCase())) {
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
            return { valid: false, error: 'Amount must be greater than 0' };
        }
        
        if (maxAmount && num > maxAmount) {
            return { valid: false, error: 'Amount exceeds available balance' };
        }
        
        return { valid: true };
    }
};

// Formatting Helpers
const Format = {
    // Format CTC amount
    ctc: (amount, decimals = 8) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return num.toFixed(decimals) + ' CTC';
    },
    
    // Format USD amount
    usd: (amount, decimals = 2) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
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
        
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },
    
    // Format time ago
    timeAgo: (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
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
        return Math.random().toString(36).substring(2, length + 2);
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
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    },
    
    // Sleep function
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Check if running in Telegram WebApp
    isTelegramWebApp: () => {
        return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
    },
    
    // Get Telegram WebApp instance
    getTelegramWebApp: () => {
        if (Utils.isTelegramWebApp()) {
            return window.Telegram.WebApp;
        }
        return null;
    }
};

// Animation Helpers
const Animation = {
    // Shake element
    shake: (element, duration = 500) => {
        if (typeof element === 'string') element = DOM.get(element);
        if (element) {
            element.style.animation = `shake ${duration}ms`;
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

// Export all helpers to global scope
window.DOM = DOM;
window.ScreenManager = ScreenManager;
window.Toast = Toast;
window.Storage = Storage;
window.Validation = Validation;
window.Format = Format;
window.Utils = Utils;
window.Animation = Animation;