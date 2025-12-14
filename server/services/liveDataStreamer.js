import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIDS_DIR = path.join(__dirname, '../pids');

/**
 * LiveDataStreamer - Polls OBD2 PIDs at regular intervals and streams data via SSE
 * Batches queries for engine, cooling, fuel, and electrical metrics
 * Executes at 100-200 ms intervals
 */
class LiveDataStreamer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.pollingInterval = options.pollingInterval || 150; // ms
    this.manufacturer = options.manufacturer || 'hyundai';
    this.serialConnection = options.serialConnection || null;
    this.isStreaming = false;
    this.streamingThread = null;
    this.pids = new Map();
    this.pidsByCategory = {
      engine: [],
      cooling: [],
      fuel: [],
      electrical: [],
    };
    this.lastSample = {};
    this.sampleBuffer = [];
    this.maxBufferSize = 100;
    this.errorCount = 0;
    this.successCount = 0;
  }

  /**
   * Load PID definitions for the manufacturer
   */
  async loadPIDs() {
    try {
      const pidFilePath = path.join(PIDS_DIR, `${this.manufacturer}.json`);
      const fileContent = await fs.readFile(pidFilePath, 'utf-8');
      const pidData = JSON.parse(fileContent);

      // Organize PIDs by category
      for (const pidDef of pidData.pids) {
        const category = pidDef.category || 'engine'; // Default to engine if not specified
        this.pids.set(pidDef.code, pidDef);
        
        if (this.pidsByCategory[category]) {
          this.pidsByCategory[category].push(pidDef);
        }
      }

      console.log(`[LiveDataStreamer] Loaded ${this.pids.size} PIDs for ${this.manufacturer}`);
      return true;
    } catch (error) {
      console.error(`[LiveDataStreamer] Error loading PIDs:`, error.message);
      return false;
    }
  }

  /**
   * Start streaming live data
   */
  async start(serialConnection) {
    if (this.isStreaming) {
      console.warn('[LiveDataStreamer] Already streaming');
      return false;
    }

    this.serialConnection = serialConnection;
    
    if (!await this.loadPIDs()) {
      console.error('[LiveDataStreamer] Failed to load PIDs');
      return false;
    }

    this.isStreaming = true;
    this.errorCount = 0;
    this.successCount = 0;
    
    // Start the polling loop (fire and forget, don't await)
    this._pollData();

    console.log(`[LiveDataStreamer] Started streaming at ${this.pollingInterval}ms intervals`);
    return true;
  }

  /**
   * Stop streaming
   */
  stop() {
    this.isStreaming = false;
    if (this.streamingThread) {
      clearTimeout(this.streamingThread);
      this.streamingThread = null;
    }
    console.log('[LiveDataStreamer] Stopped streaming');
  }

  /**
   * Background polling loop
   */
  _pollData = async () => {
    if (!this.isStreaming) return;

    try {
      const startTime = Date.now();
      
      // Batch queries by category
      const sample = await this._batchQueryByCategory();
      
      if (sample && Object.keys(sample).length > 0) {
        this.lastSample = sample;
        this.sampleBuffer.push(sample);
        
        // Keep buffer size bounded
        if (this.sampleBuffer.length > this.maxBufferSize) {
          this.sampleBuffer.shift();
        }
        
        // Emit event for SSE subscribers
        this.emit('data', sample);
        this.successCount++;
      }

      // Adaptive timing for slow ECUs
      const elapsed = Date.now() - startTime;
      const delay = Math.max(50, this.pollingInterval - elapsed);
      
      this.streamingThread = setTimeout(this._pollData, delay);
    } catch (error) {
      console.error('[LiveDataStreamer] Polling error:', error.message);
      this.errorCount++;
      
      // Exponential backoff on error
      if (this.isStreaming) {
        const delay = Math.min(1000, this.pollingInterval * 2);
        this.streamingThread = setTimeout(this._pollData, delay);
      }
    }
  };

  /**
   * Batch query PIDs by category
   */
  async _batchQueryByCategory() {
    const sample = {
      timestamp: new Date().toISOString(),
      categories: {},
    };

    // Query each category
    for (const [category, pids] of Object.entries(this.pidsByCategory)) {
      if (pids.length === 0) continue;

      const categoryData = {};
      
      for (const pidDef of pids) {
        try {
          const value = await this._queryPID(pidDef);
          if (value !== null && !isNaN(value)) {
            categoryData[pidDef.code] = {
              name: pidDef.name,
              value,
              unit: pidDef.unit || '',
              min: pidDef.min,
              max: pidDef.max,
            };
          }
        } catch (error) {
          // Log error but continue with next PID
          console.error(`[LiveDataStreamer] Error reading PID ${pidDef.code}:`, error.message);
        }
      }

      if (Object.keys(categoryData).length > 0) {
        sample.categories[category] = categoryData;
      }
    }

    return sample;
  }

  /**
   * Query a single PID
   */
  async _queryPID(pidDef) {
    if (!this.serialConnection) {
      // For testing: return mock data
      return this._generateMockValue(pidDef);
    }

    try {
      // Send OBD command (mode 01 for standard PIDs)
      const command = pidDef.code;
      const response = await this.serialConnection.sendCommand(command);
      
      // Parse response and apply formula
      const bytes = this._parseResponse(response, pidDef);
      if (bytes.length === 0) return null;

      const value = this._evaluateFormula(pidDef.formula, bytes);
      return this._validateValue(value, pidDef);
    } catch (error) {
      console.error(`[LiveDataStreamer] Query error for ${pidDef.code}:`, error.message);
      return null;
    }
  }

  /**
   * Parse OBD response to extract data bytes
   */
  _parseResponse(response, pidDef) {
    try {
      // Remove whitespace and 'OK' suffix
      const cleanResponse = response.replace(/\s/g, '').replace(/OK$/, '');
      
      // Expected format: mode+pidCode+data
      const modeBytes = 2; // Mode response (e.g., 41 for mode 01)
      const pidCodeBytes = pidDef.code.length;
      const dataStartIndex = modeBytes + pidCodeBytes;
      
      const dataHex = cleanResponse.substring(dataStartIndex);
      const bytes = [];
      
      for (let i = 0; i < Math.min(pidDef.bytes, dataHex.length / 2); i++) {
        bytes.push(parseInt(dataHex.substring(i * 2, (i + 1) * 2), 16));
      }
      
      return bytes;
    } catch (error) {
      console.error('[LiveDataStreamer] Parse error:', error.message);
      return [];
    }
  }

  /**
   * Evaluate formula with byte values
   */
  _evaluateFormula(formula, bytes) {
    try {
      if (!formula) return null;

      // Create variable scope for formula
      const scope = {};
      for (let i = 0; i < bytes.length; i++) {
        scope[String.fromCharCode(65 + i)] = bytes[i]; // A, B, C, D...
      }

      // Simple formula evaluation (basic safety: only allow math operations)
      const safeFormula = formula
        .replace(/[^A-Z0-9+\-*/().]/g, '')
        .replace(/\(/g, '(')
        .replace(/\)/g, ')');

      // Evaluate with scope
      const result = Function(...Object.keys(scope), `return ${safeFormula}`)(
        ...Object.values(scope)
      );

      return typeof result === 'number' ? result : null;
    } catch (error) {
      console.error('[LiveDataStreamer] Formula evaluation error:', error.message);
      return null;
    }
  }

  /**
   * Validate value against PID constraints
   */
  _validateValue(value, pidDef) {
    if (value === null || isNaN(value)) return null;

    // Check bounds
    if (pidDef.min !== undefined && value < pidDef.min) return null;
    if (pidDef.max !== undefined && value > pidDef.max) return null;

    return value;
  }

  /**
   * Generate mock value for testing
   */
  _generateMockValue(pidDef) {
    // Map PID codes to realistic mock values
    const mockValues = {
      '010C': () => 1500 + Math.random() * 3000, // RPM
      '010D': () => Math.random() * 120, // Vehicle speed
      '0105': () => 80 + Math.random() * 20, // Coolant temp
      '010B': () => 50 + Math.random() * 80, // MAP
      '0111': () => Math.random() * 100, // Throttle position
      '010E': () => -20 + Math.random() * 30, // Timing advance
      '0114': () => Math.random() * 1.275, // O2 sensor voltage
      '0101': () => Math.random() * 255, // Monitor status
      '0120': () => Math.random() * 100, // PIDs supported
    };

    const mockFn = mockValues[pidDef.code];
    if (mockFn) {
      const value = mockFn();
      return this._validateValue(value, pidDef);
    }

    // Default mock value in middle of range
    if (pidDef.min !== undefined && pidDef.max !== undefined) {
      return (pidDef.min + pidDef.max) / 2;
    }

    return Math.random() * 100;
  }

  /**
   * Get latest sample
   */
  getLatestSample() {
    return this.lastSample;
  }

  /**
   * Get sample buffer
   */
  getSampleBuffer() {
    return [...this.sampleBuffer];
  }

  /**
   * Get streaming stats
   */
  getStats() {
    return {
      isStreaming: this.isStreaming,
      manufacturer: this.manufacturer,
      pollingInterval: this.pollingInterval,
      successCount: this.successCount,
      errorCount: this.errorCount,
      bufferSize: this.sampleBuffer.length,
      pidCount: this.pids.size,
    };
  }
}

export default new LiveDataStreamer();
