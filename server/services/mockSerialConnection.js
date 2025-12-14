/**
 * Mock serial connection for testing EcuDetectionService
 * Simulates responses from an OBD2 adapter
 */
class MockSerialConnection {
  constructor(options = {}) {
    this.options = {
      vin: 'WBADT43452G906976', // Default BMW VIN
      calibrationId: 'CA0123456',
      ecuName: 'DME_CONTROL_UNIT',
      hwSwVersion: '7.4,11.2',
      protocol: 'ISO 15765-4',
      ...options,
    };
    this.commandHistory = [];
  }

  /**
   * Send a command and return a simulated response
   */
  sendCommand(command) {
    this.commandHistory.push(command);

    // Handle initialization commands
    if (command === 'ATZ') return 'OK';
    if (command === 'ATE0') return 'OK';
    if (command === 'ATL0') return 'OK';
    if (command === 'ATS0') return 'OK';

    // Handle protocol detection
    if (command === 'ATSP0') return 'OK';
    if (command === 'ATDP') {
      return `Trying to connect with ${this.options.protocol}\r\nOK`;
    }

    // Handle Mode 09 requests (VIN, Calibration ID, ECU Name, HW/SW Version)
    if (command === '0902') {
      return `6102${Buffer.from(this.options.vin).toString('hex').toUpperCase()}\r\nOK`;
    }
    if (command === '0904') {
      return `6104${this.options.calibrationId.replace(/[^0-9A-F]/gi, '')}\r\nOK`;
    }
    if (command === '0906') {
      return `6106${Buffer.from(this.options.ecuName).toString('hex').toUpperCase()}\r\nOK`;
    }
    if (command === '0909') {
      return `6109${Buffer.from(this.options.hwSwVersion).toString('hex').toUpperCase()}\r\nOK`;
    }

    // Handle Mode 22 requests (UDS reads)
    if (command === '22F18C') {
      return `6262${Buffer.from(this.options.vin).toString('hex').toUpperCase()}\r\nOK`;
    }
    if (command === '22F18E') {
      return `6262${this.options.calibrationId.replace(/[^0-9A-F]/gi, '')}\r\nOK`;
    }
    if (command === '22F186') {
      return `6262${Buffer.from(this.options.ecuName).toString('hex').toUpperCase()}\r\nOK`;
    }
    if (command === '22F18D') {
      return `6262${Buffer.from(this.options.hwSwVersion).toString('hex').toUpperCase()}\r\nOK`;
    }

    // Default response for unknown commands
    return `OK`;
  }

  /**
   * Get command history
   */
  getCommandHistory() {
    return [...this.commandHistory];
  }

  /**
   * Reset command history
   */
  resetHistory() {
    this.commandHistory = [];
  }

  /**
   * Check if a command was sent
   */
  wasCommandSent(command) {
    return this.commandHistory.includes(command);
  }

  /**
   * Get all commands of a certain type
   */
  getCommandsOfType(prefix) {
    return this.commandHistory.filter(cmd => cmd.startsWith(prefix));
  }
}

export default MockSerialConnection;
