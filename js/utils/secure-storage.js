// js/utils/secure-storage.js - Sichere Offline-Speicherung für CTC Wallet

// AES-GCM Verschlüsselung für sicheren lokalen Speicher
class SecureStorage {
    static WALLET_PREFIX = 'ctc-wallet-secure-';
    static SALT_KEY = 'ctc-salt';
    static VERSION = '1.0';

    // Generiere sicheren Salt oder lade existierenden
    static async getSalt() {
        let salt = localStorage.getItem(this.SALT_KEY);
        if (!salt) {
            const saltArray = crypto.getRandomValues(new Uint8Array(32));
            salt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
            localStorage.setItem(this.SALT_KEY, salt);
        }
        return this.hexToUint8Array(salt);
    }

    // Konvertiere Hex zu Uint8Array
    static hexToUint8Array(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Konvertiere Uint8Array zu Hex
    static uint8ArrayToHex(array) {
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Generiere Schlüssel aus Passwort mit PBKDF2
    static async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000, // Sicherheitsstandard
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Verschlüssele Daten mit AES-GCM
    static async encrypt(data, password) {
        try {
            const salt = await this.getSalt();
            const key = await this.deriveKey(password, salt);
            
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV für GCM
            
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );

            return {
                encrypted: this.uint8ArrayToHex(new Uint8Array(encryptedBuffer)),
                iv: this.uint8ArrayToHex(iv),
                version: this.VERSION
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt wallet data');
        }
    }

    // Entschlüssele Daten mit AES-GCM
    static async decrypt(encryptedData, password) {
        try {
            const salt = await this.getSalt();
            const key = await this.deriveKey(password, salt);
            
            const encryptedBuffer = this.hexToUint8Array(encryptedData.encrypted);
            const iv = this.hexToUint8Array(encryptedData.iv);
            
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encryptedBuffer
            );

            const decoder = new TextDecoder();
            const decryptedString = decoder.decode(decryptedBuffer);
            
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Invalid password or corrupted wallet data');
        }
    }
}

// Sichere Wallet-Speicher-Klasse
class SecureWalletStorage {
    static ACCOUNTS_KEY = 'ctc-accounts-list';
    static ACTIVE_ACCOUNT_KEY = 'ctc-active-account';
    static SESSION_KEY = 'ctc-session';
    static MAX_FAILED_ATTEMPTS = 5;
    static LOCKOUT_TIME = 30 * 60 * 1000; // 30 Minuten

    // Speichere verschlüsseltes Wallet
    static async saveWallet(walletData, password, accountName = 'Main Account') {
        try {
            // Validiere Eingaben
            if (!walletData || !walletData.mnemonic || !password) {
                throw new Error('Invalid wallet data or password');
            }

            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }

            // Bereite Wallet-Daten vor
            const secureData = {
                mnemonic: walletData.mnemonic,
                privateKey: walletData.privateKeyHex,
                publicKey: walletData.publicKeyHex,
                address: walletData.address,
                createdAt: Date.now(),
                version: SecureStorage.VERSION
            };

            // Verschlüssele Wallet-Daten
            const encryptedWallet = await SecureStorage.encrypt(secureData, password);
            
            // Generiere Account-ID
            const accountId = this.generateAccountId(walletData.address);
            
            // Speichere verschlüsseltes Wallet
            const walletKey = SecureStorage.WALLET_PREFIX + accountId;
            localStorage.setItem(walletKey, JSON.stringify(encryptedWallet));

            // Aktualisiere Account-Liste (nur öffentliche Daten)
            await this.updateAccountsList(accountId, accountName, walletData.address);
            
            // Setze als aktiven Account
            localStorage.setItem(this.ACTIVE_ACCOUNT_KEY, accountId);

            console.log('🔒 Wallet successfully saved with encryption');
            return accountId;
            
        } catch (error) {
            console.error('❌ Error saving wallet:', error);
            throw error;
        }
    }

    // Lade und entschlüssele Wallet
    static async loadWallet(accountId, password) {
        try {
            // Prüfe Fehlversuche
            if (this.isAccountLocked(accountId)) {
                throw new Error('Account temporarily locked due to failed attempts');
            }

            const walletKey = SecureStorage.WALLET_PREFIX + accountId;
            const encryptedData = localStorage.getItem(walletKey);
            
            if (!encryptedData) {
                throw new Error('Wallet not found');
            }

            const encryptedWallet = JSON.parse(encryptedData);
            
            // Entschlüssele Wallet-Daten
            const walletData = await SecureStorage.decrypt(encryptedWallet, password);
            
            // Validiere entschlüsselte Daten
            if (!walletData.mnemonic || !walletData.address) {
                throw new Error('Invalid wallet data structure');
            }

            // Lösche Fehlversuche bei erfolgreichem Login
            this.clearFailedAttempts(accountId);
            
            // Erstelle Session-Token
            this.createSession(accountId);

            console.log('🔓 Wallet successfully loaded and decrypted');
            return walletData;
            
        } catch (error) {
            console.error('❌ Error loading wallet:', error);
            
            // Zähle Fehlversuche
            if (error.message.includes('Invalid password')) {
                this.recordFailedAttempt(accountId);
            }
            
            throw error;
        }
    }

    // Prüfe ob Wallet existiert
    static hasWallet(accountId = null) {
        if (accountId) {
            const walletKey = SecureStorage.WALLET_PREFIX + accountId;
            return localStorage.getItem(walletKey) !== null;
        }
        
        // Prüfe für beliebige Wallets
        const accounts = this.getAccountsList();
        return accounts.length > 0;
    }

    // Lösche Wallet permanent
    static deleteWallet(accountId) {
        try {
            const walletKey = SecureStorage.WALLET_PREFIX + accountId;
            localStorage.removeItem(walletKey);
            
            // Entferne aus Account-Liste
            const accounts = this.getAccountsList();
            const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
            localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
            
            // Lösche Session falls das der aktive Account war
            const activeAccount = localStorage.getItem(this.ACTIVE_ACCOUNT_KEY);
            if (activeAccount === accountId) {
                localStorage.removeItem(this.ACTIVE_ACCOUNT_KEY);
                localStorage.removeItem(this.SESSION_KEY);
            }
            
            console.log('🗑️ Wallet deleted permanently');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting wallet:', error);
            return false;
        }
    }

    // Account-Management
    static updateAccountsList(accountId, name, address) {
        const accounts = this.getAccountsList();
        const existingIndex = accounts.findIndex(acc => acc.id === accountId);
        
        const accountData = {
            id: accountId,
            name: name,
            address: address,
            createdAt: Date.now()
        };
        
        if (existingIndex >= 0) {
            accounts[existingIndex] = accountData;
        } else {
            accounts.push(accountData);
        }
        
        localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    static getAccountsList() {
        const accountsData = localStorage.getItem(this.ACCOUNTS_KEY);
        return accountsData ? JSON.parse(accountsData) : [];
    }

    static generateAccountId(address) {
        // Erstelle eindeutige ID aus Adresse
        return address.substring(3, 13); // CTC + erste 10 Zeichen
    }

    // Session-Management
    static createSession(accountId) {
        const sessionData = {
            accountId: accountId,
            createdAt: Date.now(),
            expiresAt: Date.now() + (15 * 60 * 1000) // 15 Minuten
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    }

    static isSessionValid() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (!sessionData) return false;
        
        const session = JSON.parse(sessionData);
        return Date.now() < session.expiresAt;
    }

    static extendSession() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (!sessionData) return false;
        
        const session = JSON.parse(sessionData);
        session.expiresAt = Date.now() + (15 * 60 * 1000);
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return true;
    }

    static clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
    }

    // Sicherheits-Features
    static recordFailedAttempt(accountId) {
        const key = `failed-attempts-${accountId}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        
        localStorage.setItem(key, JSON.stringify(attempts));
        
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
            console.warn('🚨 Account locked due to failed attempts');
        }
    }

    static clearFailedAttempts(accountId) {
        const key = `failed-attempts-${accountId}`;
        localStorage.removeItem(key);
    }

    static isAccountLocked(accountId) {
        const key = `failed-attempts-${accountId}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        if (attempts.count >= this.MAX_FAILED_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
            if (timeSinceLastAttempt < this.LOCKOUT_TIME) {
                return true;
            } else {
                // Lockout abgelaufen, lösche Fehlversuche
                this.clearFailedAttempts(accountId);
            }
        }
        
        return false;
    }

    // Vollständige Bereinigung (für Reset)
    static clearAllData() {
        try {
            // Lösche alle Wallet-Daten
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('ctc-')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('🧹 All wallet data cleared');
            return true;
            
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    }
}

// Export für globale Verwendung
window.SecureStorage = SecureStorage;
window.SecureWalletStorage = SecureWalletStorage;