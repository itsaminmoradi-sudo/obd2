# OBD2 Diagnostic Tool - Vanilla Frontend

A fully static frontend for OBD2 diagnostic operations using pure HTML, CSS, and JavaScript modules without build tooling.

## Structure

```
frontend/
├── index.html          # Main HTML structure with hash routing
├── css/
│   └── styles.css      # Comprehensive responsive CSS
└── js/
    ├── app.js          # Main application controller
    ├── api-client.js   # API client with SSE and mock support
    └── pages/          # Individual page modules
        ├── connection.js
        ├── autodetection.js
        ├── dtc.js
        ├── livedata.js
        ├── ecinfo.js
        └── pidmanager.js
```

## Features

### 1. Connection & Settings
- Device selection (USB/Bluetooth/WiFi OBD2 adapters)
- Connection type toggle
- Port and baud rate configuration
- Protocol overrides
- Connection status monitoring
- Local storage for configuration persistence

### 2. Auto Detection Dashboard
- Live protocol negotiation logs
- VIN and manufacturer detection
- ECU metadata display
- Real-time status updates

### 3. DTC Workspace
- Stored/pending/permanent DTC tables
- Freeze frame modal with detailed data
- Clear DTCs functionality with confirmation
- Status feedback system

### 4. Live Data Dashboard
- Custom Canvas charts for engine parameters
- Live gauges for key metrics (RPM, temperature, speed, voltage)
- Multi-parameter selection
- SSE stream integration with auto-reconnection
- Real-time data visualization

### 5. ECU Information
- VIN, hardware/software versions
- Calibration IDs and CVN
- Engine type and fuel information
- Supported OBD modes and PIDs

### 6. PID File Manager
- Drag and drop JSON file upload
- File validation and error handling
- File listing with metadata
- Delete functionality
- Download simulation

## Technical Implementation

### Hash-based Routing
- Lightweight router for single-page navigation
- Dynamic page loading without page refresh
- Active state management for navigation

### API Client Features
- Fetch-based HTTP requests
- Server-Sent Events (SSE) for live data
- Automatic retry logic
- Mock data generation for development
- Error handling and recovery

### Canvas Graphics
- Custom chart rendering without external libraries
- Real-time line charts for time-series data
- Circular gauge widgets with color coding
- Responsive canvas sizing

### State Management
- Client-side caching of detection results
- Session persistence across page navigation
- Local storage for user preferences

### Responsive Design
- Mobile-first CSS approach
- Breakpoints for tablet and desktop
- Collapsible navigation on mobile
- Flexible grid layouts

## Mock Data Integration

The frontend includes comprehensive mock data generation for development:
- Protocol negotiation simulation
- ECU detection results
- Live sensor data streams
- DTC records with freeze frames
- ECU information responses
- PID file management

## Browser Compatibility

- Modern browsers with ES6+ support
- Canvas API support required
- LocalStorage API
- Fetch API and EventSource (SSE)

## Usage

1. Open `index.html` in a web server environment
2. Navigate using the hash-based navigation
3. Use mock data functionality for development
4. All interactions work without a backend for demo purposes

## Development Notes

- No build tools required - uses native ES6 modules
- CSS custom properties for theming
- Modular JavaScript architecture
- Mock backend API for standalone operation
- Real-time data visualization without external dependencies