import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { ArrowLeft, Home, Mic, Square, AlertCircle } from "lucide-react";

export default function RecordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topic = location.state?.topic || "No topic selected";
  
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Create stable audio URL when audioBlob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setAudioUrl("");
  }, [audioBlob]);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // Check if the browser supports the Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setHasPermission(permissionStatus.state === 'granted');
        
        permissionStatus.onchange = () => {
          setHasPermission(permissionStatus.state === 'granted');
          if (permissionStatus.state === 'granted') {
            setPermissionError(null);
          }
        };
      }
    } catch (error) {
      // If Permissions API is not supported, we'll just try to access the microphone
      console.log("Permissions API not supported, will request on record");
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            stopRecording();
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const playAlarm = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const startRecording = async () => {
    setPermissionError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRunning(true);
      setHasPermission(true);
    } catch (error: any) {
      // Don't log to console - we're handling it gracefully in the UI
      
      let errorMessage = "Could not access microphone. ";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Please allow microphone access in your browser settings and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage += "Microphone is already in use by another application.";
      } else {
        errorMessage += "Please check your browser permissions and try again.";
      }
      
      setPermissionError(errorMessage);
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setTimeLeft(60);
    setIsRunning(false);
    setIsRecording(false);
    setIsComplete(false);
    setAudioBlob(null);
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speaking-practice-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-900">🎤 Record Mode</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 gap-10 max-w-4xl mx-auto w-full">
        {/* Topic Display */}
        <div className="w-full bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(251,146,60,0.15)]">
          <p className="text-lg md:text-xl text-amber-800 leading-relaxed font-medium">{topic}</p>
        </div>

        {/* Timer Display */}
        <motion.div
          animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
          className="relative"
        >
          <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-white to-orange-50 border-8 border-orange-200 flex items-center justify-center shadow-[0_8px_30px_rgb(251,146,60,0.2)]">
            <motion.span
              className={`text-7xl md:text-8xl font-bold tracking-tight ${
                timeLeft <= 10 && timeLeft > 0 ? "text-red-500" : "text-amber-900"
              } ${isComplete ? "text-orange-400" : ""}`}
              animate={timeLeft <= 10 && timeLeft > 0 ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatTime(timeLeft)}
            </motion.span>
          </div>
        </motion.div>

        {/* Recording Button */}
        <div className="flex flex-col items-center gap-6">
          {/* Permission Error Message */}
          <AnimatePresence>
            {permissionError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border-4 border-red-200 rounded-[2rem] p-6 max-w-md flex gap-3 items-start shadow-[0_6px_20px_rgb(239,68,68,0.2)]"
              >
                <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{permissionError}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Look for a microphone icon 🎤 in your browser's address bar to grant permission.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isComplete && (
            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all hover:scale-110 ${
                isRecording
                  ? "bg-gradient-to-br from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 animate-pulse"
                  : "bg-gradient-to-br from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
              }`}
            >
              {isRecording ? (
                <Square className="size-14" fill="white" />
              ) : (
                <Mic className="size-14 text-white" />
              )}
            </Button>
          )}
          <p className="text-base font-medium text-amber-800">
            {isRecording
              ? "🔴 Recording... Click to stop"
              : isComplete
              ? "✅ Recording saved"
              : "Click the button to start recording"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={handleReset}
            className="px-16 py-7 text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full shadow-[0_6px_20px_rgb(96,165,250,0.3)] hover:scale-105 transition-all"
          >
            🔄 Reset
          </Button>
        </div>

        {/* Completion Message */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-center flex flex-col gap-8 w-full bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(251,146,60,0.15)]"
          >
            <p className="text-3xl font-bold text-orange-400">Time's up! You did amazing! 🎉</p>
            {audioBlob && (
              <div className="flex flex-col gap-6 items-center">
                <audio controls src={audioUrl} className="w-full max-w-md rounded-[2rem]" />
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={downloadRecording}
                    size="lg"
                    className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full px-10 py-6 text-lg font-bold shadow-[0_6px_20px_rgb(96,165,250,0.3)] hover:scale-105 transition-all"
                  >
                    💾 Download Recording
                  </Button>
                  <Button 
                    onClick={() => navigate("/results", { state: { audioBlob } })} 
                    size="lg"
                    className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full px-10 py-6 text-lg font-bold shadow-[0_6px_20px_rgb(251,146,60,0.3)] hover:scale-105 transition-all"
                  >
                    📝 View Transcription
                  </Button>
                </div>
              </div>
            )}
            <Button 
              onClick={() => navigate("/")}
              size="lg"
              className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-full px-12 py-7 text-lg font-bold shadow-[0_6px_20px_rgb(251,113,133,0.3)] hover:scale-105 transition-all"
            >
              🏠 Back to Home
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}