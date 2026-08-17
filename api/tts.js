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

    // Voice mapping
    const voiceMap = {
      'thiha': { langCode: 'my-MM', name: 'my-MM-Standard-A', gender: 'MALE' },
      'nayliya': { langCode: 'my-MM', name: 'my-MM-Standard-A', gender: 'FEMALE' },
      'default': { langCode: 'my-MM', name: 'my-MM-Standard-A', gender: 'FEMALE' }
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;
    const audioFormat = format === 'wav' ? 'LINEAR16' : 'MP3';

    // Get API key from environment or request body
    const apiKey = process.env.GEMINI_API_KEY || req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key required',
        message: 'Please provide your Gemini/AI Studio API Key'
      });
    }

    // Use Google Cloud TTS API directly
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    const ttsRequest = {
      input: { text: text },
      voice: {
        languageCode: selectedVoice.langCode,
        name: selectedVoice.name,
      },
      audioConfig: {
        audioEncoding: audioFormat,
        speakingRate: 0.95,
        pitch: 0,
        sampleRateHertz: 24000,
      },
    };

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ttsRequest)
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      throw new Error(errorData.error?.message || 'TTS API request failed');
    }

    const ttsData = await ttsResponse.json();
    const mimeType = audioFormat === 'MP3' ? 'audio/mpeg' : 'audio/wav';

    return res.status(200).json({
      success: true,
      audio: `data:${mimeType};base64,${ttsData.audioContent}`,
      format: audioFormat === 'MP3' ? 'mp3' : 'wav',
      voice: selectedVoice.name,
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
