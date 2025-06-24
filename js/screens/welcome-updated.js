// js/screens/welcome-updated.js - FIXED Welcome & Login Screens

class WelcomeScreen {
    constructor() {
        this.currentStep = 'welcome';
        this.isProcessing = false;
        this.mnemonicWords = [];
        this.verificationWords = [];
        this.tempPassword = '';
        this.tempAccountName = '';
        this.tempWallet = null;
    }

    // Haupteingang - Welcome Screen
    showWelcome() {
        this.currentStep = 'welcome';
        
        const content = `
            <div class="welcome-container">
                <div class="welcome-header">
                    <div class="app-logo">
                        <div class="logo-icon">₿</div>
                        <h1>CTC Wallet</h1>
                        <p class="subtitle">Secure Multi-Account Cryptocurrency Wallet</p>
                    </div>
                </div>

                <div class="welcome-content">
                    <div class="security-badges">
                        <div class="badge">
                            <div class="badge-icon">🔒</div>
                            <span>Offline Storage</span>
                        </div>
                        <div class="badge">
                            <div class="badge-icon">🔑</div>
                            <span>Private Keys</span>
                        </div>
                        <div class="badge">
                            <div class="badge-icon">📱</div>
                            <span>Mobile Ready</span>
                        </div>
                    </div>

                    <div class="welcome-actions">
                        <button class="btn-primary" onclick="welcomeScreen.showCreateWallet()">
                            <span class="btn-icon">➕</span>
                            Create New Wallet
                        </button>
                        
                        <button class="btn-secondary" onclick="welcomeScreen.showRestoreWallet()">
                            <span class="btn-icon">🔄</span>
                            Restore Existing Wallet
                        </button>
                    </div>

                    <div class="existing-accounts-check">
                        ${this.renderExistingAccountsButton()}
                    </div>
                </div>

                <div class="welcome-footer">
                    <div class="security-notice">
                        <p><strong>🔒 Your security is our priority</strong></p>
                        <p>Your private keys are encrypted and stored only on your device.</p>
                        <p>We never have access to your funds or personal information.</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = content;
    }

    // Existing accounts button rendern
    renderExistingAccountsButton() {
        if (SecureWalletStorage.hasWallet()) {
            return `
                <div class="existing-accounts">
                    <p>Already have a wallet?</p>
                    <button class="btn-link" onclick="app.showLogin()">
                        Sign In to Existing Wallet
                    </button>
                </div>
            `;
        }
        return '';
    }

    // Neue Wallet erstellen - Schritt 1: Account Name und Passwort
    showCreateWallet() {
        this.currentStep = 'create-setup';
        
        const content = `
            <div class="create-wallet-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">
                        ← Back
                    </button>
                    <h2>Create New Wallet</h2>
                </div>

                <div class="create-info">
                    <div class="info-icon">🔐</div>
                    <p>Create a secure wallet to store your CTC cryptocurrency.</p>
                </div>

                <form class="create-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="account-name">Wallet Name</label>
                        <input 
                            type="text" 
                            id="account-name" 
                            placeholder="My CTC Wallet"
                            value="My CTC Wallet"
                            maxlength="50"
                        >
                        <small>Choose a name to identify this wallet</small>
                    </div>

                    <div class="form-group">
                        <label for="create-password">Password</label>
                        <input 
                            type="password" 
                            id="create-password" 
                            placeholder="Enter a strong password"
                            minlength="8"
                        >
                        <div class="password-strength" id="password-strength"></div>
                        <small>At least 8 characters. This encrypts your wallet.</small>
                    </div>

                    <div class="form-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input 
                            type="password" 
                            id="confirm-password" 
                            placeholder="Confirm your password"
                        >
                        <div class="input-feedback" id="password-feedback"></div>
                    </div>

                    <div class="security-warning">
                        <div class="warning-icon">⚠️</div>
                        <div class="warning-text">
                            <strong>Important:</strong> Remember your password! 
                            If you lose it, you'll need your seed phrase to recover your wallet.
                        </div>
                    </div>

                    <button 
                        type="button" 
                        class="btn-primary continue-btn" 
                        onclick="welcomeScreen.continueToSeedPhrase()"
                        id="continue-btn"
                    >
                        Continue
                    </button>
                </form>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = content;
        
        // Setup password validation
        this.setupPasswordValidation();
    }

    // Password validation setup
    setupPasswordValidation() {
        const passwordInput = document.getElementById('create-password');
        const confirmInput = document.getElementById('confirm-password');
        const strengthDiv = document.getElementById('password-strength');
        const feedbackDiv = document.getElementById('password-feedback');
        const continueBtn = document.getElementById('continue-btn');
        
        const validatePassword = () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            // Password strength
            let strength = 0;
            let strengthText = '';
            
            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/\d/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;
            
            switch (strength) {
                case 0:
                case 1:
                    strengthText = 'Weak';
                    strengthDiv.className = 'password-strength weak';
                    break;
                case 2:
                    strengthText = 'Fair';
                    strengthDiv.className = 'password-strength fair';
                    break;
                case 3:
                    strengthText = 'Good';
                    strengthDiv.className = 'password-strength good';
                    break;
                case 4:
                    strengthText = 'Strong';
                    strengthDiv.className = 'password-strength strong';
                    break;
            }
            
            strengthDiv.textContent = password ? `Password strength: ${strengthText}` : '';
            
            // Confirm password validation
            if (confirm && password !== confirm) {
                feedbackDiv.textContent = 'Passwords do not match';
                feedbackDiv.className = 'input-feedback error';
                continueBtn.disabled = true;
            } else if (password && confirm && password === confirm && strength >= 2) {
                feedbackDiv.textContent = 'Passwords match';
                feedbackDiv.className = 'input-feedback success';
                continueBtn.disabled = false;
            } else {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'input-feedback';
                continueBtn.disabled = true;
            }
        };
        
        passwordInput.addEventListener('input', validatePassword);
        confirmInput.addEventListener('input', validatePassword);
    }

    // Continue to seed phrase generation
    async continueToSeedPhrase() {
        const accountName = document.getElementById('account-name').value.trim();
        const password = document.getElementById('create-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!accountName) {
            alert('Please enter a wallet name');
            return;
        }
        
        if (!password || password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        this.tempAccountName = accountName;
        this.tempPassword = password;
        
        await this.showSeedPhrase();
    }

    // Seed Phrase anzeigen
    async showSeedPhrase() {
        this.currentStep = 'seed-phrase';
        
        try {
            // Generate new wallet using static method
            this.tempWallet = await CTCWallet.create();
            this.mnemonicWords = this.tempWallet.getMnemonic().split(' ');
            
            const content = `
                <div class="seed-phrase-container">
                    <div class="header">
                        <button class="back-btn" onclick="welcomeScreen.showCreateWallet()">
                            ← Back
                        </button>
                        <h2>Your Seed Phrase</h2>
                    </div>

                    <div class="seed-info">
                        <div class="warning-icon">🔒</div>
                        <p><strong>Write down these 12 words in order.</strong></p>
                        <p>This is your seed phrase - the only way to recover your wallet if you lose your password.</p>
                    </div>

                    <div class="seed-phrase-grid">
                        ${this.mnemonicWords.map((word, index) => `
                            <div class="seed-word">
                                <span class="word-number">${index + 1}</span>
                                <span class="word-text">${word}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="seed-actions">
                        <button class="btn-secondary" onclick="welcomeScreen.copySeedPhrase()">
                            📋 Copy to Clipboard
                        </button>
                    </div>

                    <div class="security-warnings">
                        <div class="warning-item">
                            <span class="warning-icon">⚠️</span>
                            <span>Never share your seed phrase with anyone</span>
                        </div>
                        <div class="warning-item">
                            <span class="warning-icon">💾</span>
                            <span>Store it safely offline (write it down)</span>
                        </div>
                        <div class="warning-item">
                            <span class="warning-icon">🔐</span>
                            <span>You need this to recover your wallet</span>
                        </div>
                    </div>

                    <button 
                        class="btn-primary continue-btn" 
                        onclick="welcomeScreen.continueToVerification()"
                    >
                        I've Written It Down Safely
                    </button>
                </div>
            `;
            
            document.getElementById('app-container').innerHTML = content;
            
        } catch (error) {
            console.error('❌ Error generating wallet:', error);
            alert('Failed to generate wallet. Please try again.');
            this.showCreateWallet();
        }
    }

    // Copy seed phrase to clipboard
    copySeedPhrase() {
        const seedPhrase = this.mnemonicWords.join(' ');
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(seedPhrase).then(() => {
                alert('Seed phrase copied to clipboard!\n\nFor security, please write it down on paper and clear your clipboard.');
            }).catch(() => {
                this.fallbackCopyToClipboard(seedPhrase);
            });
        } else {
            this.fallbackCopyToClipboard(seedPhrase);
        }
    }

    // Fallback copy method
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            alert('Seed phrase copied to clipboard!\n\nFor security, please write it down on paper and clear your clipboard.');
        } catch (err) {
            alert('Copy failed. Please manually copy:\n\n' + text);
        }
        
        document.body.removeChild(textArea);
    }

    // Continue to verification
    continueToVerification() {
        this.currentStep = 'verification';
        
        // Select 3 random words for verification
        const indices = [];
        while (indices.length < 3) {
            const randomIndex = Math.floor(Math.random() * 12);
            if (!indices.includes(randomIndex)) {
                indices.push(randomIndex);
            }
        }
        indices.sort((a, b) => a - b);
        
        this.verificationWords = indices.map(i => ({
            index: i,
            word: this.mnemonicWords[i]
        }));
        
        const content = `
            <div class="verification-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showSeedPhrase()">
                        ← Back
                    </button>
                    <h2>Verify Seed Phrase</h2>
                </div>

                <div class="verification-info">
                    <div class="info-icon">✅</div>
                    <p>Please enter the following words from your seed phrase to confirm you've saved it correctly.</p>
                </div>

                <div class="verification-form">
                    ${this.verificationWords.map((item, index) => `
                        <div class="form-group">
                            <label for="word-${index}">Word #${item.index + 1}</label>
                            <input 
                                type="text" 
                                id="word-${index}" 
                                placeholder="Enter word ${item.index + 1}"
                                autocomplete="off"
                                autocorrect="off"
                                autocapitalize="off"
                                spellcheck="false"
                            >
                        </div>
                    `).join('')}
                </div>

                <div class="verification-feedback" id="verification-feedback"></div>

                <button 
                    class="btn-primary create-btn" 
                    onclick="welcomeScreen.verifyAndCreateWallet()"
                    id="verify-btn"
                >
                    <span class="loading-indicator" id="create-loading" style="display: none;">
                        <div class="spinner"></div>
                    </span>
                    <span id="create-text">Create Wallet</span>
                </button>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = content;
    }

    // Verify and create wallet
    async verifyAndCreateWallet() {
        if (this.isProcessing) return;
        
        // Verify entered words
        let allCorrect = true;
        for (let i = 0; i < this.verificationWords.length; i++) {
            const input = document.getElementById(`word-${i}`);
            const enteredWord = input.value.trim().toLowerCase();
            const expectedWord = this.verificationWords[i].word.toLowerCase();
            
            if (enteredWord !== expectedWord) {
                allCorrect = false;
                input.style.borderColor = '#ff6b6b';
            } else {
                input.style.borderColor = '#4CAF50';
            }
        }
        
        if (!allCorrect) {
            document.getElementById('verification-feedback').innerHTML = `
                <div class="error-message">
                    ❌ Some words don't match. Please check the words and try again.
                </div>
            `;
            return;
        }

        const btn = document.getElementById('verify-btn');
        const loadingDiv = document.getElementById('create-loading');
        const textSpan = document.getElementById('create-text');

        this.isProcessing = true;
        loadingDiv.style.display = 'flex';
        textSpan.textContent = 'Creating...';
        btn.disabled = true;

        try {
            // Create wallet via app using the already generated wallet
            const app = AppUtils.getInstance();
            if (app && this.tempWallet) {
                // Save the wallet using SecureWalletStorage directly
                await SecureWalletStorage.saveWallet(this.tempWallet, this.tempPassword, this.tempAccountName);
                
                // Set current wallet in app
                app.currentWallet = this.tempWallet;
                app.currentAccount = {
                    name: this.tempAccountName,
                    address: this.tempWallet.address
                };
                
                // Clear temporary data
                this.clearTempData();
                
                // Show wallet screen
                await app.showWalletScreen();
                
            } else {
                throw new Error('App not initialized or wallet not generated');
            }

        } catch (error) {
            console.error('❌ Error creating wallet:', error);
            
            loadingDiv.style.display = 'none';
            textSpan.textContent = 'Create Wallet';
            btn.disabled = false;
            this.isProcessing = false;
            
            document.getElementById('verification-feedback').innerHTML = `
                <div class="error-message">
                    ❌ Failed to create wallet. Please try again.
                </div>
            `;
        }
    }

    // Wallet wiederherstellen
    showRestoreWallet() {
        this.currentStep = 'restore';
        
        const content = `
            <div class="restore-wallet-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">
                        ← Back
                    </button>
                    <h2>Restore Wallet</h2>
                </div>

                <div class="restore-info">
                    <div class="info-icon">🔄</div>
                    <p>Enter your 12-word seed phrase to restore your existing wallet.</p>
                </div>

                <form class="restore-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="restore-seed">Seed Phrase (12 words)</label>
                        <textarea 
                            id="restore-seed" 
                            placeholder="Enter your 12-word seed phrase separated by spaces"
                            rows="4"
                            class="secure-input"
                            autocomplete="off"
                            autocorrect="off"
                            autocapitalize="off"
                            spellcheck="false"
                        ></textarea>
                        <small>Separate words with spaces. Example: word1 word2 word3...</small>
                    </div>

                    <div class="form-group">
                        <label for="restore-account-name">Wallet Name</label>
                        <input 
                            type="text" 
                            id="restore-account-name" 
                            placeholder="Restored Wallet"
                            value="Restored Wallet"
                            maxlength="50"
                        >
                    </div>

                    <div class="form-group">
                        <label for="restore-password">New Password</label>
                        <input 
                            type="password" 
                            id="restore-password" 
                            placeholder="Enter a password to encrypt this wallet"
                            minlength="8"
                        >
                        <small>Choose a password to encrypt your restored wallet</small>
                    </div>

                    <div class="form-group">
                        <label for="restore-confirm-password">Confirm Password</label>
                        <input 
                            type="password" 
                            id="restore-confirm-password" 
                            placeholder="Confirm your password"
                        >
                        <div class="input-feedback" id="restore-feedback"></div>
                    </div>

                    <button 
                        type="button" 
                        class="btn-primary restore-btn" 
                        onclick="welcomeScreen.restoreWallet()"
                        id="restore-btn"
                    >
                        <span class="loading-indicator" id="restore-loading" style="display: none;">
                            <div class="spinner"></div>
                        </span>
                        <span id="restore-text">Restore Wallet</span>
                    </button>
                </form>

                <div class="security-notice">
                    <div class="warning-icon">🔒</div>
                    <div class="warning-text">
                        <strong>Security:</strong> Your seed phrase will be encrypted with your new password and stored securely on this device.
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-container').innerHTML = content;
        
        // Setup restore password validation
        this.setupRestorePasswordValidation();
    }

    // Setup restore password validation
    setupRestorePasswordValidation() {
        const passwordInput = document.getElementById('restore-password');
        const confirmInput = document.getElementById('restore-confirm-password');
        const feedbackDiv = document.getElementById('restore-feedback');
        const restoreBtn = document.getElementById('restore-btn');
        
        const validateRestorePassword = () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            if (confirm && password !== confirm) {
                feedbackDiv.textContent = 'Passwords do not match';
                feedbackDiv.className = 'input-feedback error';
                restoreBtn.disabled = true;
            } else if (password && confirm && password === confirm && password.length >= 8) {
                feedbackDiv.textContent = 'Passwords match';
                feedbackDiv.className = 'input-feedback success';
                restoreBtn.disabled = false;
            } else {
                feedbackDiv.textContent = '';
                feedbackDiv.className = 'input-feedback';
                restoreBtn.disabled = true;
            }
        };
        
        passwordInput.addEventListener('input', validateRestorePassword);
        confirmInput.addEventListener('input', validateRestorePassword);
    }

    // Restore wallet from seed phrase
    async restoreWallet() {
        if (this.isProcessing) return;
        
        const seedPhrase = document.getElementById('restore-seed').value.trim();
        const accountName = document.getElementById('restore-account-name').value.trim();
        const password = document.getElementById('restore-password').value;
        const confirmPassword = document.getElementById('restore-confirm-password').value;
        
        if (!seedPhrase) {
            alert('Please enter your seed phrase');
            return;
        }
        
        // Validate seed phrase format
        const words = seedPhrase.split(/\s+/);
        if (words.length !== 12) {
            alert('Seed phrase must contain exactly 12 words');
            return;
        }
        
        if (!accountName) {
            alert('Please enter a wallet name');
            return;
        }
        
        if (!password || password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const btn = document.getElementById('restore-btn');
        const loadingDiv = document.getElementById('restore-loading');
        const textSpan = document.getElementById('restore-text');
        
        this.isProcessing = true;
        loadingDiv.style.display = 'flex';
        textSpan.textContent = 'Restoring...';
        btn.disabled = true;
        
        try {
            // Restore wallet using static method
            const restoredWallet = await CTCWallet.restore(seedPhrase);
            
            // Save the wallet using SecureWalletStorage
            await SecureWalletStorage.saveWallet(restoredWallet, password, accountName);
            
            // Set current wallet in app
            const app = AppUtils.getInstance();
            if (app) {
                app.currentWallet = restoredWallet;
                app.currentAccount = {
                    name: accountName,
                    address: restoredWallet.address
                };
                
                // Show wallet screen
                await app.showWalletScreen();
            } else {
                throw new Error('App not initialized');
            }
            
        } catch (error) {
            console.error('❌ Error restoring wallet:', error);
            
            loadingDiv.style.display = 'none';
            textSpan.textContent = 'Restore Wallet';
            btn.disabled = false;
            this.isProcessing = false;
            
            alert('Failed to restore wallet: ' + error.message);
        }
    }

    // Clear temporary data
    clearTempData() {
        this.tempAccountName = '';
        this.tempPassword = '';
        this.mnemonicWords = [];
        this.verificationWords = [];
        this.tempWallet = null;
        this.isProcessing = false;
    }

    // Get current step
    getCurrentStep() {
        return this.currentStep;
    }

    // Reset to welcome
    reset() {
        this.clearTempData();
        this.showWelcome();
    }
}

// Create global welcome screen instance
const welcomeScreen = new WelcomeScreen();

// Export to global scope
window.welcomeScreen = welcomeScreen;
window.WelcomeScreen = WelcomeScreen;

console.log('👋 Welcome Screen loaded successfully');