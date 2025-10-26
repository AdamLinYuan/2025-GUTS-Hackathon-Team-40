import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const SubcategoriesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authContext = useAuth();
  const category = searchParams.get('category') || '';
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [isLoadingCustomTopics, setIsLoadingCustomTopics] = useState(false);

  // Fetch custom topics when category is 'custom'
  useEffect(() => {
    if (category === 'custom' && authContext.token) {
      setIsLoadingCustomTopics(true);
      fetch('http://localhost:8000/api/custom-topic-list/', {
        headers: {
          'Authorization': `Token ${authContext.token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.topics && Array.isArray(data.topics)) {
            // Format topic names for display (replace underscores with spaces, capitalize)
            const formattedTopics = data.topics.map((topic: string) => 
              topic.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            );
            setCustomTopics(formattedTopics);
          }
        })
        .catch(error => {
          console.error('Error fetching custom topics:', error);
        })
        .finally(() => {
          setIsLoadingCustomTopics(false);
        });
    }
  }, [category, authContext.token]);

  const categoryData: Record<string, { name: string; icon: string; color: string; subcategories: string[] }> = {
    'sports': {
      name: 'Sports',
      icon: '⚽',
      color: 'blue',
      subcategories: ['NBA', 'NFL', 'Football', 'Tennis', 'Baseball', 'Hockey', 'Golf', 'Olympics']
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
      subcategories: customTopics.length > 0 
        ? customTopics 
        : []
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
    
    // Handle Random Mode
    if (category === 'custom' && subcategory === 'Random Mode') {
      try {
        // Fetch all available topics
        const response = await fetch('http://localhost:8000/api/all-topics-list/', {
          headers: {
            'Authorization': `Token ${authContext.token}`
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch topics:', response.statusText);
          return;
        }
        
        const data = await response.json();
        
        if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
          // Pick a random topic
          const randomTopic = data.topics[Math.floor(Math.random() * data.topics.length)];
          console.log(`Random topic selected: ${randomTopic}`);
          
          // Start the game with the random topic
          const chatResponse = await fetch(`http://localhost:8000/api/chat-stream/${randomTopic}/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${authContext.token}`
            },
            body: JSON.stringify({ prompt: `Starting game with random topic: ${randomTopic}` })
          });
          
          if (!chatResponse.ok) {
            console.error('Failed to set topic:', chatResponse.statusText);
          }
          
          // Navigate to game with the random topic
          // Format the topic name for display
          const displayName = randomTopic.split('_').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          navigate(`/game?category=random&subcategory=${encodeURIComponent(displayName)}`);
        } else {
          console.error('No topics available for random mode');
        }
      } catch (error) {
        console.error('Error in random mode:', error);
      }
      return;
    }
    
    const topicName = subcategory.toLowerCase().replace(/ /g, '_');
    try {
      // POST to backend with topic_name in URL
      const response = await fetch(`http://localhost:8000/api/chat-stream/${topicName}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authContext.token}`
        },
        body: JSON.stringify({ prompt: `Starting game with topic: ${subcategory}` })
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
          {isLoadingCustomTopics && category === 'custom' ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400"></div>
            </div>
          ) : category === 'custom' && currentCategory.subcategories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No custom word lists yet. Upload a PDF to get started!
              </p>
            </div>
          ) : (
            currentCategory.subcategories.map((subcategory) => (
              <button
                key={subcategory}
                onClick={() => handleSubcategoryClick(subcategory)}
                className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${colors.hover} transition-all duration-200 hover:shadow-lg hover:scale-105 transform border-2 ${colors.border}`}
              >
                <h3 className={`text-lg font-semibold text-center ${colors.text}`}>
                  {subcategory}
                </h3>
              </button>
            ))
          )}
        </div>

        {/* Action Buttons for Custom Category */}
        {category === 'custom' && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/upload-word-list')}
                className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${colors.hover} transition-all duration-200 hover:shadow-lg hover:scale-105 transform border-2 ${colors.border} flex flex-col items-center gap-2`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className={`text-lg font-semibold text-center ${colors.text}`}>
                  Upload Word List
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Upload a PDF to create a new word list
                </p>
              </button>

              <button
                onClick={() => handleSubcategoryClick('Random Mode')}
                className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${colors.hover} transition-all duration-200 hover:shadow-lg hover:scale-105 transform border-2 ${colors.border} flex flex-col items-center gap-2`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <h3 className={`text-lg font-semibold text-center ${colors.text}`}>
                  Random Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Play with random words from all lists
                </p>
              </button>

            </div>
          </div>
        )}

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
