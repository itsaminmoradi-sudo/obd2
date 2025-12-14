import { ApiClient } from './api-client.js';
import { initConnectionPage } from './pages/connection.js';
import { initAutodetectionPage } from './pages/autodetection.js';
import { initDtcPage } from './pages/dtc.js';
import { initLiveDataPage } from './pages/livedata.js';
import { initEcInfoPage } from './pages/ecinfo.js';
import { initPidManagerPage } from './pages/pidmanager.js';

class Obd2App {
    constructor() {
        this.api = new ApiClient();
        this.currentRoute = '';
        this.cache = {
            detectionResults: null,
            ecuInfo: null,
            dtcs: null,
            liveData: null
        };
        this.init();
    }

    init() {
        this.setupRouting();
        this.setupGlobalEventListeners();
        this.initPageHandlers();
        this.loadInitialRoute();
        this.updateStatus('Application ready', 'ready');
    }

    setupRouting() {
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
    }

    setupGlobalEventListeners() {
        // Mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('show');
            });
        }

        // Close mobile menu when clicking on a link
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]') && navMenu) {
                navMenu.classList.remove('show');
            }
        });

        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showAlert('An unexpected error occurred', 'error');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showAlert('A network error occurred', 'error');
        });
    }

    initPageHandlers() {
        // Initialize all page handlers
        initConnectionPage(this);
        initAutodetectionPage(this);
        initDtcPage(this);
        initLiveDataPage(this);
        initEcInfoPage(this);
        initPidManagerPage(this);
    }

    loadInitialRoute() {
        const hash = window.location.hash || '#/connection';
        this.handleRoute(hash);
    }

    handleRoute(forceHash = null) {
        const hash = forceHash || window.location.hash;
        const route = hash.replace('#/', '') || 'connection';
        
        if (this.currentRoute === route) return;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show current page
        const currentPage = document.getElementById(`page-${route}`);
        if (currentPage) {
            currentPage.classList.add('active');
            this.currentRoute = route;
            
            // Update navigation
            document.querySelectorAll('[data-route]').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[data-route="${route}"]`)?.classList.add('active');
            
            // Page-specific initialization
            this.onPageChange(route);
        } else {
            console.warn(`Route not found: ${route}`);
            this.handleRoute('#/connection');
        }
    }

    onPageChange(route) {
        // Handle page-specific logic when route changes
        switch (route) {
            case 'connection':
                this.updateStatus('Configure connection settings', 'ready');
                break;
            case 'autodetection':
                this.updateStatus('Ready for auto detection', 'ready');
                break;
            case 'dtc':
                this.updateStatus('DTC workspace ready', 'ready');
                break;
            case 'livedata':
                this.updateStatus('Live data monitoring ready', 'ready');
                break;
            case 'ecinfo':
                this.updateStatus('ECU information ready', 'ready');
                break;
            case 'pidmanager':
                this.updateStatus('PID file manager ready', 'ready');
                break;
        }
    }

    // API wrapper methods
    async connectDevice(config) {
        try {
            this.updateStatus('Connecting to device...', 'loading');
            const result = await this.api.connect(config);
            this.updateStatus('Device connected successfully', 'success');
            return result;
        } catch (error) {
            this.updateStatus('Connection failed', 'error');
            this.showAlert(`Connection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async disconnectDevice() {
        try {
            this.updateStatus('Disconnecting...', 'loading');
            await this.api.disconnect();
            this.updateStatus('Device disconnected', 'success');
        } catch (error) {
            this.updateStatus('Disconnection failed', 'error');
            this.showAlert(`Disconnection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async startDetection() {
        try {
            this.updateStatus('Starting detection...', 'loading');
            const result = await this.api.startDetection();
            
            // Cache detection results
            this.cache.detectionResults = result;
            return result;
        } catch (error) {
            this.updateStatus('Detection failed', 'error');
            this.showAlert(`Detection failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async readDTCs() {
        try {
            this.updateStatus('Reading DTCs...', 'loading');
            const result = await this.api.readDTCs();
            
            // Cache DTC results
            this.cache.dtcs = result;
            return result;
        } catch (error) {
            this.updateStatus('DTC read failed', 'error');
            this.showAlert(`Failed to read DTCs: ${error.message}`, 'error');
            throw error;
        }
    }

    async clearDTCs() {
        try {
            this.updateStatus('Clearing DTCs...', 'loading');
            const result = await this.api.clearDTCs();
            this.updateStatus('DTCs cleared successfully', 'success');
            
            // Clear cached DTCs
            this.cache.dtcs = null;
            return result;
        } catch (error) {
            this.updateStatus('DTC clear failed', 'error');
            this.showAlert(`Failed to clear DTCs: ${error.message}`, 'error');
            throw error;
        }
    }

    async getECUInfo() {
        try {
            this.updateStatus('Reading ECU information...', 'loading');
            const result = await this.api.getECUInfo();
            
            // Cache ECU info
            this.cache.ecuInfo = result;
            return result;
        } catch (error) {
            this.updateStatus('ECU info read failed', 'error');
            this.showAlert(`Failed to read ECU info: ${error.message}`, 'error');
            throw error;
        }
    }

    // Live Data Management
    startLiveData(parameters, callback) {
        return this.api.startLiveData(parameters, callback);
    }

    stopLiveData() {
        this.api.stopLiveData();
    }

    // PID File Management
    async uploadPIDFile(file) {
        try {
            this.updateStatus('Uploading PID file...', 'loading');
            const result = await this.api.uploadPIDFile(file);
            this.updateStatus('PID file uploaded successfully', 'success');
            return result;
        } catch (error) {
            this.updateStatus('PID file upload failed', 'error');
            this.showAlert(`Failed to upload PID file: ${error.message}`, 'error');
            throw error;
        }
    }

    async getLoadedPIDFiles() {
        try {
            const result = await this.api.getLoadedPIDFiles();
            return result;
        } catch (error) {
            this.showAlert(`Failed to get PID files: ${error.message}`, 'error');
            throw error;
        }
    }

    async deletePIDFile(filename) {
        try {
            this.updateStatus('Deleting PID file...', 'loading');
            const result = await this.api.deletePIDFile(filename);
            this.updateStatus('PID file deleted successfully', 'success');
            return result;
        } catch (error) {
            this.updateStatus('PID file delete failed', 'error');
            this.showAlert(`Failed to delete PID file: ${error.message}`, 'error');
            throw error;
        }
    }

    // UI Helper Methods
    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('appStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }

        // Update connection indicator
        const connectionIndicator = document.getElementById('connectionIndicator');
        if (connectionIndicator) {
            if (type === 'success' || type === 'loading') {
                connectionIndicator.textContent = 'Connected';
                connectionIndicator.className = 'status-indicator connected';
            } else if (type === 'error') {
                connectionIndicator.textContent = 'Error';
                connectionIndicator.className = 'status-indicator disconnected';
            }
        }

        // Update data indicator
        const dataIndicator = document.getElementById('dataIndicator');
        if (dataIndicator) {
            if (type === 'loading') {
                dataIndicator.textContent = 'Active';
                dataIndicator.className = 'status-indicator active';
            } else if (this.cache.detectionResults || this.cache.liveData) {
                dataIndicator.textContent = 'Data';
                dataIndicator.className = 'status-indicator active';
            } else {
                dataIndicator.textContent = 'No Data';
                dataIndicator.className = 'status-indicator inactive';
            }
        }
    }

    showAlert(message, type = 'info', duration = 5000) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Add to page
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            const pageContent = currentPage.querySelector('.page-content');
            if (pageContent) {
                pageContent.insertBefore(alert, pageContent.firstChild);
            }
        }

        // Auto-remove after duration
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, duration);

        // Allow manual dismissal
        alert.addEventListener('click', () => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        });
    }

    // Utility Methods
    formatTimestamp(date = new Date()) {
        return date.toISOString().split('T')[1].split('.')[0];
    }

    formatValue(value, unit = '', decimals = 2) {
        if (typeof value === 'number') {
            return `${value.toFixed(decimals)}${unit}`;
        }
        return value || 'N/A';
    }

    // Cache Management
    getCachedData(type) {
        return this.cache[type];
    }

    setCachedData(type, data) {
        this.cache[type] = data;
    }

    clearCache(type = null) {
        if (type) {
            this.cache[type] = null;
        } else {
            Object.keys(this.cache).forEach(key => {
                this.cache[key] = null;
            });
        }
    }

    // Mock Data Generation for Development
    generateMockDetectionData() {
        return {
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

    generateMockLiveData() {
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

    generateMockECUInfo() {
        return {
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

    generateMockDTCs() {
        return {
            stored: [
                { code: 'P0301', description: 'Cylinder 1 Misfire Detected', status: 'Active' },
                { code: 'P0171', description: 'System Too Lean (Bank 1)', status: 'Active' }
            ],
            pending: [
                { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', status: 'Pending' }
            ],
            permanent: []
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.obd2App = new Obd2App();
});