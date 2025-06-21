// js/screens/wallet-updated.js - Enhanced Wallet Screen with Account Support

class WalletScreen {
    constructor() {
        this.currentWallet = null;
        this.currentBalance = 0;
        this.currentUsdValue = 0;
        this.transactions = [];
        this.isAccountSystemEnabled = false;
        this.autoRefreshInterval = null;
    }

    // Initialize wallet screen
    async initialize(wallet, useAccountSystem = false) {
        try {
            console.log('🏠 Initializing wallet screen...');
            
            this.currentWallet = wallet;
            this.isAccountSystemEnabled = useAccountSystem;
            
            if (!wallet) {
                throw new Error('No wallet provided');
            }
            
            console.log('✅ Wallet initialized:', wallet.address);
            
            // Show the wallet interface
            this.show();
            
            // Start loading data
            this.refreshData();
            
            // Set up auto-refresh
            this.startAutoRefresh();
            
            // Update app current screen
            if (window.app) {
                window.app.setCurrentScreen('wallet');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize wallet screen:', error);
            Toast.error('Failed to initialize wallet: ' + error.message);
        }
    }

    // Show wallet screen
    show() {
        const currentAccount = this.isAccountSystemEnabled ? accountManager.getCurrentAccount() : null;
        const accountIconHtml = currentAccount ? 
            accountIconManager.createAccountIconHtml(currentAccount.iconType, 'medium') : 
            '<div style="width: 48px; height: 48px; background: #6B9EFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">💼</div>';
        
        const content = `
            <div class="wallet-container">
                <!-- Account Selector Header (if account system enabled) -->
                ${this.isAccountSystemEnabled ? `
                    <div class="account-selector-header">
                        <div class="current-account-display" onclick="accountSelectorScreen.show()">
                            ${accountIconHtml}
                            <div class="current-account-info">
                                <h3>${currentAccount?.name || 'Account 1'}</h3>
                                <p>${Format.address(this.currentWallet?.address || '')}</p>
                            </div>
                            <div class="account-dropdown-arrow">›</div>
                        </div>
                        <button class="header-action" onclick="walletScreen.showSettings()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </button>
                    </div>
                ` : `
                    <!-- Legacy Header -->
                    <div class="header">
                        <div style="width: 24px;"></div>
                        <h1 class="header-title">CTC Wallet</h1>
                        <button class="header-action" onclick="walletScreen.showSettings()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </button>
                    </div>
                `}
                
                <!-- Balance Section -->
                <div class="balance-section">
                    <h1 class="balance-amount" id="wallet-balance">
                        ${Format.ctc(this.currentBalance, 4)}
                    </h1>
                    <p class="balance-usd" id="wallet-balance-usd">
                        ${Format.usd(this.currentUsdValue)}
                    </p>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button class="action-btn" onclick="sendScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m22 2-7 20-4-9-9-4Z"/>
                            <path d="M22 2 11 13"/>
                        </svg>
                        Send
                    </button>
                    <button class="action-btn" onclick="receiveScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" x2="12" y1="15" y2="3"/>
                        </svg>
                        Receive
                    </button>
                </div>

                <!-- Transaction History -->
                <div class="transaction-history">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: white; margin: 0; font-size: 18px;">Recent Activity</h2>
                        <button onclick="walletScreen.refreshData()" class="btn-icon btn-ghost" style="width: auto; padding: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M3 21v-5h5"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div id="transaction-list">
                        ${this.renderTransactionList()}
                    </div>
                </div>

                <!-- Bottom Navigation (if account system enabled) -->
                ${this.isAccountSystemEnabled ? `
                    <div class="bottom-nav">
                        <button class="nav-item active" onclick="walletScreen.show()">
                            <div class="nav-item-icon">💼</div>
                            <div class="nav-item-label">Wallet</div>
                        </button>
                        <button class="nav-item" onclick="accountSelectorScreen.show()">
                            <div class="nav-item-icon">👥</div>
                            <div class="nav-item-label">Accounts</div>
                        </button>
                        <button class="nav-item" onclick="walletScreen.showSettings()">
                            <div class="nav-item-icon">⚙️</div>
                            <div class="nav-item-label">Settings</div>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Render transaction list
    renderTransactionList() {
        if (!this.transactions || this.transactions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-title">No transactions yet</div>
                    <div class="empty-state-subtitle">Your transaction history will appear here</div>
                </div>
            `;
        }

        return this.transactions.slice(0, 10).map(tx => {
            const transaction = tx.Transaction || tx;
            const isReceived = transaction.To === this.currentWallet?.address;
            const amount = transaction.Amount / 100000000; // Convert from micro-CTC
            
            return `
                <div class="transaction-item">
                    <div class="transaction-icon">
                        ${isReceived ? 
                            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>' :
                            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>'
                        }
                    </div>
                    <div class="transaction-content">
                        <div class="transaction-header">
                            <h3 class="transaction-title">
                                ${isReceived ? 'Received' : 'Sent'}
                                ${transaction.Type === 'reward' ? ' (Reward)' : ''}
                            </h3>
                            <div class="transaction-amount">
                                <p class="transaction-amount-main ${isReceived ? 'received' : 'sent'}">
                                    ${isReceived ? '+' : '-'}${Format.ctc(amount, 4)}
                                </p>
                                <p class="transaction-amount-usd">
                                    ${Format.usd(amount * 0.05)} <!-- Mock USD value -->
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p class="transaction-date">
                                ${Format.timeAgo(transaction.Timestamp)}
                            </p>
                            <p class="transaction-status confirmed">Confirmed</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Refresh wallet data
    async refreshData() {
        if (!this.currentWallet) return;

        try {
            console.log('🔄 Refreshing wallet data...');
            
            // Update balance
            await this.updateBalance();
            
            // Update transactions
            await this.updateTransactions();
            
            // Update account balance if using account system
            if (this.isAccountSystemEnabled && accountManager.getCurrentAccount()) {
                const currentAccount = accountManager.getCurrentAccount();
                accountManager.updateAccountBalance(
                    currentAccount.index, 
                    this.currentBalance, 
                    this.currentUsdValue
                );
            }
            
            console.log('✅ Wallet data refreshed');
            
        } catch (error) {
            console.error('❌ Failed to refresh wallet data:', error);
        }
    }

    // Update balance
    async updateBalance() {
        try {
            if (balanceManager && this.currentWallet) {
                await balanceManager.updateBalance(this.currentWallet.address);
                this.currentBalance = balanceManager.getCurrentBalance();
                this.currentUsdValue = balanceManager.getCurrentUsdValue();
                
                // Update UI
                this.updateBalanceDisplay();
            }
        } catch (error) {
            console.error('Error updating balance:', error);
        }
    }

    // Update transactions
    async updateTransactions() {
        try {
            if (transactionManager && this.currentWallet) {
                await transactionManager.loadTransactions(this.currentWallet.address);
                this.transactions = transactionManager.getTransactions();
                
                // Update UI
                this.updateTransactionDisplay();
            }
        } catch (error) {
            console.error('Error updating transactions:', error);
        }
    }

    // Update balance display
    updateBalanceDisplay() {
        const balanceElement = DOM.get('wallet-balance');
        const balanceUsdElement = DOM.get('wallet-balance-usd');
        
        if (balanceElement) {
            balanceElement.textContent = Format.ctc(this.currentBalance, 4);
        }
        
        if (balanceUsdElement) {
            balanceUsdElement.textContent = Format.usd(this.currentUsdValue);
        }
    }

    // Update transaction display
    updateTransactionDisplay() {
        const transactionList = DOM.get('transaction-list');
        if (transactionList) {
            transactionList.innerHTML = this.renderTransactionList();
        }
    }

    // Start auto-refresh
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            this.refreshData();
        }, 30000); // Refresh every 30 seconds
        
        console.log('🔄 Auto-refresh started');
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏹️ Auto-refresh stopped');
        }
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
                
                <!-- Settings Content -->
                <div class="settings-section">
                    <!-- Wallet Info -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <rect width="20" height="14" x="2" y="5" rx="2"/>
                                <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                            Wallet Information
                        </h3>
                        <div style="margin-bottom: 16px;">
                            <label style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 8px; display: block;">Address</label>
                            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; word-break: break-all;">
                                <code style="color: #00D4FF; font-size: 14px;">${this.currentWallet?.address || 'N/A'}</code>
                            </div>
                            <button onclick="walletScreen.copyAddress()" class="btn btn-ghost btn-small" style="margin-top: 12px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                                Copy Address
                            </button>
                        </div>
                        
                        ${this.isAccountSystemEnabled ? `
                            <div style="margin-bottom: 16px;">
                                <label style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 8px; display: block;">Account System</label>
                                <p style="color: white; margin: 0;">
                                    Multi-account system enabled
                                    <br>
                                    <small style="color: rgba(255,255,255,0.6);">
                                        ${accountManager.getAllAccounts().length} account(s) created
                                    </small>
                                </p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Security -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="m7 11 V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Security & Backup
                        </h3>
                        
                        <button onclick="walletScreen.showSeedPhrase()" class="settings-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>
                            </svg>
                            Show Recovery Phrase
                        </button>
                        
                        ${this.isAccountSystemEnabled ? `
                            <button onclick="walletScreen.exportAccountData()" class="settings-item">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17,8 12,3 7,8"/>
                                    <line x1="12" x2="12" y1="3" y2="15"/>
                                </svg>
                                Export Account Data
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- Network -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M2 12h20"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            Network
                        </h3>
                        
                        <div style="padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: rgba(255,255,255,0.8);">Node URL</span>
                                <span style="color: white; font-size: 12px; font-family: monospace;">${ctcApi?.baseUrl || 'localhost:3001'}</span>
                            </div>
                        </div>
                        
                        <div style="padding: 16px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: rgba(255,255,255,0.8);">Connection Status</span>
                                <span style="color: ${window.nodeConnectionStatus ? '#4CAF50' : '#ff6b6b'}; font-size: 14px;">
                                    ${window.nodeConnectionStatus ? '🟢 Connected' : '🔴 Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Danger Zone -->
                    <div class="card" style="border: 1px solid rgba(255, 107, 107, 0.3); background: rgba(255, 107, 107, 0.05);">
                        <h3 class="card-header" style="color: #ff6b6b;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                            </svg>
                            Danger Zone
                        </h3>
                        
                        <button onclick="walletScreen.resetWallet()" class="settings-item" style="color: #ff6b6b;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" x2="14" y1="11" y2="11"/>
                                <line x1="10" x2="14" y1="17" y2="17"/>
                            </svg>
                            Reset Wallet
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        
        // Update app current screen
        if (window.app) {
            window.app.setCurrentScreen('settings');
        }
    }

    // Copy wallet address
    async copyAddress() {
        if (!this.currentWallet) return;
        
        try {
            const success = await Utils.copyToClipboard(this.currentWallet.address);
            if (success) {
                Toast.success('Address copied to clipboard');
            } else {
                Toast.error('Failed to copy address');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Failed to copy address');
        }
    }

    // Show seed phrase (with security warning)
    showSeedPhrase() {
        if (!this.currentWallet) {
            Toast.error('No wallet available');
            return;
        }

        if (this.currentWallet.isLocked && this.currentWallet.isLocked()) {
            Toast.error('Wallet is locked');
            return;
        }

        const confirmShow = confirm(
            '⚠️ SECURITY WARNING\n\n' +
            'Your recovery phrase will be displayed on screen.\n\n' +
            '• Never share this phrase with anyone\n' +
            '• Make sure no one is watching your screen\n' +
            '• Take a screenshot only if absolutely necessary\n\n' +
            'Continue?'
        );

        if (!confirmShow) return;

        try {
            const mnemonic = this.currentWallet.getMnemonicForDisplay ? 
                this.currentWallet.getMnemonicForDisplay() : 
                this.currentWallet.mnemonic;

            if (!mnemonic) {
                Toast.error('Recovery phrase not available');
                return;
            }

            const words = mnemonic.split(' ');

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
                        <div class="card" style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); margin-bottom: 30px;">
                            <h3 style="color: #ff9800; margin-bottom: 12px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                                </svg>
                                Keep This Safe
                            </h3>
                            <p style="color: rgba(255,255,255,0.8); margin: 0; line-height: 1.6;">
                                This recovery phrase is the ONLY way to restore your wallet${this.isAccountSystemEnabled ? ' and all accounts' : ''}. 
                                Never share it with anyone and store it in a secure location.
                            </p>
                        </div>
                        
                        <!-- Seed Phrase -->
                        <div class="seed-display">
                            <div class="seed-words">
                                ${words.map((word, index) => `
                                    <div class="seed-word">${index + 1}. ${word}</div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        <div style="margin-top: 30px; display: flex; gap: 12px;">
                            <button onclick="walletScreen.copySeedPhrase('${mnemonic}')" class="btn btn-secondary" style="flex: 1;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                                Copy Phrase
                            </button>
                            <button onclick="walletScreen.showSettings()" class="btn btn-primary" style="flex: 1;">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            `;

            DOM.setContent('app-container', content);

        } catch (error) {
            console.error('Error showing seed phrase:', error);
            Toast.error('Failed to display recovery phrase');
        }
    }

    // Copy seed phrase
    async copySeedPhrase(mnemonic) {
        try {
            const success = await Utils.copyToClipboard(mnemonic);
            if (success) {
                Toast.success('Recovery phrase copied to clipboard');
            } else {
                Toast.error('Failed to copy recovery phrase');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Failed to copy recovery phrase');
        }
    }

    // Export account data
    exportAccountData() {
        if (!this.isAccountSystemEnabled) {
            Toast.error('Account system not enabled');
            return;
        }

        try {
            const accountData = accountManager.exportAccountData();
            const dataStr = JSON.stringify(accountData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ctc-accounts-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Toast.success('Account data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            Toast.error('Failed to export account data');
        }
    }

    // Reset wallet
    resetWallet() {
        const confirmReset = confirm(
            '⚠️ DANGER: PERMANENT DATA LOSS\n\n' +
            'This will permanently delete:\n' +
            '• Your wallet and all accounts\n' +
            '• All stored data\n' +
            '• Transaction history\n\n' +
            'Make sure you have your recovery phrase saved!\n\n' +
            'This action CANNOT be undone. Continue?'
        );

        if (!confirmReset) return;

        const finalConfirm = confirm(
            'FINAL WARNING\n\n' +
            'Are you absolutely certain you want to delete everything?\n\n' +
            'Type "DELETE" in the next prompt to confirm.'
        );

        if (!finalConfirm) return;

        const deleteConfirmation = prompt('Type "DELETE" to confirm permanent deletion:');
        
        if (deleteConfirmation !== 'DELETE') {
            Toast.error('Reset cancelled - confirmation text did not match');
            return;
        }

        try {
            // Stop auto-refresh
            this.stopAutoRefresh();
            
            // Clear all data
            if (this.isAccountSystemEnabled && accountManager) {
                accountManager.clearAllDataSecure();
            } else {
                Storage.clear();
            }
            
            // Destroy current wallet
            if (this.currentWallet && this.currentWallet.destroy) {
                this.currentWallet.destroy();
            }
            
            // Reload page
            Toast.success('Wallet reset complete - reloading...');
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Reset error:', error);
            Toast.error('Failed to reset wallet');
        }
    }

    // Get current wallet
    getCurrentWallet() {
        return this.currentWallet;
    }

    // Get current balance
    getCurrentBalance() {
        return this.currentBalance;
    }

    // Get current USD value
    getCurrentUsdValue() {
        return this.currentUsdValue;
    }

    // Cleanup when component is destroyed
    cleanup() {
        this.stopAutoRefresh();
        
        if (balanceManager) {
            balanceManager.stopAutoUpdate();
        }
        
        console.log('🧹 Wallet screen cleanup completed');
    }
}

// Create global wallet screen instance
const walletScreen = new WalletScreen();

// Export to global scope
window.walletScreen = walletScreen;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (walletScreen) {
        walletScreen.cleanup();
    }
});

console.log('💼 Enhanced Wallet Screen loaded');