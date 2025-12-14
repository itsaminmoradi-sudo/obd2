import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIDS_DIR = path.join(__dirname, '../pids');

function sanitizeFilename(filename) {
  const base = path.basename(filename);
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) {
    return null;
  }
  return base;
}

async function readPidFileByManufacturer(manufacturer) {
  const fileName = `${manufacturer}.json`;
  const safeName = sanitizeFilename(fileName);
  if (!safeName) {
    const err = new Error('Invalid manufacturer');
    err.status = 400;
    throw err;
  }

  const filePath = path.join(PIDS_DIR, safeName);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

class PIDController {
  async getManufacturers(req, res, next) {
    try {
      const entries = await fs.readdir(PIDS_DIR, { withFileTypes: true });
      const jsonFiles = entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => e.name);

      const manufacturers = [];
      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(PIDS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          const code = data.manufacturer || file.replace(/\.json$/, '');
          manufacturers.push({
            code,
            name: data.name || code,
            supportedModes: data.supportedModes || [],
          });
        } catch {
          const code = file.replace(/\.json$/, '');
          manufacturers.push({ code, name: code, supportedModes: [] });
        }
      }

      res.status(200).json({ manufacturers });
    } catch (error) {
      next(error);
    }
  }

  async getManufacturerPIDs(req, res, next) {
    try {
      const { manufacturer } = req.params;
      const data = await readPidFileByManufacturer(manufacturer);
      res.status(200).json({
        manufacturer: data.manufacturer || manufacturer,
        name: data.name || manufacturer,
        supportedModes: data.supportedModes || [],
        pids: data.pids || [],
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Manufacturer PID file not found' });
      }
      next(error);
    }
  }

  async getPIDInfo(req, res, next) {
    try {
      const { manufacturer, pidCode } = req.params;
      const data = await readPidFileByManufacturer(manufacturer);
      const pid = (data.pids || []).find((p) => String(p.code).toUpperCase() === String(pidCode).toUpperCase());

      if (!pid) {
        return res.status(404).json({ error: 'PID not found' });
      }

      res.status(200).json({ manufacturer, pidCode, info: pid });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Manufacturer PID file not found' });
      }
      next(error);
    }
  }

  async listPIDFiles(req, res, next) {
    try {
      const entries = await fs.readdir(PIDS_DIR, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

        const filePath = path.join(PIDS_DIR, entry.name);
        const stats = await fs.stat(filePath);
        let description = '';

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          description = data.name || data.manufacturer || '';
        } catch {
          description = '';
        }

        files.push({
          name: entry.name,
          size: `${stats.size} bytes`,
          uploaded: stats.mtime.toISOString(),
          description,
        });
      }

      res.status(200).json({ files });
    } catch (error) {
      next(error);
    }
  }

  async uploadPIDFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Missing pidFile upload' });
      }

      const original = sanitizeFilename(req.file.originalname || 'pids.json');
      if (!original || !original.endsWith('.json')) {
        return res.status(400).json({ error: 'PID file must be a .json file' });
      }

      let parsed;
      try {
        parsed = JSON.parse(req.file.buffer.toString('utf-8'));
      } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      const manufacturer = parsed.manufacturer || original.replace(/\.json$/, '');
      const target = sanitizeFilename(`${manufacturer}.json`);
      if (!target) {
        return res.status(400).json({ error: 'Invalid manufacturer in PID file' });
      }

      await fs.writeFile(path.join(PIDS_DIR, target), JSON.stringify(parsed, null, 2), 'utf-8');

      res.status(200).json({
        success: true,
        message: 'PID file uploaded',
        filename: target,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePIDFile(req, res, next) {
    try {
      const safeName = sanitizeFilename(req.params.filename);
      if (!safeName || !safeName.endsWith('.json')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      await fs.unlink(path.join(PIDS_DIR, safeName));

      res.status(200).json({
        success: true,
        message: 'PID file deleted',
        filename: safeName,
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'PID file not found' });
      }
      next(error);
    }
  }
}

export default new PIDController();
