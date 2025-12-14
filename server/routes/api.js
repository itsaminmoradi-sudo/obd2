import express from 'express';
import multer from 'multer';

import obdController from '../controllers/obdController.js';
import pidController from '../controllers/pidController.js';
import dtcController from '../controllers/dtcController.js';
import streamController from '../controllers/streamController.js';
import ecuDetectionService from '../services/ecuDetectionService.js';
import MockSerialConnection from '../services/mockSerialConnection.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function mapDetectionForVanilla(result) {
  if (!result) return null;

  const ecuName = result.ecuIdentifiers?.ecuName || result.ecuIdentifiers?.name || 'ECU';
  const softwareVersion =
    result.ecuIdentifiers?.hardwareSoftwareVersion ||
    result.ecuIdentifiers?.hwSwVersion ||
    result.ecuIdentifiers?.softwareVersion ||
    null;

  return {
    status: result.status,
    timestamp: result.timestamp,
    vin: result.vin,
    manufacturer: result.manufacturer,
    protocol: result.protocol,
    ecus: [
      {
        id: '01',
        name: ecuName,
        status: result.status === 'success' ? 'Detected' : 'Unknown',
        protocol: result.protocol,
        softwareVersion,
      },
    ],
    raw: result,
  };
}

// OBD routes
router.post('/obd/connect', obdController.connect);
router.post('/obd/disconnect', obdController.disconnect);
router.get('/obd/status', obdController.getStatus);
router.post('/obd/read-pid', obdController.readPID);
router.post('/obd/detect-ecu', obdController.detectECU);

// ECU Detection routes
router.post('/detect', obdController.detect);
router.get('/detect/cached', obdController.getCachedDetection);
router.post('/detect/clear-cache', obdController.clearDetectionCache);

// PID routes
router.get('/pids/manufacturers', pidController.getManufacturers);
router.get('/pids/manufacturer/:manufacturer', pidController.getManufacturerPIDs);
router.get('/pids/:manufacturer/:pidCode', pidController.getPIDInfo);

// DTC routes
router.get('/dtc/read', dtcController.readDTCs);
router.post('/dtc/clear', dtcController.clearDTCs);
router.get('/dtc/decode/:code', dtcController.decodeDTC);

// Stream routes
router.get('/stream/live', streamController.connectSSE);
router.get('/stream/poll', streamController.pollLiveData);
router.get('/stream/stats', streamController.getStats);
router.post('/stream/start', streamController.startStream);
router.post('/stream/stop', streamController.stopStream);
router.get('/stream/buffer', streamController.getSampleBuffer);

// Vanilla frontend compatibility routes
router.post('/connect', obdController.connect);
router.post('/disconnect', obdController.disconnect);
router.get('/status', obdController.getStatus);

router.post('/detection/start', async (req, res, next) => {
  try {
      const useMock = req.body?.useMock === true || !ecuDetectionService.serialConnection;
      if (useMock) {
        ecuDetectionService.setSerialConnection(new MockSerialConnection(req.body?.mockData || {}));
      }

    const result = await ecuDetectionService.detect({
      useCache: false,
      userProtocol: req.body?.userProtocol || null,
    });

    if (result.status === 'error') {
      return res.status(400).json(result);
    }

    return res.status(200).json(mapDetectionForVanilla(result));
  } catch (error) {
    next(error);
  }
});
router.get('/detection/results', (req, res) => {
  const cached = ecuDetectionService.getCachedDetection();
  if (!cached) {
    return res.status(404).json({
      error: 'No cached detection available',
      message: 'Run auto detection first.',
    });
  }

  return res.status(200).json(mapDetectionForVanilla(cached));
});
router.post('/detection/clear-cache', obdController.clearDetectionCache);

router.get('/live-data/stream', streamController.connectVanillaSSE);
router.get('/live-data/poll', streamController.pollLiveData);

router.get('/ecu/info', (req, res) => {
  const cached = ecuDetectionService.getCachedDetection();
  if (!cached) {
    return res.status(404).json({
      error: 'No cached detection available',
      message: 'Run auto detection first.',
    });
  }

  const ids = cached.ecuIdentifiers || {};

  res.status(200).json({
    vin: cached.vin || null,
    manufacturer: cached.manufacturer || null,
    protocol: cached.protocol || null,

    vehicleId: cached.manufacturer || null,
    hardwareVersion: ids.hardwareSoftwareVersion || null,
    softwareVersion: ids.hardwareSoftwareVersion || null,
    calibrationId: ids.calibrationId || null,
    cvn: null,
    engineType: null,
    fuelType: null,
    displacement: null,

    supportedModes: cached.supportedModes || [],
    supportedPids: Array.isArray(cached.pidMetadata?.pids) ? cached.pidMetadata.pids.length : null,
  });
});

router.get('/ecu/supported-pids', (req, res) => {
  const cached = ecuDetectionService.getCachedDetection();
  if (!cached?.pidMetadata?.pids) {
    return res.status(404).json({
      error: 'No cached PID metadata available',
      message: 'Run auto detection first.',
    });
  }

  res.status(200).json({
    manufacturer: cached.manufacturer,
    pids: cached.pidMetadata.pids,
  });
});

router.get('/ecu/supported-modes', (req, res) => {
  const cached = ecuDetectionService.getCachedDetection();
  if (!cached?.supportedModes) {
    return res.status(404).json({
      error: 'No cached supported modes available',
      message: 'Run auto detection first.',
    });
  }

  res.status(200).json({
    manufacturer: cached.manufacturer,
    supportedModes: cached.supportedModes,
  });
});

router.post('/pid/upload', upload.single('pidFile'), pidController.uploadPIDFile);
router.get('/pid/files', pidController.listPIDFiles);
router.delete('/pid/files/:filename', pidController.deletePIDFile);

// Health check via api
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

export default router;
