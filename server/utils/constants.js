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

export const PROTOCOLS = {
  OBD2: 'obd2',
  UDS: 'uds',
  KWP2000: 'kwp2000',
};

export const VEHICLE_MANUFACTURERS = [
  'ikco',
  'peugeot',
  'hyundai',
  'kia',
  'bmw',
  'mercedes',
  'audi',
  'volkswagen',
  'toyota',
  'honda',
  'ford',
  'general-motors',
];

export const DTC_PREFIXES = {
  P: 'Powertrain',
  B: 'Body',
  C: 'Chassis',
  U: 'Network',
};
