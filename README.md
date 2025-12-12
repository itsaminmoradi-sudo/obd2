# OBD2 Diagnostic Web Application

A production-ready, full-stack web-based OBD2/UDS/KWP2000 diagnostic application for reading vehicle diagnostics, monitoring live data, and managing diagnostic trouble codes via Web Bluetooth API.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Render Deployment](#render-deployment)
- [Web Bluetooth Integration](#web-bluetooth-integration)
- [Adding Manufacturer PID Files](#adding-manufacturer-pid-files)
- [Documentation](#documentation)

## Project Overview

This application provides a web-based interface for OBD2 vehicle diagnostics, allowing users to:

- Connect to vehicles via Web Bluetooth (ELM327 adapters)
- Read real-time vehicle data (RPM, speed, temperatures, etc.)
- View and clear diagnostic trouble codes (DTCs)
- Monitor live sensor data with interactive charts
- Support multiple OBD2 protocols (OBD2, UDS, KWP2000)
- Manage vehicle-specific PID configurations

The application uses:

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Deployment**: Render

## Features

- 🚗 Web Bluetooth API integration for ELM327 adapters
- 📊 Real-time live data streaming with charts
- 🔧 DTC reading and clearing capabilities
- 🛠️ Multi-protocol support (OBD2, UDS, KWP2000)
- 📱 Responsive design with TailwindCSS
- 🏥 Health check endpoint for monitoring
- 🌍 Production-ready Render deployment
- 📦 Modular service architecture
- 🎯 React context-based state management

## Local Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A Bluetooth-enabled device with Web Bluetooth support

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd obd2-diagnostic-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This installs root-level dependencies. Client and server dependencies are installed during build.

3. **Configure environment variables**

   Create `.env.local` in the root directory (for root-level overrides):

   ```bash
   NODE_ENV=development
   PORT=3001
   RENDER=false
   VITE_API_URL=http://localhost:3001
   ```

   Create `.env.local` in the `client/` directory for frontend-specific vars:

   ```bash
   VITE_API_URL=http://localhost:3001
   VITE_ENV=development
   ```

   Create `.env.local` in the `server/` directory for backend-specific vars:

   ```bash
   NODE_ENV=development
   PORT=3001
   RENDER=false
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   This starts both client (Vite on port 3000) and server (Express on port 3001) concurrently.

### Development Workflow

- **Frontend only**: `cd client && npm run dev`
- **Backend only**: `cd server && npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `cd client && npm run preview`

## Project Structure

```
obd2-diagnostic-web/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Connection.jsx
│   │   │   ├── DTCDisplay.jsx
│   │   │   ├── Gauges.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── ECUDetection.jsx
│   │   │   ├── LiveDataDashboard.jsx
│   │   │   ├── Navigation.jsx
│   │   │   └── ...
│   │   ├── pages/                   # Full-page components (routes)
│   │   │   ├── Home.jsx
│   │   │   ├── Diagnostics.jsx
│   │   │   ├── LiveData.jsx
│   │   │   ├── ECUInfo.jsx
│   │   │   ├── PIDManager.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useOBD.js
│   │   │   ├── usePIDs.js
│   │   │   ├── useAPI.js
│   │   │   ├── useWebBluetooth.js
│   │   │   ├── useCharts.js
│   │   │   └── ...
│   │   ├── services/                # API and external service clients
│   │   │   ├── apiClient.js         # HTTP client for backend APIs
│   │   │   ├── webBluetooth.js      # Web Bluetooth wrapper
│   │   │   ├── obdManager.js        # OBD protocol management
│   │   │   ├── pidLoader.js         # PID file loader
│   │   │   └── ...
│   │   ├── utils/                   # Utility functions
│   │   │   ├── constants.js         # App constants
│   │   │   ├── formatters.js        # Data formatting
│   │   │   ├── validators.js        # Data validation
│   │   │   ├── decoders.js          # Protocol decoders
│   │   │   └── ...
│   │   ├── context/                 # React context for state
│   │   │   └── OBDContext.jsx
│   │   ├── assets/                  # Static assets
│   │   │   └── ...
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── public/                      # Static files
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── package.json
│   └── .env.example
│
├── server/                          # Node.js + Express backend
│   ├── routes/                      # API route handlers
│   │   ├── api.js                   # Main API routes
│   │   ├── health.js                # Health check route
│   │   └── ...
│   ├── controllers/                 # Business logic controllers
│   │   ├── obdController.js         # OBD operations
│   │   ├── pidController.js         # PID management
│   │   ├── dtcController.js         # DTC operations
│   │   └── ...
│   ├── services/                    # Business logic services
│   │   ├── protocolHandler.js       # OBD/UDS/KWP2000 protocols
│   │   ├── dtcDecoder.js            # DTC decoding
│   │   ├── pidManager.js            # PID file management
│   │   ├── bluetoothBridge.js       # Bluetooth API bridge
│   │   └── ...
│   ├── middleware/                  # Express middleware
│   │   ├── errorHandler.js          # Error handling
│   │   ├── logger.js                # Request logging
│   │   ├── corsConfig.js            # CORS configuration
│   │   └── ...
│   ├── utils/                       # Utility functions
│   │   ├── constants.js             # Constants
│   │   ├── obdFormatter.js          # OBD data formatting
│   │   ├── dataParser.js            # Data parsing
│   │   └── ...
│   ├── pids/                        # PID JSON files
│   │   ├── example-manufacturer.json
│   │   ├── ikco.json
│   │   ├── peugeot.json
│   │   ├── hyundai.json
│   │   └── ...
│   ├── index.js                     # Express server entry point
│   ├── package.json
│   └── .env.example
│
├── render.yaml                      # Render deployment config
├── .renderignore                    # Files to ignore in Render builds
├── .gitignore
├── .env.example
├── package.json                     # Root package.json with build scripts
├── README.md                        # This file
└── DEPLOYMENT.md                    # Render deployment guide
```

## Available Scripts

### Root Level

```bash
# Install and build both client and server
npm run build

# Build client only
npm run build:client

# Build server dependencies
npm run build:server

# Start production server
npm start

# Start development (both client and server)
npm run dev
```

### Frontend (client/)

```bash
cd client

# Start Vite dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend (server/)

```bash
cd server

# Start Express server
npm start

# Start with nodemon for development
npm run dev
```

## Environment Variables

### Root Level (`.env` or `.env.local`)

```
NODE_ENV=development              # development or production
PORT=3001                         # Port for Express server
RENDER=false                      # Set to "true" on Render
VITE_API_URL=http://localhost:3001  # API URL for frontend
```

### Frontend (client/.env or client/.env.production)

```
VITE_API_URL=http://localhost:3001          # API endpoint
VITE_ENV=development                        # Environment name
```

### Backend (server/.env)

```
NODE_ENV=development    # development or production
PORT=3001               # Server port
RENDER=false            # Set to "true" on Render
```

## API Endpoints

All API endpoints are prefixed with `/api`. Health check is at `/health`.

### OBD Routes

- `POST /api/obd/connect` - Connect to OBD device
- `POST /api/obd/disconnect` - Disconnect from OBD device
- `GET /api/obd/status` - Get connection status
- `POST /api/obd/read-pid` - Read a specific PID
- `POST /api/obd/detect-ecu` - Detect ECU information

### PID Routes

- `GET /api/pids/manufacturers` - List all manufacturers
- `GET /api/pids/manufacturer/:manufacturer` - Get PIDs for a manufacturer
- `GET /api/pids/:manufacturer/:pidCode` - Get specific PID info

### DTC Routes

- `GET /api/dtc/read` - Read all DTCs (stored, pending, permanent)
- `POST /api/dtc/clear` - Clear DTCs
- `GET /api/dtc/decode/:code` - Decode a specific DTC code

### Health Routes

- `GET /health` - Health check endpoint

## Render Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Render deployment instructions.

### Quick Summary

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure environment variables:
   - `NODE_ENV=production`
   - `PORT=3001` (auto-assigned by Render)
   - `RENDER=true`
   - `VITE_API_URL=https://your-render-app.onrender.com`
5. Build command: `npm run build`
6. Start command: `npm start`
7. Deploy

## Web Bluetooth Integration

The application uses the Web Bluetooth API to connect to ELM327 Bluetooth adapters.

### Browser Support

- Chrome/Edge 56+
- Opera 43+
- Samsung Internet 6+
- Android Chrome enabled
- macOS Safari requires feature flag

### Implementation

1. **Request Device**: User clicks "Connect" → browser shows device picker
2. **Connect**: Establish GATT connection to Bluetooth device
3. **Send Commands**: Send OBD commands to the adapter
4. **Receive Data**: Read responses from the vehicle

See `client/src/services/webBluetooth.js` for implementation.

## Adding Manufacturer PID Files

PID files are JSON files defining vehicle-specific parameters.

### File Structure

Create `server/pids/manufacturer-name.json`:

```json
{
  "manufacturer": "manufacturer-name",
  "name": "Manufacturer Display Name",
  "pids": [
    {
      "code": "010C",
      "name": "Engine RPM",
      "unit": "rpm",
      "min": 0,
      "max": 8000,
      "description": "Revolutions per minute of the engine",
      "bytes": 2,
      "formula": "(A*256+B)/4"
    }
  ]
}
```

### Formula Variables

- `A`, `B`, `C`, `D` - Individual response bytes
- `A*256+B` - Combine two bytes
- Numbers and standard math operators supported

## Configuration Files

### vite.config.js

Vite configuration with React plugin, proxy setup, and environment variable handling.

### tailwind.config.js

TailwindCSS configuration pointing to src files and templates.

### render.yaml

Infrastructure as code for Render with:
- Node 18 runtime
- Health check configuration
- Environment variables setup
- Build and start commands

## Troubleshooting

### "Cannot find module" errors

Make sure dependencies are installed:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### Port already in use

Change the port in environment variables or kill the process using the port.

### Web Bluetooth not available

Ensure you're using a supported browser and accessing over HTTPS (or localhost).

### API requests failing

Check that both client and server are running and CORS is properly configured.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Build for production with `npm run build`
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue in the repository.
