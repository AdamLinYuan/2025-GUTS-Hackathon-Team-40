import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GameScreen } from './GameScreen';
import { EndScreen } from './EndScreen';

type GameState = 'playing' | 'end';

interface GameData {
  category: string;
  subcategory: string;
  character: string;
  round: number;
  totalRounds: number;
  score: number;
}

const GamePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get('category') || '';
  const initialSubcategory = searchParams.get('subcategory') || '';

  // If no category/subcategory provided, redirect to dashboard
  useEffect(() => {
    if (!initialCategory || !initialSubcategory) {
      navigate('/dashboard');
    }
  }, [initialCategory, initialSubcategory, navigate]);

  const [gameState, setGameState] = useState<GameState>('playing');
  const [gameData, setGameData] = useState<GameData>({
    category: initialCategory,
    subcategory: initialSubcategory,
    character: 'Gemini AI',
    round: 1,
    totalRounds: 5,
    score: 0,
  });

  const handleEndGame = () => {
    setGameState('end');
  };

  const handleRestart = () => {
    // Reset game data to initial state and restart the game
    setGameData({
      category: initialCategory,
      subcategory: initialSubcategory,
      character: 'Gemini AI',
      round: 1,
      totalRounds: 5,
      score: 0,
    });
    setGameState('playing');
  };

  const handleBackFromGame = () => {
    navigate('/dashboard');
  };

  // Render appropriate screen based on game state
  switch (gameState) {
    case 'playing':
      return (
        <GameScreen
          gameData={gameData}
          setGameData={setGameData}
          onEndGame={handleEndGame}
          onBack={handleBackFromGame}
        />
      );

    case 'end':
      return (
        <EndScreen
          score={gameData.score}
          totalRounds={gameData.totalRounds}
          onRestart={handleRestart}
        />
      );

    default:
      return (
        <GameScreen
          gameData={gameData}
          setGameData={setGameData}
          onEndGame={handleEndGame}
          onBack={handleBackFromGame}
        />
      );
  }
};

export default GamePage;
