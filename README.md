# AmkyawDev TTS - Myanmar Text-to-Speech

🎙️ AI Voice Studio for Myanmar language with natural-sounding voices.

## Features

- **Voice Studio** - Convert TTS text to speech
- **Two Myanmar Voices** - သီဟ (Male) and နီလာ (Female)
- **Usage Limits** - 5,000 character limit per session
- **Modern UI** - Smooth animations and transitions
- **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js with Edge TTS
- **Deployment**: Vercel

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Server runs on http://localhost:3000
```

## Deploy to Vercel

### Option 1: One-click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amkyawdev/Nwe012)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 3: GitHub Push

1. Push to GitHub
2. Connect repo to Vercel
3. Deploy!

## Environment Variables (Optional)

No API keys required! Edge TTS uses Microsoft's free TTS service.

For AI features, add in Vercel Dashboard:
- `GEMINI_API_KEY` - Google Gemini API (optional)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tts` | POST | Generate TTS audio |
| `/api/health` | GET | Health check |

### TTS Request

```json
POST /api/tts
{
  "text": "မင်္ဂလာပါ",
  "voice": "thiha",
  "speed": "normal"
}
```

### TTS Response

```json
{
  "success": true,
  "audio": "data:audio/mp3;base64,...",
  "voice": "my-MM-HsenNeural",
  "charCount": 10
}
```

## License

© 2024 Aung Myo Kyaw. All rights reserved.