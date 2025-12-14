export function initLiveDataPage(app) {
    const elements = {
        dataSelect: document.getElementById('dataSelect'),
        startLiveDataBtn: document.getElementById('startLiveDataBtn'),
        stopLiveDataBtn: document.getElementById('stopLiveDataBtn'),
        resetChartBtn: document.getElementById('resetChartBtn'),
        engineChart: document.getElementById('engineChart'),
        temperatureChart: document.getElementById('temperatureChart'),
        rpmGauge: document.getElementById('rpmGauge'),
        tempGauge: document.getElementById('tempGauge'),
        speedGauge: document.getElementById('speedGauge'),
        voltageGauge: document.getElementById('voltageGauge')
    };

    let isStreaming = false;
    let eventSource = null;
    let chartData = {
        time: [],
        rpm: [],
        speed: [],
        temp: [],
        fuelPressure: [],
        load: [],
        maf: [],
        voltage: []
    };

    // Chart configurations
    const charts = {};

    function setupEventListeners() {
        elements.startLiveDataBtn.addEventListener('click', startLiveData);
        elements.stopLiveDataBtn.addEventListener('click', stopLiveData);
        elements.resetChartBtn.addEventListener('click', resetCharts);

        // Select all parameters by default
        Array.from(elements.dataSelect.options).forEach(option => {
            option.selected = true;
        });
    }

    async function startLiveData() {
        if (isStreaming) return;

        try {
            const selectedParameters = getSelectedParameters();
            if (selectedParameters.length === 0) {
                app.showAlert('Please select at least one parameter to monitor', 'warning');
                return;
            }

            isStreaming = true;
            updateStreamingState(true);

            app.updateStatus('Starting live data stream...', 'loading');

            // Initialize charts if not already done
            if (Object.keys(charts).length === 0) {
                initializeCharts();
            }

            // Start the live data stream
            eventSource = app.api.startLiveData(selectedParameters, handleLiveData);

            app.showAlert('Live data monitoring started', 'success');
            app.updateStatus('Live data streaming', 'success');

        } catch (error) {
            console.error('Live data error:', error);
            app.showAlert(`Failed to start live data: ${error.message}`, 'error');
            app.updateStatus('Live data failed', 'error');
            stopLiveData();
        }
    }

    function stopLiveData() {
        if (!isStreaming) return;

        isStreaming = false;
        updateStreamingState(false);

        if (eventSource) {
            app.stopLiveData();
            eventSource = null;
        }

        app.updateStatus('Live data stopped', 'info');
        app.showAlert('Live data monitoring stopped', 'info');
    }

    function getSelectedParameters() {
        return Array.from(elements.dataSelect.selectedOptions).map(option => option.value);
    }

    function updateStreamingState(streaming) {
        elements.startLiveDataBtn.disabled = streaming;
        elements.stopLiveDataBtn.disabled = !streaming;
        
        if (streaming) {
            elements.startLiveDataBtn.innerHTML = '<span class="spinner"></span>Streaming...';
        } else {
            elements.startLiveDataBtn.textContent = 'Start Monitoring';
        }
    }

    function initializeCharts() {
        // Initialize Engine Chart (RPM & Speed)
        charts.engine = elements.engineChart.getContext('2d');
        charts.engine.strokeStyle = '#667eea';
        charts.engine.lineWidth = 2;
        charts.engine.font = '12px Arial';

        // Initialize Temperature Chart (Temperature & Fuel Pressure)
        charts.temperature = elements.temperatureChart.getContext('2d');
        charts.temperature.strokeStyle = '#e74c3c';
        charts.temperature.lineWidth = 2;
        charts.temperature.font = '12px Arial';

        // Initialize Gauges
        initializeGauges();

        // Start animation loop
        animate();
    }

    function initializeGauges() {
        drawGauge(elements.rpmGauge, 0, 8000, 0, 'RPM', '#667eea');
        drawGauge(elements.tempGauge, -40, 150, 80, '°C', '#e74c3c');
        drawGauge(elements.speedGauge, 0, 200, 0, 'km/h', '#27ae60');
        drawGauge(elements.voltageGauge, 8, 16, 12, 'V', '#f39c12');
    }

    function drawGauge(canvas, min, max, value, unit, color) {
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 0.25);
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw value arc
        if (value > min && value < max) {
            const angle = ((value - min) / (max - min)) * (Math.PI * 1.5) - Math.PI * 0.75;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.75, angle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Draw center text
        ctx.fillStyle = color;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(value).toString(), centerX, centerY + 8);
        ctx.font = '14px Arial';
        ctx.fillText(unit, centerX, centerY + 25);
    }

    function handleLiveData(event, data) {
        switch (event) {
            case 'connected':
                console.log('Live data stream connected');
                break;
            case 'data':
                if (data) {
                    updateCharts(data);
                    updateGauges(data);
                }
                break;
            case 'error':
                console.error('Live data error:', data);
                app.showAlert('Live data connection error', 'error');
                stopLiveData();
                break;
        }
    }

    function updateCharts(data) {
        const currentTime = new Date().toLocaleTimeString();
        
        // Add new data point
        chartData.time.push(currentTime);
        chartData.rpm.push(data.rpm || 0);
        chartData.speed.push(data.speed || 0);
        chartData.temp.push(data.temp || 0);
        chartData.fuelPressure.push(data.pressure || 0);
        chartData.load.push(data.load || 0);
        chartData.maf.push(data.maf || 0);
        chartData.voltage.push(parseFloat(data.voltage) || 0);

        // Keep only last 20 data points
        const maxPoints = 20;
        Object.keys(chartData).forEach(key => {
            if (chartData[key].length > maxPoints) {
                chartData[key] = chartData[key].slice(-maxPoints);
            }
        });

        // Redraw charts
        drawEngineChart();
        drawTemperatureChart();
    }

    function drawEngineChart() {
        const ctx = charts.engine;
        const canvas = elements.engineChart;
        const padding = 40;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw data lines
        if (chartData.rpm.length > 1) {
            drawDataLine(ctx, chartData.rpm, 0, 8000, 'rgb(102, 126, 234)', canvas, padding, height);
        }
        
        if (chartData.speed.length > 1) {
            drawDataLine(ctx, chartData.speed, 0, 200, 'rgb(39, 174, 96)', canvas, padding, height);
        }

        // Draw legend
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgb(102, 126, 234)';
        ctx.fillText('RPM', padding, 20);
        ctx.fillStyle = 'rgb(39, 174, 96)';
        ctx.fillText('Speed', padding + 50, 20);
    }

    function drawTemperatureChart() {
        const ctx = charts.temperature;
        const canvas = elements.temperatureChart;
        const padding = 40;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw data lines
        if (chartData.temp.length > 1) {
            drawDataLine(ctx, chartData.temp, -40, 150, 'rgb(231, 76, 60)', canvas, padding, height);
        }
        
        if (chartData.fuelPressure.length > 1) {
            drawDataLine(ctx, chartData.fuelPressure, 0, 1000, 'rgb(52, 152, 219)', canvas, padding, height);
        }

        // Draw legend
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgb(231, 76, 60)';
        ctx.fillText('Temp (°C)', padding, 20);
        ctx.fillStyle = 'rgb(52, 152, 219)';
        ctx.fillText('Pressure (kPa)', padding + 100, 20);
    }

    function drawDataLine(ctx, data, min, max, color, canvas, padding, height) {
        const width = canvas.width - padding * 2;
        const dataPoints = data.length;
        
        if (dataPoints < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dataPoints; i++) {
            const x = padding + (i / (dataPoints - 1)) * width;
            const y = canvas.height - padding - ((data[i] - min) / (max - min)) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    function updateGauges(data) {
        drawGauge(elements.rpmGauge, 0, 8000, data.rpm || 0, 'RPM', '#667eea');
        drawGauge(elements.tempGauge, -40, 150, data.temp || 0, '°C', '#e74c3c');
        drawGauge(elements.speedGauge, 0, 200, data.speed || 0, 'km/h', '#27ae60');
        drawGauge(elements.voltageGauge, 8, 16, parseFloat(data.voltage) || 0, 'V', '#f39c12');
    }

    function resetCharts() {
        // Reset chart data
        Object.keys(chartData).forEach(key => {
            chartData[key] = [];
        });

        // Clear canvases
        Object.values(charts).forEach(chart => {
            if (chart.clearRect) {
                chart.clearRect(0, 0, elements.engineChart.width, elements.engineChart.height);
            }
        });

        // Reinitialize gauges
        initializeGauges();

        app.showAlert('Charts reset', 'info');
    }

    function animate() {
        if (isStreaming) {
            // Charts are updated in real-time, so no animation loop needed
            // This function can be used for continuous gauge updates if needed
        }
        
        requestAnimationFrame(animate);
    }

    // Initialize page
    setupEventListeners();
    
    // Set initial gauge values
    initializeGauges();
}