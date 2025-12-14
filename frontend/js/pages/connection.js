export function initConnectionPage(app) {
    const elements = {
        deviceSelect: document.getElementById('deviceSelect'),
        connectionTypeRadios: document.querySelectorAll('input[name="connectionType"]'),
        port: document.getElementById('port'),
        baud: document.getElementById('baud'),
        protocolOverride: document.getElementById('protocolOverride'),
        connectBtn: document.getElementById('connectBtn'),
        disconnectBtn: document.getElementById('disconnectBtn'),
        connectionStatus: document.getElementById('connectionStatus'),
        currentProtocol: document.getElementById('currentProtocol'),
        currentDevice: document.getElementById('currentDevice')
    };

    let isConnected = false;

    // Event Listeners
    function setupEventListeners() {
        elements.connectBtn.addEventListener('click', handleConnect);
        elements.disconnectBtn.addEventListener('click', handleDisconnect);
        
        // Connection type change handler
        elements.connectionTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleConnectionTypeChange);
        });

        // Auto-detect port based on connection type
        handleConnectionTypeChange();

        // Load saved configuration
        loadSavedConfiguration();
    }

    function handleConnectionTypeChange() {
        const selectedType = getConnectionType();
        let defaultPort = '3001';

        switch (selectedType) {
            case 'bluetooth':
                defaultPort = '3002';
                break;
            case 'wifi':
                defaultPort = '3003';
                break;
        }

        elements.port.value = defaultPort;
    }

    async function handleConnect() {
        try {
            setLoadingState(true);
            
            const config = getConnectionConfig();
            const result = await app.connectDevice(config);
            
            if (result && result.success !== false) {
                isConnected = true;
                updateConnectionStatus('Connected', 'success', result);
                updateUIState();
                saveConfiguration(config);
                app.showAlert('Device connected successfully!', 'success');
            } else {
                throw new Error(result?.message || 'Connection failed');
            }
        } catch (error) {
            console.error('Connection error:', error);
            isConnected = false;
            updateConnectionStatus('Connection Failed', 'error', null);
            app.showAlert(`Connection failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    async function handleDisconnect() {
        try {
            setLoadingState(true);
            
            await app.disconnectDevice();
            
            isConnected = false;
            updateConnectionStatus('Disconnected', 'error', null);
            updateUIState();
            app.showAlert('Device disconnected', 'info');
        } catch (error) {
            console.error('Disconnection error:', error);
            app.showAlert(`Disconnection failed: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    function getConnectionType() {
        const selectedRadio = document.querySelector('input[name="connectionType"]:checked');
        return selectedRadio ? selectedRadio.value : 'usb';
    }

    function getConnectionConfig() {
        return {
            deviceSelect: elements.deviceSelect.value,
            connectionType: getConnectionType(),
            port: elements.port.value,
            baud: parseInt(elements.baud.value),
            protocolOverride: elements.protocolOverride.value || null
        };
    }

    function updateConnectionStatus(status, type, connectionInfo) {
        elements.connectionStatus.textContent = status;
        
        // Update protocol and device info
        if (connectionInfo) {
            elements.currentProtocol.textContent = connectionInfo.protocol || '-';
            elements.currentDevice.textContent = connectionInfo.device || elements.deviceSelect.value || '-';
        } else {
            elements.currentProtocol.textContent = '-';
            elements.currentDevice.textContent = '-';
        }

        // Update status styling
        const statusElement = elements.connectionStatus;
        statusElement.className = 'status-value';
        
        switch (type) {
            case 'success':
                statusElement.classList.add('text-success');
                break;
            case 'error':
                statusElement.classList.add('text-error');
                break;
            case 'info':
                statusElement.classList.add('text-info');
                break;
        }
    }

    function updateUIState() {
        elements.connectBtn.disabled = isConnected;
        elements.disconnectBtn.disabled = !isConnected;
        
        // Disable form controls when connected
        const formControls = [
            elements.deviceSelect,
            ...elements.connectionTypeRadios,
            elements.port,
            elements.baud,
            elements.protocolOverride
        ];

        formControls.forEach(control => {
            if (control instanceof NodeList) {
                control.forEach(item => item.disabled = isConnected);
            } else {
                control.disabled = isConnected;
            }
        });
    }

    function setLoadingState(loading) {
        elements.connectBtn.disabled = loading || isConnected;
        elements.disconnectBtn.disabled = loading || !isConnected;
        
        if (loading) {
            elements.connectBtn.innerHTML = '<span class="spinner"></span>Connecting...';
        } else {
            elements.connectBtn.textContent = 'Connect';
        }
    }

    function saveConfiguration(config) {
        try {
            localStorage.setItem('obd2_config', JSON.stringify(config));
        } catch (error) {
            console.warn('Could not save configuration:', error);
        }
    }

    function loadSavedConfiguration() {
        try {
            const saved = localStorage.getItem('obd2_config');
            if (saved) {
                const config = JSON.parse(saved);
                
                if (config.deviceSelect) {
                    elements.deviceSelect.value = config.deviceSelect;
                }
                
                if (config.connectionType) {
                    const radio = document.querySelector(`input[name="connectionType"][value="${config.connectionType}"]`);
                    if (radio) {
                        radio.checked = true;
                        handleConnectionTypeChange();
                    }
                }
                
                if (config.port) {
                    elements.port.value = config.port;
                }
                
                if (config.baud) {
                    elements.baud.value = config.baud.toString();
                }
                
                if (config.protocolOverride) {
                    elements.protocolOverride.value = config.protocolOverride;
                }
            }
        } catch (error) {
            console.warn('Could not load saved configuration:', error);
        }
    }

    // Mock connection status check
    function checkConnectionStatus() {
        setInterval(async () => {
            if (isConnected) {
                try {
                    // In a real app, this would check actual connection status
                    // For now, we'll simulate occasional status updates
                    if (Math.random() < 0.1) { // 10% chance every check
                        elements.connectionStatus.textContent = 'Connection Lost';
                        isConnected = false;
                        updateUIState();
                        app.updateStatus('Connection lost', 'error');
                        app.showAlert('Connection lost!', 'warning');
                    }
                } catch (error) {
                    console.warn('Connection status check failed:', error);
                }
            }
        }, 5000); // Check every 5 seconds
    }

    // Initialize page
    setupEventListeners();
    checkConnectionStatus();
    
    // Set initial UI state
    updateUIState();
    updateConnectionStatus('Ready to connect', 'info', null);
}