// js/screens/send-fixed.js - Send Transaction Screen with Modern Wallet Design

class SendScreen {
    constructor() {
        this.recipientAddress = '';
        this.amount = 0;
        this.availableBalance = 0;
        this.isScanning = false;
        this.videoStream = null;
        this.qrScanner = null;
        this.scanInterval = null;
        this.qrData = null;
        this.showConfirmation = false;
        this.slideConfirmed = false;
    }

    // Show send screen - FIX: Sichere Abfrage der Balance
    show() {
        const wallet = walletScreen.getCurrentWallet();
        if (!wallet) {
            Toast.error('Wallet not initialized');
            return;
        }

        // Sichere Abfrage der Balance mit Fallback
        this.availableBalance = walletScreen.getCurrentBalance ? walletScreen.getCurrentBalance() : 0;
        this.showConfirmation = false;
        this.slideConfirmed = false;
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="wallet-header">
                    <div class="account-info">
                        <button class="header-back" onclick="walletScreen.show()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="account-name">CTC Senden</div>
                    </div>
                    <div class="account-avatar">
                        <div class="avatar-circle">
                            <i class="fas fa-paper-plane"></i>
                        </div>
                    </div>
                </div>

                <!-- Send Form (Phase 1) -->
                <div id="send-form-phase" style="padding: var(--space-5);">
                    <!-- Recipient Section -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-user" style="margin-right: var(--space-2);"></i>
                            Empfänger
                        </h3>
                        <div class="input-group">
                            <input 
                                type="text" 
                                id="send-address" 
                                placeholder="CTC-Adresse eingeben"
                                style="flex: 1;"
                                oninput="sendScreen.validateForm()"
                            >
                            <button class="btn-icon" onclick="sendScreen.showQRScanner()" title="QR Code scannen">
                                <i class="fas fa-qrcode"></i>
                            </button>
                            <button class="btn-icon" onclick="sendScreen.pasteFromClipboard()" title="Einfügen">
                                <i class="fas fa-clipboard"></i>
                            </button>
                        </div>
                        
                        <!-- QR Payment Info (hidden by default) -->
                        <div id="qr-payment-info" class="payment-info" style="display: none;">
                            <div class="info-box">
                                <i class="fas fa-info-circle"></i>
                                <div>
                                    <strong>QR-Code Zahlungsdaten:</strong>
                                    <div id="qr-payment-details"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Amount Section -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-coins" style="margin-right: var(--space-2);"></i>
                            Betrag
                        </h3>
                        <div class="input-group">
                            <input 
                                type="number" 
                                id="send-amount" 
                                placeholder="0.0000"
                                step="0.0001"
                                min="0"
                                style="flex: 1;"
                                oninput="sendScreen.validateForm()"
                            >
                            <span class="input-unit">CTC</span>
                            <button class="btn-secondary" onclick="sendScreen.setMaxAmount()">Max</button>
                        </div>
                        <div class="balance-info">
                            Verfügbar: <span id="available-balance">${Format.ctc(this.availableBalance)}</span>
                        </div>
                    </div>

                    <!-- Transaction Fee -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <div class="fee-info">
                            <span>Netzwerkgebühr:</span>
                            <span class="fee-amount">0.0001 CTC</span>
                        </div>
                    </div>

                    <!-- Continue Button -->
                    <button 
                        id="continue-button" 
                        class="btn-primary" 
                        onclick="sendScreen.showConfirmation()"
                        disabled
                        style="width: 100%; margin-top: var(--space-6);"
                    >
                        <i class="fas fa-arrow-right" style="margin-right: var(--space-2);"></i>
                        Weiter
                    </button>
                </div>

                <!-- Confirmation Phase (hidden by default) -->
                <div id="confirmation-phase" style="display: none; padding: var(--space-5);">
                    <!-- Transaction Summary -->
                    <div class="card" style="margin-bottom: var(--space-6);">
                        <h3 class="card-header">
                            <i class="fas fa-receipt" style="margin-right: var(--space-2);"></i>
                            Transaktion bestätigen
                        </h3>
                        
                        <div class="transaction-summary">
                            <div class="summary-row">
                                <span>An:</span>
                                <span id="confirm-address" class="address-short"></span>
                            </div>
                            <div class="summary-row">
                                <span>Betrag:</span>
                                <span id="confirm-amount" class="amount-large"></span>
                            </div>
                            <div class="summary-row">
                                <span>Netzwerkgebühr:</span>
                                <span class="fee-text">0.0001 CTC</span>
                            </div>
                            <div class="summary-divider"></div>
                            <div class="summary-row total">
                                <span>Gesamt:</span>
                                <span id="confirm-total" class="total-amount"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Security Notice -->
                    <div class="card warning" style="margin-bottom: var(--space-6);">
                        <div class="warning-content">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <strong>Wichtiger Hinweis:</strong>
                                Transaktionen sind unwiderruflich. Prüfen Sie alle Angaben sorgfältig.
                            </div>
                        </div>
                    </div>

                    <!-- Back Button -->
                    <button 
                        class="btn-secondary" 
                        onclick="sendScreen.backToForm()"
                        style="width: 100%; margin-bottom: var(--space-4);"
                    >
                        <i class="fas fa-arrow-left" style="margin-right: var(--space-2);"></i>
                        Zurück
                    </button>

                    <!-- Slide to Confirm -->
                    <div class="slide-to-confirm" id="slide-to-confirm">
                        <div class="slide-track" id="slide-track">
                            <div class="slide-button" id="slide-button">
                                <i class="fas fa-arrow-right" id="slide-icon"></i>
                            </div>
                            <div class="slide-text" id="slide-text">Nach rechts schieben zum Bestätigen</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        this.updateAvailableBalance();
        
        // Update app current screen
        if (window.app) {
            window.app.setCurrentScreen('send');
        }
    }

    // Validate form inputs
    validateForm() {
        const address = DOM.getValue('send-address').trim();
        const amount = parseFloat(DOM.getValue('send-amount')) || 0;
        const continueBtn = DOM.get('continue-button');
        
        // Store values
        this.recipientAddress = address;
        this.amount = amount;
        
        // Validation
        const isValidAddress = address.startsWith('CTC') && address.length >= 20;
        const isValidAmount = amount > 0 && amount <= (this.availableBalance / 100_000_000 - 0.0001);
        
        if (continueBtn) {
            continueBtn.disabled = !(isValidAddress && isValidAmount);
        }
        
        // Update error states
        this.updateInputValidation('send-address', isValidAddress);
        this.updateInputValidation('send-amount', isValidAmount);
    }

    // Update input validation styling
    updateInputValidation(inputId, isValid) {
        const input = DOM.get(inputId);
        if (!input) return;
        
        const value = input.value.trim();
        
        if (value === '') {
            // Empty state
            input.classList.remove('error', 'success');
        } else if (isValid) {
            // Valid state
            input.classList.remove('error');
            input.classList.add('success');
        } else {
            // Error state
            input.classList.remove('success');
            input.classList.add('error');
        }
    }

    // Show confirmation phase
    showConfirmation() {
        if (!this.recipientAddress || this.amount <= 0) return;
        
        this.showConfirmation = true;
        
        // Hide form, show confirmation
        DOM.hide('send-form-phase');
        DOM.show('confirmation-phase');
        
        // Populate confirmation data
        DOM.setText('confirm-address', Format.address(this.recipientAddress));
        DOM.setText('confirm-amount', `${this.amount.toFixed(4)} CTC`);
        
        const total = this.amount + 0.0001; // Add fee
        DOM.setText('confirm-total', `${total.toFixed(4)} CTC`);
        
        // Initialize slide to confirm
        this.initializeSlideToConfirm();
    }

    // Back to form
    backToForm() {
        this.showConfirmation = false;
        DOM.hide('confirmation-phase');
        DOM.show('send-form-phase');
    }

    // Initialize slide to confirm functionality
    initializeSlideToConfirm() {
        const slideButton = DOM.get('slide-button');
        const slideTrack = DOM.get('slide-track');
        
        if (!slideButton || !slideTrack) return;
        
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let maxSlide = slideTrack.offsetWidth - slideButton.offsetWidth - 4;
        
        // Touch events
        slideButton.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            slideButton.style.transition = 'none';
        });
        
        slideButton.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            currentX = e.touches[0].clientX - startX;
            currentX = Math.max(0, Math.min(currentX, maxSlide));
            
            slideButton.style.transform = `translateX(${currentX}px)`;
            
            // Update progress
            const progress = currentX / maxSlide;
            this.updateSlideProgress(progress);
        });
        
        slideButton.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const progress = currentX / maxSlide;
            
            if (progress >= 0.8) {
                // Confirmed
                this.slideConfirmed = true;
                this.completeSlideToConfirm();
                this.sendTransaction();
            } else {
                // Reset
                this.resetSlideToConfirm();
            }
        });
        
        // Mouse events for desktop
        slideButton.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            slideButton.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            currentX = e.clientX - startX;
            currentX = Math.max(0, Math.min(currentX, maxSlide));
            
            slideButton.style.transform = `translateX(${currentX}px)`;
            
            const progress = currentX / maxSlide;
            this.updateSlideProgress(progress);
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const progress = currentX / maxSlide;
            
            if (progress >= 0.8) {
                this.slideConfirmed = true;
                this.completeSlideToConfirm();
                this.sendTransaction();
            } else {
                this.resetSlideToConfirm();
            }
        });
    }

    // Update slide progress
    updateSlideProgress(progress) {
        const slideTrack = DOM.get('slide-track');
        const slideText = DOM.get('slide-text');
        const slideIcon = DOM.get('slide-icon');
        
        if (slideTrack) {
            const green = Math.floor(progress * 255);
            slideTrack.style.background = `linear-gradient(90deg, rgba(34, 197, 94, ${progress * 0.8}) 0%, rgba(255, 255, 255, 0.05) 100%)`;
        }
        
        if (progress > 0.8) {
            if (slideText) slideText.textContent = 'Loslassen zum Bestätigen!';
            if (slideIcon) slideIcon.className = 'fas fa-check';
        } else {
            if (slideText) slideText.textContent = 'Nach rechts schieben zum Bestätigen';
            if (slideIcon) slideIcon.className = 'fas fa-arrow-right';
        }
    }

    // Complete slide to confirm
    completeSlideToConfirm() {
        const slideButton = DOM.get('slide-button');
        const slideTrack = DOM.get('slide-track');
        const slideIcon = DOM.get('slide-icon');
        const slideText = DOM.get('slide-text');
        
        if (slideButton) {
            slideButton.style.transform = `translateX(${slideTrack.offsetWidth - slideButton.offsetWidth - 4}px)`;
            slideButton.style.transition = 'transform 0.3s ease';
        }
        
        if (slideTrack) {
            slideTrack.style.background = 'linear-gradient(90deg, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0.4) 100%)';
        }
        
        if (slideIcon) slideIcon.className = 'fas fa-check';
        if (slideText) slideText.textContent = 'Transaktion wird gesendet...';
    }

    // Send transaction
    async sendTransaction() {
        try {
            const slideText = DOM.get('slide-text');
            const slideIcon = DOM.get('slide-icon');
            
            // Show sending state
            if (slideText) slideText.textContent = 'Transaktion wird gesendet...';
            if (slideIcon) slideIcon.className = 'fas fa-spinner fa-spin';
            
            // Simulate transaction sending
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success
            Toast.success('Transaktion erfolgreich gesendet!');
            
            // Update slide to success state
            if (slideText) slideText.textContent = 'Transaktion erfolgreich!';
            if (slideIcon) slideIcon.className = 'fas fa-check';
            
            // Wait a moment then return to wallet
            setTimeout(() => {
                walletScreen.show();
                
                // Refresh wallet balance
                if (walletScreen.loadBalance) {
                    walletScreen.loadBalance();
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Transaction failed:', error);
            
            // Show error
            Toast.error('Transaktion fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
            
            // Reset slide
            this.resetSlideToConfirm();
        }
    }

    // Reset slide to confirm
    resetSlideToConfirm() {
        const slideButton = DOM.get('slide-button');
        const slideTrack = DOM.get('slide-track');
        const slideIcon = DOM.get('slide-icon');
        const slideText = DOM.get('slide-text');
        
        if (slideButton) {
            slideButton.style.transform = 'translateX(0px)';
            slideButton.style.transition = 'transform 0.3s ease';
        }
        
        if (slideTrack) {
            slideTrack.style.background = 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
        }
        
        if (slideIcon) {
            slideIcon.className = 'fas fa-arrow-right';
        }
        
        if (slideText) {
            slideText.textContent = 'Nach rechts schieben zum Bestätigen';
        }
        
        this.slideConfirmed = false;
    }

    // Enhanced QR Scanner with modern design
    async showQRScanner() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="wallet-header">
                    <div class="account-info">
                        <button class="header-back" onclick="sendScreen.stopScanning()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="account-name">QR Code scannen</div>
                    </div>
                    <div class="account-avatar">
                        <button class="avatar-circle" onclick="sendScreen.stopScanning()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- QR Scanner Content -->
                <div style="padding: var(--space-5);">
                    <!-- Camera Preview -->
                    <div class="qr-scanner-container">
                        <video id="qr-video" autoplay playsinline muted></video>
                        <canvas id="qr-canvas" style="display: none;"></canvas>
                        
                        <!-- Scanner Overlay -->
                        <div class="scanner-overlay">
                            <div class="scanner-frame">
                                <div class="scanner-corner scanner-corner-tl"></div>
                                <div class="scanner-corner scanner-corner-tr"></div>
                                <div class="scanner-corner scanner-corner-bl"></div>
                                <div class="scanner-corner scanner-corner-br"></div>
                            </div>
                            <div class="scanner-line"></div>
                        </div>
                        
                        <!-- Scanner Status -->
                        <div class="scanner-status" id="scanner-status">
                            <div class="status-icon">
                                <i class="fas fa-qrcode"></i>
                            </div>
                            <div class="status-text">QR-Code vor die Kamera halten</div>
                        </div>
                    </div>

                    <!-- Scanner Controls -->
                    <div class="scanner-controls">
                        <button class="btn-secondary" onclick="sendScreen.stopScanning()">
                            <i class="fas fa-times"></i>
                            Abbrechen
                        </button>
                        <button class="btn-icon" onclick="sendScreen.toggleFlash()" id="flash-btn">
                            <i class="fas fa-flashlight"></i>
                        </button>
                        <button class="btn-secondary" onclick="sendScreen.switchCamera()" id="camera-switch-btn">
                            <i class="fas fa-camera-rotate"></i>
                            Kamera wechseln
                        </button>
                    </div>

                    <!-- Manual Input Option -->
                    <div class="manual-input-option">
                        <div class="divider">
                            <span>oder</span>
                        </div>
                        <button class="btn-link" onclick="sendScreen.showManualInput()">
                            <i class="fas fa-keyboard"></i>
                            Adresse manuell eingeben
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        
        try {
            await this.startQRScanning();
        } catch (error) {
            console.error('❌ Failed to start QR scanning:', error);
            Toast.error('Kamera konnte nicht gestartet werden');
            this.show(); // Return to send screen
        }
    }

    // Start QR scanning - KORRIGIERT: Mit funktionierender Kamera-Logik aus Ihrer Datei
    async startQRScanning() {
        const video = DOM.get('qr-video');
        const canvas = DOM.get('qr-canvas');
        
        if (!video || !canvas) {
            throw new Error('Video or canvas element not found');
        }

        try {
            // FUNKTIONIERENDE KAMERA-LOGIK AUS IHRER DATEI:
            this.updateScannerStatus('Requesting camera access...');
            
            // Request camera permission - GENAU WIE IN IHRER FUNKTIONIERENDEN DATEI
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Back camera for better QR scanning
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.videoStream = stream;
            
            if (video) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();
                    this.updateScannerStatus('Camera ready - scanning for QR codes...');
                    
                    this.isScanning = true;
                    
                    // Start scanning loop
                    this.scanInterval = setInterval(() => {
                        this.scanForQRCode(video, canvas);
                    }, 100);
                    
                    console.log('✅ QR Scanner started successfully');
                };
            }
            
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            // FUNKTIONIERENDE ERROR-BEHANDLUNG AUS IHRER DATEI:
            this.showCameraError(this.getCameraErrorMessage(error));
            throw error;
        }
    }

    // HINZUGEFÜGT: Funktionierende Hilfsmethoden aus Ihrer Datei
    updateScannerStatus(message) {
        const statusElement = DOM.get('scanner-status');
        if (statusElement) {
            const textElement = statusElement.querySelector('.status-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }

    showCameraError(message) {
        this.updateScannerStatus('Camera error: ' + message);
        // Zeige Fallback-Option
        setTimeout(() => {
            const statusEl = DOM.get('scanner-status');
            if (statusEl) {
                statusEl.innerHTML = `
                    <div class="status-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="status-text">${message}</div>
                    <button class="btn-secondary" onclick="sendScreen.showManualInput()" style="margin-top: var(--space-3);">
                        <i class="fas fa-keyboard"></i>
                        Adresse manuell eingeben
                    </button>
                `;
            }
        }, 1000);
    }

    getCameraErrorMessage(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Camera access denied. Please allow camera access and try again.';
            case 'NotFoundError':
                return 'No camera found on this device.';
            case 'NotSupportedError':
                return 'Camera not supported in this browser.';
            case 'NotReadableError':
                return 'Camera is being used by another application.';
            case 'OverconstrainedError':
                return 'Camera does not meet the required specifications.';
            default:
                return 'Failed to access camera. Please try again.';
        }
    }

    // Scan for QR code - BEHALTEN: Verwendet die korrigierte QR-Detection
    scanForQRCode(video, canvas) {
        if (!this.isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return;
        }

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            // KORRIGIERT: Verwende verbesserte QR-Detection
            const qrResult = QRDetector.detectQRCode(imageData);
            
            if (qrResult) {
                this.handleQRDetection(qrResult);
            }
        } catch (error) {
            console.warn('QR detection error:', error);
        }
    }

    // Handle QR detection - KORRIGIERT: Vereinfachte Implementierung
    handleQRDetection(qrData) {
        this.stopScanning();
        
        // Vibrate if available
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Parse QR data mit QRValidator
        const validation = QRValidator.validateCTCQR(qrData);
        
        if (validation.valid) {
            const parsed = validation.data;
            
            this.recipientAddress = parsed.address;
            this.qrData = parsed;
            
            // Show success and return to send screen
            Toast.success('QR-Code erfolgreich gescannt!');
            this.show();
            
            // Pre-fill form
            DOM.setValue('send-address', this.recipientAddress);
            
            if (parsed.amount) {
                DOM.setValue('send-amount', parsed.amount);
                this.amount = parseFloat(parsed.amount);
            }
            
            if (parsed.note) {
                DOM.show('qr-payment-info');
                DOM.setText('qr-payment-details', `Betrag: ${parsed.amount || 'Nicht angegeben'}\nNotiz: ${parsed.note}`);
            }
            
            this.validateForm();
        } else {
            Toast.error('Ungültiger QR-Code: ' + validation.error);
            this.show();
        }
    }

    // Stop QR scanning - KORRIGIERT: Verwendet globale qrScanner-Instanz
    stopScanning() {
        this.isScanning = false;
        
        if (window.qrScanner) {
            window.qrScanner.stopScanning();
            window.qrScanner.cleanup();
        }
    }

    // Update scanner status
    updateScannerStatus(text, type = 'info') {
        const statusEl = DOM.get('scanner-status');
        if (!statusEl) return;
        
        const iconEl = statusEl.querySelector('.status-icon i');
        const textEl = statusEl.querySelector('.status-text');
        
        if (textEl) textEl.textContent = text;
        
        if (iconEl) {
            switch (type) {
                case 'scanning':
                    iconEl.className = 'fas fa-qrcode fa-pulse';
                    break;
                case 'success':
                    iconEl.className = 'fas fa-check';
                    break;
                case 'error':
                    iconEl.className = 'fas fa-exclamation-triangle';
                    break;
                default:
                    iconEl.className = 'fas fa-qrcode';
            }
        }
    }

    // Toggle flash - KORRIGIERT: Verwendet globale qrScanner-Instanz
    async toggleFlash() {
        try {
            if (window.qrScanner) {
                await window.qrScanner.toggleFlashlight();
                Toast.info('Taschenlampe umgeschaltet');
            }
        } catch (error) {
            console.error('Flash toggle failed:', error);
            Toast.error('Taschenlampe nicht verfügbar');
        }
    }

    // Switch camera - KORRIGIERT: Verwendet globale qrScanner-Instanz
    async switchCamera() {
        try {
            if (window.qrScanner) {
                await window.qrScanner.switchCamera();
                Toast.info('Kamera gewechselt');
            }
        } catch (error) {
            console.error('Camera switch failed:', error);
            Toast.error('Kamera wechseln fehlgeschlagen');
        }
    }

    // Show manual input
    showManualInput() {
        this.stopScanning();
        this.show();
        DOM.focus('send-address');
    }

    // Paste from clipboard
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                DOM.setValue('send-address', text.trim());
                this.recipientAddress = text.trim();
                this.validateForm();
                Toast.success('Adresse eingefügt');
            }
        } catch (error) {
            console.error('❌ Clipboard access failed:', error);
            Toast.error('Zwischenablage konnte nicht gelesen werden');
        }
    }

    // Set max amount
    setMaxAmount() {
        const fee = 0.0001;
        const maxAmount = Math.max(0, (this.availableBalance / 100_000_000) - fee);
        
        if (maxAmount > 0) {
            DOM.setValue('send-amount', maxAmount.toFixed(4));
            this.amount = maxAmount;
            this.validateForm();
        } else {
            Toast.error('Unzureichendes Guthaben');
        }
    }

    // Update available balance display
    updateAvailableBalance() {
        const balanceEl = DOM.get('available-balance');
        if (balanceEl) {
            balanceEl.textContent = Format.ctc(this.availableBalance);
        }
    }

    // Cleanup
    cleanup() {
        this.stopScanning();
        this.recipientAddress = '';
        this.amount = 0;
        this.qrData = null;
        this.showConfirmation = false;
        this.slideConfirmed = false;
    }
}

// Create global send screen instance
const sendScreen = new SendScreen();

// Export to global scope
window.sendScreen = sendScreen;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (sendScreen) {
        sendScreen.cleanup();
    }
});

console.log('📤 Enhanced Send screen with slide-to-confirm loaded');
