import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  // Health check
  async checkHealth() {
    return client.get('/health');
  },

  // OBD operations
  async connectOBD(deviceId) {
    return client.post('/api/obd/connect', { deviceId });
  },

  async disconnectOBD() {
    return client.post('/api/obd/disconnect');
  },

  async getOBDStatus() {
    return client.get('/api/obd/status');
  },

  async readPID(pidCode) {
    return client.post('/api/obd/read-pid', { pidCode });
  },

  async detectECU() {
    return client.post('/api/obd/detect-ecu');
  },

  // ECU Detection (new endpoints)
  async detectECUv2(useCache = true, userProtocol = null) {
    return client.post('/api/detect', { useCache, userProtocol });
  },

  async getCachedDetection() {
    return client.get('/api/detect/cached');
  },

  async clearDetectionCache() {
    return client.post('/api/detect/clear-cache');
  },

  // PID operations
  async getManufacturers() {
    return client.get('/api/pids/manufacturers');
  },

  async getManufacturerPIDs(manufacturer) {
    return client.get(`/api/pids/manufacturer/${manufacturer}`);
  },

  async getPIDInfo(manufacturer, pidCode) {
    return client.get(`/api/pids/${manufacturer}/${pidCode}`);
  },

  // DTC operations
  async readDTCs() {
    return client.get('/api/dtc/read');
  },

  async clearDTCs() {
    return client.post('/api/dtc/clear');
  },

  async decodeDTC(code) {
    return client.get(`/api/dtc/decode/${code}`);
  },
};

export default apiClient;
