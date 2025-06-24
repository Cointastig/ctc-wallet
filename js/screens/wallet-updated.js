// js/screens/wallet-updated.js - FIXED Wallet Main Screen

class WalletScreen {
    constructor() {
        this.currentWallet = null;
        this.currentBalance = 0;
        this.stakedBalance = 0;
        this.transactions = [];
        this.isLoading = false;
        this.ctcPrice = 0.001; // Default CTC price in USD
        this.api = null;
        this.balanceMonitor = null;
        this.useAccountSystem = false; // Flag für Account-System
    }

    // Initialize wallet screen
    async initialize(wallet) {
        if (!wallet) {
            throw new Error('No wallet provided');
        }
        
        this.currentWallet = wallet;
        
        // Initialize API if not already done
        if (!this.api) {
            this.api = new APIService();
        }
        
        console.log('🏦 Wallet screen initialized for:', wallet.address || wallet.getAddress());
    }

    // Show wallet screen
    async show() {
        try {
            if (!this.currentWallet) {
                throw new Error('No wallet loaded');
            }
            
            // Render the UI first
            this.renderWalletUI();
            
            // Start monitoring and load data
            this.startMonitoring();
            await this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Failed to show wallet:', error);
            this.showError('Failed to load wallet data');
        }
    }

    // Render moderne wallet UI
    renderWalletUI() {
        const container = document.getElementById('app-container');
        
        const walletAddress = this.currentWallet?.address || this.currentWallet?.getAddress() || '';
        const accountName = this.getAccountName();
        const accountInitial = accountName.charAt(0).toUpperCase();
        
        container.innerHTML = `
            <div class="wallet-container">
                <!-- Header mit Account Info -->
                <div class="wallet-header">
                    <div class="account-info">
                        <div class="account-name">Wallet</div>
                    </div>
                    <div class="account-avatar">
                        <div class="avatar-circle">
                            ${accountInitial}
                        </div>
                    </div>
                </div>

                <!-- Balance Card -->
                <div class="balance-card">
                    <div class="balance-header">
                        <span class="balance-label">Gesamtguthaben</span>
                        <span class="balance-change" id="balance-change">+2.4%</span>
                    </div>
                    <div class="balance-amount">
                        <span class="balance-value" id="balance-value">0.0000 CTC</span>
                    </div>
                    <div class="balance-usd" id="balance-usd">≈ $0.00</div>
                </div>

                <!-- Action Menu -->
                <div class="action-menu">
                    <button class="action-btn send-btn" onclick="sendScreen.show()">
                        <div class="action-icon">
                            <i class="fas fa-paper-plane"></i>
                        </div>
                        <span>Senden</span>
                    </button>
                    <button class="action-btn receive-btn" onclick="receiveScreen.show()">
                        <div class="action-icon">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <span>Erhalten</span>
                    </button>
                    <button class="action-btn stake-btn" onclick="walletScreen.showStaking()">
                        <div class="action-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <span>Staking</span>
                    </button>
                    <button class="action-btn more-btn" onclick="walletScreen.showMore()">
                        <div class="action-icon">
                            <i class="fas fa-ellipsis-h"></i>
                        </div>
                        <span>Mehr</span>
                    </button>
                </div>

                <!-- Recent Transactions -->
                <div class="transactions-section">
                    <div class="section-header">
                        <h3>Recent Transactions</h3>
                        <button class="btn-link" onclick="walletScreen.showAllTransactions()">
                            Alle anzeigen
                        </button>
                    </div>
                    
                    <div class="transactions-list" id="transactions-list">
                        ${this.renderLoadingTransactions()}
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        this.setupEventListeners();
    }

    // Render loading state for transactions
    renderLoadingTransactions() {
        return `
            <div class="transaction-item loading">
                <div class="tx-icon loading-skeleton"></div>
                <div class="tx-info">
                    <div class="loading-skeleton" style="width: 120px; height: 16px; margin-bottom: 4px;"></div>
                    <div class="loading-skeleton" style="width: 80px; height: 12px;"></div>
                </div>
                <div class="tx-amount">
                    <div class="loading-skeleton" style="width: 60px; height: 16px;"></div>
                </div>
            </div>
            <div class="transaction-item loading">
                <div class="tx-icon loading-skeleton"></div>
                <div class="tx-info">
                    <div class="loading-skeleton" style="width: 100px; height: 16px; margin-bottom: 4px;"></div>
                    <div class="loading-skeleton" style="width: 60px; height: 12px;"></div>
                </div>
                <div class="tx-amount">
                    <div class="loading-skeleton" style="width: 70px; height: 16px;"></div>
                </div>
            </div>
        `;
    }

    // Load initial data
    async loadInitialData() {
        try {
            this.isLoading = true;
            
            // Load balance
            await this.loadBalance();
            
            // Load transactions
            await this.loadTransactions();
            
            // Load CTC price
            await this.loadCTCPrice();
            
            this.isLoading = false;
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.isLoading = false;
        }
    }

    // Load balance
    async loadBalance() {
        try {
            if (!this.api) {
                this.api = new APIService();
            }
            
            const address = this.currentWallet?.address || this.currentWallet?.getAddress();
            if (!address) return;
            
            // Get balance from API
            const balance = await this.api.getBalance(address);
            
            if (typeof balance === 'number') {
                this.currentBalance = balance; // Balance is already in micro-CTC
            } else if (balance && typeof balance.balance === 'number') {
                this.currentBalance = balance.balance;
            } else {
                console.warn('Invalid balance response:', balance);
                this.currentBalance = 0;
            }
            
            // Get staked balance
            try {
                const staked = await this.api.getStakedBalance(address);
                this.stakedBalance = typeof staked === 'number' ? staked : 0;
            } catch (error) {
                console.warn('Failed to get staked balance:', error);
                this.stakedBalance = 0;
            }
            
            this.updateBalanceDisplay();
            
        } catch (error) {
            console.error('❌ Failed to load balance:', error);
            // Set fallback balance for demo
            this.currentBalance = 0;
            this.updateBalanceDisplay();
        }
    }

    // Load transactions
    async loadTransactions() {
        try {
            const address = this.currentWallet?.address || this.currentWallet?.getAddress();
            if (!address) return;
            
            const txHistory = await this.api.getTransactionHistory(address);
            
            if (Array.isArray(txHistory)) {
                this.transactions = txHistory.slice(0, 10); // Limit to 10 recent transactions
            } else {
                this.transactions = [];
            }
            
            this.renderTransactions();
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.transactions = [];
            this.renderEmptyTransactions();
        }
    }

    // Load CTC price
    async loadCTCPrice() {
        try {
            // For now, use a fixed price or API endpoint
            this.ctcPrice = 0.001; // $0.001 per CTC
            this.updateBalanceDisplay();
        } catch (error) {
            console.error('❌ Failed to load CTC price:', error);
        }
    }

    // Update balance display
    updateBalanceDisplay() {
        const balanceValueEl = document.getElementById('balance-value');
        const balanceUSDEl = document.getElementById('balance-usd');
        
        if (balanceValueEl && balanceUSDEl) {
            const ctcBalance = this.currentBalance / 100_000_000; // Convert micro-CTC to CTC
            const usdValue = ctcBalance * this.ctcPrice;
            
            balanceValueEl.textContent = `${ctcBalance.toFixed(4)} CTC`;
            balanceUSDEl.textContent = `≈ $${usdValue.toFixed(4)}`;
        }
    }

    // Render transactions
    renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;
        
        if (this.transactions.length === 0) {
            this.renderEmptyTransactions();
            return;
        }
        
        const transactionsHTML = this.transactions.map(tx => {
            const transaction = tx.transaction || tx; // Handle both formats
            const isOutgoing = transaction.from === (this.currentWallet?.address || this.currentWallet?.getAddress());
            const amount = transaction.amount || 0;
            const ctcAmount = amount / 100_000_000;
            
            return `
                <div class="transaction-item ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <div class="tx-icon">
                        <i class="fas ${isOutgoing ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    </div>
                    <div class="tx-info">
                        <div class="tx-address">
                            ${isOutgoing ? `To: ${Format.address(transaction.to)}` : `From: ${Format.address(transaction.from)}`}
                        </div>
                        <div class="tx-time">${this.formatTransactionTime(transaction.timestamp)}</div>
                    </div>
                    <div class="tx-amount ${isOutgoing ? 'negative' : 'positive'}">
                        ${isOutgoing ? '-' : '+'}${ctcAmount.toFixed(4)} CTC
                    </div>
                </div>
            `;
        }).join('');
        
        transactionsList.innerHTML = transactionsHTML;
    }

    // Render empty transactions
    renderEmptyTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;
        
        transactionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <h3>Keine Transaktionen</h3>
                <p>Ihre Transaktionen werden hier angezeigt</p>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Add any additional event listeners here
        console.log('🎧 Event listeners setup completed');
    }

    // Start monitoring
    startMonitoring() {
        // Start balance monitoring every 30 seconds
        if (this.balanceMonitor) {
            clearInterval(this.balanceMonitor);
        }
        
        this.balanceMonitor = setInterval(() => {
            this.loadBalance();
        }, 30000);
        
        console.log('📡 Balance monitoring started');
    }

    // Stop monitoring
    stopMonitoring() {
        if (this.balanceMonitor) {
            clearInterval(this.balanceMonitor);
            this.balanceMonitor = null;
        }
        console.log('🔇 Balance monitoring stopped');
    }

    // Show staking interface
    showStaking() {
        console.log('🪙 Showing staking interface...');
        // Implementation for staking interface
        Toast.info('Staking interface coming soon!');
    }

    // Show more options
    showMore() {
        console.log('⚙️ Showing more options...');
        // Implementation for more options
        Toast.info('More options coming soon!');
    }

    // Show all transactions
    showAllTransactions() {
        console.log('📜 Showing all transactions...');
        // Implementation for all transactions view
        Toast.info('Full transaction history coming soon!');
    }

    // Get account name
    getAccountName() {
        // If using account system
        if (this.useAccountSystem && this.currentWallet?.accountId) {
            const account = accountManager.getAccount(this.currentWallet.accountId);
            return account ? account.name : 'Unknown Account';
        }
        
        // Default wallet name
        return 'CTC Wallet';
    }

    // Format transaction time
    formatTransactionTime(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
        
        // Older
        return date.toLocaleDateString();
    }

    // Get current wallet for other screens
    getCurrentWallet() {
        return this.currentWallet;
    }

    // Get current balance for other screens - FIX HINZUGEFÜGT
    getCurrentBalance() {
        return this.currentBalance || 0;
    }

    // Get current staked balance for other screens - FIX HINZUGEFÜGT  
    getStakedBalance() {
        return this.stakedBalance || 0;
    }

    // Get wallet address - FIX HINZUGEFÜGT
    getCurrentAddress() {
        return this.currentWallet?.address || this.currentWallet?.getAddress() || '';
    }

    // Show error
    showError(message) {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error</h2>
                <p>${message}</p>
                <button class="btn-primary" onclick="walletScreen.show()">
                    Retry
                </button>
                <button class="btn-secondary" onclick="app.lockWallet()">
                    Back to Login
                </button>
            </div>
        `;
    }

    // Cleanup
    destroy() {
        this.stopMonitoring();
        this.currentWallet = null;
        this.transactions = [];
        console.log('🧹 Wallet screen cleanup completed');
    }
}

// Globale Instanz
const walletScreen = new WalletScreen();

// Export
window.walletScreen = walletScreen;
window.WalletScreen = WalletScreen;

console.log('🏦 Wallet Screen loaded');