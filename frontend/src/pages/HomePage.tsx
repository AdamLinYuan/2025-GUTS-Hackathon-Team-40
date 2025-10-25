import { Link } from 'react-router-dom';
import '../index.css';
import { useAuth } from '../context/AuthContext'; // Import the auth context

const HomePage = () => {
  const { isAuthenticated } = useAuth(); // Use the auth context

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto p-4">
        <section className="my-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Your App</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            This is your homepage. Use this as a base for routing and app navigation.
          </p>

          {/* Link to dashboard or sign in */}
          <div className="mt-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <span>Go to Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Sign in to access the full chatbot with conversation history.
                </p>
                <div className="flex space-x-4">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <span>Sign In</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>Register</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomePage;