import ecuDetectionService from '../services/ecuDetectionService.js';
import MockSerialConnection from '../services/mockSerialConnection.js';

class OBDController {
  async connect(req, res, next) {
    try {
      const { deviceId } = req.body;
      // Implementation will be added
      res.status(200).json({ message: 'OBD connection initialized', deviceId });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      // Implementation will be added
      res.status(200).json({ message: 'OBD disconnected' });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      // Implementation will be added
      res.status(200).json({ connected: false });
    } catch (error) {
      next(error);
    }
  }

  async readPID(req, res, next) {
    try {
      const { pidCode } = req.body;
      // Implementation will be added
      res.status(200).json({ pidCode, value: null });
    } catch (error) {
      next(error);
    }
  }

  async detectECU(req, res, next) {
    try {
      // Implementation will be added
      res.status(200).json({ ecu: null });
    } catch (error) {
      next(error);
    }
  }

  async detect(req, res, next) {
    try {
      const { 
        useCache = true, 
        userProtocol = null,
        mockData = null,
        useMock = false 
      } = req.body;

      // Setup mock connection if requested
      if (useMock) {
        const mockConnection = new MockSerialConnection(mockData || {});
        ecuDetectionService.setSerialConnection(mockConnection);
      }

      // Get detection result (from cache or perform new detection)
      const result = await ecuDetectionService.detect({
        useCache,
        userProtocol,
      });

      if (result.status === 'error') {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCachedDetection(req, res, next) {
    try {
      const cached = ecuDetectionService.getCachedDetection();

      if (!cached) {
        return res.status(404).json({
          error: 'No cached detection available',
          message: 'Please run detection first using POST /api/detect',
        });
      }

      res.status(200).json(cached);
    } catch (error) {
      next(error);
    }
  }

  async clearDetectionCache(req, res, next) {
    try {
      ecuDetectionService.clearCache();
      res.status(200).json({
        message: 'Detection cache cleared',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OBDController();
