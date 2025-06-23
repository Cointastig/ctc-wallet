// js/utils/helpers.js - DOM & Toast Utilities für Mobile CTC Wallet

// DOM-Manipulation Utilities
class DOMHelper {
    // Element finden
    static get(id) {
        return document.getElementById(id);
    }

    // Element-Wert abrufen
    static getValue(id) {
        const element = this.get(id);
        return element ? element.value : '';
    }

    // Element-Wert setzen
    static setValue(id, value) {
        const element = this.get(id);
        if (element) {
            element.value = value;
        }
    }

    // HTML-Inhalt setzen
    static setContent(id, html) {
        const element = this.get(id);
        if (element) {
            element.innerHTML = html;
        }
    }

    // Text-Inhalt setzen
    static setText(id, text) {
        const element = this.get(id);
        if (element) {
            element.textContent = text;
        }
    }

    // Element anzeigen
    static show(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    }

    // Element verstecken
    static hide(element) {
        if (typeof element === 'string') {
            element = this.get(element);
        }
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    // CSS-Klasse hinzufügen
    static addClass(id, className) {
        const element = this.get(id);
        if (element) {
            element.classList.add(className);
        }
    }

    // CSS-Klasse entfernen
    static removeClass(id, className) {
        const element = this.get(id);
        if (element) {
            element.classList.remove(className);
        }
    }

    // CSS-Klasse umschalten
    static toggleClass(id, className) {
        const element = this.get(id);
        if (element) {
            element.classList.toggle(className);
        }
    }

    // Element deaktivieren
    static disable(id) {
        const element = this.get(id);
        if (element) {
            element.disabled = true;
            element.classList.add('disabled');
        }
    }

    // Element aktivieren
    static enable(id) {
        const element = this.get(id);
        if (element) {
            element.disabled = false;
            element.classList.remove('disabled');
        }
    }

    // Event-Listener hinzufügen
    static on(id, event, handler) {
        const element = this.get(id);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    // Event-Listener entfernen
    static off(id, event, handler) {
        const element = this.get(id);
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    // Element erstellen
    static create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }

    // Query Selector
    static find(selector) {
        return document.querySelector(selector);
    }

    // Query Selector All
    static findAll(selector) {
        return document.querySelectorAll(selector);
    }

    // Scroll zum Element
    static scrollTo(id, behavior = 'smooth') {
        const element = this.get(id);
        if (element) {
            element.scrollIntoView({ behavior });
        }
    }

    // Form-Daten sammeln
    static getFormData(formId) {
        const form = this.get(formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // Input-Validierung
    static validateInput(id, rules = {}) {
        const element = this.get(id);
        if (!element) return false;
        
        const value = element.value;
        let isValid = true;
        let errors = [];
        
        // Required-Validierung
        if (rules.required && (!value || value.trim() === '')) {
            isValid = false;
            errors.push('This field is required');
        }
        
        // Min-Length-Validierung
        if (rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errors.push(`Minimum ${rules.minLength} characters required`);
        }
        
        // Max-Length-Validierung
        if (rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            errors.push(`Maximum ${rules.maxLength} characters allowed`);
        }
        
        // Pattern-Validierung
        if (rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errors.push('Invalid format');
        }
        
        // Benutzerdefinierte Validierung
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value);
            if (customResult !== true) {
                isValid = false;
                errors.push(customResult);
            }
        }
        
        // Validierungs-Status anzeigen
        this.showValidationStatus(id, isValid, errors);
        
        return isValid;
    }

    // Validierungs-Status anzeigen
    static showValidationStatus(id, isValid, errors = []) {
        const element = this.get(id);
        if (!element) return;
        
        // Entferne bestehende Validierungs-Klassen
        element.classList.remove('valid', 'invalid');
        
        // Neue Klasse hinzufügen
        element.classList.add(isValid ? 'valid' : 'invalid');
        
        // Fehlermeldung anzeigen/verstecken
        let errorDiv = element.parentElement.querySelector('.validation-error');
        
        if (!isValid && errors.length > 0) {
            if (!errorDiv) {
                errorDiv = this.create('div', { className: 'validation-error' });
                element.parentElement.appendChild(errorDiv);
            }
            errorDiv.textContent = errors[0];
            errorDiv.style.display = 'block';
        } else if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Loading-Zustand setzen
    static setLoading(id, isLoading = true, text = 'Loading...') {
        const element = this.get(id);
        if (!element) return;
        
        if (isLoading) {
            element.disabled = true;
            element.classList.add('loading');
            
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = `
                <span class="loading-spinner"></span>
                <span class="loading-text">${text}</span>
            `;
        } else {
            element.disabled = false;
            element.classList.remove('loading');
            
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-original-text');
            }
        }
    }

    // Mobile-spezifische Utilities
    static isMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    static isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    // Touch-Events
    static onTouch(id, handler) {
        const element = this.get(id);
        if (element) {
            element.addEventListener('touchstart', handler, { passive: true });
        }
    }

    // Viewport-Höhe anpassen (für mobile Browser)
    static adjustViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Safe Area Support (für Notch-Geräte)
    static setSafeAreaSupport() {
        if (this.isIOS()) {
            document.body.classList.add('has-safe-area');
        }
    }
}

// Toast-Benachrichtigungen
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 4000;
        this.init();
    }

    init() {
        // Toast-Container erstellen
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = this.defaultDuration, options = {}) {
        const toast = this.createToast(message, type, duration, options);
        this.addToast(toast);
        return toast.id;
    }

    createToast(message, type, duration, options) {
        const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const toast = {
            id: id,
            element: null,
            timer: null,
            type: type,
            message: message,
            duration: duration,
            persistent: options.persistent || false,
            action: options.action || null
        };

        // Toast-Element erstellen
        const element = document.createElement('div');
        element.id = id;
        element.className = `toast toast-${type}`;
        
        // Icon bestimmen
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        
        const icon = icons[type] || icons.info;
        
        // Toast-Inhalt
        let actionButton = '';
        if (toast.action) {
            actionButton = `
                <button class="toast-action" onclick="Toast.handleAction('${id}')">
                    ${toast.action.text}
                </button>
            `;
        }
        
        element.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${message}</div>
                ${actionButton}
                ${!toast.persistent ? '<button class="toast-close" onclick="Toast.dismiss(\'' + id + '\')">&times;</button>' : ''}
            </div>
            <div class="toast-progress"></div>
        `;
        
        toast.element = element;
        
        // Auto-Dismiss Timer (außer bei persistent)
        if (!toast.persistent && duration > 0) {
            const progressBar = element.querySelector('.toast-progress');
            
            // Progress-Animation
            if (progressBar) {
                progressBar.style.animation = `toast-progress ${duration}ms linear`;
            }
            
            toast.timer = setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
        
        return toast;
    }

    addToast(toast) {
        // Zu viele Toasts? Älteste entfernen
        while (this.toasts.length >= this.maxToasts) {
            const oldestToast = this.toasts.shift();
            this.removeToast(oldestToast.id);
        }
        
        this.toasts.push(toast);
        this.container.appendChild(toast.element);
        
        // Animation einleiten
        requestAnimationFrame(() => {
            toast.element.classList.add('toast-show');
        });
        
        // Haptic Feedback
        this.triggerHaptic(toast.type);
    }

    dismiss(id) {
        const toastIndex = this.toasts.findIndex(t => t.id === id);
        if (toastIndex === -1) return;
        
        const toast = this.toasts[toastIndex];
        
        // Timer löschen
        if (toast.timer) {
            clearTimeout(toast.timer);
        }
        
        // Slide-out Animation
        toast.element.classList.add('toast-hide');
        
        setTimeout(() => {
            this.removeToast(id);
        }, 300);
    }

    removeToast(id) {
        const toastIndex = this.toasts.findIndex(t => t.id === id);
        if (toastIndex === -1) return;
        
        const toast = this.toasts[toastIndex];
        
        if (toast.element && toast.element.parentNode) {
            toast.element.parentNode.removeChild(toast.element);
        }
        
        this.toasts.splice(toastIndex, 1);
    }

    handleAction(id) {
        const toast = this.toasts.find(t => t.id === id);
        if (toast && toast.action && toast.action.handler) {
            toast.action.handler();
        }
        this.dismiss(id);
    }

    // Convenience-Methoden
    success(message, duration, options) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration, options) {
        return this.show(message, 'error', duration || 6000, options);
    }

    warning(message, duration, options) {
        return this.show(message, 'warning', duration || 5000, options);
    }

    info(message, duration, options) {
        return this.show(message, 'info', duration, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { ...options, persistent: true });
    }

    // Alle Toasts löschen
    clear() {
        this.toasts.forEach(toast => {
            if (toast.timer) {
                clearTimeout(toast.timer);
            }
        });
        this.toasts = [];
        this.container.innerHTML = '';
    }

    // Haptic Feedback
    triggerHaptic(type) {
        const app = window.AppUtils?.getInstance();
        if (app) {
            switch (type) {
                case 'success':
                    app.triggerHaptic('success');
                    break;
                case 'error':
                    app.triggerHaptic('error');
                    break;
                case 'warning':
                    app.triggerHaptic('medium');
                    break;
                default:
                    app.triggerHaptic('light');
            }
        }
    }
}

// Utility-Funktionen
class Utils {
    // Formatierung
    static formatCTC(microCTC) {
        const ctc = microCTC / 100_000_000;
        return ctc.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }) + ' CTC';
    }

    static formatCTCShort(microCTC) {
        const ctc = microCTC / 100_000_000;
        if (ctc >= 1000000) {
            return (ctc / 1000000).toFixed(2) + 'M CTC';
        } else if (ctc >= 1000) {
            return (ctc / 1000).toFixed(2) + 'K CTC';
        } else {
            return ctc.toFixed(4) + ' CTC';
        }
    }

    static formatAddress(address, length = 8) {
        if (!address || address.length <= length + 6) return address;
        return address.substring(0, 3 + length) + '...' + address.substring(address.length - 4);
    }

    static formatHash(hash, length = 8) {
        if (!hash || hash.length <= length + 6) return hash;
        return hash.substring(0, length) + '...' + hash.substring(hash.length - 4);
    }

    // Zeit-Formatierung
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // < 1 Minute
            return 'Just now';
        } else if (diff < 3600000) { // < 1 Stunde
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // < 1 Tag
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else if (diff < 604800000) { // < 1 Woche
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    static formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Validierung
    static isValidCTCAddress(address) {
        return typeof address === 'string' && 
               address.startsWith('CTC') && 
               address.length === 24 && 
               /^CTC[a-fA-F0-9]{21}$/.test(address);
    }

    static isValidAmount(amount) {
        if (typeof amount === 'number') {
            return amount > 0 && Number.isFinite(amount);
        }
        if (typeof amount === 'string') {
            const num = parseFloat(amount);
            return !isNaN(num) && num > 0 && Number.isFinite(num);
        }
        return false;
    }

    // Kryptografie-Hilfsfunktionen
    static generateRandomBytes(length) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    static bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Storage-Hilfsfunktionen
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    // Netzwerk-Utilities
    static async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Telegram WebApp
    static getTelegramWebApp() {
        return window.Telegram?.WebApp || null;
    }

    static isTelegramWebApp() {
        return !!this.getTelegramWebApp();
    }

    // Device-Info
    static getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let deviceType = 'unknown';
        let osType = 'unknown';
        
        if (/iPhone|iPad|iPod/.test(userAgent)) {
            deviceType = 'ios';
            osType = 'iOS';
        } else if (/Android/.test(userAgent)) {
            deviceType = 'android';
            osType = 'Android';
        } else if (/Windows/.test(userAgent)) {
            deviceType = 'desktop';
            osType = 'Windows';
        } else if (/Mac/.test(userAgent)) {
            deviceType = 'desktop';
            osType = 'macOS';
        } else if (/Linux/.test(userAgent)) {
            deviceType = 'desktop';
            osType = 'Linux';
        }
        
        return {
            deviceType,
            osType,
            userAgent,
            isMobile: ['ios', 'android'].includes(deviceType),
            isStandalone: window.matchMedia('(display-mode: standalone)').matches,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    // Debug-Utilities
    static log(message, data = null) {
        if (data) {
            console.log(`[CTC Wallet] ${message}`, data);
        } else {
            console.log(`[CTC Wallet] ${message}`);
        }
    }

    static error(message, error = null) {
        if (error) {
            console.error(`[CTC Wallet] ${message}`, error);
        } else {
            console.error(`[CTC Wallet] ${message}`);
        }
    }

    static warn(message, data = null) {
        if (data) {
            console.warn(`[CTC Wallet] ${message}`, data);
        } else {
            console.warn(`[CTC Wallet] ${message}`);
        }
    }
}

// Globale Instanzen erstellen
const DOM = DOMHelper;
const toastManager = new ToastManager();
const Toast = toastManager;

// Viewport-Höhe bei Resize anpassen
window.addEventListener('resize', () => {
    DOM.adjustViewportHeight();
});

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    DOM.adjustViewportHeight();
    DOM.setSafeAreaSupport();
});

// Export für globale Verwendung
window.DOM = DOM;
window.DOMHelper = DOMHelper;
window.Toast = Toast;
window.ToastManager = ToastManager;
window.Utils = Utils;

// Globale Exports (Fügen Sie das ans Ende der helpers.js hinzu)
window.DOM = DOMHelper;
window.Toast = ToastManager;
window.Utils = Utils;
window.Storage = Storage;

console.log('✅ Global helpers loaded:', {
    DOM: typeof window.DOM,
    Toast: typeof window.Toast,
    Utils: typeof window.Utils,
    Storage: typeof window.Storage
});