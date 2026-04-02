import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    
    console.log('=== BACKEND TRANSCRIBE API ===');
    console.log('API Key present:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server configuration error: OpenAI API key not configured'
      });
    }

    // Get model and language from query params
    const { model = 'whisper-1', language = 'en' } = req.query;
    const contentType = req.headers['content-type'] as string;
    
    console.log('Query params - model:', model, 'language:', language);
    console.log('Content-Type:', contentType);

    // Get the raw audio body
    const audioBuffer = req.body as Buffer | string;
    
    if (!audioBuffer) {
      throw new Error('No audio data received');
    }

    const buffer = typeof audioBuffer === 'string' 
      ? Buffer.from(audioBuffer, 'utf-8')
      : audioBuffer;
    
    console.log('Audio buffer size:', buffer.length, 'bytes');

    // Create FormData for OpenAI
    const openAIFormData = new FormData();
    const audioFile = new File(
      [buffer],
      'audio.webm',
      { type: contentType || 'audio/webm;codecs=opus' }
    );
    
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', String(model));
    openAIFormData.append('language', String(language));

    console.log('Sending to OpenAI - file:', audioFile.size, 'bytes, model:', model, 'language:', language);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }

      console.error('OpenAI error:', response.status, errorDetail);

      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limited. Try again later.' });
      } else if (response.status === 413) {
        return res.status(413).json({ error: 'Audio file too large. Max 25MB.' });
      }

      return res.status(response.status).json({ 
        error: `OpenAI API error: ${errorDetail}` 
      });
    }

    const result = await response.json();
    console.log('✅ Transcription successful');
    return res.status(200).json(result);

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: `Server error: ${errorMessage}` 
    });
  }
}
}
