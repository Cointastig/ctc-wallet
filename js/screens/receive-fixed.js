// js/screens/receive-fixed.js - Receive Screen with Modern Wallet Design

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
                <div class="wallet-header">
                    <div class="account-info">
                        <button class="header-back" onclick="walletScreen.show()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="account-name">CTC Erhalten</div>
                    </div>
                    <div class="account-avatar">
                        <div class="avatar-circle">
                            <i class="fas fa-qrcode"></i>
                        </div>
                    </div>
                </div>
                
                <!-- QR Code Section -->
                <div style="padding: var(--space-5);">
                    <!-- QR Code Card -->
                    <div class="card" style="text-align: center; margin-bottom: var(--space-6);">
                        <h3 style="color: var(--text-primary); margin-bottom: var(--space-6); font-size: var(--text-xl); font-weight: 700;">
                            <i class="fas fa-qrcode" style="margin-right: var(--space-2); color: var(--brand-primary);"></i>
                            Ihre CTC-Adresse
                        </h3>
                        
                        <div class="qr-code-container" id="qr-code-container" style="display: inline-block; margin-bottom: var(--space-6); padding: var(--space-4); background: white; border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg);">
                            <canvas id="address-qr-code" style="border-radius: var(--radius-lg);"></canvas>
                        </div>
                        
                        <div id="qr-loading" style="display: none; padding: 60px; color: var(--text-tertiary);">
                            <div class="loading-skeleton" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto var(--space-4);"></div>
                            <div>QR-Code wird generiert...</div>
                        </div>
                        
                        <div id="qr-error" style="display: none; padding: 60px; color: var(--brand-danger);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: var(--space-4); opacity: 0.5;"></i>
                            <div style="margin-bottom: var(--space-4);">QR-Code konnte nicht generiert werden</div>
                            <button onclick="receiveScreen.regenerateQR()" class="btn-secondary">
                                <i class="fas fa-redo" style="margin-right: var(--space-2);"></i>
                                Erneut versuchen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Address Display Card -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-wallet" style="margin-right: var(--space-2);"></i>
                            Wallet-Adresse
                        </h3>
                        <div style="background: var(--gradient-glass); border-radius: var(--radius-xl); padding: var(--space-5); margin-bottom: var(--space-4); border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="color: var(--text-primary); font-family: 'SF Mono', Monaco, monospace; font-size: var(--text-sm); font-weight: 600; word-break: break-all; line-height: 1.6;">
                                ${this.currentAddress}
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                            <button onclick="receiveScreen.copyAddress()" class="btn-primary">
                                <i class="fas fa-copy" style="margin-right: var(--space-2);"></i>
                                Kopieren
                            </button>
                            <button onclick="receiveScreen.shareAddress()" class="btn-secondary">
                                <i class="fas fa-share-alt" style="margin-right: var(--space-2);"></i>
                                Teilen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Request Amount Section -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-coins" style="margin-right: var(--space-2);"></i>
                            Betrag anfordern
                        </h3>
                        <p style="color: var(--text-tertiary); margin-bottom: var(--space-4); line-height: 1.6;">
                            Erstellen Sie eine Zahlungsanfrage mit einem bestimmten Betrag für einfachere Transaktionen.
                        </p>
                        
                        <div class="input-group">
                            <label class="form-label">Betrag (optional)</label>
                            <input 
                                type="number" 
                                id="request-amount" 
                                class="form-input" 
                                placeholder="0.0000 CTC" 
                                step="0.0001"
                                oninput="receiveScreen.updatePaymentQR()"
                                style="text-align: center; font-size: var(--text-lg); font-weight: 600;"
                            >
                        </div>
                        
                        <div class="input-group">
                            <label class="form-label">Notiz (optional)</label>
                            <input 
                                type="text" 
                                id="request-note" 
                                class="form-input" 
                                placeholder="z.B. Zahlung für Kaffee" 
                                maxlength="100"
                                oninput="receiveScreen.updatePaymentQR()"
                            >
                        </div>
                        
                        <div id="payment-qr-container" style="display: none;">
                            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: var(--space-6) 0; padding-top: var(--space-6);">
                                <h4 style="color: var(--text-primary); margin-bottom: var(--space-4); text-align: center; font-size: var(--text-lg); font-weight: 700;">
                                    <i class="fas fa-receipt" style="margin-right: var(--space-2); color: var(--brand-success);"></i>
                                    Zahlungsanfrage QR-Code
                                </h4>
                                
                                <div style="text-align: center; margin-bottom: var(--space-4);">
                                    <div style="background: white; border-radius: var(--radius-2xl); padding: var(--space-4); display: inline-block; box-shadow: var(--shadow-lg);">
                                        <canvas id="payment-qr-code"></canvas>
                                    </div>
                                </div>
                                
                                <div style="background: var(--gradient-glass); border-radius: var(--radius-xl); padding: var(--space-4); margin-bottom: var(--space-4); border: 1px solid rgba(255, 255, 255, 0.08);">
                                    <label style="color: var(--text-tertiary); font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2); display: block;">Zahlungslink:</label>
                                    <code id="payment-link" style="color: var(--brand-accent); font-size: var(--text-xs); font-family: 'SF Mono', Monaco, monospace; word-break: break-all; line-height: 1.5;"></code>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                                    <button onclick="receiveScreen.copyPaymentLink()" class="btn-secondary">
                                        <i class="fas fa-copy" style="margin-right: var(--space-2);"></i>
                                        Link kopieren
                                    </button>
                                    <button onclick="receiveScreen.savePaymentQR()" class="btn-secondary">
                                        <i class="fas fa-download" style="margin-right: var(--space-2);"></i>
                                        QR speichern
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Instructions Card -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-info-circle" style="margin-right: var(--space-2);"></i>
                            So erhalten Sie CTC
                        </h3>
                        <div style="color: var(--text-secondary); line-height: 1.7;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: var(--space-3);">
                                <div style="background: var(--brand-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: var(--space-3); flex-shrink: 0;">1</div>
                                <div>Teilen Sie Ihre CTC-Adresse oder zeigen Sie den QR-Code dem Absender</div>
                            </div>
                            <div style="display: flex; align-items: flex-start; margin-bottom: var(--space-3);">
                                <div style="background: var(--brand-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: var(--space-3); flex-shrink: 0;">2</div>
                                <div>QR-Codes können von den meisten CTC-Wallets gescannt werden</div>
                            </div>
                            <div style="display: flex; align-items: flex-start; margin-bottom: var(--space-3);">
                                <div style="background: var(--brand-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: var(--space-3); flex-shrink: 0;">3</div>
                                <div>Zahlungsanfrage-QR-Codes enthalten den Betrag automatisch</div>
                            </div>
                            <div style="display: flex; align-items: flex-start;">
                                <div style="background: var(--brand-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: var(--space-3); flex-shrink: 0;">4</div>
                                <div>Transaktionen erscheinen automatisch in Ihrem Wallet</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Security Notice -->
                    <div class="card" style="background: rgba(5, 150, 105, 0.1); border: 1px solid rgba(5, 150, 105, 0.3);">
                        <div style="display: flex; align-items: center; gap: var(--space-3);">
                            <i class="fas fa-shield-check" style="color: var(--brand-success); font-size: 20px;"></i>
                            <div style="color: rgba(255,255,255,0.9); font-size: var(--text-sm); line-height: 1.6;">
                                <strong>Sicherheitshinweis:</strong> Diese Adresse kann sicher mehrfach verwendet werden. 
                                Netzwerkbestätigungen dauern typischerweise 30-60 Sekunden.
                            </div>
                        </div>
                    </div>
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
            
            Toast.error('QR-Code konnte nicht generiert werden');
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
                Toast.error('Zahlungs-QR-Code konnte nicht generiert werden');
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
                Toast.success('Adresse in Zwischenablage kopiert');
            } else {
                Toast.error('Adresse konnte nicht kopiert werden');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Adresse konnte nicht kopiert werden');
        }
    }

    // Share address using Web Share API or fallback
    async shareAddress() {
        const shareData = {
            title: 'CTC Wallet Adresse',
            text: `CTC an diese Adresse senden: ${this.currentAddress}`,
            url: `ctc:${this.currentAddress}`
        };

        try {
            if (navigator.share && Utils.isTelegramWebApp()) {
                await navigator.share(shareData);
                Toast.success('Adresse geteilt');
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
                
                Toast.success('QR-Code erfolgreich gespeichert');
            } else {
                throw new Error('Failed to export QR code');
            }
            
        } catch (error) {
            console.error('Error saving QR code:', error);
            Toast.error('QR-Code konnte nicht gespeichert werden');
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
                Toast.success('Zahlungslink in Zwischenablage kopiert');
            } else {
                Toast.error('Zahlungslink konnte nicht kopiert werden');
            }
        } catch (error) {
            console.error('Copy error:', error);
            Toast.error('Zahlungslink konnte nicht kopiert werden');
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
                
                Toast.success('Zahlungs-QR-Code erfolgreich gespeichert');
            } else {
                throw new Error('Failed to export payment QR code');
            }
            
        } catch (error) {
            console.error('Error saving payment QR code:', error);
            Toast.error('Zahlungs-QR-Code konnte nicht gespeichert werden');
        }
    }

    // Verify address format
    verifyAddress() {
        const isValid = Validation.address(this.currentAddress);
        
        if (isValid) {
            Toast.success('Adressformat ist gültig');
        } else {
            Toast.error('Ungültiges Adressformat');
        }
        
        return isValid;
    }

    // Create payment request with amount and optional note
    createPaymentRequest(amount, note = '') {
        if (!amount || amount <= 0) {
            Toast.error('Bitte geben Sie einen gültigen Betrag ein');
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

    // Show QR code in fullscreen modal
    showQRFullscreen() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(8px);
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; max-width: 90vw; max-height: 90vh;">
                <div style="background: white; padding: var(--space-6); border-radius: var(--radius-2xl); margin-bottom: var(--space-4); display: inline-block;">
                    <canvas id="fullscreen-qr" width="300" height="300"></canvas>
                </div>
                <h3 style="color: white; margin-bottom: var(--space-4);">CTC Wallet Adresse</h3>
                <div style="color: rgba(255,255,255,0.8); font-family: monospace; font-size: 14px; word-break: break-all; margin-bottom: var(--space-6);">
                    ${this.currentAddress}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-secondary">
                    <i class="fas fa-times" style="margin-right: var(--space-2);"></i>
                    Schließen
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generate QR code for fullscreen view
        setTimeout(() => {
            window.qrGenerator.generateAddressQR(this.currentAddress, 'fullscreen-qr', 300);
        }, 100);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Get current receive data
    getReceiveData() {
        const amount = parseFloat(DOM.getValue('request-amount')) || 0;
        const note = DOM.getValue('request-note').trim();
        
        return {
            address: this.currentAddress,
            amount: amount,
            note: note,
            hasPaymentRequest: amount > 0 || note.length > 0,
            paymentUri: amount > 0 ? this.createPaymentRequest(amount, note) : null
        };
    }

    // Clear payment request form
    clearPaymentRequest() {
        DOM.setValue('request-amount', '');
        DOM.setValue('request-note', '');
        DOM.hide('payment-qr-container');
        Toast.success('Zahlungsanfrage gelöscht');
    }

    // Update QR code size based on screen
    updateQRSize() {
        const screenWidth = window.innerWidth;
        let qrSize = 200;
        
        if (screenWidth < 480) {
            qrSize = 180;
        } else if (screenWidth > 768) {
            qrSize = 220;
        }
        
        // Regenerate QR codes with new size
        this.generateAddressQR();
        
        const amount = parseFloat(DOM.getValue('request-amount')) || 0;
        const note = DOM.getValue('request-note').trim();
        
        if (amount > 0 || note) {
            this.updatePaymentQR();
        }
    }

    // Show address in different formats
    showAddressFormats() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(8px);
            padding: var(--space-5);
        `;
        
        modal.innerHTML = `
            <div class="card" style="max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6);">
                    <h3 style="color: var(--text-primary); margin: 0;">Adressformate</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary" style="padding: var(--space-2);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: var(--space-4);">
                    <label style="color: var(--text-tertiary); font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2); display: block;">Standard-Adresse:</label>
                    <div style="background: var(--gradient-glass); border-radius: var(--radius-lg); padding: var(--space-3); font-family: monospace; font-size: var(--text-sm); word-break: break-all; border: 1px solid rgba(255, 255, 255, 0.08);">
                        ${this.currentAddress}
                    </div>
                </div>
                
                <div style="margin-bottom: var(--space-4);">
                    <label style="color: var(--text-tertiary); font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2); display: block;">URI-Format:</label>
                    <div style="background: var(--gradient-glass); border-radius: var(--radius-lg); padding: var(--space-3); font-family: monospace; font-size: var(--text-sm); word-break: break-all; border: 1px solid rgba(255, 255, 255, 0.08);">
                        ctc:${this.currentAddress}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                    <button onclick="navigator.clipboard.writeText('${this.currentAddress}').then(() => Toast.success('Standard-Adresse kopiert'))" class="btn-secondary">
                        <i class="fas fa-copy" style="margin-right: var(--space-2);"></i>
                        Standard
                    </button>
                    <button onclick="navigator.clipboard.writeText('ctc:${this.currentAddress}').then(() => Toast.success('URI-Format kopiert'))" class="btn-secondary">
                        <i class="fas fa-link" style="margin-right: var(--space-2);"></i>
                        URI
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Handle window resize
    handleResize() {
        this.updateQRSize();
    }

    // Initialize resize handler
    initializeResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 300);
        });
    }

    // Cleanup when component is destroyed
    cleanup() {
        // Remove resize listeners
        window.removeEventListener('resize', this.handleResize);
    }
}

// Create global receive screen instance
const receiveScreen = new ReceiveScreen();

// Export to global scope
window.receiveScreen = receiveScreen;

// Initialize resize handler
receiveScreen.initializeResizeHandler();

console.log('📥 Receive screen with modern wallet design loaded');