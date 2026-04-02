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

    console.log('Transcription request received, forwarding to OpenAI...');
    console.log('Request Content-Type:', req.headers['content-type']);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', typeof req.body === 'object' ? Object.keys(req.body).slice(0, 5) : 'N/A');

    // For Vercel, req.body is already a parsed object/buffer
    // We need to reconstruct the multipart FormData or convert to Buffer
    let bodyToSend: any = req.body;
    
    // If body is a string or Buffer, send as-is
    // If it's an object (which shouldn't happen with multipart), log it
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      console.log('❌ Request body is an object, not a Buffer. This may cause issues.');
      console.log('Body sample:', JSON.stringify(req.body).substring(0, 200));
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Send the same Content-Type as the incoming request
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
      },
      body: bodyToSend,
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
