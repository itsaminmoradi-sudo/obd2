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
  _broadcastToSSEClients(sample) {
    const message = {
      type: 'data',
      sample,
    };

    const data = `data: ${JSON.stringify(message)}\n\n`;

    for (const [clientId, client] of this.sseClients.entries()) {
      try {
        client.res.write(data);
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
