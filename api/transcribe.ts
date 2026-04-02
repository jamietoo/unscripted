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
    if (apiKey) {
      console.log('API Key starts with:', apiKey.substring(0, 15) + '...');
      console.log('API Key length:', apiKey.length);
    } else {
      console.error('ERROR: VITE_OPENAI_API_KEY not found in environment');
      console.error('Available environment keys:', Object.keys(process.env).filter(k => k.includes('OPEN') || k.includes('API') || k.includes('VITE')));
    }
    
    if (!apiKey) {
      console.error('Missing API key');
      return res.status(500).json({ 
        error: 'Server configuration error: OpenAI API key not configured in Vercel environment variables',
        hint: 'Add VITE_OPENAI_API_KEY to Project Settings > Environment Variables'
      });
    }

    const formData = req.body;

    console.log('Transcription request received, forwarding to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      let errorDetail = '';
      try {
        const error = await response.json();
        errorDetail = error.error?.message || JSON.stringify(error);
      } catch {
        errorDetail = await response.text();
      }

      console.error('OpenAI API error:', response.status, errorDetail);

      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Authentication failed with OpenAI API',
          detail: 'The API key provided is invalid or expired',
          hint: 'Check your VITE_OPENAI_API_KEY in Vercel environment variables'
        });
      } else if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limited. Please try again later.' 
        });
      } else if (response.status === 413) {
        return res.status(413).json({ 
          error: 'Audio file too large. Max 25MB.' 
        });
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
