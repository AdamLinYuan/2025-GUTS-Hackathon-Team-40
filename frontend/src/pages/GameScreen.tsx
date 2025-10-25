import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';

// Game data interface
interface GameData {
  category: string;
  subcategory: string;
  character: string;
  round: number;
  totalRounds: number;
  score: number;
}

interface GameScreenProps {
  gameData: GameData;
  setGameData: (data: GameData) => void;
  onEndGame: () => void;
  onBack: () => void;
}

interface Message {
  id: string;
  type: 'clue' | 'guess' | 'system';
  text: string;
  isCorrect?: boolean;
}

export function GameScreen({ gameData, setGameData, onEndGame, onBack }: GameScreenProps) {
  const [gameSessionId, setGameSessionId] = useState<string>('');
  const [currentWord, setCurrentWord] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRoundActive, setIsRoundActive] = useState(true);
  const [cluesGiven, setCluesGiven] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize game session on first mount
  useEffect(() => {
    // Generate a simple session ID
    setGameSessionId(`session_${Date.now()}`);
  }, []); // Run once on mount

  // Initialize new round
  useEffect(() => {
    const initializeRound = () => {
      if (!gameSessionId) return;

      setIsLoading(true);
      
      // Generate a sample word based on category/subcategory
      const sampleWords = [
        'Elephant', 'Galaxy', 'Volcano', 'Symphony', 'Democracy',
        'Photosynthesis', 'Renaissance', 'Quantum', 'Algorithm', 'Ecosystem'
      ];
      const randomWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      
      setCurrentWord(randomWord);
      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          text: `Round ${gameData.round} of ${gameData.totalRounds} - Give clues to describe the word!`,
        },
      ]);
      setTimeLeft(60);
      setIsRoundActive(true);
      setCluesGiven([]);
      setRoundStartTime(Date.now());
      setIsLoading(false);
    };

    initializeRound();
  }, [gameData.round, gameData.subcategory, gameData.totalRounds, gameSessionId]);

  // Timer countdown
  useEffect(() => {
    if (!isRoundActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRoundEnd(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isRoundActive]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitClue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !isRoundActive) return;

    const clue = inputText.trim();
    setInputText(''); // Clear input after submission

    // Check if player accidentally says the word
    if (clue.toLowerCase().includes(currentWord.toLowerCase())) {
      console.error("You can't use the target word in your clue!");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: "⚠️ You can't use the target word in your clue!",
        },
      ]);
      return;
    }

    const newClues = [...cluesGiven, clue];
    setCluesGiven(newClues);

    // Add player's clue
    const clueMessage: Message = {
      id: Date.now().toString(),
      type: 'clue',
      text: clue,
    };
    setMessages((prev) => [...prev, clueMessage]);

    // Simulate AI guess after a delay
    setTimeout(() => {
      // Simple AI logic: randomly decide if the AI guesses correctly
      // In a real implementation, this would call an AI service
      const shouldGuessCorrectly = Math.random() > 0.6; // 40% chance AI guesses correctly
      
      const aiGuessText = shouldGuessCorrectly 
        ? `Is it "${currentWord}"?`
        : `Hmm... is it "${generateRandomGuess()}"?`;

      const guessMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'guess',
        text: aiGuessText,
        isCorrect: shouldGuessCorrectly,
      };
      setMessages((prev) => [...prev, guessMessage]);

      if (shouldGuessCorrectly) {
        handleRoundEnd(true);
      }
    }, 1200);
  };

  // Helper function to generate a random incorrect guess
  const generateRandomGuess = () => {
    const guesses = [
      'Computer', 'Mountain', 'Ocean', 'Building', 'Vehicle',
      'Animal', 'Planet', 'Book', 'Music', 'Science'
    ];
    return guesses[Math.floor(Math.random() * guesses.length)];
  };

  const handleRoundEnd = (aiGuessed: boolean) => {
    setIsRoundActive(false);

    const timeElapsed = Math.floor((Date.now() - roundStartTime) / 1000);
    console.log(`Round ended. Time elapsed: ${timeElapsed}s, AI guessed: ${aiGuessed}`);

    if (aiGuessed) {
      console.log(`${gameData.character} guessed "${currentWord}"! No point this round.`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: `${gameData.character} guessed correctly! The word was "${currentWord}".`,
        },
      ]);
    } else {
      const newScore = gameData.score + 1;
      setGameData({ ...gameData, score: newScore });
      console.log(`Time's up! You scored a point! The word was "${currentWord}".`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: `Time's up! You scored a point! The word was "${currentWord}".`,
        },
      ]);
    }
  };

  const handleNextRound = () => {
    if (gameData.round >= gameData.totalRounds) {
      // Complete the game
      console.log('Game completed!', { gameSessionId, finalScore: gameData.score });
      onEndGame();
    } else {
      setGameData({ ...gameData, round: gameData.round + 1 });
    }
  };

  const timePercentage = (timeLeft / 60) * 100;

  // Show loading state while fetching word
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-lg">Loading round {gameData.round}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Articulate</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {gameData.score}
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full text-sm font-medium">
                Round {gameData.round}/{gameData.totalRounds}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time Remaining
            </span>
            <span className="text-gray-900 dark:text-white font-semibold">{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        {/* Target Word */}
        <div className="p-6 mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-1 text-sm">Your Word to Describe:</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentWord}</h2>
            </div>
          </div>
        </div>

        {/* AI Character Info */}
        <div className="p-4 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold">{gameData.character}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{gameData.subcategory} Expert</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-4 mb-6 h-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="h-full overflow-y-auto space-y-3">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Controls */}
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <form onSubmit={handleSubmitClue} className="flex flex-col gap-4">
              <label htmlFor="clue-input" className="text-gray-700 dark:text-gray-300 text-center font-medium">
                Enter your clue to describe the word
              </label>
              
              <div className="flex gap-3">
                <input
                  id="clue-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your clue here..."
                  disabled={!isRoundActive}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                
                <button
                  type="submit"
                  disabled={!isRoundActive || !inputText.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </button>
              </div>

              <p className="text-gray-400 dark:text-gray-500 text-center text-xs">
                Don't use the target word in your clue!
              </p>
            </form>
          </div>

          {/* Next Round Button */}
          {!isRoundActive && (
            <div className="flex justify-center">
              <button 
                onClick={handleNextRound}
                className="px-8 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                {gameData.round >= gameData.totalRounds ? 'View Final Score' : 'Next Round'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
