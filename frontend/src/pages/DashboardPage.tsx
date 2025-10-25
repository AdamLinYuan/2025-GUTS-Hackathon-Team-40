import { Link } from 'react-router-dom';
import '../index.css';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const DashboardPage = () => {
  const authContext = useAuth();
  const [userprofile, setUserProfile] = useState({ rounds_played: 0, rounds_won: 0 });

  // ...existing code...
  useEffect(() => {
    console.log('DashboardPage useEffect start, user object:', authContext);

    const fetchUserProfile = async () => {

      console.log('resolved token:', authContext.token);

      if (!authContext.token) {
        console.log('No token available, skipping fetch');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/user-profile/', {
          headers: {
            'Authorization': `Token ${authContext.token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('fetch finished, status=', response.status, 'ok=', response.ok);
        if (!response.ok) {
          const text = await response.text();
          console.error('profile fetch error body:', text);
          return;
        }
        const data = await response.json();
        console.log('Fetched user profile:', data);
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [authContext]); // depend on token fields, not whole object
  // ...existing code...

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto p-4">
      {/* Welcome Section */}
      <section className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome back, {authContext.user?.username}! 👋
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Ready to test your skills? Give clues and see if the AI can guess your word!
        </p>
      </section>

      {/* Quick Stats */}
      <section className="my-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rounds Played</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2"> {userprofile.rounds_played}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rounds Won</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{userprofile.rounds_won}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Win/Loss Ratio</p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-2">
                  {userprofile.rounds_played > 0 
                    ? `${((userprofile.rounds_won / userprofile.rounds_played) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="my-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Choose Your Category</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select a category to start playing. Give clues to describe your word and see if the AI can guess it!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/subcategories?category=sports" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚽</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Sports</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Describe teams, players, famous athletes, and iconic sports moments.
            </p>
          </Link>

          <Link to="/subcategories?category=politics" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏛️</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Politics</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Give clues about world leaders, governments, and political systems.
            </p>
          </Link>

          <Link to="/subcategories?category=computer-science" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-indigo-100 dark:bg-indigo-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💻</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Computer Science</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Describe programming languages, algorithms, and technology concepts.
            </p>
          </Link>

          <Link to="/subcategories?category=geography" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Geography</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Describe countries, cities, landmarks, and geographical features.
            </p>
          </Link>

          <Link to="/subcategories?category=history" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-yellow-100 dark:bg-yellow-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">History</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Give clues about historical events, famous figures, and time periods.
            </p>
          </Link>

          <Link to="/subcategories?category=custom" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg hover:scale-105 transform">
            <div className="bg-pink-100 dark:bg-pink-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Custom</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Create your own word lists and customize your game experience.
            </p>
          </Link>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="my-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">🎯 How to Play</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Choose a Category</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Select from Sports, Politics, Computer Science, Geography, History, or Custom topics.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Give Clues</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                You'll get a word to describe. Type clues without saying the word itself!
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">AI Guesses</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The Gemini AI will try to guess your word. Beat the timer to win!
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};

export default DashboardPage;
