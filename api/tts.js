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
    let finalMimeType = 'audio/wav';
    let finalAudioBase64 = audioBase64;

    if (audioMimeType.includes('mp3') || audioMimeType.includes('mpeg')) {
      format = 'mp3';
      finalMimeType = 'audio/mpeg';
    } else if (audioMimeType.includes('webm')) {
      format = 'webm';
      finalMimeType = 'audio/webm';
    } else if (audioMimeType.includes('L16') || audioMimeType.includes('pcm')) {
      // Convert PCM to WAV with proper headers
      format = 'wav';
      finalMimeType = 'audio/wav';
      finalAudioBase64 = convertPCMToWav(audioBase64, 24000, 1, 16);
    }

    return res.status(200).json({
      success: true,
      audio: `data:${finalMimeType};base64,${finalAudioBase64}`,
      format: format,
      mimeType: finalMimeType,
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

// Helper function to convert PCM to WAV format
function convertPCMToWav(pcmBase64, sampleRate, numChannels, bitsPerSample) {
  // Decode base64 to buffer
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const dataSize = pcmBuffer.length;
  const fileSize = 44 + dataSize;

  // Create WAV header
  const wavHeader = Buffer.alloc(44);
  
  // RIFF chunk descriptor
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(fileSize - 8, 4);  // File size - 8
  wavHeader.write('WAVE', 8);
  
  // fmt sub-chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);           // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20);             // AudioFormat (1 = PCM)
  wavHeader.writeUInt16LE(numChannels, 22);    // NumChannels
  wavHeader.writeUInt32LE(sampleRate, 24);     // SampleRate
  wavHeader.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);  // ByteRate
  wavHeader.writeUInt16LE(numChannels * bitsPerSample / 8, 32);  // BlockAlign
  wavHeader.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
  
  // data sub-chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);     // Subchunk2Size

  // Combine header and PCM data
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  
  return wavBuffer.toString('base64');
}
