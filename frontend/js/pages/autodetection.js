export function initAutodetectionPage(app) {
    const elements = {
        startDetectionBtn: document.getElementById('startDetectionBtn'),
        clearLogsBtn: document.getElementById('clearLogsBtn'),
        protocolLogs: document.getElementById('protocolLogs'),
        vehicleVin: document.getElementById('vehicleVin'),
        vehicleManufacturer: document.getElementById('vehicleManufacturer'),
        ecuCount: document.getElementById('ecuCount'),
        detectedProtocol: document.getElementById('detectedProtocol'),
        ecuList: document.getElementById('ecuList')
    };

    let isDetecting = false;
    let detectionInterval = null;
    let logCounter = 0;

    function setupEventListeners() {
        elements.startDetectionBtn.addEventListener('click', startDetection);
        elements.clearLogsBtn.addEventListener('click', clearLogs);
    }

    async function startDetection() {
        if (isDetecting) return;

        try {
            isDetecting = true;
            updateDetectionState(true);
            clearLogs();
            
            // Add initial log entry
            addLogEntry('Starting protocol negotiation...', 'info');
            
            // Start the detection process
            const result = await app.startDetection();
            
            if (result) {
                updateDetectionResults(result);
                addLogEntry('Detection completed successfully', 'success');
            } else {
                throw new Error('Detection failed');
            }
        } catch (error) {
            console.error('Detection error:', error);
            addLogEntry(`Detection failed: ${error.message}`, 'error');
            app.showAlert(`Detection failed: ${error.message}`, 'error');
        } finally {
            isDetecting = false;
            updateDetectionState(false);
        }
    }

    function updateDetectionState(detecting) {
        elements.startDetectionBtn.disabled = detecting;
        
        if (detecting) {
            elements.startDetectionBtn.innerHTML = '<span class="spinner"></span>Detecting...';
        } else {
            elements.startDetectionBtn.textContent = 'Start Detection';
        }
    }

    function clearLogs() {
        elements.protocolLogs.innerHTML = '';
        logCounter = 0;
        addLogEntry('Protocol logs cleared', 'info');
    }

    function addLogEntry(message, type = 'info') {
        const timestamp = app.formatTimestamp();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;

        elements.protocolLogs.appendChild(logEntry);
        elements.protocolLogs.scrollTop = elements.protocolLogs.scrollHeight;
        
        logCounter++;
        
        // Simulate live protocol negotiation logs
        simulateProtocolNegotiation(logCounter, type);
    }

    function simulateProtocolNegotiation(step, type) {
        if (type !== 'info') return;

        // Only simulate for the first few entries
        if (logCounter > 20) return;

        const protocols = [
            'ISO14230-4_FAST_INIT',
            'ISO9141-2', 
            'CAN_11BIT_500K',
            'CAN_29BIT_500K'
        ];

        const stepDelay = Math.random() * 1000 + 500; // Random delay between 500-1500ms
        
        setTimeout(() => {
            if (!isDetecting && step > 10) return; // Don't add logs after detection completes

            let logMessage = '';
            let logType = 'info';

            switch (step) {
                case 2:
                    logMessage = 'Searching for ECUs...';
                    break;
                case 3:
                    logMessage = 'Trying ISO9141-2 protocol...';
                    logType = 'warning';
                    break;
                case 4:
                    logMessage = 'ISO9141-2: No response';
                    logType = 'error';
                    break;
                case 5:
                    logMessage = 'Trying CAN 11-bit 500K protocol...';
                    logType = 'info';
                    break;
                case 6:
                    logMessage = 'CAN 11-bit 500K: Response received from ECU 01';
                    logType = 'success';
                    break;
                case 7:
                    logMessage = 'CAN 11-bit 500K: Response received from ECU 02';
                    logType = 'success';
                    break;
                case 8:
                    logMessage = 'CAN 11-bit 500K: Response received from ECU 03';
                    logType = 'success';
                    break;
                case 9:
                    logMessage = 'CAN 11-bit 500K: Response received from ECU 04';
                    logType = 'success';
                    break;
                case 10:
                    logMessage = 'Protocol negotiation successful';
                    logType = 'success';
                    break;
                default:
                    if (step < 15) {
                        const ecuId = Math.floor(Math.random() * 4) + 1;
                        logMessage = `Querying ECU ${ecuId.toString().padStart(2, '0')} for identification...`;
                        logType = 'info';
                    }
            }

            if (logMessage) {
                addLogEntry(logMessage, logType);
            }
        }, stepDelay);
    }

    function updateDetectionResults(results) {
        // Update vehicle information
        if (results.vin) {
            elements.vehicleVin.textContent = results.vin;
            elements.vehicleVin.style.color = '#27ae60';
        }

        if (results.manufacturer) {
            elements.vehicleManufacturer.textContent = results.manufacturer;
            elements.vehicleManufacturer.style.color = '#27ae60';
        }

        if (results.protocol) {
            elements.detectedProtocol.textContent = results.protocol;
            elements.detectedProtocol.style.color = '#27ae60';
        }

        if (results.ecus && Array.isArray(results.ecus)) {
            elements.ecuCount.textContent = results.ecus.length;
            updateECUList(results.ecus);
        }

        // Cache the results
        app.setCachedData('detectionResults', results);
    }

    function updateECUList(ecus) {
        elements.ecuList.innerHTML = '';

        if (!ecus || ecus.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'ecu-item placeholder';
            placeholder.innerHTML = '<p>No ECUs detected</p>';
            elements.ecuList.appendChild(placeholder);
            return;
        }

        ecus.forEach(ecu => {
            const ecuItem = document.createElement('div');
            ecuItem.className = 'ecu-item';
            
            ecuItem.innerHTML = `
                <div class="ecu-header">
                    <h4>ECU ${ecu.id}: ${ecu.name}</h4>
                    <span class="ecu-status ${ecu.status.toLowerCase()}">${ecu.status}</span>
                </div>
                <div class="ecu-details">
                    <p><strong>ID:</strong> ${ecu.id}</p>
                    <p><strong>Status:</strong> ${ecu.status}</p>
                    ${ecu.protocol ? `<p><strong>Protocol:</strong> ${ecu.protocol}</p>` : ''}
                    ${ecu.softwareVersion ? `<p><strong>Software:</strong> ${ecu.softwareVersion}</p>` : ''}
                </div>
            `;

            elements.ecuList.appendChild(ecuItem);
        });
    }

    // Auto-detection simulation for development
    function simulateAutoDetection() {
        if (!isDetecting) return;

        const mockResults = app.generateMockDetectionData();
        
        // Simulate detection taking a few seconds
        setTimeout(() => {
            updateDetectionResults(mockResults);
            addLogEntry('Mock detection completed', 'success');
        }, 3000);
    }

    // Initialize page
    setupEventListeners();
    
    // Check if we have cached results
    const cachedResults = app.getCachedData('detectionResults');
    if (cachedResults) {
        updateDetectionResults(cachedResults);
        addLogEntry('Loaded cached detection results', 'info');
    } else {
        addLogEntry('Ready for detection', 'info');
    }
}