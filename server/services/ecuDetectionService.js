import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIDS_DIR = path.join(__dirname, '../pids');

// VIN manufacturer prefix mapping
const VIN_MANUFACTURER_MAP = {
  'WBA': 'bmw',
  'WBY': 'bmw',
  'JT': 'toyota',
  'HMC': 'hyundai',
  'KMH': 'hyundai',
  'KIA': 'kia',
  'WVW': 'volkswagen',
  'WP': 'audi',
  'UU': 'audi',
  'WDB': 'mercedes',
  'SAJ': 'peugeot',
  'VF7': 'peugeot',
  'NM0': 'ikco',
  '1G1': 'general-motors',
  'F1G': 'ford',
};

class EcuDetectionService {
  constructor() {
    this.detectionCache = new Map();
    this.serialConnection = null;
  }

  /**
   * Set mock serial connection for testing
   */
  setSerialConnection(connection) {
    this.serialConnection = connection;
  }

  /**
   * Send AT command via serial connection
   */
  async sendCommand(command, timeout = 1000) {
    if (!this.serialConnection) {
      throw new Error('Serial connection not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      try {
        const response = this.serialConnection.sendCommand(command);
        clearTimeout(timeoutId);
        resolve(response);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Initialize adapter with standard AT commands
   */
  async initializeAdapter() {
    const initCommands = [
      { cmd: 'ATZ', desc: 'Reset adapter' },
      { cmd: 'ATE0', desc: 'Echo off' },
      { cmd: 'ATL0', desc: 'Linefeeds off' },
      { cmd: 'ATS0', desc: 'Spaces off' },
    ];

    const results = {};
    for (const { cmd, desc } of initCommands) {
      try {
        const response = await this.sendCommand(cmd);
        results[cmd] = response;
      } catch (error) {
        throw new Error(`Adapter initialization failed at ${desc}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Probe and detect protocol
   */
  async detectProtocol(userProtocol = null) {
    try {
      // Auto-detect protocol using ATSP0
      const response = await this.sendCommand('ATSP0');
      
      // Try to get current protocol
      const dpResponse = await this.sendCommand('ATDP');
      
      // Parse protocol response
      let detectedProtocol = 'obd2'; // default
      
      if (dpResponse.includes('ISO 14230') || dpResponse.includes('KWP')) {
        detectedProtocol = 'kwp2000';
      } else if (dpResponse.includes('UDS') || dpResponse.includes('ISO 15765')) {
        detectedProtocol = 'uds';
      }
      
      return detectedProtocol;
    } catch (error) {
      // Fallback to user protocol or default
      if (userProtocol) {
        return userProtocol;
      }
      throw new Error(`Protocol detection failed: ${error.message}`);
    }
  }

  /**
   * Query Mode 09 PIDs for VIN and ECU info
   */
  async queryMode09Data() {
    const mode09PIDs = {
      '02': 'VIN',
      '04': 'Calibration ID',
      '06': 'ECU Name',
      '09': 'Hardware/Software Versions',
    };

    const results = {};

    for (const [pid, description] of Object.entries(mode09PIDs)) {
      try {
        const command = `09${pid}`;
        const response = await this.sendCommand(command);
        results[pid] = {
          description,
          data: response,
          mode: '09',
        };
      } catch (error) {
        results[pid] = {
          description,
          data: null,
          error: error.message,
          mode: '09',
        };
      }
    }

    return results;
  }

  /**
   * Fallback to Mode 22 / UDS 0x22 reads
   */
  async queryMode22Data(mode09Results) {
    // Only query Mode 22 if Mode 09 data is missing
    const mode22Map = {
      'F18C': 'VIN via UDS',
      'F18E': 'Calibration ID via UDS',
      'F186': 'ECU Name via UDS',
      'F18D': 'Hardware/Software Versions via UDS',
    };

    const results = {};

    for (const [pid, description] of Object.entries(mode22Map)) {
      try {
        const command = `22${pid}`;
        const response = await this.sendCommand(command);
        results[pid] = {
          description,
          data: response,
          mode: '22',
        };
      } catch (error) {
        results[pid] = {
          description,
          data: null,
          error: error.message,
          mode: '22',
        };
      }
    }

    return results;
  }

  /**
   * Extract VIN from Mode 09 or Mode 22 responses
   */
  extractVIN(mode09Results, mode22Results) {
    // Try Mode 09 PID 02 first
    if (mode09Results['02'] && mode09Results['02'].data) {
      return this.parseVIN(mode09Results['02'].data);
    }

    // Fallback to Mode 22
    if (mode22Results && mode22Results['F18C'] && mode22Results['F18C'].data) {
      return this.parseVIN(mode22Results['F18C'].data);
    }

    return null;
  }

  /**
   * Parse VIN string from response
   */
  parseVIN(rawData) {
    if (!rawData) return null;

    // Try to extract as hex-encoded data first
    let cleanData = rawData.replace(/\r\n/g, '').replace(/OK/g, '').trim();

    // Skip response header if present (e.g., 6102 for Mode 09 or 6262 for Mode 22)
    if (cleanData.length > 4) {
      cleanData = cleanData.slice(4);
    }

    // Try to decode hex if it looks like hex (all hex chars)
    if (/^[0-9A-Fa-f]*$/.test(cleanData) && cleanData.length > 0) {
      try {
        const decoded = Buffer.from(cleanData, 'hex').toString('ascii');
        // VIN is typically 17 alphanumeric characters
        const vinMatch = decoded.match(/[A-HJ-NPR-Z0-9]{17}/);
        if (vinMatch) return vinMatch[0];
      } catch (e) {
        // Hex decode failed, try raw match
      }
    }

    // Try to extract as plain text
    const vinMatch = rawData.match(/[A-HJ-NPR-Z0-9]{17}/);
    return vinMatch ? vinMatch[0] : null;
  }

  /**
   * Map VIN prefix to manufacturer
   */
  mapVINToManufacturer(vin) {
    if (!vin) return null;

    for (const [prefix, manufacturer] of Object.entries(VIN_MANUFACTURER_MAP)) {
      if (vin.startsWith(prefix)) {
        return manufacturer;
      }
    }

    return null;
  }

  /**
   * Load manufacturer PID file
   */
  async loadManufacturerPIDs(manufacturer) {
    try {
      const filePath = path.join(PIDS_DIR, `${manufacturer}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load PID file for manufacturer '${manufacturer}': ${error.message}`);
    }
  }

  /**
   * Get supported diagnostic modes from PID data
   */
  getSupportedModes(pidData) {
    const modes = new Set();
    
    if (pidData && pidData.pids) {
      pidData.pids.forEach(pid => {
        const code = pid.code;
        if (code.startsWith('09')) modes.add('09');
        if (code.startsWith('22')) modes.add('22');
        if (code.startsWith('01')) modes.add('01');
        if (code.startsWith('02')) modes.add('02');
        if (code.startsWith('03')) modes.add('03');
      });
    }

    // Default supported modes
    modes.add('09');
    modes.add('22');
    
    return Array.from(modes);
  }

  /**
   * Detect ECU - main orchestration method
   */
  async detect(options = {}) {
    const {
      useCache = true,
      userProtocol = null,
      timeout = 5000,
    } = options;

    // Check cache
    const cacheKey = 'ecu_detection';
    if (useCache && this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey);
    }

    try {
      const startTime = Date.now();
      const detectionResult = {
        timestamp: new Date().toISOString(),
        status: 'success',
        protocol: null,
        vin: null,
        ecuIdentifiers: {},
        supportedModes: [],
        pidMetadata: null,
        manufacturer: null,
        engineType: 'Unknown',
        fuelType: 'Unknown',
        error: null,
      };

      // Step 1: Initialize adapter
      const initResults = await this.initializeAdapter();
      detectionResult.adapterInit = initResults;

      // Step 2: Detect protocol
      detectionResult.protocol = await this.detectProtocol(userProtocol);

      // Step 3: Query Mode 09 data
      const mode09Results = await this.queryMode09Data();
      detectionResult.mode09Data = mode09Results;

      // Step 4: Fallback to Mode 22 if needed
      const mode22Results = await this.queryMode22Data(mode09Results);
      detectionResult.mode22Data = mode22Results;

      // Step 5: Extract VIN
      detectionResult.vin = this.extractVIN(mode09Results, mode22Results);

      // Step 6: Map VIN to manufacturer
      const detectedManufacturer = this.mapVINToManufacturer(detectionResult.vin);
      detectionResult.manufacturer = detectedManufacturer;

      // Step 7: Load PID metadata
      if (detectedManufacturer) {
        try {
          detectionResult.pidMetadata = await this.loadManufacturerPIDs(detectedManufacturer);
          detectionResult.supportedModes = this.getSupportedModes(detectionResult.pidMetadata);
        } catch (error) {
          detectionResult.error = `Failed to load PID data: ${error.message}`;
        }
      } else {
        detectionResult.error = 'Unknown manufacturer - VIN prefix not recognized';
        // Try to load example manufacturer as fallback
        try {
          detectionResult.pidMetadata = await this.loadManufacturerPIDs('example-manufacturer');
          detectionResult.supportedModes = this.getSupportedModes(detectionResult.pidMetadata);
        } catch (fallbackError) {
          detectionResult.supportedModes = ['09', '22', '01', '02', '03'];
        }
      }

      // Step 8: Extract ECU identifiers from responses
      detectionResult.ecuIdentifiers = {
        vin: detectionResult.vin,
        calibrationId: mode09Results['04']?.data || mode22Results?.['F18E']?.data || null,
        ecuName: mode09Results['06']?.data || null,
        hardwareSoftwareVersion: mode09Results['09']?.data || mode22Results?.['F18D']?.data || null,
      };

      detectionResult.detectionTime = Date.now() - startTime;

      // Cache the result
      if (useCache) {
        this.detectionCache.set(cacheKey, detectionResult);
      }

      return detectionResult;
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message,
        protocol: null,
        vin: null,
        ecuIdentifiers: {},
        supportedModes: [],
        pidMetadata: null,
        manufacturer: null,
        engineType: 'Unknown',
        fuelType: 'Unknown',
      };
    }
  }

  /**
   * Clear detection cache
   */
  clearCache() {
    this.detectionCache.clear();
  }

  /**
   * Get cached detection result
   */
  getCachedDetection() {
    return this.detectionCache.get('ecu_detection') || null;
  }
}

export default new EcuDetectionService();
