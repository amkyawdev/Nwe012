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
    const { text, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get API key from request body
    const apiKey = req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key required',
        message: 'Please provide your Gemini API Key'
      });
    }

    // Voice mapping for Gemini TTS
    const voiceMap = {
      'thiha': 'Puck',        // Male voice
      'nayliya': 'Charon',    // Female voice
      'default': 'Puck'
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;

    // Use Gemini TTS API with dedicated TTS model
    const model = 'gemini-2.5-flash-preview-tts'; // Gemini TTS model
    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const ttsRequest = {
      contents: [{
        parts: [{
          text: text
        }]
      }],
      generationConfig: {
        responseModalities: ["AUDIO"]
      }
    };

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ttsRequest)
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      throw new Error(errorData.error?.message || 'TTS API request failed');
    }

    const ttsData = await ttsResponse.json();
    
    // Extract audio from response - handle nested structure
    const inlineData = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    
    if (!inlineData?.data) {
      // Check if there's text content instead of audio
      const textContent = ttsData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textContent) {
        throw new Error('Gemini returned text instead of audio. Check your API key and try again.');
      }
      throw new Error('No audio generated from Gemini API');
    }

    // Get the actual audio format from the response
    const audioMimeType = inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000';
    const audioBase64 = inlineData.data;

    // Determine format from mimeType
    let format = 'wav';
    if (audioMimeType.includes('mp3') || audioMimeType.includes('mpeg')) {
      format = 'mp3';
    } else if (audioMimeType.includes('webm')) {
      format = 'webm';
    }

    return res.status(200).json({
      success: true,
      audio: `data:${audioMimeType};base64,${audioBase64}`,
      format: format,
      mimeType: audioMimeType,
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
