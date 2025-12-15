import ecuDetectionService from './ecuDetectionService.js'; // Used to access the serial connection

class ProtocolHandler {
  constructor() {
    this.protocol = 'AUTO';
  }

  get serialConnection() {
    return ecuDetectionService.serialConnection;
  }

  async initializeProtocol(protocolType = 'AUTO') {
    if (!this.serialConnection) {
      throw new Error('Serial connection not available');
    }

    this.protocol = protocolType;
    await this.sendCommand('ATZ');
    await this.sendCommand('ATE0');
    await this.sendCommand('ATL0');
    await this.sendCommand('ATS0');
    if (protocolType === 'AUTO') {
      await this.sendCommand('ATSP0');
    } else {
      await this.sendCommand(`ATSP${protocolType}`);
    }
    return true;
  }

  async sendCommand(command) {
    if (!this.serialConnection) {
      throw new Error('Serial connection not available');
    }
    const rawResponse = await this.serialConnection.sendCommand(command);
    return this.parseResponse(rawResponse);
  }

  parseResponse(response) {
    if (typeof response !== 'string') {
      return null;
    }

    const cleaned = response
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/>/g, '')
      .trim();

    const parts = cleaned.split(' ');
    const data = parts.filter(part => {
      return (
        part &&
        part !== 'OK' &&
        part !== 'NO' &&
        part !== 'DATA' &&
        part !== 'SEARCHING...' &&
        !part.includes('ELM')
      );
    });

    return data.join('');
  }
}

export default new ProtocolHandler();
