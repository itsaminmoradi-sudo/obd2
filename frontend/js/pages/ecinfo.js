export function initEcInfoPage(app) {
    const elements = {
        refreshEcuInfoBtn: document.getElementById('refreshEcuInfoBtn'),
        ecuVin: document.getElementById('ecuVin'),
        ecuVehicleId: document.getElementById('ecuVehicleId'),
        ecuHardwareVersion: document.getElementById('ecuHardwareVersion'),
        ecuSoftwareVersion: document.getElementById('ecuSoftwareVersion'),
        ecuCalibrationId: document.getElementById('ecuCalibrationId'),
        ecuCvn: document.getElementById('ecuCvn'),
        ecuEngineType: document.getElementById('ecuEngineType'),
        ecuFuelType: document.getElementById('ecuFuelType'),
        ecuDisplacement: document.getElementById('ecuDisplacement'),
        ecuSupportedModes: document.getElementById('ecuSupportedModes'),
        ecuSupportedPids: document.getElementById('ecuSupportedPids')
    };

    function setupEventListeners() {
        elements.refreshEcuInfoBtn.addEventListener('click', refreshECUInfo);
    }

    async function refreshECUInfo() {
        try {
            setLoadingState(true);
            
            const result = await app.getECUInfo();
            
            if (result) {
                updateECUInfoDisplay(result);
                app.showAlert('ECU information updated', 'success');
            } else {
                throw new Error('No ECU information received');
            }
        } catch (error) {
            console.error('ECU info error:', error);
            app.showAlert(`Failed to get ECU info: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    function updateECUInfoDisplay(info) {
        // Update all information fields
        updateInfoField(elements.ecuVin, info.vin, 'Not available');
        updateInfoField(elements.ecuVehicleId, info.vehicleId, 'Not available');
        updateInfoField(elements.ecuHardwareVersion, info.hardwareVersion, 'Not available');
        updateInfoField(elements.ecuSoftwareVersion, info.softwareVersion, 'Not available');
        updateInfoField(elements.ecuCalibrationId, info.calibrationId, 'Not available');
        updateInfoField(elements.ecuCvn, info.cvn, 'Not available');
        updateInfoField(elements.ecuEngineType, info.engineType, 'Not available');
        updateInfoField(elements.ecuFuelType, info.fuelType, 'Not available');
        updateInfoField(elements.ecuDisplacement, info.displacement, 'Not available');
        
        // Handle supported modes and PIDs
        if (info.supportedModes && Array.isArray(info.supportedModes)) {
            elements.ecuSupportedModes.textContent = info.supportedModes.join(', ');
            elements.ecuSupportedModes.style.color = '#27ae60';
        } else {
            elements.ecuSupportedModes.textContent = 'Not available';
            elements.ecuSupportedModes.style.color = '#7f8c8d';
        }
        
        if (info.supportedPids) {
            elements.ecuSupportedPids.textContent = info.supportedPids.toString();
            elements.ecuSupportedPids.style.color = '#27ae60';
        } else {
            elements.ecuSupportedPids.textContent = 'Not available';
            elements.ecuSupportedPids.style.color = '#7f8c8d';
        }

        // Cache the results
        app.setCachedData('ecuInfo', info);
    }

    function updateInfoField(element, value, defaultValue) {
        if (value && value.trim() !== '') {
            element.textContent = value;
            element.style.color = '#27ae60';
        } else {
            element.textContent = defaultValue;
            element.style.color = '#7f8c8d';
        }
    }

    function setLoadingState(loading) {
        elements.refreshEcuInfoBtn.disabled = loading;
        
        if (loading) {
            elements.refreshEcuInfoBtn.innerHTML = '<span class="spinner"></span>Refreshing...';
        } else {
            elements.refreshEcuInfoBtn.textContent = 'Refresh Information';
        }
    }

    // Utility functions for formatting ECU info
    function formatSupportedModes(modes) {
        if (!modes || !Array.isArray(modes)) {
            return 'Not available';
        }

        const modeDescriptions = {
            '01': 'Current Data',
            '02': 'Freeze Frame',
            '03': 'Stored DTCs',
            '04': 'Clear DTCs',
            '05': 'Test Results (O2 Sensor)',
            '06': 'On-Board Monitor Results',
            '07': 'Pending DTCs',
            '08': 'Control Components',
            '09': 'Vehicle Information',
            '0A': 'Permanent DTCs',
            '0B': 'Control Powertrain Components',
            '0C': 'Current Data (Enhanced)',
            '0D': 'Current Data (Enhanced)',
            '0E': 'Current Data (Enhanced)',
            '0F': 'Current Data (Enhanced)',
            '10': 'Control Components (Enhanced)'
        };

        return modes.map(mode => {
            const desc = modeDescriptions[mode] || `Mode ${mode}`;
            return `${mode} (${desc})`;
        }).join(', ');
    }

    function formatSupportedPids(count) {
        if (!count || count <= 0) {
            return 'Not available';
        }
        return `${count} PIDs supported`;
    }

    // Initialize page
    setupEventListeners();
    
    // Check if we have cached ECU info
    const cachedEcuInfo = app.getCachedData('ecuInfo');
    if (cachedEcuInfo) {
        updateECUInfoDisplay(cachedEcuInfo);
    } else {
        // Load mock data for development
        const mockInfo = app.generateMockECUInfo();
        updateECUInfoDisplay(mockInfo);
    }
}