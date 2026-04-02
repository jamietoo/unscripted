import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function TimerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const topic = location.state?.topic || "No topic selected";
  
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
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
    // Create a simple beep sound using Web Audio API
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

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(60);
    setIsRunning(false);
    setIsComplete(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-900">⏱️ Timer Mode</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 gap-12 max-w-4xl mx-auto w-full">
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
          <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-white to-orange-50 border-8 border-orange-200 flex items-center justify-center shadow-[0_8px_30px_rgb(251,146,60,0.2)]">
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

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={handleStartPause}
            disabled={isComplete}
            className="px-16 py-7 text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full shadow-[0_8px_20px_rgb(251,146,60,0.3)] disabled:opacity-50 hover:scale-105 transition-all"
          >
            {isRunning ? "⏸️ Pause" : isComplete ? "✅ Complete!" : "▶️ Start"}
          </Button>
          <Button
            size="lg"
            onClick={handleReset}
            className="px-16 py-7 text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-full shadow-[0_6px_20px_rgb(251,113,133,0.3)] hover:scale-105 transition-all"
          >
            🔄 Reset
          </Button>
        </div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-center flex flex-col gap-6 bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(251,146,60,0.15)]"
          >
            <p className="text-3xl font-bold text-orange-400">Time's up! You did amazing! 🎉</p>
            <Button 
              onClick={() => navigate("/")} 
              size="lg"
              className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full px-12 py-7 text-lg font-bold shadow-[0_6px_20px_rgb(251,146,60,0.3)] hover:scale-105 transition-all"
            >
              🏠 Back to Home
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}