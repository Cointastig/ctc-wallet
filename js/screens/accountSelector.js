// js/screens/accountSelector.js - Account Selection Screen with Lucide Icons

class AccountSelectorScreen {
    constructor() {
        this.accounts = [];
        this.currentAccountIndex = 0;
    }

    // Show account selector screen
    async show() {
        try {
            // Get all accounts
            this.accounts = accountManager.getAllAccounts();
            this.currentAccountIndex = accountManager.currentAccountIndex;
            
            const content = `
                <div class="wallet-container">
                    <!-- Header -->
                    <div class="header">
                        <button class="header-back" onclick="walletScreen.show()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                        </button>
                        <h1 class="header-title">Account</h1>
                        <div style="width: 24px;"></div>
                    </div>
                    
                    <!-- Account List -->
                    <div style="padding: 20px;">
                        <div id="account-list">
                            ${this.renderAccountList()}
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="margin-top: 30px; display: flex; gap: 12px;">
                            <button onclick="accountSelectorScreen.showCreateAccount()" class="btn btn-secondary" style="flex: 1;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <line x1="22" x2="22" y1="11" y2="13"/>
                                    <line x1="21" x2="23" y1="12" y2="12"/>
                                </svg>
                                Create New Account
                            </button>
                            <button onclick="accountSelectorScreen.showImportAccount()" class="btn btn-secondary" style="flex: 1;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17,8 12,3 7,8"/>
                                    <line x1="12" x2="12" y1="3" y2="15"/>
                                </svg>
                                Import Account
                            </button>
                        </div>
                        
                        <!-- Account Stats -->
                        <div class="card" style="margin-top: 30px;">
                            <h3 class="card-header">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <line x1="12" x2="12" y1="1" y2="23"/>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                </svg>
                                Portfolio Summary
                            </h3>
                            ${this.renderAccountStats()}
                        </div>
                    </div>
                </div>
            `;
            
            DOM.setContent('app-container', content);
            
        } catch (error) {
            console.error('Failed to show account selector:', error);
            Toast.error('Failed to load accounts');
        }
    }

    // Render account list
    renderAccountList() {
        if (!this.accounts.length) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3;">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <p class="empty-state-title">No accounts found</p>
                    <p class="empty-state-subtitle">Create your first account to get started</p>
                </div>
            `;
        }

        return this.accounts.map((account, index) => {
            const isActive = index === this.currentAccountIndex;
            const iconHtml = accountIconManager.createAccountIconHtml(account.iconType, 'medium');
            
            return `
                <div class="account-item ${isActive ? 'active' : ''}" onclick="accountSelectorScreen.selectAccount(${index})">
                    <div class="account-icon">
                        ${iconHtml}
                    </div>
                    <div class="account-info">
                        <h3 class="account-name">${account.name}</h3>
                        <p class="account-balance">${Format.ctc(account.balance, 4)}</p>
                        <p class="account-address">${Format.address(account.address)}</p>
                    </div>
                    <div class="account-actions">
                        ${isActive ? '<span class="account-status-active">Active</span>' : ''}
                        <button onclick="accountSelectorScreen.showAccountOptions(${index}, event)" class="btn-icon btn-ghost">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="12" cy="5" r="1"/>
                                <circle cx="12" cy="19" r="1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render account statistics
    renderAccountStats() {
        const stats = accountManager.getAccountStats();
        
        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <span style="color: rgba(255,255,255,0.6);">Total Accounts:</span>
                <span style="color: white; font-weight: 600;">${stats.totalAccounts}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <span style="color: rgba(255,255,255,0.6);">Total Balance:</span>
                <span style="color: white; font-weight: 600;">${Format.ctc(stats.totalBalance, 4)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.6);">USD Value:</span>
                <span style="color: #4ECDC4; font-weight: 600;">${Format.usd(stats.totalBalanceUsd)}</span>
            </div>
        `;
    }

    // Select an account
    async selectAccount(accountIndex) {
        try {
            const success = accountManager.switchToAccount(accountIndex);
            
            if (success) {
                Toast.success('Account switched successfully');
                
                // Refresh wallet screen with new account
                const newWallet = await accountManager.getCurrentAccountWallet();
                walletScreen.initialize(newWallet);
                
            } else {
                Toast.error('Failed to switch account');
            }
        } catch (error) {
            console.error('Failed to select account:', error);
            Toast.error('Failed to switch account');
        }
    }

    // Show account options menu
    showAccountOptions(accountIndex, event) {
        event.stopPropagation();
        
        const account = this.accounts[accountIndex];
        if (!account) return;
        
        const options = [];
        
        // Edit name
        options.push({
            text: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>Edit Name`,
            action: () => this.editAccountName(accountIndex)
        });
        
        // Change icon
        options.push({
            text: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <circle cx="13.5" cy="6.5" r=".5"/>
                <circle cx="17.5" cy="10.5" r=".5"/>
                <circle cx="8.5" cy="7.5" r=".5"/>
                <circle cx="6.5" cy="12.5" r=".5"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>Change Icon`,
            action: () => this.showIconSelector(accountIndex)
        });
        
        // Copy address
        options.push({
            text: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>Copy Address`,
            action: () => this.copyAccountAddress(accountIndex)
        });
        
        // Delete account (only if more than one account)
        if (this.accounts.length > 1) {
            options.push({
                text: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>Delete Account`,
                action: () => this.deleteAccount(accountIndex),
                className: 'text-danger'
            });
        }
        
        this.showContextMenu(event, options);
    }

    // Show context menu
    showContextMenu(event, options) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = DOM.create('div', { className: 'context-menu' });
        
        options.forEach(option => {
            const item = DOM.create('button', {
                className: `context-menu-item ${option.className || ''}`,
                innerHTML: option.text
            });
            
            item.onclick = () => {
                menu.remove();
                option.action();
            };
            
            menu.appendChild(item);
        });
        
        // Position menu
        const rect = event.target.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = rect.bottom + 'px';
        menu.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
        menu.style.zIndex = '1000';
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    // Edit account name
    editAccountName(accountIndex) {
        const account = this.accounts[accountIndex];
        const newName = prompt('Enter new account name:', account.name);
        
        if (newName && newName.trim() && newName.trim() !== account.name) {
            const success = accountManager.updateAccountName(accountIndex, newName.trim());
            
            if (success) {
                Toast.success('Account name updated');
                this.show(); // Refresh the screen
            } else {
                Toast.error('Failed to update account name');
            }
        }
    }

    // Copy account address
    async copyAccountAddress(accountIndex) {
        const account = this.accounts[accountIndex];
        
        try {
            const success = await Utils.copyToClipboard(account.address);
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

    // Delete account
    deleteAccount(accountIndex) {
        const account = this.accounts[accountIndex];
        
        if (confirm(`Are you sure you want to delete "${account.name}"?\n\nThis action cannot be undone.`)) {
            try {
                const success = accountManager.deleteAccount(accountIndex);
                
                if (success) {
                    Toast.success('Account deleted');
                    this.show(); // Refresh the screen
                    
                    // If current account was deleted, switch to the new current account
                    if (accountIndex === this.currentAccountIndex) {
                        this.selectAccount(accountManager.currentAccountIndex);
                    }
                } else {
                    Toast.error('Failed to delete account');
                }
            } catch (error) {
                console.error('Delete account error:', error);
                Toast.error('Error: ' + error.message);
            }
        }
    }

    // Show create new account screen
    showCreateAccount() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="accountSelectorScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Create New Account</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Icon Selection -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <div id="selected-icon" style="display: inline-block; margin-bottom: 20px;">
                            ${accountIconManager.createAccountIconHtml('default', 'large')}
                        </div>
                        <button onclick="accountSelectorScreen.showIconSelector(-1)" class="btn btn-secondary btn-small">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <circle cx="13.5" cy="6.5" r=".5"/>
                                <circle cx="17.5" cy="10.5" r=".5"/>
                                <circle cx="8.5" cy="7.5" r=".5"/>
                                <circle cx="6.5" cy="12.5" r=".5"/>
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                            </svg>
                            Choose an icon
                        </button>
                    </div>
                    
                    <!-- Account Name -->
                    <div class="input-group">
                        <label class="input-label">Account Name</label>
                        <input 
                            type="text" 
                            id="new-account-name" 
                            class="input-field" 
                            placeholder="e.g. Trading Account" 
                            value="Account ${this.accounts.length + 1}"
                            maxlength="50"
                        >
                        <div class="input-help">Choose a name to identify this account</div>
                    </div>
                    
                    <!-- Create Button -->
                    <button onclick="accountSelectorScreen.createNewAccount()" class="btn btn-primary" style="margin-top: 30px;">
                        <div class="loading" id="create-loading" style="display: none;"></div>
                        <span id="create-text">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <line x1="22" x2="22" y1="11" y2="13"/>
                                <line x1="21" x2="23" y1="12" y2="12"/>
                            </svg>
                            Create Account
                        </span>
                    </button>
                    
                    <!-- Info -->
                    <div class="card" style="margin-top: 30px;">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <path d="M12 17h.01"/>
                            </svg>
                            About Multiple Accounts
                        </h3>
                        <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0;">
                            Each account has its own unique CTC address and can hold separate balances. 
                            All accounts are derived from your master recovery phrase, so you only need 
                            to backup your original seed phrase.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        
        // Store selected icon type
        this.selectedIconType = 'default';
    }

    // Show icon selector
    showIconSelector(accountIndex) {
        const isCreatingNew = accountIndex === -1;
        const iconTypes = accountIconManager.getAllIconTypes();
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="${isCreatingNew ? 'accountSelectorScreen.showCreateAccount()' : 'accountSelectorScreen.show()'}"">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Choose Icon</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <div class="icon-grid">
                        ${iconTypes.map(iconType => `
                            <div class="icon-option" onclick="accountSelectorScreen.selectIcon('${iconType.type}', ${accountIndex})">
                                ${accountIconManager.createAccountIconHtml(iconType.type, 'large')}
                                <div class="icon-name">${iconType.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Select icon
    selectIcon(iconType, accountIndex) {
        if (accountIndex === -1) {
            // Creating new account
            this.selectedIconType = iconType;
            this.showCreateAccount();
            
            // Update the selected icon display
            setTimeout(() => {
                const iconContainer = DOM.get('selected-icon');
                if (iconContainer) {
                    iconContainer.innerHTML = accountIconManager.createAccountIconHtml(iconType, 'large');
                }
            }, 100);
        } else {
            // Updating existing account
            const success = accountManager.updateAccountIcon(accountIndex, iconType);
            
            if (success) {
                Toast.success('Icon updated');
                this.show(); // Go back to account list
            } else {
                Toast.error('Failed to update icon');
            }
        }
    }

    // Create new account
    async createNewAccount() {
        const nameInput = DOM.get('new-account-name');
        const name = nameInput?.value?.trim();
        
        if (!name) {
            Toast.error('Please enter an account name');
            return;
        }
        
        const loadingDiv = DOM.get('create-loading');
        const textSpan = DOM.get('create-text');
        const btn = document.querySelector('.btn-primary');
        
        DOM.show(loadingDiv);
        textSpan.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M21 21v-5h-5"/>
            </svg>
            Creating...
        `;
        btn.disabled = true;
        
        try {
            const account = await accountManager.createAccount(name, this.selectedIconType || 'default');
            
            setTimeout(() => {
                Toast.success('Account created successfully');
                this.show(); // Go back to account list
            }, 1000);
            
        } catch (error) {
            console.error('Failed to create account:', error);
            DOM.hide(loadingDiv);
            textSpan.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="22" x2="22" y1="11" y2="13"/>
                    <line x1="21" x2="23" y1="12" y2="12"/>
                </svg>
                Create Account
            `;
            btn.disabled = false;
            Toast.error('Failed to create account: ' + error.message);
        }
    }

    // Show import account screen
    showImportAccount() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="accountSelectorScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Import Account</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Warning Message -->
                    <div class="card" style="background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); margin-bottom: 30px;">
                        <h3 style="color: #ff9800; margin-bottom: 12px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                            </svg>
                            Important
                        </h3>
                        <p style="color: rgba(255,255,255,0.8); margin: 0; line-height: 1.6;">
                            Imported accounts are viewable in your wallet but are not recoverable with your DeGe seed phrase.
                            <a href="#" onclick="accountSelectorScreen.showImportInfo()" style="color: #6B9EFF;">
                                Learn more about imported accounts here.
                            </a>
                        </p>
                    </div>
                    
                    <!-- Private Key Input -->
                    <div class="input-group">
                        <label class="input-label">Paste your private key string</label>
                        <textarea 
                            id="import-private-key" 
                            class="input-field private-key-input" 
                            placeholder="e.g.
4395a2a6349e069ab44043f01d77cf7b91822b1841e333128d98f7878495bf53"
                            rows="4" 
                            style="resize: none; font-family: monospace; font-size: 12px;"
                        ></textarea>
                    </div>
                    
                    <!-- Account Name -->
                    <div class="input-group">
                        <label class="input-label">Account Name</label>
                        <input 
                            type="text" 
                            id="import-account-name" 
                            class="input-field" 
                            placeholder="e.g. Imported Account" 
                            value="Account ${this.accounts.length + 1}"
                            maxlength="50"
                        >
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 12px; margin-top: 30px;">
                        <button onclick="accountSelectorScreen.scanQRCode()" class="btn btn-secondary" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <rect width="5" height="5" x="3" y="3" rx="1"/>
                                <rect width="5" height="5" x="16" y="3" rx="1"/>
                                <rect width="5" height="5" x="3" y="16" rx="1"/>
                                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                                <path d="M21 21v.01"/>
                                <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                                <path d="M3 12h.01"/>
                                <path d="M12 3h.01"/>
                                <path d="M12 16v.01"/>
                                <path d="M16 12h1"/>
                                <path d="M21 12v.01"/>
                                <path d="M12 21v-1"/>
                            </svg>
                            Scan a QR code
                        </button>
                        <button onclick="accountSelectorScreen.importAccountFromKey()" class="btn btn-primary" style="flex: 2;">
                            <div class="loading" id="import-loading" style="display: none;"></div>
                            <span id="import-text">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17,8 12,3 7,8"/>
                                    <line x1="12" x2="12" y1="3" y2="15"/>
                                </svg>
                                Import
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show import information
    showImportInfo() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="accountSelectorScreen.showImportAccount()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">About Import</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <circle cx="12" cy="16" r="1"/>
                                <path d="m7 11 V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                            Imported vs Derived Accounts
                        </h3>
                        <div style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                            <h4 style="color: white; margin: 20px 0 12px 0;">Derived Accounts (Recommended)</h4>
                            <ul style="margin-left: 20px; margin-bottom: 20px;">
                                <li>Created from your master seed phrase</li>
                                <li>Can be recovered with your 12-word backup</li>
                                <li>More secure and easier to manage</li>
                                <li>No need for additional backups</li>
                            </ul>
                            
                            <h4 style="color: white; margin: 20px 0 12px 0;">Imported Accounts</h4>
                            <ul style="margin-left: 20px; margin-bottom: 20px;">
                                <li>Added using external private keys</li>
                                <li>Not recoverable with your seed phrase</li>
                                <li>Require separate backup of private keys</li>
                                <li>Useful for managing external wallets</li>
                            </ul>
                            
                            <div style="background: rgba(255, 193, 7, 0.1); border-radius: 8px; padding: 16px; margin-top: 20px;">
                                <strong style="color: #ffc107;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                                    </svg>
                                    Security Warning
                                </strong><br>
                                Always backup private keys for imported accounts separately. 
                                If you lose your device, imported accounts cannot be recovered 
                                using your seed phrase.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Scan QR code for import
    scanQRCode() {
        Toast.success('QR scanner feature coming soon');
    }

    // Import account from private key
    async importAccountFromKey() {
        const privateKeyInput = DOM.get('import-private-key');
        const nameInput = DOM.get('import-account-name');
        
        const privateKey = privateKeyInput?.value?.trim();
        const name = nameInput?.value?.trim();
        
        if (!privateKey) {
            Toast.error('Please enter a private key');
            return;
        }
        
        if (!name) {
            Toast.error('Please enter an account name');
            return;
        }
        
        const loadingDiv = DOM.get('import-loading');
        const textSpan = DOM.get('import-text');
        const btn = document.querySelector('.btn-primary');
        
        DOM.show(loadingDiv);
        textSpan.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M21 21v-5h-5"/>
            </svg>
            Importing...
        `;
        btn.disabled = true;
        
        try {
            await accountManager.importAccount(name, privateKey, 'imported');
            
            setTimeout(() => {
                Toast.success('Account imported successfully');
                this.show(); // Go back to account list
            }, 1000);
            
        } catch (error) {
            console.error('Failed to import account:', error);
            DOM.hide(loadingDiv);
            textSpan.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17,8 12,3 7,8"/>
                    <line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
                Import
            `;
            btn.disabled = false;
            Toast.error('Failed to import account: ' + error.message);
        }
    }

    // Show account details
    showAccountDetails(accountIndex) {
        const account = this.accounts[accountIndex];
        if (!account) return;
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="accountSelectorScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Account Details</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Account Info -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        ${accountIconManager.createAccountIconHtml(account.iconType, 'large')}
                        <h2 style="color: white; margin: 20px 0 8px 0;">${account.name}</h2>
                        <p style="color: rgba(255,255,255,0.6); margin: 0;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            Created ${Format.date(account.created)}
                        </p>
                    </div>
                    
                    <!-- Account Data -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            Account Information
                        </h3>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 8px; display: block;">Address</label>
                            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; word-break: break-all;">
                                <code style="color: #00D4FF; font-size: 14px;">${account.address}</code>
                            </div>
                            <button onclick="accountSelectorScreen.copyAccountAddress(${accountIndex})" class="btn btn-ghost btn-small" style="margin-top: 12px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                </svg>
                                Copy Address
                            </button>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 8px; display: block;">Balance</label>
                            <p style="color: white; margin: 0; font-size: 18px; font-weight: 600;">
                                ${Format.ctc(account.balance, 4)}
                            </p>
                            <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0 0;">
                                ${Format.usd(account.balanceUsd)}
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 8px; display: block;">Account Type</label>
                            <p style="color: white; margin: 0;">
                                ${account.isImported ? 'Imported Account' : 'Derived Account'}
                            </p>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div style="margin-top: 30px; display: flex; gap: 12px;">
                        <button onclick="accountSelectorScreen.editAccountName(${accountIndex})" class="btn btn-secondary" style="flex: 1;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit Name
                        </button>
                        <button onclick="accountSelectorScreen.showIconSelector(${accountIndex})" class="btn btn-secondary" style="flex: 1;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <circle cx="13.5" cy="6.5" r=".5"/>
                                <circle cx="17.5" cy="10.5" r=".5"/>
                                <circle cx="8.5" cy="7.5" r=".5"/>
                                <circle cx="6.5" cy="12.5" r=".5"/>
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                            </svg>
                            Change Icon
                        </button>
                    </div>
                    
                    ${this.accounts.length > 1 ? `
                        <button onclick="accountSelectorScreen.deleteAccount(${accountIndex})" class="btn btn-danger" style="margin-top: 16px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Delete Account
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }
}

// Create global account selector screen instance
const accountSelectorScreen = new AccountSelectorScreen();

// Export to global scope
window.accountSelectorScreen = accountSelectorScreen;