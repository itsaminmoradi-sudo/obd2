// OBD2 Diagnostic Tool - Frontend JavaScript

class OBD2App {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.isConnected = false;
        this.loadedPIDs = [];
        this.selectedPID = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkHealth();
        this.loadPorts();
        this.loadConfig();
        
        // Set up periodic health checks
        setInterval(() => this.checkHealth(), 30000);
        
        // Set up SSE for real-time updates
        this.setupSSE();
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(e.target.getAttribute('href').substring(1));
            });
        });
        
        // Connection controls
        document.getElementById('connect-btn').addEventListener('click', () => this.connect());
        document.getElementById('disconnect-btn').addEventListener('click', () => this.disconnect());
        document.getElementById('load-pids-btn').addEventListener('click', () => this.loadPIDData());
        
        // Settings
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        
        // Default active section
        this.showSection('dashboard');
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(sectionId).style.display = 'block';
        
        // Update navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`nav a[href="#${sectionId}"]`).classList.add('active');
    }
    
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            const healthStatus = document.getElementById('health-status');
            const lastUpdate = document.getElementById('last-update');
            
            if (data.status === 'healthy') {
                healthStatus.textContent = 'Healthy';
                healthStatus.style.color = '#3c3';
                lastUpdate.textContent = new Date(data.timestamp * 1000).toLocaleString();
            } else {
                healthStatus.textContent = 'Unhealthy';
                healthStatus.style.color = '#c33';
            }
        } catch (error) {
            document.getElementById('health-status').textContent = 'Connection Failed';
            document.getElementById('health-status').style.color = '#c33';
        }
    }
    
    async loadPorts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/serial/ports`);
            const data = await response.json();
            
            const portSelect = document.getElementById('port-select');
            portSelect.innerHTML = '<option value="">Select a port...</option>';
            
            data.ports.forEach(port => {
                const option = document.createElement('option');
                option.value = port.port;
                option.textContent = `${port.port} (${port.type})`;
                portSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load ports:', error);
        }
    }
    
    async loadConfig() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/config`);
            const config = await response.json();
            
            // Update UI with config values
            document.getElementById('server-port').value = config.server.port;
            document.getElementById('serial-timeout').value = config.serial.timeout;
            document.getElementById('bluetooth-enabled').checked = config.bluetooth.enabled;
            document.getElementById('rfcomm-channel').value = config.bluetooth.rfcomm_channel;
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }
    
    async connect() {
        const port = document.getElementById('port-select').value;
        const baudrate = parseInt(document.getElementById('baudrate-select').value);
        
        if (!port) {
            alert('Please select a port');
            return;
        }
        
        try {
            this.setConnectionLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/api/serial/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port, baudrate })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus();
                this.showMessage(data.message, 'success');
            } else {
                this.showMessage(data.error || 'Connection failed', 'error');
            }
        } catch (error) {
            this.showMessage('Connection failed: ' + error.message, 'error');
        } finally {
            this.setConnectionLoading(false);
        }
    }
    
    async disconnect() {
        try {
            this.setConnectionLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/api/serial/disconnect`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.isConnected = false;
                this.updateConnectionStatus();
                this.showMessage(data.message, 'success');
            } else {
                this.showMessage(data.error || 'Disconnection failed', 'error');
            }
        } catch (error) {
            this.showMessage('Disconnection failed: ' + error.message, 'error');
        } finally {
            this.setConnectionLoading(false);
        }
    }
    
    updateConnectionStatus() {
        const statusText = document.getElementById('status-text');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        
        if (this.isConnected) {
            statusText.textContent = 'Connected';
            statusText.className = 'connected status-change';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
        } else {
            statusText.textContent = 'Disconnected';
            statusText.className = 'disconnected status-change';
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
        }
    }
    
    setConnectionLoading(loading) {
        const buttons = ['connect-btn', 'disconnect-btn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (loading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    }
    
    async loadPIDData() {
        const manufacturer = document.getElementById('manufacturer-select').value;
        
        if (!manufacturer) {
            alert('Please select a manufacturer');
            return;
        }
        
        try {
            this.setPIDLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/api/pids/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ manufacturer })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.loadedPIDs = await this.fetchLoadedPIDs();
                this.displayPIDs();
                this.showMessage(data.message, 'success');
            } else {
                this.showMessage(data.error || 'Failed to load PIDs', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to load PIDs: ' + error.message, 'error');
        } finally {
            this.setPIDLoading(false);
        }
    }
    
    async fetchLoadedPIDs() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/pids`);
            const data = await response.json();
            return data.pids || [];
        } catch (error) {
            console.error('Failed to fetch loaded PIDs:', error);
            return [];
        }
    }
    
    displayPIDs() {
        const container = document.getElementById('pid-list-container');
        
        if (this.loadedPIDs.length === 0) {
            container.innerHTML = '<p>No PIDs loaded.</p>';
            return;
        }
        
        const pidList = document.createElement('div');
        this.loadedPIDs.forEach(pid => {
            const pidItem = document.createElement('div');
            pidItem.className = 'pid-item';
            pidItem.innerHTML = `
                <h4>${pid.name}</h4>
                <p><strong>Command:</strong> ${pid.command}</p>
                <p><strong>Type:</strong> ${pid.type}</p>
                <p><strong>Unit:</strong> ${pid.unit}</p>
            `;
            
            pidItem.addEventListener('click', () => this.selectPID(pid));
            pidList.appendChild(pidItem);
        });
        
        container.innerHTML = '';
        container.appendChild(pidList);
    }
    
    selectPID(pid) {
        this.selectedPID = pid;
        
        // Update PID list selection
        document.querySelectorAll('.pid-item').forEach(item => {
            item.classList.remove('selected');
        });
        event.target.closest('.pid-item').classList.add('selected');
        
        // Display PID details
        this.displayPIDDetails(pid);
    }
    
    displayPIDDetails(pid) {
        const container = document.getElementById('pid-details-container');
        container.innerHTML = `
            <h4>${pid.name}</h4>
            <p><strong>ID:</strong> ${pid.id}</p>
            <p><strong>Command:</strong> ${pid.command}</p>
            <p><strong>Type:</strong> ${pid.type}</p>
            <p><strong>Formula:</strong> ${pid.formula}</p>
            <p><strong>Unit:</strong> ${pid.unit}</p>
            <p><strong>Description:</strong> ${pid.description || 'N/A'}</p>
            <p><strong>Range:</strong> ${pid.min_value} - ${pid.max_value} ${pid.unit}</p>
        `;
    }
    
    setPIDLoading(loading) {
        const btn = document.getElementById('load-pids-btn');
        if (loading) {
            btn.classList.add('loading');
            btn.textContent = 'Loading...';
        } else {
            btn.classList.remove('loading');
            btn.textContent = 'Load PID Data';
        }
    }
    
    async saveSettings() {
        const config = {
            server: {
                port: parseInt(document.getElementById('server-port').value)
            },
            serial: {
                timeout: parseFloat(document.getElementById('serial-timeout').value)
            },
            bluetooth: {
                enabled: document.getElementById('bluetooth-enabled').checked,
                rfcomm_channel: parseInt(document.getElementById('rfcomm-channel').value)
            }
        };
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage(data.message, 'success');
            } else {
                this.showMessage(data.error || 'Failed to save settings', 'error');
            }
        } catch (error) {
            this.showMessage('Failed to save settings: ' + error.message, 'error');
        }
    }
    
    setupSSE() {
        // Set up Server-Sent Events for real-time updates
        try {
            const eventSource = new EventSource(`${this.apiBaseUrl}/events/health`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'heartbeat') {
                    console.log('Heartbeat received:', data);
                }
            };
            
            eventSource.addEventListener('connection-status', (event) => {
                const data = JSON.parse(event.data);
                console.log('Connection status update:', data);
            });
            
            eventSource.addEventListener('error', (event) => {
                console.error('SSE error:', event);
            });
            
        } catch (error) {
            console.error('Failed to set up SSE:', error);
        }
    }
    
    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Insert at top of main content
        const main = document.querySelector('main');
        main.insertBefore(messageDiv, main.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.obd2App = new OBD2App();
});
