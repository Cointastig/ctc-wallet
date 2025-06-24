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
                        
                        <!-- QR Payment Info -->
                        <div id="qr-payment-info" style="display: none; margin-top: var(--space-4); padding: var(--space-4); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-lg);">
                            <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2);">
                                <i class="fas fa-qrcode" style="color: var(--brand-success);"></i>
                                <span style="color: var(--brand-success); font-weight: 600;">QR-Code-Zahlung erkannt</span>
                            </div>
                            <div id="qr-payment-details" style="color: rgba(255,255,255,0.8); font-size: var(--text-sm);"></div>
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
                                max="${this.availableBalance - 0.0001}"
                                style="flex: 1;"
                                oninput="sendScreen.validateForm()"
                            >
                            <span class="input-addon">CTC</span>
                            <button class="btn-secondary" onclick="sendScreen.setMaxAmount()" style="margin-left: var(--space-2);">
                                MAX
                            </button>
                        </div>
                        <div class="form-hint">
                            Verfügbar: <span id="available-balance">${Format.ctc(this.availableBalance)}</span>
                        </div>
                    </div>

                    <!-- Transaction Summary (hidden initially) -->
                    <div id="transaction-summary" class="card" style="display: none; margin-bottom: var(--space-6); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
                        <h3 class="card-header" style="color: var(--brand-primary);">
                            <i class="fas fa-receipt" style="margin-right: var(--space-2);"></i>
                            Transaktionsübersicht
                        </h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3);">
                            <span class="summary-label">Betrag:</span>
                            <span id="summary-amount" class="summary-value">0.0000 CTC</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3);">
                            <span class="summary-label">Netzwerkgebühr:</span>
                            <span class="summary-value">0.0001 CTC</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--space-3);">
                            <span class="summary-label" style="font-weight: 700;">Gesamt:</span>
                            <span id="summary-total" class="summary-value" style="font-weight: 700;">0.0001 CTC</span>
                        </div>
                    </div>

                    <!-- Continue Button -->
                    <button 
                        id="continue-btn" 
                        class="btn-primary" 
                        onclick="sendScreen.showConfirmationPhase()"
                        disabled
                        style="width: 100%;"
                    >
                        <i class="fas fa-arrow-right" style="margin-right: var(--space-2);"></i>
                        Weiter zur Bestätigung
                    </button>
                </div>

                <!-- Confirmation Phase (Phase 2 - initially hidden) -->
                <div id="confirmation-phase" style="display: none; padding: var(--space-5);">
                    <!-- Confirmation Details -->
                    <div class="card" style="margin-bottom: var(--space-6); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
                        <h3 class="card-header" style="color: var(--brand-success);">
                            <i class="fas fa-check-circle" style="margin-right: var(--space-2);"></i>
                            Transaktion bestätigen
                        </h3>
                        
                        <div class="confirmation-details">
                            <div class="detail-row">
                                <span class="detail-label">An:</span>
                                <div class="detail-value" id="confirm-address">-</div>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Betrag:</span>
                                <div class="detail-value" id="confirm-amount">0.0000 CTC</div>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Netzwerkgebühr:</span>
                                <div class="detail-value">0.0001 CTC</div>
                            </div>
                            <div class="detail-row total-row">
                                <span class="detail-label">Gesamtbetrag:</span>
                                <div class="detail-value" id="confirm-total">0.0001 CTC</div>
                            </div>
                        </div>
                        
                        <!-- QR Note if present -->
                        <div id="confirm-qr-note" style="display: none; margin-top: var(--space-4); padding: var(--space-3); background: rgba(255, 255, 255, 0.1); border-radius: var(--radius-md);">
                            <div style="color: rgba(255,255,255,0.6); font-size: var(--text-sm); margin-bottom: var(--space-1);">Notiz:</div>
                            <div style="color: rgba(255,255,255,0.9);"></div>
                        </div>
                    </div>

                    <!-- Slide to Confirm -->
                    <div class="slide-to-confirm" style="margin-bottom: var(--space-6);">
                        <div class="slide-track" id="slide-track">
                            <div class="slide-text" id="slide-text">Nach rechts schieben zum Bestätigen</div>
                            <div class="slide-button" id="slide-button">
                                <i class="fas fa-arrow-right" id="slide-icon"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Back Button -->
                    <button 
                        class="btn-secondary" 
                        onclick="sendScreen.showFormPhase()"
                        style="width: 100%;"
                    >
                        <i class="fas fa-arrow-left" style="margin-right: var(--space-2);"></i>
                        Zurück zur Bearbeitung
                    </button>
                </div>
            </div>
        `;
        
        DOM.setContent('app-container', content);
        this.updateAvailableBalance();
        this.initializeSlideToConfirm();

        // Update app current screen
        if (window.app) {
            window.app.setCurrentScreen('send');
        }
    }

    // Show confirmation phase
    showConfirmationPhase() {
        if (!this.recipientAddress || !this.amount || this.amount <= 0) {
            Toast.error('Bitte füllen Sie alle Felder aus');
            return;
        }

        // Validate one more time
        if (!Validation.address(this.recipientAddress)) {
            Toast.error('Ungültige Empfängeradresse');
            return;
        }

        const fee = 0.0001;
        const total = this.amount + fee;
        const amountValidation = Validation.amount(this.amount, this.availableBalance - fee);
        if (!amountValidation.valid) {
            Toast.error(amountValidation.error);
            return;
        }

        // Update confirmation details
        DOM.setValue('confirm-address', this.recipientAddress);
        DOM.setText('confirm-amount', Format.ctc(this.amount));
        DOM.setText('confirm-total', Format.ctc(total));

        // Show QR note if present
        if (this.qrData && this.qrData.note) {
            DOM.show('confirm-qr-note');
            DOM.setText('confirm-qr-note div:last-child', this.qrData.note);
        } else {
            DOM.hide('confirm-qr-note');
        }

        // Switch phases
        DOM.hide('send-form-phase');
        DOM.show('confirmation-phase');
        this.showConfirmation = true;
        this.slideConfirmed = false;
        this.resetSlideToConfirm();
    }

    // Show form phase
    showFormPhase() {
        DOM.show('send-form-phase');
        DOM.hide('confirmation-phase');
        this.showConfirmation = false;
        this.slideConfirmed = false;
    }

    // Initialize slide to confirm
    initializeSlideToConfirm() {
        const slideButton = DOM.get('slide-button');
        const slideTrack = DOM.get('slide-track');
        
        if (!slideButton || !slideTrack) return;

        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        let buttonStartX = 0;
        const trackWidth = slideTrack.offsetWidth;
        const buttonWidth = slideButton.offsetWidth;
        const maxSlide = trackWidth - buttonWidth;

        // Mouse events
        slideButton.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        // Touch events
        slideButton.addEventListener('touchstart', startDrag, {passive: false});
        document.addEventListener('touchmove', drag, {passive: false});
        document.addEventListener('touchend', endDrag);

        function startDrag(e) {
            if (sendScreen.slideConfirmed) return;
            
            isDragging = true;
            slideButton.style.transition = 'none';
            
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            startX = clientX;
            buttonStartX = parseInt(slideButton.style.transform.replace('translateX(', '') || '0');
            
            slideButton.style.cursor = 'grabbing';
            e.preventDefault();
        }

        function drag(e) {
            if (!isDragging || sendScreen.slideConfirmed) return;
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            currentX = clientX - startX;
            const newX = Math.min(Math.max(0, buttonStartX + currentX), maxSlide);
            
            slideButton.style.transform = `translateX(${newX}px)`;
            
            // Update opacity based on progress
            const progress = newX / maxSlide;
            slideTrack.style.background = `linear-gradient(90deg, 
                rgba(16, 185, 129, ${0.3 + progress * 0.4}) 0%, 
                rgba(16, 185, 129, 0.1) ${progress * 100}%, 
                rgba(255, 255, 255, 0.1) 100%)`;
            
            e.preventDefault();
        }

        function endDrag(e) {
            if (!isDragging || sendScreen.slideConfirmed) return;
            
            isDragging = false;
            slideButton.style.cursor = 'grab';
            slideButton.style.transition = 'transform 0.3s ease';
            
            const currentTransform = parseInt(slideButton.style.transform.replace('translateX(', '') || '0');
            const progress = currentTransform / maxSlide;
            
            if (progress >= 0.8) {
                // Successful slide
                sendScreen.slideConfirmed = true;
                slideButton.style.transform = `translateX(${maxSlide}px)`;
                slideTrack.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%)';
                
                // Update icon and text
                DOM.get('slide-icon').className = 'fas fa-check';
                DOM.get('slide-text').textContent = 'Transaktion wird gesendet...';
                
                // Send transaction after short delay
                setTimeout(() => {
                    sendScreen.sendTransaction();
                }, 500);
            } else {
                // Reset slide
                sendScreen.resetSlideToConfirm();
            }
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

    // Start QR scanning
    async startQRScanning() {
        const video = DOM.get('qr-video');
        const canvas = DOM.get('qr-canvas');
        
        if (!video || !canvas) {
            throw new Error('Video or canvas element not found');
        }

        try {
            // Request camera access
            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            video.srcObject = this.videoStream;
            video.play();
            
            this.isScanning = true;
            
            // Start scanning loop
            this.scanInterval = setInterval(() => {
                this.scanForQRCode(video, canvas);
            }, 100);
            
            this.updateScannerStatus('Scannen...', 'scanning');
            
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            this.updateScannerStatus('Kamera nicht verfügbar', 'error');
            throw error;
        }
    }

    // Scan for QR code
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
            const qrResult = QRDetector.detect(imageData);
            
            if (qrResult) {
                this.handleQRDetection(qrResult);
            }
        } catch (error) {
            console.warn('QR detection error:', error);
        }
    }

    // Handle QR detection
    handleQRDetection(qrData) {
        this.stopScanning();
        
        // Vibrate if available
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Parse QR data
        const parsed = this.parseQRData(qrData);
        
        if (parsed.address) {
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
            Toast.error('Ungültiger QR-Code');
            this.show();
        }
    }

    // Parse QR data
    parseQRData(qrData) {
        const result = {
            address: null,
            amount: null,
            note: null
        };
        
        // Handle different QR formats
        if (typeof qrData === 'string') {
            // Format: ctc:address?amount=1.5&note=payment
            if (qrData.startsWith('ctc:')) {
                const [base, params] = qrData.substring(4).split('?');
                result.address = base;
                
                if (params) {
                    const urlParams = new URLSearchParams(params);
                    result.amount = urlParams.get('amount');
                    result.note = urlParams.get('note');
                }
            } 
            // Format: Plain address
            else if (qrData.startsWith('CTC') && qrData.length >= 20) {
                result.address = qrData;
            }
        }
        
        return result;
    }

    // Stop QR scanning
    stopScanning() {
        this.isScanning = false;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
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

    // Toggle flash
    toggleFlash() {
        // Implementation depends on browser support
        Toast.info('Flash-Funktionalität wird noch implementiert');
    }

    // Switch camera
    switchCamera() {
        // Implementation for switching between front/back camera
        Toast.info('Kamera wechseln wird noch implementiert');
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

    // Validate form
    validateForm() {
        const addressInput = DOM.get('send-address');
        const amountInput = DOM.get('send-amount');
        const continueBtn = DOM.get('continue-btn');
        const summaryDiv = DOM.get('transaction-summary');
        
        if (!addressInput || !amountInput || !continueBtn) return;
        
        // Get values
        const address = addressInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        
        // Update instance variables
        this.recipientAddress = address;
        this.amount = amount;
        
        // Validate address
        const addressValid = Validation.address(address);
        
        // Validate amount
        const fee = 0.0001;
        const amountValidation = Validation.amount(amount, (this.availableBalance / 100_000_000) - fee);
        
        // Enable/disable continue button
        const isValid = addressValid && amountValidation.valid && amount > 0;
        continueBtn.disabled = !isValid;
        
        // Show/hide transaction summary
        if (isValid) {
            DOM.show('transaction-summary');
            this.updateTransactionSummary(amount, amount + fee);
        } else {
            DOM.hide('transaction-summary');
            
            // Show specific error messages
            if (address && !addressValid) {
                Toast.error('Ungültige CTC-Adresse');
            } else if (amount > 0 && !amountValidation.valid) {
                Toast.error(amountValidation.error);
            } else if (amount <= 0) {
                Toast.error('Betrag muss größer als 0 sein');
            }
        }
    }

    // Update transaction summary
    updateTransactionSummary(amount, total) {
        const summaryAmount = DOM.get('summary-amount');
        const summaryTotal = DOM.get('summary-total');
        
        if (summaryAmount) {
            summaryAmount.textContent = Format.ctc(amount);
        }
        
        if (summaryTotal) {
            summaryTotal.textContent = Format.ctc(total);
        }
    }

    // Send transaction
    async sendTransaction() {
        const wallet = walletScreen.getCurrentWallet();
        if (!wallet) {
            Toast.error('Wallet nicht initialisiert');
            return;
        }

        const address = this.recipientAddress;
        const amount = this.amount;
        
        // Final validation
        if (!Validation.address(address)) {
            Toast.error('Ungültige Empfängeradresse');
            return;
        }
        
        const fee = 0.0001;
        const amountValidation = Validation.amount(amount, this.availableBalance - fee);
        if (!amountValidation.valid) {
            Toast.error(amountValidation.error);
            return;
        }

        // Show sending state
        const slideText = DOM.get('slide-text');
        const slideIcon = DOM.get('slide-icon');
        
        if (slideText) slideText.textContent = 'Transaktion wird gesendet...';
        if (slideIcon) slideIcon.className = 'fas fa-spinner fa-spin';

        try {
            // Send transaction through API
            const result = await transactionManager.sendTransaction(
                wallet.address,
                address,
                amount,
                wallet
            );

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

// QR Detection utility class
class QRDetector {
    static detect(imageData) {
        // Try jsQR first if available
        if (window.jsQR) {
            const result = jsQR(imageData.data, imageData.width, imageData.height);
            return result ? result.data : null;
        }
        
        // Fallback to simple detection pattern matching
        return QRDetector.simpleDetection(imageData);
    }
    
    // Simple fallback detection for demo purposes
    static simpleDetection(imageData) {
        // This is a very basic approach for demo purposes
        // In production, always use a proper QR detection library like jsQR
        const { data, width, height } = imageData;
        
        // Look for QR-like patterns (very simplified)
        // This is just for demonstration - not a real QR detector
        let darkPixels = 0;
        let totalPixels = width * height;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < 128) darkPixels++;
        }
        
        const darkRatio = darkPixels / totalPixels;
        
        // If image has QR-like dark/light ratio, simulate detection
        if (darkRatio > 0.3 && darkRatio < 0.7) {
            // Return random demo QR code for testing
            const demoQRCodes = [
                'CTC9876543210abcdef98765',
                'ctc:CTC1234567890abcdef123?amount=2.5',
                'ctc:CTC9876543210abcdef98765?amount=10&note=Payment'
            ];
            
            if (Math.random() < 0.1) { // 10% chance of "detection"
                return demoQRCodes[Math.floor(Math.random() * demoQRCodes.length)];
            }
        }
        
        return null;
    }
}

// Create global send screen instance
const sendScreen = new SendScreen();

// Export to global scope
window.sendScreen = sendScreen;
window.QRDetector = QRDetector;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (sendScreen) {
        sendScreen.cleanup();
    }
});

console.log('📤 Enhanced Send screen with slide-to-confirm loaded');