// js/screens/staking.js - CTC Wallet Staking & Unstaking Screen

class StakingScreen {
    constructor() {
        this.currentWallet = null;
        this.availableBalance = 0;
        this.stakedBalance = 0;
        this.selectedValidatorPubKey = '';
        this.currentStep = 'overview'; // overview, stake, unstake, confirm
        this.transactionData = null;
        this.utxos = [];
        this.feePerByte = 1000; // Default fee
    }

    // Initialize with current wallet
    async initialize(wallet) {
        this.currentWallet = wallet;
        await this.loadBalances();
        await this.loadFeeEstimate();
    }

    // Load current balances
    async loadBalances() {
        if (!this.currentWallet) return;

        try {
            // Load available balance
            const balanceResponse = await API.getBalance(this.currentWallet.address);
            this.availableBalance = parseInt(balanceResponse) || 0;

            // Load staked balance
            const stakedResponse = await API.getStakedBalance(this.currentWallet.address);
            this.stakedBalance = parseInt(stakedResponse) || 0;

            // Load UTXOs for transaction building
            this.utxos = await API.getUTXOs(this.currentWallet.address) || [];

        } catch (error) {
            console.error('Failed to load balances:', error);
            Toast.error('Failed to load balances');
        }
    }

    // Load current fee estimate
    async loadFeeEstimate() {
        try {
            const feeData = await API.getFeeEstimate();
            this.feePerByte = feeData.feePerByte || 1000;
        } catch (error) {
            console.error('Failed to load fee estimate:', error);
        }
    }

    // Show main staking screen
    async show() {
        if (!this.currentWallet) {
            Toast.error('No wallet loaded');
            return;
        }

        await this.loadBalances();
        this.currentStep = 'overview';
        this.render();
    }

    // Main render function
    render() {
        let content = '';

        switch (this.currentStep) {
            case 'overview':
                content = this.renderOverview();
                break;
            case 'stake':
                content = this.renderStakeForm();
                break;
            case 'unstake':
                content = this.renderUnstakeForm();
                break;
            case 'confirm':
                content = this.renderConfirmation();
                break;
            default:
                content = this.renderOverview();
        }

        DOM.setContent('app-container', content);
    }

    // Render staking overview
    renderOverview() {
        const availableCTC = Format.ctc(this.availableBalance, 8);
        const stakedCTC = Format.ctc(this.stakedBalance, 8);
        const totalCTC = Format.ctc(this.availableBalance + this.stakedBalance, 8);

        return `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Staking</h1>
                    <div style="width: 24px;"></div>
                </div>

                <!-- Staking Overview -->
                <div style="padding: 20px;">
                    <!-- Balance Cards -->
                    <div style="display: grid; gap: 16px; margin-bottom: 24px;">
                        <!-- Available Balance Card -->
                        <div class="card">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #4ECDC4, #44A08D); display: flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="20" height="14" x="2" y="5" rx="2"/>
                                        <line x1="2" x2="22" y1="10" y2="10"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 600;">Available Balance</h3>
                                    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Ready to stake</p>
                                </div>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; color: #4ECDC4;">${availableCTC}</div>
                        </div>

                        <!-- Staked Balance Card -->
                        <div class="card">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                        <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/>
                                        <path d="m1 9 4-4 4 4"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 600;">Staked Balance</h3>
                                    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Currently earning</p>
                                </div>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; color: #667eea;">${stakedCTC}</div>
                        </div>

                        <!-- Total Balance Card -->
                        <div class="card" style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 101, 101, 0.1)); border: 1px solid rgba(251, 191, 36, 0.2);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #fbbf24, #f59e0b); display: flex; align-items: center; justify-content: center;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="12" x2="12" y1="1" y2="23"/>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 600;">Total Portfolio</h3>
                                    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Available + Staked</p>
                                </div>
                            </div>
                            <div style="font-size: 24px; font-weight: 700; color: #fbbf24;">${totalCTC}</div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: grid; gap: 12px; margin-bottom: 24px;">
                        <button onclick="stakingScreen.showStakeForm()" class="btn btn-primary" ${this.availableBalance <= 0 ? 'disabled' : ''}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/>
                                <path d="m1 9 4-4 4 4"/>
                            </svg>
                            Stake CTC
                        </button>
                        
                        <button onclick="stakingScreen.showUnstakeForm()" class="btn btn-secondary" ${this.stakedBalance <= 0 ? 'disabled' : ''}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/>
                                <path d="m5 9 4-4 4 4"/>
                            </svg>
                            Unstake CTC
                        </button>
                    </div>

                    <!-- Info Section -->
                    <div class="card" style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.2);">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                            <h3 style="color: #3b82f6; margin: 0; font-size: 16px; font-weight: 600;">Staking Information</h3>
                        </div>
                        <div style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5;">
                            <p style="margin: 0 0 8px 0;">• Earn rewards by participating in network consensus</p>
                            <p style="margin: 0 0 8px 0;">• Stake with validators to secure the CTC network</p>
                            <p style="margin: 0 0 8px 0;">• Unstaking has no lock-up period</p>
                            <p style="margin: 0;">• Network fees apply to all staking transactions</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show stake form
    showStakeForm() {
        this.currentStep = 'stake';
        this.render();
    }

    // Show unstake form
    showUnstakeForm() {
        this.currentStep = 'unstake';
        this.render();
    }

    // Render stake form
    renderStakeForm() {
        const maxAmount = Format.ctc(Math.max(0, this.availableBalance - 100000), 8); // Reserve for fees

        return `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="stakingScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Stake CTC</h1>
                    <div style="width: 24px;"></div>
                </div>

                <!-- Stake Form -->
                <div style="padding: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/>
                                <path d="m1 9 4-4 4 4"/>
                            </svg>
                            Stake Your CTC
                        </div>

                        <!-- Validator Public Key Input -->
                        <div class="input-group">
                            <label class="form-label">Validator Public Key</label>
                            <input 
                                type="text" 
                                id="validator-pubkey" 
                                class="form-input" 
                                placeholder="Enter validator's public key (hex)"
                                oninput="stakingScreen.validateStakeForm()"
                            />
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                64-character hex string starting with validator's public key
                            </div>
                        </div>

                        <!-- Amount Input -->
                        <div class="input-group">
                            <label class="form-label">Amount to Stake</label>
                            <div style="position: relative;">
                                <input 
                                    type="number" 
                                    id="stake-amount" 
                                    class="form-input" 
                                    placeholder="0.00000000"
                                    step="0.00000001"
                                    min="0"
                                    max="${maxAmount}"
                                    oninput="stakingScreen.validateStakeForm()"
                                />
                                <button 
                                    onclick="stakingScreen.setMaxStakeAmount()" 
                                    style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4ECDC4; font-size: 12px; font-weight: 600; cursor: pointer;"
                                >
                                    MAX
                                </button>
                            </div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                Available: ${Format.ctc(this.availableBalance, 8)} CTC
                            </div>
                        </div>

                        <!-- Priority Fee -->
                        <div class="input-group">
                            <label class="form-label">Priority Multiplier</label>
                            <select id="priority-multiplier" class="form-input" onchange="stakingScreen.validateStakeForm()">
                                <option value="0.5">0.5x - Economy (Slower)</option>
                                <option value="1.0" selected>1.0x - Standard</option>
                                <option value="1.5">1.5x - Fast</option>
                                <option value="2.0">2.0x - Priority</option>
                            </select>
                        </div>

                        <!-- Transaction Summary -->
                        <div id="stake-summary" style="display: none;">
                            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; margin: 16px 0;">
                                <h4 style="color: white; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Transaction Summary</h4>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Stake Amount:</span>
                                    <span id="summary-amount" style="color: white;">0 CTC</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Network Fee:</span>
                                    <span id="summary-fee" style="color: white;">0 CTC</span>
                                </div>
                                <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0 8px 0; padding-top: 8px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: rgba(255,255,255,0.6);">Total Cost:</span>
                                        <span id="summary-total" style="color: #f59e0b; font-weight: 600;">0 CTC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Continue Button -->
                        <button 
                            id="stake-continue-btn" 
                            onclick="stakingScreen.confirmStake()" 
                            class="btn btn-primary" 
                            style="width: 100%; margin-top: 16px;" 
                            disabled
                        >
                            Continue to Confirmation
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render unstake form
    renderUnstakeForm() {
        const maxAmount = Format.ctc(this.stakedBalance, 8);

        return `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="stakingScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Unstake CTC</h1>
                    <div style="width: 24px;"></div>
                </div>

                <!-- Unstake Form -->
                <div style="padding: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/>
                                <path d="m5 9 4-4 4 4"/>
                            </svg>
                            Unstake Your CTC
                        </div>

                        <!-- Validator Public Key Input -->
                        <div class="input-group">
                            <label class="form-label">Validator Public Key</label>
                            <input 
                                type="text" 
                                id="unstake-validator-pubkey" 
                                class="form-input" 
                                placeholder="Enter validator's public key (hex)"
                                oninput="stakingScreen.validateUnstakeForm()"
                            />
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                Must match the validator you staked with
                            </div>
                        </div>

                        <!-- Amount Input -->
                        <div class="input-group">
                            <label class="form-label">Amount to Unstake</label>
                            <div style="position: relative;">
                                <input 
                                    type="number" 
                                    id="unstake-amount" 
                                    class="form-input" 
                                    placeholder="0.00000000"
                                    step="0.00000001"
                                    min="0"
                                    max="${maxAmount}"
                                    oninput="stakingScreen.validateUnstakeForm()"
                                />
                                <button 
                                    onclick="stakingScreen.setMaxUnstakeAmount()" 
                                    style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #4ECDC4; font-size: 12px; font-weight: 600; cursor: pointer;"
                                >
                                    MAX
                                </button>
                            </div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                Staked: ${Format.ctc(this.stakedBalance, 8)} CTC
                            </div>
                        </div>

                        <!-- Priority Fee -->
                        <div class="input-group">
                            <label class="form-label">Priority Multiplier</label>
                            <select id="unstake-priority-multiplier" class="form-input" onchange="stakingScreen.validateUnstakeForm()">
                                <option value="0.5">0.5x - Economy (Slower)</option>
                                <option value="1.0" selected>1.0x - Standard</option>
                                <option value="1.5">1.5x - Fast</option>
                                <option value="2.0">2.0x - Priority</option>
                            </select>
                        </div>

                        <!-- Transaction Summary -->
                        <div id="unstake-summary" style="display: none;">
                            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; margin: 16px 0;">
                                <h4 style="color: white; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Transaction Summary</h4>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Unstake Amount:</span>
                                    <span id="unstake-summary-amount" style="color: white;">0 CTC</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Network Fee:</span>
                                    <span id="unstake-summary-fee" style="color: white;">0 CTC</span>
                                </div>
                                <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0 8px 0; padding-top: 8px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: rgba(255,255,255,0.6);">You'll Receive:</span>
                                        <span id="unstake-summary-total" style="color: #4ECDC4; font-weight: 600;">0 CTC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Continue Button -->
                        <button 
                            id="unstake-continue-btn" 
                            onclick="stakingScreen.confirmUnstake()" 
                            class="btn btn-primary" 
                            style="width: 100%; margin-top: 16px;" 
                            disabled
                        >
                            Continue to Confirmation
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Set max stake amount
    setMaxStakeAmount() {
        const maxAmount = Math.max(0, this.availableBalance - 100000); // Reserve for fees
        const maxCTC = Format.ctc(maxAmount, 8);
        DOM.setValue('stake-amount', maxCTC);
        this.validateStakeForm();
    }

    // Set max unstake amount  
    setMaxUnstakeAmount() {
        const maxCTC = Format.ctc(this.stakedBalance, 8);
        DOM.setValue('unstake-amount', maxCTC);
        this.validateUnstakeForm();
    }

    // Validate stake form
    validateStakeForm() {
        const validatorPubKey = DOM.getValue('validator-pubkey').trim();
        const amount = parseFloat(DOM.getValue('stake-amount')) || 0;
        const priority = parseFloat(DOM.getValue('priority-multiplier')) || 1.0;

        // Validate validator public key (should be 64 hex characters)
        const validatorValid = validatorPubKey.length === 64 && /^[a-fA-F0-9]+$/.test(validatorPubKey);
        
        // Calculate fees
        const amountMicro = Math.floor(amount * 100000000);
        const baseFee = this.calculateStakeFee(amountMicro);
        const fee = Math.floor(baseFee * priority);
        const total = amountMicro + fee;

        // Validate amount
        const amountValid = amount > 0 && total <= this.availableBalance;

        // Update form state
        const btn = DOM.get('stake-continue-btn');
        const summary = DOM.get('stake-summary');

        if (validatorValid && amountValid) {
            DOM.show(summary);
            DOM.setValue('summary-amount', Format.ctc(amountMicro, 8) + ' CTC');
            DOM.setValue('summary-fee', Format.ctc(fee, 8) + ' CTC');
            DOM.setValue('summary-total', Format.ctc(total, 8) + ' CTC');
            btn.disabled = false;
        } else {
            DOM.hide(summary);
            btn.disabled = true;
        }

        // Store for confirmation
        this.transactionData = {
            type: 'stake',
            validatorPubKey,
            amount: amountMicro,
            fee,
            priority
        };
    }

    // Validate unstake form
    validateUnstakeForm() {
        const validatorPubKey = DOM.getValue('unstake-validator-pubkey').trim();
        const amount = parseFloat(DOM.getValue('unstake-amount')) || 0;
        const priority = parseFloat(DOM.getValue('unstake-priority-multiplier')) || 1.0;

        // Validate validator public key
        const validatorValid = validatorPubKey.length === 64 && /^[a-fA-F0-9]+$/.test(validatorPubKey);
        
        // Calculate fees
        const amountMicro = Math.floor(amount * 100000000);
        const baseFee = this.calculateUnstakeFee(amountMicro);
        const fee = Math.floor(baseFee * priority);

        // Validate amount
        const amountValid = amount > 0 && amountMicro <= this.stakedBalance;

        // Update form state
        const btn = DOM.get('unstake-continue-btn');
        const summary = DOM.get('unstake-summary');

        if (validatorValid && amountValid) {
            DOM.show(summary);
            DOM.setValue('unstake-summary-amount', Format.ctc(amountMicro, 8) + ' CTC');
            DOM.setValue('unstake-summary-fee', Format.ctc(fee, 8) + ' CTC');
            DOM.setValue('unstake-summary-total', Format.ctc(amountMicro - fee, 8) + ' CTC');
            btn.disabled = false;
        } else {
            DOM.hide(summary);
            btn.disabled = true;
        }

        // Store for confirmation
        this.transactionData = {
            type: 'unstake',
            validatorPubKey,
            amount: amountMicro,
            fee,
            priority
        };
    }

    // Calculate stake transaction fee
    calculateStakeFee(amount) {
        // Estimate transaction size (similar to transfer)
        const estimatedSize = 250; // bytes
        return Math.max(10000, estimatedSize * this.feePerByte); // Min 0.0001 CTC
    }

    // Calculate unstake transaction fee
    calculateUnstakeFee(amount) {
        // Estimate transaction size
        const estimatedSize = 300; // bytes (slightly larger due to UTXO lookup)
        return Math.max(10000, estimatedSize * this.feePerByte); // Min 0.0001 CTC
    }

    // Confirm stake transaction
    confirmStake() {
        if (!this.transactionData) return;
        this.currentStep = 'confirm';
        this.render();
    }

    // Confirm unstake transaction
    confirmUnstake() {
        if (!this.transactionData) return;
        this.currentStep = 'confirm';
        this.render();
    }

    // Render confirmation screen
    renderConfirmation() {
        const data = this.transactionData;
        const isStake = data.type === 'stake';
        const title = isStake ? 'Confirm Stake' : 'Confirm Unstake';
        const icon = isStake ? 
            `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/><path d="m1 9 4-4 4 4"/>` :
            `<path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/><path d="m5 9 4-4 4 4"/>`;

        return `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="stakingScreen.${isStake ? 'showStakeForm' : 'showUnstakeForm'}()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">${title}</h1>
                    <div style="width: 24px;"></div>
                </div>

                <!-- Confirmation -->
                <div style="padding: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                ${icon}
                            </svg>
                            ${title}
                        </div>

                        <!-- Transaction Details -->
                        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; margin: 20px 0;">
                            <h4 style="color: white; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Transaction Details</h4>
                            
                            <div style="margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Type:</span>
                                    <span style="color: white; font-weight: 600;">${isStake ? 'Stake' : 'Unstake'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Amount:</span>
                                    <span style="color: ${isStake ? '#667eea' : '#4ECDC4'}; font-weight: 600;">${Format.ctc(data.amount, 8)} CTC</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: rgba(255,255,255,0.6);">Network Fee:</span>
                                    <span style="color: white;">${Format.ctc(data.fee, 8)} CTC</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                                    <span style="color: rgba(255,255,255,0.6);">Priority:</span>
                                    <span style="color: white;">${data.priority}x</span>
                                </div>
                            </div>

                            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                                <div style="margin-bottom: 12px;">
                                    <span style="color: rgba(255,255,255,0.6); font-size: 14px;">Validator Public Key:</span>
                                    <div style="background: rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; margin-top: 8px; font-family: monospace; word-break: break-all; font-size: 12px; color: #4ECDC4;">
                                        ${data.validatorPubKey}
                                    </div>
                                </div>
                            </div>

                            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 16px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255,255,255,0.8); font-size: 16px; font-weight: 600;">
                                        ${isStake ? 'Total Cost:' : 'You\'ll Receive:'}
                                    </span>
                                    <span style="color: ${isStake ? '#f59e0b' : '#4ECDC4'}; font-size: 20px; font-weight: 700;">
                                        ${Format.ctc(isStake ? data.amount + data.fee : data.amount - data.fee, 8)} CTC
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Warning Box -->
                        <div style="background: rgba(245, 101, 101, 0.1); border: 1px solid rgba(245, 101, 101, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f56565" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                    <path d="M12 9v4"/>
                                    <path d="m12 17 .01 0"/>
                                </svg>
                                <span style="color: #f56565; font-weight: 600;">Important</span>
                            </div>
                            <div style="color: rgba(255,255,255,0.8); font-size: 14px;">
                                ${isStake ? 
                                    'Once confirmed, your CTC will be staked with the specified validator. You can unstake at any time.' :
                                    'Once confirmed, your staked CTC will be returned to your available balance. This action cannot be undone.'
                                }
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: grid; gap: 12px; margin-top: 24px;">
                            <button 
                                id="confirm-transaction-btn" 
                                onclick="stakingScreen.executeTransaction()" 
                                class="btn btn-primary" 
                                style="background: ${isStake ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #4ECDC4, #44A08D)'};"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M20 6 9 17l-5-5"/>
                                </svg>
                                Confirm ${isStake ? 'Stake' : 'Unstake'}
                            </button>
                            
                            <button 
                                onclick="stakingScreen.${isStake ? 'showStakeForm' : 'showUnstakeForm'}()" 
                                class="btn btn-secondary"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                    <path d="M3 3v5h5"/>
                                </svg>
                                Back to Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Execute the transaction
    async executeTransaction() {
        if (!this.transactionData || !this.currentWallet) {
            Toast.error('Missing transaction data');
            return;
        }

        const btn = DOM.get('confirm-transaction-btn');
        if (!btn) return;

        // Disable button and show loading
        btn.disabled = true;
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; animation: spin 1s linear infinite;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Processing...
        `;

        try {
            const data = this.transactionData;
            let transaction;

            if (data.type === 'stake') {
                transaction = await this.createStakeTransaction(data);
            } else {
                transaction = await this.createUnstakeTransaction(data);
            }

            // Send transaction
            const result = await API.sendTransaction(transaction);
            
            Toast.success(`${data.type === 'stake' ? 'Stake' : 'Unstake'} transaction sent successfully!`);
            
            // Refresh balances
            await this.loadBalances();
            
            // Go back to overview
            setTimeout(() => {
                this.show();
            }, 2000);

        } catch (error) {
            console.error('Transaction failed:', error);
            Toast.error(`Transaction failed: ${error.message}`);
            
            // Reset button
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <path d="M20 6 9 17l-5-5"/>
                </svg>
                Confirm ${data.type === 'stake' ? 'Stake' : 'Unstake'}
            `;
        }
    }

    // Create stake transaction
    async createStakeTransaction(data) {
        // Select UTXOs for the transaction
        const requiredAmount = data.amount + data.fee;
        const selectedUTXOs = this.selectUTXOs(requiredAmount);
        
        if (!selectedUTXOs || selectedUTXOs.totalAmount < requiredAmount) {
            throw new Error('Insufficient funds for transaction');
        }

        // Create outputs
        const outputs = [
            {
                address: data.validatorPubKey,
                amount: data.amount
            }
        ];

        // Add change output if necessary
        const change = selectedUTXOs.totalAmount - requiredAmount;
        if (change > 0) {
            outputs.push({
                address: this.currentWallet.address,
                amount: change
            });
        }

        // Create transaction object
        const transaction = {
            type: 'stake',
            from: this.currentWallet.address,
            to: data.validatorPubKey,
            amount: data.amount,
            fee: data.fee,
            inputs: selectedUTXOs.utxos.map(utxo => ({
                txId: utxo.txId,
                index: utxo.index,
                amount: utxo.amount
            })),
            outputs: outputs.map(output => ({
                address: output.address,
                amount: output.amount
            })),
            pubKey: this.currentWallet.publicKey
        };

        // Sign transaction
        const signature = await this.signTransaction(transaction);
        transaction.signature = signature;

        return transaction;
    }

    // Create unstake transaction
    async createUnstakeTransaction(data) {
        // For unstaking, we need to find the staked UTXOs
        // This is a simplified version - in reality, you'd need to track which UTXOs are staked
        const availableUTXOs = this.utxos.filter(utxo => utxo.amount >= data.fee);
        
        if (availableUTXOs.length === 0) {
            throw new Error('Insufficient funds for transaction fees');
        }

        // Use the first available UTXO for fees
        const feeUTXO = availableUTXOs[0];

        // Create outputs
        const outputs = [
            {
                address: this.currentWallet.address,
                amount: data.amount
            }
        ];

        // Add change for fee UTXO
        const change = feeUTXO.amount - data.fee;
        if (change > 0) {
            outputs.push({
                address: this.currentWallet.address,
                amount: change
            });
        }

        // Create transaction object
        const transaction = {
            type: 'unstake',
            from: this.currentWallet.address,
            to: this.currentWallet.address,
            amount: data.amount,
            fee: data.fee,
            inputs: [{
                txId: feeUTXO.txId,
                index: feeUTXO.index,
                amount: feeUTXO.amount
            }],
            outputs: outputs.map(output => ({
                address: output.address,
                amount: output.amount
            })),
            pubKey: this.currentWallet.publicKey
        };

        // Sign transaction
        const signature = await this.signTransaction(transaction);
        transaction.signature = signature;

        return transaction;
    }

    // Select UTXOs for transaction
    selectUTXOs(requiredAmount) {
        let totalAmount = 0;
        const selectedUTXOs = [];

        // Sort UTXOs by amount (ascending) for better coin selection
        const sortedUTXOs = [...this.utxos].sort((a, b) => a.amount - b.amount);

        for (const utxo of sortedUTXOs) {
            selectedUTXOs.push(utxo);
            totalAmount += utxo.amount;
            
            if (totalAmount >= requiredAmount) {
                break;
            }
        }

        if (totalAmount < requiredAmount) {
            return null;
        }

        return {
            utxos: selectedUTXOs,
            totalAmount
        };
    }

    // Sign transaction
    async signTransaction(transaction) {
        try {
            // Create payload for signing (matching backend format)
            const payload = {
                type: transaction.type,
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                inputs: transaction.inputs,
                outputs: transaction.outputs,
                fee: transaction.fee
            };

            // Convert to JSON for signing
            const jsonPayload = JSON.stringify(payload);
            
            // Sign with wallet private key
            const signature = await CryptoWallet.sign(jsonPayload, this.currentWallet.privateKey);
            
            return signature;
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error('Failed to sign transaction');
        }
    }
}

// Create global instance
const stakingScreen = new StakingScreen();
