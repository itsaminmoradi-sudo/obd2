import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import DtcService from './dtcService.js';
import ecuDetectionService from './ecuDetectionService.js';
import MockSerialConnection from './mockSerialConnection.js';

describe('DtcService', () => {
  let mockSerialConnection;

  beforeEach(() => {
    mockSerialConnection = new MockSerialConnection();
    ecuDetectionService.setSerialConnection(mockSerialConnection);
    DtcService.invalidateCache(); // Clear cache before each test
  });

  afterEach(() => {
    ecuDetectionService.setSerialConnection(null);
  });

  describe('getStoredDTCs', () => {
    it('should retrieve and decode stored DTCs with freeze frames', async () => {
      mockSerialConnection.sendCommand = jest.fn()
        .mockResolvedValueOnce('430101')    // Mode 03 response
        .mockResolvedValueOnce('420200'); // Mode 02 freeze frame response

      const dtcs = await DtcService.getStoredDTCs(false);
      expect(dtcs).toHaveLength(1);
      expect(dtcs[0].code).toBe('P0101');
      expect(dtcs[0].dtcType).toBe('stored');
      expect(dtcs[0].freezeFrame).not.toBeNull();
    });
  });

  describe('getPendingDTCs', () => {
    it('should retrieve pending DTCs', async () => {
      mockSerialConnection.sendCommand = jest.fn()
        .mockResolvedValueOnce('470102') // Mode 07 response
        .mockResolvedValueOnce('NO DATA'); // No freeze frame

      const dtcs = await DtcService.getPendingDTCs(false);
      expect(dtcs).toHaveLength(1);
      expect(dtcs[0].code).toBe('P0102');
      expect(dtcs[0].dtcType).toBe('pending');
      expect(dtcs[0].freezeFrame).toBeNull();
    });
  });

  describe('getUdsDTCs', () => {
    it('should retrieve and decode UDS DTCs', async () => {
      mockSerialConnection.sendCommand = jest.fn()
        .mockResolvedValueOnce('5902012300FF') // UDS response
        .mockResolvedValueOnce('5904012300FF');   // UDS freeze frame

      const dtcs = await DtcService.getUdsDTCs(false);
      expect(dtcs).toHaveLength(1);
      expect(dtcs[0].code).toBe('P012300');
      expect(dtcs[0].dtcType).toBe('uds');
      expect(dtcs[0].freezeFrame).not.toBeNull();
    });
  });

  describe('getKwp2000DTCs', () => {
    it('should retrieve and decode KWP2000 DTCs', async () => {
      mockSerialConnection.sendCommand = jest.fn()
        .mockResolvedValueOnce('580123'); // KWP2000 response

      const dtcs = await DtcService.getKwp2000DTCs(false);
      expect(dtcs).toHaveLength(1);
      expect(dtcs[0].code).toBe('P0123');
      expect(dtcs[0].dtcType).toBe('kwp2000');
    });
  });

  describe('clearDTCs', () => {
    it('should send clear commands and invalidate cache', async () => {
      mockSerialConnection.sendCommand = jest.fn()
        .mockResolvedValueOnce('44') // OBD2 clear
        .mockResolvedValueOnce('54') // UDS clear
        .mockResolvedValueOnce('54'); // KWP2000 clear

      const result = await DtcService.clearDTCs();
      expect(result.success).toBe(true);
      expect(DtcService.cache.stored).toBeNull();
    });
  });
});
