// js/utils/qr-utils.js - Enhanced QR Code Utilities with Scanner Support

class CTCQRGenerator {
    constructor() {
        this.defaultSize = 256;
        this.defaultLevel = 'M'; // Error correction level: L, M, Q, H
    }

    // Generate QR-Code for address
    generateAddressQR(address, canvasId, size = this.defaultSize) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error('Canvas element not found: ' + canvasId);
            }

            // Validate CTC address
            if (!this.validateCTCAddress(address)) {
                throw new Error('Invalid CTC address format');
            }

            // Check if QRious is available
            if (!window.QRious) {
                throw new Error('QRious library not available');
            }

            // Create QR-Code
            new QRious({
                element: canvas,
                value: address,
                size: size,
                level: this.defaultLevel,
                background: 'white',
                foreground: 'black',
                padding: null
            });

            console.log('✅ QR-Code generated for address:', address);
            return true;

        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            return false;
        }
    }

    // Generate Payment QR-Code (ctc:address?amount=...)
    generatePaymentQR(address, amount, canvasId, size = this.defaultSize) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error('Canvas element not found: ' + canvasId);
            }

            // Validate inputs
            if (!this.validateCTCAddress(address)) {
                throw new Error('Invalid CTC address format');
            }

            if (amount && (isNaN(amount) || amount <= 0)) {
                throw new Error('Invalid amount');
            }

            // Create Payment URI
            let paymentUri = `ctc:${address}`;
            if (amount && amount > 0) {
                paymentUri += `?amount=${amount}`;
            }

            // Check if QRious is available
            if (!window.QRious) {
                throw new Error('QRious library not available');
            }

            // Create QR-Code
            new QRious({
                element: canvas,
                value: paymentUri,
                size: size,
                level: this.defaultLevel,
                background: 'white',
                foreground: 'black',
                padding: null
            });

            console.log('✅ Payment QR-Code generated:', paymentUri);
            return paymentUri;

        } catch (error) {
            console.error('❌ Error generating payment QR code:', error);
            return false;
        }
    }

    // Export QR-Code as Data URL
    exportQRAsDataURL(canvasId) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error exporting QR code:', error);
            return null;
        }
    }

    // Export QR-Code as Blob
    exportQRAsBlob(canvasId) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    reject(new Error('Canvas element not found'));
                    return;
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/png');
            } catch (error) {
                reject(error);
            }
        });
    }

    // Validate CTC address format
    validateCTCAddress(address) {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // CTC address should start with "CTC" and be 24 characters long
        return address.startsWith('CTC') && address.length === 24;
    }

    // Parse Payment URI
    parsePaymentURI(uri) {
        try {
            if (!uri.startsWith('ctc:')) {
                throw new Error('Invalid payment URI scheme');
            }

            const parts = uri.substring(4).split('?');
            const address = parts[0];
            
            if (!this.validateCTCAddress(address)) {
                throw new Error('Invalid address in payment URI');
            }

            const result = { address };

            if (parts[1]) {
                const params = new URLSearchParams(parts[1]);
                if (params.has('amount')) {
                    const amount = parseFloat(params.get('amount'));
                    if (!isNaN(amount) && amount > 0) {
                        result.amount = amount;
                    }
                }
                if (params.has('note')) {
                    result.note = decodeURIComponent(params.get('note'));
                }
            }

            return result;
        } catch (error) {
            console.error('Error parsing payment URI:', error);
            return null;
        }
    }

    // Generate multiple QR code sizes
    async generateMultipleSizes(address) {
        const sizes = [128, 256, 512];
        const results = {};
        
        try {
            for (const size of sizes) {
                // Create temporary canvas
                const canvas = document.createElement('canvas');
                canvas.id = `temp-qr-${size}-${Date.now()}`;
                document.body.appendChild(canvas);
                
                const success = this.generateAddressQR(address, canvas.id, size);
                
                if (success) {
                    results[size] = canvas.toDataURL('image/png');
                }
                
                // Clean up
                document.body.removeChild(canvas);
            }
            
            return results;
            
        } catch (error) {
            console.error('Error generating multiple QR sizes:', error);
            return {};
        }
    }

    // Create QR code with custom styling
    generateStyledQR(address, canvasId, options = {}) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error('Canvas element not found: ' + canvasId);
            }

            // Validate CTC address
            if (!this.validateCTCAddress(address)) {
                throw new Error('Invalid CTC address format');
            }

            // Check if QRious is available
            if (!window.QRious) {
                throw new Error('QRious library not available');
            }

            // Default options
            const defaultOptions = {
                size: this.defaultSize,
                level: this.defaultLevel,
                background: 'white',
                foreground: 'black',
                padding: null
            };

            // Merge with custom options
            const qrOptions = { ...defaultOptions, ...options };

            // Create QR-Code
            new QRious({
                element: canvas,
                value: address,
                ...qrOptions
            });

            console.log('✅ Styled QR-Code generated for address:', address);
            return true;

        } catch (error) {
            console.error('❌ Error generating styled QR code:', error);
            return false;
        }
    }
}

// Enhanced QR Scanner with jsQR integration
class CTCQRScanner {
    constructor() {
        this.isScanning = false;
        this.videoStream = null;
        this.scanInterval = null;
        this.onDetectCallback = null;
        this.scanRate = 250; // Scan every 250ms
    }

    // Initialize scanner with video element
    async initialize(videoElement, onDetect) {
        this.videoElement = videoElement;
        this.onDetectCallback = onDetect;
        
        try {
            // Request camera access
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.videoElement.srcObject = this.videoStream;
            await this.videoElement.play();
            
            console.log('✅ QR Scanner initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Scanner initialization failed:', error);
            throw error;
        }
    }

    // Start scanning for QR codes
    startScanning() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.scanInterval = setInterval(() => {
            this.scanFrame();
        }, this.scanRate);
        
        console.log('🔍 QR scanning started');
    }

    // Stop scanning
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
        
        console.log('⏹️ QR scanning stopped');
    }

    // Scan current video frame for QR codes
    scanFrame() {
        if (!this.videoElement || !this.isScanning) return;
        
        try {
            // Create canvas to capture frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            
            if (canvas.width === 0 || canvas.height === 0) return;
            
            // Draw current video frame
            ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Detect QR code
            const qrData = this.detectQR(imageData);
            
            if (qrData && this.onDetectCallback) {
                this.stopScanning();
                this.onDetectCallback(qrData);
            }
            
        } catch (error) {
            console.error('Error scanning frame:', error);
        }
    }

    // Detect QR code in image data
    detectQR(imageData) {
        // Use jsQR if available
        if (typeof jsQR !== 'undefined') {
            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                if (code) {
                    console.log('🎯 QR Code detected:', code.data);
                    return code.data;
                }
            } catch (error) {
                console.error('jsQR detection error:', error);
            }
        }
        
        return null;
    }

    // Switch camera (front/back)
    async switchCamera() {
        try {
            if (this.videoStream) {
                this.videoStream.getTracks().forEach(track => track.stop());
            }
            
            const facingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
            this.currentFacingMode = facingMode;
            
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.videoElement.srcObject = this.videoStream;
            await this.videoElement.play();
            
            console.log('📷 Camera switched to:', facingMode);
            return true;
            
        } catch (error) {
            console.error('Camera switch failed:', error);
            throw error;
        }
    }

    // Toggle flashlight
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
                    
                    console.log('🔦 Flashlight toggled:', !settings.torch);
                    return !settings.torch;
                }
            }
            return false;
        } catch (error) {
            console.error('Flashlight toggle failed:', error);
            throw error;
        }
    }

    // Check camera availability
    static async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return {
                available: videoDevices.length > 0,
                count: videoDevices.length,
                devices: videoDevices
            };
        } catch (error) {
            console.error('Camera availability check failed:', error);
            return { available: false, count: 0, devices: [] };
        }
    }

    // Check camera permissions
    static async checkCameraPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.error('Permission check failed:', error);
            return 'unknown';
        }
    }

    // Get camera capabilities
    getCameraCapabilities() {
        if (this.videoStream) {
            const track = this.videoStream.getVideoTracks()[0];
            return track.getCapabilities ? track.getCapabilities() : {};
        }
        return {};
    }

    // Set scan rate (how often to check for QR codes)
    setScanRate(rateMs) {
        this.scanRate = Math.max(100, rateMs); // Minimum 100ms
        
        if (this.isScanning) {
            this.stopScanning();
            this.startScanning();
        }
    }
}

// QR Code Validator
class QRValidator {
    // Validate CTC-specific QR codes
    static validateCTCQR(qrData) {
        if (!qrData || typeof qrData !== 'string') {
            return { valid: false, error: 'Invalid QR data' };
        }

        // Check for CTC address
        if (qrData.startsWith('CTC') && qrData.length === 24) {
            return { 
                valid: true, 
                type: 'address',
                data: { address: qrData }
            };
        }

        // Check for CTC payment URI
        if (qrData.startsWith('ctc:')) {
            try {
                const parsed = window.qrGenerator.parsePaymentURI(qrData);
                if (parsed) {
                    return {
                        valid: true,
                        type: 'payment',
                        data: parsed
                    };
                }
            } catch (error) {
                return { valid: false, error: 'Invalid payment URI' };
            }
        }

        // Check for other common formats
        if (qrData.startsWith('bitcoin:') || qrData.startsWith('ethereum:')) {
            return { valid: false, error: 'Unsupported cryptocurrency' };
        }

        if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
            return { valid: false, error: 'URL QR codes not supported' };
        }

        return { valid: false, error: 'Unrecognized QR code format' };
    }

    // Validate address format specifically
    static validateAddress(address) {
        return address && 
               typeof address === 'string' && 
               address.startsWith('CTC') && 
               address.length === 24 &&
               /^CTC[a-zA-Z0-9]{21}$/.test(address);
    }

    // Get QR code type from data
    static getQRType(qrData) {
        if (!qrData) return 'unknown';
        
        if (qrData.startsWith('CTC') && qrData.length === 24) return 'address';
        if (qrData.startsWith('ctc:')) return 'payment';
        if (qrData.startsWith('http')) return 'url';
        if (qrData.includes('@')) return 'email';
        
        return 'text';
    }
}

// QR Code History Manager
class QRHistory {
    constructor() {
        this.maxHistory = 50;
        this.storageKey = 'ctc-qr-history';
    }

    // Add QR code to history
    addToHistory(qrData, type = 'unknown') {
        try {
            const history = this.getHistory();
            const newEntry = {
                data: qrData,
                type: type,
                timestamp: Date.now(),
                id: this.generateId()
            };

            // Remove duplicates
            const filtered = history.filter(item => item.data !== qrData);
            
            // Add new entry at beginning
            filtered.unshift(newEntry);
            
            // Limit history size
            const trimmed = filtered.slice(0, this.maxHistory);
            
            // Save to storage
            localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
            
            console.log('📝 QR added to history:', qrData);
            
        } catch (error) {
            console.error('Error adding to QR history:', error);
        }
    }

    // Get QR code history
    getHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading QR history:', error);
            return [];
        }
    }

    // Clear history
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ QR history cleared');
        } catch (error) {
            console.error('Error clearing QR history:', error);
        }
    }

    // Remove specific entry
    removeEntry(id) {
        try {
            const history = this.getHistory();
            const filtered = history.filter(item => item.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error removing QR history entry:', error);
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Get recent addresses only
    getRecentAddresses(limit = 10) {
        const history = this.getHistory();
        return history
            .filter(item => item.type === 'address')
            .slice(0, limit)
            .map(item => item.data);
    }
}

// Enhanced QR Utils with all features
class EnhancedQRUtils {
    constructor() {
        this.generator = new CTCQRGenerator();
        this.scanner = new CTCQRScanner();
        this.validator = QRValidator;
        this.history = new QRHistory();
    }

    // Generate address QR
    generateAddressQR(address, canvasId, size) {
        const result = this.generator.generateAddressQR(address, canvasId, size);
        if (result) {
            this.history.addToHistory(address, 'address');
        }
        return result;
    }

    // Generate payment QR
    generatePaymentQR(address, amount, canvasId, size) {
        const result = this.generator.generatePaymentQR(address, amount, canvasId, size);
        if (result) {
            this.history.addToHistory(result, 'payment');
        }
        return result;
    }

    // Scan QR code with validation
    async scanQRCode(videoElement, onDetect) {
        try {
            await this.scanner.initialize(videoElement, (qrData) => {
                // Validate QR code
                const validation = this.validator.validateCTCQR(qrData);
                
                if (validation.valid) {
                    this.history.addToHistory(qrData, validation.type);
                    onDetect(validation.data, validation.type);
                } else {
                    console.warn('Invalid QR code:', validation.error);
                    onDetect(null, null, validation.error);
                }
            });
            
            this.scanner.startScanning();
            return true;
            
        } catch (error) {
            console.error('QR scan failed:', error);
            throw error;
        }
    }

    // Stop scanning
    stopScanning() {
        this.scanner.stopScanning();
    }

    // Validate CTC QR code
    validateQR(qrData) {
        return this.validator.validateCTCQR(qrData);
    }

    // Parse payment URI
    parsePaymentURI(uri) {
        return this.generator.parsePaymentURI(uri);
    }

    // Validate CTC address
    validateCTCAddress(address) {
        return this.generator.validateCTCAddress(address);
    }

    // Get scan history
    getHistory() {
        return this.history.getHistory();
    }

    // Clear scan history
    clearHistory() {
        this.history.clearHistory();
    }

    // Check camera capabilities
    static async checkCapabilities() {
        const camera = await CTCQRScanner.checkCameraAvailability();
        const permissions = await CTCQRScanner.checkCameraPermissions();
        
        return {
            camera,
            permissions,
            jsQR: typeof jsQR !== 'undefined',
            qrious: typeof QRious !== 'undefined'
        };
    }
}

// Create global instances
const qrGenerator = new CTCQRGenerator();
const qrScanner = new CTCQRScanner();
const qrHistory = new QRHistory();
const enhancedQRUtils = new EnhancedQRUtils();

// Export to global scope
window.qrGenerator = qrGenerator;
window.qrScanner = qrScanner;
window.qrHistory = qrHistory;
window.enhancedQRUtils = enhancedQRUtils;
window.CTCQRGenerator = CTCQRGenerator;
window.CTCQRScanner = CTCQRScanner;
window.QRValidator = QRValidator;
window.QRHistory = QRHistory;

// Initialize capabilities check
EnhancedQRUtils.checkCapabilities().then(capabilities => {
    console.log('📱 QR Capabilities:', capabilities);
    window.qrCapabilities = capabilities;
}).catch(console.error);

console.log('📱 Enhanced QR Generator and Scanner utilities loaded');