import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { useAuth } from '../context/AuthContext';

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
  const authContext = useAuth();
  const [gameSessionId, setGameSessionId] = useState<string>('');
  const [currentWord, setCurrentWord] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRoundActive, setIsRoundActive] = useState(true);
  const [cluesGiven, setCluesGiven] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [currentScore, setCurrentScore] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize game session on first mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Start a new conversation (game session) via the chat-stream endpoint
        const response = await fetch('http://localhost:8000/api/chat-stream/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${authContext.token}`
          },
          body: JSON.stringify({
            conversation_id: null,
            prompt: `Starting game: ${gameData.category} - ${gameData.subcategory}, ${gameData.totalRounds} rounds`
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start game session');
        }

        // Read the stream to get conversation_id and initial word
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let conversationId = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const eventData = JSON.parse(line.substring(5));
                
                if (eventData.done && eventData.conversation_id) {
                  conversationId = eventData.conversation_id;
                  break;
                }
              } catch (e) {
                console.error('Error parsing event data:', e);
              }
            }
          }

          if (conversationId) break;
        }

        if (!conversationId) {
          throw new Error('Failed to get conversation ID');
        }

        // Fetch conversation details to get the current word
        const convResponse = await fetch(`http://localhost:8000/api/conversations/${conversationId}/`, {
          headers: {
            'Authorization': `Token ${authContext.token}`
          }
        });

        if (!convResponse.ok) {
          throw new Error('Failed to fetch conversation details');
        }

        const convData = await convResponse.json();
        
        setGameSessionId(conversationId);
        setCurrentWord(convData.current_word);
        setCurrentScore(convData.score || 0);
        
        console.log('Game session started:', {
          conversationId,
          currentWord: convData.current_word,
          score: convData.score,
          numRounds: convData.num_rounds
        });
        
      } catch (error) {
        console.error('Failed to start game session:', error);
        setError('Failed to connect to game server. Please try again or contact support.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, []); // Run once on mount

  // Initialize new round
  useEffect(() => {
    const initializeRound = async () => {
      if (!gameSessionId) return;

      setIsLoading(true);
      
      try {
        // Fetch current word from backend
        const response = await fetch(`http://localhost:8000/api/conversations/${gameSessionId}/`, {
          headers: {
            'Authorization': `Token ${authContext.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversation');
        }

        const convData = await response.json();
        setCurrentWord(convData.current_word);
        setCurrentScore(convData.score || 0);
        
        console.log(`Round ${gameData.round} initialized:`, {
          conversationId: gameSessionId,
          currentWord: convData.current_word,
          score: convData.score,
          numRounds: convData.num_rounds
        });
        
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
      } catch (error) {
        console.error('Failed to initialize round:', error);
        setCurrentWord('Error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRound();
  }, [gameData.round, gameData.subcategory, gameData.totalRounds, gameSessionId, authContext.token]);

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

    // Store the previous score to detect if AI guessed correctly
    const previousScore = currentScore;

    try {
      setIsStreaming(true);
      
      // Submit clue via the chat-stream endpoint
      const response = await fetch('http://localhost:8000/api/chat-stream/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authContext.token}`
        },
        body: JSON.stringify({
          conversation_id: gameSessionId,
          prompt: clue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit clue');
      }

      // Create a placeholder message for AI's response
      const aiMessageId = (Date.now() + 1).toString();
      let aiResponseText = '';

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          type: 'guess',
          text: '...',
          isCorrect: false,
        },
      ]);

      // Stream the AI response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const eventData = JSON.parse(line.substring(5));

              // Append the new chunk to our accumulated message
              if (eventData.chunk) {
                aiResponseText += eventData.chunk;
                
                // Update the bot message with the accumulated content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, text: aiResponseText }
                      : msg
                  )
                );
              }

              // If this is the last chunk, check if AI guessed correctly
              if (eventData.done) {
                // Fetch updated conversation to check score
                const convResponse = await fetch(`http://localhost:8000/api/conversations/${gameSessionId}/`, {
                  headers: {
                    'Authorization': `Token ${authContext.token}`
                  }
                });

                if (convResponse.ok) {
                  const convData = await convResponse.json();
                  const newScore = convData.score || 0;
                  const isCorrect = newScore > previousScore;

                  console.log('Score check:', { previousScore, newScore, isCorrect, currentWord, newWord: convData.current_word });

                  // Update the message with correctness
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, isCorrect }
                        : msg
                    )
                  );

                  // Update score and word if AI guessed correctly
                  if (isCorrect) {
                    // Store the word that was just guessed before updating to the new word
                    const guessedWord = currentWord;
                    
                    setCurrentScore(newScore);
                    setCurrentWord(convData.current_word);
                    
                    // Pass the guessed word to handleRoundEnd
                    handleRoundEnd(true, guessedWord);
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing event data:', e);
            }
          }
        }
      }
      
      setIsStreaming(false);
    } catch (error) {
      console.error('Failed to submit clue:', error);
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: '❌ Error communicating with AI. Please try again.',
        },
      ]);
    }
  };

  const handleRoundEnd = (aiGuessed: boolean, wordToShow?: string) => {
    setIsRoundActive(false);

    // Use the provided word or fall back to currentWord
    const displayWord = wordToShow || currentWord;

    const timeElapsed = Math.floor((Date.now() - roundStartTime) / 1000);
    console.log(`Round ended. Time elapsed: ${timeElapsed}s, AI guessed: ${aiGuessed}, Word: ${displayWord}, Session: ${gameSessionId}`);

    if (aiGuessed) {
      console.log(`${gameData.character} guessed "${displayWord}"! AI wins this round.`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: `${gameData.character} guessed correctly! The word was "${displayWord}".`,
        },
      ]);
    } else {
      console.log(`Time's up! AI didn't guess in time. The word was "${displayWord}".`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'system',
          text: `Time's up! The word was "${displayWord}". AI didn't guess in time!`,
        },
      ]);
    }
  };

  const handleNextRound = () => {
    if (gameData.round >= gameData.totalRounds) {
      // Complete the game - update gameData with final score from backend
      setGameData({ ...gameData, score: currentScore });
      console.log('Game completed!', { gameSessionId, finalScore: currentScore });
      onEndGame();
    } else {
      setGameData({ ...gameData, round: gameData.round + 1 });
    }
  };

  const timePercentage = (timeLeft / 60) * 100;

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="inline-block p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
                {currentScore}
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
