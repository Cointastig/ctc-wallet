// js/utils/api.js - API Communication

class CTCApi {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.timeout = 10000; // 10 seconds timeout
    }

    // Generic request method with timeout
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Try to parse JSON, fallback to text
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Get wallet balance
    async getBalance(address) {
        try {
            const balanceText = await this.get(`/balance/${address}`);
            const balanceMicro = parseInt(balanceText);
            const balanceCTC = balanceMicro / 100000000; // Convert from micro-CTC to CTC
            return balanceCTC;
        } catch (error) {
            console.log('Node offline or balance fetch failed:', error.message);
            // Return mock balance for demo when node is offline
            return this.getMockBalance(address);
        }
    }

    // Mock balance for demo purposes
    getMockBalance(address) {
        // Generate deterministic mock balance based on address
        const hash = this.simpleHash(address);
        const mockBalance = ((hash % 10000) + 1000) / 100; // 10.00 to 109.99 CTC
        console.log(`Using mock balance: ${mockBalance} CTC`);
        return mockBalance;
    }

    // Simple hash function for mock data
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Get transaction history
    async getTransactionHistory(address) {
        try {
            const transactions = await this.get(`/history/${address}`);
            return Array.isArray(transactions) ? transactions : [];
        } catch (error) {
            console.log('Node offline or history fetch failed:', error.message);
            // Return mock transactions for demo when node is offline
            return this.getMockTransactions(address);
        }
    }

    // Mock transaction history for demo
    getMockTransactions(address) {
        const mockTxs = [
            {
                Transaction: {
                    Type: 'reward',
                    From: 'SYSTEM',
                    To: address,
                    Amount: 1000000000, // 10 CTC in micro-CTC
                    Timestamp: Date.now() - 86400000 // 1 day ago
                }
            },
            {
                Transaction: {
                    Type: 'transfer',
                    From: 'CTC1234567890abcdef123',
                    To: address,
                    Amount: 500000000, // 5 CTC in micro-CTC
                    Timestamp: Date.now() - 43200000 // 12 hours ago
                }
            }
        ];
        console.log('Using mock transaction history');
        return mockTxs;
    }

    // Send transaction
    async sendTransaction(fromAddress, toAddress, amount, privateKey) {
        try {
            // Convert amount to micro-CTC
            const amountMicro = Math.floor(amount * 100000000);
            
            const transactionData = {
                from: fromAddress,
                to: toAddress,
                amount: amountMicro,
                timestamp: Date.now()
            };
            
            // Here you would normally sign the transaction with the private key
            // For now, we'll just send the transaction data
            const result = await this.post('/transaction', transactionData);
            return result;
        } catch (error) {
            console.log('Node offline or send failed:', error.message);
            // Simulate successful send for demo when node is offline
            console.log('Simulating successful transaction send');
            return { 
                success: true, 
                txid: 'mock_tx_' + Date.now(),
                message: 'Transaction sent successfully (demo mode)'
            };
        }
    }

    // Get network info
    async getNetworkInfo() {
        try {
            const info = await this.get('/info');
            return info;
        } catch (error) {
            console.error('Error fetching network info:', error);
            return null;
        }
    }

    // Get node status
    async getNodeStatus() {
        try {
            const status = await this.get('/status');
            return status;
        } catch (error) {
            console.error('Error fetching node status:', error);
            return { online: false };
        }
    }

    // Check if node is online
    async isNodeOnline() {
        try {
            // Use /balance with dummy address as ping alternative
            await this.get('/balance/CTCtest123456789012345');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get current CTC price (mock for now)
    async getPrice() {
        try {
            // Mock price - in a real app, this would fetch from an exchange API
            return {
                usd: 0.05,
                change24h: 2.5,
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('Error fetching price:', error);
            return { usd: 0.05, change24h: 0, lastUpdated: Date.now() };
        }
    }

    // Validate address format
    validateAddress(address) {
        return address && address.startsWith('CTC') && address.length === 24;
    }

    // Set new base URL
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    // Set request timeout
    setTimeout(timeout) {
        this.timeout = timeout;
    }
}

// Balance Manager
class BalanceManager {
    constructor(api) {
        this.api = api;
        this.updateInterval = null;
        this.listeners = [];
        this.currentBalance = 0;
        this.currentUsdValue = 0;
    }

    // Add balance update listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove balance update listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback(this.currentBalance, this.currentUsdValue);
        });
    }

    // Update balance for a specific address
    async updateBalance(address) {
        if (!address) return;

        try {
            const balance = await this.api.getBalance(address);
            const price = await this.api.getPrice();
            
            this.currentBalance = balance;
            this.currentUsdValue = balance * price.usd;
            
            this.notifyListeners();
            
            console.log(`Balance updated: ${balance} CTC ($${this.currentUsdValue.toFixed(2)})`);
            
        } catch (error) {
            console.error('Failed to update balance:', error);
        }
    }

    // Start automatic balance updates
    startAutoUpdate(address, intervalMs = 3000) {
        if (this.updateInterval) {
            this.stopAutoUpdate();
        }

        // Update immediately
        this.updateBalance(address);

        // Set up recurring updates
        this.updateInterval = setInterval(() => {
            this.updateBalance(address);
        }, intervalMs);

        console.log(`Balance auto-update started (every ${intervalMs}ms)`);
    }

    // Stop automatic balance updates
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Balance auto-update stopped');
        }
    }

    // Get current balance
    getCurrentBalance() {
        return this.currentBalance;
    }

    // Get current USD value
    getCurrentUsdValue() {
        return this.currentUsdValue;
    }
}

// Transaction Manager
class TransactionManager {
    constructor(api) {
        this.api = api;
        this.listeners = [];
        this.transactions = [];
    }

    // Add transaction update listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove transaction update listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback(this.transactions);
        });
    }

    // Load transaction history
    async loadTransactions(address) {
        if (!address) return;

        try {
            const transactions = await this.api.getTransactionHistory(address);
            this.transactions = transactions;
            this.notifyListeners();
            
            console.log(`Loaded ${transactions.length} transactions`);
            
        } catch (error) {
            console.error('Failed to load transactions:', error);
            this.transactions = [];
            this.notifyListeners();
        }
    }

    // Get all transactions
    getTransactions() {
        return this.transactions;
    }

    // Send a new transaction
    async sendTransaction(fromAddress, toAddress, amount, wallet) {
        try {
            // Validate inputs
            if (!this.api.validateAddress(toAddress)) {
                throw new Error('Invalid recipient address');
            }

            if (amount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            // Send transaction through API
            const result = await this.api.sendTransaction(fromAddress, toAddress, amount, wallet.privateKeyBytes);
            
            // Reload transactions after sending
            setTimeout(() => {
                this.loadTransactions(fromAddress);
            }, 1000);

            return result;
            
        } catch (error) {
            console.error('Failed to send transaction:', error);
            throw error;
        }
    }
}

// Create global API instance
let ctcApi, balanceManager, transactionManager;

// Initialize API components
function initializeAPI() {
    ctcApi = new CTCApi();
    balanceManager = new BalanceManager(ctcApi);
    transactionManager = new TransactionManager(ctcApi);
    
    // Export to global scope
    window.ctcApi = ctcApi;
    window.balanceManager = balanceManager;
    window.transactionManager = transactionManager;
    
    console.log('🔌 API components initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAPI);
} else {
    initializeAPI();
}
