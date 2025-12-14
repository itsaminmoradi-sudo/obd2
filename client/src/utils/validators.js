export function isValidPIDCode(code) {
  // PID codes are typically 4 hex digits
  return /^[0-9A-Fa-f]{4}$/.test(code);
}

export function isValidDTCCode(code) {
  // DTC codes are 5 characters (1 letter + 4 digits/hex)
  return /^[PBCU][0-9A-Fa-f]{3}[0-9]$/.test(code);
}

export function isValidVIN(vin) {
  // VIN is 17 characters
  return typeof vin === 'string' && vin.length === 17;
}

export function isValidHexString(hexString) {
  return /^[0-9A-Fa-f]+$/.test(hexString);
}

export function isValidBluetoothDeviceId(deviceId) {
  return typeof deviceId === 'string' && deviceId.length > 0;
}

export function isValidTemperature(temp) {
  return typeof temp === 'number' && temp >= -40 && temp <= 215;
}

export function isValidSpeed(speed) {
  return typeof speed === 'number' && speed >= 0 && speed <= 300;
}
