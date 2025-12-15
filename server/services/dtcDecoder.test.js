import { describe, it, expect } from '@jest/globals';
import DTCDecoder from './dtcDecoder.js';

describe('DTCDecoder', () => {
  describe('decodeDtcFromHex', () => {
    it('should decode a 2-byte P-code', () => {
      expect(DTCDecoder.decodeDtcFromHex('0123')).toBe('P0123');
    });

    it('should decode a 3-byte UDS code', () => {
      expect(DTCDecoder.decodeDtcFromHex('012300')).toBe('P012300');
    });
  });

  describe('parseDtcResponse', () => {
    it('should parse multiple OBD2 DTCs', () => {
      expect(DTCDecoder.parseDtcResponse('01234123')).toEqual(['P0123', 'C0123']);
    });
  });

  describe('parseUdsDtcResponse', () => {
    it('should parse a UDS DTC response', () => {
      expect(DTCDecoder.parseUdsDtcResponse('012300FF')).toEqual(['P012300']);
    });
  });
});
