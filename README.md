# OBD2 Diagnostic Tool

A pure Python stdlib implementation of an OBD2 diagnostic tool with HTTP server, serial communication, and real-time data streaming capabilities.

## Features

- **Pure Python stdlib**: No external dependencies required
- **HTTP Server**: ThreadingHTTPServer with REST API and static file serving
- **Serial Communication**: USB serial (termios/fcntl) and Bluetooth RFCOMM support
- **Configuration Management**: JSON-based configuration with environment variable overrides
- **Server-Sent Events**: Real-time data streaming and heartbeat monitoring
- **PID Data Management**: Manufacturer-specific PID JSON files with validation
- **Frontend Interface**: Responsive web interface for diagnostics and configuration
- **Docker Support**: Containerized deployment with no external dependencies
- **Render Deployment**: Infrastructure as Code configuration

## Architecture

```
├── backend/               # Python backend server
│   ├── server.py         # Main HTTP server with routing
│   ├── config.py         # Configuration management
│   ├── serial_handler.py # Serial communication layer
│   ├── sse_handler.py    # Server-Sent Events manager
│   └── pid_loader.py     # PID data loader and validator
├── frontend/             # Static web frontend
│   ├── index.html        # Main HTML interface
│   ├── css/style.css     # Responsive styling
│   └── js/app.js         # Frontend JavaScript
├── pids/                 # Manufacturer PID data files
│   ├── ikco.json         # Iran Khodro Company
│   ├── peugeot.json      # Peugeot manufacturer
│   ├── hyundai.json      # Hyundai manufacturer
│   ├── bosch.json        # Bosch manufacturer
│   ├── siemens.json      # Siemens manufacturer
│   ├── valeo.json        # Valeo manufacturer
│   └── sagem.json        # Sagem manufacturer
├── Dockerfile            # Container configuration
├── render.yaml           # Render deployment configuration
└── README.md            # This file
```

## Quick Start

### Prerequisites

- Python 3.7+ (tested with 3.11)
- Linux/macOS/Windows with serial port access
- OBD2 adapter (USB or Bluetooth)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd obd2-diagnostic-tool
   ```

2. Run the server:
   ```bash
   python backend/server.py
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t obd2-diagnostic-tool .

# Run the container
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  -e SERIAL_BAUDRATE=38400 \
  obd2-diagnostic-tool
```

### Environment Variables

Configure the application using environment variables:

```bash
# Server Configuration
export PORT=8000                    # Server port (default: 8000)
export HOST=0.0.0.0                # Server host (default: 0.0.0.0)

# Serial Configuration
export SERIAL_PORT=/dev/ttyUSB0     # Default serial port
export SERIAL_BAUDRATE=38400        # Default baud rate (default: 38400)
export SERIAL_TIMEOUT=1.0           # Serial timeout in seconds (default: 1.0)
export SERIAL_PROTOCOL=elm327       # OBD2 protocol (default: elm327)

# Bluetooth Configuration
export BT_ENABLED=false             # Enable Bluetooth support (default: false)
export BT_RFCOMM_CHANNEL=1          # RFCOMM channel (default: 1)

# Logging Configuration
export LOG_LEVEL=INFO               # Log level (default: INFO)
```

## Configuration

### JSON Configuration File

The application creates a `config.json` file with default settings:

```json
{
  "server": {
    "port": 8000,
    "host": "0.0.0.0"
  },
  "serial": {
    "port": "/dev/ttyUSB0",
    "baudrate": 38400,
    "timeout": 1.0,
    "protocol": "elm327"
  },
    "bluetooth": {
    "enabled": false,
    "rfcomm_channel": 1
  },
  "logging": {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  }
}
```

### API Endpoints

#### Health Check
- `GET /health` - Server health status

#### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration

#### Serial Communication
- `GET /api/serial/ports` - List available serial ports
- `POST /api/serial/connect` - Connect to serial port
- `POST /api/serial/disconnect` - Disconnect from serial port

#### PID Data Management
- `GET /api/pids` - Get currently loaded PIDs
- `POST /api/pids/load` - Load PID data for manufacturer

#### Server-Sent Events
- `GET /events/{type}` - Subscribe to event stream

## Serial Communication

### Supported Interfaces

1. **USB Serial**: Direct connection via USB-to-serial adapter
   - Uses `termios` and `fcntl` for low-level serial port control
   - Supports standard baud rates: 9600, 19200, 38400, 57600, 115200

2. **Bluetooth RFCOMM**: Wireless connection via Bluetooth
   - Uses `socket` module for RFCOMM communication
   - Supports MAC address-based device connections

### OBD2 Commands

The system supports standard OBD2 PID commands:

- `010C` - Engine RPM
- `010D` - Vehicle Speed  
- `0111` - Throttle Position
- `0105` - Engine Coolant Temperature
- `012F` - Fuel Level Input
- `010B` - Intake Manifold Pressure
- `0110` - Mass Air Flow Rate
- `0114` - Oxygen Sensor Voltage

## PID Data Format

Manufacturer PID files follow this schema:

```json
[
  {
    "id": "manufacturer_001",
    "name": "Parameter Name",
    "command": "010C",
    "type": "Engine",
    "formula": "(A*256 + B) / 4",
    "unit": "RPM",
    "description": "Parameter description",
    "min_value": 0,
    "max_value": 16383.75,
    "supported": true
  }
]
```

### Required Fields

- `name`: Human-readable parameter name
- `command`: OBD2 command (hexadecimal string)
- `type`: Parameter category (Engine, Vehicle, Fuel, Emissions, etc.)
- `formula`: Calculation formula using A, B, C, D bytes
- `unit`: Unit of measurement

### Optional Fields

- `id`: Unique identifier (auto-generated if not provided)
- `description`: Detailed description
- `min_value`/`max_value`: Valid value range
- `supported`: Whether parameter is supported

## Development

### Local Development Setup

1. Set up Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Run development server:
   ```bash
   python backend/server.py
   ```

### Code Structure

- **server.py**: Main HTTP server with routing and request handling
- **config.py**: Configuration management with environment variable support
- **serial_handler.py**: Serial communication abstraction layer
- **sse_handler.py**: Server-Sent Events connection management
- **pid_loader.py**: PID data loading and validation

### Adding New Manufacturers

1. Create new JSON file in `/pids/` directory
2. Follow the PID schema with required fields
3. Include manufacturer-specific PID definitions

Example:
```bash
# Create file
cat > pids/newbrand.json << 'EOF'
[
  {
    "name": "Engine RPM",
    "command": "010C",
    "type": "Engine",
    "formula": "(A*256 + B) / 4",
    "unit": "RPM"
  }
]
