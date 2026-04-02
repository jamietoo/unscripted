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
        error: 'Server configuration error: OpenAI API key not configured in Vercel environment variables'
      });
    }

    const contentType = req.headers['content-type'] as string;
    console.log('Content-Type:', contentType);
    
    if (!contentType?.includes('multipart')) {
      throw new Error('Request must be multipart/form-data');
    }

    // Try to get raw body - sometimes Vercel provides this
    const rawBody = (req as any).rawBody || req.body;
    let bodyBuffer: Buffer;
    
    if (typeof rawBody === 'string') {
      bodyBuffer = Buffer.from(rawBody, 'utf-8');
    } else if (Buffer.isBuffer(rawBody)) {
      bodyBuffer = rawBody;
    } else {
      throw new Error(`Unexpected body type: ${typeof rawBody}`);
    }
    
    console.log('Body size:', bodyBuffer.length, 'bytes');

    // Forward to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': contentType,
        'Content-Length': bodyBuffer.length.toString(),
      },
      body: bodyBuffer,
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
        return res.status(401).json({ 
          error: 'Authentication failed. Invalid API key.'
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
}
