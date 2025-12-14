export function formatTemperature(celsius) {
  if (typeof celsius !== 'number') return 'N/A';
  return `${celsius.toFixed(1)}°C`;
}

export function formatSpeed(kmh) {
  if (typeof kmh !== 'number') return 'N/A';
  return `${kmh.toFixed(1)} km/h`;
}

export function formatRPM(rpm) {
  if (typeof rpm !== 'number') return 'N/A';
  return `${rpm.toFixed(0)} RPM`;
}

export function formatPressure(kpa) {
  if (typeof kpa !== 'number') return 'N/A';
  return `${kpa.toFixed(1)} kPa`;
}

export function formatVoltage(volts) {
  if (typeof volts !== 'number') return 'N/A';
  return `${volts.toFixed(3)} V`;
}

export function formatHex(value) {
  return `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}
