# OBD2 Diagnostic Tool - Vanilla Frontend Implementation

A fully functional OBD2 diagnostic application featuring a **vanilla JavaScript frontend** and mock backend server. Built without any build tooling using pure HTML, CSS, and JavaScript modules.

![OBD2 Diagnostic Tool](https://img.shields.io/badge/OBD2-Diagnostic-green)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow)
![No Build Tools](https://img.shields.io/badge/Build-Tool%20Free-blue)
![Responsive](https://img.shields.io/badge/Design-Responsive-purple)

## 🚗 Features

### Core OBD2 Operations
- **Connection Management** - USB/Bluetooth/WiFi device configuration
- **Auto Detection** - Protocol negotiation with live logging
- **DTC Analysis** - Stored/pending/permanent trouble codes with freeze frames
- **Live Data Monitoring** - Real-time engine parameters with custom charts
- **ECU Information** - VIN, hardware/software versions, supported modes
- **PID File Management** - Upload and manage manufacturer-specific PID definitions

### Technical Highlights
- ✅ **Zero Build Tools** - Pure HTML, CSS, JavaScript (ES6 modules)
- ✅ **Hash-based Routing** - Single-page application navigation
- ✅ **Custom Canvas Graphics** - Real-time charts and gauges without libraries
- ✅ **Server-Sent Events (SSE)** - Live data streaming
- ✅ **Responsive Design** - Mobile-first CSS approach
- ✅ **Mock Data Integration** - Full functionality without hardware

## 📁 Project Structure

```
obd2-diagnostic-tool/
├── frontend/                    # Vanilla JavaScript frontend
│   ├── index.html              # Main HTML structure
│   ├── css/styles.css          # Responsive CSS styling
│   ├── js/
│   │   ├── app.js              # Main application controller
│   │   ├── api-client.js       # API client with SSE support
│   │   └── pages/              # Individual page modules
│   │       ├── connection.js   # Device connection interface
│   │       ├── autodetection.js # Protocol detection dashboard
│   │       ├── dtc.js          # DTC workspace with modals
│   │       ├── livedata.js     # Real-time charts and gauges
│   │       ├── ecinfo.js       # ECU information display
│   │       └── pidmanager.js   # File upload/management
│   └── README.md               # Frontend documentation
├── backend/                     # Express.js mock backend
│   ├── package.json            # Backend dependencies
│   └── index.js                # Server with mock APIs
└── package.json                # Root package configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14.0.0 or higher
- Modern web browser with ES6+ support

### Installation & Running

**Option 1: Full Development Setup**
```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend concurrently
npm run dev
```

**Option 2: Backend Only (Recommended)**
```bash
npm run backend:start
```

**Option 3: Frontend Only (Static)**
```bash
npm run frontend:serve
```

### Access Points
- **Frontend**: http://localhost:3001 (served by backend)
- **Static Frontend**: http://localhost:3000 (when using frontend:serve)
- **Backend API**: http://localhost:3001/api/
- **Health Check**: http://localhost:3001/health

## 🔧 Frontend Architecture

### 1. Hash-Based Routing
The application uses `window.location.hash` for client-side routing:

```javascript
// Route handling
const handleRoute = () => {
    const hash = window.location.hash;
    const route = hash.replace('#/', '') || 'connection';
    showPage(route);
};
```

### 2. Module System
ES6 modules provide clean separation of concerns:

```javascript
// Main app initialization
import { ApiClient } from './api-client.js';
import { initConnectionPage } from './pages/connection.js';
import { initLiveDataPage } from './pages/livedata.js';

class Obd2App {
    constructor() {
        this.api = new ApiClient();
        this.setupRouting();
        this.initPageHandlers();
    }
}
```

### 3. Canvas Graphics
Custom charts and gauges without external libraries:

```javascript
// Real-time gauge drawing
function drawGauge(canvas, min, max, value, unit, color) {
    const ctx = canvas.getContext('2d');
    // Custom gauge rendering logic
}
```

### 4. State Management
Client-side caching and state persistence:

```javascript
// Cache management
this.cache = {
    detectionResults: null,
    ecuInfo: null,
    dtcs: null,
    liveData: null
};
```

## 🎯 Key Features Deep Dive

### Connection & Settings Page
- **Device Selection**: USB, Bluetooth, WiFi adapter options
- **Protocol Override**: Manual protocol selection (optional)
- **Baud Rate Configuration**: Standard automotive baud rates
- **Connection Persistence**: Settings saved to localStorage

### Auto Detection Dashboard
- **Live Protocol Negotiation**: Real-time connection attempts
- **VIN Detection**: Vehicle identification number extraction
- **ECU Discovery**: List of detected Electronic Control Units
- **Protocol Identification**: Automatic protocol detection

### DTC Workspace
- **Three Code Categories**: Stored, pending, and permanent DTCs
- **Freeze Frame Modals**: Detailed sensor data when codes were set
- **Clear Functionality**: Clear DTCs with confirmation dialogs
- **Status Indicators**: Color-coded code status and severity

### Live Data Dashboard
- **Custom Canvas Charts**: 
  - Engine RPM & Speed chart
  - Temperature & Pressure chart
- **Live Gauges**:
  - Engine RPM gauge (0-8000 RPM)
  - Temperature gauge (-40°C to 150°C)
  - Speed gauge (0-200 km/h)
  - Battery voltage gauge (8V-16V)
- **Parameter Selection**: Multi-select data parameters
- **SSE Integration**: Real-time data streaming with auto-reconnect

### ECU Information
- **Vehicle Data**: VIN, model, year information
- **Hardware Info**: Version numbers, calibration IDs
- **Engine Specs**: Type, displacement, fuel type
- **Supported Features**: OBD modes and PID count

### PID File Manager
- **Drag & Drop Upload**: File upload with visual feedback
- **JSON Validation**: Automatic file format validation
- **File Management**: List, download, delete PID files
- **Metadata Display**: File size, upload date, descriptions

## 🔄 API Integration

### Mock Backend Endpoints

**Connection Management**
```javascript
POST /api/connect     // Connect to OBD2 device
POST /api/disconnect  // Disconnect from device
GET /api/status       // Get connection status
```

**Auto Detection**
```javascript
POST /api/detection/start    // Start protocol detection
GET /api/detection/results   // Get detection results
```

**DTC Operations**
```javascript
GET /api/dtc/read            // Read all DTC categories
POST /api/dtc/clear          // Clear all DTCs
GET /api/dtc/freeze-frame/:code  // Get freeze frame data
```

**Live Data**
```javascript
GET /api/live-data/stream    // SSE stream for real-time data
```

**ECU Information**
```javascript
GET /api/ecu/info            // Get ECU information
GET /api/ecu/supported-pids  // Get supported PID count
GET /api/ecu/supported-modes // Get supported OBD modes
```

**PID File Management**
```javascript
POST /api/pid/upload         // Upload PID file
GET /api/pid/files           // List loaded files
DELETE /api/pid/files/:name  // Delete PID file
```

### Server-Sent Events (SSE)
Real-time data streaming for live monitoring:

```javascript
// Client-side SSE handling
this.eventSource = new EventSource('/api/live-data/stream');

this.eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    this.updateCharts(data);
    this.updateGauges(data);
};
```

## 📱 Responsive Design

The application uses a mobile-first CSS approach with breakpoints:

- **Desktop**: 1200px+ (Full layout)
- **Tablet**: 768px-1199px (Adaptive grid)
- **Mobile**: <768px (Stacked layout, collapsible nav)

### CSS Grid Layout
```css
/* Adaptive grid for different screen sizes */
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: 1fr;
    }
}
```

## 🎨 UI/UX Features

### Color Scheme
- **Primary**: Gradient blue (`#667eea` to `#764ba2`)
- **Success**: Green (`#27ae60`)
- **Warning**: Orange (`#f39c12`)
- **Error**: Red (`#e74c3c`)
- **Neutral**: Gray tones for secondary elements

### Interactive Elements
- **Loading States**: Spinner animations during operations
- **Hover Effects**: Transform and shadow effects
- **Form Validation**: Real-time input validation
- **Modal System**: Overlay modals for detailed views
- **Toast Notifications**: Success/error feedback messages

## 🔧 Development

### Adding New Features

**1. Create Page Module**
```javascript
// js/pages/newfeature.js
export function initNewFeaturePage(app) {
    const elements = {
        // DOM element references
    };

    function setupEventListeners() {
        // Event handlers
    }

    // Initialize page
    setupEventListeners();
}
```

**2. Register in App**
```javascript
// js/app.js
import { initNewFeaturePage } from './pages/newfeature.js';

function initPageHandlers() {
    initNewFeaturePage(this);
}
```

**3. Add Route to HTML**
```html
<!-- index.html -->
<li><a href="#/newfeature" data-route="newfeature">New Feature</a></li>
<div id="page-newfeature" class="page">
    <!-- Page content -->
</div>
```

### Mock Data Customization

Extend mock data generation in `api-client.js`:

```javascript
// Add new mock data type
async mockGetCustomData() {
    return {
        param1: Math.floor(Math.random() * 100),
        param2: (Math.random() * 10).toFixed(2)
    };
}
```

## 🌐 Browser Compatibility

- **Chrome**: 61+
- **Firefox**: 60+
- **Safari**: 11+
- **Edge**: 79+

### Required APIs
- ES6 Modules
- Fetch API
- Server-Sent Events (SSE)
- Canvas API
- LocalStorage API
- CSS Grid and Flexbox

## 📈 Performance

- **Bundle Size**: No build step = minimal overhead
- **Loading Time**: Fast initial load with lazy-loaded modules
- **Memory Usage**: Efficient Canvas rendering
- **Network**: Optimized SSE for live data
- **Caching**: Client-side caching reduces API calls

## 🔒 Security

- **CORS**: Properly configured for cross-origin requests
- **Input Validation**: File upload validation on backend
- **Error Handling**: Graceful degradation and user feedback
- **XSS Prevention**: Safe DOM manipulation practices

## 🚀 Deployment

### Production Deployment

**Option 1: Express Server**
```bash
# Build not required - serve static files
npm run backend:start
```

**Option 2: Static Hosting**
```bash
# Serve frontend files from any static server
# Frontend works independently with mock data
python3 -m http.server 3000
```

### Environment Variables
```bash
PORT=3001                    # Backend server port
NODE_ENV=production         # Production mode
```

## 🐛 Troubleshooting

### Common Issues

**1. Frontend Not Loading**
- Check browser console for JavaScript errors
- Verify ES6 module support
- Ensure files are served over HTTP (not file://)

**2. SSE Connection Fails**
- Check browser supports Server-Sent Events
- Verify backend is running
- Check network/firewall settings

**3. File Upload Issues**
- Ensure backend has write permissions
- Check file size limits
- Verify JSON format validation

**4. Canvas Not Rendering**
- Check browser Canvas API support
- Verify JavaScript errors in console
- Ensure proper context initialization

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add appropriate error handling
3. Test responsive design changes
4. Update documentation for new features
5. Ensure backward compatibility

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OBD2 protocol specifications
- Modern ES6+ JavaScript features
- Canvas API for graphics rendering
- Express.js for backend services
- Responsive web design principles
