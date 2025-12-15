const dtcLookup = {
  P0101: { description: 'Mass or Volume Air Flow Circuit Range/Performance Problem', severity: 'Medium' },
  P0102: { description: 'Mass or Volume Air Flow Circuit Low Input', severity: 'High' },
  P0123: { description: 'Throttle/Pedal Position Sensor/Switch A Circuit High', severity: 'High' },
  P0300: { description: 'Random/Multiple Cylinder Misfire Detected', severity: 'High' },
  P0301: { description: 'Cylinder 1 Misfire Detected', severity: 'High' },
  P0420: { description: 'Catalyst System Efficiency Below Threshold (Bank 1)', severity: 'Low' },
  P0456: { description: 'Evaporative Emission System Leak Detected (Very Small Leak)', severity: 'Low' },
  C0035: { description: 'Left Front Wheel Speed Sensor Circuit', severity: 'Medium' },
  B00A0: { description: 'Occupant Classification System', severity: 'Medium' },
  U0123: { description: 'Lost Communication With Yaw Rate Sensor Module', severity: 'Medium' },
};

class DTCDecoder {
  decodeDtcFromHex(hexCode) {
    const byte1 = parseInt(hexCode.substring(0, 2), 16);
    const firstCharLookup = ['P', 'C', 'B', 'U'];
    const secondCharLookup = ['0', '1', '2', '3'];

    const firstChar = firstCharLookup[(byte1 & 0b11000000) >> 6];
    const secondChar = secondCharLookup[(byte1 & 0b00110000) >> 4];

    // Handle 2-byte (OBD2/KWP) vs 3-byte (UDS) DTCs
    const restOfCode = hexCode.length > 4
      ? (byte1 & 0b00001111).toString(16) + hexCode.substring(2, 6) // UDS
      : (byte1 & 0b00001111).toString(16) + hexCode.substring(2, 4);  // OBD2

    return `${firstChar}${secondChar}${restOfCode.padStart(3, '0')}`.toUpperCase();
  }

  parseDtcResponse(hexResponse) {
    if (!hexResponse || typeof hexResponse !== 'string' || hexResponse.length % 4 !== 0) {
      return [];
    }

    const dtcs = [];
    for (let i = 0; i < hexResponse.length; i += 4) {
      const hexCode = hexResponse.substring(i, i + 4);
      if (hexCode !== '0000') {
        dtcs.push(this.decodeDtcFromHex(hexCode));
      }
    }
    return dtcs;
  }

  parseUdsDtcResponse(hexResponse) {
    if (!hexResponse || typeof hexResponse !== 'string' || hexResponse.length % 8 !== 0) {
      return [];
    }

    const dtcs = [];
    for (let i = 0; i < hexResponse.length; i += 8) {
      const udsCode = hexResponse.substring(i, i + 6);
      dtcs.push(this.decodeDtcFromHex(udsCode));
    }
    return dtcs;
  }

  getDtcDetails(dtcCode) {
    const details = dtcLookup[dtcCode];
    if (details) {
      return { code: dtcCode, ...details };
    }
    return {
      code: dtcCode,
      description: 'Unknown trouble code',
      severity: 'Unknown',
    };
  }
}

export default new DTCDecoder();
