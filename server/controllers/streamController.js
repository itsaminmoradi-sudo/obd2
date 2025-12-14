import liveDataStreamer from '../services/liveDataStreamer.js';

class StreamController {
  constructor() {
    this.sseClients = new Map(); // clientId -> { res, createdAt }
    this.pollClients = new Map(); // clientId -> { res, createdAt }
    this.clientIdCounter = 0;

    // Handle data events from streamer
    liveDataStreamer.on('data', (sample) => {
      this._broadcastToSSEClients(sample);
    });

    // Bind methods to preserve 'this' context
    this.connectSSE = this.connectSSE.bind(this);
    this.connectVanillaSSE = this.connectVanillaSSE.bind(this);
    this.pollLiveData = this.pollLiveData.bind(this);
    this.getStats = this.getStats.bind(this);
    this.startStream = this.startStream.bind(this);
    this.stopStream = this.stopStream.bind(this);
    this.getSampleBuffer = this.getSampleBuffer.bind(this);
  }

  /**
   * SSE endpoint - Server-Sent Events stream
   */
  async connectSSE(req, res) {
    try {
      const clientId = ++this.clientIdCounter;

      // SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Keep-alive comment every 10 seconds
      const keepAliveInterval = setInterval(() => {
        res.write(': keep-alive\n\n');
      }, 10000);

      // Register client
      this.sseClients.set(clientId, {
        res,
        createdAt: Date.now(),
        format: 'wrapped',
      });

      console.log(`[StreamController] SSE client ${clientId} connected, total: ${this.sseClients.size}`);

      // Handle client disconnect
      req.on('close', () => {
        clearInterval(keepAliveInterval);
        this.sseClients.delete(clientId);
        console.log(`[StreamController] SSE client ${clientId} disconnected, total: ${this.sseClients.size}`);
      });

      res.on('error', (err) => {
        console.error(`[StreamController] SSE error for client ${clientId}:`, err.message);
        clearInterval(keepAliveInterval);
        this.sseClients.delete(clientId);
      });

      // Send initial message
      res.write(`data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Connected to live stream',
      })}\n\n`);

      // Start streamer if not already running
      if (!liveDataStreamer.isStreaming) {
        await liveDataStreamer.start();
      }
    } catch (error) {
      console.error('[StreamController] SSE connection error:', error.message);
      res.status(500).json({ error: 'Failed to establish stream' });
    }
  }

  /**
   * SSE endpoint - vanilla frontend (flat payload)
   */
  async connectVanillaSSE(req, res) {
    try {
      const clientId = ++this.clientIdCounter;

      // SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const keepAliveInterval = setInterval(() => {
        res.write(': keep-alive\n\n');
      }, 10000);

      this.sseClients.set(clientId, {
        res,
        createdAt: Date.now(),
        format: 'flat',
      });

      console.log(`[StreamController] SSE(flat) client ${clientId} connected, total: ${this.sseClients.size}`);

      req.on('close', () => {
        clearInterval(keepAliveInterval);
        this.sseClients.delete(clientId);
        console.log(`[StreamController] SSE(flat) client ${clientId} disconnected, total: ${this.sseClients.size}`);
      });

      res.on('error', (err) => {
        console.error(`[StreamController] SSE(flat) error for client ${clientId}:`, err.message);
        clearInterval(keepAliveInterval);
        this.sseClients.delete(clientId);
      });

      res.write(`data: ${JSON.stringify({
        connected: true,
        timestamp: new Date().toISOString(),
      })}\n\n`);

      if (!liveDataStreamer.isStreaming) {
        await liveDataStreamer.start();
      }
    } catch (error) {
      console.error('[StreamController] SSE(flat) connection error:', error.message);
      res.status(500).json({ error: 'Failed to establish stream' });
    }
  }

  /**
   * Long-poll endpoint - for browsers without SSE support
   */
  async pollLiveData(req, res, next) {
    try {
      const clientId = ++this.clientIdCounter;
      const timeout = parseInt(req.query.timeout) || 30000; // 30 second timeout

      // Register poll client
      this.pollClients.set(clientId, {
        res,
        createdAt: Date.now(),
      });

      console.log(`[StreamController] Poll client ${clientId} connected, total: ${this.pollClients.size}`);

      // Check if data is already available
      const latestSample = liveDataStreamer.getLatestSample();
      if (latestSample && Object.keys(latestSample).length > 0) {
        this.pollClients.delete(clientId);
        return res.status(200).json({
          type: 'data',
          sample: latestSample,
        });
      }

      // Wait for data with timeout
      const pollTimeout = setTimeout(() => {
        if (this.pollClients.has(clientId)) {
          this.pollClients.delete(clientId);
          res.status(200).json({
            type: 'timeout',
            message: 'No data available within timeout period',
          });
        }
      }, timeout);

      // Listener for new data
      const onData = (sample) => {
        if (this.pollClients.has(clientId)) {
          clearTimeout(pollTimeout);
          this.pollClients.delete(clientId);
          res.status(200).json({
            type: 'data',
            sample,
          });
        }
      };

      liveDataStreamer.on('data', onData);

      // Handle client disconnect
      req.on('close', () => {
        clearTimeout(pollTimeout);
        liveDataStreamer.removeListener('data', onData);
        this.pollClients.delete(clientId);
        console.log(`[StreamController] Poll client ${clientId} disconnected, total: ${this.pollClients.size}`);
      });

      // Start streamer if not already running
      if (!liveDataStreamer.isStreaming) {
        await liveDataStreamer.start();
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current streaming stats
   */
  getStats(req, res, next) {
    try {
      const stats = liveDataStreamer.getStats();
      res.status(200).json({
        ...stats,
        sseClients: this.sseClients.size,
        pollClients: this.pollClients.size,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start streaming
   */
  async startStream(req, res, next) {
    try {
      const { manufacturer } = req.body;

      if (manufacturer) {
        liveDataStreamer.manufacturer = manufacturer;
      }

      const started = await liveDataStreamer.start();

      if (started) {
        res.status(200).json({
          message: 'Stream started',
          stats: liveDataStreamer.getStats(),
        });
      } else {
        res.status(400).json({
          error: 'Failed to start stream',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stop streaming
   */
  stopStream(req, res, next) {
    try {
      liveDataStreamer.stop();

      res.status(200).json({
        message: 'Stream stopped',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Broadcast data to all SSE clients
   */
  _flattenSample(sample) {
    const categories = sample?.categories || {};

    const getPidValue = (pid) => {
      for (const categoryData of Object.values(categories)) {
        if (!categoryData) continue;
        const entry = categoryData[pid];
        if (entry && entry.value !== undefined && entry.value !== null) {
          return entry.value;
        }
      }
      return null;
    };

    return {
      timestamp: sample.timestamp,
      rpm: getPidValue('010C'),
      speed: getPidValue('010D') ?? getPidValue('0130'),
      temp: getPidValue('0105'),
      fuel: getPidValue('012E'),
      pressure: getPidValue('010B') ?? getPidValue('0123'),
      load: getPidValue('0131') ?? getPidValue('0104'),
      maf: getPidValue('0110') ?? getPidValue('010B'),
      throttle: getPidValue('0111'),
      voltage: getPidValue('0142'),
      timing: getPidValue('010E'),
    };
  }

  _broadcastToSSEClients(sample) {
    for (const [clientId, client] of this.sseClients.entries()) {
      try {
        const payload = client.format === 'flat'
          ? this._flattenSample(sample)
          : { type: 'data', sample };

        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (error) {
        console.error(`[StreamController] Error sending to SSE client ${clientId}:`, error.message);
        this.sseClients.delete(clientId);
      }
    }
  }

  /**
   * Get sample buffer
   */
  getSampleBuffer(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const buffer = liveDataStreamer.getSampleBuffer();
      const limitedBuffer = buffer.slice(-limit);

      res.status(200).json({
        count: limitedBuffer.length,
        samples: limitedBuffer,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StreamController();
