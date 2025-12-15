import protocolHandler from './protocolHandler.js';
import dtcDecoder from './dtcDecoder.js';

class DtcService {
  constructor() {
    this.cache = {
      stored: null,
      pending: null,
      permanent: null,
      uds: null,
      kwp2000: null,
    };
  }

  get #modeResponsePrefix() {
    return {
      '03': '43', // Stored
      '07': '47', // Pending
      '0A': '4A', // Permanent
      '1902FF': '5902', // UDS
      '1800FF00': '58', // KWP2000
    };
  }

  async #readCodes(mode, dtcType) {
    const rawResponse = await protocolHandler.sendCommand(mode);
    const prefix = this.#modeResponsePrefix[mode];
    let dtcData = rawResponse;

    if (rawResponse && prefix && rawResponse.startsWith(prefix)) {
      dtcData = rawResponse.substring(prefix.length);
    }

    const dtcParser = dtcType === 'uds' ? 'parseUdsDtcResponse' : 'parseDtcResponse';
    const dtcCodes = dtcDecoder[dtcParser](dtcData);

    return await Promise.all(
      dtcCodes.map(async code => {
        const details = dtcDecoder.getDtcDetails(code);
        const freezeFrame = dtcType === 'uds'
          ? await this.#readUdsFreezeFrame(code)
          : await this.#readFreezeFrame(code);
        return {
          ...details,
          dtcType,
          freezeFrame,
        };
      })
    );
  }

  async #readFreezeFrame() {
    const rawResponse = await protocolHandler.sendCommand('020200');
    if (rawResponse && !rawResponse.includes('NO DATA')) {
      return { raw: rawResponse };
    }
    return null;
  }

  async #readUdsFreezeFrame(dtcCode) {
    const rawResponse = await protocolHandler.sendCommand(`1904${dtcCode}FF`);
    if (rawResponse && !rawResponse.includes('NO DATA')) {
      return { raw: rawResponse };
    }
    return null;
  }

  async getStoredDTCs(useCache = true) {
    if (useCache && this.cache.stored) return this.cache.stored;
    const dtcs = await this.#readCodes('03', 'stored');
    this.cache.stored = dtcs;
    return dtcs;
  }

  async getPendingDTCs(useCache = true) {
    if (useCache && this.cache.pending) return this.cache.pending;
    const dtcs = await this.#readCodes('07', 'pending');
    this.cache.pending = dtcs;
    return dtcs;
  }

  async getPermanentDTCs(useCache = true) {
    if (useCache && this.cache.permanent) return this.cache.permanent;
    const dtcs = await this.#readCodes('0A', 'permanent');
    this.cache.permanent = dtcs;
    return dtcs;
  }

  async getUdsDTCs(useCache = true) {
    if (useCache && this.cache.uds) return this.cache.uds;
    const dtcs = await this.#readCodes('1902FF', 'uds');
    this.cache.uds = dtcs;
    return dtcs;
  }

  async getKwp2000DTCs(useCache = true) {
    if (useCache && this.cache.kwp2000) return this.cache.kwp2000;
    const dtcs = await this.#readCodes('1800FF00', 'kwp2000');
    this.cache.kwp2000 = dtcs;
    return dtcs;
  }

  async clearDTCs() {
    const obd2Response = await protocolHandler.sendCommand('04');
    const udsResponse = await protocolHandler.sendCommand('14FFFFFF');
    const kwp2000Response = await protocolHandler.sendCommand('14FF00');

    this.invalidateCache();

    const success =
      obd2Response.includes('44') ||
      udsResponse.includes('54') ||
      kwp2000Response.includes('54');

    return {
      success,
      message: success ? 'DTCs cleared successfully.' : 'Failed to clear DTCs.',
      obd2Response,
      udsResponse,
      kwp2000Response,
    };
  }

  invalidateCache() {
    this.cache = {
      stored: null,
      pending: null,
      permanent: null,
      uds: null,
      kwp2000: null,
    };
  }
}

export default new DtcService();
