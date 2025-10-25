import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Create a context for dark mode
export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const Layout = ({ children, hideHeader = false }: LayoutProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Initialize dark mode from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if there's a saved preference in localStorage
    const savedTheme = localStorage.getItem('darkMode');
    // Return true if savedTheme is 'true', otherwise return false
    return savedTheme === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      // Save the new theme preference to localStorage
      const newMode = !prevMode;
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Apply dark mode class to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Check for system preference on first render
  useEffect(() => {
    // If no preference has been set, check system preference
    if (localStorage.getItem('darkMode') === null) {
      // Check if user prefers dark mode at OS level
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      localStorage.setItem('darkMode', String(prefersDark));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
        {!hideHeader && (
          <header className="sticky top-0 z-50 bg-blue-800 text-white p-4 shadow-md">
            <div className="container mx-auto">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">AI-ticulate</h1>
                
                {/* Authentication buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleDarkMode}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition flex items-center"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                        Light
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                        Dark
                      </>
                    )}
                  </button>
                  
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-blue-200">
                        {user?.username}
                      </span>
                      <button 
                        onClick={handleLogout}
                        className="text-sm bg-red-700 hover:bg-red-600 px-3 py-1 rounded transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link 
                        to="/login" 
                        className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition"
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/register" 
                        className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </header>
        )}
        <main className={!hideHeader ? "p-4" : ""}>{children}</main>
      </div>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default Layout;