// js/utils/api.js - CTC Blockchain API Interface with Blockchain Compatibility

// API-Konfiguration
const API_CONFIG = {
    // Standard Node-URL (kann geändert werden)
    DEFAULT_NODE_URL: 'http://localhost:3001',
    
    // Timeout-Konfiguration
    TIMEOUT: 30000, // 30 Sekunden
    
    // Retry-Konfiguration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 Sekunde
    
    // Endpoints
    ENDPOINTS: {
        BALANCE: '/balance/',
        UTXOS: '/utxos/',
        TRANSACTION: '/transaction',
        CHAIN: '/chain',
        HISTORY: '/history/',
        STAKE: '/stake/',
        FEE_ESTIMATE: '/fee-estimate'
    }
};

// CTC Blockchain API Client
class CTCApi {
    constructor(nodeUrl = null) {
        this.nodeUrl = nodeUrl || API_CONFIG.DEFAULT_NODE_URL;
        this.isOnline = true;
        this.lastError = null;
        
        // Netzwerk-Status überwachen
        this.setupNetworkMonitoring();
    }

    // Netzwerk-Monitoring
    setupNetworkMonitoring() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true;
                console.log('🌐 Network connection restored');
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
                console.log('📴 Network connection lost');
            });
        }
    }

    // HTTP-Request mit Retry-Logik
    async makeRequest(url, options = {}) {
        if (!this.isOnline) {
            throw new Error('No network connection available');
        }

        const defaultOptions = {
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const requestOptions = { ...defaultOptions, ...options };
        
        // Timeout-Controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        requestOptions.signal = controller.signal;

        for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
            try {
                console.log(`🌐 API Request (attempt ${attempt}): ${url}`);
                
                const response = await fetch(url, requestOptions);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Erfolgreiche Antwort
                this.lastError = null;
                return response;
                
            } catch (error) {
                clearTimeout(timeoutId);
                this.lastError = error;
                
                console.warn(`⚠️ API Request failed (attempt ${attempt}):`, error.message);
                
                // Bei letztem Versuch oder kritischen Fehlern nicht retry
                if (attempt === API_CONFIG.MAX_RETRIES || 
                    error.name === 'AbortError' || 
                    error.message.includes('404')) {
                    throw error;
                }
                
                // Warte vor erneutem Versuch
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
            }
        }
    }

    // Guthaben abfragen
    async getBalance(address) {
        try {
            if (!address || !address.startsWith('CTC')) {
                throw new Error('Invalid CTC address');
            }
            
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.BALANCE}${address}`;
            const response = await this.makeRequest(url);
            const balanceText = await response.text();
            
            const balance = parseInt(balanceText, 10);
            if (isNaN(balance)) {
                throw new Error('Invalid balance response');
            }
            
            console.log(`💰 Balance for ${address}: ${this.formatCTC(balance)}`);
            return balance;
            
        } catch (error) {
            console.error('❌ Error fetching balance:', error);
            throw new Error(`Failed to fetch balance: ${error.message}`);
        }
    }

    // UTXOs abfragen
    async getUTXOs(address) {
        try {
            if (!address || !address.startsWith('CTC')) {
                throw new Error('Invalid CTC address');
            }
            
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.UTXOS}${address}`;
            const response = await this.makeRequest(url);
            const utxos = await response.json();
            
            if (!Array.isArray(utxos)) {
                throw new Error('Invalid UTXOs response');
            }
            
            console.log(`📦 Found ${utxos.length} UTXOs for ${address}`);
            return utxos;
            
        } catch (error) {
            console.error('❌ Error fetching UTXOs:', error);
            throw new Error(`Failed to fetch UTXOs: ${error.message}`);
        }
    }

    // Transaktion senden
    async sendTransaction(transaction) {
        try {
            // Validiere Transaktion
            if (!transaction || !transaction.type || !transaction.from || !transaction.signature) {
                throw new Error('Invalid transaction structure');
            }
            
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.TRANSACTION}`;
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: JSON.stringify(transaction)
            });
            
            const result = await response.text();
            console.log('✅ Transaction sent successfully:', result);
            
            // Berechne TXID
            const txid = await this.calculateTXID(transaction);
            return { txid, result };
            
        } catch (error) {
            console.error('❌ Error sending transaction:', error);
            throw new Error(`Failed to send transaction: ${error.message}`);
        }
    }

    // Transaktionshistorie abfragen
    async getTransactionHistory(address) {
        try {
            if (!address || !address.startsWith('CTC')) {
                throw new Error('Invalid CTC address');
            }
            
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.HISTORY}${address}`;
            const response = await this.makeRequest(url);
            const history = await response.json();
            
            if (!Array.isArray(history)) {
                throw new Error('Invalid history response');
            }
            
            console.log(`📜 Found ${history.length} transactions for ${address}`);
            return history;
            
        } catch (error) {
            console.error('❌ Error fetching transaction history:', error);
            throw new Error(`Failed to fetch transaction history: ${error.message}`);
        }
    }

    // Gestaktes Guthaben abfragen
    async getStakedBalance(address) {
        try {
            if (!address || !address.startsWith('CTC')) {
                throw new Error('Invalid CTC address');
            }
            
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.STAKE}${address}`;
            const response = await this.makeRequest(url);
            const stakeText = await response.text();
            
            const staked = parseInt(stakeText, 10);
            if (isNaN(staked)) {
                throw new Error('Invalid stake response');
            }
            
            console.log(`🥩 Staked balance for ${address}: ${this.formatCTC(staked)}`);
            return staked;
            
        } catch (error) {
            console.error('❌ Error fetching staked balance:', error);
            throw new Error(`Failed to fetch staked balance: ${error.message}`);
        }
    }

    // Gebührenschätzung abfragen
    async getFeeEstimate() {
        try {
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.FEE_ESTIMATE}`;
            const response = await this.makeRequest(url);
            const feeData = await response.json();
            
            if (!feeData.feePerByte) {
                throw new Error('Invalid fee estimate response');
            }
            
            console.log(`💸 Current fee per byte: ${feeData.feePerByte} micro-CTC`);
            return feeData.feePerByte;
            
        } catch (error) {
            console.error('⚠️ Error fetching fee estimate, using fallback:', error);
            // Fallback zu Standardgebühr (identisch mit Go Code)
            return 10; // Standard FeePerByte aus Go Code
        }
    }

    // Blockchain-Status abfragen
    async getChainInfo() {
        try {
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.CHAIN}`;
            const response = await this.makeRequest(url);
            const chain = await response.json();
            
            if (!Array.isArray(chain)) {
                throw new Error('Invalid chain response');
            }
            
            const height = chain.length - 1;
            const lastBlock = chain[chain.length - 1];
            
            console.log(`⛓️ Blockchain height: ${height}`);
            return {
                height,
                lastBlock,
                totalBlocks: chain.length
            };
            
        } catch (error) {
            console.error('❌ Error fetching chain info:', error);
            throw new Error(`Failed to fetch chain info: ${error.message}`);
        }
    }

    // TXID berechnen (identisch mit Go Implementation)
    async calculateTXID(transaction) {
        try {
            const txData = JSON.stringify(transaction);
            const encoder = new TextEncoder();
            const data = encoder.encode(txData);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = new Uint8Array(hashBuffer);
            
            return Array.from(hashArray, byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
            
        } catch (error) {
            console.error('❌ Error calculating TXID:', error);
            return null;
        }
    }

    // CTC-Betrag formatieren (Micro-CTC zu CTC)
    formatCTC(microCTC) {
        const ctc = microCTC / 100_000_000;
        return `${ctc.toFixed(8)} CTC`;
    }

    // CTC-Betrag parsen (CTC zu Micro-CTC, identisch mit Go ParseCTC)
    parseCTC(ctcString) {
        try {
            const parts = ctcString.split('.');
            let whole = 0;
            let fractional = 0;
            
            switch (parts.length) {
                case 1:
                    whole = parseInt(parts[0], 10);
                    if (isNaN(whole)) {
                        throw new Error('Invalid whole number');
                    }
                    break;
                    
                case 2:
                    whole = parseInt(parts[0], 10);
                    if (isNaN(whole)) {
                        throw new Error('Invalid whole number');
                    }
                    
                    let fracStr = parts[1];
                    if (fracStr.length > 8) {
                        throw new Error('Too many decimal places (max 8 allowed)');
                    }
                    
                    // Rechts mit Nullen auffüllen
                    while (fracStr.length < 8) {
                        fracStr += '0';
                    }
                    
                    fractional = parseInt(fracStr, 10);
                    if (isNaN(fractional)) {
                        throw new Error('Invalid fractional part');
                    }
                    break;
                    
                default:
                    throw new Error('Invalid CTC format');
            }
            
            return whole * 100_000_000 + fractional;
            
        } catch (error) {
            throw new Error(`Failed to parse CTC amount: ${error.message}`);
        }
    }

    // Node-URL ändern
    setNodeUrl(newUrl) {
        this.nodeUrl = newUrl;
        console.log(`🔄 API node URL changed to: ${newUrl}`);
    }

    // Verbindungsstatus prüfen
    async testConnection() {
        try {
            const url = `${this.nodeUrl}${API_CONFIG.ENDPOINTS.FEE_ESTIMATE}`;
            const response = await this.makeRequest(url);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Netzwerk-Status
    getNetworkStatus() {
        return {
            online: this.isOnline,
            nodeUrl: this.nodeUrl,
            lastError: this.lastError?.message || null
        };
    }
}

// Enhanced Transaction Builder für CTC Transaktionen mit vollständiger Blockchain-Kompatibilität
class CTCTransactionBuilder {
    constructor(wallet, api) {
        this.wallet = wallet;
        this.api = api;
        
        // Konstanten aus Go Code
        this.DUST_LIMIT = 1000; // Micro-CTC
        this.MIN_FEE = 100;     // Mindestgebühr aus Go Code
    }

    // Transfer-Transaktion erstellen (FIX: Vollständige Blockchain-Kompatibilität)
    async createTransfer(toAddress, amount, priorityMultiplier = 1.0) {
        try {
            if (!toAddress || !toAddress.startsWith('CTC')) {
                throw new Error('Invalid recipient address');
            }

            const amountMicro = typeof amount === 'string' 
                ? this.api.parseCTC(amount) 
                : amount;

            if (amountMicro <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            // UTXOs abrufen
            const utxos = await this.api.getUTXOs(this.wallet.getAddress());
            
            // Inputs auswählen (verbesserter Algorithmus)
            const { inputs, totalInput } = this.selectInputs(utxos, amountMicro);
            
            if (totalInput < amountMicro) {
                throw new Error('Insufficient balance');
            }

            // Outputs erstellen
            const outputs = [{
                address: toAddress,
                amount: amountMicro
            }];

            // Wechselgeld berechnen
            const change = totalInput - amountMicro;
            if (change > this.DUST_LIMIT) { // FIX: Dust-Limit Validierung
                outputs.push({
                    address: this.wallet.getAddress(),
                    amount: change
                });
            }

            // Gebühr berechnen (identisch mit Go Implementation)
            const fee = await this.calculateFee('transfer', inputs, outputs, priorityMultiplier);
            
            // Gebühr von Wechselgeld abziehen oder Output anpassen
            if (change > this.DUST_LIMIT) {
                outputs[1].amount -= fee;
                if (outputs[1].amount < this.DUST_LIMIT) {
                    // Wechselgeld ist zu klein, entferne Output
                    outputs.pop();
                    // Prüfe ob genug für Transaktion + Gebühr
                    if (totalInput < amountMicro + fee) {
                        throw new Error('Insufficient funds for transaction fee');
                    }
                }
            } else {
                // Kein Wechselgeld-Output, reduziere Hauptoutput
                outputs[0].amount -= fee;
                if (outputs[0].amount <= 0) {
                    throw new Error('Insufficient funds for transaction fee');
                }
            }

            // FIX: Vollständige SignPayload-Struktur (identisch mit Go)
            const transaction = {
                type: 'transfer',
                from: this.wallet.getAddress(),
                to: toAddress,
                amount: amountMicro,
                pubKey: this.wallet.getPublicKey(),
                inputs: inputs,
                outputs: outputs,
                fee: fee,
                delegatedTo: null // FIX: Hinzugefügtes Feld für Go-Kompatibilität
            };

            // Signieren
            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            return transaction;

        } catch (error) {
            console.error('❌ Error creating transfer:', error);
            throw error;
        }
    }

    // FIX: Stake-Transaktion erstellen (neue Funktionalität)
    async createStake(validatorPubKey, amount, priorityMultiplier = 1.0) {
        try {
            if (!validatorPubKey) {
                throw new Error('Invalid validator public key');
            }

            const amountMicro = typeof amount === 'string' 
                ? this.api.parseCTC(amount) 
                : amount;

            if (amountMicro <= 0) {
                throw new Error('Stake amount must be greater than 0');
            }

            const utxos = await this.api.getUTXOs(this.wallet.getAddress());
            const { inputs, totalInput } = this.selectInputs(utxos, amountMicro);
            
            if (totalInput < amountMicro) {
                throw new Error('Insufficient balance for staking');
            }

            const outputs = [{
                address: validatorPubKey,
                amount: amountMicro
            }];

            const change = totalInput - amountMicro;
            if (change > this.DUST_LIMIT) {
                outputs.push({
                    address: this.wallet.getAddress(),
                    amount: change
                });
            }

            const fee = await this.calculateFee('stake', inputs, outputs, priorityMultiplier);
            
            // Gebühr von Wechselgeld abziehen
            if (change > this.DUST_LIMIT) {
                outputs[1].amount -= fee;
                if (outputs[1].amount < this.DUST_LIMIT) {
                    outputs.pop();
                    if (totalInput < amountMicro + fee) {
                        throw new Error('Insufficient funds for transaction fee');
                    }
                }
            }

            const transaction = {
                type: 'stake',
                from: this.wallet.getAddress(),
                to: validatorPubKey,
                amount: amountMicro,
                pubKey: this.wallet.getPublicKey(),
                inputs: inputs,
                outputs: outputs,
                fee: fee,
                delegatedTo: null
            };

            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            return transaction;

        } catch (error) {
            console.error('❌ Error creating stake:', error);
            throw error;
        }
    }

    // FIX: Unstake-Transaktion erstellen
    async createUnstake(validatorPubKey, amount, priorityMultiplier = 1.0) {
        try {
            const amountMicro = typeof amount === 'string' 
                ? this.api.parseCTC(amount) 
                : amount;

            const transaction = {
                type: 'unstake',
                from: this.wallet.getAddress(),
                to: validatorPubKey,
                amount: amountMicro,
                pubKey: this.wallet.getPublicKey(),
                inputs: [],
                outputs: [],
                fee: this.MIN_FEE,
                delegatedTo: null
            };

            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            return transaction;

        } catch (error) {
            console.error('❌ Error creating unstake:', error);
            throw error;
        }
    }

    // FIX: Delegate-Transaktion erstellen
    async createDelegate(validatorAddr, amount, priorityMultiplier = 1.0) {
        try {
            const amountMicro = typeof amount === 'string' 
                ? this.api.parseCTC(amount) 
                : amount;

            const transaction = {
                type: 'delegate',
                from: this.wallet.getAddress(),
                to: this.wallet.getAddress(),
                amount: amountMicro,
                pubKey: this.wallet.getPublicKey(),
                inputs: [],
                outputs: [],
                fee: this.MIN_FEE,
                delegatedTo: validatorAddr // FIX: Korrekte Verwendung des delegatedTo Feldes
            };

            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            return transaction;

        } catch (error) {
            console.error('❌ Error creating delegate:', error);
            throw error;
        }
    }

    // FIX: Undelegate-Transaktion erstellen
    async createUndelegate(validatorAddr, amount, priorityMultiplier = 1.0) {
        try {
            const amountMicro = typeof amount === 'string' 
                ? this.api.parseCTC(amount) 
                : amount;

            const transaction = {
                type: 'undelegate',
                from: this.wallet.getAddress(),
                to: this.wallet.getAddress(),
                amount: amountMicro,
                pubKey: this.wallet.getPublicKey(),
                inputs: [],
                outputs: [],
                fee: this.MIN_FEE,
                delegatedTo: validatorAddr
            };

            const signature = await this.signTransaction(transaction);
            transaction.signature = signature;

            return transaction;

        } catch (error) {
            console.error('❌ Error creating undelegate:', error);
            throw error;
        }
    }

    // FIX: Verbesserter Input-Auswahl-Algorithmus (identisch mit Go)
    selectInputs(utxos, targetAmount) {
        if (!utxos || utxos.length === 0) {
            throw new Error('No UTXOs available');
        }

        // Sortiere UTXOs nach Betrag (größte zuerst) - Greedy-Algorithmus
        const sortedUtxos = [...utxos].sort((a, b) => b.amount - a.amount);
        const inputs = [];
        let totalInput = 0;

        for (const utxo of sortedUtxos) {
            inputs.push({
                txId: utxo.txId,
                index: utxo.index,
                address: utxo.address,
                amount: utxo.amount
            });
            totalInput += utxo.amount;
            
            // Beende sobald genug Inputs vorhanden sind
            if (totalInput >= targetAmount) {
                break;
            }
        }

        return { inputs, totalInput };
    }

    // FIX: Korrekte Gebühr berechnen (identisch mit Go Implementation)
    async calculateFee(txType, inputs, outputs, priorityMultiplier) {
        try {
            const feePerByte = await this.api.getFeeEstimate();
            
            // Transaktionsgröße schätzen (ähnlich wie in Go)
            const baseSize = 128;
            const inputSize = inputs.length * 128;
            const outputSize = outputs.length * 64;
            const totalSize = baseSize + inputSize + outputSize;
            
            const baseFee = totalSize * feePerByte;
            
            let finalFee = Math.max(baseFee, this.MIN_FEE); // MinFee aus Go Code
            finalFee = Math.floor(finalFee * priorityMultiplier);
            
            return finalFee;
            
        } catch (error) {
            console.error('❌ Error calculating fee:', error);
            return this.MIN_FEE * priorityMultiplier; // Fallback-Gebühr
        }
    }

    // FIX: Korrigierte Transaktions-Signierung (identisch mit Go SignPayload)
    async signTransaction(transaction) {
        try {
            // SignPayload erstellen (identisch mit Go)
            const payload = {
                type: transaction.type,
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                inputs: transaction.inputs,
                outputs: transaction.outputs,
                fee: transaction.fee
            };

            // FIX: delegatedTo nur hinzufügen wenn gesetzt (wie in Go)
            if (transaction.delegatedTo) {
                payload.delegatedTo = transaction.delegatedTo;
            }

            const payloadJson = JSON.stringify(payload);
            return await this.wallet.sign(payloadJson);

        } catch (error) {
            console.error('❌ Error signing transaction:', error);
            throw new Error('Failed to sign transaction');
        }
    }

    // Validiere Transaktion vor dem Senden
    validateTransaction(transaction) {
        const errors = [];

        // Basis-Validierung
        if (!transaction.type || !['transfer', 'stake', 'unstake', 'delegate', 'undelegate'].includes(transaction.type)) {
            errors.push('Invalid transaction type');
        }

        if (!transaction.from || !transaction.from.startsWith('CTC')) {
            errors.push('Invalid from address');
        }

        if (!transaction.to || !transaction.to.startsWith('CTC')) {
            errors.push('Invalid to address');
        }

        if (!transaction.amount || transaction.amount <= 0) {
            errors.push('Invalid amount');
        }

        if (!transaction.signature) {
            errors.push('Transaction not signed');
        }

        // UTXO-Validierung für Transfer/Stake
        if (['transfer', 'stake'].includes(transaction.type)) {
            if (!transaction.inputs || transaction.inputs.length === 0) {
                errors.push('No inputs provided');
            }

            if (!transaction.outputs || transaction.outputs.length === 0) {
                errors.push('No outputs provided');
            }

            // Dust-Limit Validierung
            for (const output of transaction.outputs) {
                if (output.amount < this.DUST_LIMIT) {
                    errors.push(`Output amount ${output.amount} below dust limit ${this.DUST_LIMIT}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Globale API-Instanz
let globalApi = null;

// Utility-Funktionen
const ApiUtils = {
    // Globale API-Instanz initialisieren
    init(nodeUrl = null) {
        globalApi = new CTCApi(nodeUrl);
        return globalApi;
    },

    // Globale API-Instanz abrufen
    getInstance() {
        if (!globalApi) {
            globalApi = new CTCApi();
        }
        return globalApi;
    },

    // Transaction Builder erstellen
    createTransactionBuilder(wallet) {
        const api = this.getInstance();
        return new CTCTransactionBuilder(wallet, api);
    },

    // FIX: ParseCTC als globale Utility-Funktion
    parseCTC(ctcString) {
        const api = this.getInstance();
        return api.parseCTC(ctcString);
    },

    // Format CTC als globale Utility-Funktion
    formatCTC(microCTC) {
        const api = this.getInstance();
        return api.formatCTC(microCTC);
    }
};

// Export für globale Verwendung
window.CTCApi = CTCApi;
window.CTCTransactionBuilder = CTCTransactionBuilder;
window.ApiUtils = ApiUtils;
window.API_CONFIG = API_CONFIG;
