// js/utils/secure-storage.js - FIXED Secure Storage mit Wallet Persistierung

// Basic Storage Wrapper (umbenennt zu StorageUtil um Konflikt zu vermeiden)
class StorageUtil {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
}

// Simple encryption/decryption using built-in crypto
class SimpleEncryption {
    static async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                passwordKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encodedData = encoder.encode(JSON.stringify(data));
            
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encodedData
            );
            
            // Combine salt, iv, and encrypted data
            const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encrypted), salt.length + iv.length);
            
            return Array.from(result);
            
        } catch (error) {
            console.error('Encryption failed:', error);
            throw error;
        }
    }
    
    static async decrypt(encryptedArray, password) {
        try {
            const data = new Uint8Array(encryptedArray);
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);
            
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                passwordKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            const decryptedText = decoder.decode(decrypted);
            return JSON.parse(decryptedText);
            
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }
}

// Secure Wallet Storage
class SecureWalletStorage {
    static WALLET_KEY = 'ctc-wallet-encrypted';
    static SESSION_KEY = 'ctc-session-token';
    static ACCOUNTS_KEY = 'ctc-accounts-encrypted';
    static VERSION_KEY = 'ctc-storage-version';
    static CURRENT_VERSION = '2.0';
    
    // Generate unique account ID
    static generateAccountId() {
        return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Save encrypted wallet data
    static async saveWallet(wallet, password, accountName = 'My Wallet') {
        try {
            if (!wallet || !password) {
                throw new Error('Wallet and password are required');
            }
            
            console.log('🔒 Saving wallet securely...');
            
            // Generate unique account ID
            const accountId = this.generateAccountId();
            
            // Prepare wallet data for encryption
            const walletData = {
                mnemonic: wallet.getMnemonic(),
                privateKey: wallet.privateKey,
                publicKey: wallet.publicKeyHex,
                address: wallet.address,
                createdAt: Date.now(),
                version: this.CURRENT_VERSION
            };
            
            // Encrypt wallet data
            const encryptedData = await SimpleEncryption.encrypt(walletData, password);
            
            // Create account record
            const accountRecord = {
                id: accountId,
                name: accountName,
                address: wallet.address,
                createdAt: Date.now(),
                version: this.CURRENT_VERSION
            };
            
            // Store encrypted wallet data
            const walletStorageKey = `${this.WALLET_KEY}-${accountId}`;
            const success = StorageUtil.set(walletStorageKey, {
                data: encryptedData,
                version: this.CURRENT_VERSION,
                timestamp: Date.now(),
                address: wallet.address // Safe to store - not sensitive
            });
            
            if (!success) {
                throw new Error('Failed to save wallet data');
            }
            
            // Add to accounts list
            this.addAccount(accountRecord);
            
            // Set storage version
            StorageUtil.set(this.VERSION_KEY, this.CURRENT_VERSION);
            
            console.log('🔒 Wallet saved securely with ID:', accountId);
            return accountId;
            
        } catch (error) {
            console.error('❌ Error saving wallet:', error);
            throw new Error('Failed to save wallet securely: ' + error.message);
        }
    }
    
    // Load and decrypt wallet data
    static async loadWallet(accountId, password) {
        try {
            if (!accountId || !password) {
                throw new Error('Account ID and password are required');
            }
            
            console.log('🔓 Loading wallet for account:', accountId);
            
            // Get encrypted data from storage
            const walletStorageKey = `${this.WALLET_KEY}-${accountId}`;
            const storedData = StorageUtil.get(walletStorageKey);
            
            if (!storedData || !storedData.data) {
                throw new Error('Wallet not found');
            }
            
            // Decrypt wallet data
            const decryptedData = await SimpleEncryption.decrypt(storedData.data, password);
            
            // Restore wallet from mnemonic using the static method
            const wallet = await CTCWallet.restore(decryptedData.mnemonic);
            
            console.log('🔓 Wallet loaded securely for account:', accountId);
            return {
                wallet: wallet,
                mnemonic: decryptedData.mnemonic,
                address: decryptedData.address,
                publicKey: decryptedData.publicKey
            };
            
        } catch (error) {
            console.error('❌ Error loading wallet:', error);
            throw new Error('Failed to load wallet: ' + error.message);
        }
    }
    
    // Check if any wallets exist
    static hasWallet() {
        const accounts = this.getAccountsList();
        return accounts.length > 0;
    }
    
    // Get wallet address without decryption
    static getWalletAddress(accountId) {
        const walletStorageKey = `${this.WALLET_KEY}-${accountId}`;
        const storedData = StorageUtil.get(walletStorageKey);
        return storedData ? storedData.address : null;
    }
    
    // Account Management
    static getAccountsList() {
        try {
            const accounts = StorageUtil.get(this.ACCOUNTS_KEY, []);
            return Array.isArray(accounts) ? accounts : [];
        } catch (error) {
            console.error('Error getting accounts list:', error);
            return [];
        }
    }
    
    static addAccount(accountRecord) {
        try {
            const accounts = this.getAccountsList();
            
            // Check if account already exists
            const existingIndex = accounts.findIndex(acc => acc.id === accountRecord.id);
            if (existingIndex >= 0) {
                accounts[existingIndex] = accountRecord;
            } else {
                accounts.push(accountRecord);
            }
            
            StorageUtil.set(this.ACCOUNTS_KEY, accounts);
            console.log('📝 Account added to list:', accountRecord.name);
            
        } catch (error) {
            console.error('Error adding account:', error);
            throw error;
        }
    }
    
    static removeAccount(accountId) {
        try {
            const accounts = this.getAccountsList();
            const filtered = accounts.filter(acc => acc.id !== accountId);
            StorageUtil.set(this.ACCOUNTS_KEY, filtered);
            console.log('🗑️ Account removed from list:', accountId);
        } catch (error) {
            console.error('Error removing account:', error);
        }
    }
    
    // Delete specific wallet data
    static deleteWallet(accountId) {
        try {
            // Remove wallet data
            const walletStorageKey = `${this.WALLET_KEY}-${accountId}`;
            StorageUtil.remove(walletStorageKey);
            
            // Remove from accounts list
            this.removeAccount(accountId);
            
            // Clear session if it was for this account
            const sessionData = StorageUtil.get(this.SESSION_KEY);
            if (sessionData && sessionData.accountId === accountId) {
                StorageUtil.remove(this.SESSION_KEY);
            }
            
            console.log('🗑️ Wallet deleted:', accountId);
            return true;
        } catch (error) {
            console.error('❌ Error deleting wallet:', error);
            return false;
        }
    }
    
    // Delete all wallet data permanently
    static deleteAllWallets() {
        try {
            // Get all accounts
            const accounts = this.getAccountsList();
            
            // Delete each wallet
            accounts.forEach(account => {
                this.deleteWallet(account.id);
            });
            
            // Clear accounts list
            StorageUtil.remove(this.ACCOUNTS_KEY);
            StorageUtil.remove(this.SESSION_KEY);
            StorageUtil.remove(this.VERSION_KEY);
            
            // Clean up any other wallet-related data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('ctc-') || key.startsWith('wallet-')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('🗑️ All wallet data deleted permanently');
            return true;
        } catch (error) {
            console.error('❌ Error deleting all wallets:', error);
            return false;
        }
    }
    
    // Session Management
    static generateSessionToken(accountId) {
        const token = crypto.getRandomValues(new Uint8Array(32));
        const tokenHex = Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('');
        
        StorageUtil.set(this.SESSION_KEY, {
            token: tokenHex,
            accountId: accountId,
            created: Date.now(),
            expires: Date.now() + (15 * 60 * 1000) // 15 minutes
        });
        
        return tokenHex;
    }
    
    static validateSessionToken(token, accountId = null) {
        const sessionData = StorageUtil.get(this.SESSION_KEY);
        
        if (!sessionData) return false;
        if (sessionData.token !== token) return false;
        if (accountId && sessionData.accountId !== accountId) return false;
        if (Date.now() > sessionData.expires) {
            StorageUtil.remove(this.SESSION_KEY);
            return false;
        }
        
        return true;
    }
    
    static isSessionValid(accountId = null) {
        const sessionData = StorageUtil.get(this.SESSION_KEY);
        
        if (!sessionData) return false;
        if (accountId && sessionData.accountId !== accountId) return false;
        if (Date.now() > sessionData.expires) {
            StorageUtil.remove(this.SESSION_KEY);
            return false;
        }
        
        return true;
    }
    
    static extendSession(accountId = null) {
        const sessionData = StorageUtil.get(this.SESSION_KEY);
        
        if (sessionData && (!accountId || sessionData.accountId === accountId)) {
            sessionData.expires = Date.now() + (15 * 60 * 1000); // 15 minutes
            StorageUtil.set(this.SESSION_KEY, sessionData);
            return true;
        }
        
        return false;
    }
    
    static clearSession() {
        StorageUtil.remove(this.SESSION_KEY);
    }
    
    // Account locking for failed attempts
    static MAX_FAILED_ATTEMPTS = 5;
    static LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
    
    static recordFailedAttempt(accountId) {
        const key = `failed-attempts-${accountId}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        
        localStorage.setItem(key, JSON.stringify(attempts));
        
        return attempts.count >= this.MAX_FAILED_ATTEMPTS;
    }
    
    static clearFailedAttempts(accountId) {
        const key = `failed-attempts-${accountId}`;
        localStorage.removeItem(key);
    }
    
    static isAccountLocked(accountId) {
        const key = `failed-attempts-${accountId}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
            const timeElapsed = Date.now() - attempts.lastAttempt;
            if (timeElapsed < this.LOCKOUT_TIME) {
                return true;
            } else {
                // Lockout period expired, clear attempts
                this.clearFailedAttempts(accountId);
                return false;
            }
        }
        
        return false;
    }
    
    // Storage cleanup and maintenance
    static cleanup() {
        try {
            console.log('🧹 Starting storage cleanup...');
            
            const accounts = this.getAccountsList();
            const validAccountIds = accounts.map(acc => acc.id);
            
            // Find orphaned wallet data
            let removedCount = 0;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.WALLET_KEY + '-')) {
                    const accountId = key.replace(this.WALLET_KEY + '-', '');
                    if (!validAccountIds.includes(accountId)) {
                        localStorage.removeItem(key);
                        removedCount++;
                        console.log(`🗑️ Removed orphaned wallet data: ${key}`);
                    }
                }
            });
            
            // Update storage version
            StorageUtil.set(this.VERSION_KEY, this.CURRENT_VERSION);
            
            console.log(`✅ Storage cleanup completed - removed ${removedCount} items`);
            return true;
            
        } catch (error) {
            console.error('❌ Storage cleanup failed:', error);
            return false;
        }
    }
    
    // Migration functions
    static migrateLegacyData() {
        try {
            console.log('🔄 Checking for legacy data migration...');
            
            // Check for old wallet format
            const legacyWallet = StorageUtil.get('ctc-wallet');
            if (legacyWallet) {
                console.log('📦 Legacy wallet found, migration needed');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Migration check failed:', error);
            return false;
        }
    }
    
    // Storage statistics
    static getStorageStats() {
        try {
            const accounts = this.getAccountsList();
            const storageVersion = StorageUtil.get(this.VERSION_KEY, '1.0');
            
            let totalSize = 0;
            let walletCount = 0;
            
            accounts.forEach(account => {
                const walletKey = `${this.WALLET_KEY}-${account.id}`;
                const walletData = StorageUtil.get(walletKey);
                if (walletData) {
                    walletCount++;
                    totalSize += JSON.stringify(walletData).length;
                }
            });
            
            return {
                version: storageVersion,
                accounts: accounts.length,
                wallets: walletCount,
                estimatedSize: totalSize,
                hasSession: this.isSessionValid(),
                supportsEncryption: typeof crypto !== 'undefined' && !!crypto.subtle
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                version: 'unknown',
                accounts: 0,
                wallets: 0,
                estimatedSize: 0,
                hasSession: false,
                supportsEncryption: false
            };
        }
    }
    
    // Backup and restore
    static async createBackup(password) {
        try {
            const accounts = this.getAccountsList();
            const backupData = {
                version: this.CURRENT_VERSION,
                timestamp: Date.now(),
                accounts: accounts.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                    address: acc.address,
                    createdAt: acc.createdAt
                }))
            };
            
            // Encrypt backup
            const encrypted = await SimpleEncryption.encrypt(backupData, password);
            
            return {
                data: encrypted,
                checksum: await this.calculateChecksum(JSON.stringify(backupData))
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }
    
    static async restoreBackup(encryptedBackup, password) {
        try {
            const decrypted = await SimpleEncryption.decrypt(encryptedBackup.data, password);
            
            // Validate backup format
            if (!decrypted.version || !decrypted.accounts) {
                throw new Error('Invalid backup format');
            }
            
            console.log('✅ Backup restored successfully');
            return decrypted;
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw error;
        }
    }
    
    static async calculateChecksum(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

// Export to global scope (kompatibel mit helpers.js Storage)
window.SecureWalletStorage = SecureWalletStorage;
window.SimpleEncryption = SimpleEncryption;

// Für Kompatibilität mit helpers.js - verwende die globale Storage Klasse
if (!window.Storage) {
    window.Storage = StorageUtil;
}

console.log('🔒 SecureWalletStorage loaded successfully');
