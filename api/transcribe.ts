import { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to read request body in Vercel
async function getRequestBody(req: VercelRequest): Promise<Buffer> {
  // Vercel sometimes provides rawBody
  if ((req as any).rawBody) {
    const body = (req as any).rawBody;
    return typeof body === 'string' ? Buffer.from(body) : body;
  }

  // Otherwise, read from the req stream
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
    
    // Set timeout
    setTimeout(() => {
      reject(new Error('Request body read timeout'));
    }, 30000);
  });
}

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
    const { model = 'gpt-4o-mini-transcribe', language = 'en' } = req.query;
    const contentType = req.headers['content-type'] as string;
    const requestedModel = String(model);
    const modelCandidates = Array.from(new Set([requestedModel, 'whisper-1']));
    const transcriptionPrompt =
      'Transcribe verbatim. Preserve filler words, hesitations, false starts, repeated words, and spoken tics like uhh, umm, like, err, and similar sounds. Do not clean up, summarize, or omit anything the speaker said.';
    
    console.log('Query params - model:', model, 'language:', language);
    console.log('Content-Type:', contentType);

    // Read the request body
    console.log('Reading request body...');
    const audioBuffer = await getRequestBody(req);
    
    console.log('Audio buffer received - size:', audioBuffer.length, 'bytes');

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('No audio data received');
    }

    const audioFile = new File(
      [audioBuffer],
      'audio.webm',
      { type: contentType?.split(';')[0] || 'audio/webm' }
    );
    let finalErrorStatus = 500;
    let finalErrorDetail = 'Unknown OpenAI transcription error';

    for (const currentModel of modelCandidates) {
      const openAIFormData = new FormData();
      openAIFormData.append('file', audioFile);
      openAIFormData.append('model', currentModel);
      openAIFormData.append('language', String(language));
      openAIFormData.append('prompt', transcriptionPrompt);

      console.log('Sending to OpenAI - file:', audioFile.size, 'bytes, model:', currentModel, 'language:', language);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: openAIFormData,
      });

      console.log('OpenAI response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Transcription successful');
        return res.status(200).json(result);
      }

      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }

      console.error('OpenAI error:', response.status, errorDetail);
      finalErrorStatus = response.status;
      finalErrorDetail = errorDetail;

      const canFallback = currentModel !== modelCandidates[modelCandidates.length - 1]
        && (response.status === 400 || response.status === 404 || response.status === 422);

      if (!canFallback) {
        break;
      }

      console.log('Falling back to whisper-1 after model error.');
    }

    if (finalErrorStatus === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    } else if (finalErrorStatus === 429) {
      return res.status(429).json({ error: 'Rate limited. Try again later.' });
    } else if (finalErrorStatus === 413) {
      return res.status(413).json({ error: 'Audio file too large. Max 25MB.' });
    }

    return res.status(finalErrorStatus).json({ 
      error: `OpenAI API error: ${finalErrorDetail}` 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: `Server error: ${errorMessage}` 
    });
  }
}
