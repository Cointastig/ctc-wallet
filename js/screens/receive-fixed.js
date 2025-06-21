// js/screens/receive-fixed.js - Receive Screen with Fixed QR Generator

class ReceiveScreen {
    constructor() {
        this.currentAddress = '';
    }

    // Show receive screen
    show() {
        const wallet = walletScreen.getCurrentWallet();
        if (!wallet) {
            Toast.error('Wallet not initialized');
            return;
        }

        this.currentAddress = wallet.address;
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Receive CTC</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <!-- QR Code Section -->
                <div class="qr-section">
                    <div class="qr-placeholder">
                        <div class="qr-code-container" id="qr-code-container">
                            <canvas id="address-qr-code" style="border-radius: 12px;"></canvas>
                        </div>
                        <div id="qr-loading" style="display: none; text-align: center; padding: 60px; color: #666;">
                            <div class="loading" style="margin: 0 auto 20px;"></div>
                            <div>Generiere QR-Code...</div>
                        </div>
                        <div id="qr-error" style="display: none; text-align: center; padding: 60px; color: #ff6b6b;">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 20px; opacity: 0.5;">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" x2="9" y1="9" y2="15"/>
                                <line x1="9" x2="15" y1="9" y2="15"/>
                            </svg>
                            <div>QR-Code konnte nicht generiert werden</div>
                            <button onclick="receiveScreen.regenerateQR()" style="margin-top: 16px; padding: 8px 16px; background: #ff6b6b; border: none; border-radius: 8px; color: white; cursor: pointer;">
                                Erneut versuchen
                            </button>
                        </div>
                    </div>
                    
                    <h3 style="color: white; margin-bottom: 20px; text-align: center;">Your CTC Address</h3>
                    
                    <div class="address-display">
                        <div class="address-text">${this.currentAddress}</div>
                    </div>
                    
                    <button onclick="receiveScreen.copyAddress()" class="btn btn-primary" style="margin-bottom: 20px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                        Copy Address
                    </button>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 30px;">
                        <button onclick="receiveScreen.shareAddress()" class="btn btn-secondary" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16,6 12,2 8,6"/>
                                <line x1="12" x2="12" y1="2" y2="15"/>
                            </svg>
                            Share
                        </button>
                        <button onclick="receiveScreen.saveQRCode()" class="btn btn-secondary" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" x2="12" y1="15" y2="3"/>
                            </svg>
                            Save QR
                        </button>
                    </div>
                    
                    <!-- Request Amount Section -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M16 8l-4 4-4-4"/>
                            </svg>
                            Request Specific Amount
                        </h3>
                        <div class="input-group">
                            <input 
                                type="number" 
                                id="request-amount" 
                                class="input-field" 
                                placeholder="0.0000" 
                                step="0.0001"
                                oninput="receiveScreen.updatePaymentQR()"
                            >
                            <div class="input-help">Optional: Enter amount to create payment request QR</div>
                        </div>
                        
                        <div class="input-group">
                            <input 
                                type="text" 
                                id="request-note" 
                                class="input-field" 
                                placeholder="Payment note (optional)" 
                                maxlength="100"
                                oninput="receiveScreen.updatePaymentQR()"
                            >
                            <div class="input-help">Add a note for the payment request</div>
                        </div>
                        
                        <div id="payment-qr-container" style="display: none;">
                            <div style="text-align: center; margin: 20px 0;">
                                <h4 style="color: white; margin-bottom: 16px;">Payment Request QR Code</h4>
                                <div style="background: white; border-radius: 12px; padding: 16px; display: inline-block;">
                                    <canvas id="payment-qr-code"></canvas>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 16px;">
                                <label style="color: rgba(255,255,255,0.6); font-size: 14px;">Payment Link:</label>
                                <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-top: 8px; word-break: break-all;">
                                    <code id="payment-link" style="color: #00D4FF; font-size: 12px;"></code>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 12px;">
                                <button onclick="receiveScreen.copyPaymentLink()" class="btn btn-ghost btn-small" style="flex: 1;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                    Copy Link
                                </button>
                                <button onclick="receiveScreen.savePaymentQR()" class="btn btn-ghost btn-small" style="flex: 1;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" x2="12" y1="15" y2="3"/>
                                    </svg>
                                    Save QR
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <path d="M12 17h.01"/>
                            </svg>
                            How to Receive CTC
                        </h3>
                        <ul style="color: rgba(255,255,255,0.8); margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Share your CTC address or show the QR code to the sender</li>
                            <li>QR codes can be scanned by most CTC wallets</li>
                            <li>Payment request QR codes include the amount automatically</li>
                            <li>Transactions will appear in your wallet automatically</li>
                            <li>Network confirmations typically take 30-60 seconds</li>
                        </ul>
                    </div>
                    
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px; text-align: center; margin-top: 30px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/>
                        </svg>
                        This address can be used multiple times safely
                    </p>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        
        // Generate QR code after content is loaded
        setTimeout(() => {
            this.generateAddressQR();
        }, 100);

        // Update app current screen
        if (window.app) {
            window.app.setCurrentScreen('receive');
        }
    }

    // Generate QR code for address
    async generateAddressQR() {
        try {
            const container = DOM.get('qr-code-container');
            const loading = DOM.get('qr-loading');
            const error = DOM.get('qr-error');
            
            // Show loading
            DOM.hide(container);
            DOM.hide(error);
            DOM.show(loading);
            
            // Wait for QR library to be ready
            if (!window.QRious) {
                throw new Error('QR code library not loaded');
            }
            
            // Generate QR code using global qrGenerator
            await Utils.sleep(300); // Small delay for better UX
            
            const success = window.qrGenerator.generateAddressQR(this.currentAddress, 'address-qr-code', 200);
            
            if (success) {
                DOM.hide(loading);
                DOM.hide(error);
                DOM.show(container);
                console.log('✅ Address QR code generated successfully');
            } else {
                throw new Error('QR generation failed');
            }
            
        } catch (error) {
            console.error('❌ Error generating address QR code:', error);
            
            const container = DOM.get('qr-code-container');
            const loading = DOM.get('qr-loading');
            const errorDiv = DOM.get('qr-error');
            
            DOM.hide(container);
            DOM.hide(loading);
            DOM.show(errorDiv);
            
            Toast.error('Failed to generate QR code');
        }
    }

    // Regenerate QR code
    async regenerateQR() {
        await this.generateAddressQR();
    }

    // Update payment request QR code
    async updatePaymentQR() {
        const amount = parseFloat(DOM.getValue('request-amount')) || 0;
        const note = DOM.getValue('request-note').trim();
        const container = DOM.get('payment-qr-container');
        const linkElement = DOM.get('payment-link');
        
        if (amount > 0 || note) {
            try {
                // Generate payment QR code using global qrGenerator
                const paymentUri = window.qrGenerator.generatePaymentQR(
                    this.currentAddress, 
                    amount, 
                    'payment-qr-code', 
                    180
                );
                
                if (paymentUri) {
                    // Add note to URI if provided
                    let finalUri = paymentUri;
                    if (note) {
                        const separator = finalUri.includes('?') ? '&' : '?';
                        finalUri += `${separator}note=${encodeURIComponent(note)}`;
                    }
                    
                    linkElement.textContent = finalUri;
                    DOM.show(container);
                } else {
                    DOM.hide(container);
                }
                
            } catch (error) {
                console.error('Error generating payment QR:', error);
                DOM.hide(container);
                Toast.error('Failed to generate payment QR code');
            }
        } else {
            DOM.hide(container);
        }
    }

    // Copy address to clipboard
    async copyAddress() {
        try {
            const success = await Utils.copyToClipboard(this.currentAddress);
            if (success) {
                Toast.success('Address copied to clipboard');
            } else {
                Toast.error('Failed to copy address');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Failed to copy address');
        }
    }

    // Share address using Web Share API or fallback
    async shareAddress() {
        const shareData = {
            title: 'CTC Wallet Address',
            text: `Send CTC to this address: ${this.currentAddress}`,
            url: `ctc:${this.currentAddress}`
        };

        try {
            if (navigator.share && Utils.isTelegramWebApp()) {
                await navigator.share(shareData);
                Toast.success('Address shared');
            } else {
                // Fallback to copying
                await this.copyAddress();
            }
        } catch (error) {
            console.error('Share error:', error);
            // Fallback to copying
            await this.copyAddress();
        }
    }

    // Save QR code as image
    async saveQRCode() {
        try {
            // Get QR code as blob using global qrGenerator
            const blob = await window.qrGenerator.exportQRAsBlob('address-qr-code');
            
            if (blob) {
                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ctc-address-qr-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                Toast.success('QR code saved successfully');
            } else {
                throw new Error('Failed to export QR code');
            }
            
        } catch (error) {
            console.error('Error saving QR code:', error);
            Toast.error('Failed to save QR code');
        }
    }

    // Copy payment link to clipboard
    async copyPaymentLink() {
        const linkElement = DOM.get('payment-link');
        if (!linkElement) return;
        
        const paymentLink = linkElement.textContent;
        
        try {
            const success = await Utils.copyToClipboard(paymentLink);
            if (success) {
                Toast.success('Payment link copied to clipboard');
            } else {
                Toast.error('Failed to copy payment link');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Failed to copy payment link');
        }
    }

    // Save payment QR code as image
    async savePaymentQR() {
        try {
            // Get payment QR code as blob using global qrGenerator
            const blob = await window.qrGenerator.exportQRAsBlob('payment-qr-code');
            
            if (blob) {
                const amount = parseFloat(DOM.getValue('request-amount')) || 0;
                const filename = `ctc-payment-qr-${amount}ctc-${Date.now()}.png`;
                
                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                Toast.success('Payment QR code saved successfully');
            } else {
                throw new Error('Failed to export payment QR code');
            }
            
        } catch (error) {
            console.error('Error saving payment QR code:', error);
            Toast.error('Failed to save payment QR code');
        }
    }

    // Verify address format
    verifyAddress() {
        const isValid = Validation.address(this.currentAddress);
        
        if (isValid) {
            Toast.success('Address format is valid');
        } else {
            Toast.error('Invalid address format');
        }
        
        return isValid;
    }

    // Create payment request with amount and optional note
    createPaymentRequest(amount, note = '') {
        if (!amount || amount <= 0) {
            Toast.error('Please enter a valid amount');
            return null;
        }
        
        let paymentUrl = `ctc:${this.currentAddress}?amount=${amount}`;
        
        if (note.trim()) {
            paymentUrl += `&note=${encodeURIComponent(note.trim())}`;
        }
        
        return paymentUrl;
    }

    // Format address for display (with ellipsis)
    formatAddressForDisplay(address = this.currentAddress, startChars = 6, endChars = 4) {
        return Format.address(address, startChars, endChars);
    }

    // Parse QR payment data (for future QR scanning functionality)
    parsePaymentQR(qrData) {
        try {
            return window.qrGenerator.parsePaymentURI(qrData);
        } catch (error) {
            console.error('Error parsing payment QR:', error);
            return null;
        }
    }
}

// Create global receive screen instance
const receiveScreen = new ReceiveScreen();

// Export to global scope
window.receiveScreen = receiveScreen;

console.log('📥 Receive screen loaded');