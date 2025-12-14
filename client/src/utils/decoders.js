export function decodeOBDResponse(hexString) {
  // Implementation will be added
}

export function decodeDTC(code) {
  // Implementation will be added
}

export function decodeVIN(vinString) {
  // Implementation will be added
}

export function decodeFrame(frameData) {
  // Implementation will be added
}

export function hexToDecimal(hexString) {
  return parseInt(hexString, 16);
}

export function decimalToHex(decimal) {
  return decimal.toString(16).toUpperCase();
}

export function byteArrayToHexString(byteArray) {
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}
