// js/screens/welcome-updated.js - Sichere Welcome & Login Screens

class WelcomeScreen {
    constructor() {
        this.currentStep = 'welcome';
        this.isProcessing = false;
        this.mnemonicWords = [];
        this.verificationWords = [];
        this.tempPassword = '';
        this.tempAccountName = '';
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
                        <p>Your private keys are encrypted and stored only on your device. 
                           Never share your seed phrase with anyone.</p>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Prüfe existierende Accounts
    renderExistingAccountsButton() {
        const accounts = SecureWalletStorage.getAccountsList();
        
        if (accounts.length > 0) {
            return `
                <div class="existing-accounts">
                    <p>Already have a wallet?</p>
                    <button class="btn-link" onclick="welcomeScreen.showAccountSelection()">
                        Access Existing Wallets (${accounts.length})
                    </button>
                </div>
            `;
        }
        
        return '';
    }

    // Account-Auswahl für existierende Wallets
    showAccountSelection() {
        const accounts = SecureWalletStorage.getAccountsList();
        
        if (accounts.length === 1) {
            // Nur ein Account - direkt zum Login
            this.showLogin(accounts[0]);
            return;
        }

        const accountsList = accounts.map(account => `
            <div class="account-item" onclick="welcomeScreen.showLogin('${account.id}')">
                <div class="account-info">
                    <div class="account-name">${account.name}</div>
                    <div class="account-address">${account.address}</div>
                    <div class="account-created">
                        Created: ${new Date(account.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="account-action">
                    <span class="arrow">→</span>
                </div>
            </div>
        `).join('');

        const content = `
            <div class="account-selection-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">
                        ← Back
                    </button>
                    <h2>Select Account</h2>
                </div>

                <div class="accounts-list">
                    ${accountsList}
                </div>

                <div class="account-actions">
                    <button class="btn-secondary" onclick="welcomeScreen.showCreateWallet()">
                        <span class="btn-icon">➕</span>
                        Create New Account
                    </button>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
    }

    // Login Screen für spezifischen Account
    showLogin(accountIdOrData) {
        const account = typeof accountIdOrData === 'string' 
            ? SecureWalletStorage.getAccountsList().find(acc => acc.id === accountIdOrData)
            : accountIdOrData;

        if (!account) {
            Toast.error('Account not found');
            this.showWelcome();
            return;
        }

        // Prüfe Account-Lock-Status
        const isLocked = SecureWalletStorage.isAccountLocked(account.id);
        const lockMessage = isLocked ? this.getLockMessage(account.id) : '';

        const content = `
            <div class="login-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showAccountSelection()">
                        ← Back
                    </button>
                    <h2>Unlock Wallet</h2>
                </div>

                <div class="account-preview">
                    <div class="account-avatar">
                        <div class="avatar-icon">${account.name.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="account-details">
                        <div class="account-name">${account.name}</div>
                        <div class="account-address secure-content">${account.address}</div>
                    </div>
                </div>

                ${isLocked ? `
                    <div class="security-warning">
                        <div class="warning-icon">🔒</div>
                        <div class="warning-message">
                            <h3>Account Temporarily Locked</h3>
                            <p>${lockMessage}</p>
                        </div>
                    </div>
                ` : ''}

                <div class="login-form">
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="login-password" 
                                placeholder="Enter your password"
                                class="secure-input"
                                autocomplete="current-password"
                                ${isLocked ? 'disabled' : ''}
                                onkeypress="if(event.key==='Enter') welcomeScreen.unlockWallet('${account.id}')"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('login-password')">
                                👁️
                            </button>
                        </div>
                        <div class="password-strength-info">
                            <small>Enter your wallet password to unlock</small>
                        </div>
                    </div>

                    <button 
                        class="btn-primary full-width" 
                        id="unlock-btn"
                        onclick="welcomeScreen.unlockWallet('${account.id}')"
                        ${isLocked ? 'disabled' : ''}
                    >
                        <span id="unlock-text">Unlock Wallet</span>
                        <div id="unlock-loading" class="loading-spinner" style="display: none;"></div>
                    </button>
                </div>

                <div class="login-options">
                    <button class="btn-link" onclick="welcomeScreen.showForgotPassword('${account.id}')">
                        Forgot Password?
                    </button>
                    <button class="btn-link danger" onclick="welcomeScreen.showDeleteAccount('${account.id}')">
                        Delete This Wallet
                    </button>
                </div>

                <div class="security-tips">
                    <h4>🔒 Security Tips</h4>
                    <ul>
                        <li>Never share your password with anyone</li>
                        <li>Use a strong, unique password</li>
                        <li>The app will auto-lock after inactivity</li>
                    </ul>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
        
        // Focus auf Passwort-Feld
        setTimeout(() => {
            const passwordInput = DOM.get('login-password');
            if (passwordInput && !isLocked) {
                passwordInput.focus();
            }
        }, 100);
    }

    // Wallet entsperren
    async unlockWallet(accountId) {
        if (this.isProcessing) return;

        const password = DOM.getValue('login-password');
        const btn = DOM.get('unlock-btn');
        const loadingDiv = DOM.get('unlock-loading');
        const textSpan = DOM.get('unlock-text');

        // Validierung
        if (!password || password.length < 8) {
            Toast.error('Password must be at least 8 characters');
            AppUtils.getInstance()?.triggerHaptic('error');
            return;
        }

        this.isProcessing = true;
        DOM.show(loadingDiv);
        textSpan.textContent = 'Unlocking...';
        btn.disabled = true;

        try {
            AppUtils.getInstance()?.triggerHaptic('light');
            
            // Wallet entsperren über App
            const app = AppUtils.getInstance();
            if (app) {
                await app.unlockWallet(accountId, password);
                AppUtils.getInstance()?.triggerHaptic('success');
            } else {
                throw new Error('App not initialized');
            }

        } catch (error) {
            console.error('❌ Error unlocking wallet:', error);
            
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Unlock Wallet';
            btn.disabled = false;
            this.isProcessing = false;
            
            // Spezifische Fehlermeldungen
            if (error.message.includes('Invalid password')) {
                Toast.error('Invalid password. Please try again.');
            } else if (error.message.includes('locked')) {
                Toast.error('Account is temporarily locked');
                this.showLogin(accountId); // Refresh für Lock-Status
            } else {
                Toast.error('Failed to unlock wallet');
            }
            
            AppUtils.getInstance()?.triggerHaptic('error');
        }
    }

    // Neues Wallet erstellen
    showCreateWallet() {
        this.currentStep = 'create';
        
        const content = `
            <div class="create-wallet-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">
                        ← Back
                    </button>
                    <h2>Create New Wallet</h2>
                </div>

                <div class="create-steps">
                    <div class="step active">
                        <div class="step-number">1</div>
                        <span>Account Setup</span>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <span>Seed Phrase</span>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <span>Verification</span>
                    </div>
                </div>

                <div class="create-form">
                    <div class="form-group">
                        <label for="account-name">Account Name</label>
                        <input 
                            type="text" 
                            id="account-name" 
                            placeholder="My CTC Wallet"
                            maxlength="30"
                            autocomplete="off"
                        >
                        <small>Choose a name to identify this wallet</small>
                    </div>

                    <div class="form-group">
                        <label for="new-password">Wallet Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="new-password" 
                                placeholder="Create a strong password"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('new-password')">
                                👁️
                            </button>
                        </div>
                        <div id="password-strength" class="password-strength"></div>
                    </div>

                    <div class="form-group">
                        <label for="confirm-password">Confirm Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="confirm-password" 
                                placeholder="Confirm your password"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('confirm-password')">
                                👁️
                            </button>
                        </div>
                    </div>

                    <div class="security-agreement">
                        <label class="checkbox-label">
                            <input type="checkbox" id="security-agreement">
                            <span class="checkmark"></span>
                            I understand that my wallet password encrypts my private keys and cannot be recovered if lost.
                        </label>
                    </div>

                    <button class="btn-primary full-width" onclick="welcomeScreen.proceedToSeedPhrase()">
                        Continue to Seed Phrase
                    </button>
                </div>

                <div class="security-info">
                    <h4>🛡️ Security Information</h4>
                    <ul>
                        <li>Your password encrypts your wallet data</li>
                        <li>Use at least 8 characters with numbers and symbols</li>
                        <li>Never share your password with anyone</li>
                        <li>We cannot recover lost passwords</li>
                    </ul>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);

        // Passwort-Stärke-Anzeige
        this.setupPasswordStrengthIndicator();
    }

    // Zum Seed Phrase Schritt
    async proceedToSeedPhrase() {
        // Validierung
        const accountName = DOM.getValue('account-name').trim();
        const password = DOM.getValue('new-password');
        const confirmPassword = DOM.getValue('confirm-password');
        const agreement = DOM.get('security-agreement').checked;

        if (!accountName) {
            Toast.error('Please enter an account name');
            return;
        }

        if (password.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('Passwords do not match');
            return;
        }

        if (!agreement) {
            Toast.error('Please accept the security agreement');
            return;
        }

        // Temporär speichern
        this.tempAccountName = accountName;
        this.tempPassword = password;

        // Seed Phrase generieren
        try {
            const wallet = await CTCWallet.create();
            this.mnemonicWords = wallet.getMnemonic().split(' ');
            
            this.showSeedPhrase();
            
        } catch (error) {
            console.error('❌ Error generating seed phrase:', error);
            Toast.error('Failed to generate seed phrase');
        }
    }

    // Seed Phrase anzeigen
    showSeedPhrase() {
        const wordsHtml = this.mnemonicWords.map((word, index) => `
            <div class="seed-word" data-index="${index}">
                <span class="word-number">${index + 1}</span>
                <span class="word-text no-select">${word}</span>
            </div>
        `).join('');

        const content = `
            <div class="seed-phrase-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showCreateWallet()">
                        ← Back
                    </button>
                    <h2>Your Seed Phrase</h2>
                </div>

                <div class="create-steps">
                    <div class="step completed">
                        <div class="step-number">✓</div>
                        <span>Account Setup</span>
                    </div>
                    <div class="step active">
                        <div class="step-number">2</div>
                        <span>Seed Phrase</span>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <span>Verification</span>
                    </div>
                </div>

                <div class="seed-warning">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <h3>IMPORTANT: Write down your seed phrase</h3>
                        <p>This 12-word phrase is the ONLY way to recover your wallet. 
                           Store it safely offline. Never share it with anyone.</p>
                    </div>
                </div>

                <div class="seed-phrase-display secure-content">
                    <div class="seed-words">
                        ${wordsHtml}
                    </div>
                </div>

                <div class="seed-actions">
                    <button class="btn-secondary" onclick="welcomeScreen.copySeedPhrase()">
                        📋 Copy to Clipboard
                    </button>
                    <button class="btn-primary" onclick="welcomeScreen.showSeedVerification()">
                        I've Written It Down
                    </button>
                </div>

                <div class="seed-security-tips">
                    <h4>🔒 Security Best Practices</h4>
                    <ul>
                        <li>Write the words on paper in the correct order</li>
                        <li>Store the paper in a safe, secure location</li>
                        <li>Never store digitally (screenshots, notes, etc.)</li>
                        <li>Never share with anyone</li>
                        <li>Consider making multiple copies</li>
                    </ul>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
    }

    // Seed Phrase kopieren
    copySeedPhrase() {
        const seedPhrase = this.mnemonicWords.join(' ');
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(seedPhrase).then(() => {
                Toast.success('Seed phrase copied to clipboard');
                AppUtils.getInstance()?.triggerHaptic('light');
                
                // Warnung anzeigen
                setTimeout(() => {
                    Toast.warning('Remember to clear your clipboard after saving the seed phrase safely');
                }, 2000);
            }).catch(() => {
                this.fallbackCopyText(seedPhrase);
            });
        } else {
            this.fallbackCopyText(seedPhrase);
        }
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            Toast.success('Seed phrase copied');
        } catch (err) {
            Toast.error('Failed to copy seed phrase');
        }
        
        document.body.removeChild(textArea);
    }

    // Seed Phrase Verifikation
    showSeedVerification() {
        // 3 zufällige Wörter für Verifikation auswählen
        const indices = [];
        while (indices.length < 3) {
            const randomIndex = Math.floor(Math.random() * 12);
            if (!indices.includes(randomIndex)) {
                indices.push(randomIndex);
            }
        }
        indices.sort((a, b) => a - b);

        this.verificationWords = indices.map(index => ({
            index: index,
            word: this.mnemonicWords[index]
        }));

        const verificationHtml = this.verificationWords.map((item, i) => `
            <div class="verification-word">
                <label for="verify-word-${i}">Word #${item.index + 1}</label>
                <input 
                    type="text" 
                    id="verify-word-${i}" 
                    placeholder="Enter word ${item.index + 1}"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                >
            </div>
        `).join('');

        const content = `
            <div class="verification-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showSeedPhrase()">
                        ← Back
                    </button>
                    <h2>Verify Seed Phrase</h2>
                </div>

                <div class="create-steps">
                    <div class="step completed">
                        <div class="step-number">✓</div>
                        <span>Account Setup</span>
                    </div>
                    <div class="step completed">
                        <div class="step-number">✓</div>
                        <span>Seed Phrase</span>
                    </div>
                    <div class="step active">
                        <div class="step-number">3</div>
                        <span>Verification</span>
                    </div>
                </div>

                <div class="verification-info">
                    <p>To confirm you've saved your seed phrase correctly, 
                       please enter the following words:</p>
                </div>

                <div class="verification-form">
                    ${verificationHtml}
                    
                    <button class="btn-primary full-width" onclick="welcomeScreen.completeWalletCreation()">
                        <span id="create-text">Create Wallet</span>
                        <div id="create-loading" class="loading-spinner" style="display: none;"></div>
                    </button>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
        
        // Focus auf erstes Eingabefeld
        setTimeout(() => {
            DOM.get('verify-word-0')?.focus();
        }, 100);
    }

    // Wallet-Erstellung abschließen
    async completeWalletCreation() {
        if (this.isProcessing) return;

        // Verifikation prüfen
        let allCorrect = true;
        for (let i = 0; i < this.verificationWords.length; i++) {
            const input = DOM.getValue(`verify-word-${i}`).toLowerCase().trim();
            const expected = this.verificationWords[i].word.toLowerCase();
            
            if (input !== expected) {
                allCorrect = false;
                break;
            }
        }

        if (!allCorrect) {
            Toast.error('Verification failed. Please check the words and try again.');
            AppUtils.getInstance()?.triggerHaptic('error');
            return;
        }

        const btn = DOM.get('create-text').parentElement;
        const loadingDiv = DOM.get('create-loading');
        const textSpan = DOM.get('create-text');

        this.isProcessing = true;
        DOM.show(loadingDiv);
        textSpan.textContent = 'Creating...';
        btn.disabled = true;

        try {
            AppUtils.getInstance()?.triggerHaptic('light');
            
            // Wallet über App erstellen
            const app = AppUtils.getInstance();
            if (app) {
                await app.createNewWallet(this.tempAccountName, this.tempPassword);
                AppUtils.getInstance()?.triggerHaptic('success');
            } else {
                throw new Error('App not initialized');
            }

            // Temporäre Daten löschen
            this.tempAccountName = '';
            this.tempPassword = '';
            this.mnemonicWords = [];
            this.verificationWords = [];

        } catch (error) {
            console.error('❌ Error creating wallet:', error);
            
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Create Wallet';
            btn.disabled = false;
            this.isProcessing = false;
            
            Toast.error('Failed to create wallet. Please try again.');
            AppUtils.getInstance()?.triggerHaptic('error');
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

                <div class="restore-form">
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
                        <small>Separate words with spaces. Order matters.</small>
                        <div id="seed-validation" class="validation-message"></div>
                    </div>

                    <div class="form-group">
                        <label for="restore-account-name">Account Name</label>
                        <input 
                            type="text" 
                            id="restore-account-name" 
                            placeholder="Restored Wallet"
                            maxlength="30"
                            autocomplete="off"
                        >
                    </div>

                    <div class="form-group">
                        <label for="restore-password">New Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="restore-password" 
                                placeholder="Create a password for this device"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('restore-password')">
                                👁️
                            </button>
                        </div>
                        <small>This password will encrypt your wallet on this device</small>
                    </div>

                    <div class="form-group">
                        <label for="restore-confirm-password">Confirm Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="restore-confirm-password" 
                                placeholder="Confirm your password"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('restore-confirm-password')">
                                👁️
                            </button>
                        </div>
                    </div>

                    <button class="btn-primary full-width" onclick="welcomeScreen.completeWalletRestore()">
                        <span id="restore-text">Restore Wallet</span>
                        <div id="restore-loading" class="loading-spinner" style="display: none;"></div>
                    </button>
                </div>

                <div class="restore-security">
                    <h4>🔒 Restore Security</h4>
                    <ul>
                        <li>Your seed phrase will be validated before restoring</li>
                        <li>The password encrypts your wallet on this device only</li>
                        <li>Your original seed phrase remains unchanged</li>
                    </ul>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);

        // Seed-Validierung in Echtzeit
        this.setupSeedValidation();
    }

    // Wallet-Wiederherstellung abschließen
    async completeWalletRestore() {
        if (this.isProcessing) return;

        // Eingaben validieren
        const seedPhrase = DOM.getValue('restore-seed').trim().toLowerCase();
        const accountName = DOM.getValue('restore-account-name').trim() || 'Restored Wallet';
        const password = DOM.getValue('restore-password');
        const confirmPassword = DOM.getValue('restore-confirm-password');

        // Seed-Phrase validieren
        const words = seedPhrase.split(/\s+/);
        if (words.length !== 12) {
            Toast.error('Seed phrase must contain exactly 12 words');
            return;
        }

        // Prüfe jedes Wort gegen die Wortliste
        for (const word of words) {
            if (!CTC_WORD_LIST.includes(word)) {
                Toast.error(`Invalid word: "${word}"`);
                return;
            }
        }

        // Passwort validieren
        if (password.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            Toast.error('Passwords do not match');
            return;
        }

        const btn = DOM.get('restore-text').parentElement;
        const loadingDiv = DOM.get('restore-loading');
        const textSpan = DOM.get('restore-text');

        this.isProcessing = true;
        DOM.show(loadingDiv);
        textSpan.textContent = 'Restoring...';
        btn.disabled = true;

        try {
            AppUtils.getInstance()?.triggerHaptic('light');

            // Wallet über App wiederherstellen
            const app = AppUtils.getInstance();
            if (app) {
                await app.restoreWallet(seedPhrase, accountName, password);
                AppUtils.getInstance()?.triggerHaptic('success');
            } else {
                throw new Error('App not initialized');
            }

        } catch (error) {
            console.error('❌ Error restoring wallet:', error);
            
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Restore Wallet';
            btn.disabled = false;
            this.isProcessing = false;

            if (error.message.includes('Invalid word')) {
                Toast.error('Invalid seed phrase. Please check your words.');
            } else {
                Toast.error('Failed to restore wallet. Please try again.');
            }
            
            AppUtils.getInstance()?.triggerHaptic('error');
        }
    }

    // Passwort vergessen
    showForgotPassword(accountId) {
        const account = SecureWalletStorage.getAccountsList().find(acc => acc.id === accountId);
        
        const content = `
            <div class="forgot-password-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showLogin('${accountId}')">
                        ← Back
                    </button>
                    <h2>Forgot Password</h2>
                </div>

                <div class="forgot-info">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <h3>Password Cannot Be Recovered</h3>
                        <p>For security reasons, passwords cannot be reset or recovered. 
                           However, you can restore your wallet using your seed phrase.</p>
                    </div>
                </div>

                <div class="account-info">
                    <h4>Account: ${account?.name}</h4>
                    <p class="account-address">${account?.address}</p>
                </div>

                <div class="recovery-options">
                    <div class="option-card">
                        <h4>🔑 Restore with Seed Phrase</h4>
                        <p>If you have your 12-word seed phrase, you can restore your wallet with a new password.</p>
                        <button class="btn-primary" onclick="welcomeScreen.showSeedRecovery('${accountId}')">
                            Restore with Seed Phrase
                        </button>
                    </div>

                    <div class="option-card">
                        <h4>🗑️ Delete and Start Over</h4>
                        <p>If you don't have your seed phrase, you'll need to delete this wallet and create a new one.</p>
                        <button class="btn-danger" onclick="welcomeScreen.showDeleteAccount('${accountId}')">
                            Delete This Wallet
                        </button>
                    </div>
                </div>

                <div class="security-reminder">
                    <h4>📝 For Future Reference</h4>
                    <ul>
                        <li>Always keep your seed phrase in a safe place</li>
                        <li>Consider using a password manager</li>
                        <li>Make multiple backups of your seed phrase</li>
                    </ul>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
    }

    // Seed-Recovery für vergessenes Passwort
    showSeedRecovery(accountId) {
        const account = SecureWalletStorage.getAccountsList().find(acc => acc.id === accountId);
        
        const content = `
            <div class="seed-recovery-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showForgotPassword('${accountId}')">
                        ← Back
                    </button>
                    <h2>Recover with Seed Phrase</h2>
                </div>

                <div class="recovery-info">
                    <p>Enter your seed phrase to recover access to this wallet:</p>
                    <div class="account-preview">
                        <strong>${account?.name}</strong><br>
                        <span class="account-address">${account?.address}</span>
                    </div>
                </div>

                <div class="recovery-form">
                    <div class="form-group">
                        <label for="recovery-seed">Your 12-Word Seed Phrase</label>
                        <textarea 
                            id="recovery-seed" 
                            placeholder="Enter your seed phrase"
                            rows="4"
                            class="secure-input"
                            autocomplete="off"
                            autocorrect="off"
                            autocapitalize="off"
                            spellcheck="false"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="recovery-new-password">New Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="recovery-new-password" 
                                placeholder="Create a new password"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('recovery-new-password')">
                                👁️
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="recovery-confirm-password">Confirm New Password</label>
                        <div class="password-input-group">
                            <input 
                                type="password" 
                                id="recovery-confirm-password" 
                                placeholder="Confirm your new password"
                                class="secure-input"
                                autocomplete="new-password"
                            >
                            <button type="button" class="toggle-password" onclick="welcomeScreen.togglePassword('recovery-confirm-password')">
                                👁️
                            </button>
                        </div>
                    </div>

                    <button class="btn-primary full-width" onclick="welcomeScreen.completeRecovery('${accountId}')">
                        <span id="recovery-text">Recover Wallet</span>
                        <div id="recovery-loading" class="loading-spinner" style="display: none;"></div>
                    </button>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
    }

    // Recovery abschließen
    async completeRecovery(accountId) {
        if (this.isProcessing) return;

        const seedPhrase = DOM.getValue('recovery-seed').trim().toLowerCase();
        const newPassword = DOM.getValue('recovery-new-password');
        const confirmPassword = DOM.getValue('recovery-confirm-password');
        const account = SecureWalletStorage.getAccountsList().find(acc => acc.id === accountId);

        // Validierung
        if (!seedPhrase || seedPhrase.split(/\s+/).length !== 12) {
            Toast.error('Please enter a valid 12-word seed phrase');
            return;
        }

        if (newPassword.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.error('Passwords do not match');
            return;
        }

        const btn = DOM.get('recovery-text').parentElement;
        const loadingDiv = DOM.get('recovery-loading');
        const textSpan = DOM.get('recovery-text');

        this.isProcessing = true;
        DOM.show(loadingDiv);
        textSpan.textContent = 'Recovering...';
        btn.disabled = true;

        try {
            // Wallet aus Seed wiederherstellen
            const wallet = await CTCWallet.restore(seedPhrase);
            
            // Prüfe ob Adresse übereinstimmt
            if (wallet.getAddress() !== account.address) {
                throw new Error('Seed phrase does not match this wallet address');
            }

            // Altes Wallet löschen und neues speichern
            SecureWalletStorage.deleteWallet(accountId);
            await SecureWalletStorage.saveWallet(wallet, newPassword, account.name);

            Toast.success('Wallet recovered successfully with new password');
            
            // Zum Login weiterleiten
            setTimeout(() => {
                this.showLogin(accountId);
            }, 1000);

        } catch (error) {
            console.error('❌ Error during recovery:', error);
            
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Recover Wallet';
            btn.disabled = false;
            this.isProcessing = false;

            if (error.message.includes('does not match')) {
                Toast.error('This seed phrase does not match the wallet address');
            } else {
                Toast.error('Recovery failed. Please check your seed phrase.');
            }
        }
    }

    // Account löschen
    showDeleteAccount(accountId) {
        const account = SecureWalletStorage.getAccountsList().find(acc => acc.id === accountId);
        
        const content = `
            <div class="delete-account-container">
                <div class="header">
                    <button class="back-btn" onclick="welcomeScreen.showLogin('${accountId}')">
                        ← Back
                    </button>
                    <h2>Delete Wallet</h2>
                </div>

                <div class="delete-warning">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <h3>This action cannot be undone!</h3>
                        <p>You are about to permanently delete this wallet from this device. 
                           Make sure you have your seed phrase backed up safely.</p>
                    </div>
                </div>

                <div class="account-details">
                    <h4>Wallet to Delete:</h4>
                    <div class="account-card">
                        <div class="account-name">${account?.name}</div>
                        <div class="account-address">${account?.address}</div>
                        <div class="account-created">
                            Created: ${new Date(account?.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div class="confirmation-form">
                    <div class="form-group">
                        <label class="checkbox-label danger">
                            <input type="checkbox" id="confirm-backup">
                            <span class="checkmark"></span>
                            I have safely backed up my seed phrase
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label danger">
                            <input type="checkbox" id="confirm-delete">
                            <span class="checkmark"></span>
                            I understand this wallet will be permanently deleted from this device
                        </label>
                    </div>

                    <div class="form-group">
                        <label for="delete-confirmation">Type "DELETE" to confirm</label>
                        <input 
                            type="text" 
                            id="delete-confirmation" 
                            placeholder="Type DELETE"
                            autocomplete="off"
                        >
                    </div>

                    <button class="btn-danger full-width" onclick="welcomeScreen.confirmDeleteAccount('${accountId}')">
                        Delete Wallet Permanently
                    </button>
                </div>
            </div>
        `;

        DOM.setContent('app-container', content);
    }

    // Account-Löschung bestätigen
    confirmDeleteAccount(accountId) {
        const confirmBackup = DOM.get('confirm-backup').checked;
        const confirmDelete = DOM.get('confirm-delete').checked;
        const deleteText = DOM.getValue('delete-confirmation');

        if (!confirmBackup) {
            Toast.error('Please confirm you have backed up your seed phrase');
            return;
        }

        if (!confirmDelete) {
            Toast.error('Please confirm you understand the consequences');
            return;
        }

        if (deleteText !== 'DELETE') {
            Toast.error('Please type "DELETE" to confirm');
            return;
        }

        // Letzte Bestätigung
        if (confirm('Are you absolutely sure you want to delete this wallet? This cannot be undone!')) {
            const success = SecureWalletStorage.deleteWallet(accountId);
            
            if (success) {
                Toast.success('Wallet deleted successfully');
                
                // Zurück zur Hauptseite
                setTimeout(() => {
                    this.showWelcome();
                }, 1000);
            } else {
                Toast.error('Failed to delete wallet');
            }
        }
    }

    // Hilfsfunktionen
    togglePassword(inputId) {
        const input = DOM.get(inputId);
        const button = input.nextElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    setupPasswordStrengthIndicator() {
        const passwordInput = DOM.get('new-password');
        const strengthDiv = DOM.get('password-strength');
        
        if (!passwordInput || !strengthDiv) return;

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = this.calculatePasswordStrength(password);
            
            strengthDiv.innerHTML = `
                <div class="strength-bar">
                    <div class="strength-fill strength-${strength.level}" style="width: ${strength.percentage}%"></div>
                </div>
                <span class="strength-text">${strength.text}</span>
            `;
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 20;
        else feedback.push('At least 8 characters');
        
        if (password.length >= 12) score += 10;
        
        if (/[a-z]/.test(password)) score += 15;
        else feedback.push('Lowercase letters');
        
        if (/[A-Z]/.test(password)) score += 15;
        else feedback.push('Uppercase letters');
        
        if (/[0-9]/.test(password)) score += 15;
        else feedback.push('Numbers');
        
        if (/[^A-Za-z0-9]/.test(password)) score += 25;
        else feedback.push('Special characters');

        let level, text;
        if (score < 30) {
            level = 'weak';
            text = 'Weak - ' + feedback.slice(0, 2).join(', ');
        } else if (score < 60) {
            level = 'medium';
            text = 'Medium - Add ' + feedback.slice(0, 1).join(', ');
        } else if (score < 80) {
            level = 'good';
            text = 'Good';
        } else {
            level = 'strong';
            text = 'Strong';
        }

        return {
            percentage: Math.min(score, 100),
            level: level,
            text: text
        };
    }

    setupSeedValidation() {
        const seedInput = DOM.get('restore-seed');
        const validationDiv = DOM.get('seed-validation');
        
        if (!seedInput || !validationDiv) return;

        seedInput.addEventListener('input', () => {
            const seedPhrase = seedInput.value.trim().toLowerCase();
            const words = seedPhrase.split(/\s+/);
            
            if (seedPhrase === '') {
                validationDiv.innerHTML = '';
                return;
            }

            let validWords = 0;
            let invalidWords = [];
            
            for (const word of words) {
                if (word && CTC_WORD_LIST.includes(word)) {
                    validWords++;
                } else if (word) {
                    invalidWords.push(word);
                }
            }

            if (words.length === 12 && validWords === 12) {
                validationDiv.innerHTML = '<span class="validation-success">✓ Valid seed phrase</span>';
            } else if (invalidWords.length > 0) {
                validationDiv.innerHTML = `<span class="validation-error">Invalid words: ${invalidWords.slice(0, 3).join(', ')}</span>`;
            } else {
                validationDiv.innerHTML = `<span class="validation-info">${validWords}/12 valid words</span>`;
            }
        });
    }

    getLockMessage(accountId) {
        const key = `failed-attempts-${accountId}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}');
        
        if (attempts.count >= SecureWalletStorage.MAX_FAILED_ATTEMPTS) {
            const timeRemaining = SecureWalletStorage.LOCKOUT_TIME - (Date.now() - attempts.lastAttempt);
            const minutesRemaining = Math.ceil(timeRemaining / 60000);
            return `Account locked for ${minutesRemaining} minutes due to failed login attempts.`;
        }
        
        return '';
    }

    // Prüfe existierende Wallets
    checkExistingWallet() {
        return SecureWalletStorage.hasWallet();
    }
}

// Globale Instanz
const welcomeScreen = new WelcomeScreen();

// Export für globale Verwendung
window.welcomeScreen = welcomeScreen;