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
      console.error('Missing API key');
      return res.status(500).json({ 
        error: 'Server configuration error: OpenAI API key not configured in Vercel environment variables',
        hint: 'Add VITE_OPENAI_API_KEY to Project Settings > Environment Variables'
      });
    }

    const contentType = req.headers['content-type'] as string;
    console.log('Request Content-Type:', contentType);
    
    if (!contentType?.includes('multipart')) {
      throw new Error('Request must be multipart/form-data');
    }

    // Get the raw body as buffer
    let bodyBuffer = req.body;
    if (typeof bodyBuffer === 'string') {
      bodyBuffer = Buffer.from(bodyBuffer, 'utf-8');
    }
    
    console.log('Body received - type:', typeof bodyBuffer, 'is buffer:', Buffer.isBuffer(bodyBuffer), 'size:', bodyBuffer?.length);

    // Forward the exact same request to OpenAI with the exact same Content-Type
    // This preserves the multipart boundaries
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': contentType, // Critical: include the boundary!
      },
      body: bodyBuffer,
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
