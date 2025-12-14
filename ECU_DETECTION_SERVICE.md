# ECU Detection Service Documentation

## Overview

The ECU Detection Service is a comprehensive module that orchestrates vehicle ECU (Engine Control Unit) detection by:

1. **Initializing the OBD2 adapter** with standard AT commands
2. **Auto-detecting the communication protocol** (OBD2, UDS, KWP2000)
3. **Querying vehicle information** via Mode 09 (read vehicle info service)
4. **Fallback to Mode 22 / UDS 0x22** when Mode 09 data is unavailable
5. **Mapping VIN to manufacturer** and loading PID configurations
6. **Caching detection results** for performance optimization

## Architecture

### Service Files

- **`server/services/ecuDetectionService.js`** - Main detection service class
- **`server/services/mockSerialConnection.js`** - Mock serial connection for testing
- **`server/controllers/obdController.js`** - HTTP controller exposing detection endpoints
- **`server/routes/api.js`** - Route definitions for detection endpoints

### PID Database Files

Manufacturer-specific PID files are stored in `server/pids/`:
- `bmw.json` - BMW vehicle PIDs
- `hyundai.json` - Hyundai vehicle PIDs
- `kia.json` - Kia vehicle PIDs
- `peugeot.json` - Peugeot vehicle PIDs
- `ikco.json` - Iran Khodro (IKCO) vehicle PIDs
- `example-manufacturer.json` - Template for adding new manufacturers

## API Usage

### 1. Detect ECU (Main Endpoint)

**POST** `/api/detect`

Performs full ECU detection with caching support.

#### Request Body

```json
{
  "useCache": true,
  "userProtocol": null,
  "useMock": false,
  "mockData": {
    "vin": "WBADT43452G906976",
    "calibrationId": "CA0123456",
    "ecuName": "DME_CONTROL_UNIT",
    "hwSwVersion": "7.4,11.2"
  }
}
```

**Parameters:**
- `useCache` (boolean, default: true) - Return cached result if available
- `userProtocol` (string, optional) - Override detected protocol
- `useMock` (boolean, default: false) - Use mock serial connection (testing)
- `mockData` (object, optional) - Data for mock connection

#### Response (Success)

```json
{
  "timestamp": "2024-12-14T11:30:00.000Z",
  "status": "success",
  "protocol": "uds",
  "vin": "WBADT43452G906976",
  "manufacturer": "bmw",
  "ecuIdentifiers": {
    "vin": "WBADT43452G906976",
    "calibrationId": "CA0123456",
    "ecuName": "DME_CONTROL_UNIT",
    "hardwareSoftwareVersion": "7.4,11.2"
  },
  "supportedModes": ["09", "01", "22"],
  "pidMetadata": {
    "manufacturer": "bmw",
    "name": "BMW",
    "supportedModes": ["01", "02", "03", "09", "22"],
    "pids": [...]
  },
  "engineType": "Unknown",
  "fuelType": "Unknown",
  "detectionTime": 45,
  "adapterInit": {
    "ATZ": "OK",
    "ATE0": "OK",
    "ATL0": "OK",
    "ATS0": "OK"
  },
  "mode09Data": {
    "02": {
      "description": "VIN",
      "data": "6102...",
      "mode": "09"
    },
    ...
  },
  "mode22Data": {...}
}
```

#### Response (Error)

```json
{
  "timestamp": "2024-12-14T11:30:00.000Z",
  "status": "error",
  "error": "Unknown manufacturer - VIN prefix not recognized",
  "protocol": null,
  "vin": null,
  "ecuIdentifiers": {},
  "supportedModes": [],
  "pidMetadata": null,
  "manufacturer": null,
  "engineType": "Unknown",
  "fuelType": "Unknown"
}
```

### 2. Get Cached Detection

**GET** `/api/detect/cached`

Returns the previously cached detection result.

#### Response

```json
{
  "timestamp": "2024-12-14T11:30:00.000Z",
  "status": "success",
  "protocol": "uds",
  "vin": "WBADT43452G906976",
  ...
}
```

#### Error Response (404)

```json
{
  "error": "No cached detection available",
  "message": "Please run detection first using POST /api/detect"
}
```

### 3. Clear Detection Cache

**POST** `/api/detect/clear-cache`

Clears the cached detection result.

#### Response

```json
{
  "message": "Detection cache cleared"
}
```

## Detection Process

The detection service follows this sequence:

### Step 1: Adapter Initialization

Sends standard AT commands to initialize the OBD2 adapter:

```
ATZ     - Reset adapter
ATE0    - Echo off
ATL0    - Linefeeds off
ATS0    - Spaces off
```

**Error Handling:** Throws `AdapterInitializationError` if any command fails

### Step 2: Protocol Detection

Uses adaptive protocol detection:

```
ATSP0   - Automatic protocol detection
ATDP    - Read current protocol
```

**Fallback:** Returns user-provided protocol or defaults to OBD2

### Step 3: Mode 09 Queries

Reads vehicle information via Mode 09 (Read Vehicle Information):

```
0902    - VIN (PID 02)
0904    - Calibration ID (PID 04)
0906    - ECU Name (PID 06)
0909    - Hardware/Software Versions (PID 09)
```

**Response Format:** Hex-encoded data with mode/PID header (e.g., `6102WBADT43452G906976`)

### Step 4: Mode 22/UDS Fallback

If Mode 09 data is missing, falls back to Mode 22 (UDS 0x22):

```
22F18C  - VIN via UDS
22F18E  - Calibration ID via UDS
22F186  - ECU Name via UDS
22F18D  - Hardware/Software Version via UDS
```

### Step 5: VIN Parsing and Manufacturer Mapping

Extracts VIN from responses and maps to manufacturer:

```
VIN = "WBADT43452G906976"
Prefix = "WBA"
Manufacturer = "bmw"
```

**Supported VIN Prefixes:**
- `WBA`, `WBY` → BMW
- `JT` → Toyota
- `HMC`, `KMH` → Hyundai
- `KIA` → Kia
- `WVW` → Volkswagen
- `WP`, `UU` → Audi
- `WDB` → Mercedes
- `SAJ`, `VF7` → Peugeot
- `NM0` → IKCO
- `1G1` → General Motors
- `F1G` → Ford

### Step 6: PID File Loading

Loads manufacturer-specific PID configuration from `server/pids/{manufacturer}.json`

### Step 7: Supported Modes Detection

Determines supported diagnostic modes from PID configuration

## Testing with Mock Serial Connection

### Unit Tests

Run the service test suite:

```bash
node server/services/ecuDetectionService.test.js
```

Output includes:
- ✓ Initialize Adapter
- ✓ Detect Protocol
- ✓ Query Mode 09 Data
- ✓ VIN to Manufacturer Mapping
- ✓ PID File Loading
- ✓ Cache Functionality
- ✓ Full Detection Flow

### Integration Testing via API

**Using Mock Connection:**

```bash
curl -X POST http://localhost:3001/api/detect \
  -H "Content-Type: application/json" \
  -d '{
    "useMock": true,
    "mockData": {
      "vin": "WBADT43452G906976",
      "calibrationId": "CA0123456",
      "ecuName": "DME_CONTROL_UNIT",
      "hwSwVersion": "7.4,11.2"
    }
  }'
```

**Using Cache:**

```bash
# First request (populates cache)
curl -X POST http://localhost:3001/api/detect \
  -H "Content-Type: application/json" \
  -d '{ "useCache": true }'

# Second request (returns cached result)
curl -X GET http://localhost:3001/api/detect/cached
```

## Mock Serial Connection

The `MockSerialConnection` class simulates OBD2 adapter responses for testing:

```javascript
import MockSerialConnection from './services/mockSerialConnection.js';
import ecuDetectionService from './services/ecuDetectionService.js';

// Create mock connection
const mock = new MockSerialConnection({
  vin: 'WBADT43452G906976',
  calibrationId: 'CA0123456',
  ecuName: 'DME_CONTROL_UNIT',
  hwSwVersion: '7.4,11.2',
  protocol: 'ISO 15765-4'
});

// Set as active connection
ecuDetectionService.setSerialConnection(mock);

// Run detection
const result = await ecuDetectionService.detect();
```

### Mock Features

- **Command History**: Track all sent AT commands
- **Response Simulation**: Realistic OBD2 adapter responses
- **Hex Encoding**: Proper hex encoding of responses
- **Timeout Simulation**: Can simulate command timeouts
- **Error Handling**: Can simulate connection errors

## Error Handling

### Timeout Errors

```json
{
  "status": "error",
  "error": "Command timeout: 0902"
}
```

### Unknown Manufacturer

```json
{
  "status": "error",
  "error": "Unknown manufacturer - VIN prefix not recognized"
}
```

**Fallback Behavior:** 
- Attempts to load `example-manufacturer.json` as fallback
- Returns default supported modes: `["09", "22", "01", "02", "03"]`

### PID File Loading Error

```json
{
  "status": "error",
  "error": "Failed to load PID data: ENOENT: no such file or directory"
}
```

## VIN Parsing

The service includes robust VIN parsing that handles:

1. **Hex-encoded responses** (e.g., `6102WBADT43452G906976`)
2. **Response headers** (strips mode/PID prefix)
3. **Plain text VINs** (direct extraction)
4. **Invalid formats** (returns null gracefully)

### Example

```javascript
const parseVIN = (rawData) => {
  // Input: "6102WBADT43452G906976OK\r\n"
  // Output: "WBADT43452G906976"
};
```

## Caching Strategy

### Cache Structure

```javascript
{
  "ecu_detection": {
    timestamp: "2024-12-14T11:30:00.000Z",
    status: "success",
    protocol: "uds",
    vin: "WBADT43452G906976",
    ...
  }
}
```

### Cache Behavior

- **First Request**: Populates cache with detection result
- **Subsequent Requests**: Returns cached result (zero latency)
- **Cache Invalidation**: Manual via `POST /api/detect/clear-cache`
- **In-Memory**: Cache is lost on server restart

### Performance Impact

- Initial detection: 45-100ms (with serial communication)
- Cached detection: <1ms

## Adding New Manufacturers

To support a new vehicle manufacturer:

1. **Create PID file** at `server/pids/{manufacturer}.json`:

```json
{
  "manufacturer": "tesla",
  "name": "Tesla",
  "supportedModes": ["01", "02", "03", "09", "22"],
  "pids": [
    {
      "code": "0902",
      "name": "Vehicle Identification Number",
      "mode": "09",
      "description": "17-character VIN",
      "bytes": 17
    },
    ...
  ]
}
```

2. **Update VIN mapping** in `ecuDetectionService.js`:

```javascript
const VIN_MANUFACTURER_MAP = {
  'TSL': 'tesla',  // Tesla VIN prefix
  ...
};
```

3. **Update constants** in `server/utils/constants.js`:

```javascript
export const VEHICLE_MANUFACTURERS = [
  'tesla',
  'ikco',
  'peugeot',
  ...
];
```

## Client Integration

### React Component Usage

```javascript
import { useState } from 'react';
import apiClient from '../services/apiClient';

export function ECUDetectionPanel() {
  const [ecu, setEcu] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async () => {
    setLoading(true);
    try {
      const response = await apiClient.detectECUv2(true);
      setEcu(response.data);
    } catch (error) {
      console.error('Detection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>ECU Detection</h2>
      {ecu && (
        <div>
          <p>VIN: {ecu.vin}</p>
          <p>Manufacturer: {ecu.manufacturer}</p>
          <p>Protocol: {ecu.protocol}</p>
          <p>Supported Modes: {ecu.supportedModes.join(', ')}</p>
        </div>
      )}
      <button onClick={handleDetect} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect ECU'}
      </button>
    </div>
  );
}
```

### API Client Methods

```javascript
// Detect with cache
await apiClient.detectECUv2(true);

// Detect without cache
await apiClient.detectECUv2(false);

// Get cached result
await apiClient.getCachedDetection();

// Clear cache
await apiClient.clearDetectionCache();
```

## Performance Considerations

### Optimization Strategies

1. **Caching**: First detection takes 45-100ms, cached results are instant
2. **Parallel Querying**: Mode 09 and Mode 22 queries could be parallelized
3. **Timeout Handling**: Default 1000ms timeout per command
4. **Memory**: In-memory cache is lightweight (single object)

### Scalability

- Service is stateless except for single cached result
- Each request can use different mock data
- No database dependencies
- Scales horizontally with load balancing

## Troubleshooting

### Issue: VIN Not Detected

**Solution:** Check if:
1. Mock data includes valid VIN
2. VIN format is valid (17 alphanumeric characters)
3. Mode 09 query returns data (not null/undefined)

### Issue: Manufacturer Unknown

**Solution:**
1. Verify VIN prefix is in `VIN_MANUFACTURER_MAP`
2. Check if PID file exists at `server/pids/{manufacturer}.json`
3. Service will use fallback `example-manufacturer.json`

### Issue: PID File Not Found

**Solution:**
1. Ensure file is at correct path: `server/pids/{manufacturer}.json`
2. File must be valid JSON
3. Service will attempt to use fallback file

### Issue: Command Timeout

**Solution:**
1. Increase timeout: `detect({ timeout: 5000 })`
2. Check serial connection is active
3. Verify adapter is powered on
4. Check for cable issues

## Advanced Usage

### Custom Timeout

```javascript
const result = await ecuDetectionService.detect({
  useCache: false,
  timeout: 5000
});
```

### Using Real Serial Connection

```javascript
// Initialize with real serial connection
class SerialConnection {
  async sendCommand(command) {
    // Send via actual serial port
  }
}

ecuDetectionService.setSerialConnection(new SerialConnection());
const result = await ecuDetectionService.detect();
```

### Direct Service Access

```javascript
import ecuDetectionService from './services/ecuDetectionService';

// Initialize adapter
const initResults = await ecuDetectionService.initializeAdapter();

// Detect protocol
const protocol = await ecuDetectionService.detectProtocol();

// Query Mode 09
const mode09Data = await ecuDetectionService.queryMode09Data();

// Manual VIN extraction
const vin = ecuDetectionService.extractVIN(mode09Data['02'].data);

// Manual manufacturer mapping
const manufacturer = ecuDetectionService.mapVINToManufacturer(vin);
```

## Related Documentation

- [OBD2 Protocols](https://en.wikipedia.org/wiki/On-board_diagnostics)
- [ISO 14230-1 (KWP2000)](https://en.wikipedia.org/wiki/Keyword_Protocol_2000)
- [ISO 15765-2 (ISO-TP)](https://en.wikipedia.org/wiki/ISO_15765-2)
- [VIN Format](https://en.wikipedia.org/wiki/Vehicle_identification_number)
- [OBD Mode 09](https://en.wikipedia.org/wiki/On-board_diagnostics#Service_09_-_Request_vehicle_information)
- [UDS Mode 22](https://en.wikipedia.org/wiki/Unified_Diagnostic_Services)
