// js/utils/secure-password-manager.js - Secure Password Manager

class SecurePasswordManager {
    static PASSWORD_HASH_KEY = 'ctc-password-hash';
    static SALT_KEY = 'ctc-password-salt';
    
    // Create password hash with PBKDF2
    static async hashPassword(password, salt = null) {
        const encoder = new TextEncoder();
        
        // Generate new salt if none provided
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(16));
        }
        
        // Convert password to bytes
        const passwordBytes = encoder.encode(password);
        
        // Import key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBytes,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        // Create hash with PBKDF2 (100,000 iterations for security)
        const hashBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            256 // 32 bytes
        );
        
        return {
            hash: new Uint8Array(hashBits),
            salt: salt
        };
    }
    
    // Store password (hash + salt)
    static async storePassword(password) {
        try {
            const { hash, salt } = await this.hashPassword(password);
            
            // Store hash and salt as arrays
            const hashArray = Array.from(hash);
            const saltArray = Array.from(salt);
            
            Storage.set(this.PASSWORD_HASH_KEY, hashArray);
            Storage.set(this.SALT_KEY, saltArray);
            
            console.log('🔒 Password hash stored securely');
            return true;
        } catch (error) {
            console.error('❌ Error storing password:', error);
            return false;
        }
    }
    
    // Validate password
    static async validatePassword(password) {
        try {
            // Load stored hash and salt
            const storedHashArray = Storage.get(this.PASSWORD_HASH_KEY);
            const storedSaltArray = Storage.get(this.SALT_KEY);
            
            if (!storedHashArray || !storedSaltArray) {
                console.error('❌ No stored password found');
                return false;
            }
            
            // Convert arrays back to Uint8Arrays
            const storedHash = new Uint8Array(storedHashArray);
            const storedSalt = new Uint8Array(storedSaltArray);
            
            // Create new hash with same salt
            const { hash: newHash } = await this.hashPassword(password, storedSalt);
            
            // Compare hashes
            if (storedHash.length !== newHash.length) {
                return false;
            }
            
            for (let i = 0; i < storedHash.length; i++) {
                if (storedHash[i] !== newHash[i]) {
                    return false;
                }
            }
            
            console.log('✅ Password successfully validated');
            return true;
        } catch (error) {
            console.error('❌ Error validating password:', error);
            return false;
        }
    }
    
    // Check if password is stored
    static hasStoredPassword() {
        return !!(Storage.get(this.PASSWORD_HASH_KEY) && Storage.get(this.SALT_KEY));
    }
    
    // Clear password data
    static clearPassword() {
        Storage.remove(this.PASSWORD_HASH_KEY);
        Storage.remove(this.SALT_KEY);
        console.log('🗑️ Password data cleared');
    }
    
    // Generate secure random password
    static generateRandomPassword(length = 16) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const randomArray = crypto.getRandomValues(new Uint8Array(length));
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset[randomArray[i] % charset.length];
        }
        
        return password;
    }
    
    // Create backup verification code
    static async createBackupCode() {
        const randomBytes = crypto.getRandomValues(new Uint8Array(6));
        return Array.from(randomBytes, byte => (byte % 10).toString()).join('');
    }
    
    // Encrypt data with password (for backup purposes)
    static async encryptWithPassword(data, password) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            // Derive key from password
            const keyMaterial = await crypto.subtle.importKey(
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
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                dataBuffer
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
    
    // Decrypt data with password
    static async decryptWithPassword(encryptedArray, password) {
        try {
            const encoder = new TextEncoder();
            const encryptedData = new Uint8Array(encryptedArray);
            
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 28);
            const data = encryptedData.slice(28);
            
            // Derive key from password
            const keyMaterial = await crypto.subtle.importKey(
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
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data - wrong password?');
        }
    }
    
    // Security audit functions
    static getSecurityInfo() {
        return {
            hasStoredPassword: this.hasStoredPassword(),
            algorithm: 'PBKDF2-SHA256',
            iterations: 100000,
            keyLength: 256,
            saltLength: 128,
            lastAccess: Date.now()
        };
    }
    
    // Clean up sensitive data from memory (best effort)
    static secureClear() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear any temporary variables that might hold sensitive data
        if (window.tempPasswordData) {
            delete window.tempPasswordData;
        }
        
        console.log('🧹 Secure memory cleanup performed');
    }
    
    // Test password strength
    static testPasswordStrength(password) {
        if (!password) return { score: 0, feedback: ['Password is required'] };
        
        let score = 0;
        const feedback = [];
        
        // Length check
        if (password.length >= 8) score += 1;
        else feedback.push('Use at least 8 characters');
        
        if (password.length >= 12) score += 1;
        else if (password.length >= 8) feedback.push('Consider using 12+ characters');
        
        // Character variety
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Add uppercase letters');
        
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Add lowercase letters');
        
        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Add numbers');
        
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else feedback.push('Add special characters');
        
        // Common patterns check
        if (/(.)\1{2,}/.test(password)) {
            score -= 1;
            feedback.push('Avoid repeated characters');
        }
        
        if (/123|abc|qwe/i.test(password)) {
            score -= 1;
            feedback.push('Avoid common sequences');
        }
        
        const strength = Math.max(0, Math.min(5, score));
        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        
        return {
            score: strength,
            level: levels[strength],
            feedback: feedback
        };
    }
}

// Export to global scope
window.SecurePasswordManager = SecurePasswordManager;

console.log('🔒 Secure Password Manager loaded');
