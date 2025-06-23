// js/app.js - Mobile-optimierte CTC Wallet Hauptanwendung

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
            this.api = ApiUtils.init();
            
            // Komponenten laden
            await this.waitForComponents();
            
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

    // Mobile-Umgebung erkennen
    detectMobileEnvironment() {
        // Device-Typ erkennen
        const userAgent = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(userAgent)) {
            this.deviceType = 'ios';
        } else if (/Android/.test(userAgent)) {
            this.deviceType = 'android';
        } else {
            this.deviceType = 'desktop';
        }
        
        // Standalone-Modus (PWA)
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        
        // Orientierung
        this.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        // Mobile-CSS aktivieren
        document.body.classList.add(`device-${this.deviceType}`);
        if (this.isStandalone) {
            document.body.classList.add('standalone');
        }
        
        console.log(`📱 Device: ${this.deviceType}, Standalone: ${this.isStandalone}`);
    }

    // Telegram WebApp-Integration
    async initTelegramWebApp() {
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
            this.isTelegramWebApp = true;
            const tgWebApp = window.Telegram.WebApp;
            
            try {
                // WebApp konfigurieren
                tgWebApp.ready();
                tgWebApp.expand();
                
                // Theme-Anpassung
                if (tgWebApp.colorScheme === 'dark') {
                    document.body.classList.add('theme-dark');
                }
                
                // Header-Farbe setzen
                tgWebApp.setHeaderColor('#1a1a1a');
                
                // Back-Button Handler
                tgWebApp.BackButton.onClick(() => {
                    this.handleBackButton();
                });
                
                // Main-Button für Aktionen
                tgWebApp.MainButton.setText('Wallet Action');
                tgWebApp.MainButton.hide();
                
                // Haptic Feedback aktivieren
                this.hapticFeedback = tgWebApp.HapticFeedback;
                
                console.log('📱 Telegram WebApp initialized');
                
            } catch (error) {
                console.warn('⚠️ Telegram WebApp setup failed:', error);
            }
        }
    }

    // Sicherheits-Features
    setupSecurityFeatures() {
        // Screen-Capture verhindern (soweit möglich)
        document.addEventListener('keydown', (e) => {
            // Print Screen blockieren
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                this.showSecurityWarning('Screenshots are disabled for security');
            }
            
            // Developer Tools blockieren
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                this.showSecurityWarning('Developer tools are disabled');
            }
        });
        
        // Context-Menü blockieren
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Text-Selektion in sensitiven Bereichen verhindern
        document.addEventListener('selectstart', (e) => {
            if (e.target.classList.contains('no-select') || 
                e.target.closest('.secure-content')) {
                e.preventDefault();
            }
        });
        
        // Visibility-Change Handler für Auto-Lock
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppHidden();
            } else {
                this.handleAppVisible();
            }
        });
    }

    // Aktivitäts-Tracking für Auto-Lock
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
    }

    updateLastActivity() {
        this.lastActivity = Date.now();
        
        // Session erweitern falls aktiv
        if (SecureWalletStorage.isSessionValid()) {
            SecureWalletStorage.extendSession();
        }
    }

    // Komponenten laden
    async waitForComponents() {
        const requiredComponents = [
            'CTCWallet',
            'SecureWalletStorage', 
            'DOM',
            'Toast',
            'welcomeScreen',
            'walletScreen'
        ];
        
        const maxWaitTime = 10000; // 10 Sekunden
        const checkInterval = 200;
        let elapsed = 0;
        
        while (elapsed < maxWaitTime) {
            const missing = requiredComponents.filter(comp => 
                typeof window[comp] === 'undefined'
            );
            
            if (missing.length === 0) {
                console.log('✅ All components loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            elapsed += checkInterval;
        }
        
        throw new Error('Components failed to load in time');
    }

    // UI initialisieren
    async initializeUI() {
        // Bestehende Accounts prüfen
        const accounts = SecureWalletStorage.getAccountsList();
        
        if (accounts.length === 0) {
            // Neuer Benutzer - Welcome Screen
            if (window.welcomeScreen) {
                window.welcomeScreen.showWelcome();
            }
        } else if (accounts.length === 1) {
            // Ein Account - direkt zum Login
            if (window.welcomeScreen) {
                window.welcomeScreen.showLogin(accounts[0]);
            }
        } else {
            // Mehrere Accounts - Account-Auswahl
            if (window.accountSelector) {
                window.accountSelector.showAccountSelection();
            }
        }
    }

    // Session-Timer
    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - this.lastActivity;
            
            // Auto-Lock bei Inaktivität
            if (inactiveTime > this.maxInactivity && this.currentWallet && !this.currentWallet.isLocked()) {
                console.log('🔒 Auto-lock due to inactivity');
                this.lockWallet();
            }
            
            // Session-Timeout prüfen
            if (!SecureWalletStorage.isSessionValid() && this.currentWallet) {
                console.log('🔒 Session expired');
                this.lockWallet();
            }
            
        }, 30000); // Alle 30 Sekunden prüfen
    }

    // Netzwerk-Monitoring
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.networkStatus = 'online';
            Toast.success('Network connection restored');
            
            // Reconnect API
            if (this.api) {
                this.api.isOnline = true;
            }
        });
        
        window.addEventListener('offline', () => {
            this.networkStatus = 'offline';
            Toast.warning('Network connection lost');
            
            if (this.api) {
                this.api.isOnline = false;
            }
        });
        
        // Initiale Verbindung testen
        this.testNetworkConnection();
    }

    async testNetworkConnection() {
        try {
            if (this.api) {
                const isConnected = await this.api.testConnection();
                this.networkStatus = isConnected ? 'online' : 'offline';
            }
        } catch (error) {
            this.networkStatus = 'offline';
        }
    }

    // Wallet-Management
    async createNewWallet(accountName, password) {
        try {
            console.log('🔑 Creating new wallet...');
            
            // Haptic Feedback
            this.triggerHaptic('light');
            
            // Neues Wallet erstellen
            const wallet = await CTCWallet.create();
            
            // Sicher speichern
            const accountId = await SecureWalletStorage.saveWallet(
                wallet, 
                password, 
                accountName
            );
            
            this.currentWallet = wallet;
            this.currentAccount = accountId;
            
            // UI aktualisieren
            if (window.walletScreen) {
                window.walletScreen.initialize(wallet);
            }
            
            Toast.success('Wallet created successfully');
            console.log('✅ New wallet created and saved');
            
            return wallet;
            
        } catch (error) {
            console.error('❌ Error creating wallet:', error);
            Toast.error(`Failed to create wallet: ${error.message}`);
            throw error;
        }
    }

    async restoreWallet(mnemonic, accountName, password) {
        try {
            console.log('🔄 Restoring wallet...');
            
            this.triggerHaptic('light');
            
            // Wallet wiederherstellen
            const wallet = await CTCWallet.restore(mnemonic);
            
            // Sicher speichern
            const accountId = await SecureWalletStorage.saveWallet(
                wallet,
                password,
                accountName
            );
            
            this.currentWallet = wallet;
            this.currentAccount = accountId;
            
            // UI aktualisieren
            if (window.walletScreen) {
                window.walletScreen.initialize(wallet);
            }
            
            Toast.success('Wallet restored successfully');
            console.log('✅ Wallet restored and saved');
            
            return wallet;
            
        } catch (error) {
            console.error('❌ Error restoring wallet:', error);
            Toast.error(`Failed to restore wallet: ${error.message}`);
            throw error;
        }
    }

    async unlockWallet(accountId, password) {
        try {
            console.log('🔓 Unlocking wallet...');
            
            this.triggerHaptic('light');
            
            // Wallet laden und entschlüsseln
            const walletData = await SecureWalletStorage.loadWallet(accountId, password);
            
            // Wallet-Instanz erstellen
            const wallet = await CTCWallet.restore(walletData.mnemonic);
            
            this.currentWallet = wallet;
            this.currentAccount = accountId;
            
            // UI aktualisieren
            if (window.walletScreen) {
                window.walletScreen.initialize(wallet);
            }
            
            Toast.success('Wallet unlocked successfully');
            console.log('✅ Wallet unlocked');
            
            return wallet;
            
        } catch (error) {
            console.error('❌ Error unlocking wallet:', error);
            Toast.error(`Failed to unlock wallet: ${error.message}`);
            throw error;
        }
    }

    lockWallet() {
        if (this.currentWallet) {
            this.currentWallet.lock();
            this.currentWallet = null;
            this.currentAccount = null;
            
            // Session löschen
            SecureWalletStorage.clearSession();
            
            // Zurück zum Login
            this.returnToLogin();
            
            Toast.info('Wallet locked for security');
            console.log('🔒 Wallet locked');
        }
    }

    returnToLogin() {
        const accounts = SecureWalletStorage.getAccountsList();
        
        if (accounts.length === 0) {
            if (window.welcomeScreen) {
                window.welcomeScreen.showWelcome();
            }
        } else if (accounts.length === 1) {
            if (window.welcomeScreen) {
                window.welcomeScreen.showLogin(accounts[0]);
            }
        } else {
            if (window.accountSelector) {
                window.accountSelector.showAccountSelection();
            }
        }
    }

    // Event-Handler
    handleBackButton() {
        if (this.isTelegramWebApp) {
            // In Telegram WebApp
            if (this.currentWallet && !this.currentWallet.isLocked()) {
                // Wallet ist aktiv - zur Übersicht
                if (window.walletScreen) {
                    window.walletScreen.showOverview();
                }
            } else {
                // Zurück zur Auswahl
                this.returnToLogin();
            }
        }
    }

    handleAppHidden() {
        // App in Hintergrund - sensible Daten verbergen
        if (this.currentWallet && !this.currentWallet.isLocked()) {
            // Overlay für Privatsphäre
            this.showPrivacyOverlay();
        }
    }

    handleAppVisible() {
        // App wieder sichtbar
        this.hidePrivacyOverlay();
        this.updateLastActivity();
    }

    // UI-Hilfsfunktionen
    showPrivacyOverlay() {
        let overlay = document.getElementById('privacy-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'privacy-overlay';
            overlay.innerHTML = `
                <div class="privacy-content">
                    <div class="privacy-icon">🔒</div>
                    <h2>CTC Wallet</h2>
                    <p>Tap to unlock</p>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a1a;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                text-align: center;
            `;
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                this.hidePrivacyOverlay();
            });
        }
        overlay.style.display = 'flex';
    }

    hidePrivacyOverlay() {
        const overlay = document.getElementById('privacy-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        Toast.error(message);
        
        // Fallback für kritische Fehler
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div class="error-screen">
                <div class="error-content">
                    <h2>⚠️ Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()">Reload App</button>
                </div>
            </div>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            color: white;
            text-align: center;
        `;
        document.body.appendChild(errorDiv);
    }

    showSecurityWarning(message) {
        Toast.warning(message);
        this.triggerHaptic('error');
        
        // Log für Sicherheits-Audit
        console.warn('🔒 Security Warning:', message);
    }

    triggerHaptic(type = 'light') {
        if (this.hapticFeedback) {
            try {
                switch (type) {
                    case 'light':
                        this.hapticFeedback.selectionChanged();
                        break;
                    case 'medium':
                        this.hapticFeedback.impactOccurred('medium');
                        break;
                    case 'heavy':
                        this.hapticFeedback.impactOccurred('heavy');
                        break;
                    case 'success':
                        this.hapticFeedback.notificationOccurred('success');
                        break;
                    case 'error':
                        this.hapticFeedback.notificationOccurred('error');
                        break;
                }
            } catch (error) {
                // Haptic Feedback nicht verfügbar
            }
        }
    }

    // App-Status
    getAppStatus() {
        return {
            initialized: this.initialized,
            hasWallet: !!this.currentWallet,
            isLocked: this.currentWallet ? this.currentWallet.isLocked() : true,
            networkStatus: this.networkStatus,
            deviceType: this.deviceType,
            isTelegramWebApp: this.isTelegramWebApp,
            isStandalone: this.isStandalone,
            accounts: SecureWalletStorage.getAccountsList().length
        };
    }

    // Cleanup
    destroy() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        if (this.currentWallet) {
            this.currentWallet.lock();
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

        // Session prüfen
        checkSession() {
            return SecureWalletStorage.isSessionValid();
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
        await AppUtils.init();
    } catch (error) {
        console.error('❌ Auto-initialization failed:', error);
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
