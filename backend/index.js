import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock data storage
let mockState = {
    connected: false,
    connectionConfig: null,
    detectionResults: null,
    dtcs: {
        stored: [],
        pending: [],
        permanent: []
    },
    ecuInfo: null,
    pidFiles: [
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

// Connection endpoints
app.post('/api/connect', (req, res) => {
    const config = req.body;
    
    setTimeout(() => {
        mockState.connected = true;
        mockState.connectionConfig = config;
        
        res.json({
            success: true,
            message: 'Connected successfully',
            protocol: config.protocolOverride || 'CAN_11BIT_500K',
            device: config.deviceSelect
        });
    }, 1000); // Simulate connection delay
});

app.post('/api/disconnect', (req, res) => {
    setTimeout(() => {
        mockState.connected = false;
        mockState.connectionConfig = null;
        
        res.json({
            success: true,
            message: 'Disconnected successfully'
        });
    }, 500);
});

app.get('/api/status', (req, res) => {
    res.json({
        connected: mockState.connected,
        config: mockState.connectionConfig
    });
});

// Auto detection endpoints
app.post('/api/detection/start', (req, res) => {
    setTimeout(() => {
        const mockResults = {
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
        
        mockState.detectionResults = mockResults;
        
        res.json(mockResults);
    }, 2000); // Simulate detection delay
});

app.get('/api/detection/results', (req, res) => {
    if (!mockState.detectionResults) {
        return res.status(404).json({ error: 'No detection results available' });
    }
    
    res.json(mockState.detectionResults);
});

// DTC endpoints
app.get('/api/dtc/read', (req, res) => {
    setTimeout(() => {
        if (!mockState.connected) {
            return res.status(400).json({ error: 'Not connected to vehicle' });
        }
        
        const mockDTCs = {
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
        
        mockState.dtcs = mockDTCs;
        res.json(mockDTCs);
    }, 1500);
});

app.post('/api/dtc/clear', (req, res) => {
    setTimeout(() => {
        if (!mockState.connected) {
            return res.status(400).json({ error: 'Not connected to vehicle' });
        }
        
        mockState.dtcs = { stored: [], pending: [], permanent: [] };
        
        res.json({
            success: true,
            message: 'DTCs cleared successfully'
        });
    }, 1000);
});

app.get('/api/dtc/freeze-frame/:code', (req, res) => {
    const { code } = req.params;
    
    const freezeFrame = {
        rpm: Math.floor(Math.random() * 2000) + 800,
        speed: Math.floor(Math.random() * 80),
        load: Math.floor(Math.random() * 50) + 20,
        coolantTemp: Math.floor(Math.random() * 60) + 60,
        fuelPressure: Math.floor(Math.random() * 200) + 300,
        mafRate: (Math.random() * 20 + 5).toFixed(1),
        throttlePos: Math.floor(Math.random() * 30),
        batteryVoltage: (Math.random() * 2 + 12).toFixed(1)
    };
    
    res.json({ code, freezeFrame });
});

// Live data SSE endpoint
app.get('/api/live-data/stream', (req, res) => {
    if (!mockState.connected) {
        return res.status(400).json({ error: 'Not connected to vehicle' });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial connection message
    res.write('data: {"event":"connected"}\n\n');
    
    // Generate mock live data
    const interval = setInterval(() => {
        const data = {
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
        
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000); // Update every second
    
    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
    });
});

// ECU info endpoints
app.get('/api/ecu/info', (req, res) => {
    setTimeout(() => {
        if (!mockState.connected) {
            return res.status(400).json({ error: 'Not connected to vehicle' });
        }
        
        const ecuInfo = {
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
        
        mockState.ecuInfo = ecuInfo;
        res.json(ecuInfo);
    }, 1000);
});

app.get('/api/ecu/supported-pids', (req, res) => {
    res.json({ supportedPids: 128 });
});

app.get('/api/ecu/supported-modes', (req, res) => {
    res.json({ supportedModes: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '0A'] });
});

// PID file management
const upload = multer({ dest: 'uploads/' });

app.post('/api/pid/upload', upload.single('pidFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate JSON file
    try {
        // For demo, we'll just accept the file
        const fileInfo = {
            name: req.file.originalname,
            size: formatFileSize(req.file.size),
            uploaded: new Date().toLocaleString(),
            description: 'Custom PID definitions'
        };
        
        mockState.pidFiles.push(fileInfo);
        
        res.json({
            success: true,
            message: 'PID file uploaded successfully',
            filename: req.file.originalname
        });
    } catch (error) {
        res.status(400).json({ error: 'Invalid JSON file' });
    }
});

app.get('/api/pid/files', (req, res) => {
    res.json({
        success: true,
        files: mockState.pidFiles
    });
});

app.delete('/api/pid/files/:filename', (req, res) => {
    const { filename } = req.params;
    
    mockState.pidFiles = mockState.pidFiles.filter(file => file.name !== filename);
    
    res.json({
        success: true,
        message: 'PID file deleted successfully'
    });
});

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start server
app.listen(PORT, () => {
    console.log(`OBD2 Diagnostic Backend Server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
});

export default app;
