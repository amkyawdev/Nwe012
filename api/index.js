const ttsHandler = require('./tts');

// Main API handler
module.exports = async (req, res) => {
  const path = req.query.path || '/';

  // Route to appropriate handler
  if (path === '/tts' || req.url === '/api/tts') {
    return ttsHandler(req, res);
  }

  // Health check
  if (path === '/health' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      service: 'AmkyawDev TTS API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  // Not found
  return res.status(404).json({ error: 'Endpoint not found' });
};
