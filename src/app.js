// CTC Wallet - Modern Professional Version
// Global state management with modern architecture
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
    marketData: {
        CTC: { 
            price: 2.45, 
            change24h: 12.5, 
            marketCap: 245000000,
            volume24h: 12500000,
            circSupply: 100000000,
            chart: generateMockChart()
        },
        BTC: { 
            price: 45000, 
            change24h: -2.1,
            marketCap: 880000000000,
            volume24h: 28000000000,
            chart: generateMockChart()
        },
        ETH: { 
            price: 3200, 
            change24h: 5.8,
            marketCap: 385000000000,
            volume24h: 15000000000,
            chart: generateMockChart()
        },
        USDT: { 
            price: 1.0, 
            change24h: 0.1,
            marketCap: 95000000000,
            volume24h: 45000000000,
            chart: generateMockChart()
        }
    },
    notifications: [],
    theme: 'dark',
    currency: 'USD',
    language: 'en'
};

// Constants
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

const FEE_OPTIONS = {
    slow: { amount: 0.001, time: '~10 min', gasPrice: 1, emoji: '🐢' },
    normal: { amount: 0.01, time: '~3 min', gasPrice: 5, emoji: '⚡' },
    fast: { amount: 0.1, time: '~30 sec', gasPrice: 10, emoji: '🚀' }
};

// Initialize app with modern setup
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // Check for existing wallet
    const savedWallet = localStorage.getItem('ctc_wallet');
    if (savedWallet) {
        AppState.walletData = JSON.parse(savedWallet);
    }

    // Initialize theme
    applyTheme();

    // Show appropriate screen after splash
    setTimeout(() => {
        if (AppState.walletData) {
            showScreen('auth-screen');
        } else {
            showScreen('welcome-screen');
        }
    }, 2500);

    // Add event listeners
    initializeEventListeners();
    
    // Initialize touch handlers
    initializeTouchHandlers();
    
    // Check for PWA install prompt
    checkPWAInstall();
    
    // Initialize animations
    initializeAnimations();
    
    // Setup real-time updates
    startMarketUpdates();
}

// Modern screen management with animations
function showScreen(screenId) {
    const currentScreenEl = document.getElementById(AppState.currentScreen);
    const newScreenEl = document.getElementById(screenId);
    
    if (currentScreenEl) {
        currentScreenEl.classList.add('slide-out');
        setTimeout(() => {
            currentScreenEl.classList.remove('active', 'slide-out');
        }, 250);
    }
    
    setTimeout(() => {
        if (newScreenEl) {
            newScreenEl.classList.add('active');
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
            
            // Trigger screen animations
            animateScreenEntry(screenId);
        }
    }, currentScreenEl ? 250 : 0);
}

// Load screen-specific data
function loadScreenData(screenId) {
    switch(screenId) {
        case 'dashboard-screen':
            updateDashboard();
            renderPortfolioChart();
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
    }
}

// Tab switching with modern navigation
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

// PIN Management with enhanced security
function addPin(digit) {
    if (AppState.pin.length < 6) {
        AppState.pin += digit;
        updatePinDisplay();
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        
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

// Auth PIN with biometric support
function addAuthPin(digit) {
    if (AppState.authPin.length < 6) {
        AppState.authPin += digit;
        updateAuthPinDisplay();
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        
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
    } else {
        showToast('Incorrect PIN', 'error');
        AppState.authPin = '';
        updateAuthPinDisplay();
        
        // Vibrate on error
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Shake animation
        const pinContainer = document.querySelector('.pin-container');
        pinContainer.classList.add('shake');
        setTimeout(() => pinContainer.classList.remove('shake'), 500);
    }
}

async function authenticateBiometric() {
    if (!AppState.walletData.settings.biometric) {
        showToast('Biometric authentication is disabled', 'info');
        return;
    }
    
    showToast('Authenticating...', 'info');
    
    try {
        // Check for WebAuthn support
        if (window.PublicKeyCredential) {
            // In a real app, implement WebAuthn here
            setTimeout(() => {
                showScreen('dashboard-screen');
                showToast('Authentication successful', 'success');
            }, 1000);
        } else {
            // Fallback simulation
            setTimeout(() => {
                showScreen('dashboard-screen');
                showToast('Authentication successful', 'success');
            }, 1000);
        }
    } catch (error) {
        showToast('Authentication failed', 'error');
    }
}

function forgotPin() {
    if (confirm('This will reset your wallet. You will need your recovery phrase to restore it. Continue?')) {
        localStorage.removeItem('ctc_wallet');
        AppState.walletData = null;
        showScreen('welcome-screen');
        showToast('Wallet reset successfully', 'info');
    }
}

// Enhanced seed phrase generation
function generateSeedPhrase() {
    const wordlist = [
        'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
        'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
        'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
        'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
        'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
        'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
        'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone'
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
            seedWord.className = 'seed-word fade-in';
            seedWord.style.animationDelay = `${index * 50}ms`;
            seedWord.innerHTML = `
                <div class="seed-number">${index + 1}</div>
                <div class="seed-text">${word}</div>
            `;
            seedGrid.appendChild(seedWord);
        });
    }
    
    // Create wallet with enhanced data structure
    const wallet = {
        pin: AppState.pin,
        seedPhrase: seedPhrase.join(' '),
        address: generateAddress(),
        balance: '10000.00',
        tokens: {
            CTC: { balance: '10000.00', value: 24500 }
        },
        transactions: generateMockTransactions(),
        settings: {
            currency: 'USD',
            biometric: true,
            notifications: true,
            theme: 'dark',
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
    const types = ['send', 'receive', 'swap', 'stake'];
    const transactions = [];
    
    for (let i = 0; i < 5; i++) {
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
            fee: FEE_OPTIONS.normal.amount,
            hash: generateTransactionId()
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

// Copy seed phrase functionality
function copySeedPhrase() {
    const seedPhrase = AppState.walletData.seedPhrase;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(seedPhrase).then(() => {
            showToast('Seed phrase copied to clipboard', 'success');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = seedPhrase;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Seed phrase copied to clipboard', 'success');
    }
}

function confirmSeedPhrase() {
    showScreen('dashboard-screen');
    showToast('Wallet created successfully!', 'success');
}

// Transaction functions with modern UX
function initializeSendScreen() {
    // Reset form
    document.getElementById('amount').value = '';
    document.getElementById('recipient').value = '';
    updateAmountConversion();
    updateTransactionSummary();
}

function setAmount(percentage) {
    const balance = parseFloat(AppState.walletData.balance);
    const amount = (balance * percentage / 100).toFixed(2);
    document.getElementById('amount').value = amount;
    updateAmountConversion();
    updateTransactionSummary();
}

function selectFee(element, fee) {
    document.querySelectorAll('.fee-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    AppState.selectedFee = fee;
    updateTransactionSummary();
}

function updateAmountConversion() {
    const amount = parseFloat(document.getElementById('amount')?.value) || 0;
    const usdValue = (amount * AppState.marketData.CTC.price).toFixed(2);
    const convertedElement = document.querySelector('.amount-converted');
    if (convertedElement) {
        convertedElement.textContent = `≈ $${usdValue} USD`;
    }
    updateTransactionSummary();
}

function updateTransactionSummary() {
    const amount = parseFloat(document.getElementById('amount')?.value) || 0;
    const fee = FEE_OPTIONS[AppState.selectedFee].amount;
    const total = amount + fee;
    
    const elements = {
        amount: document.getElementById('summary-amount'),
        fee: document.getElementById('summary-fee'),
        total: document.getElementById('summary-total')
    };
    
    if (elements.amount) elements.amount.textContent = `${amount.toFixed(2)} CTC`;
    if (elements.fee) elements.fee.textContent = `${fee} CTC`;
    if (elements.total) elements.total.textContent = `${total.toFixed(2)} CTC`;
}

function reviewTransaction() {
    const recipient = document.getElementById('recipient').value;
    const amount = document.getElementById('amount').value;
    
    if (!recipient) {
        showToast('Please enter recipient address', 'error');
        return;
    }
    
    if (!validateAddress(recipient)) {
        showToast('Invalid address format', 'error');
        return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
        showToast('Please enter valid amount', 'error');
        return;
    }
    
    if (parseFloat(amount) > parseFloat(AppState.walletData.balance)) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    AppState.transactionData = {
        recipient,
        amount,
        fee: FEE_OPTIONS[AppState.selectedFee].amount,
        total: parseFloat(amount) + FEE_OPTIONS[AppState.selectedFee].amount
    };
    
    updateConfirmScreen();
    showScreen('confirm-screen');
}

function validateAddress(address) {
    return address.startsWith('ctc1q') && address.length === 43;
}

function updateConfirmScreen() {
    // Update confirm screen with transaction data
    const elements = {
        amount: document.querySelector('.review-amount .amount-large'),
        usdValue: document.querySelector('.review-amount .amount-usd'),
        fromAddress: document.querySelector('.review-details .wallet-address'),
        toAddress: document.querySelectorAll('.review-details .wallet-address')[1]
    };
    
    if (elements.amount) {
        elements.amount.textContent = `${AppState.transactionData.amount} CTC`;
    }
    
    if (elements.usdValue) {
        const usd = (parseFloat(AppState.transactionData.amount) * AppState.marketData.CTC.price).toFixed(2);
        elements.usdValue.textContent = `≈ $${usd} USD`;
    }
    
    if (elements.toAddress) {
        elements.toAddress.textContent = formatAddress(AppState.transactionData.recipient);
    }
}

async function sendTransaction() {
    showToast('Broadcasting transaction...', 'info');
    
    // Simulate blockchain transaction
    try {
        await simulateBlockchainTransaction();
        
        // Update balance
        AppState.walletData.balance = (
            parseFloat(AppState.walletData.balance) - 
            AppState.transactionData.total
        ).toFixed(2);
        
        // Add transaction to history
        const tx = {
            id: generateTransactionId(),
            type: 'send',
            amount: AppState.transactionData.amount,
            recipient: AppState.transactionData.recipient,
            fee: AppState.transactionData.fee,
            timestamp: Date.now(),
            status: 'pending',
            hash: generateTransactionId()
        };
        
        AppState.walletData.transactions.unshift(tx);
        
        // Save wallet
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        // Clear form
        document.getElementById('recipient').value = '';
        document.getElementById('amount').value = '';
        
        showScreen('success-screen');
        
        // Update status after delay
        setTimeout(() => {
            tx.status = 'confirmed';
            localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
            updateTransactionStatus();
        }, 3000);
        
    } catch (error) {
        showToast('Transaction failed', 'error');
    }
}

function simulateBlockchainTransaction() {
    return new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });
}

function updateTransactionStatus() {
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge && statusBadge.classList.contains('pending')) {
        statusBadge.classList.remove('pending');
        statusBadge.classList.add('confirmed');
        statusBadge.innerHTML = '<div class="status-dot"></div>Confirmed';
        showToast('Transaction confirmed!', 'success');
    }
}

function viewTransaction() {
    const txId = AppState.walletData.transactions[0].hash;
    window.open(`${NETWORK_CONFIG.explorer}/tx/${txId}`, '_blank');
}

function copyTxHash() {
    const txHash = AppState.walletData.transactions[0].hash;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(txHash).then(() => {
            showToast('Transaction ID copied', 'success');
        });
    }
}

// Receive functions with QR code
function generateQRCode() {
    // In a real app, use a QR code library
    // For now, display the address
    const addressElement = document.getElementById('wallet-address');
    if (addressElement && AppState.walletData) {
        addressElement.textContent = AppState.walletData.address;
    }
}

function copyAddress() {
    const address = AppState.walletData.address;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address).then(() => {
            showToast('Address copied to clipboard', 'success');
        });
    } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Address copied to clipboard', 'success');
    }
}

function shareAddress() {
    const address = AppState.walletData.address;
    
    if (navigator.share) {
        navigator.share({
            title: 'My CTC Address',
            text: `Send CTC to: ${address}`,
            url: `ctc:${address}`
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
    // TODO: Implement amount request feature
    showToast('Amount request feature coming soon', 'info');
}

function scanQRCode() {
    // TODO: Implement QR scanner
    showToast('QR scanner coming soon', 'info');
}

// Settings functions
function toggleBiometric() {
    const toggle = document.getElementById('biometric-toggle');
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        
        AppState.walletData.settings.biometric = isActive;
        localStorage.setItem('ctc_wallet', JSON.stringify(AppState.walletData));
        
        showToast(isActive ? 'Biometric enabled' : 'Biometric disabled', 'success');
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

function showSeedPhrase() {
    if (confirm('Are you sure you want to view your recovery phrase? Make sure no one is watching.')) {
        // TODO: Show seed phrase screen
        showToast('Recovery phrase viewing coming soon', 'info');
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

// Dashboard updates
function updateDashboard() {
    if (!AppState.walletData) return;
    
    // Update balance
    const balanceEl = document.querySelector('.portfolio-balance');
    const valueEl = document.querySelector('.portfolio-value');
    
    if (balanceEl && valueEl) {
        const usdValue = (parseFloat(AppState.walletData.balance) * AppState.marketData.CTC.price).toFixed(2);
        balanceEl.textContent = `$${formatNumber(usdValue)}`;
        valueEl.textContent = `${formatNumber(AppState.walletData.balance)} CTC`;
    }
    
    // Update change
    const changeEl = document.querySelector('.portfolio-change span:nth-child(2)');
    if (changeEl) {
        const change = (parseFloat(AppState.walletData.balance) * AppState.marketData.CTC.price * 0.125).toFixed(2);
        changeEl.textContent = `+$${formatNumber(change)} (${AppState.marketData.CTC.change24h}%)`;
    }
    
    // Update assets
    updateAssetList();
    
    // Update transactions
    updateTransactionList();
}

function updateAssetList() {
    // Asset list is static in this version
    // In a real app, would fetch from blockchain
}

function updateTransactionList() {
    const txContainer = document.querySelector('.transaction-list');
    if (!txContainer) return;
    
    if (AppState.walletData.transactions.length === 0) {
        txContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-title">No transactions yet</div>
                <div class="empty-subtitle">Your transaction history will appear here</div>
            </div>
        `;
    } else {
        txContainer.innerHTML = AppState.walletData.transactions.slice(0, 5).map(tx => `
            <div class="transaction-item" onclick="viewTransactionDetails('${tx.id}')">
                <div class="transaction-icon ${tx.type}">
                    ${getTransactionIcon(tx.type)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${getTransactionTitle(tx.type)}</div>
                    <div class="transaction-subtitle">
                        ${tx.type === 'send' ? 'To' : tx.type === 'receive' ? 'From' : ''} 
                        ${tx.recipient || tx.sender ? formatAddress(tx.recipient || tx.sender) : tx.type}
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="transaction-value ${tx.type === 'receive' ? 'change-positive' : ''}">
                        ${tx.type === 'receive' ? '+' : '-'}${tx.amount} CTC
                    </div>
                    <div class="transaction-time">${formatTime(tx.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
}

// Markets update
function updateMarkets() {
    const marketList = document.querySelector('.market-list');
    if (!marketList) return;
    
    const markets = Object.entries(AppState.marketData).map(([symbol, data], index) => `
        <div class="market-item" onclick="viewMarketDetails('${symbol}')">
            <div class="market-position">${index + 1}</div>
            <div class="market-asset">
                <div class="asset-icon ${symbol === 'CTC' ? '' : 'token'}">${symbol}</div>
                <div class="asset-info">
                    <div class="asset-name">${symbol}</div>
                    <div class="asset-symbol">${getTokenName(symbol)}</div>
                </div>
            </div>
            <div class="market-chart">
                ${generateSparkline(data.chart, data.change24h >= 0)}
            </div>
            <div class="market-price">
                <div class="price-value">$${formatPrice(data.price)}</div>
                <div class="price-change ${data.change24h >= 0 ? 'change-positive' : 'change-negative'}">
                    ${data.change24h >= 0 ? '+' : ''}${data.change24h}%
                </div>
            </div>
        </div>
    `).join('');
    
    marketList.innerHTML = markets;
}

// Explore/DeFi updates
function updateExplore() {
    // Update APY rates
    updateDeFiRates();
}

function updateDeFiRates() {
    // In a real app, fetch from smart contracts
    const stakingAPY = 12.5;
    const liquidityAPR = 24.8;
    const lendingAPY = 8.2;
    
    // Update UI elements
    const stakingCard = document.querySelector('.service-card:nth-child(1) .service-apy');
    if (stakingCard) stakingCard.textContent = `${stakingAPY}% APY`;
}

// Settings update
function updateSettings() {
    // Update toggle states
    const biometricToggle = document.getElementById('biometric-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    
    if (biometricToggle && AppState.walletData) {
        biometricToggle.classList.toggle('active', AppState.walletData.settings.biometric);
    }
    
    if (notificationsToggle && AppState.walletData) {
        notificationsToggle.classList.toggle('active', AppState.walletData.settings.notifications);
    }
}

// Helper functions
function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
}

function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

function formatPrice(price) {
    if (price >= 1000) {
        return formatNumber(price);
    } else if (price >= 1) {
        return price.toFixed(2);
    } else {
        return price.toFixed(6);
    }
}

function getTokenName(symbol) {
    const names = {
        CTC: 'Community Trust',
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        USDT: 'Tether'
    };
    return names[symbol] || symbol;
}

function getTransactionIcon(type) {
    const icons = {
        send: '↑',
        receive: '↓',
        swap: '⇄',
        stake: '%'
    };
    return icons[type] || '•';
}

function getTransactionTitle(type) {
    const titles = {
        send: 'Sent',
        receive: 'Received',
        swap: 'Swapped',
        stake: 'Staked'
    };
    return titles[type] || type;
}

// Chart functions
function generateMockChart() {
    const points = [];
    let value = 100;
    
    for (let i = 0; i < 20; i++) {
        value += (Math.random() - 0.5) * 10;
        points.push(Math.max(0, value));
    }
    
    return points;
}

function generateSparkline(data, isPositive) {
    const width = 60;
    const height = 30;
    const points = data.slice(-10);
    
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    const pathData = points.map((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - ((point - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const color = isPositive ? '#00FF88' : '#FF3B3B';
    
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
            <path d="${pathData}" stroke="${color}" stroke-width="2" fill="none"/>
        </svg>
    `;
}

function renderPortfolioChart() {
    const canvas = document.getElementById('portfolio-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    
    // Scale for retina displays
    ctx.scale(2, 2);
    
    // Generate data
    const data = generatePortfolioData();
    
    // Draw chart
    drawGradientArea(ctx, data, width / 2, height / 2);
}

function generatePortfolioData() {
    const points = [];
    const baseValue = parseFloat(AppState.walletData.balance) * AppState.marketData.CTC.price;
    
    for (let i = 0; i < 30; i++) {
        const variation = (Math.random() - 0.5) * 0.1;
        points.push(baseValue * (1 + variation));
    }
    
    return points;
}

function drawGradientArea(ctx, data, width, height) {
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    
    // Find min/max
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    // Draw area
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + (1 - (point - min) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    // Complete the area
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    
    // Fill
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + (1 - (point - min) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Real-time updates
function startMarketUpdates() {
    // Simulate real-time price updates
    setInterval(() => {
        Object.keys(AppState.marketData).forEach(symbol => {
            const change = (Math.random() - 0.5) * 0.1;
            const data = AppState.marketData[symbol];
            
            data.price *= (1 + change / 100);
            data.change24h += change;
            data.chart.push(data.chart[data.chart.length - 1] * (1 + change / 100));
            data.chart.shift();
        });
        
        // Update UI if on relevant screen
        if (AppState.currentScreen === 'dashboard-screen') {
            updateDashboard();
        } else if (AppState.currentScreen === 'markets-screen') {
            updateMarkets();
        }
    }, 5000);
}

// Event listeners
function initializeEventListeners() {
    // Amount input
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', updateAmountConversion);
    }
    
    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn, .pin-key, .action-button').forEach(elem => {
        elem.addEventListener('click', createRipple);
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Touch handlers for gestures
function initializeTouchHandlers() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipeGesture();
    }, { passive: true });
    
    function handleSwipeGesture() {
        const swipeThreshold = 50;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0 && AppState.currentScreen !== 'dashboard-screen') {
                // Swipe right - go back
                const backButton = document.querySelector('.header-action');
                if (backButton && backButton.onclick) {
                    backButton.onclick();
                }
            }
        }
    }
}

// Animations
function initializeAnimations() {
    // Add CSS classes for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

function animateScreenEntry(screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    
    // Animate elements with delays
    const animatedElements = screen.querySelectorAll('.fade-in, .slide-up, .scale-in');
    animatedElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 50}ms`;
    });
}

// Ripple effect
function createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    ripple.style.top = `${e.clientY - button.offsetTop - radius}px`;
    ripple.classList.add('ripple');
    
    // Add styles
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Search functionality
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    // Implement search logic
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                showScreen('send-screen');
                break;
            case 'r':
                e.preventDefault();
                showScreen('receive-screen');
                break;
            case '/':
                e.preventDefault();
                document.querySelector('.search-input')?.focus();
                break;
        }
    }
}

// Theme management
function applyTheme() {
    const theme = AppState.walletData?.settings?.theme || 'dark';
    document.body.className = `theme-${theme}`;
}

// Toast notifications with modern design
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.querySelector('.toast-icon');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast show toast-${type}`;
        
        // Update icon based on type
        const icons = {
            success: `<path d="M9 11l3 3L22 4"/>`,
            error: `<path d="M6 6l12 12M6 18L18 6"/>`,
            info: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>`,
            warning: `<path d="M12 9v4m0 4h.01M12 2l10 20H2z"/>`
        };
        
        if (toastIcon) {
            toastIcon.innerHTML = icons[type] || icons.info;
        }
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// PWA Installation
function checkPWAInstall() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install prompt
        showPWAInstallPrompt(deferredPrompt);
    });
    
    // Handle iOS standalone mode
    if (window.navigator.standalone) {
        document.body.classList.add('standalone');
    }
}

function showPWAInstallPrompt(deferredPrompt) {
    // Create custom install banner
    // Implementation depends on design requirements
}

// Network status monitoring
window.addEventListener('online', () => {
    showToast('Connected to network', 'success');
});

window.addEventListener('offline', () => {
    showToast('No internet connection', 'error');
});

// Prevent pull-to-refresh on iOS
let lastY = 0;
document.addEventListener('touchstart', (e) => {
    lastY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    if (scrollTop === 0 && y > lastY) {
        e.preventDefault();
    }
}, { passive: false });

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
window.showSeedPhrase = showSeedPhrase;
window.editProfile = editProfile;
window.showSupport = showSupport;
window.logout = logout;
window.copySeedPhrase = copySeedPhrase;
window.confirmSeedPhrase = confirmSeedPhrase;
window.copyTxHash = copyTxHash;
window.showContacts = () => showToast('Contacts feature coming soon', 'info');
window.showFeeOptions = () => showToast('Custom fee settings coming soon', 'info');
window.viewTransactionDetails = (id) => showToast(`Transaction details: ${id.slice(0, 10)}...`, 'info');
window.viewMarketDetails = (symbol) => showToast(`${symbol} market details coming soon`, 'info');

console.log('CTC Wallet v2.0 - Professional Edition initialized');
