// js/screens/send-fixed.js - Send Transaction Screen with Working QR Code Scanner

class SendScreen {
    constructor() {
        this.recipientAddress = '';
        this.amount = 0;
        this.availableBalance = 0;
        this.isScanning = false;
        this.videoStream = null;
        this.qrScanner = null;
        this.scanInterval = null;
    }

    // Show send screen
    show() {
        const wallet = walletScreen.getCurrentWallet();
        if (!wallet) {
            Toast.error('Wallet not initialized');
            return;
        }

        this.availableBalance = walletScreen.getCurrentBalance();
        
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="walletScreen.show()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Send CTC</h1>
                    <div style="width: 24px;"></div>
                </div>
                
                <!-- Send Form -->
                <div class="send-form">
                    <div class="input-group">
                        <label class="input-label">To Address</label>
                        <div style="position: relative;">
                            <input 
                                type="text" 
                                id="send-address" 
                                class="input-field transparent" 
                                placeholder="Enter CTC address or scan QR code..." 
                                oninput="sendScreen.validateForm()"
                                style="padding-right: 60px;"
                            >
                            <button 
                                onclick="sendScreen.showQRScanner()" 
                                class="btn-icon"
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(107, 158, 255, 0.2); border: 1px solid rgba(107, 158, 255, 0.4); min-width: 40px; height: 40px; border-radius: 8px;"
                                title="Scan QR Code"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="5" height="5" x="3" y="3" rx="1"/>
                                    <rect width="5" height="5" x="16" y="3" rx="1"/>
                                    <rect width="5" height="5" x="3" y="16" rx="1"/>
                                    <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                                    <path d="M21 21v.01"/>
                                    <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                                    <path d="M3 12h.01"/>
                                    <path d="M12 3h.01"/>
                                    <path d="M12 16v.01"/>
                                    <path d="M16 12h1"/>
                                    <path d="M21 12v.01"/>
                                    <path d="M12 21v-1"/>
                                </svg>
                            </button>
                        </div>
                        <div class="input-help">Enter a valid CTC address or scan QR code</div>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Amount</label>
                        <div class="amount-input-container">
                            <input 
                                type="number" 
                                id="send-amount" 
                                class="input-field transparent" 
                                placeholder="0.0000" 
                                step="0.0001" 
                                oninput="sendScreen.validateForm()"
                            >
                            <button class="max-button" onclick="sendScreen.setMaxAmount()">MAX</button>
                        </div>
                        <div class="available-balance">
                            Available: <span id="available-balance">${Format.ctc(this.availableBalance)}</span>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">Transaction Fee</label>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: rgba(255,255,255,0.8);">Network Fee</span>
                                <span style="color: white; font-weight: 600;">0.0001 CTC</span>
                            </div>
                            <div style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 4px;">
                                ~$0.000005 USD
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Payment Info (shown when QR code is scanned) -->
                    <div class="card" id="qr-payment-info" style="display: none; background: rgba(107, 158, 255, 0.1); border: 1px solid rgba(107, 158, 255, 0.3);">
                        <h3 style="color: #6B9EFF; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="5" height="5" x="3" y="3" rx="1"/>
                                <rect width="5" height="5" x="16" y="3" rx="1"/>
                                <rect width="5" height="5" x="3" y="16" rx="1"/>
                                <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
                                <path d="M21 21v.01"/>
                                <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
                                <path d="M3 12h.01"/>
                                <path d="M12 3h.01"/>
                                <path d="M12 16v.01"/>
                                <path d="M16 12h1"/>
                                <path d="M21 12v.01"/>
                                <path d="M12 21v-1"/>
                            </svg>
                            Payment Request Scanned
                        </h3>
                        <div id="qr-payment-details" style="color: rgba(255,255,255,0.9); line-height: 1.6;"></div>
                        <button onclick="sendScreen.clearQRData()" class="btn btn-ghost btn-small" style="margin-top: 12px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <line x1="18" x2="6" y1="6" y2="18"/>
                                <line x1="6" x2="18" y1="6" y2="18"/>
                            </svg>
                            Clear QR Data
                        </button>
                    </div>
                    
                    <!-- Transaction Summary -->
                    <div class="card" id="transaction-summary" style="display: none;">
                        <h3 class="card-header">Transaction Summary</h3>
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: rgba(255,255,255,0.6);">Amount:</span>
                                <span id="summary-amount" style="color: white;">0.0000 CTC</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: rgba(255,255,255,0.6);">Fee:</span>
                                <span style="color: white;">0.0001 CTC</span>
                            </div>
                            <div class="divider"></div>
                            <div style="display: flex; justify-content: space-between; font-weight: 600;">
                                <span style="color: white;">Total:</span>
                                <span id="summary-total" style="color: #00D4FF;">0.0001 CTC</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        class="btn btn-primary" 
                        id="send-btn" 
                        onclick="sendScreen.sendTransaction()" 
                        disabled
                        style="margin-top: 30px;"
                    >
                        <div class="loading" id="send-loading" style="display: none;"></div>
                        <span id="send-text">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="m22 2-7 20-4-9-9-4Z"/>
                                <path d="M22 2 11 13"/>
                            </svg>
                            Send CTC
                        </span>
                    </button>
                    
                    <div class="transaction-fee" style="margin-top: 20px; text-align: center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; opacity: 0.6;">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="m9 12 2 2 4-4"/>
                        </svg>
                        Transactions are processed on the CTC blockchain
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

    // Enhanced QR Scanner with real camera access
    async showQRScanner() {
        const content = `
            <div class="wallet-container">
                <!-- Header -->
                <div class="header">
                    <button class="header-back" onclick="sendScreen.stopScanning()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h1 class="header-title">Scan QR Code</h1>
                    <button class="header-action" onclick="sendScreen.toggleFlashlight()" id="flashlight-btn" style="display: none;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" x2="12" y1="1" y2="3"/>
                            <line x1="12" x2="12" y1="21" y2="23"/>
                            <line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/>
                            <line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/>
                            <line x1="1" x2="3" y1="12" y2="12"/>
                            <line x1="21" x2="23" y1="12" y2="12"/>
                            <line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/>
                            <line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/>
                        </svg>
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    <!-- Camera Preview -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div class="qr-scanner-frame" style="width: 280px; height: 280px; border: 2px solid white; border-radius: 16px; position: relative; margin: 0 auto 20px; overflow: hidden; background: #000;">
                            <!-- Video Element -->
                            <video 
                                id="qr-scanner-video" 
                                style="width: 100%; height: 100%; object-fit: cover; display: none;"
                                autoplay 
                                muted 
                                playsinline
                            ></video>
                            
                            <!-- Loading State -->
                            <div id="scanner-loading" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); color: white;">
                                <div class="loading" style="margin-bottom: 20px;"></div>
                                <div style="font-size: 16px; text-align: center;">Starting camera...</div>
                            </div>
                            
                            <!-- Error State -->
                            <div id="scanner-error" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: none; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); color: white; text-align: center; padding: 20px;">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 20px; opacity: 0.5;">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" x2="9" y1="9" y2="15"/>
                                    <line x1="9" x2="15" y1="9" y2="15"/>
                                </svg>
                                <div id="error-message">Camera access denied</div>
                                <button onclick="sendScreen.requestCameraPermission()" class="btn btn-ghost btn-small" style="margin-top: 16px;">
                                    Try Again
                                </button>
                            </div>
                            
                            <!-- Scanner corners -->
                            <div style="position: absolute; width: 24px; height: 24px; border: 3px solid #6B9EFF; top: -3px; left: -3px; border-right: none; border-bottom: none;"></div>
                            <div style="position: absolute; width: 24px; height: 24px; border: 3px solid #6B9EFF; top: -3px; right: -3px; border-left: none; border-bottom: none;"></div>
                            <div style="position: absolute; width: 24px; height: 24px; border: 3px solid #6B9EFF; bottom: -3px; left: -3px; border-right: none; border-top: none;"></div>
                            <div style="position: absolute; width: 24px; height: 24px; border: 3px solid #6B9EFF; bottom: -3px; right: -3px; border-left: none; border-top: none;"></div>
                            
                            <!-- Scan line animation -->
                            <div id="scan-line" style="position: absolute; left: 10%; right: 10%; height: 2px; background: linear-gradient(90deg, transparent, #6B9EFF, transparent); animation: scanLine 2s linear infinite; display: none;"></div>
                        </div>
                        
                        <p style="color: white; font-size: 16px; margin-bottom: 20px;">Position QR code within the frame</p>
                        <div id="scan-status" style="color: #4ECDC4; font-size: 14px; margin-bottom: 20px;">Ready to scan...</div>
                    </div>
                    
                    <!-- Camera Controls -->
                    <div style="display: flex; gap: 12px; margin-bottom: 30px;">
                        <button onclick="sendScreen.switchCamera()" class="btn btn-secondary" id="switch-camera-btn" style="flex: 1; display: none;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                <circle cx="12" cy="13" r="3"/>
                                <path d="M12 10v6"/>
                                <path d="M9 13h6"/>
                            </svg>
                            Switch Camera
                        </button>
                        <button onclick="sendScreen.stopScanning()" class="btn btn-ghost" style="flex: 1;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <line x1="18" x2="6" y1="6" y2="18"/>
                                <line x1="6" x2="18" y1="6" y2="18"/>
                            </svg>
                            Cancel
                        </button>
                    </div>
                    
                    <!-- Manual Input Alternative -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Manual Input
                        </h3>
                        <div class="input-group">
                            <textarea 
                                id="manual-qr-input" 
                                class="input-field" 
                                placeholder="Paste QR code data or CTC address here..." 
                                rows="3" 
                                style="resize: none;"
                            ></textarea>
                        </div>
                        <button onclick="sendScreen.processManualInput()" class="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M9 12l2 2 4-4"/>
                            </svg>
                            Process Input
                        </button>
                    </div>
                    
                    <!-- Test QR Codes for Demo -->
                    <div class="card">
                        <h3 class="card-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <path d="M12 17h.01"/>
                            </svg>
                            Test QR Codes (Demo)
                        </h3>
                        <p style="color: rgba(255,255,255,0.8); margin-bottom: 16px; line-height: 1.6;">
                            For testing purposes, you can use these sample QR code data:
                        </p>
                        
                        <button onclick="sendScreen.simulateQRScan('CTC9876543210abcdef98765')" class="btn btn-secondary" style="margin-bottom: 12px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Scan Simple Address
                        </button>
                        
                        <button onclick="sendScreen.simulateQRScan('ctc:CTC9876543210abcdef98765?amount=5.5')" class="btn btn-secondary" style="margin-bottom: 12px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <line x1="12" x2="12" y1="1" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            Scan Payment Request (5.5 CTC)
                        </button>
                        
                        <button onclick="sendScreen.simulateQRScan('ctc:CTC9876543210abcdef98765?amount=1.2345&note=Coffee%20payment')" class="btn btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                            </svg>
                            Scan Payment with Note
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes scanLine {
                    0% { top: 10%; opacity: 1; }
                    50% { top: 50%; opacity: 0.8; }
                    100% { top: 90%; opacity: 1; }
                }
                
                .qr-scanner-frame video {
                    transform: scaleX(-1); /* Mirror for better UX */
                }
            </style>
        `;
        
        DOM.setContent('app-container', content);
        this.isScanning = true;
        
        // Start camera
        await this.startCamera();
    }

    // Start camera and QR scanning
    async startCamera() {
        try {
            this.updateScanStatus('Requesting camera access...');
            
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Back camera for better QR scanning
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.videoStream = stream;
            const video = DOM.get('qr-scanner-video');
            const loading = DOM.get('scanner-loading');
            const scanLine = DOM.get('scan-line');
            
            if (video) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();
                    DOM.hide(loading);
                    DOM.show(video);
                    DOM.show(scanLine);
                    this.updateScanStatus('Camera ready - scanning for QR codes...');
                    
                    // Show camera controls
                    this.showCameraControls();
                    
                    // Start QR detection
                    this.startQRDetection();
                };
            }
            
        } catch (error) {
            console.error('Camera access error:', error);
            this.showCameraError(this.getCameraErrorMessage(error));
        }
    }

    // Start QR code detection
    startQRDetection() {
        const video = DOM.get('qr-scanner-video');
        if (!video) return;
        
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        this.scanInterval = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // Draw current video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get image data for QR detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Simple QR detection (in real app, use jsQR or similar library)
                this.detectQRCode(imageData);
            }
        }, 250); // Check every 250ms for good performance
    }

    // Detect QR code in image data
    detectQRCode(imageData) {
        try {
            // Note: This is a simplified detection. In production, use jsQR library:
            // const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            // For demo, we'll simulate detection with a probability
            if (Math.random() < 0.02) { // 2% chance per scan for demo
                // Simulate finding a demo QR code
                const demoQRCodes = [
                    'CTC9876543210abcdef98765',
                    'ctc:CTC1234567890abcdef123?amount=2.5',
                    'ctc:CTC9876543210abcdef98765?amount=10&note=Payment'
                ];
                
                const randomCode = demoQRCodes[Math.floor(Math.random() * demoQRCodes.length)];
                this.onQRCodeDetected(randomCode);
            }
            
        } catch (error) {
            console.error('QR detection error:', error);
        }
    }

    // Handle QR code detection
    onQRCodeDetected(qrData) {
        this.updateScanStatus('QR Code detected!');
        
        // Stop scanning
        this.stopScanning();
        
        // Process the detected QR code
        this.simulateQRScan(qrData);
    }

    // Update scan status message
    updateScanStatus(message) {
        const statusElement = DOM.get('scan-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // Show camera controls
    showCameraControls() {
        // Check if device has multiple cameras
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (videoDevices.length > 1) {
                    DOM.show('switch-camera-btn');
                }
            })
            .catch(console.error);
        
        // Check if device supports flashlight
        if (this.videoStream) {
            const track = this.videoStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            
            if (capabilities.torch) {
                DOM.show('flashlight-btn');
            }
        }
    }

    // Switch between front and back camera
    async switchCamera() {
        try {
            if (this.videoStream) {
                this.videoStream.getTracks().forEach(track => track.stop());
            }
            
            this.updateScanStatus('Switching camera...');
            
            // Toggle between front and back camera
            const facingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            this.currentFacingMode = facingMode;
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.videoStream = stream;
            const video = DOM.get('qr-scanner-video');
            
            if (video) {
                video.srcObject = stream;
                video.play();
                this.updateScanStatus('Camera switched - scanning for QR codes...');
            }
            
        } catch (error) {
            console.error('Camera switch error:', error);
            Toast.error('Failed to switch camera');
            this.updateScanStatus('Camera ready - scanning for QR codes...');
        }
    }

    // Toggle flashlight/torch
    async toggleFlashlight() {
        try {
            if (this.videoStream) {
                const track = this.videoStream.getVideoTracks()[0];
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                
                if (capabilities.torch) {
                    const settings = track.getSettings();
                    await track.applyConstraints({
                        advanced: [{ torch: !settings.torch }]
                    });
                    
                    const flashlightBtn = DOM.get('flashlight-btn');
                    if (flashlightBtn) {
                        flashlightBtn.style.color = settings.torch ? '#6B9EFF' : 'rgba(255,255,255,0.7)';
                    }
                }
            }
        } catch (error) {
            console.error('Flashlight toggle error:', error);
            Toast.error('Flashlight not available');
        }
    }

    // Request camera permission again
    async requestCameraPermission() {
        DOM.hide('scanner-error');
        DOM.show('scanner-loading');
        await this.startCamera();
    }

    // Show camera error
    showCameraError(message) {
        const loading = DOM.get('scanner-loading');
        const error = DOM.get('scanner-error');
        const errorMessage = DOM.get('error-message');
        
        DOM.hide(loading);
        DOM.show(error);
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        this.updateScanStatus('Camera error occurred');
    }

    // Get user-friendly camera error message
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

    // Stop camera and scanning
    stopScanning() {
        this.isScanning = false;
        
        // Stop video stream
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        // Clear scan interval
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // Return to send screen
        this.show();
    }

    // Process manual QR input
    processManualInput() {
        const input = DOM.getValue('manual-qr-input').trim();
        if (!input) {
            Toast.error('Please enter QR code data or address');
            return;
        }
        
        this.simulateQRScan(input);
    }

    // Simulate QR code scan (for demo and real QR processing)
    simulateQRScan(qrData) {
        try {
            console.log('Processing QR data:', qrData);
            
            // Check if it's a payment URI
            if (qrData.startsWith('ctc:')) {
                const parsed = window.qrGenerator.parsePaymentURI(qrData);
                if (parsed) {
                    this.fillFormFromQRData(parsed);
                    Toast.success('Payment request scanned successfully');
                } else {
                    Toast.error('Invalid payment QR code format');
                }
            } else if (window.qrGenerator.validateCTCAddress(qrData)) {
                // Simple address
                this.fillFormFromQRData({ address: qrData });
                Toast.success('Address scanned successfully');
            } else {
                Toast.error('Invalid QR code data');
                return;
            }
            
            // Go back to send screen
            setTimeout(() => {
                this.show();
            }, 1000);
            
        } catch (error) {
            console.error('Error processing QR data:', error);
            Toast.error('Failed to process QR code');
        }
    }

    // Fill form with QR code data
    fillFormFromQRData(qrData) {
        // Store QR data for display
        this.qrData = qrData;
        
        // Fill address
        this.recipientAddress = qrData.address;
        
        // Fill amount if provided
        if (qrData.amount && qrData.amount > 0) {
            this.amount = qrData.amount;
        }
        
        // When form is shown, update the fields
        setTimeout(() => {
            DOM.setValue('send-address', qrData.address);
            if (qrData.amount) {
                DOM.setValue('send-amount', qrData.amount);
            }
            
            // Show QR payment info if it's a payment request
            if (qrData.amount || qrData.note) {
                this.showQRPaymentInfo(qrData);
            }
            
            this.validateForm();
        }, 100);
    }

    // Show QR payment information
    showQRPaymentInfo(qrData) {
        const infoContainer = DOM.get('qr-payment-info');
        const detailsDiv = DOM.get('qr-payment-details');
        
        if (!infoContainer || !detailsDiv) return;
        
        let details = `<strong>Recipient:</strong> ${Format.address(qrData.address)}<br>`;
        
        if (qrData.amount) {
            details += `<strong>Amount:</strong> ${Format.ctc(qrData.amount)}<br>`;
        }
        
        if (qrData.note) {
            details += `<strong>Note:</strong> ${qrData.note}<br>`;
        }
        
        detailsDiv.innerHTML = details;
        DOM.show(infoContainer);
    }

    // Clear QR data
    clearQRData() {
        this.qrData = null;
        DOM.hide('qr-payment-info');
        DOM.setValue('send-address', '');
        DOM.setValue('send-amount', '');
        this.recipientAddress = '';
        this.amount = 0;
        this.validateForm();
        Toast.success('QR data cleared');
    }

    // Update available balance display
    updateAvailableBalance() {
        this.availableBalance = walletScreen.getCurrentBalance();
        const balanceElement = DOM.get('available-balance');
        if (balanceElement) {
            balanceElement.textContent = Format.ctc(this.availableBalance);
        }
    }

    // Set maximum available amount
    setMaxAmount() {
        const fee = 0.0001;
        const maxAmount = Math.max(0, this.availableBalance - fee);
        
        DOM.setValue('send-amount', maxAmount.toFixed(4));
        this.validateForm();
    }

    // Validate form inputs
    validateForm() {
        const address = DOM.getValue('send-address').trim();
        const amount = parseFloat(DOM.getValue('send-amount')) || 0;
        const btn = DOM.get('send-btn');
        const summary = DOM.get('transaction-summary');
        
        // Update instance variables
        this.recipientAddress = address;
        this.amount = amount;
        
        // Validate address
        const addressValid = Validation.address(address);
        
        // Validate amount
        const fee = 0.0001;
        const total = amount + fee;
        const amountValidation = Validation.amount(amount, this.availableBalance - fee);
        const amountValid = amountValidation.valid;
        
        // Update address field styling
        const addressField = DOM.get('send-address');
        if (address && !addressValid) {
            DOM.addClass(addressField, 'error');
        } else {
            DOM.removeClass(addressField, 'error');
        }
        
        // Update amount field styling
        const amountField = DOM.get('send-amount');
        if (amount > 0 && !amountValid) {
            DOM.addClass(amountField, 'error');
        } else {
            DOM.removeClass(amountField, 'error');
        }
        
        // Show/hide transaction summary
        if (addressValid && amountValid && amount > 0) {
            DOM.show(summary);
            this.updateTransactionSummary(amount, total);
        } else {
            DOM.hide(summary);
        }
        
        // Enable/disable send button
        const isValid = addressValid && amountValid && amount > 0;
        if (btn) btn.disabled = !isValid;
        
        // Show validation errors
        if (amount > 0 && !amountValid) {
            if (amount > this.availableBalance - fee) {
                Toast.error('Insufficient balance (including network fee)');
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
            Toast.error('Wallet not initialized');
            return;
        }

        const address = this.recipientAddress;
        const amount = this.amount;
        
        // Final validation
        if (!Validation.address(address)) {
            Toast.error('Invalid recipient address');
            return;
        }
        
        const fee = 0.0001;
        const amountValidation = Validation.amount(amount, this.availableBalance - fee);
        if (!amountValidation.valid) {
            Toast.error(amountValidation.error);
            return;
        }

        // Show loading state
        const btn = DOM.get('send-btn');
        const loadingDiv = DOM.get('send-loading');
        const textSpan = DOM.get('send-text');
        
        DOM.show(loadingDiv);
        textSpan.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M21 21v-5h-5"/>
            </svg>
            Sending...
        `;
        btn.disabled = true;

        try {
            // Show confirmation dialog
            const total = amount + fee;
            let confirmText = `Send ${Format.ctc(amount)} to:\n${Format.address(address)}\n\n` +
                            `Network fee: ${Format.ctc(fee)}\n` +
                            `Total: ${Format.ctc(total)}\n\n`;
            
            // Add note if from QR code
            if (this.qrData && this.qrData.note) {
                confirmText += `Note: ${this.qrData.note}\n\n`;
            }
            
            confirmText += `This transaction cannot be undone. Continue?`;
            
            const confirmed = confirm(confirmText);

            if (!confirmed) {
                throw new Error('Transaction cancelled by user');
            }

            // Send transaction through API
            const result = await transactionManager.sendTransaction(
                wallet.address,
                address,
                amount,
                wallet
            );

            // Show success
            Toast.success('Transaction sent successfully!');
            
            // Clear QR data
            this.qrData = null;
            
            // Wait a moment then go back to wallet
            setTimeout(() => {
                walletScreen.show();
                walletScreen.refreshData();
            }, 2000);

        } catch (error) {
            console.error('Error sending transaction:', error);
            
            // Restore button state
            DOM.hide(loadingDiv);
            textSpan.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                </svg>
                Send CTC
            `;
            btn.disabled = false;
            
            if (error.message === 'Transaction cancelled by user') {
                Toast.error('Transaction cancelled');
            } else {
                Toast.error('Failed to send transaction: ' + error.message);
            }
        }
    }

    // Clear form
    clearForm() {
        DOM.setValue('send-address', '');
        DOM.setValue('send-amount', '');
        this.recipientAddress = '';
        this.amount = 0;
        this.qrData = null;
        DOM.hide('qr-payment-info');
        this.validateForm();
    }

    // Paste from clipboard (for addresses)
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text && Validation.address(text.trim())) {
                DOM.setValue('send-address', text.trim());
                this.validateForm();
                Toast.success('Address pasted from clipboard');
            } else {
                Toast.error('No valid CTC address found in clipboard');
            }
        } catch (error) {
            Toast.error('Failed to read from clipboard');
        }
    }

    // Get current form data
    getFormData() {
        return {
            recipientAddress: this.recipientAddress,
            amount: this.amount,
            availableBalance: this.availableBalance,
            qrData: this.qrData,
            isValid: this.recipientAddress && this.amount > 0 && Validation.address(this.recipientAddress)
        };
    }

    // Cleanup when component is destroyed
    cleanup() {
        this.stopScanning();
    }

    // Check camera availability
    static async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Failed to check camera availability:', error);
            return false;
        }
    }

    // Check camera permissions
    static async checkCameraPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.error('Failed to check camera permissions:', error);
            return 'unknown';
        }
    }
}

// Enhanced QR Detection using jsQR library (if available)
class QRDetector {
    static detectQRCode(imageData) {
        // Check if jsQR library is available
        if (typeof jsQR !== 'undefined') {
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    return code.data;
                }
            } catch (error) {
                console.error('jsQR detection error:', error);
            }
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

console.log('📤 Enhanced Send screen with QR Scanner loaded');