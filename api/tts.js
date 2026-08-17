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
    const { text, voice, format } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get API key from request body
    const apiKey = req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key required',
        message: 'Please provide your OpenAI API Key'
      });
    }

    // Voice mapping for OpenAI TTS
    const voiceMap = {
      'thiha': 'alloy',      // Male voice
      'nayliya': 'nova',     // Female voice
      'default': 'alloy'
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;
    const audioFormat = format === 'wav' ? 'wav' : 'mp3';

    // Use OpenAI TTS API
    const ttsUrl = 'https://api.openai.com/v1/audio/speech';

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: selectedVoice,
        input: text,
        response_format: audioFormat
      })
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      throw new Error(errorData.error?.message || 'TTS API request failed');
    }

    // Get audio buffer
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const mimeType = audioFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';

    return res.status(200).json({
      success: true,
      audio: `data:${mimeType};base64,${base64Audio}`,
      format: audioFormat,
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
