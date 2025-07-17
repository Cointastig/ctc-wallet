// CTC Wallet - Tonkeeper-inspired Modern Implementation with Biometric Authentication
const AppState = {
    currentScreen: 'splash-screen',
    pin: '',
    authPin: '',
    selectedFee: 'normal',
    walletData: null,
    selectedAsset: 'CTC',
    transactionData: {},
    swapData: {
        from: 'CTC',
        to: 'USDT',
        fromAmount: '',
        toAmount: ''
    },
    marketData: {},
    liveMarketData: {},
    notifications: [],
    theme: 'light',
    currency: 'USD',
    language: 'en',
    contactsList: [],
    stakingPositions: [],
    importMethod: 'phrase'
};

// Network Configuration
const NETWORK_CONFIG = {
    name: 'CTC Mainnet',
    rpcUrl: 'https://rpc.ctc.network',
    chainId: 1337,
    explorer: 'https://explorer.ctc.network',
    nativeCurrency: {
        name: 'Community Trust Coin',
        symbol: 'CTC',
        decimals: 18
    }
};

// Fee Options
const FEE_OPTIONS = {
    slow: { amount: 0.001, time: '~10 min', gasPrice: 1 },
    normal: { amount: 0.01, time: '~3 min', gasPrice: 5 },
    fast: { amount: 0.1, time: '~30 sec', gasPrice: 10 }
};

// CoinGecko API Configuration
const COINGECKO_API = {
    base: 'https://api.coingecko.com/api/v3',
    coins: '/coins/markets',
    price: '/simple/price'
};

// Coin Mapping
const COIN_MAPPING = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'CTC': 'bitcoin' // Using Bitcoin as placeholder
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Load saved data
    loadSavedData();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check biometric availability
    checkBiometricAvailability();
    
    // Show appropriate screen after splash
    setTimeout(() => {
        if (AppState.walletData) {
            showScreen('auth-screen');
        } else {
            showScreen('welcome-screen');
        }
    }, 2000);
    
    // Start market updates
    if (AppState.walletData) {
        startMarketUpdates();
    }
}

// Check if biometric authentication is available
async function checkBiometricAvailability() {
    try {
        // Check for WebAuthn support
        if (window.PublicKeyCredential) {
            // Check if platform authenticator is available (Touch ID, Face ID, Windows Hello)
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (available) {
                console.log('Biometric authentication is available');
            }
        }
        
        // Fallback: Check for Touch ID / Face ID on iOS
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.touchID) {
            console.log('iOS Touch ID/Face ID is available');
        }
    } catch (error) {
        console.log('Biometric authentication check failed:', error);
    }
}

// Load saved data from localStorage
function loadSavedData() {
    const savedWallet = localStorage.getItem('ctc_wallet');
    if (savedWallet) {
        AppState.walletData = JSON.parse(savedWallet);
    }
    
    const savedContacts = localStorage.getItem('ctc_contacts');
    if (savedContacts) {
        AppState.contactsList = JSON.parse(savedContacts);
    }
    
    const savedTheme = localStorage.getItem('ctc_theme');
    if (savedTheme) {
        AppState.theme = savedTheme;
        applyTheme(savedTheme);
    }
    
    const savedCurrency = localStorage.getItem('ctc_currency');
    if (savedCurrency) {
        AppState.currency = savedCurrency;
    }
}

// Apply theme
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    
    // Update theme color meta tag
    const themeColor = theme === 'dark' ? '#0A0B0F' : '#FFFFFF';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
}

// Initialize event listeners
function initializeEventListeners() {
    // Prevent pull-to-refresh on iOS
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle keyboard events
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Screen Management
function showScreen(screenId) {
    const currentScreen = document.getElementById(AppState.currentScreen);
    const newScreen = document.getElementById(screenId);
    
    if (currentScreen) {
        currentScreen.classList.remove('active');
    }
    
    if (newScreen) {
        newScreen.classList.add('active');
        AppState.currentScreen = screenId;
        
        // Handle bottom navigation visibility
        const bottomNav = document.getElementById('bottom-nav');
        const mainScreens = ['dashboard-screen', 'markets-screen', 'explore-screen', 'settings-screen'];
        
        if (mainScreens.includes(screenId)) {
            bottomNav.classList.add('visible');
            updateActiveTab(screenId);
        } else {
            bottomNav.classList.remove('visible');
        }
        
        // Load screen-specific data
        loadScreenData(screenId);
    }
}

// Load screen-specific data
function loadScreenData(screenId) {
    switch(screenId) {
        case 'dashboard-screen':
            updateDashboard();
            break;
        case 'markets-screen':
            updateMarkets();
            break;
        case 'explore-screen':
            updateExplore();
            break;
        case 'settings-screen':
            updateSettings();
            break;
        case 'send-screen':
            initializeSendScreen();
            break;
        case 'receive-screen':
            generateQRCode();
            break;
        case 'swap-screen':
            initializeSwapScreen();
            break;
        case 'staking-screen':
            loadStakingData();
            break;
    }
}

// Tab Navigation
function switchTab(tab) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const screenMap = {
        'dashboard': 'dashboard-screen',
        'markets': 'markets-screen',
        'explore': 'explore-screen',
        'settings': 'settings-screen'
    };
    
    showScreen(screenMap[tab]);
}

function updateActiveTab(screenId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const tabMap = {
        'dashboard-screen': 0,
        'markets-screen': 1,
        'explore-screen': 2,
        'settings-screen': 3
    };
    
    const index = tabMap[screenId];
    if (index !== undefined) {
        navItems[index].classList.add('active');
    }
}

// PIN Management
function addPin(digit) {
    if (AppState.pin.length < 6) {
        AppState.pin += digit;
        updatePinDisplay();
        
        if (AppState.pin.length === 6) {
            setTimeout(() => {
                generateSeedPhrase();
                showScreen('seed-phrase-screen');
            }, 300);
        }
    }
}

function deletePin() {
    if (AppState.pin.length > 0) {
        AppState.pin = AppState.pin.slice(0, -1);
        updatePinDisplay();
    }
}

function clearPin() {
    AppState.pin = '';
    updatePinDisplay();
}

function updatePinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const dot = document.getElementById(`pin-${i}`);
        if (dot) {
            if (i <= AppState.pin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

// Auth PIN
function addAuthPin(digit) {
    if (AppState.authPin.length < 6) {
        AppState.authPin += digit;
        updateAuthPinDisplay();
        
        if (AppState.authPin.length === 6) {
            authenticatePin();
        }
    }
}

function deleteAuthPin() {
    if (AppState.authPin.length > 0) {
        AppState.authPin = AppState.authPin.slice(0, -1);
        updateAuthPinDisplay();
    }
}

function updateAuthPinDisplay() {
    for (let i = 1; i <= 6; i++) {
        const dot = document.getElementById(`auth-pin-${i}`);
        if (dot) {
            if (i <= AppState.authPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

function authenticatePin() {
    if (AppState.walletData && AppState.walletData.pin === AppState.authPin) {
        AppState.authPin = '';
        updateAuthPinDisplay();
        showScreen('dashboard-screen');
        showToast('Welcome back!', 'success');
        startMarketUpdates();
    } else {
        showToast('Incorrect PIN', 'error');
        AppState.authPin = '';
        updateAuthPinDisplay();
        
        // Vibrate on error
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
    }
}

// Biometric Authentication with WebAuthn
async function authenticateBiometric() {
    if (!AppState.walletData.settings.biometric) {
        showToast('Biometric authentication is disabled', 'info');
        return;
    }
    
    try {
        // Check if WebAuthn is supported
        if (!window.PublicKeyCredential) {
            // Fallback to native biometric APIs if available
            return await authenticateNativeBiometric();
        }
        
        showToast('Authenticating...', 'info');
        
        // Check if credential exists
        const credentialId = localStorage.getItem('ctc_biometric_credential');
        
        if (!credentialId) {
            // First time - register biometric
            const registered = await registerBiometric();
            if (registered) {
                loginWithBiometric();
            }
        } else {
            // Authenticate with existing credential
            await verifyBiometric(credentialId);
        }
    } catch (error) {
        console.error('Biometric authentication error:', error);
        showToast('Authentication failed. Please use PIN.', 'error');
    }
}

// Register biometric credential
async function registerBiometric() {
    try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        const userId = new TextEncoder().encode(AppState.walletData.address);
        
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "CTC Wallet",
                id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
            },
            user: {
                id: userId,
                name: "wallet_user",
                displayName: "CTC Wallet User"
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },  // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "none"
        };
        
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        if (credential) {
            // Store credential ID
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            localStorage.setItem('ctc_biometric_credential', credentialId);
            
            // Store public key and other data for verification
            const credentialData = {
                credentialId: credentialId,
                publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.response.publicKey))),
                type: credential.type
            };
            localStorage.setItem('ctc_biometric_data', JSON.stringify(credentialData));
            
            showToast('Biometric registration successful', 'success');
            return true;
        }
    } catch (error) {
        console.error('Biometric registration error:', error);
        if (error.name === 'NotAllowedError') {
            showToast('Biometric registration was cancelled', 'info');
        } else {
            showToast('Failed to register biometric', 'error');
        }
        return false;
    }
}

// Verify biometric credential
async function verifyBiometric(credentialId) {
    try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                type: 'public-key',
                transports: ['internal']
            }],
            userVerification: "required",
            timeout: 60000
        };
        
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        if (assertion) {
            // Authentication successful
            loginWithBiometric();
        }
    } catch (error) {
        console.error('Biometric verification error:', error);
        if (error.name === 'NotAllowedError') {
            showToast('Biometric authentication was cancelled', 'info');
        } else {
            showToast('Biometric authentication failed', 'error');
        }
    }
}

// Native biometric authentication fallback
async function authenticateNativeBiometric() {
    try {
        // Check for iOS TouchID/FaceID via webkit
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.touchID) {
            window.webkit.messageHandlers.touchID.postMessage({
                action: 'authenticate',
                reason: 'Authenticate to access your CTC Wallet'
            });
            return;
        }
        
        // For Android, try using the Credential Management API
        if ('credentials' in navigator && 'preventSilentAccess' in navigator.credentials) {
            const credential = await navigator.credentials.get({
                password: true,
                federated: {
                    providers: []
                }
            });
            
            if (credential) {
                loginWithBiometric();
                return;
            }
        }
        
        showToast('Biometric authentication not available', 'error');
    } catch (error) {
        console.error('Native biometric error:', error);
        showToast('Biometric authentication failed', 'error');
    }
}

// Login after successful biometric authentication
function loginWithBiometric() {
    showScreen('dashboard-screen');
    showToast('Authentication successful', 'success');
    startMarketUpdates();
}

// Handle iOS biometric response
window.handleTouchIDResponse = function(success) {
    if (success) {
        loginWithBiometric();
    } else {
        showToast('Biometric authentication failed', 'error');
    }
};

function forgotPin() {
    if (confirm('This will reset your wallet. You will need your recovery phrase to restore it. Continue?')) {
        localStorage.removeItem('ctc_wallet');
        localStorage.removeItem('ctc_biometric_credential');
        localStorage.removeItem('ctc_biometric_data');
        AppState.walletData = null;
        showScreen('welcome-screen');
        showToast('Wallet reset successfully', 'info');
    }
}

// Seed Phrase Generation
function generateSeedPhrase() {
    const wordlist = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
        'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
        'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
        'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
        'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
        'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
        'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
        'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
        'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april'
    ];
    
    const seedPhrase = [];
    for (let i = 0; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * wordlist.length);
        seedPhrase.push(wordlist[randomIndex]);
    }
    
    // Display seed phrase
    const seedGrid = document.getElementById('seed-grid');
    if (seedGrid) {
        seedGrid.innerHTML = '';
        seedPhrase.forEach((word, index) => {
            const seedWord = document.createElement('div');
            seedWord.className = 'seed-word';
            seedWord.innerHTML = `
                <div class="seed-number">${index + 1}</div>
                <div class="seed-text">${word}</div>
            `;
            seedGrid.appendChild(seedWord);
        });
    }
    
    // Create wallet
    const wallet = {
        pin: AppState.pin,
        seedPhrase: seedPhrase.join(' '),
        address: generateAddress(),
        balance: '10000.00',
        tokens: {
            CTC: { balance: '10000.00', value: 24500 },
            BTC: { balance: '0.5', value: 22500 },
            ETH: { balance: '5.0', value: 16000 },
            USDT: { balance: '1000.00', value: 1000 }
        },
        transactions: generateMockTransactions(),
        settings: {
            currency: 'USD',
            biometric: true,
            notifications: true,
            theme: 'light',
            language: 'en'
        },
        createdAt: Date.now(),
        lastAccess: Date.now()
    };
    
    localStorage.setItem('ctc_wallet', JSON.stringify(wallet));
    AppState.walletData = wallet;
}

function generateAddress() {
    const chars = '0123456789abcdef';
    let address = 'ctc1q';
    for (let i = 0; i < 38; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
}

function generateMockTransactions() {
    const types = ['send', 'receive', 'swap'];
    const transactions = [];
    
    for (let i = 0; i < 10; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const amount = (Math.random() * 1000).toFixed(2);
        
        transactions.push({
            id: generateTransactionId(),
            type: type,
            amount: amount,
            asset: 'CTC',
            timestamp: Date.now() - (i * 86400000),
            status: i === 0 ? 'pending' : 'confirmed',
            recipient: type === 'send' ? generateAddress() : null,
            sender: type === 'receive' ? generateAddress() : null,
            fee: FEE_OPTIONS.normal.amount
        });
    }
    
    return transactions;
}

function generateTransactionId() {
    const chars = '0123456789abcdef';
    let txId = '0x';
    for (let i = 0; i < 64; i++) {
        txId += chars[Math.floor(Math.random() * chars.length)];
    }
    return txId;
}

// Copy seed phrase
function copySeedPhrase() {
    const seedPhrase = AppState.walletData.seedPhrase;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(seedPhrase).then(() => {
            showToast('Seed phrase copied', 'success');
        });
    }
}

function confirmSeedPhrase() {
    showScreen('dashboard-screen');
    showToast('Wallet created successfully!', 'success');
    startMarketUpdates();
}

// Import Wallet
function selectImportMethod(method) {
    AppState.importMethod = method;
    
    const phraseSection = document.getElementById('import-phrase-section');
    const keySection = document.getElementById('import-key-section');
    const tabs = document.querySelectorAll('.import-tabs .tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (method === 'phrase') {
        phraseSection.style.display = 'block';
        keySection.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        phraseSection.style.display = 'none';
        keySection.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

function importWallet() {
    if (AppState.importMethod === 'phrase') {
        const phrase = document.getElementById('import-phrase').value.trim();
        
        if (!phrase) {
            showToast('Please enter recovery phrase', 'error');
            return;
        }
        
        const words = phrase.split(' ');
        if (words.length !== 12 && words.length !== 24) {
            showToast('Invalid recovery phrase', 'error');
            return;
        }
        
        // Import wallet
        AppState.importedPhrase = phrase;
        showScreen('create-wallet-screen');
    }
}

// Dashboard Updates
function updateDashboard() {
    if (!AppState.walletData) return;
    
    // Calculate total portfolio value
    let totalValue = 0;
    Object.entries(AppState.walletData.tokens).forEach(([symbol, data]) => {
        const price = AppState.marketData[symbol]?.price || getDefaultPrice(symbol);
        const value = parseFloat(data.balance) * price;
        totalValue += value;
    });
    
    // Update balance display
    const balanceEl = document.querySelector('.balance-amount');
    if (balanceEl) {
        balanceEl.textContent = `$${totalValue.toFixed(2).toLocaleString()}`;
    }
    
    // Update assets
    updateAssetList();
    
    // Update transactions
    updateTransactionList();
}

function updateAssetList() {
    const assetList = document.getElementById('dashboard-assets');
    if (!assetList) return;
    
    const assets = Object.entries(AppState.walletData.tokens).map(([symbol, data]) => {
        const price = AppState.marketData[symbol]?.price || getDefaultPrice(symbol);
        const value = parseFloat(data.balance) * price;
        const change = AppState.marketData[symbol]?.change24h || 0;
        
        return `
            <div class="asset-item" onclick="showAssetDetail('${symbol}')">
                ${symbol === 'CTC' ? 
                    '<img src="/logo.png" alt="CTC" class="asset-icon">' :
                    `<div class="asset-icon-placeholder">${symbol}</div>`
                }
                <div class="asset-info">
                    <div class="asset-name">${symbol}</div>
                    <div class="asset-balance">${data.balance} ${symbol}</div>
                </div>
                <div class="asset-values">
                    <div class="asset-price">$${value.toFixed(2)}</div>
                    <div class="asset-change ${change >= 0 ? 'positive' : 'negative'}">
                        ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    assetList.innerHTML = assets;
}

function updateTransactionList() {
    const txList = document.getElementById('dashboard-transactions');
    if (!txList) return;
    
    const transactions = AppState.walletData.transactions.slice(0, 5).map(tx => {
        const icon = tx.type === 'receive' ? 
            '<path d="M12 5v14m0 0l7-7m-7 7l-7-7"/>' :
            '<path d="M12 19V5m0 0l-7 7m7-7l7 7"/>';
        
        return `
            <div class="transaction-item" onclick="viewTransactionDetails('${tx.id}')">
                <div class="transaction-icon ${tx.type}">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${icon}
                    </svg>
                </div>
                <div class="transaction-info">
                    <div class="transaction-type">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                    <div class="transaction-time">${formatTime(tx.timestamp)}</div>
                </div>
                <div class="transaction-amount">
                    <div class="transaction-value ${tx.type === 'receive' ? 'positive' : ''}">
                        ${tx.type === 'receive' ? '+' : '-'}${tx.amount} ${tx.asset}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    txList.innerHTML = transactions || '<p style="text-align: center; color: var(--text-secondary);">No transactions yet</p>';
}

// Send Functions
function initializeSendScreen() {
    document.getElementById('amount').value = '';
    document.getElementById('recipient').value = '';
    updateAmountConversion();
}

function setAmount(percentage) {
    const balance = parseFloat(AppState.walletData.tokens[AppState.selectedAsset]?.balance || 0);
    const amount = (balance * percentage / 100).toFixed(2);
    document.getElementById('amount').value = amount;
    updateAmountConversion();
}

function selectFee(fee) {
    AppState.selectedFee = fee;
    document.querySelectorAll('.fee-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`input[value="${fee}"]`).parentElement.classList.add('selected');
}

function updateAmountConversion() {
    const amount = parseFloat(document.getElementById('amount')?.value) || 0;
    const price = AppState.marketData[AppState.selectedAsset]?.price || getDefaultPrice(AppState.selectedAsset);
    const usdValue = (amount * price).toFixed(2);
    const convertedElement = document.querySelector('.amount-conversion');
    if (convertedElement) {
        convertedElement.textContent = `≈ $${usdValue} USD`;
    }
}

function reviewTransaction() {
    const recipient = document.getElementById('recipient').value;
    const amount = document.getElementById('amount').value;
    
    if (!recipient || !amount || parseFloat(amount) <= 0) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const balance = parseFloat(AppState.walletData.tokens[AppState.selectedAsset]?.balance || 0);
    if (parseFloat(amount) > balance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    AppState.transactionData = {
        recipient,
        amount,
        asset: AppState.selectedAsset,
        fee: FEE_OPTIONS[AppState.selectedFee].amount
    };
    
    updateConfirmScreen();
    showScreen('confirm-screen');
}

function updateConfirmScreen() {
    // Update confirm screen with transaction data
    const amountEl = document.querySelector('.confirm-amount .amount-large');
    const usdEl = document.querySelector('.confirm-amount .amount-usd');
    
    if (amountEl) {
        amountEl.textContent = `${AppState.transactionData.amount} ${AppState.transactionData.asset}`;
    }
    
    if (usdEl) {
        const price = AppState.marketData[AppState.transactionData.asset]?.price || getDefaultPrice(AppState.transactionData.asset);
        const usd = (parseFloat(AppState.transactionData.amount) * price).toFixed(2);
        usdEl.textContent = `≈ $${usd} USD`;
    }
}

async function sendTransaction() {
    showToast('Sending transaction...', 'info');
    
    // Simulate transaction
    setTimeout(() => {
        // Update balance
        const currentBalance = parseFloat(AppState.walletData.tokens[AppState.transactionData.asset].balance);
        AppState.walletData.tokens[AppState.transactionData.asset].balance = (
            currentBalance - parseFloat(AppState.transactionData.amount) - AppState.transactionData.fee
        ).toFixed(2);
        
        // Add transaction to history
        const tx = {
            id: generateTransactionId(),
            type: 'send',
            amount: AppState.transactionData.amount,
            asset: AppState.transactionData.asset,
            recipient: AppState.transactionData.recipient,
            fee: AppState.transactionData.fee,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        AppState.walletData.transactions.unshift(tx);
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        showScreen('success-screen');
        
        // Update status after delay
        setTimeout(() => {
            tx.status = 'confirmed';
            localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        }, 3000);
    }, 2000);
}

function viewTransaction() {
    const txId = AppState.walletData.transactions[0].id;
    window.open(`${NETWORK_CONFIG.explorer}/tx/${txId}`, '_blank');
}

function copyTxHash() {
    const txHash = AppState.walletData.transactions[0].id;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(txHash).then(() => {
            showToast('Transaction ID copied', 'success');
        });
    }
}

// Receive Functions
function generateQRCode() {
    const addressElement = document.getElementById('wallet-address');
    const qrContainer = document.getElementById('qr-code');
    
    if (addressElement && AppState.walletData) {
        addressElement.textContent = AppState.walletData.address;
    }
    
    if (qrContainer) {
        // Simple QR placeholder
        qrContainer.innerHTML = `
            <div style="width: 200px; height: 200px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                <span style="color: var(--text-tertiary); font-size: 14px;">QR Code</span>
            </div>
        `;
    }
}

function copyAddress() {
    const address = AppState.walletData.address;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address).then(() => {
            showToast('Address copied', 'success');
        });
    }
}

function shareAddress() {
    const address = AppState.walletData.address;
    
    if (navigator.share) {
        navigator.share({
            title: 'My CTC Address',
            text: address
        }).catch(err => {
            if (err.name !== 'AbortError') {
                copyAddress();
            }
        });
    } else {
        copyAddress();
    }
}

function requestAmount() {
    showToast('Request amount feature coming soon', 'info');
}

// Swap Functions
function initializeSwapScreen() {
    updateSwapRates();
}

function switchSwapAssets() {
    const temp = AppState.swapData.from;
    AppState.swapData.from = AppState.swapData.to;
    AppState.swapData.to = temp;
    
    // Update UI
    document.getElementById('swap-from-amount').value = '';
    document.getElementById('swap-to-amount').value = '';
    updateSwapRates();
}

function updateSwapFromAmount(amount) {
    AppState.swapData.fromAmount = amount;
    calculateSwapAmount();
}

function calculateSwapAmount() {
    const fromAmount = parseFloat(AppState.swapData.fromAmount) || 0;
    const fromPrice = AppState.marketData[AppState.swapData.from]?.price || getDefaultPrice(AppState.swapData.from);
    const toPrice = AppState.marketData[AppState.swapData.to]?.price || getDefaultPrice(AppState.swapData.to);
    
    const toAmount = fromAmount * fromPrice / toPrice;
    AppState.swapData.toAmount = toAmount.toFixed(6);
    
    const toAmountEl = document.getElementById('swap-to-amount');
    if (toAmountEl) {
        toAmountEl.value = AppState.swapData.toAmount;
    }
}

function updateSwapRates() {
    const fromPrice = AppState.marketData[AppState.swapData.from]?.price || getDefaultPrice(AppState.swapData.from);
    const toPrice = AppState.marketData[AppState.swapData.to]?.price || getDefaultPrice(AppState.swapData.to);
    const rate = fromPrice / toPrice;
    
    const rateEl = document.getElementById('swap-rate');
    if (rateEl) {
        rateEl.textContent = `1 ${AppState.swapData.from} = ${rate.toFixed(6)} ${AppState.swapData.to}`;
    }
}

async function executeSwap() {
    if (!AppState.swapData.fromAmount || parseFloat(AppState.swapData.fromAmount) <= 0) {
        showToast('Please enter amount', 'error');
        return;
    }
    
    const fromBalance = parseFloat(AppState.walletData.tokens[AppState.swapData.from].balance);
    if (parseFloat(AppState.swapData.fromAmount) > fromBalance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    showToast('Processing swap...', 'info');
    
    setTimeout(() => {
        // Update balances
        const fromAmount = parseFloat(AppState.swapData.fromAmount);
        const toAmount = parseFloat(AppState.swapData.toAmount);
        const fee = fromAmount * 0.003; // 0.3% fee
        
        AppState.walletData.tokens[AppState.swapData.from].balance = (
            parseFloat(AppState.walletData.tokens[AppState.swapData.from].balance) - fromAmount - fee
        ).toFixed(6);
        
        AppState.walletData.tokens[AppState.swapData.to].balance = (
            parseFloat(AppState.walletData.tokens[AppState.swapData.to].balance) + toAmount
        ).toFixed(6);
        
        // Add transaction
        const tx = {
            id: generateTransactionId(),
            type: 'swap',
            fromAsset: AppState.swapData.from,
            fromAmount: fromAmount,
            toAsset: AppState.swapData.to,
            toAmount: toAmount,
            fee: fee,
            timestamp: Date.now(),
            status: 'confirmed'
        };
        
        AppState.walletData.transactions.unshift(tx);
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        // Reset form
        AppState.swapData.fromAmount = '';
        AppState.swapData.toAmount = '';
        document.getElementById('swap-from-amount').value = '';
        document.getElementById('swap-to-amount').value = '';
        
        showToast('Swap completed successfully!', 'success');
        showScreen('dashboard-screen');
    }, 2000);
}

// Market Functions
function updateMarkets() {
    const marketList = document.getElementById('market-list');
    if (!marketList) return;
    
    const markets = Object.entries(AppState.marketData).map(([symbol, data], index) => {
        return `
            <div class="market-item" onclick="viewMarketDetails('${symbol}')">
                <div class="market-rank">${index + 1}</div>
                ${symbol === 'CTC' ? 
                    '<img src="/logo.png" alt="CTC" class="asset-icon">' :
                    `<div class="asset-icon-placeholder">${symbol}</div>`
                }
                <div class="market-info">
                    <div class="market-symbol">${symbol}</div>
                    <div class="market-name">${getTokenName(symbol)}</div>
                </div>
                <div class="market-values">
                    <div class="market-price">$${data.price.toFixed(2)}</div>
                    <div class="market-change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                        ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    marketList.innerHTML = markets;
}

// Settings Functions
function updateSettings() {
    // Update toggle states
    const biometricToggle = document.getElementById('biometric-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const darkModeToggle = document.getElementById('darkmode-toggle');
    
    if (biometricToggle && AppState.walletData) {
        biometricToggle.classList.toggle('active', AppState.walletData.settings.biometric);
    }
    
    if (notificationsToggle && AppState.walletData) {
        notificationsToggle.classList.toggle('active', AppState.walletData.settings.notifications);
    }
    
    if (darkModeToggle) {
        darkModeToggle.classList.toggle('active', AppState.theme === 'dark');
    }
}

function toggleBiometric() {
    const toggle = document.getElementById('biometric-toggle');
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        AppState.walletData.settings.biometric = isActive;
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        if (isActive) {
            // Trigger biometric registration if enabled for the first time
            const credentialId = localStorage.getItem('ctc_biometric_credential');
            if (!credentialId) {
                registerBiometric();
            } else {
                showToast('Biometric enabled', 'success');
            }
        } else {
            // Clear biometric data if disabled
            localStorage.removeItem('ctc_biometric_credential');
            localStorage.removeItem('ctc_biometric_data');
            showToast('Biometric disabled', 'success');
        }
    }
}

function toggleNotifications() {
    const toggle = document.getElementById('notifications-toggle');
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        AppState.walletData.settings.notifications = isActive;
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        if (isActive) {
            requestNotificationPermission();
        } else {
            showToast('Notifications disabled', 'success');
        }
    }
}

function toggleDarkMode() {
    const toggle = document.getElementById('darkmode-toggle');
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        AppState.theme = isActive ? 'dark' : 'light';
        localStorage.setItem('ctc_theme', AppState.theme);
        applyTheme(AppState.theme);
        
        showToast(`${isActive ? 'Dark' : 'Light'} mode enabled`, 'success');
    }
}

async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Notifications enabled', 'success');
        } else {
            showToast('Notification permission denied', 'error');
        }
    }
}

function editProfile() {
    showToast('Profile editing coming soon', 'info');
}

function showSupport() {
    window.open('https://support.ctcwallet.com', '_blank');
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        AppState.authPin = '';
        showScreen('auth-screen');
        showToast('Signed out successfully', 'info');
    }
}

// Staking Functions
function loadStakingData() {
    const positionsEl = document.getElementById('staking-positions');
    if (!positionsEl) return;
    
    if (AppState.stakingPositions.length === 0) {
        positionsEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active staking positions</p>';
    } else {
        // Display staking positions
        positionsEl.innerHTML = AppState.stakingPositions.map(position => `
            <div class="staking-position">
                <!-- Staking position details -->
            </div>
        `).join('');
    }
}

function showStakeDialog() {
    showToast('Staking feature coming soon', 'info');
}

// Helper Functions
function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

function getTokenName(symbol) {
    const names = {
        CTC: 'Community Trust Coin',
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        USDT: 'Tether',
        BNB: 'BNB',
        SOL: 'Solana'
    };
    return names[symbol] || symbol;
}

function getDefaultPrice(symbol) {
    const prices = {
        CTC: 2.45,
        BTC: 45000,
        ETH: 3200,
        USDT: 1.0,
        BNB: 320,
        SOL: 100
    };
    return prices[symbol] || 1;
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.querySelector('.toast-icon');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Update icon based on type
        const icons = {
            success: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            error: '<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
            info: '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
        };
        
        toastIcon.innerHTML = icons[type] || icons.info;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Market Data Updates
async function loadMarketData() {
    try {
        // Initialize with default data
        AppState.marketData = {
            CTC: { price: 2.45, change24h: 12.5 },
            BTC: { price: 45000, change24h: -2.1 },
            ETH: { price: 3200, change24h: 5.8 },
            USDT: { price: 1.0, change24h: 0.1 }
        };
        
        // Try to fetch live data
        const response = await fetch(
            `${COINGECKO_API.base}${COINGECKO_API.price}?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.bitcoin) {
                AppState.marketData.BTC = {
                    price: data.bitcoin.usd,
                    change24h: data.bitcoin.usd_24h_change
                };
            }
            
            if (data.ethereum) {
                AppState.marketData.ETH = {
                    price: data.ethereum.usd,
                    change24h: data.ethereum.usd_24h_change
                };
            }
            
            if (data.tether) {
                AppState.marketData.USDT = {
                    price: data.tether.usd,
                    change24h: data.tether.usd_24h_change
                };
            }
        }
    } catch (error) {
        console.error('Failed to load market data:', error);
    }
}

function startMarketUpdates() {
    // Initial load
    loadMarketData();
    
    // Update every 30 seconds
    setInterval(() => {
        loadMarketData();
        
        // Update UI if on relevant screens
        if (['dashboard-screen', 'markets-screen'].includes(AppState.currentScreen)) {
            if (AppState.currentScreen === 'dashboard-screen') {
                updateDashboard();
            } else if (AppState.currentScreen === 'markets-screen') {
                updateMarkets();
            }
        }
    }, 30000);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                if (AppState.currentScreen === 'dashboard-screen') {
                    showScreen('send-screen');
                }
                break;
            case 'r':
                e.preventDefault();
                if (AppState.currentScreen === 'dashboard-screen') {
                    showScreen('receive-screen');
                }
                break;
        }
    }
}

// QR Code Scanner (placeholder)
function scanQRCode() {
    showToast('QR scanner coming soon', 'info');
}

// Show contacts
function showContacts() {
    showToast('Contacts feature coming soon', 'info');
}

// Show fee options
function showFeeOptions() {
    showToast('Custom fee options coming soon', 'info');
}

// Select send asset
function selectSendAsset() {
    showToast('Asset selection coming soon', 'info');
}

// Select swap assets
function selectSwapFromAsset() {
    showToast('Asset selection coming soon', 'info');
}

function selectSwapToAsset() {
    showToast('Asset selection coming soon', 'info');
}

// View transaction details
function viewTransactionDetails(txId) {
    showToast('Transaction details coming soon', 'info');
}

// View market details
function viewMarketDetails(symbol) {
    AppState.selectedAsset = symbol;
    showToast('Market details coming soon', 'info');
}

// Show asset detail
function showAssetDetail(symbol) {
    AppState.selectedAsset = symbol;
    showToast('Asset details coming soon', 'info');
}

// Update explore screen
function updateExplore() {
    // Explore screen is static
}

// Export functions for HTML
window.showScreen = showScreen;
window.switchTab = switchTab;
window.addPin = addPin;
window.deletePin = deletePin;
window.clearPin = clearPin;
window.addAuthPin = addAuthPin;
window.deleteAuthPin = deleteAuthPin;
window.authenticatePin = authenticatePin;
window.authenticateBiometric = authenticateBiometric;
window.forgotPin = forgotPin;
window.selectFee = selectFee;
window.setAmount = setAmount;
window.reviewTransaction = reviewTransaction;
window.sendTransaction = sendTransaction;
window.viewTransaction = viewTransaction;
window.copyAddress = copyAddress;
window.shareAddress = shareAddress;
window.requestAmount = requestAmount;
window.scanQRCode = scanQRCode;
window.toggleBiometric = toggleBiometric;
window.toggleNotifications = toggleNotifications;
window.toggleDarkMode = toggleDarkMode;
window.editProfile = editProfile;
window.showSupport = showSupport;
window.logout = logout;
window.copySeedPhrase = copySeedPhrase;
window.confirmSeedPhrase = confirmSeedPhrase;
window.copyTxHash = copyTxHash;
window.showContacts = showContacts;
window.showFeeOptions = showFeeOptions;
window.viewTransactionDetails = viewTransactionDetails;
window.viewMarketDetails = viewMarketDetails;
window.showAssetDetail = showAssetDetail;
window.importWallet = importWallet;
window.selectImportMethod = selectImportMethod;
window.switchSwapAssets = switchSwapAssets;
window.updateSwapFromAmount = updateSwapFromAmount;
window.executeSwap = executeSwap;
window.selectSendAsset = selectSendAsset;
window.selectSwapFromAsset = selectSwapFromAsset;
window.selectSwapToAsset = selectSwapToAsset;
window.showStakeDialog = showStakeDialog;
window.updateAmountConversion = updateAmountConversion;

console.log('CTC Wallet - Tonkeeper-inspired Edition with Biometric Authentication initialized');
