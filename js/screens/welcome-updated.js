// js/screens/welcome-updated.js - Fixed Welcome Screen with Account System Support

class WelcomeScreen {
    constructor() {
        this.currentWallet = null;
        this.generatedSeed = [];
        this.confirmWords = [];
        this.wordsToConfirm = [];
        this.confirmStepIndex = 0;
        this.termsAccepted = false;
    }

    // Check for existing wallet/account system on initialization
    checkExistingWallet() {
        try {
            // First check for new account system
            const accountData = Storage.get('ctc-accounts');
            if (accountData && accountData.accounts && accountData.accounts.length > 0) {
                console.log('Existing account system found');
                this.showAccountLogin();
                return true;
            }
            
            // Check for legacy wallet data
            const savedWallet = Storage.get('ctc-wallet');
            if (savedWallet) {
                if (savedWallet.setupComplete || savedWallet.imported) {
                    console.log('Legacy wallet found, migrating to account system');
                    this.showWalletMigration(savedWallet);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking existing wallet:', error);
            // Clean up corrupted data
            Storage.remove('ctc-wallet');
            Storage.remove('ctc-accounts');
            return false;
        }
    }

    // Show wallet migration screen for legacy users
    showWalletMigration(legacyWallet) {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon" style="background: #6B9EFF;">🔄</div>
                    <h2 class="screen-title">Wallet Update</h2>
                    <p class="screen-subtitle">We're upgrading your wallet to support multiple accounts</p>
                </div>
                
                <div class="card" style="margin: 40px 0;">
                    <h3 class="card-header">What's New</h3>
                    <ul style="color: rgba(255,255,255,0.8); margin-left: 20px; line-height: 1.6;">
                        <li>Create multiple accounts with unique addresses</li>
                        <li>Organize your funds better</li>
                        <li>Same recovery phrase protects all accounts</li>
                        <li>Your existing wallet will become "Account 1"</li>
                    </ul>
                </div>
                
                <button onclick="welcomeScreen.migrateLegacyWallet()" class="btn btn-primary">
                    <div class="loading" id="migrate-loading" style="display: none;"></div>
                    <span id="migrate-text">Upgrade Wallet</span>
                </button>
                
                <button onclick="welcomeScreen.showLogin()" class="btn btn-secondary" style="margin-top: 16px;">
                    Skip for Now
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Migrate legacy wallet to account system
    async migrateLegacyWallet() {
        const btn = document.querySelector('.btn-primary');
        const loadingDiv = DOM.get('migrate-loading');
        const textSpan = DOM.get('migrate-text');
        
        DOM.show(loadingDiv);
        textSpan.textContent = 'Migrating...';
        btn.disabled = true;
        
        try {
            const legacyWallet = Storage.get('ctc-wallet');
            if (!legacyWallet || !legacyWallet.mnemonic) {
                throw new Error('Legacy wallet data not found');
            }
            
            // Restore the legacy wallet
            const wallet = await CTCWallet.restore(legacyWallet.mnemonic);
            
            // Initialize account system with the legacy wallet
            await accountManager.createAccountSystem(legacyWallet.mnemonic);
            
            // Update the first account name to indicate it's the original
            accountManager.updateAccountName(0, 'Main Account');
            
            // Clear legacy data
            Storage.remove('ctc-wallet');
            
            setTimeout(() => {
                Toast.success('Wallet upgraded successfully!');
                walletScreen.initialize(wallet, true);
            }, 1500);
            
        } catch (error) {
            console.error('Migration failed:', error);
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Upgrade Wallet';
            btn.disabled = false;
            Toast.error('Migration failed: ' + error.message);
        }
    }

    // Show account system login
    showAccountLogin() {
        const accountData = Storage.get('ctc-accounts');
        const accountCount = accountData?.accounts?.length || 0;
        
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon">🔐</div>
                    <h1 class="screen-title">Welcome Back</h1>
                    <p class="screen-subtitle">Enter your password to unlock your CTC wallet</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 12px;">
                        ${accountCount} account${accountCount !== 1 ? 's' : ''} found
                    </p>
                </div>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="login-password" placeholder="Enter Password" oninput="welcomeScreen.validateLoginPassword()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('login-password')">👁️</button>
                    </div>
                </div>

                <button class="btn btn-primary" id="unlock-btn" onclick="welcomeScreen.unlockAccountSystem()" disabled>
                    <div class="loading" id="unlock-loading" style="display: none;"></div>
                    <span id="unlock-text">Unlock Wallet</span>
                </button>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.showRecoveryOptions()" style="margin-top: 20px;">
                    Recover Wallet
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show recovery options
    showRecoveryOptions() {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon" style="background: #ff9800;">🔧</div>
                    <h2 class="screen-title">Wallet Recovery</h2>
                    <p class="screen-subtitle">Choose how you want to recover your wallet</p>
                </div>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.showImport()" style="margin-bottom: 16px;">
                    🔑 Import from Recovery Phrase
                </button>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.resetAndCreateNew()" style="margin-bottom: 16px;">
                    ✨ Create New Wallet
                </button>
                
                <button class="btn btn-ghost" onclick="welcomeScreen.showAccountLogin()" style="margin-top: 20px;">
                    ← Back to Login
                </button>
                
                <div class="card" style="margin-top: 30px;">
                    <h3 class="card-header" style="color: #ff6b6b;">⚠️ Warning</h3>
                    <p style="color: rgba(255,255,255,0.8); margin: 0; line-height: 1.6;">
                        Creating a new wallet will permanently delete your current accounts. 
                        Make sure you have your recovery phrase backed up before proceeding.
                    </p>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Reset and create new wallet
    resetAndCreateNew() {
        if (confirm('⚠️ This will permanently delete ALL existing accounts and data.\n\nAre you absolutely sure you want to create a new wallet?')) {
            if (confirm('Final warning: ALL account data will be lost forever. Continue?')) {
                // Clear all data
                Storage.remove('ctc-accounts');
                Storage.remove('ctc-wallet');
                
                // Show welcome screen for new wallet creation
                this.showWelcome();
            }
        }
    }

    // Unlock account system
    async unlockAccountSystem() {
        const password = DOM.getValue('login-password');
        const btn = DOM.get('unlock-btn');
        const loadingDiv = DOM.get('unlock-loading');
        const textSpan = DOM.get('unlock-text');
        
        if (password.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }
        
        DOM.show(loadingDiv);
        textSpan.textContent = 'Unlocking...';
        btn.disabled = true;
        
        try {
            // Initialize account manager
            await accountManager.initialize();
            
            if (accountManager.getAllAccounts().length === 0) {
                throw new Error('No accounts found');
            }
            
            // Get current account wallet
            const wallet = await accountManager.getCurrentAccountWallet();
            
            if (!wallet) {
                throw new Error('Failed to restore wallet');
            }
            
            setTimeout(() => {
                walletScreen.initialize(wallet, true);
            }, 1000);
            
        } catch (error) {
            console.error('Error unlocking account system:', error);
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Unlock Wallet';
            btn.disabled = false;
            Toast.error('Failed to unlock wallet: ' + error.message);
        }
    }

    // Show welcome screen
    showWelcome() {
        const content = `
            <div class="screen active" id="welcome-screen">
                <div class="illustration">
                    <div class="icon">💼</div>
                    <h1 class="screen-title">CTC Wallet</h1>
                    <p class="screen-subtitle">Your gateway to the CTC blockchain with multi-account support</p>
                </div>
                
                <div class="card" style="margin: 40px 0;">
                    <h3 class="card-header">✨ What's New</h3>
                    <ul style="color: rgba(255,255,255,0.8); margin-left: 20px; line-height: 1.6;">
                        <li>Create multiple accounts with unique CTC addresses</li>
                        <li>Organize your funds across different purposes</li>
                        <li>Custom icons for easy account identification</li>
                        <li>One recovery phrase protects all accounts</li>
                    </ul>
                </div>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.showImport()">
                    Import Using Seed Phrase
                </button>
                <button class="btn btn-primary" onclick="welcomeScreen.showOnboarding()">
                    Create a New Wallet
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show login screen for existing wallet (legacy compatibility)
    showLogin() {
        const content = `
            <div class="screen active">
                <div class="illustration">
                    <div class="icon">🔐</div>
                    <h1 class="screen-title">Welcome Back</h1>
                    <p class="screen-subtitle">Enter your password to unlock your CTC wallet</p>
                </div>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="login-password" placeholder="Enter Password" oninput="welcomeScreen.validateLoginPassword()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('login-password')">👁️</button>
                    </div>
                </div>

                <button class="btn btn-primary" id="unlock-btn" onclick="welcomeScreen.unlockWallet()" disabled>
                    <div class="loading" id="unlock-loading" style="display: none;"></div>
                    <span id="unlock-text">Unlock Wallet</span>
                </button>
                
                <button class="btn btn-secondary" onclick="welcomeScreen.resetWallet()" style="margin-top: 20px;">
                    Create New Wallet
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show onboarding screens
    showOnboarding() {
        const content = `
            <div class="screen active" id="onboarding1">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step"></div>
                        <div class="progress-step"></div>
                    </div>
                </div>
                <div class="illustration">
                    <div class="icon">👥</div>
                    <h2 class="screen-title">Multiple<br>Accounts</h2>
                    <p class="screen-subtitle">Create separate accounts for different purposes - trading, savings, business, and more.</p>
                </div>
                <button class="btn btn-primary" onclick="welcomeScreen.showOnboarding2()">Continue</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    showOnboarding2() {
        const content = `
            <div class="screen active" id="onboarding2">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showOnboarding()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step"></div>
                    </div>
                </div>
                <div class="illustration">
                    <div class="icon">🔒</div>
                    <h2 class="screen-title">Secure &<br>Private</h2>
                    <p class="screen-subtitle">Your keys, your crypto. One recovery phrase protects all your accounts with military-grade encryption.</p>
                </div>
                <button class="btn btn-primary" onclick="welcomeScreen.showOnboarding3()">Continue</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    showOnboarding3() {
        const content = `
            <div class="screen active" id="onboarding3">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showOnboarding2()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                    </div>
                </div>
                <div class="illustration">
                    <div class="icon">🚀</div>
                    <h2 class="screen-title">Fast &<br>Efficient</h2>
                    <p class="screen-subtitle">Lightning-fast transactions with low fees. Send and receive CTC across all your accounts instantly.</p>
                </div>
                <button class="btn btn-primary" onclick="welcomeScreen.showCreatePassword()">Get Started</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show create password screen
    showCreatePassword() {
        const content = `
            <div class="screen active" id="create-password">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showOnboarding3()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step"></div>
                        <div class="progress-step"></div>
                    </div>
                </div>
                <h2 class="screen-title">Create Password</h2>
                <p class="screen-subtitle">This password will unlock your wallet only on this device</p>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="password1" placeholder="New Password" oninput="welcomeScreen.checkPasswordStrength()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('password1')">👁️</button>
                    </div>
                    <div id="password-strength" class="password-strength" style="display: none;"></div>
                </div>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="password2" placeholder="Confirm Password" oninput="welcomeScreen.validatePassword()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('password2')">👁️</button>
                    </div>
                    <div style="margin-top: 8px; color: #888; font-size: 14px;">Must be at least 8 characters</div>
                </div>

                <div class="checkbox-group">
                    <div class="checkbox" id="terms-checkbox" onclick="welcomeScreen.toggleTerms()"></div>
                    <span style="font-size: 14px;">I understand that CTC cannot recover this password for me.</span>
                </div>

                <button class="btn btn-primary" id="create-password-btn" onclick="welcomeScreen.createPassword()" disabled>
                    Create Password
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show secure wallet screen
    showSecureWallet() {
        const content = `
            <div class="screen active" id="secure-wallet">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showCreatePassword()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step"></div>
                    </div>
                </div>
                <h2 class="screen-title">Secure Your Wallet</h2>
                <p class="screen-subtitle">Write down your recovery phrase and store it safely</p>
                
                <div style="margin: 40px 0;">
                    <div class="card">
                        <h3 class="card-header">🔒 Master Recovery Phrase</h3>
                        <p style="color: #ccc; margin-bottom: 16px;">This phrase will protect ALL your accounts. Write it down and store it in a safe place.</p>
                        
                        <div style="height: 4px; background: #333; border-radius: 2px; margin-bottom: 20px;">
                            <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A, #CDDC39); border-radius: 2px;"></div>
                        </div>

                        <h4 style="margin-bottom: 12px; color: #ff9800;">⚠️ Important:</h4>
                        <ul style="color: #888; margin-left: 20px; line-height: 1.6;">
                            <li>Never share your recovery phrase</li>
                            <li>This phrase recovers ALL your accounts</li>
                            <li>Store it offline and secure</li>
                            <li>CTC cannot recover your wallet if you lose it</li>
                        </ul>
                    </div>
                </div>

                <button class="btn btn-primary" onclick="welcomeScreen.showWriteSeed()">Continue</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show write seed screen
    showWriteSeed() {
        const content = `
            <div class="screen active" id="write-seed">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showSecureWallet()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                    </div>
                </div>
                <h2 class="screen-title">Your Recovery Phrase</h2>
                <p class="screen-subtitle">Write down these 12 words in the exact order shown. You'll need them to verify in the next step.</p>
                
                <div class="seed-display">
                    <p style="margin-bottom: 16px;">Tap to reveal your recovery phrase</p>
                    <p style="color: #888; font-size: 14px;">Make sure no one is watching your screen.</p>
                    <button class="btn btn-secondary" id="reveal-btn" onclick="welcomeScreen.revealSeed()" style="margin-top: 20px; max-width: 200px;">
                        👁️ View
                    </button>
                    <div class="seed-words" id="seed-words" style="display: none;"></div>
                </div>

                <button class="btn btn-primary" id="next-seed-btn" onclick="welcomeScreen.showConfirmSeed()" disabled>Next</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show confirm seed screen
    showConfirmSeed() {
        this.initializeConfirmation();
        
        const content = `
            <div class="screen active" id="confirm-seed">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showWriteSeed()">‹</button>
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                    </div>
                </div>
                <h2 class="screen-title">Verify Recovery Phrase</h2>
                <p class="screen-subtitle">Select each word in the order it was presented to you</p>
                
                <div style="margin: 30px 0;">
                    <h3 id="confirm-word-title">Select word #1</h3>
                    <div class="word-grid" id="word-options">
                        <!-- Options will be generated dynamically -->
                    </div>
                </div>

                <button class="btn btn-primary" id="confirm-next-btn" onclick="welcomeScreen.nextConfirmWord()" disabled>Next</button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        this.updateConfirmationStep();
    }

    // Show success screen
    showSuccess() {
        const content = `
            <div class="screen active" id="success-screen">
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                        <div class="progress-step active"></div>
                    </div>
                </div>
                <div class="illustration">
                    <div class="icon" style="background: #4CAF50;">✓</div>
                    <h2 class="screen-title">Wallet Created!</h2>
                    <p class="screen-subtitle">Your CTC wallet with multi-account support has been successfully created and secured.</p>
                    <p style="color: #888; text-align: center; margin-top: 20px;">
                        You can now create multiple accounts for different purposes. Your recovery phrase protects them all!
                    </p>
                </div>
                <button class="btn btn-primary" onclick="welcomeScreen.finishWalletCreation()">
                    <div class="loading" id="finish-loading" style="display: none;"></div>
                    <span id="finish-text">Access Wallet</span>
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Show import screen
    showImport() {
        const content = `
            <div class="screen active" id="import-screen">
                <div class="progress-container">
                    <button class="back-btn" onclick="welcomeScreen.showWelcome()">‹</button>
                </div>
                <h2 class="screen-title">Import Wallet</h2>
                <p class="screen-subtitle">Enter your 12-word recovery phrase to restore your wallet and all accounts</p>
                
                <div class="input-group">
                    <textarea class="input-field" id="import-seed" placeholder="Enter your 12-word recovery phrase..." rows="4" style="resize: none;" oninput="welcomeScreen.validateImportSeed()"></textarea>
                    <div class="input-help">Separate words with spaces</div>
                </div>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="import-password1" placeholder="New Password" oninput="welcomeScreen.validateImportForm()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('import-password1')">👁️</button>
                    </div>
                    <div class="input-help">Must be at least 8 characters</div>
                </div>
                
                <div class="input-group">
                    <div class="password-input">
                        <input type="password" class="input-field" id="import-password2" placeholder="Confirm Password" oninput="welcomeScreen.validateImportForm()">
                        <button class="toggle-password" type="button" onclick="welcomeScreen.togglePassword('import-password2')">👁️</button>
                    </div>
                </div>

                <button class="btn btn-primary" id="import-btn" onclick="welcomeScreen.importWallet()" disabled>
                    <div class="loading" id="import-loading" style="display: none;"></div>
                    <span id="import-text">Import Wallet</span>
                </button>
            </div>
        `;
        
        DOM.setContent('app-container', content);
    }

    // Utility methods
    togglePassword(inputId) {
        const input = DOM.get(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    checkPasswordStrength() {
        const password = DOM.getValue('password1');
        const strengthDiv = DOM.get('password-strength');
        
        if (!password) {
            DOM.hide(strengthDiv);
            return;
        }
        
        const strength = Validation.passwordStrength(password);
        DOM.show(strengthDiv);
        strengthDiv.className = `password-strength ${strength.color}`;
        strengthDiv.textContent = `Password strength: ${strength.text}`;
        
        this.validatePassword();
    }

    validatePassword() {
        const password1 = DOM.getValue('password1');
        const password2 = DOM.getValue('password2');
        const btn = DOM.get('create-password-btn');
        
        const hasMinLength = password1.length >= 8;
        const passwordsMatch = password1 === password2 && password2.length > 0;
        const isValid = hasMinLength && passwordsMatch && this.termsAccepted;
        
        if (btn) btn.disabled = !isValid;
    }

    toggleTerms() {
        const checkbox = DOM.get('terms-checkbox');
        this.termsAccepted = !this.termsAccepted;
        
        if (this.termsAccepted) {
            DOM.addClass(checkbox, 'checked');
            checkbox.innerHTML = '✓';
        } else {
            DOM.removeClass(checkbox, 'checked');
            checkbox.innerHTML = '';
        }
        this.validatePassword();
    }

    async createPassword() {
        const password1 = DOM.getValue('password1');
        const password2 = DOM.getValue('password2');
        
        if (password1.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }
        
        if (password1 !== password2) {
            Toast.error('Passwords do not match');
            return;
        }
        
        if (!this.termsAccepted) {
            Toast.error('Please accept the terms and conditions');
            return;
        }
        
        const btn = DOM.get('create-password-btn');
        btn.innerHTML = '<div class="loading"></div>';
        btn.disabled = true;
        
        try {
            console.log('Starting wallet creation...');
            this.currentWallet = await CTCWallet.create();
            console.log('Wallet created successfully:', this.currentWallet);
            
            this.generatedSeed = this.currentWallet.mnemonic.split(' ');
            
            setTimeout(() => {
                btn.innerHTML = 'Create Password';
                this.showSecureWallet();
            }, 1000);
            
        } catch (error) {
            console.error('Error creating wallet:', error);
            btn.innerHTML = 'Create Password';
            btn.disabled = false;
            Toast.error('Error: ' + error.message);
        }
    }

    revealSeed() {
        if (!this.generatedSeed.length) {
            Toast.error('No seed phrase generated');
            return;
        }
        
        const seedWordsContainer = DOM.get('seed-words');
        const revealBtn = DOM.get('reveal-btn');
        const nextBtn = DOM.get('next-seed-btn');
        
        DOM.clear(seedWordsContainer);
        this.generatedSeed.forEach((word, index) => {
            const wordElement = DOM.create('div', {
                className: 'seed-word'
            }, `${index + 1}. ${word}`);
            seedWordsContainer.appendChild(wordElement);
        });
        
        DOM.show(seedWordsContainer);
        DOM.hide(revealBtn);
        if (nextBtn) nextBtn.disabled = false;
    }

    initializeConfirmation() {
        this.wordsToConfirm = [];
        const usedIndices = new Set();
        
        while (this.wordsToConfirm.length < 3) {
            const randomIndex = Math.floor(Math.random() * 12);
            if (!usedIndices.has(randomIndex)) {
                this.wordsToConfirm.push(randomIndex);
                usedIndices.add(randomIndex);
            }
        }
        
        this.wordsToConfirm.sort((a, b) => a - b);
        this.confirmStepIndex = 0;
        this.confirmWords = [];
    }

    updateConfirmationStep() {
        if (this.confirmStepIndex >= this.wordsToConfirm.length) {
            this.showSuccess();
            return;
        }
        
        const currentConfirmIndex = this.wordsToConfirm[this.confirmStepIndex];
        const wordTitle = DOM.get('confirm-word-title');
        
        if (wordTitle) {
            wordTitle.textContent = `Select word #${currentConfirmIndex + 1}`;
        }
        
        this.generateConfirmOptions();
        const nextBtn = DOM.get('confirm-next-btn');
        if (nextBtn) nextBtn.disabled = true;
    }

    generateConfirmOptions() {
        const wordOptions = DOM.get('word-options');
        if (!wordOptions) return;
        
        const currentConfirmIndex = this.wordsToConfirm[this.confirmStepIndex];
        const currentWord = this.generatedSeed[currentConfirmIndex];
        
        const options = [currentWord];
        
        while (options.length < 6) {
            const randomWord = CTC_WORD_LIST[Math.floor(Math.random() * CTC_WORD_LIST.length)];
            if (!options.includes(randomWord)) {
                options.push(randomWord);
            }
        }
        
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        DOM.clear(wordOptions);
        options.forEach(word => {
            const wordElement = DOM.create('div', {
                className: 'word-item'
            }, word);
            wordElement.onclick = () => this.selectWord(wordElement, word);
            wordOptions.appendChild(wordElement);
        });
    }

    selectWord(element, word) {
        const currentConfirmIndex = this.wordsToConfirm[this.confirmStepIndex];
        const expectedWord = this.generatedSeed[currentConfirmIndex];
        
        if (word === expectedWord) {
            DOM.addClass(element, 'selected');
            this.confirmWords.push(word);
            
            document.querySelectorAll('.word-item').forEach(item => {
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.5';
            });
            element.style.opacity = '1';
            
            const nextBtn = DOM.get('confirm-next-btn');
            if (nextBtn) nextBtn.disabled = false;
        } else {
            Animation.shake(element);
            Toast.error('Wrong word selected. Try again.');
        }
    }

    nextConfirmWord() {
        this.confirmStepIndex++;
        this.updateConfirmationStep();
    }

    // Updated finish wallet creation for account system
    async finishWalletCreation() {
        const finishBtn = document.querySelector('#success-screen .btn-primary');
        const loadingDiv = DOM.get('finish-loading');
        const textSpan = DOM.get('finish-text');
        
        DOM.show(loadingDiv);
        textSpan.textContent = 'Setting up account system...';
        finishBtn.disabled = true;
        
        try {
            if (!this.currentWallet) {
                throw new Error('Wallet not initialized');
            }
            
            // Initialize account system with the new wallet
            await accountManager.createAccountSystem(this.currentWallet.mnemonic);
            
            // Clear legacy wallet data if it exists
            Storage.remove('ctc-wallet');
            
            await Utils.sleep(2000);
            
            // Load main wallet screen with account system
            walletScreen.initialize(this.currentWallet, true);
            
        } catch (error) {
            console.error('Error finishing wallet creation:', error);
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Access Wallet';
            finishBtn.disabled = false;
            Toast.error('Error setting up wallet. Please try again.');
        }
    }

    // Updated import wallet for account system
    async importWallet() {
        const seedPhrase = DOM.getValue('import-seed').trim();
        const password1 = DOM.getValue('import-password1');
        const password2 = DOM.getValue('import-password2');
        
        if (!seedPhrase) {
            Toast.error('Please enter your seed phrase');
            return;
        }
        
        if (password1.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }
        
        if (password1 !== password2) {
            Toast.error('Passwords do not match');
            return;
        }
        
        const btn = DOM.get('import-btn');
        const loadingDiv = DOM.get('import-loading');
        const textSpan = DOM.get('import-text');
        
        DOM.show(loadingDiv);
        textSpan.textContent = 'Importing...';
        btn.disabled = true;
        
        try {
            this.currentWallet = await CTCWallet.restore(seedPhrase);
            
            // Initialize account system with imported wallet
            await accountManager.createAccountSystem(this.currentWallet.mnemonic);
            
            // Update first account name to indicate it's imported
            accountManager.updateAccountName(0, 'Imported Account');
            
            // Clear legacy wallet data if it exists
            Storage.remove('ctc-wallet');
            
            setTimeout(() => {
                walletScreen.initialize(this.currentWallet, true);
            }, 1500);
            
        } catch (error) {
            console.error('Error importing wallet:', error);
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Import Wallet';
            btn.disabled = false;
            Toast.error('Invalid seed phrase or import failed');
        }
    }

    // Updated unlock wallet for legacy compatibility
    async unlockWallet() {
        const password = DOM.getValue('login-password');
        const btn = DOM.get('unlock-btn');
        const loadingDiv = DOM.get('unlock-loading');
        const textSpan = DOM.get('unlock-text');
        
        if (password.length < 8) {
            Toast.error('Password must be at least 8 characters');
            return;
        }
        
        DOM.show(loadingDiv);
        textSpan.textContent = 'Unlocking...';
        btn.disabled = true;
        
        try {
            const savedWallet = Storage.get('ctc-wallet');
            if (!savedWallet) {
                throw new Error('No wallet found');
            }
            
            // Restore wallet from saved mnemonic
            this.currentWallet = await CTCWallet.restore(savedWallet.mnemonic);
            
            // Verify the wallet matches saved data
            if (this.currentWallet.address !== savedWallet.address) {
                throw new Error('Wallet verification failed');
            }
            
            setTimeout(() => {
                // Initialize without account system for legacy mode
                walletScreen.initialize(this.currentWallet, false);
            }, 1000);
            
        } catch (error) {
            console.error('Error unlocking wallet:', error);
            DOM.hide(loadingDiv);
            textSpan.textContent = 'Unlock Wallet';
            btn.disabled = false;
            Toast.error('Invalid password or wallet error');
        }
    }

    // Reset wallet with account system consideration
    resetWallet() {
        if (confirm('Are you sure you want to create a new wallet? This will permanently delete your current wallet data!')) {
            // Clear both legacy and account system data
            Storage.remove('ctc-wallet');
            Storage.remove('ctc-accounts');
            if (window.accountManager) {
                accountManager.clearAllData();
            }
            location.reload();
        }
    }

    validateLoginPassword() {
        const password = DOM.getValue('login-password');
        const btn = DOM.get('unlock-btn');
        if (btn) btn.disabled = password.length < 8;
    }

    validateImportSeed() {
        const seedPhrase = DOM.getValue('import-seed').trim();
        const validation = Validation.mnemonic(seedPhrase);
        
        this.validateImportForm();
        return validation.valid;
    }

    validateImportForm() {
        const seedPhrase = DOM.getValue('import-seed').trim();
        const password1 = DOM.getValue('import-password1');
        const password2 = DOM.getValue('import-password2');
        const btn = DOM.get('import-btn');
        
        const seedValid = this.validateImportSeed();
        const passwordValid = password1.length >= 8 && password1 === password2;
        
        if (btn) btn.disabled = !(seedValid && passwordValid);
    }
}

// Create global welcome screen instance
const welcomeScreen = new WelcomeScreen();

// Export to global scope
window.welcomeScreen = welcomeScreen;

console.log('👋 Welcome Screen loaded');
