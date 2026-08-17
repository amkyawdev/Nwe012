const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

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

    // Voice mapping for Google Cloud TTS
    const voiceMap = {
      'thiha': { name: 'my-MM-Standard-A', lang: 'my-MM', ssmlGender: 'MALE' },
      'nayliya': { name: 'my-MM-Standard-A', lang: 'my-MM', ssmlGender: 'FEMALE' },
      'default': { name: 'my-MM-Standard-A', lang: 'my-MM', ssmlGender: 'FEMALE' }
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;
    const audioFormat = format === 'wav' ? 'LINEAR16' : 'MP3';

    // Check for API key
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key required',
        message: 'Please add GOOGLE_TTS_API_KEY in Vercel Environment Variables'
      });
    }

    // Create client with API key
    const client = new TextToSpeechClient({ apiKey });

    // Construct the request
    const request = {
      input: { text: text },
      voice: {
        languageCode: selectedVoice.lang,
        name: selectedVoice.name,
        ssmlGender: selectedVoice.ssmlGender,
      },
      audioConfig: {
        audioEncoding: audioFormat,
        speakingRate: 0.9,
        pitch: 0,
      },
    };

    // Generate audio
    const [response] = await client.synthesizeSpeech(request);

    // Convert buffer to base64
    const audioContent = response.audioContent.toString('base64');
    const mimeType = audioFormat === 'MP3' ? 'audio/mp3' : 'audio/wav';

    return res.status(200).json({
      success: true,
      audio: `data:${mimeType};base64,${audioContent}`,
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
