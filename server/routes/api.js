import express from 'express';
import obdController from '../controllers/obdController.js';
import pidController from '../controllers/pidController.js';
import dtcController from '../controllers/dtcController.js';
import streamController from '../controllers/streamController.js';

const router = express.Router();

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

// Health check via api
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

export default router;
