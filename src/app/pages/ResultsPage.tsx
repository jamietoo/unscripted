import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { ArrowLeft, Home, Copy, Check, AlertCircle } from "lucide-react";

// Transcribe audio using OpenAI Whisper API
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.");
  }

  console.log("Starting transcription with audio blob size:", audioBlob.size, "type:", audioBlob.type);

  // If blob is WebM, try to convert or send as-is
  // Whisper API supports: mp4, mpeg, mpga, m4a, wav, webm
  let fileWithExt = "audio.webm";
  if (audioBlob.type.includes("mp4")) {
    fileWithExt = "audio.mp4";
  } else if (audioBlob.type.includes("wav")) {
    fileWithExt = "audio.wav";
  } else if (audioBlob.type.includes("opus")) {
    fileWithExt = "audio.opus";
  }

  const formData = new FormData();
  formData.append("file", audioBlob, fileWithExt);
  formData.append("model", "whisper-1");
  formData.append("language", "en");

  console.log("Sending to OpenAI API with file extension:", fileWithExt);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      let errorDetail = "";
      try {
        const error = await response.json();
        errorDetail = error.error?.message || JSON.stringify(error);
      } catch {
        errorDetail = await response.text();
      }
      
      console.error("API error response:", errorDetail);
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Check your OpenAI API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limited. Please wait a moment and try again.");
      } else if (response.status === 413) {
        throw new Error("Audio file too large. Please record a shorter duration.");
      } else {
        throw new Error(`API Error (${response.status}): ${errorDetail}`);
      }
    }

    const result = await response.json();
    console.log("Transcription result:", result);
    
    if (!result.text) {
      throw new Error("No transcription received from API. The audio may be unclear or too short.");
    }
    return result.text;
  } catch (error) {
    console.error("Transcription error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error during transcription. Please check your internet connection.");
  }
}

// Helper function to highlight text
function highlightText(text: string) {
  // Extended list of filler words and verbal tics
  const fillerWords = [
    'you know', 'i mean', 'kind of', 'sort of', 'a bit', 'a little bit',
    'uhh', 'hmm', 'umm', 'um', 'uh', 'ah', 'er', 'erm', 'err', 'huh',
    'hm', 'mm', 'mmm', 'duh', 'yeah', 'yep', 'nope',
    'basically', 'actually', 'literally', 'honestly', 'seriously', 'truly',
    'like', 'so', 'well', 'right', 'okay', 'alright', 'surely'
  ];
  
  // Remove duplicates and sort by length (longest first) for priority matching
  const uniqueFillers = Array.from(new Set(fillerWords)).sort((a, b) => b.length - a.length);
  
  // Create flexible regex pattern that handles the filler words
  // Allow for multiple repeated letters like "uhhhh" or "hmmm"
  const expandedFillers = uniqueFillers.flatMap(word => {
    // For single vowel sounds like "uh", "ah", "um", create variations
    if (word.match(/^[aeiou]+$/i) || word === 'uh' || word === 'um' || word === 'eh') {
      return [word, word + '+', word.charAt(0) + '+'];
    }
    return [word];
  });
  
  const fillerPattern = expandedFillers.map(f => f.replace(/\s+/g, '\\s+').replace(/\+/g, '+')).join('|');
  const fillerRegex = new RegExp(`\\b(${fillerPattern})\\b`, 'gi');
  
  // Find all filler word positions
  const fillerMatches = new Map<number, number>();
  let match;
  const fillerRegexCopy = new RegExp(fillerRegex.source, fillerRegex.flags);
  while ((match = fillerRegexCopy.exec(text)) !== null) {
    fillerMatches.set(match.index, match.index + match[0].length);
  }
  
  // Detect repeated phrases - split into sentences and find repeating n-grams
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  // Look for repeated phrases (2-5 word chunks)
  const phraseCounts = new Map<string, number>();
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Generate 2-word to 5-word phrases
    for (let phraseLength = 2; phraseLength <= Math.min(5, words.length); phraseLength++) {
      for (let i = 0; i <= words.length - phraseLength; i++) {
        const phrase = words.slice(i, i + phraseLength).join(' ');
        // Only track phrases that are meaningful (not too common single words)
        if (phrase.split(' ').every(w => w.length > 2)) {
          phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
        }
      }
    }
  }
  
  // Get repeated phrases that appear at least 2 times, sorted by length
  const repeatedPhrases = Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([phrase, _]) => phrase)
    .sort((a, b) => b.length - a.length); // Match longest first
  
  // Find all repeated phrase positions
  const repeatedMatches = new Map<number, number>();
  for (const phrase of repeatedPhrases) {
    // Use flexible matching to account for punctuation
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const phraseRegex = new RegExp(escapedPhrase, 'gi');
    let phraseMatchResult;
    while ((phraseMatchResult = phraseRegex.exec(text)) !== null) {
      repeatedMatches.set(phraseMatchResult.index, phraseMatchResult.index + phraseMatchResult[0].length);
    }
  }
  
  // Build segments, prioritizing longer matches
  const segments: Array<{ text: string; type: 'normal' | 'filler' | 'repeated' }> = [];
  let i = 0;
  
  while (i < text.length) {
    // Check for repeated phrases first (longer matches take priority)
    let isRepeated = false;
    let repeatedEnd = 0;
    
    for (const [start, end] of repeatedMatches.entries()) {
      if (start === i) {
        isRepeated = true;
        repeatedEnd = end;
        break;
      }
    }
    
    // Then check for filler words
    const isFiller = fillerMatches.has(i);
    
    if (isRepeated) {
      segments.push({ text: text.slice(i, repeatedEnd), type: 'repeated' });
      i = repeatedEnd;
    } else if (isFiller) {
      const end = fillerMatches.get(i)!;
      segments.push({ text: text.slice(i, end), type: 'filler' });
      i = end;
    } else {
      // Collect normal text until next match
      let normalEnd = i + 1;
      while (normalEnd < text.length && !fillerMatches.has(normalEnd) && !repeatedMatches.has(normalEnd)) {
        normalEnd++;
      }
      segments.push({ text: text.slice(i, normalEnd), type: 'normal' });
      i = normalEnd;
    }
  }
  
  return segments;
}


export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
  const audioBlob = location.state?.audioBlob as Blob | undefined;
  
  // Transcribe audio when component mounts
  useEffect(() => {
    if (!audioBlob) {
      setError("No audio file provided. Please record a new session.");
      setIsLoading(false);
      return;
    }

    const doTranscription = async () => {
      try {
        setIsLoading(true);
        setRetrying(false);
        setError(null);
        const text = await transcribeAudio(audioBlob);
        setTranscription(text);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to transcribe audio. Please try again.";
        setError(errorMessage);
        setTranscription("");
      } finally {
        setIsLoading(false);
      }
    };

    doTranscription();
  }, [audioBlob, retrying]);
  
  const handleRetry = () => {
    setRetrying(true);
  };
  
  const segments = transcription ? highlightText(transcription) : [];
  
  const handleCopyText = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      {/* Header */}
      <header className="p-8 md:p-10 flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="p-3 hover:bg-orange-100 rounded-full transition-all"
        >
          <ArrowLeft className="size-6 text-amber-800" />
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="p-3 hover:bg-orange-100 rounded-full transition-all"
        >
          <Home className="size-6 text-amber-800" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-900">📝 Your Transcribed Speech</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full flex flex-col gap-8">
        {/* Transcription Box */}
        <div 
          ref={textRef}
          className="flex-1 bg-white rounded-[2rem] p-8 md:p-10 overflow-y-auto shadow-[0_8px_30px_rgb(251,146,60,0.15)] min-h-[400px] max-h-[600px]"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
              />
              <p className="text-lg text-amber-800 font-medium">🎤 Transcribing your speech...</p>
              <p className="text-sm text-amber-600">This may take a moment depending on recording length.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-lg text-red-800 font-medium">Transcription Failed</p>
              <p className="text-sm text-red-600 text-center max-w-sm">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full px-8 py-3 font-semibold"
                >
                  🔄 Retry
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full px-8 py-3 font-semibold"
                >
                  🏠 Back Home
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-base md:text-lg leading-relaxed text-amber-900">
              {segments.map((segment, index) => {
                if (segment.type === 'filler') {
                  return (
                    <span key={index} className="bg-yellow-200 px-1.5 py-0.5 rounded-lg font-medium">
                      {segment.text}
                    </span>
                  );
                } else if (segment.type === 'repeated') {
                  return (
                    <span key={index} className="bg-orange-200 px-1.5 py-0.5 rounded-lg font-medium">
                      {segment.text}
                    </span>
                  );
                }
                return <span key={index}>{segment.text}</span>;
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        {!isLoading && !error && (
          <div className="flex flex-wrap gap-6 justify-center text-sm bg-white rounded-[2rem] p-6 shadow-[0_6px_20px_rgb(251,146,60,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-200 rounded-xl shadow-sm"></div>
              <span className="text-amber-800 font-medium">Filler words (um, uh, like, you know)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-200 rounded-xl shadow-sm"></div>
              <span className="text-amber-800 font-medium">Repeated phrases</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && !error && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              onClick={handleCopyText}
              disabled={!transcription}
              className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full px-10 py-7 text-lg font-bold shadow-[0_6px_20px_rgb(96,165,250,0.3)] hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="size-5" />
                  Copied! ✨
                </>
              ) : (
                <>
                  <Copy className="size-5" />
                  📋 Copy Text
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full px-12 py-7 text-lg font-bold shadow-[0_6px_20px_rgb(251,146,60,0.3)] hover:scale-105 transition-all"
            >
              🎯 Practice Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}