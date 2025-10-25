import { Link } from 'react-router-dom';
import '../index.css';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto p-4">
      {/* Welcome Section */}
      <section className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
        Welcome back, {user?.username}! 👋
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        Ready to continue playing AIticulate?
        </p>
      </section>

      {/* Quick Stats */}
      <section className="my-8">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
          <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Games Played</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">-</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
          <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tries Per Game</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">-</p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
          <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-2">
            {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-'}
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
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Game Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.12 2.59a1 1 0 00-1.24 0L12 3.35l-.88-.76a1 1 0 00-1.24 0L6 6.35V11a8 8 0 1012 0V6.35l-3.88-3.76z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Sports</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Test your knowledge on teams, players, scores, and famous moments across sports.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7M10 11h4" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Politics</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Practice questions on governments, policies, elections, and global political history.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-indigo-100 dark:bg-indigo-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Computer Science</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Challenge yourself with programming, algorithms, data structures, and tech concepts.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Geography</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Explore questions about countries, capitals, landmarks, and geographical features.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-yellow-100 dark:bg-yellow-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">History</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Dive into historical events, figures, dates, and civilizations from around the world.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 hover:shadow-lg">
            <div className="bg-pink-100 dark:bg-pink-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Custom</h4>
            <p className="text-gray-600 dark:text-gray-300">
              Create your own custom topics and personalize your AIticulate experience.
            </p>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};

export default DashboardPage;
