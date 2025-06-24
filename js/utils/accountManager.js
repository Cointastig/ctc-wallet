// js/utils/accountManager.js - Account Manager with secure encryption

class AccountManager {
    constructor() {
        this.accounts = [];
        this.currentAccountIndex = 0;
        this.masterMnemonic = null;
        this.initialized = false;
    }

    // Initialize account manager (Legacy support)
    async initialize() {
        if (this.initialized) return;

        try {
            // First check for secure encrypted data
            if (SecurePasswordManager.hasStoredPassword()) {
                console.log('🔒 Secure account data detected - password input required');
                return; // Password will be entered via UI
            }
            
            // Load legacy data (unencrypted)
            const savedData = Storage.get('ctc-accounts', null);
            if (savedData) {
                this.masterMnemonic = savedData.masterMnemonic;
                this.accounts = savedData.accounts || [];
                this.currentAccountIndex = savedData.currentAccountIndex || 0;

                // Restore wallets for all accounts
                await this.restoreAllAccounts();
            }

            this.initialized = true;
            console.log('🏦 Legacy Account Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Account Manager:', error);
            throw error;
        }
    }

    // Create secure account system with password
    async createAccountSystemSecure(masterMnemonic, password) {
        try {
            this.masterMnemonic = masterMnemonic;
            this.accounts = [];
            this.currentAccountIndex = 0;

            // Create first account (Account 1)
            await this.createAccount('Account 1', 'default');

            // Save with password encryption
            await this.saveToStorageSecure(password);

            console.log('🔒 Secure account system created');
        } catch (error) {
            console.error('Failed to create secure account system:', error);
            throw error;
        }
    }

    // Legacy system without password (for compatibility)
    async createAccountSystem(masterMnemonic) {
        try {
            this.masterMnemonic = masterMnemonic;
            this.accounts = [];
            this.currentAccountIndex = 0;

            // Create first account
            await this.createAccount('Account 1', 'default');

            // Save unencrypted (legacy)
            this.saveToStorage();

            console.log('🏦 Legacy account system created');
        } catch (error) {
            console.error('Failed to create account system:', error);
            throw error;
        }
    }

    // Secure initialization with password
    async initializeSecure(password) {
        if (this.initialized) return;

        try {
            // Load encrypted account data
            await this.loadFromStorageSecure(password);
            
            // Restore wallets for all accounts
            await this.restoreAllAccounts();

            this.initialized = true;
            console.log('🔒 Secure account manager initialized');
        } catch (error) {
            console.error('Failed to initialize secure account manager:', error);
            throw error;
        }
    }

    // Save account data encrypted
    async saveToStorageSecure(password) {
        try {
            const data = {
                masterMnemonic: this.masterMnemonic,
                accounts: this.accounts,
                currentAccountIndex: this.currentAccountIndex,
                lastUpdated: Date.now()
            };
            
            // Encrypt data
            const encryptedData = await SecureStorage.encrypt(data, password);
            
            Storage.set('ctc-accounts-encrypted', {
                data: encryptedData,
                version: '2.0',
                timestamp: Date.now()
            });
            
            console.log('🔒 Account data saved encrypted');
        } catch (error) {
            console.error('Error saving encrypted data:', error);
            throw error;
        }
    }

    // Load encrypted account data
    async loadFromStorageSecure(password) {
        try {
            const storedData = Storage.get('ctc-accounts-encrypted');
            if (!storedData || !storedData.data) {
                throw new Error('No encrypted account data found');
            }
            
            // Decrypt data
            const decryptedData = await SecureStorage.decrypt(storedData.data, password);
            
            this.masterMnemonic = decryptedData.masterMnemonic;
            this.accounts = decryptedData.accounts || [];
            this.currentAccountIndex = decryptedData.currentAccountIndex || 0;
            
            console.log('🔓 Account data successfully decrypted');
            return true;
        } catch (error) {
            console.error('Error decrypting data:', error);
            throw error;
        }
    }

    // Check if encrypted account data exists
    hasEncryptedAccounts() {
        return !!Storage.get('ctc-accounts-encrypted');
    }

    // Create new account with derivation path
    async createAccount(name, iconType = 'default') {
        try {
            if (!this.masterMnemonic) {
                throw new Error('Master mnemonic not available');
            }

            const accountIndex = this.accounts.length;
            
            // Generate wallet for this account using derivation
            const wallet = await this.deriveAccountWallet(accountIndex);
            
            const account = {
                id: Utils.generateId(12),
                name: name || `Account ${accountIndex + 1}`,
                iconType: iconType,
                index: accountIndex,
                address: wallet.address,
                publicKey: wallet.publicKeyHex,
                balance: 0,
                balanceUsd: 0,
                created: Date.now(),
                isActive: true
            };

            this.accounts.push(account);
            
            // Save (encrypted if password available)
            await this.saveToStorageAuto();

            console.log(`✅ Account created: ${account.name} (${account.address})`);
            return account;
        } catch (error) {
            console.error('Failed to create account:', error);
            throw error;
        }
    }

    // Auto save (encrypted or unencrypted)
    async saveToStorageAuto() {
        if (SecurePasswordManager.hasStoredPassword()) {
            // Password is available, but we can't retrieve it
            // So we need to wait until user enters it
            console.log('🔒 Encrypted storage required');
            return;
        } else {
            // Legacy storage
            this.saveToStorage();
        }
    }

    // Derive wallet for specific account index
    async deriveAccountWallet(accountIndex) {
        try {
            // For simplicity, we'll modify the mnemonic slightly for each account
            // In a real implementation, you'd use proper BIP44 derivation paths
            const words = this.masterMnemonic.split(' ');
            
            // Create unique seed for each account by adding account index to last word
            const lastWordIndex = CTC_WORD_LIST.indexOf(words[11]);
            const newWordIndex = (lastWordIndex + accountIndex + 1) % CTC_WORD_LIST.length;
            const modifiedWords = [...words];
            modifiedWords[11] = CTC_WORD_LIST[newWordIndex];
            
            const accountMnemonic = modifiedWords.join(' ');
            
            // Create wallet from modified mnemonic
            const wallet = await CTCWallet.restore(accountMnemonic);
            
            return wallet;
        } catch (error) {
            console.error('Failed to derive account wallet:', error);
            throw error;
        }
    }

    // Get current active account
    getCurrentAccount() {
        if (!this.accounts.length) return null;
        return this.accounts[this.currentAccountIndex] || this.accounts[0];
    }

    // Get current account wallet
    async getCurrentAccountWallet() {
        const account = this.getCurrentAccount();
        if (!account) return null;

        return await this.deriveAccountWallet(account.index);
    }

    // Switch to specific account
    switchToAccount(accountIndex) {
        if (accountIndex >= 0 && accountIndex < this.accounts.length) {
            this.currentAccountIndex = accountIndex;
            
            // Save (depending on available system)
            this.saveToStorageAuto();
            
            // Notify listeners
            this.notifyAccountChanged();
            
            console.log(`🔄 Switched to account: ${this.accounts[accountIndex].name}`);
            return true;
        }
        return false;
    }

    // Get all accounts
    getAllAccounts() {
        return [...this.accounts];
    }

    // Update account name
    updateAccountName(accountIndex, newName) {
        if (accountIndex >= 0 && accountIndex < this.accounts.length) {
            this.accounts[accountIndex].name = newName;
            this.saveToStorageAuto();
            return true;
        }
        return false;
    }

    // Update account icon
    updateAccountIcon(accountIndex, iconType) {
        if (accountIndex >= 0 && accountIndex < this.accounts.length) {
            this.accounts[accountIndex].iconType = iconType;
            this.saveToStorageAuto();
            return true;
        }
        return false;
    }

    // Update account balance
    updateAccountBalance(accountIndex, balance, balanceUsd = 0) {
        if (accountIndex >= 0 && accountIndex < this.accounts.length) {
            this.accounts[accountIndex].balance = balance;
            this.accounts[accountIndex].balanceUsd = balanceUsd;
            this.saveToStorageAuto();
        }
    }

    // Delete account (if more than one exists)
    deleteAccount(accountIndex) {
        if (this.accounts.length <= 1) {
            throw new Error('Cannot delete the last account');
        }

        if (accountIndex >= 0 && accountIndex < this.accounts.length) {
            this.accounts.splice(accountIndex, 1);
            
            // Adjust current account index if necessary
            if (this.currentAccountIndex >= accountIndex) {
                this.currentAccountIndex = Math.max(0, this.currentAccountIndex - 1);
            }
            
            // Update indices for remaining accounts
            this.accounts.forEach((account, index) => {
                account.index = index;
            });
            
            this.saveToStorageAuto();
            this.notifyAccountChanged();
            
            console.log(`🗑️ Account deleted`);
            return true;
        }
        return false;
    }

    // Import account from private key
    async importAccount(name, privateKeyHex, iconType = 'imported') {
        try {
            // This would require extending CTCWallet to support private key import
            // For now, we'll show an error
            throw new Error('Import account feature coming soon');
        } catch (error) {
            console.error('Failed to import account:', error);
            throw error;
        }
    }

    // Restore all accounts from storage
    async restoreAllAccounts() {
        try {
            for (let i = 0; i < this.accounts.length; i++) {
                const account = this.accounts[i];
                
                // Verify account wallet can be restored
                const wallet = await this.deriveAccountWallet(account.index);
                
                if (wallet.address !== account.address) {
                    console.warn(`Account ${i} address mismatch. Expected: ${account.address}, Got: ${wallet.address}`);
                }
            }
            
            console.log(`🔄 Restored ${this.accounts.length} accounts`);
        } catch (error) {
            console.error('Failed to restore accounts:', error);
            throw error;
        }
    }

    // Legacy: Save account data to storage (unencrypted)
    saveToStorage() {
        const data = {
            masterMnemonic: this.masterMnemonic,
            accounts: this.accounts,
            currentAccountIndex: this.currentAccountIndex,
            lastUpdated: Date.now()
        };
        
        Storage.set('ctc-accounts', data);
    }

    // Legacy: Load account data from storage
    loadFromStorage() {
        return Storage.get('ctc-accounts', null);
    }

    // Clear all account data (secure)
    clearAllDataSecure() {
        this.accounts = [];
        this.currentAccountIndex = 0;
        this.masterMnemonic = null;
        this.initialized = false;
        
        // Delete all stored data
        Storage.remove('ctc-accounts-encrypted');
        Storage.remove('ctc-accounts'); // Legacy
        Storage.remove('ctc-wallet'); // Legacy
        if (window.SecurePasswordManager) {
            SecurePasswordManager.clearPassword();
        }
        
        console.log('🧹 All secure data cleared');
    }

    // Legacy: Clear all account data
    clearAllData() {
        this.accounts = [];
        this.currentAccountIndex = 0;
        this.masterMnemonic = null;
        this.initialized = false;
        
        Storage.remove('ctc-accounts');
        Storage.remove('ctc-wallet'); // Legacy wallet data
        
        console.log('🧹 All account data cleared');
    }

    // Export account data for backup
    exportAccountData() {
        return {
            accounts: this.accounts.map(account => ({
                name: account.name,
                address: account.address,
                iconType: account.iconType,
                created: account.created
            })),
            currentAccount: this.currentAccountIndex,
            exportDate: Date.now()
        };
    }

    // Get account statistics
    getAccountStats() {
        const totalBalance = this.accounts.reduce((sum, account) => sum + account.balance, 0);
        const totalBalanceUsd = this.accounts.reduce((sum, account) => sum + account.balanceUsd, 0);
        
        return {
            totalAccounts: this.accounts.length,
            totalBalance: totalBalance,
            totalBalanceUsd: totalBalanceUsd,
            activeAccount: this.getCurrentAccount()?.name || 'None'
        };
    }

    // Account change notification system
    addAccountChangeListener(callback) {
        if (!this.accountChangeListeners) {
            this.accountChangeListeners = [];
        }
        this.accountChangeListeners.push(callback);
    }

    removeAccountChangeListener(callback) {
        if (this.accountChangeListeners) {
            this.accountChangeListeners = this.accountChangeListeners.filter(cb => cb !== callback);
        }
    }

    notifyAccountChanged() {
        if (this.accountChangeListeners) {
            const currentAccount = this.getCurrentAccount();
            this.accountChangeListeners.forEach(callback => {
                try {
                    callback(currentAccount, this.currentAccountIndex);
                } catch (error) {
                    console.error('Account change listener error:', error);
                }
            });
        }
    }

    // Validate account system
    validateAccountSystem() {
        const issues = [];
        
        if (!this.masterMnemonic) {
            issues.push('Master mnemonic not set');
        }
        
        if (!this.accounts.length) {
            issues.push('No accounts created');
        }
        
        if (this.currentAccountIndex >= this.accounts.length) {
            issues.push('Invalid current account index');
        }
        
        // Check for duplicate addresses
        const addresses = this.accounts.map(acc => acc.address);
        const uniqueAddresses = new Set(addresses);
        if (addresses.length !== uniqueAddresses.size) {
            issues.push('Duplicate account addresses detected');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    // Save with password for encrypted storage
    async saveWithPassword(password) {
        if (this.masterMnemonic && this.accounts.length > 0) {
            await this.saveToStorageSecure(password);
        }
    }

    // Migration from legacy to secure
    async migrateToSecure(password) {
        try {
            // Load legacy data
            const legacyData = Storage.get('ctc-accounts');
            if (!legacyData) {
                throw new Error('No legacy data found');
            }
            
            // Store password
            await SecurePasswordManager.storePassword(password);
            
            // Migrate data to secure format
            this.masterMnemonic = legacyData.masterMnemonic;
            this.accounts = legacyData.accounts || [];
            this.currentAccountIndex = legacyData.currentAccountIndex || 0;
            
            // Save encrypted
            await this.saveToStorageSecure(password);
            
            // Remove legacy data
            Storage.remove('ctc-accounts');
            
            console.log('🔒 Migration to secure system completed');
            return true;
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }
}

// Icon management for accounts
class AccountIconManager {
    constructor() {
        this.iconTypes = [
            'default',
            'business',
            'personal',
            'savings',
            'trading',
            'gaming',
            'shopping',
            'travel',
            'imported'
        ];
        
        this.iconEmojis = {
            'default': '👤',
            'business': '💼',
            'personal': '🏠',
            'savings': '💰',
            'trading': '📈',
            'gaming': '🎮',
            'shopping': '🛍️',
            'travel': '✈️',
            'imported': '📥'
        };
        
        this.iconColors = {
            'default': '#6B9EFF',
            'business': '#FF6B9D',
            'personal': '#4ECDC4',
            'savings': '#45B7D1',
            'trading': '#96CEB4',
            'gaming': '#FFEAA7',
            'shopping': '#DDA0DD',
            'travel': '#98D8C8',
            'imported': '#F7DC6F'
        };
    }

    // Get icon emoji for account type
    getIconEmoji(iconType) {
        return this.iconEmojis[iconType] || this.iconEmojis['default'];
    }

    // Get icon color for account type
    getIconColor(iconType) {
        return this.iconColors[iconType] || this.iconColors['default'];
    }

    // Get all available icon types
    getAllIconTypes() {
        return this.iconTypes.map(type => ({
            type: type,
            emoji: this.getIconEmoji(type),
            color: this.getIconColor(type),
            name: this.getIconName(type)
        }));
    }

    // Get human-readable icon name
    getIconName(iconType) {
        const names = {
            'default': 'Standard',
            'business': 'Business',
            'personal': 'Personal',
            'savings': 'Savings',
            'trading': 'Trading',
            'gaming': 'Gaming',
            'shopping': 'Shopping',
            'travel': 'Travel',
            'imported': 'Imported'
        };
        
        return names[iconType] || 'Standard';
    }

    // Create account icon HTML
    createAccountIconHtml(iconType, size = 'medium') {
        const emoji = this.getIconEmoji(iconType);
        const color = this.getIconColor(iconType);
        
        const sizes = {
            small: { width: '32px', height: '32px', fontSize: '16px' },
            medium: { width: '48px', height: '48px', fontSize: '24px' },
            large: { width: '64px', height: '64px', fontSize: '32px' }
        };
        
        const sizeStyle = sizes[size] || sizes.medium;
        
        return `
            <div style="
                width: ${sizeStyle.width};
                height: ${sizeStyle.height};
                background: ${color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${sizeStyle.fontSize};
                color: white;
                font-weight: bold;
            ">
                ${emoji}
            </div>
        `;
    }
}

// Create global instances
const accountManager = new AccountManager();
const accountIconManager = new AccountIconManager();

// Export to global scope
window.accountManager = accountManager;
window.accountIconManager = accountIconManager;

console.log('🏦 Account Manager and Icon Manager loaded');
