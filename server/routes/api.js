import express from 'express';
import obdController from '../controllers/obdController.js';
import pidController from '../controllers/pidController.js';
import dtcController from '../controllers/dtcController.js';

const router = express.Router();

// OBD routes
router.post('/obd/connect', obdController.connect);
router.post('/obd/disconnect', obdController.disconnect);
router.get('/obd/status', obdController.getStatus);
router.post('/obd/read-pid', obdController.readPID);
router.post('/obd/detect-ecu', obdController.detectECU);

// PID routes
router.get('/pids/manufacturers', pidController.getManufacturers);
router.get('/pids/manufacturer/:manufacturer', pidController.getManufacturerPIDs);
router.get('/pids/:manufacturer/:pidCode', pidController.getPIDInfo);

// DTC routes
router.get('/dtc/read', dtcController.readDTCs);
router.post('/dtc/clear', dtcController.clearDTCs);
router.get('/dtc/decode/:code', dtcController.decodeDTC);

// Health check via api
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

export default router;
