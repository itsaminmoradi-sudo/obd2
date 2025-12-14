export class ApiClient {
    constructor() {
        this.baseUrl = this.getApiBaseUrl();
        this.eventSource = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    getApiBaseUrl() {
        // Use localhost for development, can be configured for production
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        // In production, use relative URLs
        return '';
    }

    // Generic fetch wrapper with error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            
            // Implement retry logic for certain endpoints
            if (this.shouldRetry(endpoint) && this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                await this.delay(this.retryDelay * this.retryAttempts);
                return this.request(endpoint, options);
            }
            
            throw new Error(`Network error: ${error.message}`);
        }
    }

    shouldRetry(endpoint) {
        // Don't retry for destructive operations
        return !endpoint.includes('/delete') && !endpoint.includes('/clear');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Connection Management
    async connect(config) {
        const response = await this.request('/api/connect', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        
        // Reset retry counter on successful operation
        this.retryAttempts = 0;
        return response;
    }

    async disconnect() {
        const response = await this.request('/api/disconnect', {
            method: 'POST'
        });
        
        this.retryAttempts = 0;
        return response;
    }

    async getConnectionStatus() {
        return this.request('/api/status');
    }

    // Auto Detection
    async startDetection() {
        const response = await this.request('/api/detection/start', {
            method: 'POST'
        });
        
        return response;
    }

    async getDetectionResults() {
        return this.request('/api/detection/results');
    }

    // DTC Operations
    async readDTCs() {
        return this.request('/api/dtc/read');
    }

    async clearDTCs() {
        return this.request('/api/dtc/clear', {
            method: 'POST'
        });
    }

    async getFreezeFrameData(code) {
        return this.request(`/api/dtc/freeze-frame/${code}`);
    }

    // Live Data
    startLiveData(parameters, callback) {
        const params = new URLSearchParams();
        if (parameters && parameters.length > 0) {
            parameters.forEach(param => params.append('pid', param));
        }

        const url = `${this.baseUrl}/api/live-data/stream?${params}`;
        
        this.stopLiveData(); // Stop any existing stream

        this.eventSource = new EventSource(url);

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                callback('data', data);
            } catch (error) {
                console.error('Error parsing live data:', error);
                callback('error', { error: 'Invalid data format' });
            }
        };

        this.eventSource.onerror = (event) => {
            console.error('SSE connection error:', event);
            callback('error', { error: 'Connection lost' });
            
            // Auto-reconnect logic
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                setTimeout(() => {
                    this.startLiveData(parameters, callback);
                }, this.retryDelay * this.retryAttempts);
            }
        };

        this.eventSource.onopen = () => {
            console.log('Live data stream connected');
            this.retryAttempts = 0; // Reset retry counter on successful connection
            callback('connected', null);
        };

        return this.eventSource;
    }

    stopLiveData() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    // ECU Information
    async getECUInfo() {
        return this.request('/api/ecu/info');
    }

    async getSupportedPIDs() {
        return this.request('/api/ecu/supported-pids');
    }

    async getSupportedModes() {
        return this.request('/api/ecu/supported-modes');
    }

    // PID File Management
    async uploadPIDFile(file) {
        const formData = new FormData();
        formData.append('pidFile', file);

        const response = await fetch(`${this.baseUrl}/api/pid/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async getLoadedPIDFiles() {
        return this.request('/api/pid/files');
    }

    async deletePIDFile(filename) {
        return this.request(`/api/pid/files/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
    }

    // Health Check
    async healthCheck() {
        return this.request('/health');
    }

    // Mock Data Methods for Development
    // These simulate backend responses when backend is not available
    async mockConnect(config) {
        await this.delay(1000); // Simulate connection delay
        
        return {
            success: true,
            message: 'Connected successfully',
            protocol: config.protocolOverride || 'CAN_11BIT_500K',
            device: config.deviceSelect
        };
    }

    async mockDisconnect() {
        await this.delay(500);
        return {
            success: true,
            message: 'Disconnected successfully'
        };
    }

    async mockStartDetection() {
        await this.delay(2000); // Simulate detection delay
        
        return {
            success: true,
            message: 'Detection completed',
            vin: '1HGBH41JXMN109186',
            manufacturer: 'Honda',
            protocol: 'CAN_11BIT_500K',
            ecus: [
                { id: '01', name: 'Engine Controller', status: 'Active' },
                { id: '02', name: 'Transmission Controller', status: 'Active' },
                { id: '03', name: 'ABS Controller', status: 'Active' },
                { id: '04', name: 'Airbag Controller', status: 'Active' }
            ]
        };
    }

    async mockReadDTCs() {
        await this.delay(1500);
        
        return {
            success: true,
            stored: [
                { code: 'P0301', description: 'Cylinder 1 Misfire Detected', status: 'Active', freezeFrame: { rpm: 1200, speed: 0 } },
                { code: 'P0171', description: 'System Too Lean (Bank 1)', status: 'Active', freezeFrame: { rpm: 1500, speed: 25 } }
            ],
            pending: [
                { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', status: 'Pending', freezeFrame: null }
            ],
            permanent: []
        };
    }

    async mockClearDTCs() {
        await this.delay(1000);
        return {
            success: true,
            message: 'DTCs cleared successfully'
        };
    }

    async mockGetECUInfo() {
        await this.delay(1000);
        
        return {
            success: true,
            vin: '1HGBH41JXMN109186',
            vehicleId: 'Civic 2018',
            hardwareVersion: 'R18Z1-AAA',
            softwareVersion: '2.31.456',
            calibrationId: '37850-RNA-A510',
            cvn: '8F9C2B1A',
            engineType: '1.8L I4',
            fuelType: 'Gasoline',
            displacement: '1798cc',
            supportedModes: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '0A'],
            supportedPids: 128
        };
    }

    async mockGetLiveData() {
        return {
            rpm: Math.floor(Math.random() * 4000) + 800,
            speed: Math.floor(Math.random() * 120),
            temp: Math.floor(Math.random() * 50) + 70,
            fuel: Math.floor(Math.random() * 100),
            pressure: Math.floor(Math.random() * 500) + 100,
            load: Math.floor(Math.random() * 100),
            maf: Math.floor(Math.random() * 50) + 10,
            throttle: Math.floor(Math.random() * 100),
            voltage: (Math.random() * 2 + 12).toFixed(1),
            timing: Math.floor(Math.random() * 30) - 10
        };
    }

    async mockGetLoadedPIDFiles() {
        await this.delay(500);
        return {
            success: true,
            files: [
                {
                    name: 'honda_pids.json',
                    size: '2.3 KB',
                    uploaded: '2024-01-15 10:30:00',
                    description: 'Honda Civic 2018 PID definitions'
                },
                {
                    name: 'toyota_pids.json',
                    size: '1.8 KB',
                    uploaded: '2024-01-14 14:22:00',
                    description: 'Toyota Corolla PID definitions'
                }
            ]
        };
    }

    async mockUploadPIDFile(file) {
        await this.delay(1000);
        return {
            success: true,
            message: 'PID file uploaded successfully',
            filename: file.name
        };
    }

    async mockDeletePIDFile(filename) {
        await this.delay(500);
        return {
            success: true,
            message: 'PID file deleted successfully'
        };
    }

    // Mock SSE for live data
    startMockLiveData(parameters, callback) {
        console.log('Starting mock live data stream...');
        
        const interval = setInterval(() => {
            const data = this.mockGetLiveData();
            callback('data', data);
        }, 1000); // Update every second

        this.eventSource = {
            close: () => {
                clearInterval(interval);
                console.log('Mock live data stream stopped');
            }
        };

        // Simulate connection
        setTimeout(() => {
            callback('connected', null);
        }, 100);

        return this.eventSource;
    }
}