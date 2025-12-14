export function initDtcPage(app) {
    const elements = {
        readDtcBtn: document.getElementById('readDtcBtn'),
        clearDtcBtn: document.getElementById('clearDtcBtn'),
        clearStatusBtn: document.getElementById('clearStatusBtn'),
        storedDtcTable: document.getElementById('storedDtcTable').querySelector('tbody'),
        pendingDtcTable: document.getElementById('pendingDtcTable').querySelector('tbody'),
        permanentDtcTable: document.getElementById('permanentDtcTable').querySelector('tbody'),
        freezeFrameModal: document.getElementById('freezeFrameModal'),
        modalClose: document.getElementById('modalClose'),
        freezeFrameData: document.getElementById('freezeFrameData')
    };

    let currentDTCs = null;

    function setupEventListeners() {
        elements.readDtcBtn.addEventListener('click', readDTCs);
        elements.clearDtcBtn.addEventListener('click', clearDTCs);
        elements.clearStatusBtn.addEventListener('click', clearStatus);
        
        // Modal event listeners
        elements.modalClose.addEventListener('click', closeModal);
        elements.freezeFrameModal.addEventListener('click', (e) => {
            if (e.target === elements.freezeFrameModal) {
                closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.freezeFrameModal.classList.contains('show')) {
                closeModal();
            }
        });
    }

    async function readDTCs() {
        try {
            setLoadingState(true);
            
            const result = await app.readDTCs();
            
            if (result) {
                currentDTCs = result;
                updateDTCTables(result);
                app.showAlert('DTCs read successfully', 'success');
            } else {
                throw new Error('No DTC data received');
            }
        } catch (error) {
            console.error('DTC read error:', error);
            app.showAlert(`Failed to read DTCs: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    async function clearDTCs() {
        const confirmed = confirm('Are you sure you want to clear all DTCs? This action cannot be undone.');
        if (!confirmed) return;

        try {
            setLoadingState(true);
            
            const result = await app.clearDTCs();
            
            if (result && result.success !== false) {
                // Clear the table displays
                currentDTCs = { stored: [], pending: [], permanent: [] };
                updateDTCTables(currentDTCs);
                app.showAlert('DTCs cleared successfully', 'success');
            } else {
                throw new Error(result?.message || 'Failed to clear DTCs');
            }
        } catch (error) {
            console.error('DTC clear error:', error);
            app.showAlert(`Failed to clear DTCs: ${error.message}`, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    function clearStatus() {
        // Clear status indicators and temporary issues
        currentDTCs = { stored: [], pending: [], permanent: [] };
        updateDTCTables(currentDTCs);
        app.showAlert('Status cleared', 'info');
    }

    function updateDTCTables(dtcData) {
        updateSingleDtcTable(elements.storedDtcTable, dtcData.stored, 'Stored');
        updateSingleDtcTable(elements.pendingDtcTable, dtcData.pending, 'Pending');
        updateSingleDtcTable(elements.permanentDtcTable, dtcData.permanent, 'Permanent');
    }

    function updateSingleDtcTable(tableBody, dtcs, category) {
        tableBody.innerHTML = '';

        if (!dtcs || dtcs.length === 0) {
            const row = document.createElement('tr');
            row.className = 'no-data';
            row.innerHTML = `<td colspan="4">No ${category.toLowerCase()} codes</td>`;
            tableBody.appendChild(row);
            return;
        }

        dtcs.forEach(dtc => {
            const row = document.createElement('tr');
            
            // Determine status styling
            let statusClass = 'status-active';
            let statusText = dtc.status || 'Active';
            
            if (dtc.status && dtc.status.toLowerCase().includes('pending')) {
                statusClass = 'status-pending';
                statusText = 'Pending';
            } else if (dtc.status && dtc.status.toLowerCase().includes('permanent')) {
                statusClass = 'status-permanent';
                statusText = 'Permanent';
            }

            row.innerHTML = `
                <td><strong>${dtc.code}</strong></td>
                <td>${dtc.description || 'Unknown code'}</td>
                <td><span class="dtc-status ${statusClass}">${statusText}</span></td>
                <td>
                    ${dtc.freezeFrame ? 
                        `<button class="btn btn-sm btn-primary view-freeze-frame" data-code="${dtc.code}">View</button>` : 
                        '<span class="text-muted">No data</span>'
                    }
                </td>
            `;

            // Add event listener for freeze frame button
            const freezeFrameBtn = row.querySelector('.view-freeze-frame');
            if (freezeFrameBtn) {
                freezeFrameBtn.addEventListener('click', () => showFreezeFrame(dtc));
            }

            tableBody.appendChild(row);
        });
    }

    function showFreezeFrame(dtc) {
        const freezeFrame = dtc.freezeFrame || generateMockFreezeFrame(dtc.code);
        
        let content = `<h4>Freeze Frame for ${dtc.code}</h4>`;
        content += `<p class="text-muted">${dtc.description}</p>`;
        content += '<div class="freeze-frame-data">';
        
        if (freezeFrame) {
            // Add common freeze frame parameters
            const parameters = [
                { name: 'Engine RPM', value: freezeFrame.rpm ? `${freezeFrame.rpm} RPM` : 'N/A' },
                { name: 'Vehicle Speed', value: freezeFrame.speed ? `${freezeFrame.speed} km/h` : 'N/A' },
                { name: 'Engine Load', value: freezeFrame.load ? `${freezeFrame.load}%` : 'N/A' },
                { name: 'Coolant Temperature', value: freezeFrame.coolantTemp ? `${freezeFrame.coolantTemp}°C` : 'N/A' },
                { name: 'Fuel Pressure', value: freezeFrame.fuelPressure ? `${freezeFrame.fuelPressure} kPa` : 'N/A' },
                { name: 'MAF Rate', value: freezeFrame.mafRate ? `${freezeFrame.mafRate} g/s` : 'N/A' },
                { name: 'Throttle Position', value: freezeFrame.throttlePos ? `${freezeFrame.throttlePos}%` : 'N/A' },
                { name: 'Battery Voltage', value: freezeFrame.batteryVoltage ? `${freezeFrame.batteryVoltage}V` : 'N/A' }
            ];

            parameters.forEach(param => {
                if (param.value !== 'N/A') {
                    content += `
                        <div class="freeze-frame-item">
                            <span class="param-name">${param.name}:</span>
                            <span class="param-value">${param.value}</span>
                        </div>
                    `;
                }
            });
        } else {
            content += '<p>No freeze frame data available</p>';
        }
        
        content += '</div>';
        
        elements.freezeFrameData.innerHTML = content;
        elements.freezeFrameModal.classList.add('show');
    }

    function closeModal() {
        elements.freezeFrameModal.classList.remove('show');
    }

    function generateMockFreezeFrame(code) {
        // Generate realistic mock freeze frame data
        return {
            rpm: Math.floor(Math.random() * 2000) + 800,
            speed: Math.floor(Math.random() * 80),
            load: Math.floor(Math.random() * 50) + 20,
            coolantTemp: Math.floor(Math.random() * 60) + 60,
            fuelPressure: Math.floor(Math.random() * 200) + 300,
            mafRate: (Math.random() * 20 + 5).toFixed(1),
            throttlePos: Math.floor(Math.random() * 30),
            batteryVoltage: (Math.random() * 2 + 12).toFixed(1)
        };
    }

    function setLoadingState(loading) {
        elements.readDtcBtn.disabled = loading;
        elements.clearDtcBtn.disabled = loading;
        elements.clearStatusBtn.disabled = loading;
        
        if (loading) {
            elements.readDtcBtn.innerHTML = '<span class="spinner"></span>Reading...';
        } else {
            elements.readDtcBtn.textContent = 'Read DTCs';
        }
    }

    // Mock DTC reading for development
    function simulateDtcReading() {
        const mockDTCs = app.generateMockDTCs();
        currentDTCs = mockDTCs;
        updateDTCTables(mockDTCs);
        addLogEntry('Mock DTC data loaded', 'info');
    }

    // Initialize page
    setupEventListeners();
    
    // Check if we have cached DTCs
    const cachedDTCs = app.getCachedData('dtcs');
    if (cachedDTCs) {
        currentDTCs = cachedDTCs;
        updateDTCTables(cachedDTCs);
    } else {
        // Load mock data for development
        simulateDtcReading();
    }

    // Add some CSS for DTC status styling
    addDtcStatusStyles();
}

function addDtcStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .dtc-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .dtc-status.status-active {
            background: #fee;
            color: #c53030;
        }
        
        .dtc-status.status-pending {
            background: #fef5e7;
            color: #d69e2e;
        }
        
        .dtc-status.status-permanent {
            background: #fed7d7;
            color: #9b2c2c;
        }
        
        .text-muted {
            color: #718096;
            font-style: italic;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
        }
        
        .freeze-frame-data {
            margin-top: 20px;
        }
        
        .freeze-frame-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .param-name {
            font-weight: 600;
            color: #4a5568;
        }
        
        .param-value {
            color: #2d3748;
        }
    `;
    document.head.appendChild(style);
}