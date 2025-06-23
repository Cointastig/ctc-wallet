// js/screens/wallet-updated.js - Modern Wallet Interface - CTC-fokussiert ohne Assets

class WalletScreen {
    constructor() {
        this.currentWallet = null;
        this.currentBalance = 0;
        this.balanceUSD = 0;
        this.ctcPrice = 0;
        this.transactions = [];
        this.refreshInterval = null;
        this.balanceMonitor = null;
        this.useAccountSystem = false; // Multi-account support
        
        console.log('🏦 Modern Wallet Screen initialized');
    }

    // Initialize wallet screen with wallet data
    async initialize(wallet, enableAccountSystem = false) {
        try {
            if (!wallet) {
                throw new Error('Wallet data is required');
            }
            
            this.currentWallet = wallet;
            this.useAccountSystem = enableAccountSystem;
            
            // Initialize price data
            await this.updateCTCPrice();
            
            // Update balance
            await this.updateBalance();
            
            // Load recent transactions
            await this.loadTransactions();
            
            console.log('✅ Wallet initialized:', {
                address: wallet.address,
                balance: this.currentBalance,
                accountSystem: this.useAccountSystem ? 'Enabled' : 'Disabled'
            });
            
            // Set up balance monitoring
            this.setupBalanceMonitoring();
            
            // Set up transaction monitoring
            this.setupTransactionMonitoring();
            
            // Show the wallet interface
            this.show();
            
            // Start data refresh
            this.startAutoRefresh();
            
            console.log('✅ Modern Wallet Screen initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize wallet screen:', error);
            Toast.error('Failed to initialize wallet: ' + error.message);
        }
    }

    // Show wallet screen with modern design
    show() {
        try {
            if (!this.currentWallet) {
                console.error('No wallet available to display');
                Toast.error('Wallet not initialized');
                return;
            }
            
            const content = this.renderModernWalletContent();
            DOM.setContent('app-container', content);
            
            // Add micro-interactions after content is loaded
            setTimeout(() => {
                this.initializeMicroInteractions();
            }, 100);
            
            // Update app current screen
            if (window.app) {
                window.app.setCurrentScreen('wallet');
            }
            
            console.log('📱 Modern Wallet screen displayed');
            
        } catch (error) {
            console.error('❌ Error showing wallet screen:', error);
            Toast.error('Failed to display wallet');
        }
    }

    // Render modern wallet content - CTC-fokussiert ohne Assets
    renderModernWalletContent() {
        const changePercent = this.calculateBalanceChange();
        const isPositive = changePercent >= 0;
        
        return `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <h1 class="header-title">Wallet</h1>
                    <button class="header-action" onclick="${this.useAccountSystem ? 'accountSelectorScreen.show()' : 'walletScreen.showSettings()'}">
                        ${this.getInitials()}
                    </button>
                </div>
                
                <!-- Balance Section - CTC Balance -->
                <div class="balance-section">
                    <div class="account-info">
                        <span>CTC Guthaben</span>
                        ${this.useAccountSystem ? `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7; cursor: pointer;" onclick="accountSelectorScreen.show()">
                                <path d="m6 9 6 6 6-6"/>
                            </svg>
                        ` : ''}
                        <span style="margin-left: auto; font-size: 12px; color: ${isPositive ? '#00d4aa' : '#ff6b6b'};">
                            ${isPositive ? '+' : ''}${changePercent.toFixed(1)}%
                        </span>
                    </div>
                    <h1 class="balance-amount" id="balance-amount">${Format.ctc(this.currentBalance, 4)}</h1>
                    <div class="balance-change" id="balance-change">
                        <span style="color: rgba(255,255,255,0.8);">${Format.usd(this.balanceUSD)}</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button class="action-btn" onclick="sendScreen.show()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m3 3 3 9-3 9 19-9Z"/>
                        </svg>
                        <span>Senden</span>
                    </button>
                    <button class="action-btn" onclick="receiveScreen.show()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" x2="12" y1="15" y2="3"/>
                        </svg>
                        <span>Erhalten</span>
                    </button>
                    <button class="action-btn" onclick="walletScreen.showStaking()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <span>Staken</span>
                    </button>
                    <button class="action-btn" onclick="walletScreen.showMore()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                            <circle cx="5" cy="12" r="1"/>
                        </svg>
                        <span>Mehr</span>
                    </button>
                </div>
                
                <!-- Transactions Section - Direkt ohne Assets -->
                <div class="assets-section">
                    <div class="section-header">
                        <h2 class="section-title">Letzte Transaktionen</h2>
                        <a href="#" class="section-link" onclick="walletScreen.showAllTransactions()">Alle anzeigen</a>
                    </div>
                    
                    <div class="transaction-list" id="transaction-list">
                        ${this.renderTransactionList()}
                    </div>
                </div>
                
                <!-- Bottom Navigation -->
                <div class="bottom-nav">
                    <div class="nav-item nav-item-active" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                        <span>Home</span>
                    </div>
                    <div class="nav-item" onclick="walletScreen.showMarkets()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18"/>
                            <path d="m19 9-5 5-4-4-3 3"/>
                        </svg>
                        <span>Märkte</span>
                    </div>
                    <div class="nav-item" onclick="walletScreen.showPortfolio()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        <span>Portfolio</span>
                    </div>
                    <div class="nav-item" onclick="walletScreen.showProfile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>Profil</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Berechne Balance-Änderung (einfache Simulation basierend auf aktueller Balance)
    calculateBalanceChange() {
        // Einfache Berechnung basierend auf der aktuellen Balance
        // In einer echten App würde man die historischen Daten verwenden
        const seed = this.currentBalance * 1000;
        const change = (Math.sin(seed) * 5) + 2; // -3% bis +7%
        return change;
    }

    // Hilfsfunktionen für das neue Design
    getInitials() {
        if (this.useAccountSystem && window.accountManager) {
            const account = accountManager.getCurrentAccount();
            if (account && account.name) {
                return account.name.charAt(0).toUpperCase();
            }
        }
        return 'M';
    }

    showStaking() {
        Toast.info('Staking-Feature kommt bald!');
    }

    showMore() {
        Toast.info('Weitere Optionen kommen bald!');
    }

    showMarkets() {
        Toast.info('Märkte-Feature kommt bald!');
    }

    showPortfolio() {
        Toast.info('Portfolio-Analyse kommt bald!');
    }

    showProfile() {
        this.showSettings();
    }

    // Render transaction list mit echten Daten
    renderTransactionList() {
        if (!this.transactions || this.transactions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3 class="empty-state-title">Keine Transaktionen</h3>
                    <p class="empty-state-subtitle">Ihre Transaktionshistorie wird hier angezeigt</p>
                </div>
            `;
        }

        // Zeige maximal 5 Transaktionen auf der Hauptseite
        const displayTransactions = this.transactions.slice(0, 5);
        return displayTransactions.map(tx => this.renderTransactionItem(tx)).join('');
    }

    // Render individual transaction item
    renderTransactionItem(tx) {
        const transaction = tx.Transaction || tx;
        const isReceived = transaction.To === this.currentWallet.address;
        const amount = transaction.Amount / 100000000; // Convert from micro-CTC
        const date = new Date(transaction.Timestamp);
        
        const icon = isReceived ? '📥' : '📤';
        const amountClass = isReceived ? 'received' : 'sent';
        const amountPrefix = isReceived ? '+' : '-';
        const title = isReceived ? 'Empfangen' : 'Gesendet';
        
        return `
            <div class="transaction-item" onclick="walletScreen.showTransactionDetails('${transaction.Timestamp}')">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-content">
                    <div class="transaction-header">
                        <h4 class="transaction-title">${title}</h4>
                        <div class="transaction-amount">
                            <p class="transaction-amount-main ${amountClass}">
                                ${amountPrefix}${Format.ctc(amount, 4)}
                            </p>
                        </div>
                    </div>
                    <div class="transaction-footer">
                        <p class="transaction-date">${Format.timeAgo(date)}</p>
                        <div class="transaction-amount">
                            <p class="transaction-amount-usd">
                                ${amountPrefix}${Format.usd(amount * this.ctcPrice)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update CTC price from API
    async updateCTCPrice() {
        try {
            if (!window.ctcApi) {
                throw new Error('CTC API not available');
            }
            
            const priceData = await window.ctcApi.getPrice();
            this.ctcPrice = priceData.usd || 0.05; // Fallback
            
            console.log(`💰 CTC Price updated: $${this.ctcPrice}`);
            
        } catch (error) {
            console.warn('⚠️ Failed to update CTC price, using fallback:', error);
            this.ctcPrice = 0.05; // Fallback price
        }
    }

    // Update wallet balance - verwende echte Daten
    async updateBalance() {
        try {
            if (!this.currentWallet) {
                throw new Error('No wallet available');
            }
            
            if (!window.ctcApi) {
                throw new Error('CTC API not available');
            }
            
            console.log('📊 Updating balance for address:', this.currentWallet.address);
            
            // Hole echte Balance von der API
            const balance = await window.ctcApi.getBalance(this.currentWallet.address);
            this.currentBalance = balance;
            this.balanceUSD = balance * this.ctcPrice;
            
            // Update balance display if wallet is currently shown
            const balanceElement = DOM.get('balance-amount');
            if (balanceElement) {
                balanceElement.textContent = Format.ctc(this.currentBalance, 4);
                
                // Add update animation
                balanceElement.style.animation = 'none';
                setTimeout(() => {
                    balanceElement.style.animation = 'pulseGlow 1s ease-in-out';
                }, 10);
            }
            
            // Update USD value display
            const changeElement = DOM.get('balance-change');
            if (changeElement) {
                changeElement.innerHTML = `<span style="color: rgba(255,255,255,0.8);">${Format.usd(this.balanceUSD)}</span>`;
            }
            
            // Update account balance if using account system
            if (this.useAccountSystem && window.accountManager) {
                const currentAccountIndex = accountManager.currentAccountIndex;
                accountManager.updateAccountBalance(currentAccountIndex, this.currentBalance, this.balanceUSD);
            }
            
            console.log(`💰 Balance updated: ${Format.ctc(balance, 4)} (${Format.usd(this.balanceUSD)})`);
            
        } catch (error) {
            console.error('❌ Failed to update balance:', error);
            Toast.error('Failed to update balance: ' + error.message);
        }
    }

    // Load recent transactions - verwende echte Daten
    async loadTransactions() {
        try {
            if (!this.currentWallet) {
                throw new Error('No wallet available');
            }
            
            if (!window.ctcApi) {
                throw new Error('CTC API not available');
            }
            
            console.log('📋 Loading transactions for address:', this.currentWallet.address);
            
            const transactions = await window.ctcApi.getTransactionHistory(this.currentWallet.address);
            this.transactions = transactions || [];
            
            // Update transaction list if currently displayed
            const transactionListElement = DOM.get('transaction-list');
            if (transactionListElement) {
                transactionListElement.innerHTML = this.renderTransactionList();
            }
            
            console.log(`📋 Loaded ${this.transactions.length} transactions`);
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.transactions = [];
        }
    }

    // Set up real-time balance monitoring
    setupBalanceMonitoring() {
        if (this.balanceMonitor) {
            clearInterval(this.balanceMonitor);
        }
        
        this.balanceMonitor = setInterval(async () => {
            await this.updateBalance();
        }, 30000); // Check every 30 seconds
        
        console.log('👁️ Balance monitoring started');
    }

    // Set up transaction monitoring
    setupTransactionMonitoring() {
        // This would integrate with real-time transaction updates
        console.log('🔄 Transaction monitoring ready');
    }

    // Start auto-refresh of data
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(async () => {
            await this.updateCTCPrice();
            await this.loadTransactions();
        }, 60000); // Refresh every minute
        
        console.log('🔄 Auto-refresh started');
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        if (this.balanceMonitor) {
            clearInterval(this.balanceMonitor);
            this.balanceMonitor = null;
        }
        
        console.log('⏹️ Auto-refresh stopped');
    }

    // Initialize micro-interactions and animations
    initializeMicroInteractions() {
        // Add hover effects to action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Add click effects to transaction items
        const transactionItems = document.querySelectorAll('.transaction-item');
        transactionItems.forEach(item => {
            item.addEventListener('click', () => {
                // Add click animation
                item.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 150);
            });
        });

        // Add pulse animation to balance when it updates
        const balanceElement = DOM.get('balance-amount');
        if (balanceElement) {
            balanceElement.addEventListener('DOMNodeInserted', () => {
                balanceElement.style.animation = 'none';
                setTimeout(() => {
                    balanceElement.style.animation = 'pulseGlow 1s ease-in-out';
                }, 10);
            });
        }
    }

    // Show transaction details
    showTransactionDetails(timestamp) {
        const transaction = this.transactions.find(tx => 
            (tx.Transaction ? tx.Transaction.Timestamp : tx.Timestamp) == timestamp
        );
        
        if (!transaction) {
            Toast.error('Transaction details not found');
            return;
        }
        
        const tx = transaction.Transaction || transaction;
        const isReceived = tx.To === this.currentWallet.address;
        const amount = tx.Amount / 100000000;
        const date = new Date(tx.Timestamp);
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Transaction Details</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <div class="card">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">
                                ${isReceived ? '📥' : '📤'}
                            </div>
                            <h2 style="margin: 0; color: ${isReceived ? '#4ECDC4' : '#fff'};">
                                ${isReceived ? '+' : '-'}${Format.ctc(amount, 4)}
                            </h2>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.6);">
                                ${isReceived ? '+' : '-'}${Format.usd(amount * this.ctcPrice)}
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                            <div style="margin-bottom: 16px;">
                                <span style="color: rgba(255,255,255,0.6);">Status:</span>
                                <span style="float: right; color: #4ECDC4;">Bestätigt</span>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <span style="color: rgba(255,255,255,0.6);">Datum:</span>
                                <span style="float: right;">${Format.date(date)}</span>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <span style="color: rgba(255,255,255,0.6);">Von:</span>
                                <span style="float: right; font-family: monospace; font-size: 12px;">
                                    ${Format.address(tx.From)}
                                </span>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <span style="color: rgba(255,255,255,0.6);">An:</span>
                                <span style="float: right; font-family: monospace; font-size: 12px;">
                                    ${Format.address(tx.To)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show settings screen
    showSettings() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Settings</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Account Management -->
                    ${this.useAccountSystem ? `
                        <div class="card" style="margin-bottom: 20px;">
                            <h3 style="color: #6B9EFF; margin-bottom: 16px;">Account Management</h3>
                            <button onclick="accountSelectorScreen.show()" class="btn btn-secondary">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                Manage Accounts
                            </button>
                        </div>
                    ` : ''}
                    
                    <!-- Wallet Actions -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3 style="color: #6B9EFF; margin-bottom: 16px;">Wallet Actions</h3>
                        <button onclick="walletScreen.showSeed()" class="btn btn-secondary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            View Recovery Phrase
                        </button>
                        <button onclick="walletScreen.exportWallet()" class="btn btn-secondary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17,8 12,3 7,8"/>
                                <line x1="12" x2="12" y1="3" y2="15"/>
                            </svg>
                            Export Private Key
                        </button>
                    </div>
                    
                    <!-- Network Settings -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3 style="color: #6B9EFF; margin-bottom: 16px;">Network</h3>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span>Network:</span>
                            <span style="color: #4ECDC4; font-weight: 600;">Creditcoin Mainnet</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Node:</span>
                            <span style="color: #00D4FF; font-family: monospace; font-size: 12px;">rpc.creditcoin.org</span>
                        </div>
                    </div>
                    
                    <!-- Security -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3 style="color: #6B9EFF; margin-bottom: 16px;">Security</h3>
                        <button onclick="walletScreen.clearWallet()" class="btn btn-danger">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Clear Wallet Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show seed phrase for backup
    showSeed() {
        if (!this.currentWallet) {
            Toast.error('No wallet available');
            return;
        }

        let mnemonic;
        try {
            if (this.currentWallet.isLocked && this.currentWallet.isLocked()) {
                Toast.error('Wallet is locked. Please unlock first.');
                return;
            }
            
            mnemonic = this.currentWallet.getMnemonicForDisplay ? 
                      this.currentWallet.getMnemonicForDisplay() : 
                      this.currentWallet.mnemonic;
        } catch (error) {
            Toast.error('Could not access recovery phrase: ' + error.message);
            return;
        }

        if (!mnemonic) {
            Toast.error('No recovery phrase available');
            return;
        }

        const seedWords = mnemonic.split(' ');
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.showSettings()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Recovery Phrase</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Warning -->
                    <div class="card" style="border: 1px solid #ff6b6b; background: rgba(255, 107, 107, 0.1); margin-bottom: 20px;">
                        <h3 style="color: #ff6b6b; margin-bottom: 12px;">⚠️ Security Warning</h3>
                        <p style="color: rgba(255,255,255,0.9); line-height: 1.5; margin: 0;">
                            Never share your recovery phrase with anyone. Anyone with access to these words can control your wallet and steal your funds.
                        </p>
                    </div>
                    
                    <!-- Seed Words -->
                    <div class="card">
                        <h3 style="color: #6B9EFF; margin-bottom: 20px;">Your 12-Word Recovery Phrase</h3>
                        <div class="seed-words">
                            ${seedWords.map((word, index) => `
                                <div class="seed-word">
                                    <span class="seed-number">${index + 1}</span>
                                    <span class="seed-text">${word}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <button onclick="Utils.copyToClipboard('${mnemonic}').then(() => Toast.success('Recovery phrase copied!'))" class="btn btn-secondary" style="margin-top: 20px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            Copy to Clipboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Export private key
    exportWallet() {
        if (!this.currentWallet) {
            Toast.error('No wallet available');
            return;
        }

        let privateKeyHex;
        try {
            if (this.currentWallet.isLocked && this.currentWallet.isLocked()) {
                Toast.error('Wallet is locked. Please unlock first.');
                return;
            }
            
            privateKeyHex = this.currentWallet.privateKeyHex || 
                           (this.currentWallet.privateKeyBytes ? 
                            Array.from(this.currentWallet.privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('') :
                            null);
        } catch (error) {
            Toast.error('Could not access private key: ' + error.message);
            return;
        }

        if (!privateKeyHex) {
            Toast.error('No private key available');
            return;
        }

        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.showSettings()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Export Private Key</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Warning -->
                    <div class="card" style="border: 1px solid #ff6b6b; background: rgba(255, 107, 107, 0.1); margin-bottom: 20px;">
                        <h3 style="color: #ff6b6b; margin-bottom: 12px;">🔐 Extreme Caution Required</h3>
                        <p style="color: rgba(255,255,255,0.9); line-height: 1.5; margin: 0;">
                            Your private key gives complete control over your wallet. Never share it with anyone or enter it on suspicious websites.
                        </p>
                    </div>
                    
                    <!-- Private Key -->
                    <div class="card">
                        <h3 style="color: #6B9EFF; margin-bottom: 16px;">Private Key</h3>
                        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                            <p style="font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 12px; color: #00D4FF; word-break: break-all; line-height: 1.5; margin: 0;">
                                ${privateKeyHex}
                            </p>
                        </div>
                        
                        <button onclick="Utils.copyToClipboard('${privateKeyHex}').then(() => Toast.success('Private key copied!'))" class="btn btn-secondary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                            Copy Private Key
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Clear wallet data
    clearWallet() {
        if (confirm('Are you sure you want to clear all wallet data? This action cannot be undone. Make sure you have backed up your recovery phrase.')) {
            if (this.useAccountSystem && window.accountManager) {
                if (accountManager.clearAllDataSecure) {
                    accountManager.clearAllDataSecure();
                } else {
                    accountManager.clearAllData();
                }
            } else {
                Storage.remove('ctc-wallet');
            }
            
            this.stopAutoRefresh();
            
            Toast.success('Wallet data cleared');
            
            // Redirect to welcome screen
            setTimeout(() => {
                if (window.welcomeScreen) {
                    window.welcomeScreen.showWelcome();
                } else {
                    location.reload();
                }
            }, 1000);
        }
    }

    // Show all transactions
    showAllTransactions() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">All Transactions</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <div class="transaction-list">
                        ${this.renderAllTransactionList()}
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Render all transactions (not limited to 5)
    renderAllTransactionList() {
        if (!this.transactions || this.transactions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3 class="empty-state-title">Keine Transaktionen</h3>
                    <p class="empty-state-subtitle">Ihre Transaktionshistorie wird hier angezeigt</p>
                </div>
            `;
        }

        return this.transactions.map(tx => this.renderTransactionItem(tx)).join('');
    }

    // Manual refresh function
    async refreshData() {
        try {
            Toast.info('Refreshing wallet data...');
            
            await this.updateCTCPrice();
            await this.updateBalance();
            await this.loadTransactions();
            
            Toast.success('Wallet data refreshed');
            
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            Toast.error('Failed to refresh wallet data');
        }
    }

    // Get current wallet data
    getCurrentWallet() {
        return this.currentWallet;
    }

    // Get current balance
    getCurrentBalance() {
        return this.currentBalance;
    }

    // Get current USD value
    getCurrentUSDValue() {
        return this.balanceUSD;
    }

    // Get CTC price
    getCTCPrice() {
        return this.ctcPrice;
    }

    // Check if account system is enabled
    isAccountSystemEnabled() {
        return this.useAccountSystem;
    }

    // Cleanup when navigating away
    cleanup() {
        this.stopAutoRefresh();
        console.log('🧹 Wallet screen cleaned up');
    }
}

// Create global instance
window.walletScreen = new WalletScreen();

console.log('💼 Modern CTC Wallet Screen loaded');