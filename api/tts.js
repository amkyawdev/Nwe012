const { synthesizeSpeech } = require('edge-tts');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice, speed } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Voice mapping for Myanmar
    const voiceMap = {
      'thiha': 'my-MM-HsenNeural',      // Male voice
      'nayliya': 'my-MM-ThandarNeural', // Female voice
      'default': 'my-MM-ThandarNeural'
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;
    const voiceRate = speed === 'slow' ? '-20%' : speed === 'fast' ? '+20%' : '+0%';

    // Generate audio using Edge TTS
    const audioBuffer = await synthesizeSpeech(text, selectedVoice, voiceRate);

    // Return audio as base64
    const base64Audio = audioBuffer.toString('base64');
    
    return res.status(200).json({
      success: true,
      audio: `data:audio/mp3;base64,${base64Audio}`,
      voice: selectedVoice,
      charCount: text.length
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return res.status(500).json({ 
      error: 'TTS generation failed',
      message: error.message 
    });
  }
};
