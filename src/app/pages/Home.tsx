import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { topics, categories } from "../data/topics";

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentTopic, setCurrentTopic] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopicPopup, setShowTopicPopup] = useState(false);
  const [spinningTopics, setSpinningTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");

  // Get initial random topic on mount
  useEffect(() => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setCurrentTopic(randomTopic.text);
  }, []);

  const getFilteredTopics = () => {
    if (selectedCategory === "all") {
      return topics;
    }
    return topics.filter(topic => topic.category === selectedCategory);
  };

  const handleSpin = () => {
    setIsSpinning(true);
    setIsProcessing(false);
    setShowTopicPopup(false);
    
    const filteredTopics = getFilteredTopics();
    
    // Create array of topics for continuous spinning animation
    const spinTopics: string[] = [];
    for (let i = 0; i < 50; i++) {
      const randomTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)];
      spinTopics.push(randomTopic.text);
    }
    
    // Add the final topic at the end
    const finalTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)];
    spinTopics.push(finalTopic.text);
    
    setSpinningTopics(spinTopics);
    setSelectedTopic(finalTopic.text);
    
    // After continuous spinning completes, immediately show popup
    setTimeout(() => {
      setCurrentTopic(finalTopic.text);
      setIsSpinning(false);
      setIsProcessing(false);
      setShowTopicPopup(true);
    }, 3500);
  };

  const handleTimer = () => {
    navigate("/timer", { state: { topic: currentTopic } });
  };

  const handleRecord = () => {
    navigate("/record", { state: { topic: currentTopic } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col">
      {/* Header */}
      <header className="p-8 md:p-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-amber-900">Unscripted</h1>
        <p className="text-base text-amber-700 mt-2">One topic. One minute. No script. ✨</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 gap-8 max-w-5xl mx-auto w-full">
        
        {/* Category Selection Pills */}
        <div className="w-full flex flex-wrap gap-3 justify-center">
          {categories.map((category, index) => {
            const colors = [
              { active: "bg-coral-400", inactive: "bg-coral-100 text-coral-700", style: "bg-orange-400 text-white" },
              { active: "bg-amber-400", inactive: "bg-amber-100 text-amber-700", style: "bg-amber-400 text-white" },
              { active: "bg-yellow-400", inactive: "bg-yellow-100 text-yellow-700", style: "bg-yellow-400 text-amber-900" },
              { active: "bg-rose-400", inactive: "bg-rose-100 text-rose-700", style: "bg-rose-400 text-white" },
              { active: "bg-orange-500", inactive: "bg-orange-100 text-orange-700", style: "bg-orange-500 text-white" },
              { active: "bg-red-400", inactive: "bg-red-100 text-red-700", style: "bg-red-400 text-white" },
              { active: "bg-pink-400", inactive: "bg-pink-100 text-pink-700", style: "bg-pink-400 text-white" }
            ];
            const colorScheme = colors[index % colors.length];
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 ${
                  selectedCategory === category.id
                    ? colorScheme.style + " shadow-lg"
                    : colorScheme.inactive
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Topic Display Area */}
        <div className="w-full">
          <div className="relative bg-white rounded-[2rem] p-12 md:p-16 min-h-[220px] flex items-center justify-center shadow-[0_8px_30px_rgb(251,146,60,0.15)]" style={{ overflow: 'hidden' }}>
            {isSpinning ? (
              <div className="w-full h-full absolute inset-0 flex items-center justify-center" style={{ overflow: 'hidden' }}>
                <motion.div
                  animate={{ y: [0, -100 * (spinningTopics.length - 1)] }}
                  transition={{ duration: 3.5, ease: [0.33, 1, 0.68, 1] }}
                  className="flex flex-col"
                  style={{ willChange: 'transform' }}
                >
                  {spinningTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="h-[100px] flex items-center justify-center px-8 text-center text-xl md:text-2xl text-amber-900 font-medium flex-shrink-0"
                    >
                      {topic}
                    </div>
                  ))}
                </motion.div>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full"
                />
                <p className="text-amber-800 font-medium text-lg">Finding your perfect topic... 🎯</p>
              </div>
            ) : (
              <motion.div
                key={currentTopic}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xl md:text-2xl px-4 text-amber-900 leading-relaxed font-medium"
              >
                {currentTopic || "Click spin to get a topic! 🎯"}
              </motion.div>
            )}
          </div>
        </div>

        {/* Spin Button */}
        <Button
          size="lg"
          onClick={handleSpin}
          disabled={isSpinning || isProcessing}
          className="px-24 py-8 text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full shadow-[0_8px_20px_rgb(251,146,60,0.3)] hover:shadow-[0_12px_30px_rgb(251,146,60,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          {isSpinning ? "Spinning... 🎲" : isProcessing ? "Processing... 🎲" : "Spin! 🎲"}
        </Button>

        {/* Timer and Record Buttons */}
        {currentTopic && !isSpinning && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              onClick={handleTimer}
              className="px-12 py-7 text-lg font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full shadow-[0_6px_20px_rgb(96,165,250,0.3)] hover:shadow-[0_8px_25px_rgb(96,165,250,0.4)] transition-all hover:scale-105"
            >
              ⏱️ Timer Mode
            </Button>
            <Button
              size="lg"
              onClick={handleRecord}
              className="px-12 py-7 text-lg font-semibold bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white rounded-full shadow-[0_6px_20px_rgb(251,113,133,0.3)] hover:shadow-[0_8px_25px_rgb(251,113,133,0.4)] transition-all hover:scale-105"
            >
              🎤 Record Mode
            </Button>
          </motion.div>
        )}
      </main>

      {/* Topic Popup */}
      <AnimatePresence>
        {showTopicPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setShowTopicPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[2rem] p-12 md:p-16 max-w-3xl w-full shadow-[0_20px_60px_rgb(251,146,60,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-amber-900">Your Topic! 🎉</h2>
              <p className="text-xl md:text-2xl text-center mb-10 text-amber-800 leading-relaxed font-medium">{currentTopic}</p>
              <Button
                size="lg"
                onClick={() => setShowTopicPopup(false)}
                className="w-full py-8 text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-full shadow-[0_8px_20px_rgb(251,146,60,0.3)]"
              >
                Let's Go! 🚀
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}