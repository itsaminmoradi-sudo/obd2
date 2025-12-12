export const PROTOCOLS = {
  OBD2: 'obd2',
  UDS: 'uds',
  KWP2000: 'kwp2000',
};

export const OBD_SERVICES = {
  SHOW_CURRENT_DATA: '01',
  SHOW_FREEZE_FRAME: '02',
  SHOW_DTC: '03',
  CLEAR_DTC: '04',
  READ_DTC_BY_STATUS: '07',
  READ_OXYGEN_SENSORS: '08',
  READ_VEHICLE_INFO: '09',
  READ_PERIODIC_DATA: '0A',
};

export const DTC_TYPES = {
  STORED: 'stored',
  PENDING: 'pending',
  PERMANENT: 'permanent',
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
  OBD_CONNECT: '/api/obd/connect',
  OBD_DISCONNECT: '/api/obd/disconnect',
  OBD_STATUS: '/api/obd/status',
  READ_PID: '/api/obd/read-pid',
  DETECT_ECU: '/api/obd/detect-ecu',
  GET_MANUFACTURERS: '/api/pids/manufacturers',
  READ_DTCS: '/api/dtc/read',
  CLEAR_DTCS: '/api/dtc/clear',
};

export const COMMON_PIDS = {
  ENGINE_RPM: '010C',
  VEHICLE_SPEED: '010D',
  COOLANT_TEMP: '0105',
  MAP: '010B',
};
