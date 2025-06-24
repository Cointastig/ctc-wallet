// js/app.js - FIXED CTC Wallet Hauptanwendung

class CTCWalletApp {
    constructor() {
        this.initialized = false;
        this.currentWallet = null;
        this.currentAccount = null;
        this.api = null;
        this.sessionTimer = null;
        this.networkStatus = 'unknown';
        this.isTelegramWebApp = false;
        
        // Mobile-spezifische Eigenschaften
        this.isStandalone = false;
        this.deviceType = 'unknown';
        this.orientation = 'portrait';
        
        // Sicherheits-Features
        this.sessionTimeout = 15 * 60 * 1000; // 15 Minuten
        this.maxInactivity = 5 * 60 * 1000;   // 5 Minuten
        this.lastActivity = Date.now();
        
        // Event-Listener für Aktivitäts-Tracking
        this.setupActivityTracking();
    }

    // Hauptinitialisierung
    async init() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing CTC Wallet App...');
            
            // Mobile-Erkennung
            this.detectMobileEnvironment();
            
            // Telegram WebApp-Integration
            await this.initTelegramWebApp();
            
            // Sicherheits-Setup
            this.setupSecurityFeatures();
            
            // API initialisieren
            this.api = new APIService();
            
            // Komponenten laden
            await this.waitForComponents();
            
            // Storage cleanup
            this.performStorageCleanup();
            
            // UI initialisieren
            await this.initializeUI();
            
            // Netzwerk-Monitoring
            this.setupNetworkMonitoring();
            
            // Auto-Lock Timer starten
            this.startSessionTimer();
            
            this.initialized = true;
            console.log('✅ CTC Wallet App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize wallet application');
        }
    }

    // Storage cleanup
    performStorageCleanup() {
        try {
            // Clean up old data structures
            if (window.SecureWalletStorage) {
                SecureWalletStorage.cleanup();
            }
            
            // Remove legacy data
            const legacyKeys = ['old-wallet-data', 'legacy-accounts'];
            legacyKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ Cleaned up legacy data: ${key}`);
                }
            });
            
        } catch (error) {
            console.error('⚠️ Storage cleanup error:', error);
        }
    }

    // UI initialisieren
    async initializeUI() {
        try {
            // Check if wallet exists
            const hasExistingWallet = SecureWalletStorage.hasWallet();
            
            if (hasExistingWallet) {
                console.log('📦 Existing wallet found - showing login');
                await this.showLogin();
            } else {
                console.log('🆕 No wallet found - showing welcome');
                await this.showWelcome();
            }
            
        } catch (error) {
            console.error('❌ UI initialization failed:', error);
            await this.showWelcome();
        }
    }

    // Login-Screen anzeigen
    async showLogin() {
        try {
            const accounts = SecureWalletStorage.getAccountsList();
            
            if (accounts.length === 1) {
                // Single account - direct login
                await this.showPasswordLogin(accounts[0]);
            } else if (accounts.length > 1) {
                // Multiple accounts - show selector
                await this.showAccountSelector();
            } else {
                // No accounts found - show welcome
                await this.showWelcome();
            }
            
        } catch (error) {
            console.error('❌ Login screen error:', error);
            await this.showWelcome();
        }
    }

    // Passwort-Login für bestimmtes Account
    async showPasswordLogin(account) {
        const container = document.getElementById('app-container');
        
        container.innerHTML = `
            <div class="login-container">
                <div class="login-header">
                    <div class="wallet-icon">🔐</div>
                    <h2>Welcome Back</h2>
                    <p class="account-name">${account.name}</p>
                    <p class="account-address">${this.formatAddress(account.address)}</p>
                </div>

                <form class="login-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            placeholder="Enter your password"
                            class="password-input"
                            autofocus
                        >
                        <div class="input-feedback" id="password-feedback"></div>
                    </div>

                    <button 
                        type="button" 
                        class="btn-primary unlock-btn" 
                        onclick="app.unlockWallet('${account.id}')"
                        id="unlock-btn"
                    >
                        <span class="loading-indicator" id="unlock-loading" style="display: none;">
                            <div class="spinner"></div>
                        </span>
                        <span id="unlock-text">Unlock Wallet</span>
                    </button>
                </form>

                <div class="login-footer">
                    <button class="btn-link" onclick="app.showAccountSelector()">
                        Switch Account
                    </button>
                    <button class="btn-link" onclick="app.showWelcome()">
                        Create New Wallet
                    </button>
                </div>

                <div class="security-notice">
                    <p>🔒 Your wallet is encrypted and stored locally</p>
                </div>
            </div>
        `;

        // Enter-Taste Event
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.unlockWallet(account.id);
            }
        });
    }

    // Account Selector anzeigen
    async showAccountSelector() {
        const accounts = SecureWalletStorage.getAccountsList();
        
        const container = document.getElementById('app-container');
        
        container.innerHTML = `
            <div class="account-selector-container">
                <div class="selector-header">
                    <h2>Select Account</h2>
                    <p>Choose an account to unlock</p>
                </div>

                <div class="accounts-list">
                    ${accounts.map(account => `
                        <div class="account-item" onclick="app.showPasswordLogin(${JSON.stringify(account).replace(/"/g, '&quot;')})">
                            <div class="account-info">
                                <div class="account-name">${account.name}</div>
                                <div class="account-address">${this.formatAddress(account.address)}</div>
                            </div>
                            <div class="account-arrow">→</div>
                        </div>
                    `).join('')}
                </div>

                <div class="selector-footer">
                    <button class="btn-secondary" onclick="app.showWelcome()">
                        Create New Wallet
                    </button>
                </div>
            </div>
        `;
    }

    // Wallet entsperren
    async unlockWallet(accountId) {
        const passwordInput = document.getElementById('password');
        const loadingElement = document.getElementById('unlock-loading');
        const textElement = document.getElementById('unlock-text');
        const btnElement = document.getElementById('unlock-btn');
        const feedbackElement = document.getElementById('password-feedback');
        
        const password = passwordInput.value.trim();
        
        if (!password) {
            this.showInputError(feedbackElement, 'Password is required');
            return;
        }

        // Check if account is locked
        if (SecureWalletStorage.isAccountLocked(accountId)) {
            this.showInputError(feedbackElement, 'Account is temporarily locked. Please try again later.');
            return;
        }

        // UI Loading State
        loadingElement.style.display = 'flex';
        textElement.textContent = 'Unlocking...';
        btnElement.disabled = true;
        feedbackElement.textContent = '';
        feedbackElement.className = 'input-feedback';

        try {
            // Load and decrypt wallet
            const walletData = await SecureWalletStorage.loadWallet(accountId, password);
            
            // Clear failed attempts
            SecureWalletStorage.clearFailedAttempts(accountId);
            
            // Set current wallet
            this.currentWallet = walletData.wallet;
            this.currentAccount = SecureWalletStorage.getAccountsList().find(acc => acc.id === accountId);
            
            // Generate session token
            SecureWalletStorage.generateSessionToken(accountId);
            
            // Show wallet screen
            await this.showWalletScreen();
            
        } catch (error) {
            console.error('❌ Unlock failed:', error);
            
            // Record failed attempt
            const isLocked = SecureWalletStorage.recordFailedAttempt(accountId);
            
            let errorMessage = 'Invalid password';
            if (isLocked) {
                errorMessage = 'Too many failed attempts. Account locked for 15 minutes.';
            }
            
            this.showInputError(feedbackElement, errorMessage);
            
            // Reset UI
            loadingElement.style.display = 'none';
            textElement.textContent = 'Unlock Wallet';
            btnElement.disabled = false;
            passwordInput.value = '';
            passwordInput.focus();
            
            this.triggerHaptic('error');
        }
    }

    // Neue Wallet erstellen - FIXED to use static method
    async createNewWallet(accountName, password) {
        try {
            // Create new wallet using static method
            const wallet = await CTCWallet.create();
            
            // Encrypt and save
            const accountId = await SecureWalletStorage.saveWallet(wallet, password, accountName);
            
            // Set as current wallet
            this.currentWallet = wallet;
            this.currentAccount = {
                id: accountId,
                name: accountName,
                address: wallet.address
            };
            
            // Generate session token
            SecureWalletStorage.generateSessionToken(accountId);
            
            // Show wallet screen
            await this.showWalletScreen();
            
            console.log('✅ New wallet created and saved');
            
        } catch (error) {
            console.error('❌ Error creating wallet:', error);
            throw error;
        }
    }

    // Wallet aus Seed wiederherstellen - FIXED to use static method
    async restoreWallet(mnemonic, accountName, password) {
        try {
            // Restore wallet from mnemonic using static method
            const wallet = await CTCWallet.restore(mnemonic);
            
            // Encrypt and save
            const accountId = await SecureWalletStorage.saveWallet(wallet, password, accountName);
            
            // Set as current wallet
            this.currentWallet = wallet;
            this.currentAccount = {
                id: accountId,
                name: accountName,
                address: wallet.address
            };
            
            // Generate session token
            SecureWalletStorage.generateSessionToken(accountId);
            
            // Show wallet screen
            await this.showWalletScreen();
            
            console.log('✅ Wallet restored and saved');
            
        } catch (error) {
            console.error('❌ Error restoring wallet:', error);
            throw error;
        }
    }

    // Welcome Screen anzeigen
    async showWelcome() {
        if (!window.welcomeScreen) {
            console.error('❌ Welcome screen not loaded');
            return;
        }
        
        welcomeScreen.showWelcome();
    }

    // Wallet Screen anzeigen
    async showWalletScreen() {
        if (!window.walletScreen) {
            console.error('❌ Wallet screen not loaded');
            return;
        }
        
        await walletScreen.initialize(this.currentWallet, true);
        await walletScreen.show();
    }

    // Wallet sperren
    lockWallet() {
        try {
            if (this.currentWallet) {
                this.currentWallet.lock();
            }
            
            SecureWalletStorage.clearSession();
            
            this.currentWallet = null;
            this.currentAccount = null;
            
            // Zurück zum Login
            this.showLogin();
            
            console.log('🔒 Wallet locked');
            
        } catch (error) {
            console.error('❌ Lock wallet error:', error);
        }
    }

    // Komponenten laden warten
    async waitForComponents() {
        const maxWait = 5000; // 5 Sekunden
        const interval = 100;
        let waited = 0;
        
        while (waited < maxWait) {
            if (window.welcomeScreen && window.walletScreen && window.SecureWalletStorage) {
                console.log('✅ All components loaded');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }
        
        throw new Error('Components failed to load within timeout');
    }

    // Mobile-Environment erkennen
    detectMobileEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        this.isTelegramWebApp = window.Telegram && window.Telegram.WebApp;
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (/android/.test(userAgent)) {
            this.deviceType = 'android';
        } else if (/iphone|ipad|ipod/.test(userAgent)) {
            this.deviceType = 'ios';
        } else {
            this.deviceType = 'desktop';
        }
        
        console.log(`📱 Device: ${this.deviceType}, Telegram: ${this.isTelegramWebApp}, Standalone: ${this.isStandalone}`);
    }

    // Telegram WebApp initialisieren
    async initTelegramWebApp() {
        if (this.isTelegramWebApp) {
            try {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                console.log('📱 Telegram WebApp initialized');
            } catch (error) {
                console.error('⚠️ Telegram WebApp init error:', error);
            }
        }
    }

    // Sicherheits-Features einrichten
    setupSecurityFeatures() {
        // Screen Recording Protection (mobile)
        if (this.deviceType !== 'desktop') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.updateLastActivity();
                }
            });
        }
        
        // Copy protection
        document.addEventListener('copy', (e) => {
            console.log('📋 Copy event detected');
        });
    }

    // Aktivitäts-Tracking einrichten
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
    }

    // Letzte Aktivität aktualisieren
    updateLastActivity() {
        this.lastActivity = Date.now();
        
        // Session verlängern wenn aktiv
        if (this.currentAccount) {
            SecureWalletStorage.extendSession(this.currentAccount.id);
        }
    }

    // Session Timer starten
    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.sessionTimer = setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivity;
            
            if (timeSinceActivity > this.maxInactivity) {
                console.log('🕐 Auto-lock due to inactivity');
                this.lockWallet();
            }
        }, 30000); // Check every 30 seconds
    }

    // Netzwerk-Monitoring einrichten
    setupNetworkMonitoring() {
        if (navigator.onLine !== undefined) {
            window.addEventListener('online', () => {
                this.networkStatus = 'online';
                console.log('🌐 Network: Online');
            });
            
            window.addEventListener('offline', () => {
                this.networkStatus = 'offline';
                console.log('🌐 Network: Offline');
            });
            
            this.networkStatus = navigator.onLine ? 'online' : 'offline';
        }
    }

    // Haptic Feedback (mobile)
    triggerHaptic(type = 'light') {
        try {
            if (this.isTelegramWebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
            } else if (navigator.vibrate && this.deviceType !== 'desktop') {
                const patterns = {
                    light: [10],
                    medium: [20],
                    heavy: [30],
                    success: [10, 50, 10],
                    error: [20, 100, 20]
                };
                navigator.vibrate(patterns[type] || patterns.light);
            }
        } catch (error) {
            // Haptic feedback not supported
        }
    }

    // Input Error anzeigen
    showInputError(element, message) {
        if (element) {
            element.textContent = message;
            element.className = 'input-feedback error';
        }
    }

    // Adresse formatieren
    formatAddress(address) {
        if (!address) return '';
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Error anzeigen
    showError(message) {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error</h2>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">
                    Retry
                </button>
            </div>
        `;
    }

    // Set current screen (for tracking)
    setCurrentScreen(screenName) {
        this.currentScreen = screenName;
        console.log(`🖥️ Current screen: ${screenName}`);
    }

    // App Status
    getStatus() {
        const accounts = SecureWalletStorage.getAccountsList();
        
        return {
            initialized: this.initialized,
            hasWallet: !!this.currentWallet,
            isLocked: this.currentWallet ? this.currentWallet.isLocked() : true,
            networkStatus: this.networkStatus,
            deviceType: this.deviceType,
            isTelegramWebApp: this.isTelegramWebApp,
            isStandalone: this.isStandalone,
            accounts: accounts.length,
            storageVersion: '2.0'
        };
    }

    // Cleanup
    destroy() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        if (this.currentWallet) {
            this.currentWallet.destroy();
        }
        
        // Sensitive Daten löschen
        this.currentWallet = null;
        this.currentAccount = null;
        
        console.log('🧹 App cleanup completed');
    }
}

// Globale App-Instanz
let app = null;

// App-Utilities
const AppUtils = {
    // App initialisieren
    async init() {
        if (!app) {
            app = new CTCWalletApp();
        }
        await app.init();
        return app;
    },

    // App-Instanz abrufen
    getInstance() {
        return app;
    },

    // Sicherheits-Funktionen
    security: {
        // Auto-Lock
        lockWallet() {
            if (app) {
                app.lockWallet();
            }
        },

        // Aktivität aktualisieren
        updateActivity() {
            if (app) {
                app.updateLastActivity();
            }
        }
    }
};

// Auto-Initialisierung wenn DOM bereit
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🌟 DOM loaded - starting app initialization');
        await AppUtils.init();
    } catch (error) {
        console.error('❌ Auto-initialization failed:', error);
        
        // Fallback error display
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1a1a1a; color: white; text-align: center; padding: 20px;">
                <div>
                    <h2 style="color: #ff6b6b; margin-bottom: 16px;">Initialization Failed</h2>
                    <p style="margin-bottom: 24px;">Failed to start the wallet application.</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: #6B9EFF; color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>
                </div>
            </div>
        `;
    }
});

// Cleanup bei Seiten-Verlassen
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Export für globale Verwendung
window.CTCWalletApp = CTCWalletApp;
window.AppUtils = AppUtils;

console.log('🚀 App initialization loaded');
