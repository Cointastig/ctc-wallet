// js/utils/api.js - FIXED API Service für CTC Blockchain

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3001'; // Standard-Port aus main.go
        this.timeout = 10000; // 10 Sekunden timeout
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 Sekunde
        
        console.log('🌐 API Service initialized with base URL:', this.baseURL);
    }

    // HTTP Request mit Retry-Logic
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`🔄 API Request (attempt ${attempt}): ${config.method || 'GET'} ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                let data;
                
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
                
                console.log(`✅ API Response: ${endpoint}`, data);
                return data;
                
            } catch (error) {
                console.error(`❌ API Request failed (attempt ${attempt}):`, error.message);
                
                if (attempt === this.retryAttempts) {
                  throw error;
                }
                
                // Exponential backoff
                await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
            }
        }
    }

    // Balance für Adresse abrufen
    async getBalance(address) {
        try {
            if (!address) {
                throw new Error('Address is required');
            }
            
            const balance = await this.request(`/balance/${address}`);
            const balanceValue = parseInt(balance) || 0;
            
            console.log(`💰 Balance for ${address}: ${balanceValue} micro-CTC`);
            return balanceValue;
            
        } catch (error) {
            console.error('❌ Failed to get balance:', error);
            return 0; // Fallback to 0 bei Fehler
        }
    }

    // UTXOs für Adresse abrufen
    async getUTXOs(address) {
        try {
            if (!address) {
                throw new Error('Address is required');
            }
            
            const utxos = await this.request(`/utxos/${address}`);
            return Array.isArray(utxos) ? utxos : [];
            
        } catch (error) {
            console.error('❌ Failed to get UTXOs:', error);
            return [];
        }
    }

    // Transaction History abrufen
    async getTransactionHistory(address) {
        try {
            if (!address) {
                throw new Error('Address is required');
            }
            
            const history = await this.request(`/history/${address}`);
            return Array.isArray(history) ? history : [];
            
        } catch (error) {
            console.error('❌ Failed to get transaction history:', error);
            return [];
        }
    }

    // Staked Balance abrufen (NEUE FUNKTION FÜR STAKING)
    async getStakedBalance(address) {
        try {
            if (!address) {
                throw new Error('Address is required');
            }
            
            const staked = await this.request(`/stake/${address}`);
            const stakedValue = parseInt(staked) || 0;
            
            console.log(`🔒 Staked balance for ${address}: ${stakedValue} micro-CTC`);
            return stakedValue;
            
        } catch (error) {
            console.error('❌ Failed to get staked balance:', error);
            return 0;
        }
    }

    // Fee Estimation abrufen (NEUE FUNKTION FÜR STAKING)
    async getFeeEstimate() {
        try {
            const estimate = await this.request('/fee-estimate');
            
            // Return the fee structure or default values
            if (typeof estimate === 'object' && estimate.feePerByte) {
                return estimate;
            } else {
                return { feePerByte: 1000 }; // Default fee fallback
            }
            
        } catch (error) {
            console.error('❌ Failed to get fee estimate:', error);
            return { feePerByte: 1000 }; // Default fee
        }
    }

    // Transaction senden
    async sendTransaction(transaction) {
        try {
            if (!transaction) {
                throw new Error('Transaction is required');
            }
            
            console.log('📤 Sending transaction:', transaction);
            
            const response = await this.request('/transaction', {
                method: 'POST',
                body: JSON.stringify(transaction)
            });
            
            console.log('✅ Transaction sent successfully:', response);
            return response;
            
        } catch (error) {
            console.error('❌ Failed to send transaction:', error);
            throw error;
        }
    }

    // Blockchain Info abrufen
    async getChainInfo() {
        try {
            const chain = await this.request('/chain');
            return {
                height: Array.isArray(chain) ? chain.length : 0,
                lastBlock: Array.isArray(chain) && chain.length > 0 ? chain[chain.length - 1] : null,
                blocks: Array.isArray(chain) ? chain : []
            };
        } catch (error) {
            console.error('❌ Failed to get chain info:', error);
            return {
                height: 0,
                lastBlock: null,
                blocks: []
            };
        }
    }

    // Node-Status prüfen
    async checkNodeStatus() {
        try {
            const chainInfo = await this.getChainInfo();
            return {
                online: true,
                height: chainInfo.height,
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Node appears to be offline:', error);
            return {
                online: false,
                height: 0,
                lastUpdate: new Date().toISOString(),
                error: error.message
            };
        }
    }

    // Utility: Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Format functions
    formatCTC(microCTC) {
        const CTC = microCTC / 100_000_000;
        return parseFloat(CTC.toFixed(8));
    }

    formatMicroCTC(CTC) {
        return Math.floor(CTC * 100_000_000);
    }

    // Address validation
    isValidAddress(address) {
        return address && 
               typeof address === 'string' && 
               address.startsWith('CTC') && 
               address.length >= 20;
    }

    // Transaction validation
    validateTransaction(tx) {
        const required = ['Type', 'From', 'To', 'Amount', 'PubKey', 'Signature'];
        
        for (const field of required) {
            if (!tx[field] && tx[field] !== 0) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        if (!this.isValidAddress(tx.To)) {
            throw new Error('Invalid recipient address');
        }
        
        if (tx.Amount <= 0) {
            throw new Error('Amount must be positive');
        }
        
        return true;
    }

    // Base URL setzen
    setBaseURL(url) {
        this.baseURL = url;
        console.log('🔄 API base URL updated:', this.baseURL);
    }

    // Debug: Ping-Test
    async ping() {
        try {
            const start = Date.now();
            await this.request('/chain');
            const duration = Date.now() - start;
            console.log(`🏓 Ping successful: ${duration}ms`);
            return { success: true, duration };
        } catch (error) {
            console.log('🏓 Ping failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Globale API-Instanz
window.API = new APIService();

console.log('📡 API Service loaded successfully');
