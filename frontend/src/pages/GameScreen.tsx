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

// Helper function to get a random word based on subcategory
function getRandomWord(subcategory: string): string {
  const wordLists: Record<string, string[]> = {
    // Sports
    'NBA': ['Basketball', 'Lakers', 'Jordan', 'Lebron', 'Dunk'],
    'NFL': ['Football', 'Touchdown', 'Quarterback', 'Patriots', 'Brady'],
    'Soccer': ['Goal', 'Messi', 'Ronaldo', 'WorldCup', 'Penalty'],
    // Politics
    'US Politics': ['President', 'Congress', 'Senate', 'Election', 'Democracy'],
    'World Leaders': ['Prime Minister', 'Chancellor', 'President', 'Diplomat', 'Summit'],
    // Computer Science
    'Programming': ['Python', 'JavaScript', 'Algorithm', 'Function', 'Variable'],
    'Algorithms': ['Sorting', 'Recursion', 'Binary Search', 'Dynamic Programming', 'Graph'],
    // Add more as needed
  };
  
  const words = wordLists[subcategory] || ['Example', 'Word', 'Test', 'Sample', 'Demo'];
  return words[Math.floor(Math.random() * words.length)];
}

// Helper function to generate AI guesses
function generateAIGuess(targetWord: string, clues: string[]): string {
  // Simple mock AI - in production this would call your backend
  const possibleGuesses = [
    targetWord,
    'Random guess',
    'Another try',
    'Close one',
    'Almost there'
  ];
  
  // 30% chance to guess correctly after 3 clues
  if (clues.length >= 3 && Math.random() < 0.3) {
    return targetWord;
  }
  
  return possibleGuesses[Math.floor(Math.random() * possibleGuesses.length)];
}

interface Message {
  id: string;
  type: 'clue' | 'guess' | 'system';
  text: string;
  isCorrect?: boolean;
}

export function GameScreen({ gameData, setGameData, onEndGame, onBack }: GameScreenProps) {
  const [currentWord, setCurrentWord] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRoundActive, setIsRoundActive] = useState(true);
  const [cluesGiven, setCluesGiven] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize new round
  useEffect(() => {
    const word = getRandomWord(gameData.subcategory);
    setCurrentWord(word);
    setMessages([
      {
        id: Date.now().toString(),
        type: 'system',
        text: `Round ${gameData.round} of ${gameData.totalRounds} - Give voice clues to describe the word!`,
      },
    ]);
    setTimeLeft(60);
    setIsRoundActive(true);
    setCluesGiven([]);
  }, [gameData.round, gameData.subcategory, gameData.totalRounds]);

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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingText('');
    // Show toast notification if available
    console.info('Recording started... Speak your clue!');

    // Simulate recording for 3 seconds
    setTimeout(() => {
      handleStopRecording();
    }, 3000);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    
    // Simulate transcribed text
    const simulatedClues = [
      'It\'s a sport played with a ball',
      'This person is very famous',
      'It happens on a court or field',
      'Teams compete against each other',
      'People watch it on TV',
      'It requires athletic ability',
    ];
    
    const randomClue = simulatedClues[Math.floor(Math.random() * simulatedClues.length)];
    setRecordingText(randomClue);
    
    // Process the clue
    handleSendClue(randomClue);
  };

  const handleSendClue = (clue: string) => {
    if (!clue.trim() || !isRoundActive) return;

    // Check if player accidentally says the word
    if (clue.toLowerCase().includes(currentWord.toLowerCase())) {
      console.error("You can't use the target word in your clue!");
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

    // Generate AI guess
    setTimeout(() => {
      const aiGuess = generateAIGuess(currentWord, newClues);
      const isCorrect = aiGuess.toLowerCase() === currentWord.toLowerCase();

      const guessMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'guess',
        text: aiGuess,
        isCorrect,
      };
      setMessages((prev) => [...prev, guessMessage]);

      if (isCorrect) {
        handleRoundEnd(true);
      }
    }, 1200);
  };

  const handleRoundEnd = (aiGuessed: boolean) => {
    setIsRoundActive(false);

    if (aiGuessed) {
      console.error(`${gameData.character} guessed "${currentWord}"! No point this round.`);
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
      onEndGame();
    } else {
      setGameData({ ...gameData, round: gameData.round + 1 });
    }
  };

  const timePercentage = (timeLeft / 60) * 100;

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
            <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              Listening...
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

        {/* Recording Controls */}
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                {isRecording ? 'Recording your clue...' : 'Press and hold to give a voice clue'}
              </p>
              
              <button
                className={`w-24 h-24 rounded-full text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onMouseDown={handleStartRecording}
                onMouseUp={handleStopRecording}
                onTouchStart={handleStartRecording}
                onTouchEnd={handleStopRecording}
                disabled={!isRoundActive}
              >
                {isRecording ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {recordingText && (
                <div className="text-gray-500 dark:text-gray-400 text-center text-sm">
                  Last clue: "{recordingText}"
                </div>
              )}

              <p className="text-gray-400 dark:text-gray-500 text-center text-xs">
                Simulated voice recording - In production, this would use Web Speech API
              </p>
            </div>
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
