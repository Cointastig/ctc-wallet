// js/app.js - Fixed Main Application Controller

class CTCWalletApp {
    constructor() {
        this.initialized = false;
        this.currentScreen = null;
        this.wallet = null;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing CTC Wallet App...');
            
            // Initialize Telegram WebApp if available
            this.initTelegramWebApp();
            
            // Wait for all components to be loaded
            await this.waitForComponents();
            
            // Check for existing wallet
            const hasExistingWallet = this.checkExistingWallet();
            
            if (!hasExistingWallet) {
                // Show welcome screen for new users
                if (window.welcomeScreen) {
                    window.welcomeScreen.showWelcome();
                } else {
                    console.error('welcomeScreen not available');
                    this.showError('Failed to load welcome screen');
                    return;
                }
            }
            
            // Set up global error handlers
            this.setupErrorHandlers();
            
            // Set up network monitoring
            this.setupNetworkMonitoring();
            
            this.initialized = true;
            console.log('✅ CTC Wallet App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize wallet application');
        }
    }

    // Wait for all components to be loaded
    async waitForComponents() {
        const maxWaitTime = 5000; // 5 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;
        
        while (waited < maxWaitTime) {
            if (window.welcomeScreen && 
                window.accountManager && 
                window.accountIconManager &&
                window.walletScreen &&
                window.ctcApi) {
                console.log('✅ All components loaded');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }
        
        throw new Error('Components failed to load within timeout');
    }

    // Check for existing wallet/account system
    checkExistingWallet() {
        try {
            if (window.welcomeScreen && typeof window.welcomeScreen.checkExistingWallet === 'function') {
                return window.welcomeScreen.checkExistingWallet();
            } else {
                console.error('welcomeScreen.checkExistingWallet not available');
                return false;
            }
        } catch (error) {
            console.error('Error checking existing wallet:', error);
            return false;
        }
    }

    // Initialize Telegram WebApp features
    initTelegramWebApp() {
        const tgWebApp = Utils.getTelegramWebApp();
        
        if (tgWebApp) {
            console.log('📱 Running in Telegram WebApp');
            
            try {
                // Configure Telegram WebApp
                tgWebApp.ready();
                tgWebApp.expand();
                
                // Set theme colors (with version check)
                if (tgWebApp.version >= 6.1) {
                    tgWebApp.setHeaderColor('#1a1a1a');
                    tgWebApp.setBackgroundColor('#1a1a1a');
                }
                
                // Handle back button (with version check)
                if (tgWebApp.version >= 6.1 && tgWebApp.BackButton) {
                    tgWebApp.BackButton.onClick(() => {
                        this.handleBackButton();
                    });
                }
                
                // Handle main button if needed
                if (tgWebApp.MainButton) {
                    tgWebApp.MainButton.hide();
                }
                
            } catch (error) {
                console.warn('Telegram WebApp setup error (non-critical):', error);
            }
            
        } else {
            console.log('🌐 Running in regular browser');
        }
    }

    // Set up global error handlers
    setupErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            if (event.error) {
                console.error('Uncaught error:', event.error);
                Toast.error('An unexpected error occurred');
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Toast.error('An unexpected error occurred');
            event.preventDefault();
        });

        // Handle network errors
        window.addEventListener('offline', () => {
            Toast.error('You are offline. Some features may not work.');
        });

        window.addEventListener('online', () => {
            Toast.success('Connection restored');
        });
    }

    // Set up network monitoring
    setupNetworkMonitoring() {
        // Check node connectivity periodically
        setInterval(async () => {
            try {
                if (window.ctcApi) {
                    const isOnline = await window.ctcApi.isNodeOnline();
                    // Store connection status for UI feedback
                    window.nodeConnectionStatus = isOnline;
                }
            } catch (error) {
                // Silently handle network check errors
                window.nodeConnectionStatus = false;
            }
        }, 30000); // Check every 30 seconds
    }

    // Handle back button press
    handleBackButton() {
        const tgWebApp = Utils.getTelegramWebApp();
        
        // Determine current screen and navigate back appropriately
        if (this.currentScreen === 'send') {
            if (window.walletScreen) {
                window.walletScreen.show();
            }
        } else if (this.currentScreen === 'receive') {
            if (window.walletScreen) {
                window.walletScreen.show();
            }
        } else if (this.currentScreen === 'settings') {
            if (window.walletScreen) {
                window.walletScreen.show();
            }
        } else if (this.currentScreen === 'accounts') {
            if (window.walletScreen) {
                window.walletScreen.show();
            }
        } else {
            // Default behavior - hide back button
            if (tgWebApp && tgWebApp.BackButton) {
                tgWebApp.BackButton.hide();
            }
        }
    }

    // Show error screen
    showError(message, canRetry = true) {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon" style="background: #ff4444;">⚠️</div>
                    <h2 class="screen-title">Error</h2>
                    <p class="screen-subtitle">${message}</p>
                </div>
                ${canRetry ? `
                    <button class="btn btn-primary" onclick="location.reload()">
                        Try Again
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="app.reset()">
                    Reset Application
                </button>
            </div>
        `;
        
        if (DOM && DOM.setContent) {
            DOM.setContent('app-container', content);
        } else {
            document.getElementById('app-container').innerHTML = content;
        }
    }

    // Reset the application
    reset() {
        if (confirm('This will reset the application and may clear your wallet data. Continue?')) {
            if (Storage && Storage.clear) {
                Storage.clear();
            } else {
                localStorage.clear();
            }
            location.reload();
        }
    }

    // Get application info
    getInfo() {
        return {
            version: '1.0.0',
            initialized: this.initialized,
            currentScreen: this.currentScreen,
            hasWallet: !!this.wallet,
            nodeUrl: window.ctcApi?.baseUrl || 'Unknown',
            isOnline: navigator.onLine,
            isTelegram: Utils.isTelegramWebApp(),
            components: {
                welcomeScreen: !!window.welcomeScreen,
                walletScreen: !!window.walletScreen,
                accountManager: !!window.accountManager,
                ctcApi: !!window.ctcApi
            }
        };
    }

    // Set current screen (for tracking)
    setCurrentScreen(screenName) {
        this.currentScreen = screenName;
        
        // Update Telegram WebApp back button
        const tgWebApp = Utils.getTelegramWebApp();
        if (tgWebApp && tgWebApp.BackButton && tgWebApp.version >= 6.1) {
            if (screenName && screenName !== 'wallet') {
                tgWebApp.BackButton.show();
            } else {
                tgWebApp.BackButton.hide();
            }
        }
    }

    // Show loading screen
    showLoading(message = 'Loading...') {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon">
                        <div class="loading" style="width: 60px; height: 60px; border-width: 4px;"></div>
                    </div>
                    <h2 class="screen-title">${message}</h2>
                </div>
            </div>
        `;
        
        if (DOM && DOM.setContent) {
            DOM.setContent('app-container', content);
        } else {
            document.getElementById('app-container').innerHTML = content;
        }
    }

    // Check if app is ready
    isReady() {
        return this.initialized;
    }

    // Get current wallet
    getCurrentWallet() {
        return window.walletScreen?.getCurrentWallet() || null;
    }

    // Emergency recovery mode
    enterRecoveryMode() {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon" style="background: #ff9800;">🔧</div>
                    <h2 class="screen-title">Recovery Mode</h2>
                    <p class="screen-subtitle">Use this to recover or reset your wallet</p>
                </div>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.showImport()">
                    Import Wallet from Seed
                </button>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.showWelcome()">
                    Create New Wallet
                </button>
                
                <button class="btn btn-danger" onclick="app.reset()" style="margin-top: 40px;">
                    Reset All Data
                </button>
            </div>
        `;
        
        if (DOM && DOM.setContent) {
            DOM.setContent('app-container', content);
        } else {
            document.getElementById('app-container').innerHTML = content;
        }
    }

    // Development/debug functions
    debug() {
        return {
            app: this.getInfo(),
            wallet: this.getCurrentWallet(),
            balance: window.walletScreen?.getCurrentBalance() || 0,
            storage: {
                accounts: Storage?.get('ctc-accounts') || null,
                wallet: Storage?.get('ctc-wallet') || null,
                hasData: !!(Storage?.get('ctc-accounts') || Storage?.get('ctc-wallet'))
            },
            api: {
                baseUrl: window.ctcApi?.baseUrl || 'Unknown',
                timeout: window.ctcApi?.timeout || 'Unknown'
            }
        };
    }
}

// Application lifecycle management
class AppLifecycle {
    constructor(app) {
        this.app = app;
        this.setupLifecycleEvents();
    }

    setupLifecycleEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppPause();
            } else {
                this.onAppResume();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.onAppDestroy();
        });

        // Handle focus/blur events
        window.addEventListener('focus', () => {
            this.onAppResume();
        });

        window.addEventListener('blur', () => {
            this.onAppPause();
        });
    }

    onAppPause() {
        console.log('📱 App paused');
        // Stop balance updates to save resources
        if (window.balanceManager) {
            window.balanceManager.stopAutoUpdate();
        }
    }

    onAppResume() {
        console.log('📱 App resumed');
        // Resume balance updates if wallet is loaded
        const wallet = window.walletScreen?.getCurrentWallet();
        if (wallet && window.balanceManager) {
            window.balanceManager.startAutoUpdate(wallet.address);
        }
    }

    onAppDestroy() {
        console.log('📱 App destroyed');
        // Clean up resources
        if (window.balanceManager) {
            window.balanceManager.stopAutoUpdate();
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 DOM loaded, starting CTC Wallet App...');
    
    // Create global app instance
    window.app = new CTCWalletApp();
    window.appLifecycle = new AppLifecycle(window.app);
    
    // Initialize the application
    try {
        await window.app.init();
    } catch (error) {
        console.error('Failed to start app:', error);
        if (window.app) {
            window.app.showError('Failed to start application');
        } else {
            document.getElementById('app-container').innerHTML = `
                <div class="screen active">
                    <div class="illustration">
                        <div class="icon" style="background: #ff4444;">⚠️</div>
                        <h2 class="screen-title">Critical Error</h2>
                        <p class="screen-subtitle">Failed to initialize the application</p>
                    </div>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
});

// Export for debugging
window.debug = () => window.app?.debug() || 'App not initialized';

// Development helpers (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.devtools = {
        // Quick access to main components
        app: () => window.app,
        wallet: () => window.walletScreen?.getCurrentWallet(),
        storage: window.Storage,
        api: () => window.ctcApi,
        
        // Quick actions
        resetApp: () => window.app?.reset(),
        showRecovery: () => window.app?.enterRecoveryMode(),
        clearStorage: () => window.Storage?.clear(),
        
        // Create test wallet
        createTestWallet: async () => {
            if (window.CTCWallet) {
                const wallet = await window.CTCWallet.create();
                console.log('Test wallet created:', wallet);
                return wallet;
            } else {
                console.error('CTCWallet not available');
            }
        },
        
        // Get debug info
        info: () => window.app?.debug() || 'App not initialized'
    };
    
    console.log('🛠️ Development tools available via window.devtools');
}