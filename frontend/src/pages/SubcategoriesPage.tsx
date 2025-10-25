import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubcategoriesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authContext = useAuth();
  const category = searchParams.get('category') || '';

  const categoryData: Record<string, { name: string; icon: string; color: string; subcategories: string[] }> = {
    'sports': {
      name: 'Sports',
      icon: '⚽',
      color: 'blue',
      subcategories: ['NBA', 'NFL', 'Soccer', 'Tennis', 'Baseball', 'Hockey', 'Golf', 'Olympics']
    },
    'politics': {
      name: 'Politics',
      icon: '🏛️',
      color: 'green',
      subcategories: ['US Politics', 'World Leaders', 'Elections', 'Democracy', 'International Relations', 'Political Theory']
    },
    'computer-science': {
      name: 'Computer Science',
      icon: '💻',
      color: 'indigo',
      subcategories: ['Programming Languages', 'Algorithms', 'Data Structures', 'Web Development', 'AI/ML', 'Databases', 'Operating Systems', 'Cybersecurity']
    },
    'geography': {
      name: 'Geography',
      icon: '🌍',
      color: 'purple',
      subcategories: ['Countries', 'Cities', 'Landmarks', 'Rivers & Mountains', 'Continents', 'Capitals', 'Islands', 'Natural Wonders']
    },
    'history': {
      name: 'History',
      icon: '📚',
      color: 'yellow',
      subcategories: ['Ancient History', 'World Wars', 'American History', 'European History', 'Famous Figures', 'Revolutions', 'Medieval Times', 'Modern History']
    },
    'custom': {
      name: 'Custom',
      icon: '✨',
      color: 'pink',
      subcategories: ['Create Your Own', 'Upload Word List', 'Mix Categories', 'Random Mode', 'Saved Lists']
    }
  };

  const currentCategory = categoryData[category];

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Category Not Found</h2>
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const colorClasses: Record<string, { bg: string; text: string; hover: string; border: string }> = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
      border: 'border-blue-300 dark:border-blue-700'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-200 dark:hover:bg-green-800',
      border: 'border-green-300 dark:border-green-700'
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900',
      text: 'text-indigo-600 dark:text-indigo-400',
      hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800',
      border: 'border-indigo-300 dark:border-indigo-700'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:bg-purple-200 dark:hover:bg-purple-800',
      border: 'border-purple-300 dark:border-purple-700'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-600 dark:text-yellow-400',
      hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
      border: 'border-yellow-300 dark:border-yellow-700'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900',
      text: 'text-pink-600 dark:text-pink-400',
      hover: 'hover:bg-pink-200 dark:hover:bg-pink-800',
      border: 'border-pink-300 dark:border-pink-700'
    }
  };

  const colors = colorClasses[currentCategory.color];

  const handleSubcategoryClick = async (subcategory: string) => {
    if (category === 'custom' && subcategory === 'Upload Word List') {
      navigate('/upload-word-list');
      return;
    }
    const topicName = subcategory.toLowerCase().replace(/ /g, '_');
    try {
      const response = await fetch('http://localhost:8000/api/set-topic/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authContext.token}`
        },
        body: JSON.stringify({ topic_name: topicName })
      });
      if (!response.ok) {
        console.error('Failed to set topic:', response.statusText);
      }
    } catch (error) {
      console.error('Error setting topic:', error);
    }
    navigate(`/game?category=${category}&subcategory=${encodeURIComponent(subcategory)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <main className="container mx-auto p-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className={`text-5xl ${colors.bg} p-4 rounded-2xl`}>
              {currentCategory.icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {currentCategory.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Choose a subcategory to start playing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentCategory.subcategories.map((subcategory) => (
            <button
              key={subcategory}
              onClick={() => handleSubcategoryClick(subcategory)}
              className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${colors.hover} transition-all duration-200 hover:shadow-lg hover:scale-105 transform border-2 ${colors.border}`}
            >
              <h3 className={`text-lg font-semibold text-center ${colors.text}`}>
                {subcategory}
              </h3>
            </button>
          ))}
        </div>

        <div className={`mt-8 p-6 ${colors.bg} rounded-lg border-2 ${colors.border}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            🎮 How It Works
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Select a subcategory above to start your game. You'll be given a word related to your chosen topic. 
            Give clues to describe the word without saying it, and see if the AI can guess what you're thinking of!
          </p>
        </div>
      </main>
    </div>
  );
};

export default SubcategoriesPage;
