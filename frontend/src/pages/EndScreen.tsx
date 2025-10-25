import { Link } from 'react-router-dom';

interface EndScreenProps {
  score: number;
  totalRounds: number;
  onRestart: () => void;
}

export function EndScreen({ score, totalRounds, onRestart }: EndScreenProps) {
  const percentage = (score / totalRounds) * 100;
  
  let message = '';
  let emoji = '';
  
  if (percentage === 100) {
    message = 'Perfect Score! You stumped the AI every time!';
    emoji = '🎉';
  } else if (percentage >= 80) {
    message = 'Excellent! The AI struggled with your clues!';
    emoji = '🌟';
  } else if (percentage >= 60) {
    message = 'Great job! You won most rounds!';
    emoji = '👏';
  } else if (percentage >= 40) {
    message = 'Not bad! The AI is getting smarter!';
    emoji = '💪';
  } else {
    message = 'Good try! The AI was on fire today!';
    emoji = '🔥';
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Game Over!</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">{emoji} {message}</p>
          </div>

          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">Your Final Score</p>
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{score} / {totalRounds}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{percentage.toFixed(0)}% Win Rate</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onRestart} 
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Play Again
            </button>
            
            <Link 
              to="/dashboard"
              className="block w-full py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors text-center"
            >
              Back to Dashboard
            </Link>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Tips for Next Time:</h3>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1 text-sm list-disc list-inside">
                <li>Start with general clues, then get more specific</li>
                <li>Use synonyms and related concepts</li>
                <li>Describe what it looks like, sounds like, or is used for</li>
                <li>Avoid using parts of the word itself</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
