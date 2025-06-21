// js/utils/secure-storage.js - Secure Storage Utilities

// Secure Storage Wrapper for CTC Wallet
class SecureWalletStorage {
    static WALLET_KEY = 'ctc-wallet-encrypted';
    static SESSION_KEY = 'ctc-session-token';
    
    // SECURITY: Save encrypted wallet data
    static async saveWallet(wallet, password) {
        try {
            if (!wallet || !password) {
                throw new Error('Wallet and password are required');
            }
            
            // Get encrypted wallet data
            const encryptedData = await wallet.getSecureData(password);
            
            // Store encrypted data
            const success = Storage.set(this.WALLET_KEY, {
                data: encryptedData,
                version: '1.0',
                timestamp: Date.now(),
                address: wallet.address // Safe to store - not sensitive
            });
            
            if (success) {
                console.log('🔒 Wallet saved securely');
                return true;
            } else {
                throw new Error('Failed to save wallet data');
            }
            
        } catch (error) {
            console.error('❌ Error saving wallet:', error);
            throw new Error('Failed to save wallet securely: ' + error.message);
        }
    }
    
    // SECURITY: Load and decrypt wallet data
    static async loadWallet(password) {
        try {
            if (!password) {
                throw new Error('Password is required');
            }
            
            // Get encrypted data from storage
            const storedData = Storage.get(this.WALLET_KEY);
            if (!storedData || !storedData.data) {
                throw new Error('No wallet found');
            }
            
            // Create new wallet instance
            const wallet = new CTCWallet();
            
            // Decrypt and restore wallet
            await wallet.unlock(storedData.data, password);
            
            console.log('🔓 Wallet loaded securely');
            return wallet;
            
        } catch (error) {
            console.error('❌ Error loading wallet:', error);
            throw new Error('Failed to load wallet: ' + error.message);
        }
    }
    
    // SECURITY: Check if wallet exists without loading it
    static hasWallet() {
        const storedData = Storage.get(this.WALLET_KEY);
        return !!(storedData && storedData.data);
    }
    
    // SECURITY: Get wallet address without decryption
    static getWalletAddress() {
        const storedData = Storage.get(this.WALLET_KEY);
        return storedData ? storedData.address : null;
    }
    
    // SECURITY: Delete wallet data permanently
    static deleteWallet() {
        try {
            Storage.remove(this.WALLET_KEY);
            Storage.remove(this.SESSION_KEY);
            
            // Clear any other wallet-related data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('ctc-') || key.startsWith('wallet-')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('🗑️ Wallet data deleted permanently');
            return true;
        } catch (error) {
            console.error('❌ Error deleting wallet:', error);
            return false;
        }
    }
    
    // SECURITY: Generate session token for auto-lock
    static generateSessionToken() {
        const token = crypto.getRandomValues(new Uint8Array(32));
        const tokenHex = Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('');
        
        Storage.set(this.SESSION_KEY, {
            token: tokenHex,
            created: Date.now(),
            expires: Date.now() + (15 * 60 * 1000) // 15 minutes
        });
        
        return tokenHex;
    }
    
    // SECURITY: Validate session token
    static validateSessionToken(token) {
        const sessionData = Storage.get(this.SESSION_KEY);
        
        if (!sessionData) return false;
        if (sessionData.token !== token) return false;
        if (Date.now() > sessionData.expires) {
            Storage.remove(this.SESSION_KEY);
            return false;
        }
        
        return true;
    }
    
    // SECURITY: Extend session
    static extendSession() {
        const sessionData = Storage.get(this.SESSION_KEY);
        if (sessionData) {
            sessionData.expires = Date.now() + (15 * 60 * 1000);
            Storage.set(this.SESSION_KEY, sessionData);
        }
    }
    
    // SECURITY: Clear session
    static clearSession() {
        Storage.remove(this.SESSION_KEY);
    }
    
    // SECURITY: Auto-lock functionality
    static setupAutoLock(wallet, callback) {
        let inactivityTimer;
        const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                console.log('🔒 Auto-locking wallet due to inactivity');
                wallet.lock();
                this.clearSession();
                if (callback) callback();
            }, INACTIVITY_TIMEOUT);
        };
        
        // Monitor user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const listener = () => {
            this.extendSession();
            resetTimer();
        };
        
        events.forEach(event => {
            document.addEventListener(event, listener, true);
        });
        
        // Start timer
        resetTimer();
        
        // Return cleanup function
        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => {
                document.removeEventListener(event, listener, true);
            });
        };
    }
    
    // SECURITY: Backup wallet (encrypted)
    static async createBackup(wallet, password) {
        try {
            const encryptedData = await wallet.getSecureData(password);
            const backup = {
                version: '1.0',
                timestamp: Date.now(),
                address: wallet.address,
                data: encryptedData
            };
            
            const backupString = JSON.stringify(backup);
            const blob = new Blob([backupString], { type: 'application/json' });
            
            return blob;
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            throw error;
        }
    }
    
    // SECURITY: Restore from backup
    static async restoreFromBackup(backupData, password) {
        try {
            const backup = JSON.parse(backupData);
            
            if (!backup.data || !backup.address) {
                throw new Error('Invalid backup format');
            }
            
            const wallet = new CTCWallet();
            await wallet.unlock(backup.data, password);
            
            return wallet;
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            throw error;
        }
    }
    
    // SECURITY: Clear all sensitive data from memory
    static clearMemory() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear any global variables that might hold sensitive data
        if (window.tempWalletData) {
            delete window.tempWalletData;
        }
        
        console.log('🧹 Memory cleanup completed');
    }
    
    // SECURITY: Security audit log
    static logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: Date.now(),
            event: event,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // In production, this would be sent to a secure logging service
        console.log('🔍 Security Event:', logEntry);
        
        // Store locally for debugging (in production, send to server)
        const logs = Storage.get('ctc-security-logs') || [];
        logs.push(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        Storage.set('ctc-security-logs', logs);
    }
    
    // SECURITY: Get security status
    static getSecurityStatus() {
        const hasWallet = this.hasWallet();
        const hasSession = !!Storage.get(this.SESSION_KEY);
        const walletAddress = this.getWalletAddress();
        
        return {
            hasWallet,
            hasSession,
            walletAddress,
            timestamp: Date.now(),
            isSecure: hasWallet && !walletAddress.includes('undefined')
        };
    }
}

// Export to global scope
window.SecureWalletStorage = SecureWalletStorage;