import dtcService from '../services/dtcService.js';

class DTCController {
  async getStoredDTCs(req, res, next) {
    try {
      const { useCache = true } = req.query;
      const dtcs = await dtcService.getStoredDTCs(useCache);
      res.status(200).json(dtcs);
    } catch (error) {
      next(error);
    }
  }

  async getKwp2000DTCs(req, res, next) {
    try {
      const { useCache = true } = req.query;
      const dtcs = await dtcService.getKwp2000DTCs(useCache);
      res.status(200).json(dtcs);
    } catch (error) {
      next(error);
    }
  }

  async getPendingDTCs(req, res, next) {
    try {
      const { useCache = true } = req.query;
      const dtcs = await dtcService.getPendingDTCs(useCache);
      res.status(200).json(dtcs);
    } catch (error) {
      next(error);
    }
  }

  async getPermanentDTCs(req, res, next) {
    try {
      const { useCache = true } = req.query;
      const dtcs = await dtcService.getPermanentDTCs(useCache);
      res.status(200).json(dtcs);
    } catch (error) {
      next(error);
    }
  }

  async getUdsDTCs(req, res, next) {
    try {
      const { useCache = true } = req.query;
      const dtcs = await dtcService.getUdsDTCs(useCache);
      res.status(200).json(dtcs);
    } catch (error) {
      next(error);
    }
  }

  async clearDTCs(req, res, next) {
    try {
      const result = await dtcService.clearDTCs();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DTCController();
